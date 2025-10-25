"""
Group/Ranch routes
Handles group creation, membership, and management
"""
from fastapi import APIRouter, HTTPException, Depends
from typing import List
from models import GroupCreate, GroupResponse, AddMemberRequest
from auth import verify_token
from db import groups, users

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
        "groupId": group["groupID"],
        "name": group["name"],
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
    """
    user_id = token["sub"]
    
    # Get group
    group = groups.get_group(group_id)
    if not group:
        raise HTTPException(404, "Group not found")
    
    # Check membership
    if not groups.is_member(group_id, user_id):
        raise HTTPException(403, "You are not a member of this group")
    
    return {"group": group}


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
    
    # Add member to group
    groups.add_member(group_id, new_member_id)
    
    # Add group to user's groups list
    users.add_group_to_user(new_member_id, group_id)
    
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
    
    # Remove member
    groups.remove_member(group_id, user_id_to_remove)
    
    return {"message": "Member removed successfully"}


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
    
    # Update balance
    groups.update_balance(group_id, amount)
    
    return {
        "message": "Deposit successful",
        "amount": amount,
        "newBalance": groups.get_balance(group_id)
    }
