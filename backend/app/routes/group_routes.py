"""
Group/Ranch routes
Handles group creation, membership, and management
"""
from fastapi import APIRouter, HTTPException, Depends
from typing import List, Dict
from ..models import GroupCreate, GroupResponse, AddMemberRequest
from ..auth import verify_token
from ..db import groups, users, transactions
from ..services.alpaca_service import alpaca_service

router = APIRouter(prefix="/groups", tags=["Groups"])


@router.post("", response_model=dict)
def create_group(body: GroupCreate, token: dict = Depends(verify_token)):
    """
    Create a new savings group/ranch
    
    - User becomes the owner
    - User is automatically added as first member
    """
    user_id = token["sub"]
    
    # Create group
    group = groups.create_group(owner_id=user_id, name=body.name)
    
    # Add group to user's groups list
    users.add_group_to_user(user_id, group["groupID"])
    
    return {
        "groupID": group["groupID"],
        "name": group["name"],
        "balance": group.get("balance", 0),
        "members": group.get("members", []),
        "memberCount": group.get("memberCount", len(group.get("members", []))),
        "message": "Group created successfully"
    }


@router.get("", response_model=dict)
def get_user_groups(token: dict = Depends(verify_token)):
    """
    Get all groups the current user belongs to
    """
    user_id = token["sub"]
    
    # Get user's group IDs
    user_group_ids = users.get_user_groups(user_id)
    
    # Fetch group details
    group_details = []
    for group_id in user_group_ids:
        group = groups.get_group(group_id)
        if group:
            group_details.append(group)
    
    return {"groups": group_details}


@router.get("/{group_id}", response_model=dict)
def get_group_details(group_id: str, token: dict = Depends(verify_token)):
    """
    Get details of a specific group
    
    - Must be a member to view
    - Includes member details (username, email)
    """
    user_id = token["sub"]
    
    # Get group
    group = groups.get_group(group_id)
    if not group:
        raise HTTPException(404, "Group not found")
    
    # Check membership
    if not groups.is_member(group_id, user_id):
        raise HTTPException(403, "You are not a member of this group")
    
    # Fetch member details
    member_details = []
    for member_id in group.get("members", []):
        member = users.get_user_by_id(member_id)
        if member:
            member_details.append({
                "userId": member.get("userID"),
                "username": member.get("username"),
                "email": member.get("email"),
                "role": member.get("role", "member")
            })
    
    # Add member details to group response
    group_with_members = dict(group)
    group_with_members["memberDetails"] = member_details
    
    # Ensure investedAmount exists (for backwards compatibility with old groups)
    if "investedAmount" not in group_with_members:
        group_with_members["investedAmount"] = 0
    
    # Add total assets calculation
    liquid_balance = float(group_with_members.get("balance", 0))
    invested = float(group_with_members.get("investedAmount", 0))
    group_with_members["totalAssets"] = liquid_balance + invested
    
    return {"group": group_with_members}


@router.get("/{group_id}/holdings", response_model=dict)
def get_group_holdings(group_id: str, token: dict = Depends(verify_token)):
    """
    Get detailed stock holdings breakdown for a group
    
    - Returns individual stock holdings with current values
    - Calculates percentages of total portfolio
    - Must be a member to view
    """
    user_id = token["sub"]
    
    # Check membership
    if not groups.is_member(group_id, user_id):
        raise HTTPException(403, "You are not a member of this group")
    
    # Get all executed transactions for this group
    all_transactions = transactions.get_group_transactions(group_id)
    executed_txns = [t for t in all_transactions if t.get("status") == "executed"]
    
    # Build holdings dictionary: {symbol: {quantity, total_cost}}
    holdings: Dict[str, Dict] = {}
    
    for txn in executed_txns:
        metadata = txn.get("metadata", {})
        if metadata.get("stock_symbol"):
            symbol = metadata["stock_symbol"]
            quantity = float(metadata.get("quantity", 0))
            
            if symbol not in holdings:
                holdings[symbol] = {"quantity": 0, "name": metadata.get("stock_name", symbol)}
            
            holdings[symbol]["quantity"] += quantity
    
    # Get current prices and calculate values
    holdings_list = []
    total_value = 0
    
    for symbol, data in holdings.items():
        if data["quantity"] > 0:  # Only include positions we still hold
            stock_info = alpaca_service.get_stock_info(symbol)
            if stock_info:
                current_price = stock_info["price"]
                current_value = data["quantity"] * current_price
                total_value += current_value
                
                holdings_list.append({
                    "symbol": symbol,
                    "name": data["name"],
                    "quantity": data["quantity"],
                    "current_price": current_price,
                    "current_value": current_value,
                })
    
    # Calculate percentages
    for holding in holdings_list:
        holding["percentage"] = (holding["current_value"] / total_value * 100) if total_value > 0 else 0
    
    # Sort by value descending
    holdings_list.sort(key=lambda x: x["current_value"], reverse=True)
    
    # Get group info for liquid balance
    group = groups.get_group(group_id)
    liquid_balance = float(group.get("balance", 0)) if group else 0
    
    return {
        "holdings": holdings_list,
        "total_invested_value": total_value,
        "liquid_balance": liquid_balance,
        "total_assets": total_value + liquid_balance
    }


