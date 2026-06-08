import pytest
from httpx import AsyncClient
from src.database.models.user import UserRole
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

async def get_auth_headers(client: AsyncClient, email: str, password: str):
    response = await client.post(
        "/auth/login",
        json={"email": email, "password": password}
    )
    token = response.json()["jwt_token"]
    return {"Authorization": f"Bearer {token}"}

@pytest.mark.asyncio
async def test_get_me(client: AsyncClient):
    # Register and login
    email = "me@example.com"
    password = "password123"
    await client.post("/auth/register", json={"email": email, "password": password})
    headers = await get_auth_headers(client, email, password)
    
    response = await client.get("/users/me", headers=headers)
    assert response.status_code == 200
    assert response.json()["email"] == email

@pytest.mark.asyncio
async def test_get_all_users_admin_only(client: AsyncClient, db_session: AsyncSession):
    # Create an admin user manually in DB
    from src.services.auth import AuthService
    from src.database.models.user import User, UserProfile
    
    admin_email = "admin@example.com"
    password = "adminpassword"
    hashed_pwd = AuthService.get_password_hash(password)
    
    admin_user = User(email=admin_email, hashed_password=hashed_pwd, role=UserRole.ADMIN)
    admin_user.profile = UserProfile()
    db_session.add(admin_user)
    await db_session.commit()
    
    # Login as admin
    headers = await get_auth_headers(client, admin_email, password)
    
    # Get all users
    response = await client.get("/users", headers=headers)
    assert response.status_code == 200
    assert len(response.json()) >= 1

@pytest.mark.asyncio
async def test_update_me_profile_flat(client: AsyncClient):
    email = "flat_patch@example.com"
    password = "password123"
    await client.post("/auth/register", json={"email": email, "password": password})
    headers = await get_auth_headers(client, email, password)
    
    response = await client.patch(
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


@pytest.mark.asyncio
async def test_update_me_role_ignored(client: AsyncClient):
    email = "hacker@example.com"
    password = "password123"
    await client.post("/auth/register", json={"email": email, "password": password})
    headers = await get_auth_headers(client, email, password)
    
    # Attempt to change role
    response = await client.patch(
        "/users/me",
        headers=headers,
        json={"role": "admin"}
    )
    assert response.status_code == 200
    # Role should still be visitor (ignored by schema)
    assert response.json()["role"] == UserRole.VISITOR

@pytest.mark.asyncio
async def test_admin_update_other_user_role(client: AsyncClient, db_session: AsyncSession):
    # 1. Create a visitor
    visitor_email = "victim@example.com"
    await client.post("/auth/register", json={"email": visitor_email, "password": "password123"})
    response = await client.post("/auth/login", json={"email": visitor_email, "password": "password123"})
    visitor_id = response.json()["user"]["id"]

    # 2. Create an admin manually
    from src.services.auth import AuthService
    from src.database.models.user import User, UserProfile
    admin_email = "bigboss@example.com"
    hashed_pwd = AuthService.get_password_hash("admin123")
    admin = User(email=admin_email, hashed_password=hashed_pwd, role=UserRole.ADMIN)
    admin.profile = UserProfile()
    db_session.add(admin)
    await db_session.commit()
    
    admin_headers = await get_auth_headers(client, admin_email, "admin123")

    # 3. Admin promotes visitor
    response = await client.patch(
        f"/users/{visitor_id}",
        headers=admin_headers,
        json={"role": "admin"}
    )
    assert response.status_code == 200
    assert response.json()["role"] == UserRole.ADMIN

@pytest.mark.asyncio
async def test_delete_me(client: AsyncClient):
    email = "delete_me@example.com"
    password = "password123"
    await client.post("/auth/register", json={"email": email, "password": password})
    headers = await get_auth_headers(client, email, password)
    
    response = await client.delete("/users/me", headers=headers)
    assert response.status_code == 204
