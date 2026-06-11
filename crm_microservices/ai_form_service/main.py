import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn
import json

app = FastAPI(title="AI Form Service", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class FormPromptRequest(BaseModel):
    prompt: str

@app.post("/generate-form")
async def generate_form(req: FormPromptRequest):
    prompt = req.prompt.lower()
    
    # Advanced Heuristic Generator representing a fallback AI model
    if "student" in prompt or "coding" in prompt:
        fields = [
            {"id": "name", "label": "Student Full Name", "type": "text", "required": True, "placeholder": "John Doe"},
            {"id": "email", "label": "Email Address", "type": "email", "required": True, "placeholder": "john@university.edu"},
            {"id": "phone", "label": "Phone Number", "type": "tel", "required": True, "placeholder": "+91 99999 99999"},
            {"id": "github", "label": "GitHub Handle", "type": "text", "required": False, "placeholder": "github.com/username"},
            {"id": "experience", "label": "Prior Programming Experience", "type": "select", "required": True, "options": ["No experience", "Under 1 year", "1-3 years", "3+ years"]},
            {"id": "interests", "label": "Preferred Languages", "type": "checkbox", "options": ["JavaScript/TypeScript", "Python", "Rust", "Go"]}
        ]
        settings = {
            "title": "Coding Club Student Registration",
            "theme": "indigo-glass",
            "layout": "single-column",
            "submit_text": "Join Coding Club",
            "validation": {
                "email": "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$",
                "phone": "^\\+?[0-9\\s-]{10,15}$"
            }
        }
    elif "newsletter" in prompt or "subscribe" in prompt:
        fields = [
            {"id": "name", "label": "First Name", "type": "text", "required": False, "placeholder": "Jane"},
            {"id": "email", "label": "Email Address", "type": "email", "required": True, "placeholder": "jane@example.com"}
        ]
        settings = {
            "title": "Weekly Tech Newsletter Subscription",
            "theme": "emerald-glass",
            "layout": "single-column",
            "submit_text": "Subscribe Now",
            "validation": {
                "email": "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$"
            }
        }
    else:
        # Generic lead capture form fallback
        fields = [
            {"id": "name", "label": "Full Name", "type": "text", "required": True, "placeholder": "Your Name"},
            {"id": "email", "label": "Email Address", "type": "email", "required": True, "placeholder": "you@example.com"},
            {"id": "company", "label": "Company Name", "type": "text", "required": False, "placeholder": "Acme Corp"},
            {"id": "message", "label": "How can we help?", "type": "textarea", "required": False, "placeholder": "Describe your request..."}
        ]
        settings = {
            "title": "Contact Us & Lead Registration",
            "theme": "indigo-glass",
            "layout": "single-column",
            "submit_text": "Submit Details",
            "validation": {
                "email": "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$"
            }
        }

    return {
        "success": True,
        "prompt": req.prompt,
        "form": {
            "fields": fields,
            "settings": settings,
            "crm_mapping": {
                "name": "name",
                "email": "email",
                "phone": "phone",
                "company": "company"
            }
        }
    }

@app.get("/health")
async def health():
    return {"status": "ok"}

if __name__ == "__main__":
    port = int(os.getenv("PORT", 8004))
    uvicorn.run(app, host="0.0.0.0", port=port)
