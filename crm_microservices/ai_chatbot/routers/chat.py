import os
from fastapi import APIRouter, HTTPException, Header
from models.schemas import ChatRequest, ChatResponse
from services.groq_service import get_chat_response, GROQ_MODEL

chat_router = APIRouter()

def check_secret(x_backend_secret: str = Header(None)):
    secret = os.getenv("NODE_BACKEND_SECRET", "shared_secret_key")
    if secret and x_backend_secret != secret:
        raise HTTPException(status_code=403, detail="Access denied: Invalid backend secret token")

@chat_router.post("/chat", response_model=ChatResponse)
async def chat_endpoint(request: ChatRequest, x_backend_secret: str = Header(None)):
    check_secret(x_backend_secret)
    
    if not request.messages:
        raise HTTPException(status_code=422, detail="Messages list cannot be empty")
        
    reply, tokens = get_chat_response(request.messages, request.user_role)
    return ChatResponse(reply=reply, tokens_used=tokens)

@chat_router.post("/chat/reset")
async def reset_chat_endpoint(x_backend_secret: str = Header(None)):
    check_secret(x_backend_secret)
    # The frontend maintains chat history in local state, so resetting on server is stateless.
    return {"status": "cleared"}

@chat_router.get("/health")
async def health_endpoint():
    return {
        "status": "ok",
        "model": GROQ_MODEL
    }
