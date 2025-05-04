import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "./components/ui/toaster";
import { useEffect, useState } from "react";

// Layout
import AppLayout from "./components/AppLayout";

// Pages
import Index from "./pages/Index";
import Login from "./pages/Auth/Login";
import Register from "./pages/Auth/Register";
import Dashboard from "./pages/Dashboard";
import NotFound from "./pages/NotFound";

// Service Dashboard
import MetricsPage from "./pages/Metrics/MetricsPage";
import MetricForm from "./pages/Metrics/MetricForm";
import ReportsPage from "./pages/Reports/ReportsPage";
import ReportForm from "./pages/Reports/ReportForm";
import ViewReport from "./pages/Reports/ViewReport";

// IndusIT Dashboard
import IndusITDashboard from "./pages/IndusIT/Dashboard";
import AutomationsPage from "./pages/IndusIT/AutomationsPage";

// Admin
import UsersPage from "./pages/Admin/UsersPage";
import RoleRequestPage from "./pages/UserProfile/RoleRequestPage";

// Create React Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      retryDelay: 1000,
      staleTime: 1000 * 60 * 5, // 5 minutes
      refetchOnWindowFocus: false,
    },
  },
});

function PrivateRoute({ children, roles = [] }: { children: React.ReactNode, roles?: string[] }) {
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [hasRole, setHasRole] = useState(false);

  useEffect(() => {
    // Check if user is logged in and has the required role
    const token = localStorage.getItem("token");
    const userStr = localStorage.getItem("user");
    
    if (!token || !userStr) {
      setAuthenticated(false);
      setLoading(false);
      return;
    }
    
    try {
      const user = JSON.parse(userStr);
      setAuthenticated(true);
      
      // If no specific roles are required or user is an appadmin, allow access
      if (roles.length === 0 || user.role === "appadmin") {
        setHasRole(true);
      } else {
        // Otherwise check if user has one of the required roles
        setHasRole(roles.includes(user.role));
      }
    } catch (e) {
      setAuthenticated(false);
      setHasRole(false);
    } finally {
      setLoading(false);
    }
  }, [roles]);

  if (loading) return <div>Loading...</div>;
  if (!authenticated) return <Navigate to="/login" />;
  if (!hasRole) return <Navigate to="/dashboard" />;
  return <>{children}</>;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          <Route path="/dashboard" element={
            <PrivateRoute>
              <AppLayout>
                <Dashboard />
              </AppLayout>
            </PrivateRoute>
          } />
          
          {/* Service Dashboard Routes */}
          <Route path="/service/metrics" element={
            <PrivateRoute roles={["admin", "SDadmin", "SDuser", "appadmin"]}>
              <AppLayout>
                <MetricsPage />
              </AppLayout>
            </PrivateRoute>
          } />
          
          <Route path="/service/metrics/new" element={
            <PrivateRoute roles={["admin", "SDadmin", "appadmin"]}>
              <AppLayout>
                <MetricForm />
              </AppLayout>
            </PrivateRoute>
          } />
          
          <Route path="/service/metrics/:id" element={
            <PrivateRoute roles={["admin", "SDadmin", "appadmin"]}>
              <AppLayout>
                <MetricForm />
              </AppLayout>
            </PrivateRoute>
          } />
          
          <Route path="/service/reports" element={
            <PrivateRoute roles={["admin", "SDadmin", "SDuser", "appadmin"]}>
              <AppLayout>
                <ReportsPage />
              </AppLayout>
            </PrivateRoute>
          } />
          
          <Route path="/service/reports/new" element={
            <PrivateRoute roles={["admin", "SDadmin", "appadmin"]}>
              <AppLayout>
                <ReportForm />
              </AppLayout>
            </PrivateRoute>
          } />
          
          <Route path="/service/reports/:id" element={
            <PrivateRoute roles={["admin", "SDadmin", "SDuser", "appadmin"]}>
              <AppLayout>
                <ViewReport />
              </AppLayout>
            </PrivateRoute>
          } />
          
          {/* IndusIT Dashboard Routes */}
          <Route path="/indusit/dashboard" element={
            <PrivateRoute roles={["admin", "IDadmin", "IDuser", "appadmin"]}>
              <AppLayout>
                <IndusITDashboard />
              </AppLayout>
            </PrivateRoute>
          } />
          
          <Route path="/indusit/automations" element={
            <PrivateRoute roles={["admin", "IDadmin", "IDuser", "appadmin"]}>
              <AppLayout>
                <AutomationsPage />
              </AppLayout>
            </PrivateRoute>
          } />
          
          {/* Admin Routes */}
          <Route path="/admin/users" element={
            <PrivateRoute roles={["appadmin"]}>
              <AppLayout>
                <UsersPage />
              </AppLayout>
            </PrivateRoute>
          } />
          
          {/* User Profile Routes */}
          <Route path="/profile/role-requests" element={
            <PrivateRoute>
              <AppLayout>
                <RoleRequestPage />
              </AppLayout>
            </PrivateRoute>
          } />
          
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
      <Toaster />
    </QueryClientProvider>
  );
}
