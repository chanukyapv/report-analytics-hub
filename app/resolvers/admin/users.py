
from ariadne import convert_kwargs_to_snake_case
from fastapi import HTTPException, status
from datetime import datetime
from bson import ObjectId
from app.db.mongodb import users_collection, role_requests_collection, serialize_doc, serialize_docs
from app.auth import app_admin_required, validate_bt_email

@convert_kwargs_to_snake_case
async def users_resolver(_, info):
    """Get all users (admin only)"""
    context = info.context
    request = context["request"]
    auth_header = request.headers.get("Authorization")
    
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    # Get current user from context
    user = context.get("user")
    app_admin_required(user)
    
    users = list(users_collection.find())
    return serialize_docs(users)

@convert_kwargs_to_snake_case
async def role_requests_resolver(_, info, status=None):
    """Get role requests (admin only, can be filtered by status)"""
    context = info.context
    request = context["request"]
    auth_header = request.headers.get("Authorization")
    
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    # Get current user from context
    user = context.get("user")
    app_admin_required(user)
    
    query = {}
    if status:
        query["status"] = status
    
    requests = list(role_requests_collection.find(query).sort("request_date", -1))
    return serialize_docs(requests)

@convert_kwargs_to_snake_case
async def user_role_requests_resolver(_, info):
    """Get role requests for the current user"""
    context = info.context
    request = context["request"]
    auth_header = request.headers.get("Authorization")
    
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    # Get current user from context
    user = context.get("user")
    user_id = user["_id"]
    
    requests = list(role_requests_collection.find({"user_id": user_id}).sort("request_date", -1))
    return serialize_docs(requests)

@convert_kwargs_to_snake_case
async def system_stats_resolver(_, info):
    """Get system statistics (admin only)"""
    context = info.context
    request = context["request"]
    auth_header = request.headers.get("Authorization")
    
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    # Get current user from context
    user = context.get("user")
    app_admin_required(user)
    
    # Get total users
    total_users = users_collection.count_documents({})
    
    # Get active users (at least one login)
    active_users = users_collection.count_documents({"login_count": {"$gt": 0}})
    
    # Get users by role
    pipeline = [
        {"$group": {"_id": "$role", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}}
    ]
    users_by_role = list(users_collection.aggregate(pipeline))
    role_counts = [{"role": item["_id"], "count": item["count"]} for item in users_by_role]
    
    # Get pending requests
    pending_requests = role_requests_collection.count_documents({"status": "pending"})
    
    return {
        "total_users": total_users,
        "active_users": active_users,
        "users_by_role": role_counts,
        "pending_requests": pending_requests
    }

@convert_kwargs_to_snake_case
async def user_activities_resolver(_, info):
    """Get user activities (admin only)"""
    context = info.context
    request = context["request"]
    auth_header = request.headers.get("Authorization")
    
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    # Get current user from context
    user = context.get("user")
    app_admin_required(user)
    
    # Get users with activity data, sorted by last login
    pipeline = [
        {"$project": {"name": 1, "email": 1, "last_login": 1, "login_count": {"$ifNull": ["$login_count", 0]}}},
        {"$sort": {"last_login": -1}}
    ]
    user_activities = list(users_collection.aggregate(pipeline))
    
    return serialize_docs(user_activities)

