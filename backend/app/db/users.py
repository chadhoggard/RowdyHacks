"""
User database operations
CRUD functions for Users table
"""
import hashlib
import datetime
import uuid
from boto3.dynamodb.conditions import Key
from .connection import users_table
from ..config import USER_PK_ATTR


def create_user(username: str, email: str, password: str) -> dict:
    """
    Create a new user in the database
    
    Args:
        username: User's display name
        email: User's email address (will be lowercased)
        password: Plain text password (will be hashed)
        
    Returns:
        dict: Created user item
    """
    user_id = str(uuid.uuid4())
    password_hash = hashlib.sha256(password.encode()).hexdigest()
    
    item = {
        USER_PK_ATTR: user_id,
        "username": username,
        "email": email.lower(),
        "passwordHash": password_hash,
        "createdAt": datetime.datetime.utcnow().isoformat(),
        "status": "active",
        "role": "member",
        "groups": []
    }
    
    users_table.put_item(Item=item)
    return item


def get_user_by_id(user_id: str) -> dict:
    """Get user by user ID"""
    response = users_table.get_item(Key={USER_PK_ATTR: user_id})
    return response.get("Item")


def get_user_by_email(email: str) -> dict:
    """
    Get user by email using GSI
    
    Args:
        email: User's email address
        
    Returns:
        dict: User item or None if not found
    """
    try:
        response = users_table.query(
            IndexName="email-index",
            KeyConditionExpression=Key("email").eq(email.lower())
        )
        items = response.get("Items", [])
        return items[0] if items else None
    except users_table.meta.client.exceptions.ResourceNotFoundException:
        return None


def verify_password(stored_hash: str, password: str) -> bool:
    """Verify password matches stored hash"""
    input_hash = hashlib.sha256(password.encode()).hexdigest()
    return input_hash == stored_hash


def add_group_to_user(user_id: str, group_id: str):
    """Add a group ID to user's groups list"""
    users_table.update_item(
        Key={USER_PK_ATTR: user_id},
        UpdateExpression="SET #groups = list_append(if_not_exists(#groups, :empty_list), :group_id)",
        ExpressionAttributeNames={"#groups": "groups"},
        ExpressionAttributeValues={
            ":group_id": [group_id],
            ":empty_list": []
        }
    )


def get_user_groups(user_id: str) -> list:
    """Get list of group IDs user belongs to"""
    user = get_user_by_id(user_id)
    return user.get("groups", []) if user else []


def update_trust_score(user_id: str, score: float):
    """Update user's trust score"""
    users_table.update_item(
        Key={USER_PK_ATTR: user_id},
        UpdateExpression="SET trustScore = :score",
        ExpressionAttributeValues={":score": score}
    )
