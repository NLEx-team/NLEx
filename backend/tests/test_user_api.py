import pytest
from fastapi.testclient import TestClient
from src.database.models.user import UserRole

def get_auth_headers(client: TestClient, email: str, password: str):
    response = client.post(
        "/auth/login",
        json={"email": email, "password": password}
    )
    token = response.json()["jwt_token"]
    return {"Authorization": f"Bearer {token}"}

def test_get_me(client: TestClient):
    # Register and login
    email = "me@example.com"
    password = "password123"
    client.post("/auth/register", json={"email": email, "password": password})
    headers = get_auth_headers(client, email, password)
    
    response = client.get("/users/me", headers=headers)
    assert response.status_code == 200
    assert response.json()["email"] == email

def test_get_all_users_admin_only(client: TestClient, db_session):
    # Create an admin user manually in DB
    from src.services.auth import AuthService
    from src.database.models.user import User, UserProfile
    
    admin_email = "admin@example.com"
    password = "adminpassword"
    hashed_pwd = AuthService.get_password_hash(password)
    
    admin_user = User(email=admin_email, hashed_password=hashed_pwd, role=UserRole.ADMIN)
    admin_user.profile = UserProfile()
    db_session.add(admin_user)
    db_session.commit()
    
    # Login as admin
    headers = get_auth_headers(client, admin_email, password)
    
    # Get all users
    response = client.get("/users", headers=headers)
    assert response.status_code == 200
    assert len(response.json()) >= 1

def test_update_me_profile_flat(client: TestClient):
    email = "flat_patch@example.com"
    password = "password123"
    client.post("/auth/register", json={"email": email, "password": password})
    headers = get_auth_headers(client, email, password)
    
    response = client.patch(
        "/users/me",
        headers=headers,
        json={
            "first_name": "Maksim",
            "last_name": "Maltsev",
            "avatar_url": "http://image.url"
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert data["profile"]["first_name"] == "Maksim"
    assert data["profile"]["last_name"] == "Maltsev"
    assert data["profile"]["avatar_url"] == "http://image.url"


def test_update_me_role_ignored(client: TestClient):
    email = "hacker@example.com"
    password = "password123"
    client.post("/auth/register", json={"email": email, "password": password})
    headers = get_auth_headers(client, email, password)
    
    # Attempt to change role
    response = client.patch(
        "/users/me",
        headers=headers,
        json={"role": "admin"}
    )
    assert response.status_code == 200
    # Role should still be visitor (ignored by schema)
    assert response.json()["role"] == UserRole.VISITOR

def test_admin_update_other_user_role(client: TestClient, db_session):
    # 1. Create a visitor
    visitor_email = "victim@example.com"
    client.post("/auth/register", json={"email": visitor_email, "password": "password123"})
    visitor = client.post("/auth/login", json={"email": visitor_email, "password": "password123"}).json()["user"]
    visitor_id = visitor["id"]

    # 2. Create an admin manually
    from src.services.auth import AuthService
    from src.database.models.user import User, UserProfile
    admin_email = "bigboss@example.com"
    hashed_pwd = AuthService.get_password_hash("admin123")
    admin = User(email=admin_email, hashed_password=hashed_pwd, role=UserRole.ADMIN)
    admin.profile = UserProfile()
    db_session.add(admin)
    db_session.commit()
    
    admin_headers = get_auth_headers(client, admin_email, "admin123")

    # 3. Admin promotes visitor
    response = client.patch(
        f"/users/{visitor_id}",
        headers=admin_headers,
        json={"role": "admin"}
    )
    assert response.status_code == 200
    assert response.json()["role"] == UserRole.ADMIN

def test_delete_me(client: TestClient):
    email = "delete_me@example.com"
    password = "password123"
    client.post("/auth/register", json={"email": email, "password": password})
    headers = get_auth_headers(client, email, password)
    
    response = client.delete("/users/me", headers=headers)
    assert response.status_code == 204
