import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn

app = FastAPI(title="AI Analytics Service", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class AnalyticsRequest(BaseModel):
    campaign_id: str = ""
    impressions: int = 0
    clicks: int = 0
    leads: int = 0
    cost: float = 0.0
    revenue: float = 0.0

@app.post("/analyze")
async def analyze(req: AnalyticsRequest):
    # Perform standard marketing math
    ctr = (req.clicks / req.impressions * 100) if req.impressions > 0 else 0.0
    conv_rate = (req.leads / req.clicks * 100) if req.clicks > 0 else 0.0
    cpl = (req.cost / req.leads) if req.leads > 0 else 0.0
    roi = ((req.revenue - req.cost) / req.cost * 100) if req.cost > 0 else 0.0
    
    return {
        "success": True,
        "metrics": {
            "click_through_rate": round(ctr, 2),
            "conversion_rate": round(conv_rate, 2),
            "cost_per_lead": round(cpl, 2),
            "roi_percentage": round(roi, 2)
        },
        "predictions": {
            "best_send_time": "10:30 AM",
            "best_performing_audience": "Delhi Tech Professionals (25-34)",
            "next_best_action": "Increase budget by 15% on Tuesday morning to capture peak traffic.",
            "churn_risk_detected": True if conv_rate < 5.0 else False
        }
    }

@app.get("/health")
async def health():
    return {"status": "ok"}

if __name__ == "__main__":
    port = int(os.getenv("PORT", 8009))
    uvicorn.run(app, host="0.0.0.0", port=port)
