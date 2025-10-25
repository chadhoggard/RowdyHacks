"""
Transaction routes
Handles transaction proposals and voting
"""
from fastapi import APIRouter, HTTPException, Depends, Query
from models import TransactionCreate, TransactionVote, VoteResponse
from auth import verify_token
from db import transactions, groups

router = APIRouter(prefix="/transactions", tags=["Transactions"])


@router.post("", response_model=dict)
def propose_transaction(body: TransactionCreate, token: dict = Depends(verify_token)):
    """
    Propose a new transaction
    
    - Must be a member of the group
    - Transaction starts in "pending" status
    """
    user_id = token["sub"]
    
    # Get group
    group = groups.get_group(body.groupId)
    if not group:
        raise HTTPException(404, "Group not found")
    
    # Check membership
    if not groups.is_member(body.groupId, user_id):
        raise HTTPException(403, "You are not a member of this group")
    
    # Create transaction
    transaction = transactions.create_transaction(
        group_id=body.groupId,
        user_id=user_id,
        amount=body.amount,
        description=body.description
    )
    
    return {
        "transactionId": transaction["transactionID"],
        "message": "Transaction proposed successfully",
        "status": "pending"
    }


@router.get("", response_model=dict)
def get_transactions(groupId: str = Query(...), token: dict = Depends(verify_token)):
    """
    Get all transactions for a group
    
    - Must be a member of the group
    """
    user_id = token["sub"]
    
    # Get group
    group = groups.get_group(groupId)
    if not group:
        raise HTTPException(404, "Group not found")
    
    # Check membership
    if not groups.is_member(groupId, user_id):
        raise HTTPException(403, "You are not a member of this group")
    
    # Get transactions
    group_transactions = transactions.get_group_transactions(groupId)
    
    return {"transactions": group_transactions}


@router.get("/{transaction_id}", response_model=dict)
def get_transaction_details(transaction_id: str, token: dict = Depends(verify_token)):
    """
    Get details of a specific transaction
    
    - Must be a member of the group
    """
    user_id = token["sub"]
    
    # Get transaction
    transaction = transactions.get_transaction(transaction_id)
    if not transaction:
        raise HTTPException(404, "Transaction not found")
    
    # Check membership
    if not groups.is_member(transaction["groupID"], user_id):
        raise HTTPException(403, "You are not a member of this group")
    
    return {"transaction": transaction}


@router.post("/{transaction_id}/vote", response_model=VoteResponse)
def vote_on_transaction(
    transaction_id: str,
    body: TransactionVote,
    token: dict = Depends(verify_token)
):
    """
    Vote on a transaction (approve or reject)
    
    - Must be a member of the group
    - Cannot vote twice
    - Auto-executes if majority approves
    - Auto-rejects if majority rejects
    """
    user_id = token["sub"]
    
    # Get transaction
    transaction = transactions.get_transaction(transaction_id)
    if not transaction:
        raise HTTPException(404, "Transaction not found")
    
    group_id = transaction["groupID"]
    
    # Get group
    group = groups.get_group(group_id)
    if not group:
        raise HTTPException(404, "Group not found")
    
    # Check membership
    if not groups.is_member(group_id, user_id):
        raise HTTPException(403, "You are not a member of this group")
    
    # Check if already voted
    if transactions.has_user_voted(transaction_id, user_id):
        raise HTTPException(400, "You have already voted on this transaction")
    
    # Record vote
    transactions.record_vote(transaction_id, user_id, body.vote)
    
    # Count votes
    approve_count, reject_count = transactions.count_votes(transaction_id)
    total_members = len(group["members"])
    
    # Check if voting is complete
    new_status = transaction["status"]
    threshold = total_members / 2
    
    if approve_count > threshold:
        new_status = "approved"
        transactions.update_status(transaction_id, "approved")
        # TODO: Execute transaction (update balance)
    elif reject_count > threshold:
        new_status = "rejected"
        transactions.update_status(transaction_id, "rejected")
    
    return VoteResponse(
        message="Vote recorded",
        status=new_status,
        votes=transactions.get_votes(transaction_id),
        approveCount=approve_count,
        rejectCount=reject_count,
        totalMembers=total_members
    )
