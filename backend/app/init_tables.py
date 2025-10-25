"""
Initialize DynamoDB tables for TrustVault
Run this script to create the Users, Groups, and Transactions tables
"""
import boto3
from .config import (
    DYNAMODB_ENDPOINT,
    AWS_REGION,
    USERS_TABLE,
    GROUPS_TABLE,
    TRANSACTIONS_TABLE
)


def create_tables():
    """Create all required DynamoDB tables"""
    dynamodb = boto3.resource(
        'dynamodb',
        endpoint_url=DYNAMODB_ENDPOINT,
        region_name=AWS_REGION
    )
    
    # Create Users table
    try:
        users_table = dynamodb.create_table(
            TableName=USERS_TABLE,
            KeySchema=[
                {'AttributeName': 'userId', 'KeyType': 'HASH'}  # Partition key
            ],
            AttributeDefinitions=[
                {'AttributeName': 'userId', 'AttributeType': 'S'},
                {'AttributeName': 'email', 'AttributeType': 'S'}
            ],
            GlobalSecondaryIndexes=[
                {
                    'IndexName': 'email-index',
                    'KeySchema': [
                        {'AttributeName': 'email', 'KeyType': 'HASH'}
                    ],
                    'Projection': {'ProjectionType': 'ALL'},
                    'ProvisionedThroughput': {
                        'ReadCapacityUnits': 5,
                        'WriteCapacityUnits': 5
                    }
                }
            ],
            ProvisionedThroughput={
                'ReadCapacityUnits': 5,
                'WriteCapacityUnits': 5
            }
        )
        print(f"✓ Created table: {USERS_TABLE}")
    except Exception as e:
        if 'ResourceInUseException' in str(e):
            print(f"✓ Table already exists: {USERS_TABLE}")
        else:
            print(f"✗ Error creating {USERS_TABLE}: {e}")
    
    # Create Groups table
    try:
        groups_table = dynamodb.create_table(
            TableName=GROUPS_TABLE,
            KeySchema=[
                {'AttributeName': 'groupId', 'KeyType': 'HASH'}
            ],
            AttributeDefinitions=[
                {'AttributeName': 'groupId', 'AttributeType': 'S'}
            ],
            ProvisionedThroughput={
                'ReadCapacityUnits': 5,
                'WriteCapacityUnits': 5
            }
        )
        print(f"✓ Created table: {GROUPS_TABLE}")
    except Exception as e:
        if 'ResourceInUseException' in str(e):
            print(f"✓ Table already exists: {GROUPS_TABLE}")
        else:
            print(f"✗ Error creating {GROUPS_TABLE}: {e}")
    
    # Create Transactions table
    try:
        transactions_table = dynamodb.create_table(
            TableName=TRANSACTIONS_TABLE,
            KeySchema=[
                {'AttributeName': 'transactionId', 'KeyType': 'HASH'}
            ],
            AttributeDefinitions=[
                {'AttributeName': 'transactionId', 'AttributeType': 'S'},
                {'AttributeName': 'groupId', 'AttributeType': 'S'}
            ],
            GlobalSecondaryIndexes=[
                {
                    'IndexName': 'group-index',
                    'KeySchema': [
                        {'AttributeName': 'groupId', 'KeyType': 'HASH'}
                    ],
                    'Projection': {'ProjectionType': 'ALL'},
                    'ProvisionedThroughput': {
                        'ReadCapacityUnits': 5,
                        'WriteCapacityUnits': 5
                    }
                }
            ],
            ProvisionedThroughput={
                'ReadCapacityUnits': 5,
                'WriteCapacityUnits': 5
            }
        )
        print(f"✓ Created table: {TRANSACTIONS_TABLE}")
    except Exception as e:
        if 'ResourceInUseException' in str(e):
            print(f"✓ Table already exists: {TRANSACTIONS_TABLE}")
        else:
            print(f"✗ Error creating {TRANSACTIONS_TABLE}: {e}")
    
    print("\n✓ Database initialization complete!")


if __name__ == "__main__":
    create_tables()
