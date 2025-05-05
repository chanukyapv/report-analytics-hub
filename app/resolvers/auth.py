
from ariadne import convert_kwargs_to_snake_case
from fastapi import HTTPException, status
from datetime import timedelta
from app.auth import (
    verify_password, get_password_hash, create_access_token,
    get_current_user, ACCESS_TOKEN_EXPIRE_MINUTES, is_admin
)
from app.db.mongodb import users_collection, roles_collection
import re
from email_validator import validate_email, EmailNotValidError

# ... keep existing code (login_resolver function)

@convert_kwargs_to_snake_case
async def register_resolver(_, info, input):
    # Validate input
    email = input.get("email")
    password = input.get("password")
    name = input.get("name")
    
    # Default role is always "user" when registering via UI
    role_name = "user"
    roles = ["user"]
    
    # Only pass the role from input if it's coming from a superadmin 
    context = info.context
    request = context.get("request")
    
    if request and request.headers.get("Authorization"):
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header.split(" ")[1]
            try:
                current_user = await get_current_user(token)
                # Allow superadmin to set roles during registration
                if "superadmin" in current_user.get("roles", []):
                    role_name = input.get("role", "user")
                    roles = input.get("roles", ["user"])
            except Exception:
                # Fall back to default user role
                pass

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

# ... keep existing code (me_resolver and roles_resolver functions)

# Add new resolver for user management (only accessible by superadmin)
@convert_kwargs_to_snake_case
async def update_user_roles_resolver(_, info, user_id, roles):
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
    current_user = await get_current_user(token)

    # Check if current user is superadmin
    if "superadmin" not in current_user.get("roles", []):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Superadmin privileges required"
        )

    # Validate all roles exist
    for role_name in roles:
        role = roles_collection.find_one({"name": role_name})
        if not role:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Role '{role_name}' does not exist"
            )

    # Find and update user
    from bson import ObjectId
    user_obj_id = ObjectId(user_id)
    user = users_collection.find_one({"_id": user_obj_id})

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Update user roles
    primary_role = roles[0] if roles else "user"
    users_collection.update_one(
        {"_id": user_obj_id},
        {"$set": {"roles": roles, "role": primary_role}}
    )
    
    # Return updated user
    updated_user = users_collection.find_one({"_id": user_obj_id})
    updated_user["id"] = str(updated_user["_id"])
    del updated_user["_id"]
    del updated_user["password"]
    
    return updated_user
