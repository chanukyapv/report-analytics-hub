from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager
from ariadne.asgi import GraphQL
import os

# Import schema from resolvers
from app.resolvers import schema
from app.middleware import logging_middleware, rate_limiting_middleware, error_handling_middleware
from app.db.init_db import initialize_database

# ✅ Lifespan (startup/shutdown hooks)
@asynccontextmanager
async def lifespan(app: FastAPI):
    print("🚀 App is starting up...")
    # Initialize database with roles and superadmin
    initialize_database()
    # Initialize exports directory
    export_dir = os.environ.get("EXPORT_DIR", "./exports")
    os.makedirs(export_dir, exist_ok=True)
    yield
    print("🛑 App is shutting down...")

# ✅ Create FastAPI app
app = FastAPI(lifespan=lifespan)

# ✅ Trusted Host Middleware
app.add_middleware(
    TrustedHostMiddleware,
    allowed_hosts=["localhost", "127.0.0.1", "*.yourdomain.com"]
)

# ✅ CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Updated to allow React frontend to connect
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ✅ Custom middlewares
@app.middleware("http")
async def custom_middleware(request: Request, call_next):
    # Chain our custom middlewares
    async def process_request(request):
        return await call_next(request)
    
    # Apply middlewares in sequence
    response = await error_handling_middleware(
        request, 
        lambda req: rate_limiting_middleware(
            req, 
            lambda req2: logging_middleware(req2, process_request)
        )
    )
    
    return response

# ✅ Middleware: Block malicious paths
@app.middleware("http")
async def block_malicious_requests(request: Request, call_next):
    url_path = str(request.url.path).lower()
    suspicious_patterns = ["jndi", "struts2", "optiontransferselect", "web-inf"]
    if any(pattern in url_path for pattern in suspicious_patterns):
        return JSONResponse(status_code=403, content={"detail": "Forbidden"})
    return await call_next(request)

# ✅ Middleware: Custom 404 handler
@app.middleware("http")
async def custom_404_handler(request: Request, call_next):
    response = await call_next(request)
    if response.status_code == 404:
        return JSONResponse(status_code=404, content={"detail": "Not Found"})
    return response

# Mount static files for downloads
app.mount("/downloads", StaticFiles(directory="exports"), name="downloads")

# ✅ Mount GraphQL route
app.add_route("/graphql", GraphQL(schema, debug=True))
