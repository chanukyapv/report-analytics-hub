
# QLA1 Dashboard Application

QLA1 Dashboard is a comprehensive monitoring and governance tool for tracking service metrics and automations across multiple dashboards.

## Features

- **Service Dashboard**: Track, visualize, and report on service metrics
- **IndusIT Dashboard**: Governance tool for automation onboarding and monitoring
- **PR Dashboard** (Coming Soon)
- **Security Dashboard** (Coming Soon)

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

- **Admin**: Full access to all features and dashboards
- **SDAdmin**: Can manage service dashboard metrics and reports
- **SDUser**: Can view service dashboard data
- **IDAdmin**: Can manage IndusIT dashboard data
- **IDUser**: Can view IndusIT dashboard data

## License

© 2025 QLA1 Dashboard. All Rights Reserved.
