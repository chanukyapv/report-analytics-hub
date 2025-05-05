
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
metrics_collection = db.metrics
weekly_reports_collection = db.weekly_reports
fy_configs_collection = db.fy_configs
report_drafts_collection = db.report_drafts

# IndusIT Dashboard Collections
automation_metadata_collection = db.automation_metadata
execution_data_collection = db.execution_data
infra_register_collection = db.infra_register
interface_register_collection = db.interface_register
microbot_register_collection = db.microbot_register

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
        
        # Format date fields in IndusIT collections
        date_fields = [
            "latest_password_change_date", 
            "next_password_update_date", 
            "last_successful_execution",
            "last_dr_date"
        ]
        
        for field in date_fields:
            if field in doc and doc[field]:
                try:
                    if isinstance(doc[field], str):
                        # Check if already in DD-MM-YYYY format
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
                
        # Convert created_at and updated_at to proper format if they exist
        if "created_at" in doc and doc["created_at"]:
            try:
                doc["created_at"] = doc["created_at"].strftime('%d-%m-%Y %H:%M:%S')
            except AttributeError:
                pass
                
        if "updated_at" in doc and doc["updated_at"]:
            try:
                doc["updated_at"] = doc["updated_at"].strftime('%d-%m-%Y %H:%M:%S')
            except AttributeError:
                pass
    return doc

def serialize_docs(docs):
    return [serialize_doc(doc) for doc in docs]
