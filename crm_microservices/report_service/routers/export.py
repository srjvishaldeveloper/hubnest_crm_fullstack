from fastapi import APIRouter, Query, Depends, Header, HTTPException, Response
import os
import io
import pandas as pd
from services import analytics, chart_service, pdf_service, excel_service

export_router = APIRouter()

def check_secret(x_backend_secret: str = Header(None)):
    secret = os.getenv("NODE_BACKEND_SECRET", "shared_secret_key")
    if secret and x_backend_secret != secret:
        raise HTTPException(status_code=403, detail="Access denied: Invalid backend secret token")

# --- CHARTS ---
@export_router.get("/charts/revenue-trend")
async def chart_revenue_trend(tenant_id: str = Query(...), date_from: str = None, date_to: str = None, _ = Depends(check_secret)):
    data = await analytics.get_revenue_trend(tenant_id, date_from, date_to)
    return chart_service.generate_line_chart(data, "Revenue Trend (ARR)", "date", "revenue")

@export_router.get("/charts/pipeline-funnel")
async def chart_pipeline_funnel(tenant_id: str = Query(...), date_from: str = None, date_to: str = None, _ = Depends(check_secret)):
    data = await analytics.get_pipeline_stages(tenant_id, date_from, date_to)
    return chart_service.generate_funnel_chart(data)

@export_router.get("/charts/team-performance")
async def chart_team_performance(tenant_id: str = Query(...), date_from: str = None, date_to: str = None, _ = Depends(check_secret)):
    data = await analytics.get_team_performance(tenant_id, date_from, date_to)
    return chart_service.generate_bar_chart(data, "Team Revenue Performance", "name", "revenue")

@export_router.get("/charts/lead-sources")
async def chart_lead_sources(tenant_id: str = Query(...), date_from: str = None, date_to: str = None, _ = Depends(check_secret)):
    data = await analytics.get_leads_by_source(tenant_id, date_from, date_to)
    return chart_service.generate_pie_chart(data, "Leads by Source")

@export_router.get("/charts/campaign-roi")
async def chart_campaign_roi(tenant_id: str = Query(...), date_from: str = None, date_to: str = None, _ = Depends(check_secret)):
    data = await analytics.get_campaign_analytics(tenant_id, date_from, date_to)
    roi_data = {c["name"]: c["roi"] for c in data}
    return chart_service.generate_donut_chart(roi_data, "Campaign ROI (x)")


# --- EXPORTS ---
@export_router.get("/export/pdf")
async def export_pdf(type: str = Query("sales"), tenant_id: str = Query(...), date_from: str = None, date_to: str = None, _ = Depends(check_secret)):
    charts = []
    if type == "sales":
        kpis = await analytics.get_sales_kpis(tenant_id, date_from, date_to)
        table = await analytics.get_team_performance(tenant_id, date_from, date_to)
        
        trend = await analytics.get_revenue_trend(tenant_id, date_from, date_to)
        revenue_chart = chart_service.generate_line_chart(trend, "Revenue Trend", "date", "revenue")
        charts.append(revenue_chart["chart_base64"])
        
        pdf_title = "Sales Performance Report"
        pdf_data = {
            "kpis": kpis,
            "table_data": table
        }
    elif type == "marketing":
        kpis = {
            "Total Spends": 8240.0,
            "Total Leads Generated": 840,
            "Average CPL": 9.8
        }
        table = await analytics.get_campaign_analytics(tenant_id, date_from, date_to)
        sources = await analytics.get_leads_by_source(tenant_id, date_from, date_to)
        sources_chart = chart_service.generate_pie_chart(sources, "Leads by Source")
        charts.append(sources_chart["chart_base64"])
        
        pdf_title = "Marketing Campaign Report"
        pdf_data = {
            "kpis": kpis,
            "table_data": table
        }
    else:
        kpis = await analytics.get_ticket_stats(tenant_id, date_from, date_to)
        table = await analytics.get_top_performers(tenant_id, date_from, date_to)
        pdf_title = f"{type.title()} Report"
        pdf_data = {
            "kpis": kpis,
            "table_data": table
        }
        
    pdf_bytes = pdf_service.generate_pdf_report(pdf_title, pdf_data, charts)
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={type}_executive_report.pdf"}
    )

@export_router.get("/export/excel")
async def export_excel(type: str = Query("sales"), tenant_id: str = Query(...), date_from: str = None, date_to: str = None, _ = Depends(check_secret)):
    if type == "sales":
        kpis = await analytics.get_sales_kpis(tenant_id, date_from, date_to)
        table = await analytics.get_team_performance(tenant_id, date_from, date_to)
        excel_title = "Sales Analytics Summary"
    elif type == "marketing":
        kpis = {"Total Spends": 8240.0, "Total Leads": 840, "Average CPL": 9.8}
        table = await analytics.get_campaign_analytics(tenant_id, date_from, date_to)
        excel_title = "Marketing Analytics Summary"
    else:
        kpis = await analytics.get_ticket_stats(tenant_id, date_from, date_to)
        table = await analytics.get_top_performers(tenant_id, date_from, date_to)
        excel_title = f"{type.title()} Summary"
        
    excel_data = {
        "kpis": kpis,
        "table_data": table
    }
    
    excel_bytes = excel_service.generate_excel_report(excel_data, excel_title)
    return Response(
        content=excel_bytes,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename={type}_report.xlsx"}
    )

@export_router.get("/export/csv")
async def export_csv(type: str = Query("leads"), tenant_id: str = Query(...), date_from: str = None, date_to: str = None, _ = Depends(check_secret)):
    if type == "leads":
        data = await analytics.get_pipeline_stages(tenant_id, date_from, date_to)
        df = pd.DataFrame(list(data.items()), columns=["Pipeline Stage", "Leads Count"])
    elif type == "campaigns":
        data = await analytics.get_campaign_analytics(tenant_id, date_from, date_to)
        df = pd.DataFrame(data)
    else:
        data = await analytics.get_team_performance(tenant_id, date_from, date_to)
        df = pd.DataFrame(data)
        
    csv_str = df.to_csv(index=False)
    return Response(
        content=csv_str,
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={type}_export.csv"}
    )
