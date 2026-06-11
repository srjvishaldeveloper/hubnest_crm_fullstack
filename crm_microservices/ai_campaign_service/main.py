import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn

app = FastAPI(title="AI Campaign Service", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class CampaignRequest(BaseModel):
    goal: str
    target_audience: str
    budget: float

@app.post("/campaign-suggestions")
async def campaign_suggestions(req: CampaignRequest):
    return {
        "success": True,
        "recommended_channels": ["Email", "WhatsApp"] if "b2b" in req.target_audience.lower() else ["Meta Messenger", "Instagram"],
        "recommended_daily_budget": round(req.budget / 30, 2),
        "optimized_audience_targeting": {
            "locations": ["Delhi", "Mumbai", "Bangalore"],
            "interests": ["Coding", "Software Engineering", "Tech Clubs"],
            "age_range": "18-35"
        },
        "copywriting_hook": f"Unlock your potential with our {req.goal} program. Sign up today!",
        "best_times_to_send": ["Tuesday 10:00 AM", "Thursday 2:00 PM"]
    }

@app.get("/health")
async def health():
    return {"status": "ok"}

if __name__ == "__main__":
    port = int(os.getenv("PORT", 8006))
    uvicorn.run(app, host="0.0.0.0", port=port)
