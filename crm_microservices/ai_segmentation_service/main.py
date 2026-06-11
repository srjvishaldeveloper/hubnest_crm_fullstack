import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn

app = FastAPI(title="AI Segmentation Service", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class SegmentPromptRequest(BaseModel):
    prompt: str

@app.post("/generate-segment")
async def generate_segment(req: SegmentPromptRequest):
    prompt = req.prompt.lower()
    
    # Parse conditions based on heuristics
    conditions = []
    
    # Location
    if "delhi" in prompt:
        conditions.append({"field": "city", "op": "eq", "value": "Delhi"})
    elif "mumbai" in prompt:
        conditions.append({"field": "city", "op": "eq", "value": "Mumbai"})
        
    # Email Opens
    if "opened" in prompt or "email" in prompt:
        days = 30
        if "30" in prompt:
            days = 30
        elif "7" in prompt:
            days = 7
        conditions.append({"field": "last_email_open_days", "op": "lte", "value": days})

    # Demo
    if "demo" in prompt:
        if "never" in prompt or "not" in prompt or "no" in prompt:
            conditions.append({"field": "demo_booked", "op": "eq", "value": False})
        else:
            conditions.append({"field": "demo_booked", "op": "eq", "value": True})

    # Default if nothing matched
    if not conditions:
        conditions.append({"field": "status", "op": "eq", "value": "New"})

    return {
        "success": True,
        "prompt": req.prompt,
        "segment": {
            "name": f"AI Segment - {req.prompt[:30]}...",
            "criteria": {
                "logical_operator": "AND",
                "rules": conditions
            }
        }
    }

@app.get("/health")
async def health():
    return {"status": "ok"}

if __name__ == "__main__":
    port = int(os.getenv("PORT", 8008))
    uvicorn.run(app, host="0.0.0.0", port=port)
