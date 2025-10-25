"""
Configuration settings for TrustVault API
All environment variables and constants in one place
"""
import os
from dotenv import load_dotenv

load_dotenv()

# Database Configuration
DYNAMODB_ENDPOINT = os.getenv("DYNAMODB_ENDPOINT", None)  # None = use real AWS
AWS_REGION = os.getenv("AWS_REGION", "us-east-1")

# Table Names
USERS_TABLE = os.getenv("USERS_TABLE", "Users")
GROUPS_TABLE = os.getenv("GROUPS_TABLE", "Groups")
TRANSACTIONS_TABLE = os.getenv("TRANSACTIONS_TABLE", "Transactions")
INVITES_TABLE = os.getenv("INVITES_TABLE", "Invites")

# User Table Attributes
USER_PK_ATTR = os.getenv("USER_PK_ATTR", "userId")

# Authentication
JWT_SECRET = os.getenv("JWT_SECRET", "dev-secret-change-in-prod")
JWT_ALGORITHM = "HS256"
JWT_EXPIRY_HOURS = 24

# Business Rules
MIN_GROUP_MEMBERS = 2
MAX_GROUP_MEMBERS = 50
MIN_TRANSACTION_AMOUNT = 1.0
VOTING_THRESHOLD = 0.5  # 50% majority
