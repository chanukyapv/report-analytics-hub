
import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { getAllUsers, updateUserRoles } from "@/lib/api";
import { ArrowLeft, Save, UserPlus, Search, ArrowUpDown } from "lucide-react";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  roles: string[];
  is_active: boolean;
}

const UserManagement = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userRoles, setUserRoles] = useState<Record<string, Record<string, boolean>>>({});
  const [isSaving, setIsSaving] = useState<Record<string, boolean>>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [sortConfig, setSortConfig] = useState<{ key: keyof User; direction: 'asc' | 'desc' }>({ key: 'name', direction: 'asc' });

  // All available roles including new ones
  const availableRoles = [
    "user", 
    "SDuser", "SDadmin", 
    "IDuser", "IDadmin", 
    "SCuser", "SCadmin", 
    "IRuser", "IRadmin", 
    "PRuser", "PRadmin", 
    "superadmin"
  ];
  
  useEffect(() => {
    const token = localStorage.getItem("token");
    const userJson = localStorage.getItem("user");
    
    if (!token || !userJson) {
      navigate("/login");
      return;
    }
    
    // Check if user is superadmin
    try {
      const user = JSON.parse(userJson);
      const userRoles = user.roles || [user.role];
      
      if (!userRoles.includes("superadmin")) {
        toast.error("Only superadmins can access user management");
        navigate("/dashboard");
        return;
      }
      
      fetchUsers(token);
    } catch (e) {
      console.error("Error parsing user data:", e);
      navigate("/login");
      return;
    }
  }, [navigate]);
  
  const fetchUsers = async (token: string) => {
    try {
      setIsLoading(true);
      const usersData = await getAllUsers(token);
      
      if (!usersData || usersData.length === 0) {
        console.warn("No users returned from API, using sample data");
        
        // Sample data if API returns nothing
        const sampleUsers: User[] = [
          {
            id: "sample-user-1",
            name: "Super Administrator",
            email: "superadmin@example.com",
            role: "superadmin",
            roles: ["superadmin"],
            is_active: true
          },
          {
            id: "sample-user-2",
            name: "Regular User",
            email: "user@example.com",
            role: "user",
            roles: ["user"],
            is_active: true
          },
          {
            id: "sample-user-3",
            name: "Service Dashboard Admin",
            email: "sdadmin@example.com",
            role: "SDadmin",
            roles: ["SDuser", "SDadmin"],
            is_active: true
          },
          {
            id: "sample-user-4",
            name: "IndusIT Dashboard User",
            email: "iduser@example.com",
            role: "IDuser",
            roles: ["IDuser"],
            is_active: true
          },
          {
            id: "sample-user-5",
            name: "Security Dashboard Admin",
            email: "scadmin@example.com",
            role: "SCadmin",
            roles: ["SCuser", "SCadmin"],
            is_active: true
          }
        ];
        
        setUsers(sampleUsers);
        
        // Initialize user roles
        const initialRoles: Record<string, Record<string, boolean>> = {};
        sampleUsers.forEach(user => {
          initialRoles[user.id] = {};
          availableRoles.forEach(role => {
            // Handle case where roles is null by falling back to role property
            const userRoles = user.roles || [user.role];
            initialRoles[user.id][role] = userRoles.includes(role);
          });
        });
        setUserRoles(initialRoles);
      } else {
        setUsers(usersData);
        
        // Initialize user roles
        const initialRoles: Record<string, Record<string, boolean>> = {};
        usersData.forEach((user: User) => {
          initialRoles[user.id] = {};
          availableRoles.forEach(role => {
            // Handle case where roles is null by falling back to role property
            const userRoles = user.roles || [user.role];
            initialRoles[user.id][role] = userRoles.includes(role);
          });
        });
        setUserRoles(initialRoles);
      }
      
      setIsLoading(false);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error("Failed to load users");
      navigate("/dashboard");
    }
  };
  
  const handleRoleChange = (userId: string, role: string, checked: boolean) => {
    setUserRoles(prev => ({
      ...prev,
      [userId]: {
        ...prev[userId],
        [role]: checked
      }
    }));
  };
  
  const handleSaveRoles = async (userId: string) => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }
    
    const selectedRoles = Object.entries(userRoles[userId] || {})
      .filter(([_, isSelected]) => isSelected)
      .map(([role]) => role);
    
    if (selectedRoles.length === 0) {
      toast.error("User must have at least one role");
      return;
    }
    
    setIsSaving({
      ...isSaving,
      [userId]: true
    });
    
    try {
      const updatedUser = await updateUserRoles(token, userId, selectedRoles);
      
      // Update user in state
      setUsers(prev => prev.map(user => 
        user.id === userId ? {...user, roles: updatedUser.roles, role: updatedUser.role} : user
      ));
      
      toast.success("User roles updated successfully");
    } catch (error) {
      console.error("Error updating user roles:", error);
      toast.error("Failed to update user roles");
    } finally {
      setIsSaving({
        ...isSaving,
        [userId]: false
      });
    }
  };

  const handleSort = (key: keyof User) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const handleAddUser = () => {
    toast.info("This would open a user creation form in a real app");
    // In a real app, this would navigate to a user creation form
    // navigate("/admin/users/create");
  };
  
  // Filter and sort users
  const filteredAndSortedUsers = useMemo(() => {
    // First, filter by search query
    const filtered = users.filter(user => {
      const searchLower = searchQuery.toLowerCase();
      return (
        user.name.toLowerCase().includes(searchLower) ||
        user.email.toLowerCase().includes(searchLower) ||
        user.roles.some(role => role.toLowerCase().includes(searchLower))
      );
    });
    
    // Then sort by the selected column
    return [...filtered].sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        if (sortConfig.direction === 'asc') {
          return aValue.localeCompare(bValue);
        } else {
          return bValue.localeCompare(aValue);
        }
      }
      
      return 0;
    });
  }, [users, searchQuery, sortConfig]);
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-8 px-4">
      <Button 
        variant="outline" 
        onClick={() => navigate("/dashboard")} 
        className="mb-6"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Dashboard
      </Button>
      
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">User Role Management</h1>
          <p className="text-gray-600">
            Manage user roles and permissions
          </p>
        </div>
        <Button onClick={handleAddUser}>
          <UserPlus className="mr-2 h-4 w-4" />
          Add User
        </Button>
      </div>
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Search Users</CardTitle>
          <CardDescription>Find users by name, email, or role</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              type="text"
              placeholder="Search users..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Users</CardTitle>
          <CardDescription>Assign roles to users</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead onClick={() => handleSort('name')} className="cursor-pointer hover:bg-gray-50">
                    <div className="flex items-center">
                      Name
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </div>
                  </TableHead>
                  <TableHead onClick={() => handleSort('email')} className="cursor-pointer hover:bg-gray-50">
                    <div className="flex items-center">
                      Email
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </div>
                  </TableHead>
                  {availableRoles.map((role) => (
                    <TableHead key={role}>{role}</TableHead>
                  ))}
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAndSortedUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={availableRoles.length + 3} className="text-center py-4">
                      No users found matching your search criteria
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredAndSortedUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>{user.name}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      {availableRoles.map((role) => (
                        <TableCell key={`${user.id}-${role}`}>
                          <Checkbox 
                            checked={userRoles[user.id]?.[role] || false} 
                            onCheckedChange={(checked) => handleRoleChange(user.id, role, !!checked)}
                          />
                        </TableCell>
                      ))}
                      <TableCell>
                        <Button 
                          size="sm" 
                          onClick={() => handleSaveRoles(user.id)}
                          disabled={isSaving[user.id]}
                        >
                          <Save className="mr-2 h-4 w-4" />
                          {isSaving[user.id] ? "Saving..." : "Save"}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default UserManagement;
