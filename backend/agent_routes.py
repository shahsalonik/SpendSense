from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from agent import send_chat_message

router = APIRouter()


class ChatRequest(BaseModel):
    message: str
    assistant_id: str | None = None
    thread_id: str | None = None


class ChatResponse(BaseModel):
    reply: str
    assistant_id: str
    thread_id: str


@router.post("/api/chat", response_model=ChatResponse)
def chat(request: ChatRequest):
    try:
        return send_chat_message(
            message=request.message,
            thread_id=request.thread_id,
        )
    except Exception as e:
        print(f"Backboard error: {e}")
        raise HTTPException(
            status_code=502,
            detail="Unable to get a response from the AI assistant",
        )