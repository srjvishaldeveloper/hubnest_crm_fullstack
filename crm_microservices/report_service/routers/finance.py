from fastapi import APIRouter, Query, Depends, Header, HTTPException
import os
from services import analytics

finance_router = APIRouter(prefix="/reports/finance")

def check_secret(x_backend_secret: str = Header(None)):
    secret = os.getenv("NODE_BACKEND_SECRET", "shared_secret_key")
    if secret and x_backend_secret != secret:
        raise HTTPException(status_code=403, detail="Access denied: Invalid backend secret token")

@finance_router.get("/revenue")
async def get_revenue(tenant_id: str = Query(...), date_from: str = None, date_to: str = None, _ = Depends(check_secret)):
    trend = await analytics.get_revenue_trend(tenant_id, date_from, date_to)
    total_rev = sum(t["revenue"] for t in trend)
    return {
        "gross_revenue": total_rev,
        "revenue_growth_pct": 22.0,
        "net_margin_pct": 97.2,
        "gateway_charges": 1240.0,
        "arr_growth": 48250.0,
        "trend": trend
    }

@finance_router.get("/payments")
async def get_payments(tenant_id: str = Query(...), date_from: str = None, date_to: str = None, _ = Depends(check_secret)):
    return [
        {"id": "pay_001", "customer": "Mumbai Indians Corp", "amount": 15000.0, "status": "Success", "date": "2026-06-02"},
        {"id": "pay_002", "customer": "Ahmedabad Textiles", "amount": 25000.0, "status": "Success", "date": "2026-06-03"},
        {"id": "pay_003", "customer": "Delhi Logistics", "amount": 8250.0, "status": "Success", "date": "2026-06-04"}
    ]

@finance_router.get("/invoices")
async def get_invoices(tenant_id: str = Query(...), date_from: str = None, date_to: str = None, _ = Depends(check_secret)):
    return [
        {"id": "INV-2026-001", "customer": "Mumbai Indians Corp", "amount": 15000.0, "status": "Paid", "date": "2026-06-02"},
        {"id": "INV-2026-002", "customer": "Ahmedabad Textiles", "amount": 25000.0, "status": "Paid", "date": "2026-06-03"},
        {"id": "INV-2026-003", "customer": "Delhi Logistics", "amount": 8250.0, "status": "Pending", "date": "2026-06-04"}
    ]
