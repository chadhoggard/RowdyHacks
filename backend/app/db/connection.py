"""
Database connection setup
Initializes DynamoDB resource for the application
"""
import boto3
from ..config import AWS_REGION, DYNAMODB_ENDPOINT, USERS_TABLE, GROUPS_TABLE, TRANSACTIONS_TABLE


# Initialize DynamoDB resource
ddb = boto3.resource(
    "dynamodb",
    region_name=AWS_REGION,
    endpoint_url=DYNAMODB_ENDPOINT
)

# Table references
users_table = ddb.Table(USERS_TABLE)
groups_table = ddb.Table(GROUPS_TABLE)
transactions_table = ddb.Table(TRANSACTIONS_TABLE)
