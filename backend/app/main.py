import os, uuid, datetime, jwt
from fastapi import FastAPI, HTTPException
from passlib.hash import bcrypt
import boto3
from boto3.dynamodb.conditions import Key
import hashlib

USERS_TABLE = os.getenv("USERS_TABLE", "Users")
USER_PK_ATTR = os.getenv("USER_PK_ATTR", "userID")  # match your table key exactly
AWS_REGION   = os.getenv("AWS_REGION", "us-east-1")
JWT_SECRET   = os.getenv("JWT_SECRET", "dev-secret")
JWT_ALG      = "HS256"

ddb   = boto3.resource("dynamodb", region_name=AWS_REGION)
users = ddb.Table(USERS_TABLE)

app = FastAPI()

@app.get("/health")
def health():
    return {"ok": True}

@app.post("/signup")
def signup(body: dict):
    for f in ["username","email","password"]:
        if f not in body or not body[f]:
            raise HTTPException(400, f"Missing {f}")
    # optional: email-index query to prevent duplicates (create the GSI first)
    try:
        res = users.query(IndexName="email-index", KeyConditionExpression=Key("email").eq(body["email"].lower()))
        if res["Items"]:
            raise HTTPException(409, "Email already registered")
    except users.meta.client.exceptions.ResourceNotFoundException:
        pass  # GSI not there yet; skip duplicate check for now

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
    return {"userId": user_id, "token": token}

@app.post("/login")
def login(body: dict):
    # Validate input
    if "email" not in body or "password" not in body:
        raise HTTPException(400, "Missing email or password")
    
    # Query user by email using GSI
    try:
        res = users.query(
            IndexName="email-index",
            KeyConditionExpression=Key("email").eq(body["email"].lower())
        )
        if not res["Items"]:
            raise HTTPException(401, "Invalid credentials")
        
        user = res["Items"][0]
        
        # Verify password
        input_hash = hashlib.sha256(body["password"].encode()).hexdigest()
        if input_hash != user["passwordHash"]:
            raise HTTPException(401, "Invalid credentials")
        
        # Generate JWT token
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
            "token": token
        }
        
    except users.meta.client.exceptions.ResourceNotFoundException:
        raise HTTPException(500, "Database configuration error - email-index not found")