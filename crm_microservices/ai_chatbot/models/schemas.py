from pydantic import BaseModel
from typing import List

class Message(BaseModel):
    role: str       # "user" or "assistant"
    content: str

class ChatRequest(BaseModel):
    messages: List[Message]
    user_role: str  # "Admin"/"Sales Manager" etc
    context: str    # "crm"

class ChatResponse(BaseModel):
    reply: str
    tokens_used: int
