"""
Invite database operations
CRUD functions for Invites table
"""
import datetime
import uuid
from boto3.dynamodb.conditions import Key
from .connection import invites_table


def create_invite(group_id: str, inviter_id: str, invitee_email: str) -> dict:
    """
    Create a new group invite
    
    Args:
        group_id: ID of the group
        inviter_id: ID of user sending the invite
        invitee_email: Email of user being invited
        
    Returns:
        dict: Created invite item
    """
    invite_id = str(uuid.uuid4())
    
    item = {
        "inviteID": invite_id,
        "groupID": group_id,
        "inviterID": inviter_id,
        "inviteeEmail": invitee_email.lower(),
        "status": "pending",  # pending, accepted, declined
        "createdAt": datetime.datetime.utcnow().isoformat()
    }
    
    invites_table.put_item(Item=item)
    return item


def get_invite(invite_id: str) -> dict:
    """Get invite by ID"""
    response = invites_table.get_item(Key={"inviteID": invite_id})
    return response.get("Item")


def get_user_invites(email: str) -> list:
    """
    Get all pending invites for a user by email
    
    Args:
        email: User's email address
        
    Returns:
        list: List of pending invite items
    """
    try:
        response = invites_table.query(
            IndexName="inviteeEmail-index",
            KeyConditionExpression=Key("inviteeEmail").eq(email.lower())
        )
        # Filter for pending only
        invites = response.get("Items", [])
        return [inv for inv in invites if inv.get("status") == "pending"]
    except Exception as e:
        print(f"Error getting invites: {e}")
        return []


def get_group_invites(group_id: str) -> list:
    """
    Get all invites for a group
    
    Args:
        group_id: Group ID
        
    Returns:
        list: List of invite items
    """
    try:
        response = invites_table.query(
            IndexName="groupID-index",
            KeyConditionExpression=Key("groupID").eq(group_id)
        )
        return response.get("Items", [])
    except Exception as e:
        print(f"Error getting group invites: {e}")
        return []


def update_invite_status(invite_id: str, status: str):
    """
    Update invite status (accept/decline)
    
    Args:
        invite_id: Invite ID
        status: New status ('accepted' or 'declined')
    """
    invites_table.update_item(
        Key={"inviteID": invite_id},
        UpdateExpression="SET #status = :status, updatedAt = :updated",
        ExpressionAttributeNames={"#status": "status"},
        ExpressionAttributeValues={
            ":status": status,
            ":updated": datetime.datetime.utcnow().isoformat()
        }
    )


def delete_invite(invite_id: str):
    """Delete an invite"""
    invites_table.delete_item(Key={"inviteID": invite_id})


def check_existing_invite(group_id: str, email: str) -> dict:
    """
    Check if there's already a pending invite for this email to this group
    
    Returns:
        dict: Existing invite or None
    """
    invites = get_user_invites(email)
    for invite in invites:
        if invite.get("groupID") == group_id and invite.get("status") == "pending":
            return invite
    return None
