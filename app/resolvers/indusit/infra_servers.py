
from ariadne import convert_kwargs_to_snake_case
from fastapi import HTTPException, status
from datetime import datetime
from app.auth import get_current_user, id_user_required, id_admin_required
from app.db.mongodb import infra_servers_collection, serialize_doc, serialize_docs
from bson.objectid import ObjectId

async def infra_servers_resolver(_, info):
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

    # Get all infra servers
    infra_servers = list(infra_servers_collection.find())
    return serialize_docs(infra_servers)

@convert_kwargs_to_snake_case
async def infra_server_resolver(_, info, id):
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

    # Get infra server by ID
    infra_server = infra_servers_collection.find_one({"_id": ObjectId(id)})
    if not infra_server:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Infra server with ID {id} not found"
        )

    return serialize_doc(infra_server)

@convert_kwargs_to_snake_case
async def create_infra_server_resolver(_, info, input):
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

    # Check if infra server with same hostname already exists
    if infra_servers_collection.find_one({"hostname": input.get("hostname")}):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Infra server with hostname '{input.get('hostname')}' already exists"
        )

    # Create infra server
    current_time = datetime.now()
    infra_server_data = {**input, "created_at": current_time, "updated_at": current_time}
    result = infra_servers_collection.insert_one(infra_server_data)
    infra_server = infra_servers_collection.find_one({"_id": result.inserted_id})
    
    return serialize_doc(infra_server)

@convert_kwargs_to_snake_case
async def update_infra_server_resolver(_, info, id, input):
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

    # Check if infra server exists
    infra_server = infra_servers_collection.find_one({"_id": ObjectId(id)})
    if not infra_server:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Infra server with ID {id} not found"
        )

    # Check if another infra server with same hostname exists
    duplicate = infra_servers_collection.find_one({
        "hostname": input.get("hostname"),
        "_id": {"$ne": ObjectId(id)}
    })
    if duplicate:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Another infra server with hostname '{input.get('hostname')}' already exists"
        )

    # Update infra server
    infra_servers_collection.update_one(
        {"_id": ObjectId(id)},
        {"$set": {**input, "updated_at": datetime.now()}}
    )

    # Get updated infra server
    updated_infra_server = infra_servers_collection.find_one({"_id": ObjectId(id)})
    
    return serialize_doc(updated_infra_server)

@convert_kwargs_to_snake_case
async def delete_infra_server_resolver(_, info, id):
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

    # Check if infra server exists
    infra_server = infra_servers_collection.find_one({"_id": ObjectId(id)})
    if not infra_server:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Infra server with ID {id} not found"
        )

    # Delete infra server
    infra_servers_collection.delete_one({"_id": ObjectId(id)})
    
    return True
