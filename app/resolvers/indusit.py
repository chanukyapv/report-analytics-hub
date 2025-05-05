
from ariadne import convert_kwargs_to_snake_case
from fastapi import HTTPException, status
from app.db.mongodb import (
    automation_metadata_collection, execution_data_collection,
    infra_register_collection, interface_register_collection,
    microbot_register_collection, serialize_doc, serialize_docs
)
from app.auth import get_current_user, role_required
from datetime import datetime
from bson import ObjectId

# Automation Metadata Resolvers
async def automation_metadata_resolver(_, info, id=None):
    context = info.context
    request = context["request"]
    
    # Authenticate user
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"}
        )
    
    token = auth_header.split(" ")[1]
    user = await get_current_user(token)
    
    # Check if user has IDuser or IDadmin role
    if not any(role in user.get("roles", []) + [user["role"]] for role in ["IDuser", "IDadmin"]):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="IndusIT Dashboard access required"
        )
    
    if id:
        automation = automation_metadata_collection.find_one({"_id": ObjectId(id)})
        if not automation:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Automation with ID {id} not found"
            )
        return serialize_doc(automation)
    
    return None

async def all_automation_metadata_resolver(_, info):
    context = info.context
    request = context["request"]
    
    # Authenticate user
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"}
        )
    
    token = auth_header.split(" ")[1]
    user = await get_current_user(token)
    
    # Check if user has IDuser or IDadmin role
    if not any(role in user.get("roles", []) + [user["role"]] for role in ["IDuser", "IDadmin"]):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="IndusIT Dashboard access required"
        )
    
    automations = list(automation_metadata_collection.find())
    return serialize_docs(automations)

async def automation_metadata_by_apaid_resolver(_, info, apaid):
    context = info.context
    request = context["request"]
    
    # Authenticate user
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"}
        )
    
    token = auth_header.split(" ")[1]
    user = await get_current_user(token)
    
    # Check if user has IDuser or IDadmin role
    if not any(role in user.get("roles", []) + [user["role"]] for role in ["IDuser", "IDadmin"]):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="IndusIT Dashboard access required"
        )
    
    automation = automation_metadata_collection.find_one({"apaid": apaid})
    if not automation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Automation with APAID {apaid} not found"
        )
    return serialize_doc(automation)

@convert_kwargs_to_snake_case
async def create_automation_metadata_resolver(_, info, input):
    context = info.context
    request = context["request"]
    
    # Authenticate user
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"}
        )
    
    token = auth_header.split(" ")[1]
    user = await get_current_user(token)
    
    # Check if user has IDadmin role
    if not any(role in user.get("roles", []) + [user["role"]] for role in ["IDadmin"]):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="IDadmin role required"
        )
    
    # Check if APAID already exists
    existing = automation_metadata_collection.find_one({"apaid": input["apaid"]})
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Automation with APAID {input['apaid']} already exists"
        )
    
    # Add creation metadata
    now = datetime.utcnow()
    input["created_by"] = str(user["_id"])
    input["created_at"] = now
    input["updated_at"] = now
    
    # Insert document
    result = automation_metadata_collection.insert_one(input)
    
    # Fetch the created document
    created = automation_metadata_collection.find_one({"_id": result.inserted_id})
    return serialize_doc(created)

@convert_kwargs_to_snake_case
async def update_automation_metadata_resolver(_, info, id, input):
    context = info.context
    request = context["request"]
    
    # Authenticate user
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"}
        )
    
    token = auth_header.split(" ")[1]
    user = await get_current_user(token)
    
    # Check if user has IDadmin role
    if not any(role in user.get("roles", []) + [user["role"]] for role in ["IDadmin"]):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="IDadmin role required"
        )
    
    # Check if record exists
    existing = automation_metadata_collection.find_one({"_id": ObjectId(id)})
    if not existing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Automation with ID {id} not found"
        )
    
    # Update timestamp
    input["updated_at"] = datetime.utcnow()
    
    # Update document
    automation_metadata_collection.update_one(
        {"_id": ObjectId(id)},
        {"$set": input}
    )
    
    # Fetch the updated document
    updated = automation_metadata_collection.find_one({"_id": ObjectId(id)})
    return serialize_doc(updated)

@convert_kwargs_to_snake_case
async def delete_automation_metadata_resolver(_, info, id):
    context = info.context
    request = context["request"]
    
    # Authenticate user
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"}
        )
    
    token = auth_header.split(" ")[1]
    user = await get_current_user(token)
    
    # Check if user has IDadmin role
    if not any(role in user.get("roles", []) + [user["role"]] for role in ["IDadmin"]):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="IDadmin role required"
        )
    
    # Check if record exists
    existing = automation_metadata_collection.find_one({"_id": ObjectId(id)})
    if not existing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Automation with ID {id} not found"
        )
    
    # Delete the document
    result = automation_metadata_collection.delete_one({"_id": ObjectId(id)})
    
    return result.deleted_count > 0

# Execution Data Resolvers - Similar structure to Automation Metadata
async def execution_data_resolver(_, info, id=None):
    context = info.context
    request = context["request"]
    
    # Authenticate user
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"}
        )
    
    token = auth_header.split(" ")[1]
    user = await get_current_user(token)
    
    # Check if user has IDuser or IDadmin role
    if not any(role in user.get("roles", []) + [user["role"]] for role in ["IDuser", "IDadmin"]):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="IndusIT Dashboard access required"
        )
    
    if id:
        execution = execution_data_collection.find_one({"_id": ObjectId(id)})
        if not execution:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Execution data with ID {id} not found"
            )
        return serialize_doc(execution)
    
    return None

