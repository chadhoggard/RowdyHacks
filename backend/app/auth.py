"""
Authentication middleware and token verification
Handles JWT token validation and user authorization
"""
import jwt
from fastapi import HTTPException, Header
from typing import Optional
from .config import JWT_SECRET, JWT_ALGORITHM


def verify_token(authorization: Optional[str] = Header(None)) -> dict:
    """
    Verify JWT token from Authorization header
    
    Args:
        authorization: Bearer token from request header
        
    Returns:
        dict: Decoded token payload containing user info
        
    Raises:
        HTTPException: 401 if token is missing or invalid
    """
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(401, "Missing or invalid authorization header")
    
    token = authorization.replace("Bearer ", "")
    
    try:
        payload = jwt.decode(
            token, 
            JWT_SECRET, 
            algorithms=[JWT_ALGORITHM], 
            options={"verify_iat": False}
        )
        return payload
    except jwt.InvalidTokenError as e:
        raise HTTPException(401, f"Invalid token: {str(e)}")


def get_user_id_from_token(authorization: Optional[str] = Header(None)) -> str:
    """
    Extract user ID from JWT token
    
    Args:
        authorization: Bearer token from request header
        
    Returns:
        str: User ID from token
    """
    payload = verify_token(authorization)
    return payload["sub"]
