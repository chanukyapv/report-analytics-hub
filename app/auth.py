
from datetime import datetime, timedelta
from fastapi import HTTPException, status, Depends
from jose import JWTError, jwt
from passlib.context import CryptContext
from app.db.mongodb import users_collection, role_requests_collection
import os
from bson import ObjectId

# JWT Configuration
SECRET_KEY = os.environ.get("SECRET_KEY", "your_secret_key_here")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 24 hours

# Password context for hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: timedelta = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(token: str):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email = payload.get("sub")
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    user = users_collection.find_one({"email": email})
    if user is None:
        raise credentials_exception

    # Convert ObjectId to string
    user["_id"] = str(user["_id"])
    
    return user

def validate_bt_email(email):
    """Validate that email is from bt.com domain"""
    if not email.endswith("@bt.com"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only bt.com email addresses are allowed"
        )
    return True

# Role-based permissions
def is_app_admin(user):
    return user["role"] == "appadmin"

def app_admin_required(user):
    if not is_app_admin(user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="App Admin privileges required"
        )
    return True

def is_admin(user):
    return user["role"] == "admin" or user["role"] == "IDadmin" or user["role"] == "appadmin"

def admin_required(user):
    if not is_admin(user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin privileges required"
        )
    return True

def is_sd_user(user):
    return user["role"] in ["admin", "SDadmin", "SDuser", "appadmin"]

def sd_user_required(user):
    if not is_sd_user(user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Service Dashboard user privileges required"
        )
    return True

def is_id_user(user):
    return user["role"] in ["admin", "IDadmin", "IDuser", "appadmin"]

def id_user_required(user):
    if not is_id_user(user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="IndusIT Dashboard user privileges required"
        )
    return True

def is_id_admin(user):
    return user["role"] in ["admin", "IDadmin", "appadmin"]

def id_admin_required(user):
    if not is_id_admin(user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="IndusIT Dashboard admin privileges required"
        )
    return True
