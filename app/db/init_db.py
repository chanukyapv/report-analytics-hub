
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
            "name": "admin",
            "description": "Administrator with full access to service dashboard"
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
    # Get credentials from environment or use defaults (only for development)
    superadmin_email = os.environ.get("SUPERADMIN_EMAIL", "superadmin@example.com")
    superadmin_password = os.environ.get("SUPERADMIN_PASSWORD", "Superadmin@123")
    superadmin_name = os.environ.get("SUPERADMIN_NAME", "Super Administrator")
    
    existing_user = users_collection.find_one({"email": superadmin_email})
    
    if not existing_user:
        user_data = {
            "email": superadmin_email,
            "password": get_password_hash(superadmin_password),
            "name": superadmin_name,
            "role": "superadmin",
            "roles": ["superadmin", "admin", "SDadmin", "IDadmin"],
            "is_active": True,
            "created_at": datetime.utcnow()
        }
        
        users_collection.insert_one(user_data)
        print(f"✅ Created superadmin user: {superadmin_email}")
        print(f"⚠️ Default superadmin password in use! Change it in production!")
    else:
        print(f"ℹ️ Superadmin already exists: {superadmin_email}")

def initialize_database():
    """Initialize database with required roles and superadmin user"""
    print("🔄 Initializing database...")
    init_roles()
    create_superadmin()
    print("✅ Database initialization complete")

