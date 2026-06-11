import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn

app = FastAPI(title="AI Lead Scoring Service", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class LeadScoringRequest(BaseModel):
    city: str = ""
    company_size: str = ""
    source: str = ""
    email_opens: int = 0
    email_clicks: int = 0
    form_submissions: int = 0

@app.post("/score-lead")
async def score_lead(req: LeadScoringRequest):
    # Standard logic scoring formula
    score = 40 # Base score
    
    # Behavior points
    score += req.email_opens * 5
    score += req.email_clicks * 10
    score += req.form_submissions * 20
    
    # Demographics points
    if req.city.lower() in ["delhi", "mumbai", "bangalore"]:
        score += 10
    if req.company_size in ["50-200", "200-1000", "1000+"]:
        score += 15
    if req.source.lower() in ["webinar", "direct", "referral"]:
        score += 10
        
    score = min(max(score, 0), 100) # Clip score between 0 and 100
    
    priority = "Cold"
    if score >= 80:
        priority = "Hot"
    elif score >= 50:
        priority = "Warm"
        
    conversion_prob = min(max(int(score * 0.9 + 5), 0), 99)

    return {
        "success": True,
        "score": score,
        "priority": priority,
        "conversion_probability": conversion_prob,
        "insights": [
            f"Email activity contributed {req.email_opens * 5 + req.email_clicks * 10} points.",
            f"Profile fit details (city/size) added {20 if score > 60 else 5} points.",
            f"Conversion probability is calculated at {conversion_prob}%."
        ]
    }

@app.get("/health")
async def health():
    return {"status": "ok"}

if __name__ == "__main__":
    port = int(os.getenv("PORT", 8010))
    uvicorn.run(app, host="0.0.0.0", port=port)
