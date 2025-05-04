
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { ThemeProvider } from "./components/theme-provider"
import { Toaster } from "sonner"
import Register from "./pages/Auth/Register"
import Login from "./pages/Auth/Login"

// Create a client for React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      staleTime: 5 * 60 * 1000,
    },
  },
})

function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="qla1-ui-theme">
      <QueryClientProvider client={queryClient}>
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </Router>
        <Toaster />
      </QueryClientProvider>
    </ThemeProvider>
  )
}

export default App
