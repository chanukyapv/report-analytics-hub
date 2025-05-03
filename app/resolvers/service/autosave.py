
from ariadne import convert_kwargs_to_snake_case
from fastapi import HTTPException, status
from datetime import datetime
from app.auth import get_current_user
from app.db.mongodb import report_drafts_collection, serialize_doc

@convert_kwargs_to_snake_case
async def save_draft_resolver(_, info, input):
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

    fy = input.get("fy")
    quarter = input.get("quarter")
    week_date = input.get("week_date")
    metrics = input.get("metrics")

    # Check if draft already exists for this user and week
    existing_draft = report_drafts_collection.find_one({
        "created_by": user["_id"],
        "fy": fy,
        "quarter": quarter,
        "week_date": week_date
    })

    current_time = datetime.now()
    
    if existing_draft:
        # Update existing draft
        report_drafts_collection.update_one(
            {"_id": existing_draft["_id"]},
            {"$set": {
                "metrics": metrics,
                "updated_at": current_time
            }}
        )
    else:
        # Create new draft
        report_drafts_collection.insert_one({
            "fy": fy,
            "quarter": quarter,
            "week_date": week_date,
            "metrics": metrics,
            "created_by": user["_id"],
            "created_at": current_time,
            "updated_at": current_time
        })

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
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"}
        )

    token = auth_header.split(" ")[1]
    user = await get_current_user(token)

    # Get draft for this user and week
    draft = report_drafts_collection.find_one({
        "created_by": user["_id"],
        "fy": fy,
        "quarter": quarter,
        "week_date": week_date
    })

    if not draft:
        return None

    return serialize_doc(draft)
