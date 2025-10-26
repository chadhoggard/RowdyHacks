"""
Transaction database operations
CRUD functions for Transactions table
"""
import datetime
import uuid
from decimal import Decimal
from boto3.dynamodb.conditions import Key
from .connection import transactions_table


def create_transaction(group_id: str, user_id: str, amount: float, description: str) -> dict:
    """
    Create a new transaction proposal
    
    Args:
        group_id: ID of the group
        user_id: ID of user proposing the transaction
        amount: Transaction amount
        description: Description/reason for transaction
        
    Returns:
        dict: Created transaction item
    """
    transaction_id = str(uuid.uuid4())
    
    item = {
        "transactionID": transaction_id,
        "groupID": group_id,
        "amount": Decimal(str(amount)),
        "description": description,
        "proposedBy": user_id,
        "status": "pending",
        "votes": {},
        "createdAt": datetime.datetime.utcnow().isoformat()
    }
    
    transactions_table.put_item(Item=item)
    return item


def get_transaction(transaction_id: str) -> dict:
    """Get transaction by transaction ID"""
    response = transactions_table.get_item(Key={"transactionID": transaction_id})
    return response.get("Item")


def get_group_transactions(group_id: str) -> list:
    """
    Get all transactions for a group using GSI
    
    Args:
        group_id: ID of the group
        
    Returns:
        list: List of transaction items
    """
    try:
        response = transactions_table.query(
            IndexName="groupID-index",
            KeyConditionExpression=Key("groupID").eq(group_id)
        )
        return response.get("Items", [])
    except transactions_table.meta.client.exceptions.ResourceNotFoundException:
        return []


def record_vote(transaction_id: str, user_id: str, vote: str):
    """
    Record a user's vote on a transaction
    
    Args:
        transaction_id: ID of the transaction
        user_id: ID of voting user
        vote: "approve" or "reject"
    """
    transaction = get_transaction(transaction_id)
    if not transaction:
        return
    
    votes = transaction.get("votes", {})
    votes[user_id] = vote
    
    transactions_table.update_item(
        Key={"transactionID": transaction_id},
        UpdateExpression="SET votes = :votes",
        ExpressionAttributeValues={":votes": votes}
    )


def update_status(transaction_id: str, status: str):
    """Update transaction status"""
    transactions_table.update_item(
        Key={"transactionID": transaction_id},
        UpdateExpression="SET #status = :status",
        ExpressionAttributeNames={"#status": "status"},
        ExpressionAttributeValues={":status": status}
    )


def get_votes(transaction_id: str) -> dict:
    """Get all votes for a transaction"""
    transaction = get_transaction(transaction_id)
    return transaction.get("votes", {}) if transaction else {}


def count_votes(transaction_id: str) -> tuple:
    """
    Count approve and reject votes
    
    Returns:
        tuple: (approve_count, reject_count)
    """
    votes = get_votes(transaction_id)
    approve_count = sum(1 for v in votes.values() if v == "approve")
    reject_count = sum(1 for v in votes.values() if v == "reject")
    return approve_count, reject_count


def has_user_voted(transaction_id: str, user_id: str) -> bool:
    """Check if user has already voted on transaction"""
    votes = get_votes(transaction_id)
    return user_id in votes


def get_user_transaction_history(group_ids: list) -> list:
    """
    Get all transactions for user's groups
    
    Args:
        group_ids: List of group IDs user belongs to
        
    Returns:
        list: List of all transactions from user's groups, sorted by date
    """
    all_transactions = []
    
    for group_id in group_ids:
        try:
            # Try using GSI if available
            transactions = get_group_transactions(group_id)
            all_transactions.extend(transactions)
        except Exception as e:
            # If GSI doesn't exist, scan the table (slower but works)
            print(f"Warning: GSI not available, using scan for group {group_id}: {e}")
            response = transactions_table.scan(
                FilterExpression="groupID = :gid",
                ExpressionAttributeValues={":gid": group_id}
            )
            all_transactions.extend(response.get("Items", []))
    
    # Sort by createdAt date, newest first
    all_transactions.sort(key=lambda x: x.get("createdAt", ""), reverse=True)
    
    return all_transactions
