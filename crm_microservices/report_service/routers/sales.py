from fastapi import APIRouter, Query, Depends, Header, HTTPException
import os
from services import analytics

sales_router = APIRouter(prefix="/reports/sales")

def check_secret(x_backend_secret: str = Header(None)):
    secret = os.getenv("NODE_BACKEND_SECRET", "shared_secret_key")
    if secret and x_backend_secret != secret:
        raise HTTPException(status_code=403, detail="Access denied: Invalid backend secret token")

@sales_router.get("/kpis")
async def get_kpis(tenant_id: str = Query(...), date_from: str = None, date_to: str = None, _ = Depends(check_secret)):
    return await analytics.get_sales_kpis(tenant_id, date_from, date_to)

@sales_router.get("/revenue-trend")
async def get_revenue_trend(tenant_id: str = Query(...), date_from: str = None, date_to: str = None, _ = Depends(check_secret)):
    return await analytics.get_revenue_trend(tenant_id, date_from, date_to)

@sales_router.get("/pipeline")
async def get_pipeline(tenant_id: str = Query(...), date_from: str = None, date_to: str = None, _ = Depends(check_secret)):
    return await analytics.get_pipeline_stages(tenant_id, date_from, date_to)

@sales_router.get("/team-performance")
async def get_team_performance(tenant_id: str = Query(...), date_from: str = None, date_to: str = None, _ = Depends(check_secret)):
    return await analytics.get_team_performance(tenant_id, date_from, date_to)

@sales_router.get("/top-performers")
async def get_top_performers(tenant_id: str = Query(...), date_from: str = None, date_to: str = None, _ = Depends(check_secret)):
    return await analytics.get_top_performers(tenant_id, date_from, date_to)
