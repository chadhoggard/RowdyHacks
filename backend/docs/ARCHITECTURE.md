.># 🏗️ Backend Architecture Visualization

## 📊 Request Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT REQUEST                           │
│                  (Mobile App / Web Browser)                      │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                          MAIN.PY                                 │
│                      (Server Startup)                            │
│  - Starts FastAPI                                                │
│  - Registers routes                                              │
│  - Handles CORS                                                  │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    ROUTES LAYER (API)                            │
│  ┌────────────────┬────────────────┬─────────────────────┐      │
│  │  auth_routes   │  group_routes  │  transaction_routes │      │
│  │  /signup       │  /groups       │  /transactions      │      │
│  │  /login        │  /groups/{id}  │  /transactions/vote │      │
│  └───────┬────────┴───────┬────────┴───────┬─────────────┘      │
└──────────┼────────────────┼────────────────┼────────────────────┘
           │                │                │
           ▼                ▼                ▼
┌─────────────────────────────────────────────────────────────────┐
│                      AUTH MIDDLEWARE                             │
│  - Verify JWT token                                              │
│  - Extract user ID                                               │
│  - Check permissions                                             │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                     MODELS LAYER                                 │
│  - Validate request data (Pydantic)                              │
│  - Auto-reject bad data                                          │
│  - Generate API docs                                             │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    DATABASE LAYER (db/)                          │
│  ┌────────────────┬────────────────┬─────────────────────┐      │
│  │   users.py     │   groups.py    │  transactions.py    │      │
│  │  - create_user │  - create_group│  - create_tx        │      │
│  │  - get_user    │  - add_member  │  - record_vote      │      │
│  │  - verify_pwd  │  - update_bal  │  - count_votes      │      │
│  └───────┬────────┴───────┬────────┴───────┬─────────────┘      │
└──────────┼────────────────┼────────────────┼────────────────────┘
           │                │                │
           └────────────────┴────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                       DYNAMODB                                   │
│  ┌───────────────┬───────────────┬────────────────────┐         │
│  │  Users Table  │  Groups Table │  Transactions Table│         │
│  │  - userID     │  - groupID    │  - transactionID   │         │
│  │  - email      │  - members    │  - votes           │         │
│  │  - groups     │  - balance    │  - status          │         │
│  └───────────────┴───────────────┴────────────────────┘         │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔄 Example: Creating a Group

```
1. CLIENT
   POST /groups
   Headers: { Authorization: "Bearer <token>" }
   Body: { "name": "Weekend Warriors" }
   
2. MAIN.PY
   Routes request to group_routes.py
   
3. group_routes.py
   @router.post("")
   def create_group(...)
   
4. AUTH.PY
   verify_token() → extracts user_id
   
5. MODELS.PY
   GroupCreate validates name (3-100 chars)
   
6. groups.py (DATABASE)
   create_group(user_id, name)
   → Saves to DynamoDB
   
7. users.py (DATABASE)
   add_group_to_user(user_id, group_id)
   → Updates user's groups list
   
8. RESPONSE
   { "groupId": "abc123", "name": "Weekend Warriors" }
```

---

## 🗳️ Example: Voting on Transaction

```
1. CLIENT
   POST /transactions/{id}/vote
   Body: { "vote": "approve" }
   
2. transaction_routes.py
   - Verify token → get user_id
   - Check if member of group
   - Check if already voted
   
3. transactions.py (DATABASE)
   - record_vote(tx_id, user_id, "approve")
   - count_votes(tx_id) → (3 approve, 1 reject)
   
4. BUSINESS LOGIC
   total_members = 5
   threshold = 5 / 2 = 2.5
   approve_count = 3 > 2.5 ✅
   → Status changes to "approved"
   
5. transactions.py
   update_status(tx_id, "approved")
   
6. RESPONSE
   {
     "status": "approved",
     "approveCount": 3,
     "rejectCount": 1,
     "totalMembers": 5
   }
```

---

## 📁 File Responsibility Matrix

| Layer | Files | Responsibility |
|-------|-------|----------------|
| **Entry** | `main.py` | Start server, register routes |
| **Config** | `config.py` | Environment variables, settings |
| **Security** | `auth.py` | Token verification, permissions |
| **Validation** | `models.py` | Request/response schemas |
| **API** | `routes/*.py` | HTTP endpoints, business logic |
| **Data** | `db/*.py` | Database operations (CRUD) |
| **Storage** | DynamoDB | Persistent data storage |

---

## 🔐 Security Flow

```
┌──────────────────────────────────────────┐
│         User sends request               │
│  Authorization: Bearer eyJhbG...         │
└─────────────┬────────────────────────────┘
              │
              ▼
┌──────────────────────────────────────────┐
│         auth.py: verify_token()          │
│  1. Extract token from header            │
│  2. Decode JWT with secret               │
│  3. Verify signature                     │
│  4. Check expiration                     │
└─────────────┬────────────────────────────┘
              │
              ├─ Valid ✅
              │   └─> Returns: {"sub": "user123", "email": "..."}
              │
              └─ Invalid ❌
                  └─> Raises: HTTPException(401, "Invalid token")
```

---

## 🎯 Data Flow: Deposit Money

```
User Action: "Add $50 to group"
                 │
                 ▼
POST /groups/abc123/deposit
Body: {"amount": 50}
                 │
                 ▼
         auth.py verifies token
         user_id = "user123"
                 │
                 ▼
    models.py validates amount > 0
                 │
                 ▼
   Check: Is user123 in group abc123?
   groups.is_member(abc123, user123) ✅
                 │
                 ▼
   groups.update_balance(abc123, +50)
   → balance: 200 → 250
                 │
                 ▼
   Return: {"newBalance": 250}
```

---

## 🏆 Why This Structure Works

### ✅ **Separation of Concerns**
- Each layer does ONE thing
- Easy to understand
- Easy to test

### ✅ **DRY (Don't Repeat Yourself)**
- Database functions reused across routes
- Auth middleware reused for all protected routes
- Models reused for validation

### ✅ **Single Responsibility**
- `auth.py` → ONLY security
- `db/users.py` → ONLY user database
- `routes/group_routes.py` → ONLY group API

### ✅ **Easy to Debug**
```
Error in voting?
1. Check routes/transaction_routes.py (business logic)
2. Check db/transactions.py (database query)
3. Check logs
```

### ✅ **Team Collaboration**
```
Chad:     Works in db/*.py
You:      Works in routes/*.py
Frontend: Calls API endpoints
Result:   No merge conflicts!
```

---

## 🚀 Scalability Path

**Today:**
```
3 tables, 10 endpoints
All files < 200 lines
```

**After Hackathon:**
```
Add: routes/notification_routes.py
Add: db/notifications.py
Add: routes/analytics_routes.py
No changes to existing files!
```

**Production:**
```
Add: middleware/rate_limiter.py
Add: utils/email_service.py
Add: routes/admin_routes.py
Structure stays clean!
```

---

**This architecture scales from hackathon to production! 🎉**
