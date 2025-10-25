import os, uuid, datetime, jwt
from fastapi import FastAPI, HTTPException, Header
from typing import Optional
import boto3
from boto3.dynamodb.conditions import Key
import hashlib

USERS_TABLE = os.getenv("USERS_TABLE", "Users")
GROUPS_TABLE = os.getenv("GROUPS_TABLE", "Groups")
TRANSACTIONS_TABLE = os.getenv("TRANSACTIONS_TABLE", "Transactions")
USER_PK_ATTR = os.getenv("USER_PK_ATTR", "userID")
AWS_REGION   = os.getenv("AWS_REGION", "us-east-1")
JWT_SECRET   = os.getenv("JWT_SECRET", "dev-secret")
JWT_ALG      = "HS256"

ddb = boto3.resource("dynamodb", region_name=AWS_REGION)
users = ddb.Table(USERS_TABLE)
groups = ddb.Table(GROUPS_TABLE)
transactions = ddb.Table(TRANSACTIONS_TABLE)

app = FastAPI()

# Helper function to verify JWT token
def verify_token(authorization: Optional[str] = Header(None)):
    print(f"DEBUG: Authorization header: {authorization}")
    
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(401, "Missing or invalid authorization header")
    
    token = authorization.replace("Bearer ", "")
    print(f"DEBUG: Extracted token: {token[:50]}...")
    
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALG], options={"verify_iat": False})
        print(f"DEBUG: Token decoded successfully: {payload}")
        return payload
    except jwt.InvalidTokenError as e:
        print(f"DEBUG: Token decode error: {str(e)}")
        raise HTTPException(401, "Invalid token")

@app.get("/health")
def health():
    return {"ok": True}

@app.post("/signup")
def signup(body: dict):
    for f in ["username","email","password"]:
        if f not in body or not body[f]:
            raise HTTPException(400, f"Missing {f}")
    
    try:
        res = users.query(IndexName="email-index", KeyConditionExpression=Key("email").eq(body["email"].lower()))
        if res["Items"]:
            raise HTTPException(409, "Email already registered")
    except users.meta.client.exceptions.ResourceNotFoundException:
        pass

    user_id = str(uuid.uuid4())
    item = {
        USER_PK_ATTR: user_id,
        "username": body["username"],
        "email": body["email"].lower(),
        "passwordHash": hashlib.sha256(body["password"].encode()).hexdigest(),
        "createdAt": datetime.datetime.utcnow().isoformat(),
        "status": "active",
        "role": "member",
        "groups": []
    }
    users.put_item(Item=item)
    token = jwt.encode({"sub": user_id, "email": item["email"], "iat": int(datetime.datetime.utcnow().timestamp())},
                       JWT_SECRET, algorithm=JWT_ALG)
    return {"userId": user_id, "token": token, "role": "member"}

@app.post("/login")
def login(body: dict):
    if "email" not in body or "password" not in body:
        raise HTTPException(400, "Missing email or password")
    
    try:
        res = users.query(
            IndexName="email-index",
            KeyConditionExpression=Key("email").eq(body["email"].lower())
        )
        if not res["Items"]:
            raise HTTPException(401, "Invalid credentials")
        
        user = res["Items"][0]
        
        input_hash = hashlib.sha256(body["password"].encode()).hexdigest()
        if input_hash != user["passwordHash"]:
            raise HTTPException(401, "Invalid credentials")
        
        token = jwt.encode(
            {
                "sub": user[USER_PK_ATTR],
                "email": user["email"],
                "iat": int(datetime.datetime.utcnow().timestamp())
            },
            JWT_SECRET,
            algorithm=JWT_ALG
        )
        
        return {
            "userId": user[USER_PK_ATTR],
            "username": user["username"],
            "role": user.get("role", "member"),
            "token": token
        }
        
    except users.meta.client.exceptions.ResourceNotFoundException:
        raise HTTPException(500, "Database configuration error - email-index not found")

# ============== GROUP ENDPOINTS ==============

@app.post("/groups")
def create_group(body: dict, authorization: Optional[str] = Header(None)):
    user = verify_token(authorization)
    
    if "name" not in body or not body["name"]:
        raise HTTPException(400, "Missing group name")
    
    group_id = str(uuid.uuid4())
    group_item = {
        "groupID": group_id,
        "name": body["name"],
        "members": [user["sub"]],
        "createdBy": user["sub"],
        "createdAt": datetime.datetime.utcnow().isoformat(),
        "balance": 0,
        "status": "active"
    }
    
    groups.put_item(Item=group_item)
    
    users.update_item(
        Key={USER_PK_ATTR: user["sub"]},
        UpdateExpression="SET #groups = list_append(if_not_exists(#groups, :empty_list), :group_id)",
        ExpressionAttributeNames={"#groups": "groups"},
        ExpressionAttributeValues={
            ":group_id": [group_id],
            ":empty_list": []
        }
    )
    
    return {"groupId": group_id, "name": body["name"], "message": "Group created successfully"}

@app.get("/groups")
def get_user_groups(authorization: Optional[str] = Header(None)):
    user = verify_token(authorization)
    
    user_data = users.get_item(Key={USER_PK_ATTR: user["sub"]})
    if "Item" not in user_data:
        raise HTTPException(404, "User not found")
    
    user_groups = user_data["Item"].get("groups", [])
    
    group_details = []
    for group_id in user_groups:
        group_data = groups.get_item(Key={"groupID": group_id})
        if "Item" in group_data:
            group_details.append(group_data["Item"])
    
    return {"groups": group_details}

