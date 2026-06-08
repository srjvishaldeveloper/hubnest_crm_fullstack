import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch
import os
import sys

# Add the parent directory to sys.path so we can import app
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from main import app

client = TestClient(app)

NODE_BACKEND_SECRET = os.getenv("NODE_BACKEND_SECRET", "shared_secret_key")

def test_health():
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert "model" in data

def test_chat_auth_missing_secret():
    payload = {
        "messages": [{"role": "user", "content": "hello"}],
        "user_role": "Admin",
        "context": "crm"
    }
    response = client.post("/api/chat", json=payload)
    assert response.status_code == 403
    assert "Access denied" in response.json()["detail"]

def test_chat_auth_invalid_secret():
    payload = {
        "messages": [{"role": "user", "content": "hello"}],
        "user_role": "Admin",
        "context": "crm"
    }
    headers = {"X-Backend-Secret": "wrong_secret"}
    response = client.post("/api/chat", json=payload, headers=headers)
    assert response.status_code == 403
    assert "Access denied" in response.json()["detail"]

def test_chat_empty_messages():
    payload = {
        "messages": [],
        "user_role": "Admin",
        "context": "crm"
    }
    headers = {"X-Backend-Secret": NODE_BACKEND_SECRET}
    response = client.post("/api/chat", json=payload, headers=headers)
    assert response.status_code == 422
    assert "Messages list cannot be empty" in response.json()["detail"]

@patch("routers.chat.get_chat_response")
def test_chat_success(mock_get_response):
    mock_get_response.return_value = ("Mocked reply", 15)
    
    payload = {
        "messages": [{"role": "user", "content": "hello"}],
        "user_role": "Admin",
        "context": "crm"
    }
    headers = {"X-Backend-Secret": NODE_BACKEND_SECRET}
    response = client.post("/api/chat", json=payload, headers=headers)
    
    assert response.status_code == 200
    data = response.json()
    assert data["reply"] == "Mocked reply"
    assert data["tokens_used"] == 15
    mock_get_response.assert_called_once()

def test_chat_reset():
    headers = {"X-Backend-Secret": NODE_BACKEND_SECRET}
    response = client.post("/api/chat/reset", headers=headers)
    assert response.status_code == 200
    assert response.json() == {"status": "cleared"}

def test_chat_reset_invalid_secret():
    headers = {"X-Backend-Secret": "wrong_secret"}
    response = client.post("/api/chat/reset", headers=headers)
    assert response.status_code == 403
