
import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sidebar, SidebarContent, SidebarTrigger } from "@/components/ui/sidebar";
import { useMediaQuery } from "@/hooks/use-mobile";
import { 
  BarChart, 
  PieChart, 
  Home, 
  LogOut, 
  Settings, 
  FileText, 
  Activity, 
  LayoutDashboard,
  User,
  Users,
  Shield,
  Database
} from "lucide-react";

interface AppLayoutProps {
  children: React.ReactNode;
}

const AppLayout = ({ children }: AppLayoutProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useMediaQuery("(max-width: 768px)");
  const [sidebarOpen, setSidebarOpen] = useState(!isMobile);
  const [currentUser, setCurrentUser] = useState<any>(null);
  
  useEffect(() => {
    // Get user from local storage
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setCurrentUser(JSON.parse(storedUser));
    }
  }, []);

  useEffect(() => {
    if (isMobile) {
      setSidebarOpen(false);
    } else {
      setSidebarOpen(true);
    }
  }, [isMobile]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const isActive = (path: string) => {
    return location.pathname.startsWith(path);
  };
  
  const isAppAdmin = currentUser?.role === "appadmin";
  const isSDUser = ["SDuser", "SDadmin", "admin", "appadmin"].includes(currentUser?.role || "");
  const isIDUser = ["IDuser", "IDadmin", "admin", "appadmin"].includes(currentUser?.role || "");

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <Sidebar open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SidebarContent className="p-3 flex flex-col h-full">
          <div className="flex items-center justify-between mb-6 px-4 pt-2">
            <Link to="/dashboard" className="flex items-center space-x-2">
              <Shield className="h-6 w-6 text-primary" />
              <span className="text-xl font-bold">QLA1</span>
            </Link>
            {isMobile && (
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => setSidebarOpen(false)}
              >
                <span className="sr-only">Close sidebar</span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-6 w-6"
                >
                  <path d="M18 6 6 18"></path>
                  <path d="m6 6 12 12"></path>
                </svg>
              </Button>
            )}
          </div>

          <div className="space-y-1 px-2">
            <Button
              variant={isActive("/dashboard") ? "secondary" : "ghost"}
              className="w-full justify-start"
              asChild
            >
              <Link to="/dashboard">
                <Home className="mr-2 h-5 w-5" />
                Dashboard
              </Link>
            </Button>
            
            {isSDUser && (
              <>
                <h3 className="px-4 mt-4 mb-1 text-sm font-medium text-muted-foreground">
                  Service Dashboard
                </h3>
                <Button
                  variant={isActive("/service/reports") ? "secondary" : "ghost"}
                  className="w-full justify-start"
                  asChild
                >
                  <Link to="/service/reports">
                    <FileText className="mr-2 h-5 w-5" />
                    Reports
                  </Link>
                </Button>
                <Button
                  variant={isActive("/service/metrics") ? "secondary" : "ghost"}
                  className="w-full justify-start"
                  asChild
                >
                  <Link to="/service/metrics">
                    <Activity className="mr-2 h-5 w-5" />
                    Metrics
                  </Link>
                </Button>
              </>
            )}

            {isIDUser && (
              <>
                <h3 className="px-4 mt-4 mb-1 text-sm font-medium text-muted-foreground">
                  IndusIT Dashboard
                </h3>
                <Button
                  variant={isActive("/indusit/dashboard") ? "secondary" : "ghost"}
                  className="w-full justify-start"
                  asChild
                >
                  <Link to="/indusit/dashboard">
                    <LayoutDashboard className="mr-2 h-5 w-5" />
                    Overview
                  </Link>
                </Button>
                <Button
                  variant={isActive("/indusit/automations") ? "secondary" : "ghost"}
                  className="w-full justify-start"
                  asChild
                >
                  <Link to="/indusit/automations">
                    <Database className="mr-2 h-5 w-5" />
                    Automations
                  </Link>
                </Button>
              </>
            )}

            {/* User Profile Section */}
            <h3 className="px-4 mt-4 mb-1 text-sm font-medium text-muted-foreground">
              User
            </h3>
            <Button
              variant={isActive("/profile/role-requests") ? "secondary" : "ghost"}
              className="w-full justify-start"
              asChild
            >
              <Link to="/profile/role-requests">
                <User className="mr-2 h-5 w-5" />
                Role Requests
              </Link>
            </Button>

            {/* Admin Section */}
            {isAppAdmin && (
              <>
                <h3 className="px-4 mt-4 mb-1 text-sm font-medium text-muted-foreground">
                  Administration
                </h3>
                <Button
                  variant={isActive("/admin/users") ? "secondary" : "ghost"}
                  className="w-full justify-start"
                  asChild
                >
                  <Link to="/admin/users">
                    <Users className="mr-2 h-5 w-5" />
                    Users
                  </Link>
                </Button>
                <Button
                  variant={isActive("/admin/settings") ? "secondary" : "ghost"}
                  className="w-full justify-start"
                  asChild
                >
                  <Link to="/dashboard">
                    <Settings className="mr-2 h-5 w-5" />
                    System
                  </Link>
                </Button>
              </>
            )}
          </div>

          <div className="mt-auto px-2">
            <Button
              variant="ghost"
              className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
              onClick={handleLogout}
            >
              <LogOut className="mr-2 h-5 w-5" />
              Log out
            </Button>
          </div>
        </SidebarContent>
      </Sidebar>

      {/* Main Content */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Top Bar */}
        <header className="border-b bg-background">
          <div className="flex items-center justify-between h-16 px-4">
            <div className="flex items-center">
              <SidebarTrigger />
              <div className="ml-4">
                <h1 className="text-xl font-semibold">QLA1 Dashboard</h1>
                <p className="text-sm text-muted-foreground">
                  {currentUser?.role && (
                    <span className="capitalize">{currentUser.role}</span>
                  )}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm font-medium">
                {currentUser?.name}
              </span>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto bg-gray-50">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
