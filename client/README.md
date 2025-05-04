
# QLA1 Dashboard Frontend

This is the frontend for the QLA1 Dashboard application, providing user interfaces for multiple dashboards including Service Dashboard and IndusIT Dashboard.

## Tech Stack

- **React 18**: UI library
- **TypeScript**: Type-safe JavaScript
- **TailwindCSS**: Utility-first CSS framework
- **shadcn/ui**: Customizable component system
- **React Router**: Navigation and routing
- **React Query**: Data fetching and state management
- **Recharts**: Data visualization
- **Lucide Icons**: SVG icons

## Getting Started

1. **Install dependencies**

```bash
npm install
# or
yarn install
```

2. **Environment Variables**

Create a `.env` file in the client directory with:

```
VITE_API_URL=http://localhost:8000
```

3. **Start the development server**

```bash
npm run dev
# or
yarn dev
```

The application will be available at `http://localhost:8080`.

## Available Features

- User authentication (login, register)
- Role-based access control
- Role request workflow
- Admin user management
- Service Dashboard
  - Metrics management
  - Weekly and quarterly reports
  - Reports visualization
  - Export reports in various formats
- IndusIT Dashboard
  - Automation metadata management
  - Execution monitoring
  - Infrastructure register
  - Interface register
  - Microbot register
  - User and admin dashboard views
