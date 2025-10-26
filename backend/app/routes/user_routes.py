"""
User routes
Handles user profile and settings
"""
from fastapi import APIRouter, HTTPException, Depends
from ..auth import verify_token
from ..db import users, groups, transactions

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
    print(f"👤 User {user.get('username')} has group IDs: {group_ids}")
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
                "investedAmount": group.get("investedAmount", 0),
                "totalAssets": float(group.get("balance", 0)) + float(group.get("investedAmount", 0)),
                "members": group.get("members", [])
            })
        else:
            print(f"⚠️ Group not found for ID: {group_id}")
    
    # Calculate total invested from approved transactions
    total_invested = 0
    group_ids = user.get("groups", [])
    
    for group_id in group_ids:
        # Get all transactions for this group
        group_transactions = transactions.get_group_transactions(group_id)
        
        # Sum up approved transactions proposed by this user with positive amounts
        for txn in group_transactions:
            if (txn.get("proposedBy") == user_id and 
                txn.get("status") == "approved" and 
                float(txn.get("amount", 0)) > 0):
                total_invested += float(txn.get("amount", 0))
    
    # Remove sensitive data
    user_data = {
        "userId": user.get("userID"),
        "username": user.get("username"),
        "email": user.get("email"),
        "role": user.get("role", "member"),
        "status": user.get("status", "active"),
        "groups": user_groups,
        "totalInvested": total_invested,
        "createdAt": user.get("createdAt")
    }
    
    return user_data


@router.get("/all")
def get_all_users(token: dict = Depends(verify_token)):
    """
    Get a list of all users in the system
    
    Returns basic user information (username, email, userId) for all users
    Useful for adding members to groups
    """
    try:
        # Get all users from database
        all_users = users.get_all_users()
        
        print(f"📊 Found {len(all_users)} users in database")
        print(f"📋 Raw users from DB: {[{'id': u.get('userID'), 'username': u.get('username'), 'email': u.get('email')} for u in all_users]}")
        
        # Format user data (remove sensitive info)
        user_list = []
        for user in all_users:
            user_list.append({
                "userId": user.get("userID"),
                "username": user.get("username"),
                "email": user.get("email"),
                "status": user.get("status", "active")
            })
        
        print(f"✅ Returning {len(user_list)} users")
        return {
            "users": user_list,
            "count": len(user_list)
        }
    except Exception as e:
        print(f"❌ Error fetching users: {e}")
        raise HTTPException(500, f"Failed to fetch users: {str(e)}")


@router.get("/me/investments")
def get_user_investments(token: dict = Depends(verify_token)):
    """
    Calculate user's total invested amount across all groups
    
    Returns the sum of all approved transactions (positive amounts) proposed by the user
    """
    user_id = token["sub"]
    
    # Get user's groups
    user = users.get_user_by_id(user_id)
    if not user:
        raise HTTPException(404, "User not found")
    
    group_ids = user.get("groups", [])
    
    # Calculate total invested from approved transactions
    total_invested = 0
    investment_details = []
    
    for group_id in group_ids:
        group = groups.get_group(group_id)
        if not group:
            continue
            
        # Get all transactions for this group
        group_transactions = transactions.get_group_transactions(group_id)
        
        # Sum up approved transactions proposed by this user with positive amounts
        for txn in group_transactions:
            if (txn.get("proposedBy") == user_id and 
                txn.get("status") == "approved" and 
                float(txn.get("amount", 0)) > 0):
                
                amount = float(txn.get("amount", 0))
                total_invested += amount
                
                investment_details.append({
                    "groupId": group_id,
                    "groupName": group.get("name"),
                    "amount": amount,
                    "description": txn.get("description"),
                    "date": txn.get("createdAt")
                })
    
    return {
        "totalInvested": total_invested,
        "investments": investment_details,
        "investmentCount": len(investment_details)
    }
