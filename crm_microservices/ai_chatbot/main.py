import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import uvicorn

load_dotenv()

from routers.chat import chat_router

app = FastAPI(
    title="Job Nest CRM AI Chatbot",
    description="Microservice connecting Job Nest CRM with Groq AI API for role-based assistance",
    version="1.0.0"
)

# Configure CORS for Next.js frontend
frontend_url = os.getenv("FRONTEND_URL", "http://localhost:3000")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[frontend_url, "http://localhost:3000", "http://localhost:5000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routes
app.include_router(chat_router, prefix="/api")

if __name__ == "__main__":
    port = int(os.getenv("PORT", 8003))
    # Run uvicorn server
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
