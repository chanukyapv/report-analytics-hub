
from ariadne import convert_kwargs_to_snake_case
from fastapi import HTTPException, status
from datetime import datetime
from app.auth import get_current_user, id_user_required, id_admin_required
from app.db.mongodb import automations_collection, serialize_doc, serialize_docs
from bson.objectid import ObjectId

async def automations_resolver(_, info):
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

    # Check if user has IndusIT dashboard access
    id_user_required(user)

    # Get all automations
    automations = list(automations_collection.find())
    return serialize_docs(automations)

@convert_kwargs_to_snake_case
async def automation_resolver(_, info, id):
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

    # Check if user has IndusIT dashboard access
    id_user_required(user)

    # Get automation by ID
    automation = automations_collection.find_one({"_id": ObjectId(id)})
    if not automation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Automation with ID {id} not found"
        )

    return serialize_doc(automation)

@convert_kwargs_to_snake_case
async def create_automation_resolver(_, info, input):
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

    # Check if user has IndusIT admin access
    id_admin_required(user)

    # Check if automation with same APAID already exists
    if automations_collection.find_one({"apaid": input.get("apaid")}):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Automation with APAID '{input.get('apaid')}' already exists"
        )

    # Create automation
    current_time = datetime.now()
    automation_data = {**input, "created_by": user["_id"], "created_at": current_time, "updated_at": current_time}
    result = automations_collection.insert_one(automation_data)
    automation = automations_collection.find_one({"_id": result.inserted_id})
    
    return serialize_doc(automation)

@convert_kwargs_to_snake_case
async def update_automation_resolver(_, info, id, input):
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

    # Check if user has IndusIT admin access
    id_admin_required(user)

    # Check if automation exists
    automation = automations_collection.find_one({"_id": ObjectId(id)})
    if not automation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Automation with ID {id} not found"
        )

    # Check if another automation with same APAID exists
    duplicate = automations_collection.find_one({
        "apaid": input.get("apaid"),
        "_id": {"$ne": ObjectId(id)}
    })
    if duplicate:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Another automation with APAID '{input.get('apaid')}' already exists"
        )

    # Update automation
    automations_collection.update_one(
        {"_id": ObjectId(id)},
        {"$set": {**input, "updated_at": datetime.now()}}
    )

    # Get updated automation
    updated_automation = automations_collection.find_one({"_id": ObjectId(id)})
    
    return serialize_doc(updated_automation)

@convert_kwargs_to_snake_case
async def delete_automation_resolver(_, info, id):
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

    # Check if user has IndusIT admin access
    id_admin_required(user)

    # Check if automation exists
    automation = automations_collection.find_one({"_id": ObjectId(id)})
    if not automation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Automation with ID {id} not found"
        )

    # Delete automation
    automations_collection.delete_one({"_id": ObjectId(id)})
    
    return True
