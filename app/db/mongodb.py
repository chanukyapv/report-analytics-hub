
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

# Helper functions for MongoDB
def serialize_doc(doc):
    if doc:
        doc["id"] = str(doc["_id"])
        doc.pop("_id", None)
        
        # Format dates in DD-MM-YYYY format for date fields
        if "week_date" in doc:
            try:
                date_obj = datetime.fromisoformat(doc["week_date"].replace('Z', '+00:00'))
                doc["week_date"] = date_obj.strftime('%d-%m-%Y')
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
