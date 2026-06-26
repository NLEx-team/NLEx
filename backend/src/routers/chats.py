from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from fastapi.responses import FileResponse
from uuid import UUID, uuid4
from datetime import datetime
from typing import List, Dict, Any

from sqlalchemy.ext.asyncio import AsyncSession

from src.dependencies.auth import get_current_user
from src.database.session import get_db
from src.database.models.chat import Chat as ChatModel
from src.database.models.user import User
from src.models.api.chats import (
    ChatCreateRequest, PromptRequest, 
    ClarificationAnswer, ChatUpdateRequest
)
from src.models.schemas.chat import (
    ChatRead, ChatStatus, ChatListItem, ChatMessageRead
)
from src.repositories.chat_repo import ChatRepository
from src.routers.catalogs import get_catalog_service
from src.services.catalog_service import CatalogService
from src.controllers.chat_controller import ChatController

router = APIRouter()

def get_chat_controller(
    catalog_service: CatalogService = Depends(get_catalog_service),
    db: AsyncSession = Depends(get_db)
) -> ChatController:
    return ChatController(catalog_service, db)


@router.post("", status_code=status.HTTP_201_CREATED)
async def create_chat(
    request: ChatCreateRequest, 
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a new chat session for the current user."""
    title = request.name or "New Chat"
    chat = ChatModel(
        user_id=user.id,
        title=title,
        status="ready_for_prompt",
        catalog_ids=request.catalog_ids,
    )
    chat = await ChatRepository.create_chat(db, chat)
    return {
        "id": str(chat.id),
        "name": chat.title,
        "status": chat.status,
        "catalog_ids": chat.catalog_ids,
        "created_at": chat.created_at.isoformat() if chat.created_at else datetime.utcnow().isoformat(),
        "updated_at": chat.updated_at.isoformat() if chat.updated_at else datetime.utcnow().isoformat(),
    }


@router.get("", response_model=List[ChatListItem])
async def list_chats(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get all chats for the current user, ordered by most recently updated."""
    chats = await ChatRepository.get_user_chats(db, user.id)
    return [
        ChatListItem(
            id=str(c.id),
            title=c.title,
            catalog_ids=c.catalog_ids,
            updated_at=c.updated_at or c.created_at,
        )
        for c in chats
    ]


@router.get("/{chat_id}/messages", response_model=List[ChatMessageRead])
async def get_chat_messages(
    chat_id: UUID,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get all messages for a specific chat."""
    # Verify ownership
    chat = await ChatRepository.get_chat_by_id_and_user(db, chat_id, user.id)
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found")
    
    messages = await ChatRepository.get_messages(db, chat_id)
    return [
        ChatMessageRead(
            id=str(m.id),
            role=m.role,
            blocks=m.blocks,
            export_url=m.export_url,
            created_at=m.created_at,
        )
        for m in messages
    ]


@router.get("/{chat_id}/status")
async def get_chat_status(
    chat_id: UUID,
    controller: ChatController = Depends(get_chat_controller),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get the real-time orchestrator state of a processing chat."""
    # Verify ownership
    chat = await ChatRepository.get_chat_by_id_and_user(db, chat_id, user.id)
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found")
        
    status_str = controller.get_chat_status(chat_id)
    return {"status": status_str}

@router.post("/{chat_id}/prompt")
async def submit_prompt(
    chat_id: UUID, 
    request: PromptRequest, 
    controller: ChatController = Depends(get_chat_controller),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    # Verify ownership
    chat = await ChatRepository.get_chat_by_id_and_user(db, chat_id, user.id)
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found")

    if request.catalog_ids is not None and chat.catalog_ids != request.catalog_ids:
        chat.catalog_ids = request.catalog_ids
        await ChatRepository.update_chat(db, chat)
    
    # Save user message
    user_blocks = [{"type": "text", "text": request.prompt}]
    await ChatRepository.add_message(db, chat_id, "user", user_blocks)
    
    # Check message count to determine titling logic
    messages = await ChatRepository.get_messages(db, chat_id)
    user_msg_count = sum(1 for m in messages if m.role == "user")
    
    # For the first message, we do a quick temporary title
    if chat.title == "New Chat" and user_msg_count == 1:
        new_title = request.prompt[:30] + "..." if len(request.prompt) > 30 else request.prompt
        await ChatRepository.update_chat_title(db, chat_id, new_title)
    
    try:
        response = await controller.process_prompt(chat_id, request.prompt, request.catalog_ids or None)
        
        # Save assistant response as message
        assistant_blocks = _response_to_blocks(response)
        export_url = response.get("export_url")
        total_tokens = response.get("result", {}).get("_usage", {}).get("total_tokens")
        await ChatRepository.add_message(db, chat_id, "assistant", assistant_blocks, export_url, total_tokens)
        
        # For the second user message, we generate a smart title using AI
        if user_msg_count == 2:
            try:
                history = []
                for msg in messages:
                    text = ""
                    for block in msg.blocks:
                        if block.get("type") == "text":
                            text += block.get("text", "")
                    if text:
                        history.append({"role": msg.role, "content": text})
                
                # Include the assistant's new response in the history for better context
                if response.get("message"):
                    history.append({"role": "assistant", "content": response["message"]})
                elif response.get("question"):
                    history.append({"role": "assistant", "content": response["question"]})
                
                orch = await controller.get_orchestrator(chat_id, request.catalog_ids or None)
                import asyncio
                title_res = await asyncio.to_thread(orch.llm_service.generate_chat_title, history)
                if "title" in title_res:
                    new_ai_title = title_res["title"][:100]
                    await ChatRepository.update_chat_title(db, chat_id, new_ai_title)
                    response["chat_title"] = new_ai_title
            except Exception as e:
                import logging
                logging.getLogger(__name__).warning(f"Failed to generate AI title: {e}")

        return response
    except Exception as e:
        # Save error as message too
        error_blocks = [{"type": "error", "message": str(e)}]
        await ChatRepository.add_message(db, chat_id, "assistant", error_blocks)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{chat_id}/clarify")
async def submit_clarification(
    chat_id: UUID, 
    answer: ClarificationAnswer, 
    controller: ChatController = Depends(get_chat_controller),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    # Verify ownership
    chat = await ChatRepository.get_chat_by_id_and_user(db, chat_id, user.id)
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found")

    # Using custom_answer or first selected option as text clarification for now
    clarification_text = answer.custom_answer or (answer.selected_options[0] if answer.selected_options else "")
    if not clarification_text:
        raise HTTPException(status_code=400, detail="Clarification text is required")

    try:
        response = await controller.process_clarification(chat_id, clarification_text)
        
        # Save assistant response
        assistant_blocks = _response_to_blocks(response)
        export_url = response.get("export_url")
        total_tokens = response.get("result", {}).get("_usage", {}).get("total_tokens")
        await ChatRepository.add_message(db, chat_id, "assistant", assistant_blocks, export_url, total_tokens)
        
        return response
    except Exception as e:
        error_blocks = [{"type": "error", "message": str(e)}]
        await ChatRepository.add_message(db, chat_id, "assistant", error_blocks)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{chat_id}/export/{export_id}")
async def export_chat_to_excel(
    chat_id: UUID,
    export_id: str,
    controller: ChatController = Depends(get_chat_controller),
    user: User = Depends(get_current_user),
):
    """
    Export the query result as a downloadable Excel file.
    Returns the cached file matching the export_id.
    """
    try:
        # Generate on the fly using DB streaming to avoid memory crash
        orch = await controller.get_orchestrator(chat_id)
        file_path = controller.excel_service.generate_and_get_excel(export_id, orch.db_service)
        if not file_path:
            raise ValueError("Export file could not be generated.")
        return FileResponse(
            path=file_path,
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            filename=f"export_{export_id[:8]}.xlsx",
            headers={
                "Access-Control-Expose-Headers": "Content-Disposition",
            },
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.patch("/{chat_id}", status_code=status.HTTP_200_OK)
async def update_chat(
    chat_id: UUID,
    request: ChatUpdateRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update chat title."""
    chat = await ChatRepository.get_chat_by_id_and_user(db, chat_id, user.id)
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found")
    
    await ChatRepository.update_chat_title(db, chat_id, request.name)
    return {"status": "success", "name": request.name}


@router.delete("/{chat_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_chat(
    chat_id: UUID, 
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    chat = await ChatRepository.get_chat_by_id_and_user(db, chat_id, user.id)
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found")
    await ChatRepository.delete_chat(db, chat)
    return None


def _response_to_blocks(response: dict) -> list:
    """Convert orchestrator response to storable content blocks."""
    r = response.get("result", {})
    blocks = []
    
    if r.get("status") == "clarification":
        blocks.append({
            "type": "options",
            "questionId": r.get("question_id", ""),
            "question": r.get("question", ""),
            "options": r.get("options", []),
        })
    elif r.get("status") == "success":
        if "explanation" in r and r["explanation"]:
            blocks.append({"type": "text", "text": r["explanation"]})
        
        if r.get("data") and r.get("headers"):
            blocks.append({
                "type": "table",
                "headers": r["headers"],
                "rows": r["data"],
                "sql": r.get("sql"),
                "totalRows": r.get("total_rows"),
                "explanation": r.get("explanation"),
            })
        if not r.get("explanation") and not r.get("data"):
            blocks.append({"type": "text", "text": "Request completed successfully."})
    elif r.get("status") == "error":
        blocks.append({
            "type": "error",
            "message": r.get("message", "An error occurred"),
            "sql": r.get("sql"),
        })
    
    # Fallback: if we got nothing recognizable, store the raw result as text
    if not blocks:
        blocks.append({"type": "text", "text": str(r)})
    
    return blocks
