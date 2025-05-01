
from ariadne import convert_kwargs_to_snake_case
from fastapi import HTTPException, status
from bson import ObjectId
from datetime import datetime
from app.db.mongodb import report_drafts_collection
from app.auth import get_current_user, admin_required

# This file contains autosave functionality for reports
# You can expand this module with additional endpoints as needed

@convert_kwargs_to_snake_case
async def save_draft_resolver(_, info, input):
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
    
    # Only admin can create drafts
    admin_required(user)
    
    # Check if draft exists
    existing_draft = report_drafts_collection.find_one({
        "fy": input["fy"],
        "quarter": input["quarter"],
        "week_date": input["week_date"],
        "created_by": ObjectId(user["_id"])
    })
    
    if existing_draft:
        # Update existing draft
        draft_id = existing_draft["_id"]
        report_drafts_collection.update_one(
            {"_id": draft_id},
            {
                "$set": {
                    "metrics": input["metrics"],
                    "updated_at": datetime.utcnow()
                }
            }
        )
    else:
        # Create new draft
        draft_data = {
            "fy": input["fy"],
            "quarter": input["quarter"],
            "week_date": input["week_date"],
            "metrics": input["metrics"],
            "created_by": ObjectId(user["_id"]),
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        
        report_drafts_collection.insert_one(draft_data)
    
    return True

@convert_kwargs_to_snake_case
async def get_draft_resolver(_, info, fy, quarter, week_date):
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
    
    # Get draft
    draft = report_drafts_collection.find_one({
        "fy": fy,
        "quarter": quarter,
        "week_date": week_date,
        "created_by": ObjectId(user["_id"])
    })
    
    if not draft:
        return None
    
    draft["id"] = str(draft["_id"])
    del draft["_id"]
    draft["created_by"] = str(draft["created_by"])
    
    return draft
