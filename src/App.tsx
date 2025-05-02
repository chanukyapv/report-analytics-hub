
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";

// Auth
import Login from "./pages/Auth/Login";
import Register from "./pages/Auth/Register";

// Main Pages
import Dashboard from "./pages/Dashboard";
import ReportsPage from "./pages/Reports/ReportsPage";
import ViewReport from "./pages/Reports/ViewReport";
import ReportForm from "./pages/Reports/ReportForm";
import ReportFormStep1 from "./pages/Reports/ReportFormStep1";
import MetricsPage from "./pages/Metrics/MetricsPage";
import MetricForm from "./pages/Metrics/MetricForm";
import UnderConstruction from "./pages/UnderConstruction";

// Layout
import AppLayout from "./components/AppLayout";

// Add lodash.debounce
import "./lib/api";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          {/* Protected routes with AppLayout */}
          <Route path="/dashboard" element={
            <AppLayout>
              <Dashboard />
            </AppLayout>
          } />
          
          <Route path="/reports" element={
            <AppLayout>
              <ReportsPage />
            </AppLayout>
          } />
          
          <Route path="/reports/view/:id" element={
            <AppLayout>
              <ViewReport />
            </AppLayout>
          } />
          
          <Route path="/reports/create" element={
            <AppLayout>
              <ReportFormStep1 />
            </AppLayout>
          } />
          
          <Route path="/reports/create-form" element={
            <AppLayout>
              <ReportForm />
            </AppLayout>
          } />
          
          <Route path="/reports/edit/:id" element={
            <AppLayout>
              <ReportForm />
            </AppLayout>
          } />
          
          <Route path="/metrics" element={
            <AppLayout>
              <MetricsPage />
            </AppLayout>
          } />
          
          <Route path="/metrics/create" element={
            <AppLayout>
              <MetricForm />
            </AppLayout>
          } />
          
          <Route path="/metrics/edit/:id" element={
            <AppLayout>
              <MetricForm />
            </AppLayout>
          } />
          
          {/* New dashboard pages */}
          <Route path="/incident-dashboard" element={
            <AppLayout>
              <UnderConstruction title="Incident Dashboard" />
            </AppLayout>
          } />
          
          <Route path="/pr-dashboard" element={
            <AppLayout>
              <UnderConstruction title="PR Dashboard" />
            </AppLayout>
          } />
          
          <Route path="/indusit-dashboard" element={
            <AppLayout>
              <UnderConstruction title="IndusIT Dashboard" />
            </AppLayout>
          } />
          
          <Route path="/security-dashboard" element={
            <AppLayout>
              <UnderConstruction title="Security Dashboard" />
            </AppLayout>
          } />
          
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
