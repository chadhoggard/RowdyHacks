"""
User routes
Handles user profile and settings
"""
from fastapi import APIRouter, HTTPException, Depends
from ..auth import verify_token
from ..db import users, groups

router = APIRouter(prefix="/users", tags=["Users"])


@router.get("/me")
def get_current_user(token: dict = Depends(verify_token)):
    """
    Get current user's profile
    
    Returns user information including username, email, groups, etc.
    """
    user_id = token["sub"]
    
    # Get user from database
    user = users.get_user_by_id(user_id)
    if not user:
        raise HTTPException(404, "User not found")
    
    # Get full group details for each group ID
    group_ids = user.get("groups", [])
    user_groups = []
    for group_id in group_ids:
        group = groups.get_group(group_id)
        if group:
            print(f"📦 Group data from DB: {group}")
            print(f"🔑 GroupID field: {group.get('groupID')}")
            user_groups.append({
                "groupID": group.get("groupID"),
                "name": group.get("name"),
                "balance": group.get("balance", 0),
                "members": group.get("members", [])
            })
        else:
            print(f"⚠️ Group not found for ID: {group_id}")
    
    # Remove sensitive data
    user_data = {
        "userId": user.get("userID"),
        "username": user.get("username"),
        "email": user.get("email"),
        "role": user.get("role", "member"),
        "status": user.get("status", "active"),
        "groups": user_groups,
        "createdAt": user.get("createdAt")
    }
    
    return user_data
