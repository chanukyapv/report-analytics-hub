
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from ariadne.asgi import GraphQL
import os
import sys

# Add current directory to Python path for correct imports
sys.path.insert(0, os.path.abspath("."))

# Import schema from resolvers
from resolvers import schema

# Lifespan (startup/shutdown hooks)
@asynccontextmanager
async def lifespan(app: FastAPI):
    print("🚀 App is starting up...")
    # Initialize exports directory
    export_dir = os.environ.get("EXPORT_DIR", "./exports")
    os.makedirs(export_dir, exist_ok=True)
    yield
    print("🛑 App is shutting down...")

# Create FastAPI app
app = FastAPI(
    lifespan=lifespan,
    title="QLA1 Dashboard API",
    description="API for the QLA1 Dashboard application",
    version="1.0.0",
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Updated to allow React frontend to connect
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount GraphQL route
app.add_route("/graphql", GraphQL(schema, debug=True))
