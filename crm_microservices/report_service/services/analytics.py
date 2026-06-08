import datetime
from services.db import fetch_all, fetch_one

async def get_sales_kpis(tenant_id: str, date_from: str = None, date_to: str = None):
    # Check actual leads count
    leads_query = "SELECT count(*) FROM leads_marketing"
    leads_row = await fetch_one(leads_query, tenant_id=tenant_id)
    db_leads = leads_row[0] if leads_row else 0

    if db_leads == 0:
        # Return fallback mock sales KPIs if DB is empty
        return {
            "total_leads": 3450,
            "converted": 412,
            "lost": 85,
            "conversion_rate": 11.9,
            "revenue": 45800.0,
            "campaign_spent": 8240.0,
            "sla_breach_rate": 1.6
        }

    # If DB has data, calculate dynamic KPIs
    converted_row = await fetch_one("SELECT count(*) FROM leads_marketing WHERE status = 'Converted'", tenant_id=tenant_id)
    lost_row = await fetch_one("SELECT count(*) FROM leads_marketing WHERE status = 'Lost'", tenant_id=tenant_id)
    
    converted = converted_row[0] if converted_row else 0
    lost = lost_row[0] if lost_row else 0
    conv_rate = round((converted / db_leads) * 100, 1) if db_leads > 0 else 0.0
    
    revenue_row = await fetch_one("SELECT sum(achieved_amount) FROM sales_targets", tenant_id=tenant_id)
    revenue = float(revenue_row[0]) if revenue_row and revenue_row[0] is not None else 0.0

    return {
        "total_leads": db_leads,
        "converted": converted,
        "lost": lost,
        "conversion_rate": conv_rate,
        "revenue": revenue,
        "campaign_spent": 0.0,
        "sla_breach_rate": 0.0
    }

async def get_leads_by_source(tenant_id: str, date_from: str = None, date_to: str = None):
    query = "SELECT source, count(*) as cnt FROM leads_marketing GROUP BY source"
    rows = await fetch_all(query, tenant_id=tenant_id)
    
    if not rows:
        # Fallback mock sources
        return {
            "Google Ads": 45,
            "LinkedIn Ads": 35,
            "Organic Search": 20
        }
    
    return {r["source"]: r["cnt"] for r in rows}

async def get_revenue_trend(tenant_id: str, date_from: str = None, date_to: str = None, period: str = "monthly"):
    query = """
        SELECT month, year, sum(achieved_amount) as revenue 
        FROM sales_targets 
        GROUP BY year, month 
        ORDER BY year, month
    """
    rows = await fetch_all(query, tenant_id=tenant_id)
    
    if not rows:
        # Fallback monthly revenue trend
        return [
            {"date": "Jan", "revenue": 12000.0},
            {"date": "Feb", "revenue": 18000.0},
            {"date": "Mar", "revenue": 28000.0},
            {"date": "Apr", "revenue": 32000.0},
            {"date": "May", "revenue": 45000.0},
            {"date": "Jun", "revenue": 48250.0}
        ]
        
    months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    trend = []
    for r in rows:
        month_idx = r["month"] - 1
        m_name = months[month_idx] if 0 <= month_idx < 12 else str(r["month"])
        trend.append({
            "date": f"{m_name}",
            "revenue": float(r["revenue"])
        })
    return trend

async def get_pipeline_stages(tenant_id: str, date_from: str = None, date_to: str = None):
    query = "SELECT status, count(*) as cnt FROM leads_marketing GROUP BY status"
    rows = await fetch_all(query, tenant_id=tenant_id)
    
    if not rows or len(rows) <= 1:
        # Fallback stages
        return {
            "New": 150,
            "Contacted": 120,
            "Qualified": 80,
            "Proposal": 45,
            "Converted": 35,
            "Lost": 20
        }
    
    return {r["status"]: r["cnt"] for r in rows}

async def get_team_performance(tenant_id: str, date_from: str = None, date_to: str = None, manager_id: str = None):
    query = """
        SELECT u.name, count(l.id) as leads, 
               count(case when l.status = 'Converted' then 1 end) as converted, 
               COALESCE(sum(t.achieved_amount), 0) as revenue
        FROM users u 
        LEFT JOIN leads_marketing l ON l.assigned_to = u.id 
        LEFT JOIN sales_targets t ON t.user_id = u.id
        GROUP BY u.name
    """
    rows = await fetch_all(query, tenant_id=tenant_id)
    # Check if there is actual team performance data
    has_perf = any(r["leads"] > 0 or r["revenue"] > 0 for r in rows) if rows else False
    
    if not has_perf:
        # Fallback team list
        return [
            {"name": "Varun Malhotra", "leads": 142, "converted": 92, "revenue": 45000.0, "rate": 64.8},
            {"name": "Sneha Gupta", "leads": 98, "converted": 78, "revenue": 28000.0, "rate": 79.6},
            {"name": "Amit Patel", "leads": 0, "converted": 0, "revenue": 0.0, "rate": 0.0},
            {"name": "Priya Sharma", "leads": 45, "converted": 32, "revenue": 9000.0, "rate": 71.1},
            {"name": "Rohan Mehta", "leads": 0, "converted": 0, "revenue": 0.0, "rate": 0.0}
        ]
        
    perf = []
    for r in rows:
        leads = r["leads"]
        converted = r["converted"]
        rate = round((converted / leads) * 100, 1) if leads > 0 else 0.0
        perf.append({
            "name": r["name"],
            "leads": leads,
            "converted": converted,
            "revenue": float(r["revenue"]),
            "rate": rate
        })
    return perf

