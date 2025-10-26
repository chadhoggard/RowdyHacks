# TrustVault Backend API Guide for Frontend

**Base URL**: `http://localhost:8080` (local) or `https://your-deployed-url.com` (production)

All authenticated endpoints require: `Authorization: Bearer <JWT_TOKEN>` header

---

## ✅ **AUTHENTICATION**

### POST `/signup`
Create new user account
```json
// Request
{
  "email": "user@example.com",
  "password": "password123",
  "username": "username"
}

// Response 200
{
  "userId": "uuid",
  "username": "username",
  "token": "jwt_token_here"
}
```

### POST `/login`
Login existing user
```json
// Request
{
  "email": "user@example.com",
  "password": "password123"
}

// Response 200
{
  "userId": "uuid",
  "username": "username",
  "token": "jwt_token_here"
}
```

---

## ✅ **USER ENDPOINTS**

### GET `/users/me` 🔒
Get current user profile
```json
// Response 200
{
  "userId": "uuid",
  "username": "string",
  "email": "string",
  "role": "member",
  "status": "active",
  "groups": ["group-id-1", "group-id-2"],
  "createdAt": "ISO8601"
}
```

---

## ✅ **GROUP ENDPOINTS**

### POST `/groups` 🔒
Create new group/ranch
```json
// Request
{
  "name": "My Ranch"
}

// Response 200
{
  "groupId": "uuid",
  "name": "My Ranch",
  "message": "Group created successfully"
}
```

### GET `/groups` 🔒
Get all user's groups
```json
// Response 200
{
  "groups": [
    {
      "groupID": "uuid",
      "name": "Ranch Name",
      "balance": "1000.50",
      "members": ["user-id-1", "user-id-2"],
      "createdBy": "user-id",
      "status": "active",
      "createdAt": "ISO8601"
    }
  ]
}
```

### GET `/groups/:id` 🔒
Get specific group details
```json
// Response 200
{
  "group": {
    "groupID": "uuid",
    "name": "Ranch Name",
    "balance": "1000.50",
    "members": ["user-id-1", "user-id-2"],
    "memberDetails": [
      {
        "userId": "uuid",
        "username": "string",
        "email": "string",
        "role": "member"
      }
    ],
    "createdBy": "user-id",
    "status": "active",
    "createdAt": "ISO8601"
  }
}
```

### GET `/groups/:id/members` 🔒
Get group member details
```json
// Response 200
{
  "members": [
    {
      "userId": "uuid",
      "username": "string",
      "email": "string",
      "role": "member",
      "status": "active",
      "createdAt": "ISO8601",
      "isOwner": true
    }
  ],
  "count": 2,
  "groupId": "uuid",
  "groupName": "Ranch Name"
}
```

### POST `/groups/:id/deposit` 🔒
Deposit money to group
```json
// Request
{
  "amount": 500.00
}

// Response 200
{
  "message": "Deposit successful",
  "amount": 500.0,
  "newBalance": "1500.00"
}
```

### POST `/groups/:id/members` 🔒
Add member to group
```json
// Request
{
  "userId": "user-id-to-add"
}

// Response 200
{
  "message": "Member added successfully"
}
```

### DELETE `/groups/:id/members/:userId` 🔒
Remove member from group
```json
// Response 200
{
  "message": "Member removed successfully"
}
```

---

## ✅ **TRANSACTION ENDPOINTS**

### POST `/transactions` 🔒
Propose new transaction
```json
// Request
{
  "groupId": "group-uuid",
  "amount": 250.00,
  "description": "Purchase supplies"
}

// Response 200
{
  "transactionId": "uuid",
  "message": "Transaction proposed successfully",
  "status": "pending"
}
```

### GET `/transactions?groupId=:id` 🔒
Get all transactions for a group
```json
// Response 200
{
  "transactions": [
    {
      "transactionID": "uuid",
      "groupID": "uuid",
      "userID": "uuid",
      "amount": "250.00",
      "description": "string",
      "status": "pending|approved|rejected|executed",
      "votes": {
        "user-id-1": "approve",
        "user-id-2": "reject"
      },
      "createdAt": "ISO8601"
    }
  ]
}
```

