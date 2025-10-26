"""
Group/Ranch database operations
CRUD functions for Groups table
"""
import datetime
import uuid
from decimal import Decimal
from .connection import groups_table
from .users import add_group_to_user, get_user_groups, remove_group_from_user


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
        "balance": Decimal('0'),
        "status": "active",
        "memberCount": 1
    }
    
    groups_table.put_item(Item=item)
    return item


def get_group(group_id: str) -> dict:
    """Get group by group ID"""
    response = groups_table.get_item(Key={"groupID": group_id})
    return response.get("Item")


def add_member(group_id: str, user_id: str):
    """Add a member to the group"""
    # Avoid adding duplicates
    if is_member(group_id, user_id):
        return True

    try:
        # Append to members list and increment memberCount atomically
        groups_table.update_item(
            Key={"groupID": group_id},
            UpdateExpression="SET members = list_append(if_not_exists(members, :empty_list), :new_member) ADD memberCount :inc",
            ExpressionAttributeValues={
                ":new_member": [user_id],
                ":empty_list": [],
                # use Decimal for numeric values to be compatible with DynamoDB number type
                ":inc": Decimal(1)
            }
        )

        # Also add the group to the user's record if not already present
        try:
            user_groups = get_user_groups(user_id)
            if group_id not in user_groups:
                add_group_to_user(user_id, group_id)
        except Exception as ue:
            # If updating the user fails, rollback the group change to keep data consistent
            try:
                current_group = get_group(group_id)
                if current_group:
                    members = current_group.get("members", [])
                    if user_id in members:
                        members.remove(user_id)
                        groups_table.update_item(
                            Key={"groupID": group_id},
                            UpdateExpression="SET members = :members, memberCount = :count",
                            ExpressionAttributeValues={
                                ":members": members,
                                ":count": Decimal(len(members))
                            }
                        )
            except Exception:
                # If rollback also fails, log and surface the original error
                print("Failed to rollback member addition after user update failure")
            print(f"Error updating user record when adding group: {ue}")
            return False

        return True
    except Exception as e:
        print(f"Error adding member: {e}")
        return False


def remove_member(group_id: str, user_id: str):
    """Remove a member from the group"""
    group = get_group(group_id)
    if not group:
        return
    
    members = group.get("members", [])
    if user_id in members:
        members.remove(user_id)
        # Update members list and set memberCount to the new length
        groups_table.update_item(
            Key={"groupID": group_id},
            UpdateExpression="SET members = :members, memberCount = :count",
            ExpressionAttributeValues={
                ":members": members,
                # ensure count is stored as a Decimal for DynamoDB
                ":count": Decimal(len(members))
            }
        )
        # Also remove the group from the user's record
        try:
            remove_group_from_user(user_id, group_id)
        except Exception as e:
            print(f"Error removing group from user record: {e}")


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
        ExpressionAttributeValues={":amount": Decimal(str(amount))}
    )


def get_balance(group_id: str) -> float:
    """Get current group balance"""
    group = get_group(group_id)
    return group.get("balance", 0.0) if group else 0.0
