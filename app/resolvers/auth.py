
from ariadne import convert_kwargs_to_snake_case
from fastapi import HTTPException, status
from app.db.mongodb import users_collection, serialize_doc
from app.auth import verify_password, get_password_hash, create_access_token, validate_bt_email
from datetime import datetime

@convert_kwargs_to_snake_case
async def login_resolver(_, info, email, password):
    """Login mutation"""
    # Check if user exists
    user = users_collection.find_one({"email": email})
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
    users_collection.update_one(
        {"_id": user["_id"]},
        {"$set": {"last_login": now, "login_count": login_count}}
    )
    
    # Get updated user
    user = users_collection.find_one({"email": email})
    
    return {
        "token": token,
        "user": serialize_doc(user)
    }

@convert_kwargs_to_snake_case
async def register_resolver(_, info, input):
    """Register mutation"""
    email = input.get("email")
    password = input.get("password")
    name = input.get("name")
    
    # Validate BT email
    try:
        validate_bt_email(email)
    except HTTPException as e:
        raise e
    
    # Check if user exists
    if users_collection.find_one({"email": email}):
        raise HTTPException(status_code=400, detail="User with this email already exists")
    
    # Create user
    now = datetime.utcnow()
    user = {
        "name": name,
        "email": email,
        "password_hash": get_password_hash(password),
        "role": "user",  # Default role
        "created_at": now,
        "last_login": now,
        "login_count": 1
    }
    
    result = users_collection.insert_one(user)
    user["_id"] = result.inserted_id
    
    # Generate JWT token
    token_data = {"sub": email}
    token = create_access_token(token_data)
    
    return {
        "token": token,
        "user": serialize_doc(user)
    }

@convert_kwargs_to_snake_case
async def me_resolver(_, info):
    """Get current user"""
    context = info.context
    request = context["request"]
    auth_header = request.headers.get("Authorization")
    
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")
        
    # Get current user from context (usually set by a middleware)
    user = context.get("user")
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    return serialize_doc(user)

@convert_kwargs_to_snake_case
async def roles_resolver(_, info):
    """Get available roles"""
    return ["user", "SDuser", "SDadmin", "IDuser", "IDadmin", "appadmin"]
