
from ariadne import convert_kwargs_to_snake_case
from fastapi import HTTPException, status
from bson import ObjectId
from datetime import datetime
from app.db.mongodb import metrics_collection
from app.auth import get_current_user, admin_required

# Helper function to get metric status
def get_metric_status(value, baseline, target):
    if value >= target:
        return "target_achieved"
    elif value > baseline:
        return "above_baseline"
    else:
        return "below_baseline"

async def metrics_resolver(_, info):
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
    
    metrics = list(metrics_collection.find())
    for metric in metrics:
        metric["id"] = str(metric["_id"])
        del metric["_id"]
    
    return metrics

@convert_kwargs_to_snake_case
async def metric_resolver(_, info, id):
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
    
    try:
        metric = metrics_collection.find_one({"_id": ObjectId(id)})
        if not metric:
            return None
        
        metric["id"] = str(metric["_id"])
        del metric["_id"]
        return metric
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid ID format: {str(e)}"
        )

@convert_kwargs_to_snake_case
async def create_metric_resolver(_, info, input):
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
    
    # Only admin can create metrics
    admin_required(user)
    
    # Create metric
    metric_data = {
        "name": input["name"],
        "baseline": input["baseline"],
        "target": input["target"],
        "actual_formula": input["actual_formula"],
        "unit": input["unit"],
        "created_by": user["_id"],
        "created_at": datetime.utcnow(),
    }
    
    result = metrics_collection.insert_one(metric_data)
    metric_id = str(result.inserted_id)
    
    # Return created metric
    return {
        "id": metric_id,
        **input,
        "created_by": user["_id"]
    }

@convert_kwargs_to_snake_case
async def update_metric_resolver(_, info, id, input):
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
    
    # Only admin can update metrics
    admin_required(user)
    
    # Check if metric exists
    metric = metrics_collection.find_one({"_id": ObjectId(id)})
    if not metric:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Metric with ID {id} not found"
        )
    
    # Update metric
    updated_data = {
        "name": input["name"],
        "baseline": input["baseline"],
        "target": input["target"],
        "actual_formula": input["actual_formula"],
        "unit": input["unit"],
        "updated_at": datetime.utcnow()
    }
    
    metrics_collection.update_one(
        {"_id": ObjectId(id)},
        {"$set": updated_data}
    )
    
    # Return updated metric
    updated_metric = metrics_collection.find_one({"_id": ObjectId(id)})
    updated_metric["id"] = str(updated_metric["_id"])
    del updated_metric["_id"]
    
    return updated_metric

@convert_kwargs_to_snake_case
async def delete_metric_resolver(_, info, id):
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
    
    # Only admin can delete metrics
    admin_required(user)
    
    # Check if metric exists
    metric = metrics_collection.find_one({"_id": ObjectId(id)})
    if not metric:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Metric with ID {id} not found"
        )
    
    # Delete metric
    result = metrics_collection.delete_one({"_id": ObjectId(id)})
    
    if result.deleted_count == 1:
        return True
    return False
