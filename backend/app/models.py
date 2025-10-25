"""
Pydantic models for request/response validation
Ensures data integrity and automatic API documentation
"""
from pydantic import BaseModel, EmailStr, Field
from typing import List, Dict, Optional


# ============== AUTH MODELS ==============

class SignupRequest(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    email: EmailStr
    password: str = Field(..., min_length=6)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class AuthResponse(BaseModel):
    userId: str
    username: str
    token: str
    role: str = "member"


# ============== GROUP MODELS ==============

class GroupCreate(BaseModel):
    name: str = Field(..., min_length=3, max_length=100)


class GroupResponse(BaseModel):
    groupId: str
    name: str
    members: List[str]
    createdBy: str
    balance: float
    status: str
    createdAt: str


class AddMemberRequest(BaseModel):
    userId: str


# ============== TRANSACTION MODELS ==============

class TransactionCreate(BaseModel):
    groupId: str
    amount: float = Field(..., gt=0)
    description: str = Field(..., min_length=1, max_length=500)


class TransactionVote(BaseModel):
    vote: str = Field(..., pattern="^(approve|reject)$")


class TransactionResponse(BaseModel):
    transactionId: str
    groupId: str
    amount: float
    description: str
    proposedBy: str
    status: str
    votes: Dict[str, str]
    createdAt: str


class VoteResponse(BaseModel):
    message: str
    status: str
    votes: Dict[str, str]
    approveCount: int
    rejectCount: int
    totalMembers: int