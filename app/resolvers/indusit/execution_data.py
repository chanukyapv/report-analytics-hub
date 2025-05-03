
from ariadne import convert_kwargs_to_snake_case
from fastapi import HTTPException, status
from datetime import datetime
from app.auth import get_current_user, id_user_required, id_admin_required
from app.db.mongodb import execution_data_collection, automations_collection, serialize_doc, serialize_docs
from bson.objectid import ObjectId

async def execution_datas_resolver(_, info):
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

    # Get all execution data
    execution_datas = list(execution_data_collection.find())
    return serialize_docs(execution_datas)

@convert_kwargs_to_snake_case
async def execution_data_resolver(_, info, automation_id):
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

    # Check if automation exists
    automation = automations_collection.find_one({"_id": ObjectId(automation_id)})
    if not automation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Automation with ID {automation_id} not found"
        )

    # Get execution data for automation
    execution_data = execution_data_collection.find_one({"automation_id": automation_id})
    if not execution_data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Execution data for automation ID {automation_id} not found"
        )

    return serialize_doc(execution_data)

@convert_kwargs_to_snake_case
async def create_execution_data_resolver(_, info, input):
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
    automation_id = input.get("automation_id")
    automation = automations_collection.find_one({"_id": ObjectId(automation_id)})
    if not automation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Automation with ID {automation_id} not found"
        )

    # Check if execution data for this automation already exists
    if execution_data_collection.find_one({"automation_id": automation_id}):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Execution data for automation ID {automation_id} already exists"
        )

    # Create execution data
    current_time = datetime.now()
    execution_data = {**input, "created_at": current_time, "updated_at": current_time}
    result = execution_data_collection.insert_one(execution_data)
    created_execution_data = execution_data_collection.find_one({"_id": result.inserted_id})
    
    return serialize_doc(created_execution_data)

@convert_kwargs_to_snake_case
async def update_execution_data_resolver(_, info, id, input):
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

    # Check if execution data exists
    execution_data = execution_data_collection.find_one({"_id": ObjectId(id)})
    if not execution_data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Execution data with ID {id} not found"
        )

    # Check if automation exists
    automation_id = input.get("automation_id")
    automation = automations_collection.find_one({"_id": ObjectId(automation_id)})
    if not automation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Automation with ID {automation_id} not found"
        )

    # Check if another execution data for this automation exists
    duplicate = execution_data_collection.find_one({
        "automation_id": automation_id,
        "_id": {"$ne": ObjectId(id)}
    })
    if duplicate:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Another execution data for automation ID {automation_id} already exists"
        )

    # Update execution data
    execution_data_collection.update_one(
        {"_id": ObjectId(id)},
        {"$set": {**input, "updated_at": datetime.now()}}
    )

    # Get updated execution data
    updated_execution_data = execution_data_collection.find_one({"_id": ObjectId(id)})
    
    return serialize_doc(updated_execution_data)

@convert_kwargs_to_snake_case
async def delete_execution_data_resolver(_, info, id):
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

    # Check if execution data exists
    execution_data = execution_data_collection.find_one({"_id": ObjectId(id)})
    if not execution_data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Execution data with ID {id} not found"
        )

    # Delete execution data
    execution_data_collection.delete_one({"_id": ObjectId(id)})
    
    return True
