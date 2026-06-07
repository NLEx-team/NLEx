import pytest
from src.services.users import UserService
from src.services.auth import AuthService
from src.models.schemas.user import UserCreate, UserUpdate, UserAdminUpdate, UserProfileCreate, UserRole
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
        role=UserRole.VISITOR
    )
    
    user = user_service.create_user(user_in, hashed_password)
    
    assert user.email == email
    assert user.hashed_password == hashed_password
    assert user.role == UserRole.VISITOR
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

def test_update_user_and_profile_flat_patching(db_session: Session):
    user_service = UserService(db_session)
    auth_service = AuthService()
    
    email = "update@example.com"
    password = "oldpassword"
    hashed_password = auth_service.get_password_hash(password)
    
    user_in = UserCreate(email=email, password=password)
    user = user_service.create_user(user_in, hashed_password)
    
    # Update email and profile fields in one go (flat patching)
    user_update = UserUpdate(
        email="new_email@example.com",
        first_name="Jane",
        last_name="Smith"
    )
    updated_user = user_service.update_user(user.id, user_update)
    
    assert updated_user.email == "new_email@example.com"
    assert updated_user.profile.first_name == "Jane"
    assert updated_user.profile.last_name == "Smith"

def test_admin_update_role(db_session: Session):
    user_service = UserService(db_session)
    auth_service = AuthService()
    
    email = "visitor@example.com"
    password = "password123"
    hashed_password = auth_service.get_password_hash(password)
    
    user_in = UserCreate(email=email, password=password)
    user = user_service.create_user(user_in, hashed_password)
    assert user.role == UserRole.VISITOR
    
    # Admin updates role
    admin_update = UserAdminUpdate(role=UserRole.ADMIN)
    updated_user = user_service.update_user(user.id, admin_update)
    
    assert updated_user.role == UserRole.ADMIN
