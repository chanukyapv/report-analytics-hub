
from pymongo import MongoClient
from bson.objectid import ObjectId
import os
from datetime import datetime

# MongoDB connection
MONGO_URI = os.environ.get("MONGO_URI", "mongodb://localhost:27017")
client = MongoClient(MONGO_URI)
db = client.metrics_tracking

# Collections
users_collection = db.users
roles_collection = db.roles
role_requests_collection = db.role_requests
metrics_collection = db.metrics
weekly_reports_collection = db.weekly_reports
fy_configs_collection = db.fy_configs
report_drafts_collection = db.report_drafts

# IndusIT Dashboard Collections
automations_collection = db.automations
execution_data_collection = db.execution_data
infra_servers_collection = db.infra_servers
interfaces_collection = db.interfaces
microbots_collection = db.microbots

# Helper functions for MongoDB
def serialize_doc(doc):
    if doc:
        doc["id"] = str(doc["_id"])
        doc.pop("_id", None)
        
        # Format dates in DD-MM-YYYY format for date fields
        if "week_date" in doc:
            try:
                if isinstance(doc["week_date"], str):
                    # Check if already in DD-MM-YYYY format
                    if doc["week_date"].count('-') == 2 and len(doc["week_date"].split('-')[0]) == 2:
                        pass  # Already in correct format
                    else:
                        # Convert from ISO format if needed
                        date_obj = datetime.fromisoformat(doc["week_date"].replace('Z', '+00:00'))
                        doc["week_date"] = date_obj.strftime('%d-%m-%Y')
                elif isinstance(doc["week_date"], datetime):
                    doc["week_date"] = doc["week_date"].strftime('%d-%m-%Y')
            except (ValueError, AttributeError):
                pass  # Keep original format if parsing fails
        
        # Format timestamp fields
        date_fields = [
            "last_successful_execution",
            "latest_password_change_date",
            "next_password_update_date",
            "last_dr_date",
            "created_at",
            "updated_at",
            "request_date",
            "approval_date",
            "last_login"
        ]
        
        for field in date_fields:
            if field in doc and doc[field]:
                try:
                    if isinstance(doc[field], str):
                        if doc[field].count('-') == 2 and len(doc[field].split('-')[0]) == 2:
                            pass  # Already in correct format
                        else:
                            # Convert from ISO format if needed
                            date_obj = datetime.fromisoformat(doc[field].replace('Z', '+00:00'))
                            doc[field] = date_obj.strftime('%d-%m-%Y')
                    elif isinstance(doc[field], datetime):
                        doc[field] = doc[field].strftime('%d-%m-%Y')
                except (ValueError, AttributeError):
                    pass  # Keep original format if parsing fails
    return doc

def serialize_docs(docs):
    return [serialize_doc(doc) for doc in docs]
