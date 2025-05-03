
from ariadne import convert_kwargs_to_snake_case
from fastapi import HTTPException, status
from datetime import datetime
from app.auth import get_current_user, id_user_required, id_admin_required
from app.db.mongodb import interfaces_collection, automations_collection, serialize_doc, serialize_docs
from bson.objectid import ObjectId

async def interfaces_resolver(_, info, apaid=None):
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

    # Build query
    query = {}
    if apaid:
        query["apaid"] = apaid

    # Get interfaces
    interfaces = list(interfaces_collection.find(query))
    return serialize_docs(interfaces)

@convert_kwargs_to_snake_case
async def interface_resolver(_, info, id):
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

    # Get interface by ID
    interface = interfaces_collection.find_one({"_id": ObjectId(id)})
    if not interface:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Interface with ID {id} not found"
        )

    return serialize_doc(interface)

@convert_kwargs_to_snake_case
async def create_interface_resolver(_, info, input):
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

    # Check if automation with APAID exists
    apaid = input.get("apaid")
    automation = automations_collection.find_one({"apaid": apaid})
    if not automation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Automation with APAID {apaid} not found"
        )

    # Create interface
    current_time = datetime.now()
    interface_data = {**input, "created_at": current_time, "updated_at": current_time}
    result = interfaces_collection.insert_one(interface_data)
    interface = interfaces_collection.find_one({"_id": result.inserted_id})
    
    return serialize_doc(interface)

@convert_kwargs_to_snake_case
async def update_interface_resolver(_, info, id, input):
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

    # Check if interface exists
    interface = interfaces_collection.find_one({"_id": ObjectId(id)})
    if not interface:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Interface with ID {id} not found"
        )

    # Check if automation with APAID exists
    apaid = input.get("apaid")
    automation = automations_collection.find_one({"apaid": apaid})
    if not automation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Automation with APAID {apaid} not found"
        )

    # Update interface
    interfaces_collection.update_one(
        {"_id": ObjectId(id)},
        {"$set": {**input, "updated_at": datetime.now()}}
    )

    # Get updated interface
    updated_interface = interfaces_collection.find_one({"_id": ObjectId(id)})
    
    return serialize_doc(updated_interface)

@convert_kwargs_to_snake_case
async def delete_interface_resolver(_, info, id):
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

    # Check if interface exists
    interface = interfaces_collection.find_one({"_id": ObjectId(id)})
    if not interface:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Interface with ID {id} not found"
        )

    # Delete interface
    interfaces_collection.delete_one({"_id": ObjectId(id)})
    
    return True