@router.get("/{group_id}/members", response_model=dict)
def get_group_members(group_id: str, token: dict = Depends(verify_token)):
    """
    Get list of members in a group with their details
    
    - Must be a member to view
    - Returns member usernames, emails, and roles
    """
    user_id = token["sub"]
    
    # Get group
    group = groups.get_group(group_id)
    if not group:
        raise HTTPException(404, "Group not found")
    
    # Check membership
    if not groups.is_member(group_id, user_id):
        raise HTTPException(403, "You are not a member of this group")
    
    # Fetch member details
    member_details = []
    for member_id in group.get("members", []):
        member = users.get_user_by_id(member_id)
        if member:
            member_details.append({
                "userId": member.get("userID"),
                "username": member.get("username"),
                "email": member.get("email"),
                "role": member.get("role", "member"),
                "status": member.get("status", "active"),
                "createdAt": member.get("createdAt"),
                "isOwner": member.get("userID") == group.get("createdBy")
            })
    
    return {
        "members": member_details,
        "count": len(member_details),
        "groupId": group_id,
        "groupName": group.get("name")
    }


@router.post("/{group_id}/members", response_model=dict)
def add_member(
    group_id: str, 
    body: AddMemberRequest, 
    token: dict = Depends(verify_token)
):
    """
    Add a member to the group
    
    - Must be an existing member to invite
    - User being added must exist
    """
    user_id = token["sub"]
    new_member_id = body.userId
    
    # Get group
    group = groups.get_group(group_id)
    if not group:
        raise HTTPException(404, "Group not found")
    
    # Check if current user is a member
    if not groups.is_member(group_id, user_id):
        raise HTTPException(403, "You are not a member of this group")
    
    # Check if new user exists
    new_user = users.get_user_by_id(new_member_id)
    if not new_user:
        raise HTTPException(404, "User to add not found")
    
    # Check if already a member
    if groups.is_member(group_id, new_member_id):
        raise HTTPException(409, "User is already a member")
    
    # Add member to group (this also adds the group to the user's groups list)
    groups.add_member(group_id, new_member_id)
    
    return {"message": "Member added successfully"}


@router.delete("/{group_id}/members/{user_id_to_remove}", response_model=dict)
def remove_member(
    group_id: str,
    user_id_to_remove: str,
    token: dict = Depends(verify_token)
):
    """
    Remove a member from the group
    
    - Owner can remove anyone
    - Members can only remove themselves
    """
    user_id = token["sub"]
    
    # Get group
    group = groups.get_group(group_id)
    if not group:
        raise HTTPException(404, "Group not found")
    
    # Check permissions
    is_owner = groups.is_owner(group_id, user_id)
    is_self_remove = user_id == user_id_to_remove
    
    if not is_owner and not is_self_remove:
        raise HTTPException(403, "Only the owner can remove other members")
    
    # Can't remove the owner
    if user_id_to_remove == group["createdBy"]:
        raise HTTPException(400, "Cannot remove the group owner")
    
    # Check if user is actually a member
    if not groups.is_member(group_id, user_id_to_remove):
        raise HTTPException(404, "User is not a member of this group")
    
    # Remove member from group
    groups.remove_member(group_id, user_id_to_remove)
    
    # Remove group from user's groups list
    users.remove_group_from_user(user_id_to_remove, group_id)
    
    return {"message": "Member removed successfully"}


@router.delete("/{group_id}", response_model=dict)
def delete_group(
    group_id: str,
    token: dict = Depends(verify_token)
):
    """
    Delete a group (owner only)
    
    - Only the owner can delete the group
    - Removes the group from all members' group lists
    """
    user_id = token["sub"]
    
    # Get group
    group = groups.get_group(group_id)
    if not group:
        raise HTTPException(404, "Group not found")
    
    # Check if user is the owner
    if not groups.is_owner(group_id, user_id):
        raise HTTPException(403, "Only the owner can delete the group")
    
    # Remove group from all members
    for member_id in group.get("members", []):
        users.remove_group_from_user(member_id, group_id)
    
    # Delete the group
    groups.delete_group(group_id)
    
    return {"message": "Group deleted successfully"}


@router.post("/{group_id}/deposit", response_model=dict)
def deposit_to_group(
    group_id: str,
    body: dict,
    token: dict = Depends(verify_token)
):
    """
    Deposit money into the group balance
    
    - Must be a member
    - Amount must be positive
    - Deducts from user's personal balance
    """
    user_id = token["sub"]
    
    if "amount" not in body or body["amount"] <= 0:
        raise HTTPException(400, "Amount must be positive")
    
    amount = float(body["amount"])
    
    # Get group
    group = groups.get_group(group_id)
    if not group:
        raise HTTPException(404, "Group not found")
    
    # Check membership
    if not groups.is_member(group_id, user_id):
        raise HTTPException(403, "You are not a member of this group")
    
    # Check user has enough balance
    user_balance = users.get_user_balance(user_id)
    if user_balance < amount:
        raise HTTPException(400, f"Insufficient funds. Your balance is ${user_balance:.2f}")
    
    # Deduct from user's balance
    users.update_user_balance(user_id, -amount)
    
    # Add to group balance
    groups.update_balance(group_id, amount)
    
    # Get updated balances
    updated_group = groups.get_group(group_id)
    liquid_balance = float(updated_group.get("balance", 0))
    invested = float(updated_group.get("investedAmount", 0))
    new_user_balance = users.get_user_balance(user_id)
    
    print(f"💰 User {user_id} deposited ${amount} to group {group_id}. New user balance: ${new_user_balance}")
    
    return {
        "message": "Deposit successful",
        "amount": amount,
        "newBalance": liquid_balance,
        "investedAmount": invested,
        "totalAssets": liquid_balance + invested,
        "userBalance": new_user_balance
    }
