
# QLA1 Dashboard Application

QLA1 Dashboard is a comprehensive monitoring and governance tool for tracking service metrics and automations across multiple dashboards.

## Features

- **Service Dashboard**: Track, visualize, and report on service metrics
- **IndusIT Dashboard**: Governance tool for automation onboarding and monitoring
- **Role-based Access Control**: Granular permissions system with request workflow
- **Admin Panel**: User management and system statistics

## Tech Stack

- **Backend**:
  - FastAPI
  - Ariadne (GraphQL)
  - MongoDB
  - Python 3.9+

- **Frontend**:
  - React
  - TypeScript
  - TailwindCSS
  - shadcn/ui components
  - Recharts for visualizations

## Project Structure

This project is organized into two main directories:

- **`/app`**: Contains all backend code (FastAPI, GraphQL resolvers, database models)
- **`/client`**: Contains all frontend code (React components, hooks, utilities)

## Getting Started

1. Start the backend server (see instructions in `/app/README.md`)
2. Start the frontend application (see instructions in `/client/README.md`)

## User Roles

- **appadmin**: Full access to all features, dashboards and user management
- **SDAdmin**: Can manage service dashboard metrics and reports
- **SDUser**: Can view service dashboard data
- **IDAdmin**: Can manage IndusIT dashboard data
- **IDUser**: Can view IndusIT dashboard data
- **user**: Basic access (can request additional roles)

## Development Notes

### Recommended .gitignore Patterns
Since we cannot modify the .gitignore file directly, here are patterns that should be ignored:

```
# Python
__pycache__/
*.py[cod]
*$py.class
*.so
.Python
env/
build/
develop-eggs/
dist/
downloads/
eggs/
.eggs/
lib/
lib64/
parts/
sdist/
var/
*.egg-info/
.installed.cfg
*.egg
venv/
.env

# Node
node_modules/
npm-debug.log
yarn-debug.log
yarn-error.log
.pnp/
.pnp.js
.npm
.yarn-integrity
.env.local
.env.development.local
.env.test.local
.env.production.local

# IDE
.idea/
.vscode/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db
```
