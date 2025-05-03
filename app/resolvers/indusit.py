
from ariadne import convert_kwargs_to_snake_case
from fastapi import HTTPException, status
from datetime import datetime
from app.auth import get_current_user, admin_required
from app.db.mongodb import (
    automations_collection, execution_data_collection,
    infra_servers_collection, interfaces_collection, 
    microbots_collection, serialize_doc, serialize_docs
)
from bson import ObjectId

# Automations Resolvers
@convert_kwargs_to_snake_case
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
    
    # Check if user has IDuser or IDadmin role
    if user["role"] not in ["IDadmin", "IDuser"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
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
    
    # Check if user has IDuser or IDadmin role
    if user["role"] not in ["IDadmin", "IDuser"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
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
    
    # Check if user has IDadmin role
    if user["role"] != "IDadmin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin privileges required"
        )
    
    # Check if automation with the same APAID already exists
    existing = automations_collection.find_one({"apaid": input["apaid"]})
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Automation with APAID {input['apaid']} already exists"
        )
    
    # Add created_by, created_at
    now = datetime.now()
    input["created_by"] = user["_id"]
    input["created_at"] = now
    input["updated_at"] = now
    
    result = automations_collection.insert_one(input)
    
    created_automation = automations_collection.find_one({"_id": result.inserted_id})
    return serialize_doc(created_automation)

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
    
    # Check if user has IDadmin role
    if user["role"] != "IDadmin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin privileges required"
        )
    
    # Check if automation exists
    existing = automations_collection.find_one({"_id": ObjectId(id)})
    if not existing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Automation with ID {id} not found"
        )
    
    # Update the fields and set updated_at
    input["updated_at"] = datetime.now()
    
    automations_collection.update_one(
        {"_id": ObjectId(id)},
        {"$set": input}
    )
    
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
    
    # Check if user has IDadmin role
    if user["role"] != "IDadmin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin privileges required"
        )
    
    # Check if automation exists
    existing = automations_collection.find_one({"_id": ObjectId(id)})
    if not existing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Automation with ID {id} not found"
        )
    
    # Check if there's related execution data
    execution_data = execution_data_collection.find_one({"automation_id": id})
    if execution_data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete automation with associated execution data"
        )
    
    # Check if there are related interfaces
    interfaces = interfaces_collection.find_one({"apaid": existing["apaid"]})
    if interfaces:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete automation with associated interfaces"
        )
    
    # Delete the automation
    automations_collection.delete_one({"_id": ObjectId(id)})
    
    return True

# Execution Data Resolvers
@convert_kwargs_to_snake_case
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
    
    # Check if user has IDuser or IDadmin role
    if user["role"] not in ["IDadmin", "IDuser"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
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
    
    # Check if user has IDuser or IDadmin role
    if user["role"] not in ["IDadmin", "IDuser"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
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
    
    # Check if user has IDadmin role
    if user["role"] != "IDadmin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin privileges required"
        )
    
    # Check if automation exists
    automation = automations_collection.find_one({"_id": ObjectId(input["automation_id"])})
    if not automation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Automation with ID {input['automation_id']} not found"
        )
    
    # Check if execution data for this automation already exists
    existing = execution_data_collection.find_one({"automation_id": input["automation_id"]})
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Execution data for automation ID {input['automation_id']} already exists"
        )
    
    # Add created_at, updated_at
    now = datetime.now()
    input["created_at"] = now
    input["updated_at"] = now
    
    result = execution_data_collection.insert_one(input)
    
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
    
    # Check if user has IDadmin role
    if user["role"] != "IDadmin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin privileges required"
        )
    
    # Check if execution data exists
    existing = execution_data_collection.find_one({"_id": ObjectId(id)})
    if not existing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Execution data with ID {id} not found"
        )
    
    # Update the fields and set updated_at
    input["updated_at"] = datetime.now()
    
    execution_data_collection.update_one(
        {"_id": ObjectId(id)},
        {"$set": input}
    )
    
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
    
    # Check if user has IDadmin role
    if user["role"] != "IDadmin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin privileges required"
        )
    
    # Check if execution data exists
    existing = execution_data_collection.find_one({"_id": ObjectId(id)})
    if not existing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Execution data with ID {id} not found"
        )
    
    # Delete the execution data
    execution_data_collection.delete_one({"_id": ObjectId(id)})
    
    return True

