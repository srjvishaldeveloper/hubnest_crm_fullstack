import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn

app = FastAPI(title="AI Content Service", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ContentRequest(BaseModel):
    topic: str
    channel: str # email, whatsapp, sms
    tone: str = "professional"

@app.post("/generate-content")
async def generate_content(req: ContentRequest):
    topic_clean = req.topic.capitalize()
    
    if req.channel == "email":
        subject = f"🚀 Special Update: {topic_clean} is here!"
        body = f"Hi {{first_name}},\n\nWe are excited to share details about {topic_clean}. We think you'll love it!\n\nClick here to learn more: {{cta_link}}\n\nBest,\nThe Team"
        cta = "Learn More Now"
    elif req.channel == "whatsapp":
        subject = "WhatsApp Notification"
        body = f"Hello *{{first_name}}*! 📱 We have a new update regarding *{topic_clean}*. Tap the link to view details: {{cta_link}}"
        cta = "View Details"
    else: # sms
        subject = "SMS Alert"
        body = f"Hi {{first_name}}, check out our update on {topic_clean}. Details at: {{cta_link}}"
        cta = "Link"
        
    return {
        "success": True,
        "subject_line": subject,
        "content_body": body,
        "cta_label": cta,
        "variations": [
            {"subject": f"🔥 Don't miss out on {topic_clean}!", "body": f"Limited time offer: {body}"},
            {"subject": f"Quick question about {topic_clean}", "body": f"Hey there, let's talk about {topic_clean}: {body}"}
        ]
    }

@app.get("/health")
async def health():
    return {"status": "ok"}

if __name__ == "__main__":
    port = int(os.getenv("PORT", 8007))
    uvicorn.run(app, host="0.0.0.0", port=port)
