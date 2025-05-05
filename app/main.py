
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
    # Initialize exports directory if needed
    os.makedirs("./exports", exist_ok=True)
    yield
    print("🛑 App is shutting down...")

# Create FastAPI app
app = FastAPI(
    lifespan=lifespan,
    title="QLA Dashboard API",
    description="API for the QLA Dashboard application",
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

# Simple health check endpoint
@app.get("/")
async def root():
    return {"status": "ok", "message": "QLA Dashboard API is running"}
