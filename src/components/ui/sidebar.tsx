
import {
  LayoutDashboard,
  ListChecks,
  ListOrdered,
  Settings,
  Users,
} from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SheetClose } from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "./avatar";

interface NavItem {
  title: string;
  href: string;
  icon: any;
}

interface SidebarProps {
  navItems: NavItem[];
}

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  roles: string[];
  is_active: boolean;
}

const Sidebar = ({ navItems }: SidebarProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

  useEffect(() => {
    const userJson = localStorage.getItem("user");
    if (userJson) {
      try {
        const user = JSON.parse(userJson);
        console.log("Sidebar - Raw user from localStorage:", user);
        
        // Handle case where roles might be null by falling back to role property
        let roles = [];
        if (user.roles && Array.isArray(user.roles)) {
          roles = user.roles;
        } else if (user.role) {
          roles = [user.role];
        }
        
        const processedUser = {
          ...user,
          roles
        };
        
        setCurrentUser(processedUser);
        const hasSuperAdminRole = roles.includes('superadmin');
        setIsSuperAdmin(hasSuperAdminRole);
        
        console.log("Sidebar - Processed user:", processedUser);
        console.log("Sidebar - User roles:", processedUser.roles);
        console.log("Sidebar - Is superadmin?", hasSuperAdminRole);
      } catch (error) {
        console.error("Error parsing user from localStorage:", error);
        setCurrentUser(null);
        setIsSuperAdmin(false);
      }
    } else {
      setCurrentUser(null);
      setIsSuperAdmin(false);
    }
  }, []);

  const handleAdminClick = () => {
    console.log("Admin link clicked, navigating to /admin/users");
    navigate("/admin/users");
  };

  return (
    <div className="flex flex-col h-full">
      <div className="px-6 py-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative rounded-full h-8 w-8">
              <Avatar className="h-8 w-8">
                <AvatarImage src="/images/avatars/01.png" alt="Avatar" />
                <AvatarFallback>CN</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate("/settings")}>
              Settings
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => {
              localStorage.removeItem("token");
              localStorage.removeItem("user");
              navigate("/login");
            }}>
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="flex-1 space-y-1">
        {navItems.map((item) => (
          <Button
            key={item.href}
            variant={location.pathname === item.href ? "secondary" : "ghost"}
            className="w-full justify-start"
            onClick={() => navigate(item.href)}
          >
            <item.icon className="mr-2 h-4 w-4" />
            {item.title}
          </Button>
        ))}
      </div>
      {isSuperAdmin && (
        <div className="px-3 py-2">
          <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">
            Admin Tools
          </h2>
          <div className="space-y-1">
            <Button
              variant={location.pathname === "/admin/users" ? "secondary" : "ghost"}
              className="w-full justify-start"
              onClick={handleAdminClick}
            >
              <Users className="mr-2 h-4 w-4" />
              User Management
            </Button>
          </div>
        </div>
      )}
      <div className="p-6">
        <Button variant="outline" className="w-full justify-start">
          <Settings className="mr-2 h-4 w-4" />
          Settings
        </Button>
      </div>
    </div>
  );
};

export default Sidebar;