# Infra Server Resolvers
@convert_kwargs_to_snake_case
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
    
    # Check if user has IDuser or IDadmin role
    if user["role"] not in ["IDadmin", "IDuser"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
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
    
    # Check if user has IDuser or IDadmin role
    if user["role"] not in ["IDadmin", "IDuser"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
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
    
    # Check if user has IDadmin role
    if user["role"] != "IDadmin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin privileges required"
        )
    
    # Check if infra server with the same hostname already exists
    existing = infra_servers_collection.find_one({"hostname": input["hostname"]})
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Infra server with hostname {input['hostname']} already exists"
        )
    
    # Add created_at, updated_at
    now = datetime.now()
    input["created_at"] = now
    input["updated_at"] = now
    
    result = infra_servers_collection.insert_one(input)
    
    created_infra_server = infra_servers_collection.find_one({"_id": result.inserted_id})
    return serialize_doc(created_infra_server)

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
    
    # Check if user has IDadmin role
    if user["role"] != "IDadmin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin privileges required"
        )
    
    # Check if infra server exists
    existing = infra_servers_collection.find_one({"_id": ObjectId(id)})
    if not existing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Infra server with ID {id} not found"
        )
    
    # Update the fields and set updated_at
    input["updated_at"] = datetime.now()
    
    infra_servers_collection.update_one(
        {"_id": ObjectId(id)},
        {"$set": input}
    )
    
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
    
    # Check if user has IDadmin role
    if user["role"] != "IDadmin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin privileges required"
        )
    
    # Check if infra server exists
    existing = infra_servers_collection.find_one({"_id": ObjectId(id)})
    if not existing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Infra server with ID {id} not found"
        )
    
    # Delete the infra server
    infra_servers_collection.delete_one({"_id": ObjectId(id)})
    
    return True

# Interface Resolvers
@convert_kwargs_to_snake_case
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
    
    # Check if user has IDuser or IDadmin role
    if user["role"] not in ["IDadmin", "IDuser"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    # Filter by APAID if provided
    query = {}
    if apaid:
        query["apaid"] = apaid
        
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
    
    # Check if user has IDuser or IDadmin role
    if user["role"] not in ["IDadmin", "IDuser"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
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
    
    # Check if user has IDadmin role
    if user["role"] != "IDadmin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin privileges required"
        )
    
    # Check if automation with APAID exists
    automation = automations_collection.find_one({"apaid": input["apaid"]})
    if not automation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Automation with APAID {input['apaid']} not found"
        )
    
    # Add created_at, updated_at
    now = datetime.now()
    input["created_at"] = now
    input["updated_at"] = now
    
    result = interfaces_collection.insert_one(input)
    
    created_interface = interfaces_collection.find_one({"_id": result.inserted_id})
    return serialize_doc(created_interface)

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
    
    # Check if user has IDadmin role
    if user["role"] != "IDadmin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin privileges required"
        )
    
    # Check if interface exists
    existing = interfaces_collection.find_one({"_id": ObjectId(id)})
    if not existing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Interface with ID {id} not found"
        )
    
    # Update the fields and set updated_at
    input["updated_at"] = datetime.now()
    
    interfaces_collection.update_one(
        {"_id": ObjectId(id)},
        {"$set": input}
    )
    
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
    
    # Check if user has IDadmin role
    if user["role"] != "IDadmin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin privileges required"
        )
    
    # Check if interface exists
    existing = interfaces_collection.find_one({"_id": ObjectId(id)})
    if not existing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Interface with ID {id} not found"
        )
    
    # Delete the interface
    interfaces_collection.delete_one({"_id": ObjectId(id)})
    
    return True

