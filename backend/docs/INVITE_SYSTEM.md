# Invite System Documentation

## Overview

The invite system allows ranch (group) owners to invite other users to join their ranches via email. Users receive pending invites, can accept or decline them, and upon acceptance are automatically added as members.

## Architecture

### Database Layer (`db/invites.py`)

**Table: Invites**
- Primary Key: `inviteID` (UUID)
- Attributes:
  - `inviteID`: Unique identifier for the invite
  - `groupID`: Ranch/group the user is being invited to
  - `inviterID`: User ID of who sent the invite
  - `inviteeEmail`: Email address of the person being invited
  - `status`: `pending`, `accepted`, or `declined`
  - `createdAt`: ISO timestamp of when invite was created

**Global Secondary Indexes:**
1. `inviteeEmail-index` - Query invites by recipient email
2. `groupID-index` - Query all invites for a specific group

### API Layer (`routes/invite_routes.py`)

All invite endpoints require authentication via JWT token in the `Authorization: Bearer <token>` header.

## API Endpoints

### 1. Create Invite
**POST** `/invites`

Send an invite to a user by email.

**Authorization:** Only group owners can send invites

**Request Body:**
```json
{
  "groupId": "uuid-of-group",
  "inviteeEmail": "user@example.com"
}
```

**Response (200 OK):**
```json
{
  "inviteID": "uuid",
  "groupID": "uuid",
  "inviterID": "uuid",
  "inviteeEmail": "user@example.com",
  "status": "pending",
  "createdAt": "2025-10-25T23:12:29.866996"
}
```

**Errors:**
- `403 Forbidden` - Only group owners can send invites
- `400 Bad Request` - Invite already sent to this email

**Example:**
```bash
curl -X POST http://localhost:8080/invites \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "groupId": "3b221c16-d8c4-4471-be0b-513822b7d85d",
    "inviteeEmail": "wendy@wildwest.com"
  }'
```

---

### 2. Get My Invites
**GET** `/invites`

Get all pending invites for the current user's email.

**Response (200 OK):**
```json
[
  {
    "inviteID": "uuid",
    "groupID": "uuid",
    "inviterID": "uuid",
    "inviteeEmail": "your@email.com",
    "status": "pending",
    "createdAt": "2025-10-25T23:12:29.866996"
  }
]
```

**Example:**
```bash
curl -X GET http://localhost:8080/invites \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

### 3. Get Group Invites
**GET** `/invites/group/{group_id}`

Get all invites for a specific group.

**Authorization:** Only group owners can view group invites

**Response (200 OK):**
```json
[
  {
    "inviteID": "uuid",
    "groupID": "uuid",
    "inviterID": "uuid",
    "inviteeEmail": "user@example.com",
    "status": "pending",
    "createdAt": "2025-10-25T23:12:29.866996"
  }
]
```

**Errors:**
- `403 Forbidden` - Only group owners can view group invites

**Example:**
```bash
curl -X GET http://localhost:8080/invites/group/3b221c16-d8c4-4471-be0b-513822b7d85d \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

### 4. Accept Invite
**POST** `/invites/{invite_id}/accept`

Accept a pending invite and join the group.

**Authorization:** Invite must be for the current user's email

**Response (200 OK):**
```json
{
  "message": "Invite accepted successfully",
  "groupId": "uuid"
}
```

**What happens:**
1. User is added to the group's `members` list
2. Group is added to the user's `groups` list
3. Invite status is updated to `accepted`

**Errors:**
- `404 Not Found` - Invite doesn't exist
- `403 Forbidden` - Invite is not for you
- `400 Bad Request` - Invite already accepted/declined
- `500 Internal Server Error` - Failed to add member

**Example:**
```bash
curl -X POST http://localhost:8080/invites/079441de-f9c8-42dd-8996-cbb4779fd8e9/accept \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

### 5. Decline Invite
**POST** `/invites/{invite_id}/decline`

Decline a pending invite.

**Authorization:** Invite must be for the current user's email

**Response (200 OK):**
```json
{
  "message": "Invite declined"
}
```

**Errors:**
- `404 Not Found` - Invite doesn't exist
- `403 Forbidden` - Invite is not for you
- `400 Bad Request` - Invite already accepted/declined

**Example:**
```bash
curl -X POST http://localhost:8080/invites/079441de-f9c8-42dd-8996-cbb4779fd8e9/decline \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

### 6. Cancel Invite
**DELETE** `/invites/{invite_id}`

Cancel/delete a pending invite.

**Authorization:** Only the inviter or group owner can cancel

**Response (200 OK):**
```json
{
  "message": "Invite cancelled successfully"
}
```

**Errors:**
- `404 Not Found` - Invite doesn't exist
- `403 Forbidden` - Only inviter/owner can cancel
- `500 Internal Server Error` - Failed to delete invite

**Example:**
```bash
curl -X DELETE http://localhost:8080/invites/079441de-f9c8-42dd-8996-cbb4779fd8e9 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Complete Flow Example

### Scenario: Rick invites Wendy to his ranch

**1. Rick creates a ranch:**
```bash
# Rick's token stored in $RICK_TOKEN
curl -X POST http://localhost:8080/groups \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $RICK_TOKEN" \
  -d '{"name": "Wild West Ranch"}'

# Response includes groupId: "3b221c16-..."
```

**2. Rick sends invite to Wendy:**
```bash
curl -X POST http://localhost:8080/invites \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $RICK_TOKEN" \
  -d '{
    "groupId": "3b221c16-d8c4-4471-be0b-513822b7d85d",
    "inviteeEmail": "wendy@wildwest.com"
  }'

