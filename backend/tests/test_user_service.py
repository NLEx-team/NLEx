import pytest
from src.services.users import UserService
from src.services.auth import AuthService
from src.models.schemas.user import UserCreate, UserUpdate, UserProfileCreate, UserRole
from sqlalchemy.orm import Session

def test_create_user_with_automatic_profile(db_session: Session):
    user_service = UserService(db_session)
    auth_service = AuthService()
    
    email = "test@example.com"
    password = "securepassword"
    hashed_password = auth_service.get_password_hash(password)
    
    user_in = UserCreate(
        email=email,
        password=password,
        is_admin=UserRole.VISITOR
    )
    
    user = user_service.create_user(user_in, hashed_password)
    
    assert user.email == email
    assert user.hashed_password == hashed_password
    assert user.is_admin == UserRole.VISITOR
    assert user.profile is not None
    assert user.profile.first_name is None
    assert user.profile.last_name is None

def test_create_user_with_provided_profile(db_session: Session):
    user_service = UserService(db_session)
    auth_service = AuthService()
    
    email = "profile@example.com"
    password = "password123"
    hashed_password = auth_service.get_password_hash(password)
    
    profile_in = UserProfileCreate(
        first_name="John",
        last_name="Doe"
    )
    
    user_in = UserCreate(
        email=email,
        password=password,
        profile=profile_in
    )
    
    user = user_service.create_user(user_in, hashed_password)
    
    assert user.email == email
    assert user.profile.first_name == "John"
    assert user.profile.last_name == "Doe"

def test_get_user_by_email(db_session: Session):
    user_service = UserService(db_session)
    auth_service = AuthService()
    
    email = "findme@example.com"
    password = "testpassword"
    hashed_password = auth_service.get_password_hash(password)
    
    user_in = UserCreate(email=email, password=password)
    user_service.create_user(user_in, hashed_password)
    
    user = user_service.get_user_by_email(email)
    assert user is not None
    assert user.email == email

def test_password_hashing_and_verification():
    auth_service = AuthService()
    password = "secret_password"
    
    hashed = auth_service.get_password_hash(password)
    assert hashed != password
    assert auth_service.verify_password(password, hashed) is True
    assert auth_service.verify_password("wrong_password", hashed) is False

def test_update_user_and_profile(db_session: Session):
    user_service = UserService(db_session)
    auth_service = AuthService()
    
    email = "update@example.com"
    password = "oldpassword"
    hashed_password = auth_service.get_password_hash(password)
    
    user_in = UserCreate(email=email, password=password)
    user = user_service.create_user(user_in, hashed_password)
    
    # Update user role
    user_update = UserUpdate(is_admin=UserRole.ADMIN)
    updated_user = user_service.update_user(user.id, user_update)
    assert updated_user.is_admin == UserRole.ADMIN
    
    # Update profile
    from src.models.schemas.user import UserProfileBase
    profile_update = UserProfileBase(first_name="Jane")
    updated_profile = user_service.update_profile(user.id, profile_update)
    assert updated_profile.first_name == "Jane"
