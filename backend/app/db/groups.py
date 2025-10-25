"""
Group/Ranch database operations
CRUD functions for Groups table
"""
import datetime
import uuid
from .connection import groups_table


def create_group(owner_id: str, name: str) -> dict:
    """
    Create a new group/ranch
    
    Args:
        owner_id: User ID of the group creator
        name: Name of the group
        
    Returns:
        dict: Created group item
    """
    group_id = str(uuid.uuid4())
    
    item = {
        "groupID": group_id,
        "name": name,
        "members": [owner_id],
        "createdBy": owner_id,
        "createdAt": datetime.datetime.utcnow().isoformat(),
        "balance": 0.0,
        "status": "active"
    }
    
    groups_table.put_item(Item=item)
    return item


def get_group(group_id: str) -> dict:
    """Get group by group ID"""
    response = groups_table.get_item(Key={"groupID": group_id})
    return response.get("Item")


def add_member(group_id: str, user_id: str):
    """Add a member to the group"""
    groups_table.update_item(
        Key={"groupID": group_id},
        UpdateExpression="SET members = list_append(members, :new_member)",
        ExpressionAttributeValues={":new_member": [user_id]}
    )


def remove_member(group_id: str, user_id: str):
    """Remove a member from the group"""
    group = get_group(group_id)
    if not group:
        return
    
    members = group.get("members", [])
    if user_id in members:
        members.remove(user_id)
        groups_table.update_item(
            Key={"groupID": group_id},
            UpdateExpression="SET members = :members",
            ExpressionAttributeValues={":members": members}
        )


def get_group_members(group_id: str) -> list:
    """Get list of member IDs in a group"""
    group = get_group(group_id)
    return group.get("members", []) if group else []


def is_member(group_id: str, user_id: str) -> bool:
    """Check if user is a member of the group"""
    members = get_group_members(group_id)
    return user_id in members


def is_owner(group_id: str, user_id: str) -> bool:
    """Check if user is the owner of the group"""
    group = get_group(group_id)
    return group.get("createdBy") == user_id if group else False


def update_balance(group_id: str, amount: float):
    """Update group balance"""
    groups_table.update_item(
        Key={"groupID": group_id},
        UpdateExpression="SET balance = balance + :amount",
        ExpressionAttributeValues={":amount": amount}
    )


def get_balance(group_id: str) -> float:
    """Get current group balance"""
    group = get_group(group_id)
    return group.get("balance", 0.0) if group else 0.0
