
from ariadne import convert_kwargs_to_snake_case
from fastapi import HTTPException, status
from app.auth import get_current_user, id_user_required, id_admin_required
from app.db.mongodb import (
    automations_collection, execution_data_collection,
    interfaces_collection, infra_servers_collection,
    microbots_collection
)

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

    # Check if user has IndusIT dashboard access
    id_user_required(user)

    # Get automations count
    total_automations = automations_collection.count_documents({})

    # Get automations by category
    automations_by_category = []
    pipeline_category = [
        {"$group": {"_id": "$category", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}}
    ]
    category_counts = list(automations_collection.aggregate(pipeline_category))
    for category in category_counts:
        automations_by_category.append({
            "category": category["_id"],
            "count": category["count"]
        })

    # Get automations by status
    automations_by_status = []
    pipeline_status = [
        {"$group": {"_id": "$lifecycle_status", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}}
    ]
    status_counts = list(automations_collection.aggregate(pipeline_status))
    for status in status_counts:
        automations_by_status.append({
            "status": status["_id"],
            "count": status["count"]
        })

    # Get volumes processed today
    volumes_processed_today = 0
    for execution_data in execution_data_collection.find():
        volumes_processed_today += execution_data.get("daily_volumes_processed", 0)

    # Get P1 bots status
    priority_p1_bots = []
    for automation in automations_collection.find({"priority": "P1"}):
        automation_id = str(automation["_id"])
        execution_data = execution_data_collection.find_one({"automation_id": automation_id})
        if execution_data:
            priority_p1_bots.append({
                "apaid": automation["apaid"],
                "rpa_name": automation["rpa_name"],
                "current_status": execution_data.get("current_status", "Unknown")
            })
        else:
            priority_p1_bots.append({
                "apaid": automation["apaid"],
                "rpa_name": automation["rpa_name"],
                "current_status": "No Data"
            })

    # Get total counts
    total_servers = infra_servers_collection.count_documents({})
    total_interfaces = interfaces_collection.count_documents({})
    total_microbots = microbots_collection.count_documents({})

    return {
        "total_automations": total_automations,
        "automations_by_category": automations_by_category,
        "automations_by_status": automations_by_status,
        "volumes_processed_today": volumes_processed_today,
        "priority_p1_bots_status": priority_p1_bots,
        "total_servers": total_servers,
        "total_interfaces": total_interfaces,
        "total_microbots": total_microbots
    }

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

    # Check if user has IndusIT admin access
    id_admin_required(user)

    # In a real app, you would get this data from a database or another service
    # For now, we'll just return mock data
    return {
        "last_dr_date": "15-04-2025",
        "current_vulnerabilities": 27,
        "critical_vulnerabilities": 3,
        "high_vulnerabilities": 8,
        "medium_vulnerabilities": 12,
        "low_vulnerabilities": 4
    }
