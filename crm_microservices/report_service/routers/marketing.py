from fastapi import APIRouter, Query, Depends, Header, HTTPException
import os
from services import analytics

marketing_router = APIRouter(prefix="/reports/marketing")

def check_secret(x_backend_secret: str = Header(None)):
    secret = os.getenv("NODE_BACKEND_SECRET", "shared_secret_key")
    if secret and x_backend_secret != secret:
        raise HTTPException(status_code=403, detail="Access denied: Invalid backend secret token")

@marketing_router.get("/campaigns")
async def get_campaigns(tenant_id: str = Query(...), date_from: str = None, date_to: str = None, _ = Depends(check_secret)):
    return await analytics.get_campaign_analytics(tenant_id, date_from, date_to)

@marketing_router.get("/roi")
async def get_roi(tenant_id: str = Query(...), date_from: str = None, date_to: str = None, _ = Depends(check_secret)):
    data = await analytics.get_campaign_analytics(tenant_id, date_from, date_to)
    return [{"name": c["name"], "roi": c["roi"]} for c in data]

@marketing_router.get("/lead-sources")
async def get_lead_sources(tenant_id: str = Query(...), date_from: str = None, date_to: str = None, _ = Depends(check_secret)):
    return await analytics.get_leads_by_source(tenant_id, date_from, date_to)

@marketing_router.get("/funnel")
async def get_funnel(tenant_id: str = Query(...), date_from: str = None, date_to: str = None, _ = Depends(check_secret)):
    return await analytics.get_pipeline_stages(tenant_id, date_from, date_to)