@convert_kwargs_to_snake_case
async def request_role_resolver(_, info, input):
    """Request a role"""
    context = info.context
    request = context["request"]
    auth_header = request.headers.get("Authorization")
    
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    # Get current user from context
    user = context.get("user")
    user_id = user["_id"]
    
    # Check if role is valid
    requested_role = input.get("role")
    valid_roles = ["SDuser", "SDadmin", "IDuser", "IDadmin"]
    if requested_role not in valid_roles:
        raise HTTPException(status_code=400, detail=f"Invalid role. Must be one of: {', '.join(valid_roles)}")
    
    # Check if user already has requested role
    if user["role"] == requested_role:
        raise HTTPException(status_code=400, detail=f"You already have the {requested_role} role")
    
    # Check if there's already a pending request for this role
    existing_request = role_requests_collection.find_one({
        "user_id": user_id,
        "requested_role": requested_role,
        "status": "pending"
    })
    
    if existing_request:
        raise HTTPException(status_code=400, detail=f"You already have a pending request for the {requested_role} role")
    
    # Create role request
    now = datetime.utcnow()
    role_request = {
        "user_id": user_id,
        "user_name": user["name"],
        "user_email": user["email"],
        "requested_role": requested_role,
        "status": "pending",
        "request_date": now,
        "notes": input.get("notes", "")
    }
    
    result = role_requests_collection.insert_one(role_request)
    role_request["_id"] = result.inserted_id
    
    return serialize_doc(role_request)

@convert_kwargs_to_snake_case
async def approve_role_request_resolver(_, info, input):
    """Approve or reject a role request (admin only)"""
    context = info.context
    request = context["request"]
    auth_header = request.headers.get("Authorization")
    
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    # Get current user from context
    admin_user = context.get("user")
    app_admin_required(admin_user)
    
    request_id = input.get("request_id")
    status = input.get("status")
    
    if status not in ["approved", "rejected"]:
        raise HTTPException(status_code=400, detail="Status must be 'approved' or 'rejected'")
    
    # Get the role request
    try:
        role_request = role_requests_collection.find_one({"_id": ObjectId(request_id)})
    except:
        raise HTTPException(status_code=404, detail="Role request not found")
        
    if not role_request:
        raise HTTPException(status_code=404, detail="Role request not found")
    
    if role_request["status"] != "pending":
        raise HTTPException(status_code=400, detail=f"Request has already been {role_request['status']}")
    
    # Update the role request
    now = datetime.utcnow()
    update_data = {
        "$set": {
            "status": status,
            "approval_date": now,
            "approved_by": admin_user["_id"],
            "approved_by_name": admin_user["name"],
            "notes": f"{input.get('notes', '')} [Previous notes: {role_request.get('notes', '')}]".strip()
        }
    }
    
    role_requests_collection.update_one({"_id": ObjectId(request_id)}, update_data)
    
    # If approved, update the user's role
    if status == "approved":
        users_collection.update_one(
            {"_id": ObjectId(role_request["user_id"])},
            {"$set": {"role": role_request["requested_role"]}}
        )
    
    # Get updated role request
    updated_request = role_requests_collection.find_one({"_id": ObjectId(request_id)})
    
    return serialize_doc(updated_request)

@convert_kwargs_to_snake_case
async def update_user_role_resolver(_, info, input):
    """Update a user's role (admin only)"""
    context = info.context
    request = context["request"]
    auth_header = request.headers.get("Authorization")
    
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    # Get current user from context
    admin_user = context.get("user")
    app_admin_required(admin_user)
    
    user_id = input.get("user_id")
    new_role = input.get("role")
    
    # Check if role is valid
    valid_roles = ["user", "SDuser", "SDadmin", "IDuser", "IDadmin", "appadmin"]
    if new_role not in valid_roles:
        raise HTTPException(status_code=400, detail=f"Invalid role. Must be one of: {', '.join(valid_roles)}")
        
    # Check if user exists
    try:
        user = users_collection.find_one({"_id": ObjectId(user_id)})
    except:
        raise HTTPException(status_code=404, detail="User not found")
        
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Can't modify another appadmin's role
    if user["role"] == "appadmin" and admin_user["_id"] != user_id:
        raise HTTPException(status_code=403, detail="Cannot modify another App Admin's role")
    
    # Update the user's role
    users_collection.update_one(
        {"_id": ObjectId(user_id)},
        {"$set": {"role": new_role}}
    )
    
    # Get updated user
    updated_user = users_collection.find_one({"_id": ObjectId(user_id)})
    
    return serialize_doc(updated_user)
