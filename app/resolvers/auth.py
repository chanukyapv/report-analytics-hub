from ariadne import convert_kwargs_to_snake_case
from fastapi import HTTPException, status
from datetime import datetime, timedelta
from app.auth import (
    verify_password, get_password_hash, create_access_token,
    get_current_user, ACCESS_TOKEN_EXPIRE_MINUTES, validate_bt_email
)
from app.db.mongodb import users_collection, roles_collection
import re
from email_validator import validate_email, EmailNotValidError

@convert_kwargs_to_snake_case
async def login_resolver(_, info, input):
    email = input.get("email")
    password = input.get("password")

    user = users_collection.find_one({"email": email})
    if not user or not verify_password(password, user["password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Update login statistics
    now = datetime.utcnow()
    login_count = user.get("login_count", 0) + 1
    users_collection.update_one(
        {"_id": user["_id"]},
        {"$set": {"last_login": now, "login_count": login_count}}
    )
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user["email"]},
        expires_delta=access_token_expires
    )

    # Convert ObjectId to string
    user_id = str(user["_id"])

    return {
        "token": access_token,
        "user": {
            "id": user_id,
            "email": user["email"],
            "name": user["name"],
            "role": user["role"],
            "is_active": user["is_active"],
            "last_login": now.strftime('%d-%m-%Y %H:%M:%S'),
            "login_count": login_count
        }
    }

@convert_kwargs_to_snake_case
async def register_resolver(_, info, input):
    # Validate input
    email = input.get("email")
    password = input.get("password")
    name = input.get("name")
    
    # Validate that email is from bt.com domain
    try:
        validate_email(email)
        validate_bt_email(email)
    except EmailNotValidError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid email address"
        )

    # Check if user already exists
    if users_collection.find_one({"email": email}):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )

    # Validate password (at least 8 chars with letters and numbers)
    if len(password) < 8 or not re.search(r'[A-Za-z]', password) or not re.search(r'[0-9]', password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must be at least 8 characters and contain both letters and numbers"
        )

    # Create user with default role "user"
    hashed_password = get_password_hash(password)
    now = datetime.utcnow()
    user_data = {
        "email": email,
        "password": hashed_password,
        "name": name,
        "role": "user",  # Default role, users will request access to dashboards
        "is_active": True,
        "created_at": now,
        "updated_at": now
    }

    result = users_collection.insert_one(user_data)
    user_id = str(result.inserted_id)

    # Create token
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": email},
        expires_delta=access_token_expires
    )

    return {
        "token": access_token,
        "user": {
            "id": user_id,
            "email": email,
            "name": name,
            "role": "user",
            "is_active": True,
            "created_at": now.strftime('%d-%m-%Y %H:%M:%S')
        }
    }

async def me_resolver(_, info):
    context = info.context
    request = context["request"]

    # Get the Authorization header
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"}
        )

    token = auth_header.split(" ")[1]
    user = await get_current_user(token)

    return {
        "id": user["_id"],
        "email": user["email"],
        "name": user["name"],
        "role": user["role"],
        "is_active": user["is_active"]
    }

async def roles_resolver(_, info):
    # Get current user from context
    context = info.context
    request = context["request"]

    # Get the Authorization header
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"}
        )

    token = auth_header.split(" ")[1]
    user = await get_current_user(token)

    # Check if user is admin
    if user["role"] != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )

    roles = list(roles_collection.find())
    for role in roles:
        role["id"] = str(role["_id"])
        del role["_id"]

    return roles
