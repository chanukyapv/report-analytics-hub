
import { ReactNode, useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { LayoutDashboard, BarChart2, PieChart, Settings, LogOut, Shield, FileWarning, FileSpreadsheet } from "lucide-react";
import { cn } from "@/lib/utils";

interface AppLayoutProps {
  children: ReactNode;
}

const AppLayout = ({ children }: AppLayoutProps) => {
  const navigate = useNavigate();
  const [userRole, setUserRole] = useState("");
  const [userName, setUserName] = useState("");
  const [menuOpen, setMenuOpen] = useState(true);
  
  useEffect(() => {
    const token = localStorage.getItem("token");
    const userJson = localStorage.getItem("user");
    
    if (!token || !userJson) {
      navigate("/login");
      return;
    }
    
    try {
      const user = JSON.parse(userJson);
      setUserRole(user.role);
      setUserName(user.name);
    } catch (e) {
      navigate("/login");
    }
  }, [navigate]);
  
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };
  
  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div className={cn(
        "bg-white border-r border-gray-200 flex flex-col transition-all duration-300",
        menuOpen ? "w-64" : "w-20"
      )}>
        {/* Sidebar Header */}
        <div className="p-4 border-b border-gray-200 flex justify-between items-center">
          <div className={cn("flex items-center", !menuOpen && "justify-center w-full")}>
            <div className="h-8 w-8 bg-primary rounded-md flex items-center justify-center">
              <PieChart className="h-5 w-5 text-white" />
            </div>
            {menuOpen && <span className="ml-2 font-semibold">QLA1 Dashboard</span>}
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setMenuOpen(!menuOpen)}
            className={!menuOpen ? "hidden" : ""}
          >
            <span className="sr-only">Toggle menu</span>
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              width="16" 
              height="16" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            >
              <path d="m15 18-6-6 6-6" />
            </svg>
          </Button>
        </div>
        
        {/* Sidebar Menu */}
        <div className="flex-1 py-4">
          <nav>
            {/* Main Dashboards */}
            <div className={cn("px-4 py-2", !menuOpen && "text-center")}>
              {menuOpen ? <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Dashboards</h4> : <hr />}
            </div>
            
            <Link to="/dashboard">
              <div className={cn(
                "flex items-center px-4 py-2 hover:bg-gray-100",
                !menuOpen && "justify-center"
              )}>
                <LayoutDashboard className="h-5 w-5 text-gray-600" />
                {menuOpen && <span className="ml-2">Service Dashboard</span>}
              </div>
            </Link>
            
            <Link to="/incident-dashboard">
              <div className={cn(
                "flex items-center px-4 py-2 hover:bg-gray-100",
                !menuOpen && "justify-center"
              )}>
                <FileWarning className="h-5 w-5 text-gray-600" />
                {menuOpen && <span className="ml-2">Incident Dashboard</span>}
              </div>
            </Link>
            
            <Link to="/pr-dashboard">
              <div className={cn(
                "flex items-center px-4 py-2 hover:bg-gray-100",
                !menuOpen && "justify-center"
              )}>
                <FileSpreadsheet className="h-5 w-5 text-gray-600" />
                {menuOpen && <span className="ml-2">PR Dashboard</span>}
              </div>
            </Link>
            
            <Link to="/indusit-dashboard">
              <div className={cn(
                "flex items-center px-4 py-2 hover:bg-gray-100",
                !menuOpen && "justify-center"
              )}>
                <BarChart2 className="h-5 w-5 text-gray-600" />
                {menuOpen && <span className="ml-2">IndusIT Dashboard</span>}
              </div>
            </Link>
            
            <Link to="/security-dashboard">
              <div className={cn(
                "flex items-center px-4 py-2 hover:bg-gray-100",
                !menuOpen && "justify-center"
              )}>
                <Shield className="h-5 w-5 text-gray-600" />
                {menuOpen && <span className="ml-2">Security Dashboard</span>}
              </div>
            </Link>
            
            {/* Service Metrics */}
            <div className={cn("px-4 py-2 mt-4", !menuOpen && "text-center")}>
              {menuOpen ? <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Service Metrics</h4> : <hr />}
            </div>
            
            <Link to="/reports">
              <div className={cn(
                "flex items-center px-4 py-2 hover:bg-gray-100",
                !menuOpen && "justify-center"
              )}>
                <BarChart2 className="h-5 w-5 text-gray-600" />
                {menuOpen && <span className="ml-2">Reports</span>}
              </div>
            </Link>
            
            <Link to="/metrics">
              <div className={cn(
                "flex items-center px-4 py-2 hover:bg-gray-100",
                !menuOpen && "justify-center"
              )}>
                <PieChart className="h-5 w-5 text-gray-600" />
                {menuOpen && <span className="ml-2">Metrics</span>}
              </div>
            </Link>
            
            {/* Admin only */}
            {userRole === "admin" && (
              <Link to="/settings">
                <div className={cn(
                  "flex items-center px-4 py-2 hover:bg-gray-100",
                  !menuOpen && "justify-center"
                )}>
                  <Settings className="h-5 w-5 text-gray-600" />
                  {menuOpen && <span className="ml-2">Settings</span>}
                </div>
              </Link>
            )}
          </nav>
        </div>
        
        {/* Sidebar Footer */}
        <div className="border-t border-gray-200 p-4">
          <div className={cn(
            "flex items-center mb-2",
            !menuOpen ? "justify-center" : "justify-between"
          )}>
            <div className={cn("flex items-center", !menuOpen && "hidden")}>
              <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-white">
                {userName.charAt(0).toUpperCase()}
              </div>
              <div className="ml-2">
                <p className="text-sm font-medium">{userName}</p>
                <p className="text-xs text-gray-500">{userRole}</p>
              </div>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleLogout}
              className={cn("", !menuOpen && "w-full p-0")}
            >
              <LogOut className="h-4 w-4" />
              {menuOpen && <span className="ml-1">Logout</span>}
            </Button>
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="flex-1 relative">
        {!menuOpen && (
          <Button 
            variant="ghost" 
            size="sm" 
            className="absolute top-4 left-4"
            onClick={() => setMenuOpen(true)}
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              width="16" 
              height="16" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            >
              <path d="M9 18 15 12 9 6" />
            </svg>
          </Button>
        )}
        <main className="p-4">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
