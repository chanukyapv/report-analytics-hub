
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
    return doc

def serialize_docs(docs):
    return [serialize_doc(doc) for doc in docs]
