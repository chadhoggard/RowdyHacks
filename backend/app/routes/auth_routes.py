"""
Authentication routes
Handles user signup and login
"""
import jwt
import datetime
from fastapi import APIRouter, HTTPException
from ..models import SignupRequest, LoginRequest, AuthResponse
from ..config import JWT_SECRET, JWT_ALGORITHM
from ..db import users

router = APIRouter(tags=["Authentication"])


@router.post("/signup", response_model=AuthResponse)
def signup(body: SignupRequest):
    """
    Register a new user
    
    - Validates email is not already registered
    - Creates user with hashed password
    - Returns JWT token
    """
    # Check if email already exists
    existing_user = users.get_user_by_email(body.email)
    if existing_user:
        raise HTTPException(409, "Email already registered")
    
    # Create user
    user = users.create_user(
        username=body.username,
        email=body.email,
        password=body.password
    )
    
    # Generate JWT token
    token = jwt.encode(
        {
            "sub": user["userID"],
            "email": user["email"],
            "iat": int(datetime.datetime.utcnow().timestamp())
        },
        JWT_SECRET,
        algorithm=JWT_ALGORITHM
    )
    
    return AuthResponse(
        userId=user["userID"],
        username=user["username"],
        token=token,
        role=user["role"]
    )


@router.post("/login", response_model=AuthResponse)
def login(body: LoginRequest):
    """
    Login existing user
    
    - Validates email and password
    - Returns JWT token
    """
    # Get user by email
    user = users.get_user_by_email(body.email)
    if not user:
        raise HTTPException(401, "Invalid credentials")
    
    # Verify password
    if not users.verify_password(user["passwordHash"], body.password):
        raise HTTPException(401, "Invalid credentials")
    
    # Generate JWT token
    token = jwt.encode(
        {
            "sub": user["userID"],
            "email": user["email"],
            "iat": int(datetime.datetime.utcnow().timestamp())
        },
        JWT_SECRET,
        algorithm=JWT_ALGORITHM
    )
    
    return AuthResponse(
        userId=user["userID"],
        username=user["username"],
        token=token,
        role=user.get("role", "member")
    )
