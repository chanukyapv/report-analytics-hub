
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

## Role Request Workflow

1. Users register with a bt.com email address
2. Users are initially assigned the "user" role
3. Users can request access to specific dashboards through the role request system
4. App admins can approve or reject role requests
5. Upon approval, users gain access to the requested dashboard

## License

© 2025 QLA1 Dashboard. All Rights Reserved.