# Response includes inviteID: "079441de-..."
```

**3. Wendy checks her invites:**
```bash
# Wendy's token stored in $WENDY_TOKEN
curl -X GET http://localhost:8080/invites \
  -H "Authorization: Bearer $WENDY_TOKEN"

# Response shows 1 pending invite to Wild West Ranch
```

**4. Wendy accepts the invite:**
```bash
curl -X POST http://localhost:8080/invites/079441de-f9c8-42dd-8996-cbb4779fd8e9/accept \
  -H "Authorization: Bearer $WENDY_TOKEN"

# Response: "Invite accepted successfully"
```

**5. Wendy verifies she's in the group:**
```bash
curl -X GET http://localhost:8080/groups \
  -H "Authorization: Bearer $WENDY_TOKEN"

# Response shows Wild West Ranch in her groups
```

**6. Rick verifies Wendy is a member:**
```bash
curl -X GET http://localhost:8080/groups \
  -H "Authorization: Bearer $RICK_TOKEN"

# Response shows Wild West Ranch with 2 members
```

---

## Database Operations

### Core Functions (`db/invites.py`)

#### `create_invite(group_id, inviter_id, invitee_email)`
Creates a new invite with status "pending"

**Returns:** Invite dict with all fields

---

#### `get_invite(invite_id)`
Retrieves a single invite by ID

**Returns:** Invite dict or None

---

#### `get_user_invites(email)`
Gets all invites for a specific email address using the `inviteeEmail-index` GSI

**Returns:** List of invite dicts

---

#### `get_group_invites(group_id)`
Gets all invites for a specific group using the `groupID-index` GSI

**Returns:** List of invite dicts

---

#### `update_invite_status(invite_id, status)`
Updates the status of an invite to "accepted" or "declined"

**Returns:** None

---

#### `delete_invite(invite_id)`
Permanently deletes an invite

**Returns:** True on success, False on failure

---

#### `check_existing_invite(group_id, email)`
Checks if a pending invite already exists for this email/group combination

**Returns:** Existing invite dict or None

---

## Models (`models.py`)

### InviteCreate
Request model for creating invites
```python
{
  "groupId": str,          # Required
  "inviteeEmail": EmailStr # Required, validated email format
}
```

### InviteResponse
Response model for invite data
```python
{
  "inviteID": str,
  "groupID": str,
  "inviterID": str,
  "inviteeEmail": str,
  "status": str,          # "pending", "accepted", or "declined"
  "createdAt": str        # ISO timestamp
}
```

---

## Security & Authorization

### Authentication
- All endpoints require valid JWT token in Authorization header
- Token format: `Bearer <token>`
- Token contains: `sub` (user ID), `email`, `iat` (issued at)

### Authorization Rules
1. **Create Invite:** Must be group owner
2. **Get My Invites:** Can only see your own invites (matched by email)
3. **Get Group Invites:** Must be group owner
4. **Accept/Decline:** Invite must be for your email address
5. **Cancel Invite:** Must be the inviter OR group owner

---

## Testing

Run the complete test suite:
```bash
# Test script creates 2 users, 1 ranch, sends invite, accepts it
# See CHECKLIST.md or run manual tests with curl commands above
```

### Manual Test Checklist
- [ ] Create user 1 and ranch
- [ ] Create user 2
- [ ] User 1 sends invite to user 2's email
- [ ] User 2 sees invite in GET /invites
- [ ] User 2 accepts invite
- [ ] User 2 sees ranch in GET /groups
- [ ] User 1 sees user 2 in members list
- [ ] Try declining an invite
- [ ] Try canceling a pending invite as owner
- [ ] Test error cases (unauthorized, not found, etc.)

---

## Common Issues & Solutions

### Issue: User can't see group after accepting invite
**Cause:** The `add_group_to_user()` function wasn't called
**Solution:** Both `groups.add_member()` AND `users.add_group_to_user()` must be called

### Issue: Can't send invite - "Only group owners can send invites"
**Cause:** User is not the group owner (createdBy field)
**Solution:** Verify user created the group, check `groups.is_owner()`

### Issue: Duplicate invites created
**Cause:** Not checking for existing invites before creating
**Solution:** Currently commented out in routes, add back `check_existing_invite()` call

### Issue: Field name mismatches (inviteID vs inviteId)
**Cause:** DynamoDB uses uppercase ID, Pydantic models must match
**Solution:** All models use uppercase: `inviteID`, `groupID`, `inviterID`

---

## Integration with Frontend

See `frontend/FRONTEND_INTEGRATION.md` for TypeScript types and React Native integration examples.

### Key TypeScript Types
```typescript
interface InviteCreate {
  groupId: string;
  inviteeEmail: string;
}

interface Invite {
  inviteID: string;
  groupID: string;
  inviterID: string;
  inviteeEmail: string;
  status: 'pending' | 'accepted' | 'declined';
  createdAt: string;
}
```

---

## Future Enhancements

Potential improvements to consider:

1. **Email Notifications:** Send actual emails when invites are created
2. **Invite Expiration:** Auto-decline invites after X days
3. **Bulk Invites:** Invite multiple users at once
4. **Invite Links:** Generate shareable links instead of email-based invites
5. **Invite Limits:** Limit number of pending invites per group
6. **Rich Invites:** Include group info (name, member count) in invite object
7. **Revoke on Leave:** Auto-decline invites if user leaves another group
8. **Duplicate Prevention:** Re-enable check for existing invites before creating

---

## Related Documentation

- `ARCHITECTURE.md` - Overall system architecture
- `QUICK_REFERENCE.md` - API quick reference for all endpoints
- `FRONTEND_INTEGRATION.md` - Frontend integration guide
- `CHECKLIST.md` - Feature implementation checklist
