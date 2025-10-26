#!/usr/bin/env python3
"""Test script to check if we can fetch all users from the database"""

from app.db import users

all_users = users.get_all_users()
print(f'\n✅ Total users in database: {len(all_users)}\n')

for user in all_users:
    print(f'  👤 {user.get("username")} ({user.get("email")})')
    print(f'     ID: {user.get("userID")}')
    print(f'     Groups: {user.get("groups", [])}')
    print()
