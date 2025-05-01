
from ariadne import convert_kwargs_to_snake_case
from fastapi import HTTPException, status
from bson import ObjectId
from datetime import datetime
from app.db.mongodb import fy_configs_collection
from app.auth import get_current_user, admin_required

async def fy_configs_resolver(_, info):
    context = info.context
    request = context["request"]
    
    # Get the Authorization header
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated"
        )
    
    token = auth_header.split(" ")[1]
    user = await get_current_user(token)
    
    configs = list(fy_configs_collection.find())
    for config in configs:
        config["id"] = str(config["_id"])
        del config["_id"]
    
    return configs

@convert_kwargs_to_snake_case
async def fy_config_resolver(_, info, fy):
    context = info.context
    request = context["request"]
    
    # Get the Authorization header
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated"
        )
    
    token = auth_header.split(" ")[1]
    user = await get_current_user(token)
    
    config = fy_configs_collection.find_one({"fy": fy})
    if config:
        config["id"] = str(config["_id"])
        del config["_id"]
    
    return config

@convert_kwargs_to_snake_case
async def create_fy_config_resolver(_, info, input):
    context = info.context
    request = context["request"]
    
    # Get the Authorization header
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated"
        )
    
    token = auth_header.split(" ")[1]
    user = await get_current_user(token)
    
    # Only admin can create FY configs
    admin_required(user)
    
    # Check if FY config already exists
    existing_config = fy_configs_collection.find_one({"fy": input["fy"]})
    if existing_config:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"FY config for {input['fy']} already exists"
        )
    
    # Create FY config
    config_data = {
        "fy": input["fy"],
        "quarters": input["quarters"],
        "created_at": datetime.utcnow(),
        "updated_at": None
    }
    
    result = fy_configs_collection.insert_one(config_data)
    
    # Return created config
    config = fy_configs_collection.find_one({"_id": result.inserted_id})
    config["id"] = str(config["_id"])
    del config["_id"]
    
    return config

@convert_kwargs_to_snake_case
async def update_fy_config_resolver(_, info, id, input):
    context = info.context
    request = context["request"]
    
    # Get the Authorization header
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated"
        )
    
    token = auth_header.split(" ")[1]
    user = await get_current_user(token)
    
    # Only admin can update FY configs
    admin_required(user)
    
    # Check if config exists
    config = fy_configs_collection.find_one({"_id": ObjectId(id)})
    if not config:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"FY config with ID {id} not found"
        )
    
    # Check if changing to a FY that already has a config
    if input["fy"] != config["fy"]:
        existing_config = fy_configs_collection.find_one({
            "fy": input["fy"],
            "_id": {"$ne": ObjectId(id)}
        })
        
        if existing_config:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"FY config for {input['fy']} already exists"
            )
    
    # Update config
    updated_data = {
        "fy": input["fy"],
        "quarters": input["quarters"],
        "updated_at": datetime.utcnow()
    }
    
    fy_configs_collection.update_one(
        {"_id": ObjectId(id)},
        {"$set": updated_data}
    )
    
    # Return updated config
    updated_config = fy_configs_collection.find_one({"_id": ObjectId(id)})
    updated_config["id"] = str(updated_config["_id"])
    del updated_config["_id"]
    
    return updated_config

@convert_kwargs_to_snake_case
async def delete_fy_config_resolver(_, info, id):
    context = info.context
    request = context["request"]
    
    # Get the Authorization header
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated"
        )
    
    token = auth_header.split(" ")[1]
    user = await get_current_user(token)
    
    # Only admin can delete FY configs
    admin_required(user)
    
    # Check if config exists
    config = fy_configs_collection.find_one({"_id": ObjectId(id)})
    if not config:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"FY config with ID {id} not found"
        )
    
    # Delete config
    result = fy_configs_collection.delete_one({"_id": ObjectId(id)})
    
    if result.deleted_count == 1:
        return True
    return False
