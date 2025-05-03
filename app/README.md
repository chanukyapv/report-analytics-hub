
# QLA1 Dashboard Backend

This backend powers the QLA1 Dashboard, providing a GraphQL API for tracking performance metrics, generating reports, and visualizing performance insights across multiple dashboards.

## Available Dashboards

- **Service Dashboard**: Track, visualize, and report on service metrics
- **IndusIT Dashboard**: Governance tool for automation onboarding and monitoring
- **PR Dashboard** (Coming Soon)
- **Security Dashboard** (Coming Soon)

## Tech Stack

- **FastAPI**: High-performance web framework
- **Ariadne**: Schema-first GraphQL implementation
- **MongoDB**: Database for storing metrics and reports
- **Python 3.9+**: Programming language

## Getting Started

1. **Install dependencies**

```bash
pip install -r requirements.txt
```

2. **Environment Variables**

Set the following environment variables:

- `MONGO_URI`: MongoDB connection string (default: mongodb://localhost:27017)
- `SECRET_KEY`: JWT secret key for authentication
- `EXPORT_DIR`: Directory for storing exported reports (default: ./exports)

3. **Run the Application**

```bash
uvicorn app.main:app --reload
```

## API Usage

The application exposes a GraphQL API at `/graphql` which can be explored using GraphQL Playground.

### Authentication

All API calls require authentication except for login and register. 
Pass the JWT token in the Authorization header:

```
Authorization: Bearer <token>
```

## Project Structure

```
app/
├── auth.py                     # Authentication logic
├── db/                         # Database models and connection
├── middleware.py               # FastAPI middleware
├── resolvers/                  # GraphQL resolvers
│   ├── service/                # Service Dashboard resolvers
│   ├── indusit/                # IndusIT Dashboard resolvers
│   └── auth.py                 # Authentication resolvers
├── utils/                      # Utility functions
└── main.py                     # FastAPI application entry point
```

## Access Control

- **Admin**: Full access to all features and dashboards
- **SDAdmin**: Can manage service dashboard metrics and reports
- **SDUser**: Can view service dashboard data
- **IDAdmin**: Can manage IndusIT dashboard data
- **IDUser**: Can view IndusIT dashboard data

## Data Format

The application uses DD-MM-YYYY date format for all date-related fields.
