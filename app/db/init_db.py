
from app.db.mongodb import users_collection, roles_collection
from app.auth import get_password_hash
from datetime import datetime
import os

def init_roles():
    """Initialize application roles if they don't exist"""
    required_roles = [
        {
            "name": "user",
            "description": "Regular user with basic access"
        },
        {
            "name": "SDuser",
            "description": "Service Dashboard user with read-only access"
        },
        {
            "name": "SDadmin",
            "description": "Service Dashboard admin with full access"
        },
        {
            "name": "IDuser",
            "description": "IndusIT Dashboard user with read-only access"
        },
        {
            "name": "IDadmin",
            "description": "IndusIT Dashboard admin with full access"
        },
        {
            "name": "SCuser",
            "description": "Security Dashboard user with read-only access"
        },
        {
            "name": "SCadmin",
            "description": "Security Dashboard admin with full access"
        },
        {
            "name": "IRuser",
            "description": "Incident Dashboard user with read-only access"
        },
        {
            "name": "IRadmin",
            "description": "Incident Dashboard admin with full access"
        },
        {
            "name": "PRuser",
            "description": "Problem Dashboard user with read-only access"
        },
        {
            "name": "PRadmin",
            "description": "Problem Dashboard admin with full access"
        },
        {
            "name": "superadmin",
            "description": "Super administrator with access to all systems and user management"
        }
    ]
    
    for role in required_roles:
        existing_role = roles_collection.find_one({"name": role["name"]})
        if not existing_role:
            role["created_at"] = datetime.utcnow()
            roles_collection.insert_one(role)
            print(f"✅ Created role: {role['name']}")
        else:
            print(f"ℹ️ Role already exists: {role['name']}")

def create_superadmin():
    """Create superadmin user if it doesn't exist"""
    # ... keep existing code (create_superadmin function)

def initialize_database():
    """Initialize database with required roles and superadmin user"""
    print("🔄 Initializing database...")
    init_roles()
    create_superadmin()
    print("✅ Database initialization complete")