@app.post("/groups/{group_id}/members")
def add_member_to_group(group_id: str, body: dict, authorization: Optional[str] = Header(None)):
    user = verify_token(authorization)
    
    if "userId" not in body:
        raise HTTPException(400, "Missing userId")
    
    new_member_id = body["userId"]
    
    group_data = groups.get_item(Key={"groupID": group_id})
    if "Item" not in group_data:
        raise HTTPException(404, "Group not found")
    
    group = group_data["Item"]
    
    if user["sub"] not in group["members"]:
        raise HTTPException(403, "You are not a member of this group")
    
    new_user = users.get_item(Key={USER_PK_ATTR: new_member_id})
    if "Item" not in new_user:
        raise HTTPException(404, "User to add not found")
    
    if new_member_id in group["members"]:
        raise HTTPException(409, "User is already a member")
    
    groups.update_item(
        Key={"groupID": group_id},
        UpdateExpression="SET members = list_append(members, :new_member)",
        ExpressionAttributeValues={":new_member": [new_member_id]}
    )
    
    users.update_item(
        Key={USER_PK_ATTR: new_member_id},
        UpdateExpression="SET #groups = list_append(if_not_exists(#groups, :empty_list), :group_id)",
        ExpressionAttributeNames={"#groups": "groups"},
        ExpressionAttributeValues={
            ":group_id": [group_id],
            ":empty_list": []
        }
    )
    
    return {"message": "Member added successfully"}

# ============== TRANSACTION ENDPOINTS ==============

@app.post("/transactions")
def propose_transaction(body: dict, authorization: Optional[str] = Header(None)):
    user = verify_token(authorization)
    
    required = ["groupId", "amount", "description"]
    for f in required:
        if f not in body:
            raise HTTPException(400, f"Missing {f}")
    
    group_id = body["groupId"]
    
    group_data = groups.get_item(Key={"groupID": group_id})
    if "Item" not in group_data:
        raise HTTPException(404, "Group not found")
    
    group = group_data["Item"]
    if user["sub"] not in group["members"]:
        raise HTTPException(403, "You are not a member of this group")
    
    transaction_id = str(uuid.uuid4())
    transaction_item = {
        "transactionID": transaction_id,
        "groupID": group_id,
        "amount": float(body["amount"]),
        "description": body["description"],
        "proposedBy": user["sub"],
        "status": "pending",
        "votes": {},
        "createdAt": datetime.datetime.utcnow().isoformat()
    }
    
    transactions.put_item(Item=transaction_item)
    
    return {
        "transactionId": transaction_id,
        "message": "Transaction proposed successfully",
        "status": "pending"
    }

@app.get("/transactions")
def get_transactions(groupId: str, authorization: Optional[str] = Header(None)):
    user = verify_token(authorization)
    
    group_data = groups.get_item(Key={"groupID": groupId})
    if "Item" not in group_data:
        raise HTTPException(404, "Group not found")
    
    if user["sub"] not in group_data["Item"]["members"]:
        raise HTTPException(403, "You are not a member of this group")
    
    try:
        res = transactions.query(
            IndexName="groupID-index",
            KeyConditionExpression=Key("groupID").eq(groupId)
        )
        return {"transactions": res["Items"]}
    except transactions.meta.client.exceptions.ResourceNotFoundException:
        raise HTTPException(500, "groupID-index not found on Transactions table")

@app.post("/transactions/{transaction_id}/vote")
def vote_on_transaction(transaction_id: str, body: dict, authorization: Optional[str] = Header(None)):
    user = verify_token(authorization)
    
    if "vote" not in body or body["vote"] not in ["approve", "reject"]:
        raise HTTPException(400, "Missing or invalid vote (must be 'approve' or 'reject')")
    
    tx_data = transactions.get_item(Key={"transactionID": transaction_id})
    if "Item" not in tx_data:
        raise HTTPException(404, "Transaction not found")
    
    tx = tx_data["Item"]
    
    group_data = groups.get_item(Key={"groupID": tx["groupID"]})
    if "Item" not in group_data:
        raise HTTPException(404, "Group not found")
    
    group = group_data["Item"]
    if user["sub"] not in group["members"]:
        raise HTTPException(403, "You are not a member of this group")
    
    votes = tx.get("votes", {})
    votes[user["sub"]] = body["vote"]
    
    total_members = len(group["members"])
    approve_count = sum(1 for v in votes.values() if v == "approve")
    reject_count = sum(1 for v in votes.values() if v == "reject")
    
    new_status = tx["status"]
    if approve_count > total_members / 2:
        new_status = "approved"
    elif reject_count > total_members / 2:
        new_status = "rejected"
    
    transactions.update_item(
        Key={"transactionID": transaction_id},
        UpdateExpression="SET votes = :votes, #status = :status",
        ExpressionAttributeNames={"#status": "status"},
        ExpressionAttributeValues={
            ":votes": votes,
            ":status": new_status
        }
    )
    
    return {
        "message": "Vote recorded",
        "status": new_status,
        "votes": votes,
        "approveCount": approve_count,
        "rejectCount": reject_count,
        "totalMembers": total_members
    }