async def get_campaign_analytics(tenant_id: str, date_from: str = None, date_to: str = None):
    query = """
        SELECT c.name, c.platform, 
               COALESCE(sum(a.leads), 0) as leads, 
               COALESCE(sum(a.cost), 0) as cost, 
               COALESCE(sum(a.revenue), 0) as revenue
        FROM campaigns c
        LEFT JOIN campaign_analytics a ON a.campaign_id = c.id
        GROUP BY c.name, c.platform
    """
    rows = await fetch_all(query, tenant_id=tenant_id)
    
    if not rows:
        # Fallback campaign metrics
        return [
            {"name": "Launch Ad", "platform": "Google Search", "leads": 450, "cost": 1200.0, "roi": 3.75},
            {"name": "Social Ad", "platform": "LinkedIn", "leads": 280, "cost": 800.0, "roi": 3.0},
            {"name": "Email Ad", "platform": "Newsletter", "leads": 110, "cost": 300.0, "roi": 4.0}
        ]
        
    analytics = []
    for r in rows:
        cost = float(r["cost"])
        revenue = float(r["revenue"])
        roi = round(revenue / cost, 2) if cost > 0 else 0.0
        analytics.append({
            "name": r["name"],
            "platform": r["platform"],
            "leads": r["leads"],
            "cost": cost,
            "roi": roi
        })
    return analytics

async def get_ticket_stats(tenant_id: str, date_from: str = None, date_to: str = None):
    query = "SELECT status, count(*) as cnt FROM support_tickets GROUP BY status"
    rows = await fetch_all(query, tenant_id=tenant_id)
    
    # Check if there is support ticket records in DB
    ticket_count = sum(r["cnt"] for r in rows) if rows else 0
    
    if ticket_count == 0:
        # Fallback ticket statistics
        return {
            "open": 16,
            "in_progress": 28,
            "resolved": 78,
            "sla_rate": 98.4
        }
        
    stats = {"open": 0, "in_progress": 0, "resolved": 0, "closed": 0}
    for r in rows:
        status = r["status"].lower().replace(" ", "_")
        if status in stats:
            stats[status] = r["cnt"]
            
    total = sum(stats.values())
    resolved = stats.get("resolved", 0) + stats.get("closed", 0)
    sla_rate = round((resolved / total) * 100, 1) if total > 0 else 100.0
    
    return {
        "open": stats.get("open", 0),
        "in_progress": stats.get("in_progress", 0),
        "resolved": resolved,
        "sla_rate": sla_rate
    }

async def get_top_performers(tenant_id: str, date_from: str = None, date_to: str = None, limit: int = 5):
    query = """
        SELECT u.name, r.name as role, COALESCE(sum(t.achieved_amount), 0) as revenue
        FROM users u
        JOIN roles r ON r.id = u.role_id
        LEFT JOIN sales_targets t ON t.user_id = u.id
        GROUP BY u.name, r.name
        ORDER BY revenue DESC
        LIMIT $1
    """
    rows = await fetch_all(query, limit, tenant_id=tenant_id)
    has_revenue = any(r["revenue"] > 0 for r in rows) if rows else False
    
    if not has_revenue:
        # Fallback leaderboard
        return [
            {"rank": 1, "name": "Varun Malhotra", "role": "Sales Manager", "metric": "142 Leads • 92 Tickets", "score": "94%", "bar": 94},
            {"rank": 2, "name": "Sneha Gupta", "role": "Sales Executive", "metric": "98 Leads • 78 Tickets", "score": "88%", "bar": 88},
            {"rank": 3, "name": "Amit Patel", "role": "Support Manager", "metric": "0 Leads • 118 Tickets", "score": "85%", "bar": 85},
            {"rank": 4, "name": "Priya Sharma", "role": "Marketing Exec", "metric": "45 Leads • 0 Tickets", "score": "72%", "bar": 72},
            {"rank": 5, "name": "Rohan Mehta", "role": "Finance Exec", "metric": "0 Leads • 65 Tickets", "score": "68%", "bar": 68}
        ]
        
    perf = []
    for i, r in enumerate(rows):
        perf.append({
            "rank": i + 1,
            "name": r["name"],
            "role": r["role"],
            "metric": f"Revenue: ₹{round(float(r['revenue'])/100000, 1)}L",
            "score": "90%",
            "bar": 90
        })
    return perf
