import asyncio

from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks, WebSocket, WebSocketDisconnect
from fastapi.responses import FileResponse
from src.services.auth import AuthService
from uuid import UUID, uuid4
from datetime import datetime
from typing import List, Dict, Any

from sqlalchemy.ext.asyncio import AsyncSession

from src.dependencies.auth import get_current_user, require_active_user
from src.database.session import get_db
from src.database.models.chat import Chat as ChatModel
from src.database.models.user import User
from src.models.api.chats import (
    ChatCreateRequest, PromptRequest,
    ClarificationAnswer, ChatUpdateRequest,
    CreateFolderRequest, UpdateFolderRequest, MoveToFolderRequest,
)
from src.models.schemas.chat import (
    ChatRead, ChatStatus, ChatListItem, ChatMessageRead,
    ChatFolderRead,
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
    user: User = Depends(require_active_user),
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
            folder_id=str(c.folder_id) if c.folder_id else None,
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
            export_filename=m.export_filename,
            created_at=m.created_at,
        )
        for m in messages
    ]


@router.websocket("/{chat_id}/ws")
async def chat_websocket(
    websocket: WebSocket,
    chat_id: UUID,
    db: AsyncSession = Depends(get_db),
    catalog_service: CatalogService = Depends(get_catalog_service)
):
    await websocket.accept()
    
    token = websocket.cookies.get("access_token")
    if not token:
        await websocket.close(code=1008, reason="Authentication required")
        return
        
    payload = AuthService.decode_token(token)
    if not payload or not payload.get("sub"):
        await websocket.close(code=1008, reason="Invalid token")
        return
        
    user_id = UUID(payload.get("sub"))
    
    chat = await ChatRepository.get_chat_by_id_and_user(db, chat_id, user_id)
    if not chat:
        await websocket.close(code=1008, reason="Chat not found")
        return

    from src.repositories.user_repo import UserRepository
    user_repo = UserRepository(db)
    user_obj = await user_repo.get_user_by_id(user_id)

    # Blocked users have read-only access: refuse the (mutating) prompt channel.
    if user_obj and getattr(user_obj, "is_blocked", False):
        try:
            await websocket.send_json({"type": "error", "message": "ACCOUNT_BLOCKED"})
        finally:
            await websocket.close(code=1008, reason="Account blocked")
        return

    user_language = user_obj.profile.language if user_obj and user_obj.profile else "ru"

    controller = ChatController(catalog_service, db)

    try:
        while True:
            data = await websocket.receive_text()
            import json
            request_data = json.loads(data)
            prompt = request_data.get("prompt")
            catalog_ids = request_data.get("catalog_ids")
            
            if catalog_ids is not None and chat.catalog_ids != catalog_ids:
                chat.catalog_ids = catalog_ids
                await ChatRepository.update_chat(db, chat)
            
            user_blocks = [{"type": "text", "text": prompt}]
            await ChatRepository.add_message(db, chat_id, "user", user_blocks)

            # Check message count to determine titling logic
            messages = await ChatRepository.get_messages(db, chat_id)
            user_msg_count = sum(1 for m in messages if m.role == "user")

            orch = await controller.get_orchestrator(chat_id, catalog_ids)
            
            async def send_status(state_val: str):
                # Mapping state_val to UI status
                state_map = {
                    "IDLE": "idle",
                    "CATALOG_CONNECTING": "ready_for_prompt",
                    "RELATIONSHIP_INFERRING": "ready_for_prompt",
                    "AWAITING_USER_QUERY": "ready_for_prompt",
                    "GENERATING_SQL": "processing",
                    "CLARIFICATION_REQUIRED": "awaiting_clarification",
                    "EXECUTING_SQL": "executing",
                    "FIXING_SQL": "fixing_sql",
                    "COMPLETED": "completed",
                    "FAILED": "error"
                }
                status_mapped = state_map.get(state_val, "processing")
                try:
                    await websocket.send_json({"type": "status", "status": status_mapped})
                except:
                    pass
                    
            orch.on_transition = send_status
            
            response = await controller.process_prompt(chat_id, prompt, catalog_ids, language=user_language)
            
            assistant_blocks = _response_to_blocks(response)
            export_url = response.get("export_url")
            export_filename = response.get("export_filename")
            total_tokens = response.get("result", {}).get("_usage", {}).get("total_tokens")
            await ChatRepository.add_message(db, chat_id, "assistant", assistant_blocks, export_url, export_filename, total_tokens)
            
            # --- START TITLE LOGIC ---
            if chat.title == "New Chat" and user_msg_count == 1:
                new_title = prompt[:30] + "..." if len(prompt) > 30 else prompt
                await ChatRepository.update_chat_title(db, chat_id, new_title)
                response["chat_title"] = new_title

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
                    
                    if response.get("message"):
                        history.append({"role": "assistant", "content": response["message"]})
                    elif response.get("question"):
                        history.append({"role": "assistant", "content": response["question"]})
                    
                    import asyncio
                    title_res = await asyncio.to_thread(orch.llm_service.generate_chat_title, history)
                    if "title" in title_res:
                        new_ai_title = title_res["title"][:100]
                        await ChatRepository.update_chat_title(db, chat_id, new_ai_title)
                        response["chat_title"] = new_ai_title
                except Exception as e:
                    import logging
                    logging.getLogger(__name__).warning(f"Failed to generate AI title: {e}")
            # --- END TITLE LOGIC ---
            
            # --- START TITLE LOGIC ---
            if chat.title == "New Chat" and user_msg_count == 1:
                new_title = prompt[:30] + "..." if len(prompt) > 30 else prompt
                await ChatRepository.update_chat_title(db, chat_id, new_title)
                response["chat_title"] = new_title

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
                    
                    if response.get("message"):
                        history.append({"role": "assistant", "content": response["message"]})
                    elif response.get("question"):
                        history.append({"role": "assistant", "content": response["question"]})
                    
                    import asyncio
                    title_res = await asyncio.to_thread(orch.llm_service.generate_chat_title, history)
                    if "title" in title_res:
                        new_ai_title = title_res["title"][:100]
                        await ChatRepository.update_chat_title(db, chat_id, new_ai_title)
                        response["chat_title"] = new_ai_title
                except Exception as e:
                    import logging
                    logging.getLogger(__name__).warning(f"Failed to generate AI title: {e}")
            # --- END TITLE LOGIC ---
            
            # --- START TITLE LOGIC ---
            if chat.title == "New Chat" and user_msg_count == 1:
                new_title = prompt[:30] + "..." if len(prompt) > 30 else prompt
                await ChatRepository.update_chat_title(db, chat_id, new_title)
                response["chat_title"] = new_title

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
                    
                    if response.get("message"):
                        history.append({"role": "assistant", "content": response["message"]})
                    elif response.get("question"):
                        history.append({"role": "assistant", "content": response["question"]})
                    
                    import asyncio
                    title_res = await asyncio.to_thread(orch.llm_service.generate_chat_title, history)
                    if "title" in title_res:
                        new_ai_title = title_res["title"][:100]
                        await ChatRepository.update_chat_title(db, chat_id, new_ai_title)
                        response["chat_title"] = new_ai_title
                except Exception as e:
                    import logging
                    logging.getLogger(__name__).warning(f"Failed to generate AI title: {e}")
            # --- END TITLE LOGIC ---
            
            from fastapi.encoders import jsonable_encoder
            await websocket.send_json({
                "type": "result",
                "response": jsonable_encoder(response)
            })
            
    except WebSocketDisconnect:
        pass
    except Exception as e:
        import logging
        logging.getLogger(__name__).error(f"WebSocket error: {e}")
        try:
            await websocket.send_json({"type": "error", "message": str(e)})
        except:
            pass



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
    user: User = Depends(require_active_user),
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
        user_language = user.profile.language if user and user.profile else "ru"
        response = await controller.process_prompt(chat_id, request.prompt, request.catalog_ids or None, language=user_language)
        
        # Save assistant response as message
        assistant_blocks = _response_to_blocks(response)
        export_url = response.get("export_url")
        export_filename = response.get("export_filename")
        total_tokens = response.get("result", {}).get("_usage", {}).get("total_tokens")
        await ChatRepository.add_message(db, chat_id, "assistant", assistant_blocks, export_url, export_filename, total_tokens)
        
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
    user: User = Depends(require_active_user),
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
        user_language = user.profile.language if user and user.profile else "ru"
        response = await controller.process_clarification(chat_id, clarification_text, language=user_language)
        
        # Save assistant response
        assistant_blocks = _response_to_blocks(response)
        export_url = response.get("export_url")
        export_filename = response.get("export_filename")
        total_tokens = response.get("result", {}).get("_usage", {}).get("total_tokens")
        await ChatRepository.add_message(db, chat_id, "assistant", assistant_blocks, export_url, export_filename, total_tokens)
        
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
        # Generate on the fly using DB streaming to avoid memory crash.
        # Run in a thread pool so the async event loop isn't blocked
        # while streaming 100k+ rows from Trino into the Excel file.
        orch = await controller.get_orchestrator(chat_id)
        loop = asyncio.get_running_loop()
        file_path = await loop.run_in_executor(
            None, controller.excel_service.generate_and_get_excel, export_id, orch.db_service
        )
        if not file_path:
            raise ValueError("Export file could not be generated.")
        
        # Read filename from metadata
        filename = f"export_{export_id[:8]}.xlsx"
        import json
        import os
        meta_path = os.path.join(os.environ.get("EXPORTS_DIR", "/app/exports"), f"{export_id}.meta.json")
        if os.path.exists(meta_path):
            try:
                with open(meta_path, "r", encoding="utf-8") as f:
                    meta = json.load(f)
                    filename = f"{meta.get('filename', f'export_{export_id[:8]}')}.xlsx"
            except Exception:
                pass
        
        return FileResponse(
            path=file_path,
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            filename=filename,
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
    user: User = Depends(require_active_user),
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
    user: User = Depends(require_active_user),
    db: AsyncSession = Depends(get_db),
):
    chat = await ChatRepository.get_chat_by_id_and_user(db, chat_id, user.id)
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found")
    await ChatRepository.delete_chat(db, chat)
    return None


