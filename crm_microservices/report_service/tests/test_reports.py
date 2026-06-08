import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, AsyncMock
import os
import sys

# Add the parent directory to sys.path so we can import app
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Mock services.db functions BEFORE importing main to avoid actual DB connection attempts
with patch("services.db.init_db", new_callable=AsyncMock), \
     patch("services.db.close_db", new_callable=AsyncMock):
    from main import app

client = TestClient(app)

NODE_BACKEND_SECRET = os.getenv("NODE_BACKEND_SECRET", "shared_secret_key")

@pytest.fixture(autouse=True)
def mock_db():
    with patch("services.analytics.fetch_one", new_callable=AsyncMock) as mock_one, \
         patch("services.analytics.fetch_all", new_callable=AsyncMock) as mock_all:
        mock_one.return_value = None
        mock_all.return_value = []
        yield mock_one, mock_all

def test_health():
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["service"] == "reports-service"

def test_sales_kpis_missing_secret():
    response = client.get("/api/reports/sales/kpis?tenant_id=test-tenant")
    assert response.status_code == 403

def test_sales_kpis_invalid_secret():
    headers = {"X-Backend-Secret": "wrong_secret"}
    response = client.get("/api/reports/sales/kpis?tenant_id=test-tenant", headers=headers)
    assert response.status_code == 403

