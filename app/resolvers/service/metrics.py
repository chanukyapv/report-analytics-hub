
from ariadne import convert_kwargs_to_snake_case
from fastapi import HTTPException, status
from datetime import datetime
from app.auth import get_current_user, sd_user_required, admin_required
from app.db.mongodb import metrics_collection, serialize_doc, serialize_docs
from bson.objectid import ObjectId

async def metrics_resolver(_, info):
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

    # Get all metrics
    metrics = list(metrics_collection.find())
    return serialize_docs(metrics)

@convert_kwargs_to_snake_case
async def metric_resolver(_, info, id):
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

    # Get metric by ID
    metric = metrics_collection.find_one({"_id": ObjectId(id)})
    if not metric:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Metric with ID {id} not found"
        )

    return serialize_doc(metric)

@convert_kwargs_to_snake_case
async def create_metric_resolver(_, info, input):
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

    # Extract input fields
    name = input.get("name")
    baseline = input.get("baseline")
    target = input.get("target")
    actual_formula = input.get("actual_formula")
    unit = input.get("unit")

    # Check if metric with same name already exists
    if metrics_collection.find_one({"name": name}):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Metric with name '{name}' already exists"
        )

    # Create metric
    metric_data = {
        "name": name,
        "baseline": baseline,
        "target": target,
        "actual_formula": actual_formula,
        "unit": unit,
        "created_by": user["_id"]
    }
    result = metrics_collection.insert_one(metric_data)
    metric = metrics_collection.find_one({"_id": result.inserted_id})
    
    return serialize_doc(metric)

@convert_kwargs_to_snake_case
async def update_metric_resolver(_, info, id, input):
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

    # Extract input fields
    name = input.get("name")
    baseline = input.get("baseline")
    target = input.get("target")
    actual_formula = input.get("actual_formula")
    unit = input.get("unit")

    # Check if metric exists
    metric = metrics_collection.find_one({"_id": ObjectId(id)})
    if not metric:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Metric with ID {id} not found"
        )

    # Check if another metric with same name exists
    duplicate = metrics_collection.find_one({"name": name, "_id": {"$ne": ObjectId(id)}})
    if duplicate:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Another metric with name '{name}' already exists"
        )

    # Update metric
    metrics_collection.update_one(
        {"_id": ObjectId(id)},
        {"$set": {
            "name": name,
            "baseline": baseline,
            "target": target,
            "actual_formula": actual_formula,
            "unit": unit
        }}
    )

    # Get updated metric
    updated_metric = metrics_collection.find_one({"_id": ObjectId(id)})
    
    return serialize_doc(updated_metric)

@convert_kwargs_to_snake_case
async def delete_metric_resolver(_, info, id):
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

    # Check if metric exists
    metric = metrics_collection.find_one({"_id": ObjectId(id)})
    if not metric:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Metric with ID {id} not found"
        )

    # Delete metric
    metrics_collection.delete_one({"_id": ObjectId(id)})
    
    return True
