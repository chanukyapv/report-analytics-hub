
# QLA1 Dashboard Backend

This backend powers the QLA1 Dashboard, providing a GraphQL API for tracking performance metrics, generating reports, and visualizing performance insights across multiple dashboards.

## Available Dashboards

- **Service Dashboard**: Track, visualize, and report on service metrics
- **IndusIT Dashboard**: Governance tool for automation deployments on IndusIT platform
- **Incident Dashboard** (Coming Soon)
- **PR Dashboard** (Coming Soon)
- **Security Dashboard** (Coming Soon)

## Tech Stack

- **FastAPI**: High-performance web framework
- **Ariadne**: Schema-first GraphQL implementation
- **MongoDB**: Database for storing metrics and reports
- **Python 3.9+**: Programming language
- **React & TypeScript**: Frontend

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
uvicorn main:app --reload
```

## API Usage

The application exposes a GraphQL API at `/graphql` which can be explored using GraphQL Playground.

### Authentication

All API calls require authentication except for login and register. 
Pass the JWT token in the Authorization header:

```
Authorization: Bearer <token>
```

### Main Features

- User authentication (register, login)
- Metric management
- Weekly and quarterly reports
- Service metrics dashboard with summary statistics
- Export reports in various formats (CSV, Excel, PDF)
- FY configuration management
- Report drafting with auto-save functionality
- IndusIT automation governance with metadata tracking
- Execution monitoring for automations
- Infrastructure and interface registers

## Initial Setup

When first running the application, you'll need to:

1. Register an admin user
2. Create FY configurations
3. Create metrics
4. Start creating reports

## Data Model

- **Users**: Authentication and authorization with role-based access
- **Metrics**: Performance indicators being tracked
- **Weekly Reports**: Period-specific metric values with comments
- **FY Configs**: Fiscal year configuration with quarters and weeks
- **Automation Metadata**: Details of automations deployed on IndusIT
- **Execution Data**: Runtime information for automations
- **Infra Register**: Server inventory
- **Interface Register**: System interaction documentation
- **Microbot Register**: Reusable automation components

## Access Control

- **Admin**: Can create/update metrics, create reports, manage FY configs
- **User**: Can view dashboard and download reports
- **SDadmin/SDuser**: Access to Service Dashboard
- **IDadmin/IDuser**: Access to IndusIT Dashboard

## Date Format

The application uses DD-MM-YYYY date format for all date-related fields.

