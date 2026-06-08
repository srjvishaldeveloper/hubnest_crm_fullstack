from fastapi import APIRouter, Query, Depends, Header, HTTPException
import os
from services import analytics

support_router = APIRouter(prefix="/reports/support")

def check_secret(x_backend_secret: str = Header(None)):
    secret = os.getenv("NODE_BACKEND_SECRET", "shared_secret_key")
    if secret and x_backend_secret != secret:
        raise HTTPException(status_code=403, detail="Access denied: Invalid backend secret token")

@support_router.get("/tickets")
async def get_tickets(tenant_id: str = Query(...), date_from: str = None, date_to: str = None, _ = Depends(check_secret)):
    return await analytics.get_ticket_stats(tenant_id, date_from, date_to)

@support_router.get("/sla")
async def get_sla(tenant_id: str = Query(...), date_from: str = None, date_to: str = None, _ = Depends(check_secret)):
    stats = await analytics.get_ticket_stats(tenant_id, date_from, date_to)
    return {"sla_rate": stats["sla_rate"]}

@support_router.get("/agent-performance")
async def get_agent_performance(tenant_id: str = Query(...), date_from: str = None, date_to: str = None, _ = Depends(check_secret)):
    data = await analytics.get_top_performers(tenant_id, date_from, date_to)
    return [d for d in data if "Support" in d.get("role", "") or d.get("name") in ["Amit Patel", "Rohan Mehta"]]
