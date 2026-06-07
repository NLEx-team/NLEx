import pytest
from fastapi.testclient import TestClient

def test_register_user(client: TestClient):
    response = client.post(
        "/auth/register",
        json={
            "email": "newuser@example.com",
            "password": "strongpassword123",
            "first_name": "Test",
            "last_name": "User"
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert data["user"]["email"] == "newuser@example.com"
    assert "id" in data["user"]

def test_register_duplicate_email(client: TestClient):
    payload = {
        "email": "duplicate@example.com",
        "password": "strongpassword123"
    }
    client.post("/auth/register", json=payload)
    response = client.post("/auth/register", json=payload)
    assert response.status_code == 400
    assert response.json()["detail"] == "User with this email already exists"

def test_login_success(client: TestClient):
    # Register first
    client.post(
        "/auth/register",
        json={"email": "login@example.com", "password": "password123"}
    )
    
    # Login
    response = client.post(
        "/auth/login",
        json={"email": "login@example.com", "password": "password123"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "jwt_token" in data
    assert data["user"]["email"] == "login@example.com"

def test_login_invalid_credentials(client: TestClient):
    response = client.post(
        "/auth/login",
        json={"email": "nonexistent@example.com", "password": "wrongpassword"}
    )
    assert response.status_code == 401
    assert response.json()["detail"] == "Incorrect email or password"