# ── Folder endpoints ──────────────────────────────────────────────

@router.post("/folders", status_code=status.HTTP_201_CREATED)
async def create_folder(
    request: CreateFolderRequest,
    user: User = Depends(require_active_user),
    db: AsyncSession = Depends(get_db),
):
    folder = await ChatRepository.create_folder(db, user.id, request.name)
    return {
        "id": str(folder.id),
        "name": folder.name,
        "created_at": folder.created_at.isoformat() if folder.created_at else datetime.utcnow().isoformat(),
        "updated_at": folder.updated_at.isoformat() if folder.updated_at else datetime.utcnow().isoformat(),
    }


@router.get("/folders", response_model=List[ChatFolderRead])
async def list_folders(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get all folders for the current user with chat counts."""
    folders = await ChatRepository.get_user_folders(db, user.id)
    result = []
    for f in folders:
        count = await ChatRepository.count_chats_in_folder(db, f.id)
        result.append(ChatFolderRead(
            id=str(f.id),
            name=f.name,
            chat_count=count,
            created_at=f.created_at,
            updated_at=f.updated_at,
        ))
    return result


@router.patch("/folders/{folder_id}")
async def rename_folder(
    folder_id: UUID,
    request: UpdateFolderRequest,
    user: User = Depends(require_active_user),
    db: AsyncSession = Depends(get_db),
):
    folder = await ChatRepository.get_folder_by_id(db, folder_id, user.id)
    if not folder:
        raise HTTPException(status_code=404, detail="Folder not found")
    folder = await ChatRepository.update_folder(db, folder, request.name)
    return {"status": "success", "name": folder.name}


@router.delete("/folders/{folder_id}")
async def delete_folder(
    folder_id: UUID,
    delete_chats: bool = False,
    user: User = Depends(require_active_user),
    db: AsyncSession = Depends(get_db),
):
    folder = await ChatRepository.get_folder_by_id(db, folder_id, user.id)
    if not folder:
        raise HTTPException(status_code=404, detail="Folder not found")
    await ChatRepository.delete_folder(db, folder, delete_chats=delete_chats)
    return {"status": "success"}


@router.post("/{chat_id}/folder")
async def move_chat_to_folder(
    chat_id: UUID,
    request: MoveToFolderRequest,
    user: User = Depends(require_active_user),
    db: AsyncSession = Depends(get_db),
):
    chat = await ChatRepository.get_chat_by_id_and_user(db, chat_id, user.id)
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found")

    if request.folder_id:
        folder = await ChatRepository.get_folder_by_id(db, UUID(request.folder_id), user.id)
        if not folder:
            raise HTTPException(status_code=404, detail="Folder not found")
        await ChatRepository.move_chat_to_folder(db, chat, folder.id)
    else:
        await ChatRepository.remove_chat_from_folder(db, chat)

    return {"status": "success"}


@router.delete("/{chat_id}/folder")
async def remove_chat_from_folder(
    chat_id: UUID,
    user: User = Depends(require_active_user),
    db: AsyncSession = Depends(get_db),
):
    chat = await ChatRepository.get_chat_by_id_and_user(db, chat_id, user.id)
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found")
    await ChatRepository.remove_chat_from_folder(db, chat)
    return {"status": "success"}


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
        
        if "data" in r and "headers" in r:
            blocks.append({
                "type": "table",
                "headers": r["headers"],
                "rows": r["data"],
                "sql": r.get("sql"),
                "totalRows": r.get("total_rows"),
                "explanation": r.get("explanation"),
            })
            # Add chart block if chart spec is provided
            chart = r.get("chart")
            if chart and isinstance(chart, dict):
                blocks.append({
                    "type": "chart",
                    "chartType": chart.get("type", "bar"),
                    "title": chart.get("title"),
                    "xColumn": chart.get("x_column"),
                    "yColumns": chart.get("y_columns"),
                    "categoryColumn": chart.get("category_column"),
                    "valueColumn": chart.get("value_column"),
                    "stacked": chart.get("stacked"),
                    "data": r["data"],
                    "headers": r["headers"],
                })
        if not r.get("explanation") and "data" not in r:
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
