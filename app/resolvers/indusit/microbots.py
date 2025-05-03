
from ariadne import convert_kwargs_to_snake_case
from fastapi import HTTPException, status
from datetime import datetime
from app.auth import get_current_user, id_user_required, id_admin_required
from app.db.mongodb import microbots_collection, serialize_doc, serialize_docs
from bson.objectid import ObjectId

async def microbots_resolver(_, info):
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

    # Get all microbots
    microbots = list(microbots_collection.find())
    return serialize_docs(microbots)

@convert_kwargs_to_snake_case
async def microbot_resolver(_, info, id):
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

    # Get microbot by ID
    microbot = microbots_collection.find_one({"_id": ObjectId(id)})
    if not microbot:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Microbot with ID {id} not found"
        )

    return serialize_doc(microbot)

@convert_kwargs_to_snake_case
async def create_microbot_resolver(_, info, input):
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

    # Check if microbot with same name already exists
    if microbots_collection.find_one({"bot_name": input.get("bot_name")}):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Microbot with name '{input.get('bot_name')}' already exists"
        )

    # Create microbot
    current_time = datetime.now()
    microbot_data = {**input, "created_at": current_time, "updated_at": current_time}
    result = microbots_collection.insert_one(microbot_data)
    microbot = microbots_collection.find_one({"_id": result.inserted_id})
    
    return serialize_doc(microbot)

@convert_kwargs_to_snake_case
async def update_microbot_resolver(_, info, id, input):
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

    # Check if microbot exists
    microbot = microbots_collection.find_one({"_id": ObjectId(id)})
    if not microbot:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Microbot with ID {id} not found"
        )

    # Check if another microbot with same name exists
    duplicate = microbots_collection.find_one({
        "bot_name": input.get("bot_name"),
        "_id": {"$ne": ObjectId(id)}
    })
    if duplicate:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Another microbot with name '{input.get('bot_name')}' already exists"
        )

    # Update microbot
    microbots_collection.update_one(
        {"_id": ObjectId(id)},
        {"$set": {**input, "updated_at": datetime.now()}}
    )

    # Get updated microbot
    updated_microbot = microbots_collection.find_one({"_id": ObjectId(id)})
    
    return serialize_doc(updated_microbot)

@convert_kwargs_to_snake_case
async def delete_microbot_resolver(_, info, id):
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

    # Check if microbot exists
    microbot = microbots_collection.find_one({"_id": ObjectId(id)})
    if not microbot:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Microbot with ID {id} not found"
        )

    # Delete microbot
    microbots_collection.delete_one({"_id": ObjectId(id)})
    
    return True
