# 🎯 Quick Reference: Where to Add New Features

## 🆕 Adding a New API Endpoint

### Example: Add "Get Group Balance" endpoint

**Step 1: Add DB function** (Chad does this)
```python
# File: app/db/groups.py

def get_detailed_balance(group_id: str) -> dict:
    """Get balance with transaction history"""
    group = get_group(group_id)
    # ... your logic
    return {"balance": group["balance"], "history": [...]}
```

**Step 2: Add API endpoint** (You do this)
```python
# File: app/routes/group_routes.py

@router.get("/{group_id}/balance")
def get_balance(group_id: str, token: dict = Depends(verify_token)):
    """Get current balance"""
    user_id = token["sub"]
    
    # Check membership
    if not groups.is_member(group_id, user_id):
        raise HTTPException(403, "Not a member")
    
    # Use Chad's function
    balance_data = groups.get_detailed_balance(group_id)
    return balance_data
```

**Done!** Endpoint available at `GET /groups/{id}/balance`

---

## 🔒 Adding Permission Checks

```python
# File: app/routes/group_routes.py

@router.delete("/{group_id}")
def delete_group(group_id: str, token: dict = Depends(verify_token)):
    user_id = token["sub"]
    
    # Check if owner
    if not groups.is_owner(group_id, user_id):
        raise HTTPException(403, "Only owner can delete group")
    
    # Delete logic...
```

---

## 📊 Adding Request Validation

```python
# File: app/models.py

class DepositRequest(BaseModel):
    amount: float = Field(..., gt=0, le=10000)  # $0 < amount <= $10,000
    note: Optional[str] = Field(None, max_length=200)
```

```python
# File: app/routes/group_routes.py

@router.post("/{group_id}/deposit")
def deposit(group_id: str, body: DepositRequest, token: dict = Depends(verify_token)):
    # body is automatically validated!
    groups.update_balance(group_id, body.amount)
```

---

## 🗄️ Adding a New Database Table

**Step 1: Add to config**
```python
# File: app/config.py

NOTIFICATIONS_TABLE = "Notifications"
```

**Step 2: Add to connection**
```python
# File: app/db/connection.py

notifications_table = ddb.Table(NOTIFICATIONS_TABLE)
```

**Step 3: Create operations file**
```python
# File: app/db/notifications.py

from app.db.connection import notifications_table

def create_notification(user_id, message):
    # ... implementation
```

**Step 4: Create routes file**
```python
# File: app/routes/notification_routes.py

router = APIRouter(prefix="/notifications", tags=["Notifications"])

@router.get("")
def get_notifications(token: dict = Depends(verify_token)):
    # ... implementation
```

**Step 5: Register in main**
```python
# File: app/main.py

from app.routes import notification_routes

app.include_router(notification_routes.router)
```

---

## 🎨 Common Patterns

### **Check if user is group member:**
```python
if not groups.is_member(group_id, user_id):
    raise HTTPException(403, "Not a member")
```

### **Check if user is group owner:**
```python
if not groups.is_owner(group_id, user_id):
    raise HTTPException(403, "Only owner can do this")
```

### **Get user from token:**
```python
def my_endpoint(token: dict = Depends(verify_token)):
    user_id = token["sub"]
    user_email = token["email"]
```

### **Return custom error:**
```python
raise HTTPException(
    status_code=400,
    detail="Amount must be positive"
)
```

---

## 📝 File Organization Cheat Sheet

| Want to... | Edit this file |
|------------|----------------|
| Add environment variable | `config.py` |
| Verify tokens | `auth.py` |
| Add request validation | `models.py` |
| Add user database operation | `db/users.py` |
| Add group database operation | `db/groups.py` |
| Add transaction database operation | `db/transactions.py` |
| Add auth endpoint | `routes/auth_routes.py` |
| Add group endpoint | `routes/group_routes.py` |
| Add transaction endpoint | `routes/transaction_routes.py` |
| Register new routes | `main.py` |

---

## 🚀 Testing Your Changes

### **1. Restart Docker:**
```bash
sudo docker compose down
sudo docker compose up --build -d
```

### **2. Check logs:**
```bash
sudo docker compose logs -f backend
```

### **3. Test in browser:**
```
http://localhost:8080/docs
```

### **4. Test with curl:**
```bash
# Get token
TOKEN=$(curl -X POST http://localhost:8080/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}' \
  | jq -r '.token')

# Use token
curl http://localhost:8080/groups \
  -H "Authorization: Bearer $TOKEN"
```

---

## 💡 Pro Tips

1. **Always use `Depends(verify_token)`** for protected routes
2. **Use Pydantic models** for validation (never `dict`)
3. **Add docstrings** to functions - shows up in `/docs`
4. **Test one endpoint at a time** - easier to debug
5. **Check logs** if something breaks - they're very helpful!

---

**Questions? Check `/docs` or ask!** 🎉
