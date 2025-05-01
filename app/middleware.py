
from fastapi import Request, Response
from fastapi.responses import JSONResponse
import time
import logging
from typing import Callable

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Rate limiting dictionary
rate_limit_store = {}

# IP based rate limiting
async def rate_limiting_middleware(request: Request, call_next: Callable):
    # Get client IP
    client_ip = request.client.host
    current_time = time.time()
    
    # Initialize entry for new IP
    if client_ip not in rate_limit_store:
        rate_limit_store[client_ip] = {
            "count": 0, 
            "timestamp": current_time
        }
    
    # Reset counter if time window has passed (e.g., 1 minute)
    if current_time - rate_limit_store[client_ip]["timestamp"] > 60:
        rate_limit_store[client_ip] = {
            "count": 0, 
            "timestamp": current_time
        }
    
    # Increment request count
    rate_limit_store[client_ip]["count"] += 1
    
    # Check if rate limit exceeded
    if rate_limit_store[client_ip]["count"] > 100:  # 100 requests per minute
        return JSONResponse(
            status_code=429,
            content={"detail": "Rate limit exceeded. Please try again later."}
        )
    
    # Proceed with request
    return await call_next(request)

# Request logging middleware
async def logging_middleware(request: Request, call_next: Callable):
    start_time = time.time()
    
    # Log request details
    logger.info(f"Request: {request.method} {request.url.path}")
    
    # Process request
    response = await call_next(request)
    
    # Log response details and time
    process_time = time.time() - start_time
    logger.info(f"Response: {request.method} {request.url.path} - Status: {response.status_code}, Time: {process_time:.4f}s")
    
    # Add processing time header to the response
    response.headers["X-Process-Time"] = str(process_time)
    
    return response

# Error handling middleware
async def error_handling_middleware(request: Request, call_next: Callable):
    try:
        return await call_next(request)
    except Exception as e:
        logger.error(f"Unhandled exception: {str(e)}")
        return JSONResponse(
            status_code=500,
            content={"detail": "Internal Server Error"}
        )
