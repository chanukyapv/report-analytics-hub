
# QLA1 Dashboard Backend

This folder contains the backend code for the QLA1 Dashboard application.

## Tech Stack

- FastAPI - Web framework
- Ariadne - GraphQL implementation
- MongoDB - Database
- Python 3.9+ - Programming language

## Setup

1. Create a virtual environment
   ```bash
   python -m venv venv
   ```

2. Activate the virtual environment
   ```bash
   # On Windows
   .\venv\Scripts\activate
   
   # On macOS/Linux
   source venv/bin/activate
   ```

3. Install dependencies
   ```bash
   pip install -r requirements.txt
   ```

4. Set up environment variables
   ```bash
   # Copy the example environment file
   cp .env.example .env
   
   # Edit the .env file with your MongoDB credentials and other settings
   ```

5. Start the server
   ```bash
   uvicorn app.main:app --reload
   ```

The GraphQL API will be available at http://localhost:8000/graphql

## Project Structure

```
app/
├── db/
│   └── mongodb.py         # MongoDB connection and helper functions
├── resolvers/
│   ├── admin/             # Admin dashboard resolvers
│   ├── service/           # Service dashboard resolvers
│   ├── indusit/           # IndusIT dashboard resolvers
│   └── __init__.py        # Resolvers initialization
├── auth.py                # Authentication and authorization
├── main.py                # FastAPI app creation and configuration
├── schema.graphql         # GraphQL schema
└── middleware.py          # Custom middleware functions
```

## Adding New Features

1. Define types and operations in `schema.graphql`
2. Create resolvers in the appropriate folder under `resolvers/`
3. Register resolvers in `resolvers/__init__.py`

## Environment Variables

- `MONGO_URI`: MongoDB connection string
- `SECRET_KEY`: Secret key for JWT token generation
- `ACCESS_TOKEN_EXPIRE_MINUTES`: JWT token expiration time in minutes
- `EXPORT_DIR`: Directory for exported reports (default: ./exports)

## Authentication

The API uses JWT tokens for authentication. To access protected endpoints:
1. Call the `login` mutation to obtain a token
2. Include the token in the Authorization header of subsequent requests:
   ```
   Authorization: Bearer <token>
   ```