# Microbot Resolvers
@convert_kwargs_to_snake_case
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
    
    # Check if user has IDuser or IDadmin role
    if user["role"] not in ["IDadmin", "IDuser"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
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
    
    # Check if user has IDuser or IDadmin role
    if user["role"] not in ["IDadmin", "IDuser"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
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
    
    # Check if user has IDadmin role
    if user["role"] != "IDadmin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin privileges required"
        )
    
    # Check if microbot with the same name already exists
    existing = microbots_collection.find_one({"bot_name": input["bot_name"]})
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Microbot with name {input['bot_name']} already exists"
        )
    
    # Validate that APAIDs exist
    for apaid in input["apaid_list"]:
        automation = automations_collection.find_one({"apaid": apaid})
        if not automation:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Automation with APAID {apaid} not found"
            )
    
    # Add created_at, updated_at
    now = datetime.now()
    input["created_at"] = now
    input["updated_at"] = now
    
    result = microbots_collection.insert_one(input)
    
    created_microbot = microbots_collection.find_one({"_id": result.inserted_id})
    return serialize_doc(created_microbot)

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
    
    # Check if user has IDadmin role
    if user["role"] != "IDadmin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin privileges required"
        )
    
    # Check if microbot exists
    existing = microbots_collection.find_one({"_id": ObjectId(id)})
    if not existing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Microbot with ID {id} not found"
        )
    
    # Validate that APAIDs exist
    for apaid in input["apaid_list"]:
        automation = automations_collection.find_one({"apaid": apaid})
        if not automation:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Automation with APAID {apaid} not found"
            )
    
    # Update the fields and set updated_at
    input["updated_at"] = datetime.now()
    
    microbots_collection.update_one(
        {"_id": ObjectId(id)},
        {"$set": input}
    )
    
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
    
    # Check if user has IDadmin role
    if user["role"] != "IDadmin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin privileges required"
        )
    
    # Check if microbot exists
    existing = microbots_collection.find_one({"_id": ObjectId(id)})
    if not existing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Microbot with ID {id} not found"
        )
    
    # Delete the microbot
    microbots_collection.delete_one({"_id": ObjectId(id)})
    
    return True

# Dashboard Summary Resolvers
@convert_kwargs_to_snake_case
async def indusit_dashboard_summary_resolver(_, info):
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
    
    # Check if user has IDuser or IDadmin role
    if user["role"] not in ["IDadmin", "IDuser"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    # Get total automation count
    total_automations = automations_collection.count_documents({})
    
    # Count automations by category
    categories = []
    for category in ["SD", "RPA", "ShadowIT"]:
        count = automations_collection.count_documents({"category": category})
        if count > 0:
            categories.append({
                "category": category,
                "count": count
            })
    
    # Count automations by lifecycle status
    statuses = []
    for status in ["Design", "Development", "Operational", "SwitchOff", "Rationalized"]:
        count = automations_collection.count_documents({"lifecycle_status": status})
        if count > 0:
            statuses.append({
                "status": status,
                "count": count
            })
    
    # Calculate volumes processed today
    volumes_processed = 0
    execution_data_list = list(execution_data_collection.find({}, {"daily_volumes_processed": 1}))
    for ed in execution_data_list:
        volumes_processed += ed.get("daily_volumes_processed", 0)
    
    # Get P1 priority bots status
    p1_bots = []
    automations_list = list(automations_collection.find({"priority": "P1"}, {"apaid": 1, "rpa_name": 1}))
    for automation in automations_list:
        execution_data = execution_data_collection.find_one({"automation_id": str(automation["_id"])})
        if execution_data:
            p1_bots.append({
                "apaid": automation["apaid"],
                "rpa_name": automation["rpa_name"],
                "current_status": execution_data.get("current_status", "Unknown")
            })
    
    # Count total servers, interfaces, microbots
    total_servers = infra_servers_collection.count_documents({})
    total_interfaces = interfaces_collection.count_documents({})
    total_microbots = microbots_collection.count_documents({})
    
    result = {
        "total_automations": total_automations,
        "automations_by_category": categories,
        "automations_by_status": statuses,
        "volumes_processed_today": volumes_processed,
        "priority_p1_bots_status": p1_bots,
        "total_servers": total_servers,
        "total_interfaces": total_interfaces,
        "total_microbots": total_microbots
    }
    
    return result

@convert_kwargs_to_snake_case
async def admin_dashboard_summary_resolver(_, info):
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
    
    # Check if user has IDadmin role
    if user["role"] != "IDadmin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin privileges required"
        )
    
    # Mock data for now - in a real scenario, this would come from a vulnerability scanner or other source
    result = {
        "last_dr_date": "01-05-2023",
        "current_vulnerabilities": 24,
        "critical_vulnerabilities": 3,
        "high_vulnerabilities": 8,
        "medium_vulnerabilities": 10,
        "low_vulnerabilities": 3
    }
    
    return result
