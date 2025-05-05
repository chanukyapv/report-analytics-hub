
from ariadne import convert_kwargs_to_snake_case
from fastapi import HTTPException, status
from datetime import datetime
import jwt
import os

# Mock database for users - replace with your actual database
users_db = {}

# Secret key for JWT
SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-here")
ALGORITHM = "HS256"

def verify_password(plain_password, password_hash):
    # In a real application, use proper password hashing
    return plain_password == password_hash

def get_password_hash(password):
    # In a real application, use proper password hashing
    return password

def create_access_token(data):
    to_encode = data.copy()
    token = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return token

def validate_bt_email(email):
    if not email.endswith("@example.com"):  # Replace with your domain validation
        raise HTTPException(status_code=400, detail="Email domain not allowed")

def serialize_doc(user):
    # Convert MongoDB document to dict and handle _id
    if user and '_id' in user:
        user['id'] = str(user['_id'])
        del user['_id']
    return user

@convert_kwargs_to_snake_case
async def login_resolver(_, info, email, password):
    """Login mutation"""
    # Check if user exists
    user = users_db.get(email)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    # Verify password
    if not verify_password(password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    # Generate JWT token
    token_data = {"sub": user["email"]}
    token = create_access_token(token_data)
    
    # Update last login and login count
    now = datetime.utcnow()
    login_count = user.get("login_count", 0) + 1
    user["last_login"] = now
    user["login_count"] = login_count
    users_db[email] = user
    
    return {
        "token": token,
        "user": user
    }

@convert_kwargs_to_snake_case
async def register_resolver(_, info, input):
    """Register mutation"""
    email = input.get("email")
    password = input.get("password")
    name = input.get("name")
    
    # Validate BT email (optional in this demo)
    try:
        validate_bt_email(email)
    except HTTPException as e:
        print(f"Email validation warning: {str(e.detail)}")
    
    # Check if user exists
    if email in users_db:
        raise HTTPException(status_code=400, detail="User with this email already exists")
    
    # Create user
    now = datetime.utcnow()
    user = {
        "id": f"user_{len(users_db) + 1}",
        "name": name,
        "email": email,
        "password_hash": get_password_hash(password),
        "role": "user",  # Default role
        "is_active": True,  # Set user as active
        "created_at": now,
        "last_login": now,
        "login_count": 1
    }
    
    # Store user in mock DB
    users_db[email] = user
    
    # Generate JWT token
    token_data = {"sub": email}
    token = create_access_token(token_data)
    
    return {
        "token": token,
        "user": user
    }

@convert_kwargs_to_snake_case
async def me_resolver(_, info):
    """Get current user"""
    context = info.context
    request = context["request"]
    auth_header = request.headers.get("Authorization")
    
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    # Get token from header
    token = auth_header.replace("Bearer ", "")
    
    try:
        # Decode JWT
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email = payload.get("sub")
        
        # Get user from database
        user = users_db.get(email)
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        
        return user
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

@convert_kwargs_to_snake_case
async def roles_resolver(_, info):
    """Get available roles"""
    return ["user", "admin", "editor"]
