from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import FileResponse
from uuid import UUID, uuid4
from datetime import datetime
from typing import List, Dict, Any

from src.dependencies.auth import get_current_user
from src.models.api.chats import (
    ChatCreateRequest, PromptRequest, 
    ClarificationAnswer
)
from src.models.schemas.chat import (
    ChatRead, ChatStatus
)
from src.routers.catalogs import get_catalog_service
from src.services.catalog_service import CatalogService
from src.controllers.chat_controller import ChatController

router = APIRouter()

# Mock storage for basic chat metadata
MOCK_CHATS = {}

def get_chat_controller(catalog_service: CatalogService = Depends(get_catalog_service)) -> ChatController:
    return ChatController(catalog_service)

@router.post("", response_model=ChatRead, status_code=status.HTTP_201_CREATED)
async def create_chat(request: ChatCreateRequest, user = Depends(get_current_user)):
    chat_id = uuid4()
    chat = ChatRead(
        id=chat_id,
        name=request.name or f"Chat {chat_id.hex[:8]}",
        status=ChatStatus.READY_FOR_PROMPT,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )
    MOCK_CHATS[chat_id] = chat
    return chat

@router.post("/{chat_id}/prompt")
async def submit_prompt(
    chat_id: UUID, 
    request: PromptRequest, 
    controller: ChatController = Depends(get_chat_controller),
    user = Depends(get_current_user)
):
    if chat_id not in MOCK_CHATS:
        # In a real app, we'd check DB. For now, let's allow "ghost" chats if ID is valid UUID
        pass
    
    try:
        return await controller.process_prompt(chat_id, request.prompt)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/{chat_id}/clarify")
async def submit_clarification(
    chat_id: UUID, 
    answer: ClarificationAnswer, 
    controller: ChatController = Depends(get_chat_controller),
    user = Depends(get_current_user)
):
    # Using custom_answer or first selected option as text clarification for now
    clarification_text = answer.custom_answer or (answer.selected_options[0] if answer.selected_options else "")
    if not clarification_text:
        raise HTTPException(status_code=400, detail="Clarification text is required")

    try:
        return await controller.process_clarification(chat_id, clarification_text)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{chat_id}/export/{export_id}")
async def export_chat_to_excel(
    chat_id: UUID,
    export_id: str,
    controller: ChatController = Depends(get_chat_controller),
    user = Depends(get_current_user)
):
    """
    Export the query result as a downloadable Excel file.
    Returns the cached file matching the export_id.
    """
    try:
        file_path = controller.excel_service.get_cached_file(export_id)
        if not file_path:
            raise ValueError("Export file not found or expired.")
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
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{chat_id}", response_model=ChatRead)
async def get_chat(chat_id: UUID, user = Depends(get_current_user)):
    if chat_id not in MOCK_CHATS:
        raise HTTPException(status_code=404, detail="Chat not found")
    return MOCK_CHATS[chat_id]

@router.delete("/{chat_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_chat(chat_id: UUID, user = Depends(get_current_user)):
    if chat_id not in MOCK_CHATS:
        raise HTTPException(status_code=404, detail="Chat not found")
    del MOCK_CHATS[chat_id]
    return None