### GET `/transactions/:id` 🔒
Get specific transaction
```json
// Response 200
{
  "transaction": {
    "transactionID": "uuid",
    "groupID": "uuid",
    "userID": "uuid",
    "amount": "250.00",
    "description": "string",
    "status": "pending|approved|rejected|executed",
    "votes": {},
    "createdAt": "ISO8601"
  }
}
```

### POST `/transactions/:id/vote` 🔒
Vote on transaction
```json
// Request
{
  "vote": "approve" // or "reject"
}

// Response 200
{
  "message": "Vote recorded",
  "status": "approved", // updated status
  "votes": {
    "user-id": "approve"
  },
  "approveCount": 2,
  "rejectCount": 0,
  "totalMembers": 3
}
```

### POST `/transactions/:id/execute` 🔒
Execute approved transaction (deduct from balance)
```json
// Response 200
{
  "message": "Transaction executed successfully",
  "transactionId": "uuid",
  "amount": 250.0,
  "previousBalance": 1000.0,
  "newBalance": 750.0,
  "status": "executed"
}

// Error 400 - Not approved
{
  "detail": "Transaction must be approved to execute (current status: pending)"
}

// Error 400 - Insufficient funds
{
  "detail": "Insufficient funds (balance: $100, required: $250)"
}
```

### GET `/transactions/history/me` 🔒
Get user's transaction history across all groups
```json
// Response 200
{
  "transactions": [
    // Array of transaction objects sorted by date (newest first)
  ],
  "count": 15,
  "groups": ["group-id-1", "group-id-2"]
}
```

---

## ✅ **INVITE ENDPOINTS**

### POST `/invites` 🔒
Send invite to email
```json
// Request
{
  "groupId": "group-uuid",
  "inviteeEmail": "invitee@example.com"
}

// Response 200
{
  "inviteId": "uuid",
  "message": "Invite sent successfully"
}
```

### GET `/invites/me` 🔒
Get invites for current user's email
```json
// Response 200
{
  "invites": [
    {
      "inviteID": "uuid",
      "groupID": "uuid",
      "inviterID": "uuid",
      "inviteeEmail": "string",
      "status": "pending|accepted|declined",
      "createdAt": "ISO8601"
    }
  ]
}
```

### GET `/invites/group/:id` 🔒
Get all invites for a group
```json
// Response 200
{
  "invites": [
    // Array of invite objects
  ]
}
```

### POST `/invites/:id/accept` 🔒
Accept invite
```json
// Response 200
{
  "message": "Invite accepted successfully",
  "groupId": "uuid"
}
```

### POST `/invites/:id/decline` 🔒
Decline invite
```json
// Response 200
{
  "message": "Invite declined"
}
```

### DELETE `/invites/:id` 🔒
Cancel invite (inviter only)
```json
// Response 200
{
  "message": "Invite cancelled successfully"
}
```

---

## 🔧 **COMMON ERROR RESPONSES**

```json
// 401 Unauthorized
{
  "detail": "Invalid or missing token"
}

// 403 Forbidden
{
  "detail": "You are not a member of this group"
}

// 404 Not Found
{
  "detail": "Group not found"
}

// 400 Bad Request
{
  "detail": "Validation error message"
}
```

---

## 🚀 **QUICK START FOR FRONTEND**

1. **Login Flow**:
   ```typescript
   // 1. User signs up or logs in
   const response = await fetch('http://localhost:8080/signup', {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({ email, password, username })
   });
   const { token, userId } = await response.json();
   
   // 2. Store token (AsyncStorage in React Native)
   await AsyncStorage.setItem('authToken', token);
   ```

2. **Authenticated Requests**:
   ```typescript
   const token = await AsyncStorage.getItem('authToken');
   const response = await fetch('http://localhost:8080/users/me', {
     headers: { 'Authorization': `Bearer ${token}` }
   });
   ```

3. **Typical User Flow**:
   - Sign up / Log in → Get token
   - GET `/users/me` → Get user profile & groups
   - GET `/groups/:id` → View group details
   - POST `/transactions` → Propose spending
   - POST `/transactions/:id/vote` → Members vote
   - POST `/transactions/:id/execute` → Execute when approved

---

## ✅ **BACKEND STATUS: READY FOR INTEGRATION**

All endpoints tested and working! 🎉

Backend is running on: `http://localhost:8080`
Health check: `http://localhost:8080/health`

For deployment, update the base URL in your frontend config.
