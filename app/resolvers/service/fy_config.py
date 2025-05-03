
from ariadne import convert_kwargs_to_snake_case
from fastapi import HTTPException, status
from app.auth import get_current_user, sd_user_required, admin_required
from app.db.mongodb import fy_configs_collection, serialize_doc, serialize_docs
from bson.objectid import ObjectId

async def fy_configs_resolver(_, info):
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

    # Check if user has service dashboard access
    sd_user_required(user)

    # Get all FY configs
    fy_configs = list(fy_configs_collection.find())
    return serialize_docs(fy_configs)

@convert_kwargs_to_snake_case
async def fy_config_resolver(_, info, fy):
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

    # Check if user has service dashboard access
    sd_user_required(user)

    # Get FY config by FY
    fy_config = fy_configs_collection.find_one({"fy": fy})
    if not fy_config:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"FY config for {fy} not found"
        )

    return serialize_doc(fy_config)

@convert_kwargs_to_snake_case
async def create_fy_config_resolver(_, info, input):
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
    admin_required(user)

    fy = input.get("fy")
    quarters = input.get("quarters")

    # Check if FY config already exists
    if fy_configs_collection.find_one({"fy": fy}):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"FY config for {fy} already exists"
        )

    # Create FY config
    fy_config_data = {
        "fy": fy,
        "quarters": quarters
    }
    result = fy_configs_collection.insert_one(fy_config_data)
    fy_config = fy_configs_collection.find_one({"_id": result.inserted_id})
    
    return serialize_doc(fy_config)

@convert_kwargs_to_snake_case
async def update_fy_config_resolver(_, info, id, input):
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
    admin_required(user)

    fy = input.get("fy")
    quarters = input.get("quarters")

    # Check if FY config exists
    fy_config = fy_configs_collection.find_one({"_id": ObjectId(id)})
    if not fy_config:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"FY config with id {id} not found"
        )

    # Check if another FY config has the same FY
    duplicate = fy_configs_collection.find_one({"fy": fy, "_id": {"$ne": ObjectId(id)}})
    if duplicate:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Another FY config with FY {fy} already exists"
        )

    # Update FY config
    fy_configs_collection.update_one(
        {"_id": ObjectId(id)},
        {"$set": {
            "fy": fy,
            "quarters": quarters
        }}
    )

    # Get updated FY config
    updated_fy_config = fy_configs_collection.find_one({"_id": ObjectId(id)})
    
    return serialize_doc(updated_fy_config)

@convert_kwargs_to_snake_case
async def delete_fy_config_resolver(_, info, id):
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
    admin_required(user)

    # Check if FY config exists
    fy_config = fy_configs_collection.find_one({"_id": ObjectId(id)})
    if not fy_config:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"FY config with id {id} not found"
        )

    # Delete FY config
    fy_configs_collection.delete_one({"_id": ObjectId(id)})
    
    return True
