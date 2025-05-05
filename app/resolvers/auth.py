
from ariadne import convert_kwargs_to_snake_case
from fastapi import HTTPException, status
from datetime import timedelta
from app.auth import (
    verify_password, get_password_hash, create_access_token,
    get_current_user, ACCESS_TOKEN_EXPIRE_MINUTES
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

    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user["email"]},
        expires_delta=access_token_expires
    )

    # Convert ObjectId to string
    user_id = str(user["_id"])

    # Ensure roles are properly handled
    user_roles = user.get("roles", [])
    if not isinstance(user_roles, list):
        user_roles = []

    return {
        "token": access_token,
        "user": {
            "id": user_id,
            "email": user["email"],
            "name": user["name"],
            "role": user["role"],
            "roles": user_roles,
            "is_active": user.get("is_active", True)
        }
    }

@convert_kwargs_to_snake_case
async def register_resolver(_, info, input):
    # Validate input
    email = input.get("email")
    password = input.get("password")
    name = input.get("name")
    role_name = input.get("role")
    roles = input.get("roles", [])

    # Validate email
    try:
        validate_email(email)
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

    # Validate role
    role = roles_collection.find_one({"name": role_name})
    if not role:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Role '{role_name}' does not exist"
        )

    # Create user
    hashed_password = get_password_hash(password)
    user_data = {
        "email": email,
        "password": hashed_password,
        "name": name,
        "role": role_name,
        "roles": roles,
        "is_active": True
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
            "role": role_name,
            "roles": roles,
            "is_active": True
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

    # Ensure roles are properly handled
    user_roles = user.get("roles", [])
    if not isinstance(user_roles, list):
        user_roles = []

    return {
        "id": user["_id"],
        "email": user["email"],
        "name": user["name"],
        "role": user["role"],
        "roles": user_roles,
        "is_active": user.get("is_active", True)
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
    if user["role"] != "admin" and "admin" not in user.get("roles", []):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )

    roles = list(roles_collection.find())
    for role in roles:
        role["id"] = str(role["_id"])
        del role["_id"]

    return roles