async def all_execution_data_resolver(_, info):
    context = info.context
    request = context["request"]
    
    # Authenticate user and check permissions - similar to other resolvers
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"}
        )
    
    token = auth_header.split(" ")[1]
    user = await get_current_user(token)
    
    if not any(role in user.get("roles", []) + [user["role"]] for role in ["IDuser", "IDadmin"]):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="IndusIT Dashboard access required"
        )
    
    executions = list(execution_data_collection.find())
    return serialize_docs(executions)

async def execution_data_by_apaid_resolver(_, info, apaid):
    # Similar structure to automation_metadata_by_apaid_resolver
    context = info.context
    request = context["request"]
    
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"}
        )
    
    token = auth_header.split(" ")[1]
    user = await get_current_user(token)
    
    if not any(role in user.get("roles", []) + [user["role"]] for role in ["IDuser", "IDadmin"]):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="IndusIT Dashboard access required"
        )
    
    execution = execution_data_collection.find_one({"apaid": apaid})
    if not execution:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Execution data with APAID {apaid} not found"
        )
    return serialize_doc(execution)

@convert_kwargs_to_snake_case
async def create_execution_data_resolver(_, info, input):
    # Similar structure to create_automation_metadata_resolver
    context = info.context
    request = context["request"]
    
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"}
        )
    
    token = auth_header.split(" ")[1]
    user = await get_current_user(token)
    
    if not any(role in user.get("roles", []) + [user["role"]] for role in ["IDadmin"]):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="IDadmin role required"
        )
    
    existing = execution_data_collection.find_one({"apaid": input["apaid"]})
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Execution data for APAID {input['apaid']} already exists"
        )
    
    now = datetime.utcnow()
    input["created_at"] = now
    input["updated_at"] = now
    
    result = execution_data_collection.insert_one(input)
    created = execution_data_collection.find_one({"_id": result.inserted_id})
    return serialize_doc(created)

@convert_kwargs_to_snake_case
async def update_execution_data_resolver(_, info, id, input):
    # Similar to update_automation_metadata_resolver
    context = info.context
    request = context["request"]
    
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"}
        )
    
    token = auth_header.split(" ")[1]
    user = await get_current_user(token)
    
    if not any(role in user.get("roles", []) + [user["role"]] for role in ["IDadmin"]):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="IDadmin role required"
        )
    
    existing = execution_data_collection.find_one({"_id": ObjectId(id)})
    if not existing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Execution data with ID {id} not found"
        )
    
    input["updated_at"] = datetime.utcnow()
    
    execution_data_collection.update_one(
        {"_id": ObjectId(id)},
        {"$set": input}
    )
    
    updated = execution_data_collection.find_one({"_id": ObjectId(id)})
    return serialize_doc(updated)

@convert_kwargs_to_snake_case
async def delete_execution_data_resolver(_, info, id):
    # Similar to delete_automation_metadata_resolver
    context = info.context
    request = context["request"]
    
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"}
        )
    
    token = auth_header.split(" ")[1]
    user = await get_current_user(token)
    
    if not any(role in user.get("roles", []) + [user["role"]] for role in ["IDadmin"]):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="IDadmin role required"
        )
    
    existing = execution_data_collection.find_one({"_id": ObjectId(id)})
    if not existing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Execution data with ID {id} not found"
        )
    
    result = execution_data_collection.delete_one({"_id": ObjectId(id)})
    
    return result.deleted_count > 0

# Dashboard Stats Resolvers
async def user_dashboard_stats_resolver(_, info):
    context = info.context
    request = context["request"]
    
    # Authenticate user
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"}
        )
    
    token = auth_header.split(" ")[1]
    user = await get_current_user(token)
    
    # Check if user has IDuser or IDadmin role
    if not any(role in user.get("roles", []) + [user["role"]] for role in ["IDuser", "IDadmin"]):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="IndusIT Dashboard access required"
        )
    
    # Calculate automations count by category
    pipeline = [
        {"$group": {"_id": "$category", "count": {"$sum": 1}}},
        {"$project": {"category": "$_id", "count": 1, "_id": 0}}
    ]
    category_counts = list(automation_metadata_collection.aggregate(pipeline))
    
    # Calculate volumes processed today
    # This is a simplified calculation - in a real implementation, you'd query actual daily volumes
    volumes_processed = 0
    for execution in execution_data_collection.find({"current_status": "Running"}):
        volumes_processed += execution.get("volumes_daily", 0)
    
    # Get P1 bots status
    p1_bots = []
    for automation in automation_metadata_collection.find({"priority": "P1"}):
        apaid = automation["apaid"]
        execution = execution_data_collection.find_one({"apaid": apaid})
        status = execution["current_status"] if execution else "Unknown"
        p1_bots.append({
            "apaid": apaid,
            "rpa_name": automation["rpa_name"],
            "status": status
        })
    
    return {
        "automations_count_by_category": category_counts,
        "volumes_processed_today": volumes_processed,
        "p1_bots_status": p1_bots
    }

async def admin_dashboard_stats_resolver(_, info):
    context = info.context
    request = context["request"]
    
    # Authenticate user
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"}
        )
    
    token = auth_header.split(" ")[1]
    user = await get_current_user(token)
    
    # Check if user has IDadmin role
    if not any(role in user.get("roles", []) + [user["role"]] for role in ["IDadmin"]):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="IDadmin role required"
        )
    
    # Get user dashboard stats first
    user_stats = await user_dashboard_stats_resolver(_, info)
    
    # Add admin-specific stats
    # For demo purposes, these are hardcoded values
    # In a real implementation, you would query actual data
    last_dr_date = "15-04-2023"
    current_vulns = 5
    
    return {
        **user_stats,
        "last_dr_date": last_dr_date,
        "current_vulns": current_vulns
    }

# Implement the rest of the resolvers for Infra Register, Interface Register, and Microbot Register
# following the same pattern as above