def test_sales_kpis_success():
    headers = {"X-Backend-Secret": NODE_BACKEND_SECRET}
    response = client.get("/api/reports/sales/kpis?tenant_id=test-tenant", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["total_leads"] == 3450
    assert data["conversion_rate"] == 11.9

def test_sales_revenue_trend_success():
    headers = {"X-Backend-Secret": NODE_BACKEND_SECRET}
    response = client.get("/api/reports/sales/revenue-trend?tenant_id=test-tenant", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert data[0]["revenue"] == 12000.0

def test_sales_pipeline_success():
    headers = {"X-Backend-Secret": NODE_BACKEND_SECRET}
    response = client.get("/api/reports/sales/pipeline?tenant_id=test-tenant", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["New"] == 150

def test_sales_team_performance_success():
    headers = {"X-Backend-Secret": NODE_BACKEND_SECRET}
    response = client.get("/api/reports/sales/team-performance?tenant_id=test-tenant", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data[0]["name"] == "Varun Malhotra"

def test_sales_top_performers_success():
    headers = {"X-Backend-Secret": NODE_BACKEND_SECRET}
    response = client.get("/api/reports/sales/top-performers?tenant_id=test-tenant", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data[0]["name"] == "Varun Malhotra"

def test_marketing_campaigns_success():
    headers = {"X-Backend-Secret": NODE_BACKEND_SECRET}
    response = client.get("/api/reports/marketing/campaigns?tenant_id=test-tenant", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data[0]["name"] == "Launch Ad"

def test_marketing_roi_success():
    headers = {"X-Backend-Secret": NODE_BACKEND_SECRET}
    response = client.get("/api/reports/marketing/roi?tenant_id=test-tenant", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data[0]["roi"] == 3.75

def test_marketing_lead_sources_success():
    headers = {"X-Backend-Secret": NODE_BACKEND_SECRET}
    response = client.get("/api/reports/marketing/lead-sources?tenant_id=test-tenant", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["Google Ads"] == 45

def test_marketing_funnel_success():
    headers = {"X-Backend-Secret": NODE_BACKEND_SECRET}
    response = client.get("/api/reports/marketing/funnel?tenant_id=test-tenant", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["New"] == 150

def test_support_tickets_success():
    headers = {"X-Backend-Secret": NODE_BACKEND_SECRET}
    response = client.get("/api/reports/support/tickets?tenant_id=test-tenant", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["open"] == 16

def test_support_sla_success():
    headers = {"X-Backend-Secret": NODE_BACKEND_SECRET}
    response = client.get("/api/reports/support/sla?tenant_id=test-tenant", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["sla_rate"] == 98.4

def test_support_agent_performance_success():
    headers = {"X-Backend-Secret": NODE_BACKEND_SECRET}
    response = client.get("/api/reports/support/agent-performance?tenant_id=test-tenant", headers=headers)
    assert response.status_code == 200

def test_finance_revenue_success():
    headers = {"X-Backend-Secret": NODE_BACKEND_SECRET}
    response = client.get("/api/reports/finance/revenue?tenant_id=test-tenant", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["gross_revenue"] == 183250.0

def test_finance_payments_success():
    headers = {"X-Backend-Secret": NODE_BACKEND_SECRET}
    response = client.get("/api/reports/finance/payments?tenant_id=test-tenant", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data[0]["id"] == "pay_001"

def test_finance_invoices_success():
    headers = {"X-Backend-Secret": NODE_BACKEND_SECRET}
    response = client.get("/api/reports/finance/invoices?tenant_id=test-tenant", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data[0]["id"] == "INV-2026-001"

def test_chart_revenue_trend():
    headers = {"X-Backend-Secret": NODE_BACKEND_SECRET}
    response = client.get("/api/charts/revenue-trend?tenant_id=test-tenant", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert "chart_base64" in data
    assert data["type"] == "png"

def test_chart_pipeline_funnel():
    headers = {"X-Backend-Secret": NODE_BACKEND_SECRET}
    response = client.get("/api/charts/pipeline-funnel?tenant_id=test-tenant", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert "chart_base64" in data

def test_chart_team_performance():
    headers = {"X-Backend-Secret": NODE_BACKEND_SECRET}
    response = client.get("/api/charts/team-performance?tenant_id=test-tenant", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert "chart_base64" in data

def test_chart_lead_sources():
    headers = {"X-Backend-Secret": NODE_BACKEND_SECRET}
    response = client.get("/api/charts/lead-sources?tenant_id=test-tenant", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert "chart_base64" in data

def test_chart_campaign_roi():
    headers = {"X-Backend-Secret": NODE_BACKEND_SECRET}
    response = client.get("/api/charts/campaign-roi?tenant_id=test-tenant", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert "chart_base64" in data

def test_export_pdf_sales():
    headers = {"X-Backend-Secret": NODE_BACKEND_SECRET}
    response = client.get("/api/export/pdf?type=sales&tenant_id=test-tenant", headers=headers)
    assert response.status_code == 200
    assert response.headers["content-type"] == "application/pdf"
    assert len(response.content) > 0

def test_export_pdf_marketing():
    headers = {"X-Backend-Secret": NODE_BACKEND_SECRET}
    response = client.get("/api/export/pdf?type=marketing&tenant_id=test-tenant", headers=headers)
    assert response.status_code == 200
    assert response.headers["content-type"] == "application/pdf"

def test_export_pdf_support():
    headers = {"X-Backend-Secret": NODE_BACKEND_SECRET}
    response = client.get("/api/export/pdf?type=support&tenant_id=test-tenant", headers=headers)
    assert response.status_code == 200
    assert response.headers["content-type"] == "application/pdf"

def test_export_excel_sales():
    headers = {"X-Backend-Secret": NODE_BACKEND_SECRET}
    response = client.get("/api/export/excel?type=sales&tenant_id=test-tenant", headers=headers)
    assert response.status_code == 200
    assert "openxmlformats" in response.headers["content-type"]

def test_export_excel_marketing():
    headers = {"X-Backend-Secret": NODE_BACKEND_SECRET}
    response = client.get("/api/export/excel?type=marketing&tenant_id=test-tenant", headers=headers)
    assert response.status_code == 200
    assert "openxmlformats" in response.headers["content-type"]

def test_export_csv_leads():
    headers = {"X-Backend-Secret": NODE_BACKEND_SECRET}
    response = client.get("/api/export/csv?type=leads&tenant_id=test-tenant", headers=headers)
    assert response.status_code == 200
    assert response.headers["content-type"] == "text/csv; charset=utf-8"
    assert len(response.content) > 0

def test_export_csv_campaigns():
    headers = {"X-Backend-Secret": NODE_BACKEND_SECRET}
    response = client.get("/api/export/csv?type=campaigns&tenant_id=test-tenant", headers=headers)
    assert response.status_code == 200
    assert response.headers["content-type"] == "text/csv; charset=utf-8"
