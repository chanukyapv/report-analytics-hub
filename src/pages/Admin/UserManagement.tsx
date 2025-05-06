
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { getCurrentUser, updateUserRoles } from "@/lib/api";
import { ArrowLeft, Save, UserPlus } from "lucide-react";

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
  const availableRoles = ["user", "admin", "SDuser", "SDadmin", "IDuser", "IDadmin", "superadmin"];
  
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
      const currentUser = await getCurrentUser(token);
      console.log("Current user from API:", currentUser);
      
      // Fetch users from backend - in a real app, we would have a dedicated API
      // For now, we'll use sample users if the backend returns only the current user
      let sampleUsers: User[] = [currentUser];
      
      // Add more sample users if we only have the current user
      if (sampleUsers.length <= 1) {
        console.log("Adding sample users for demonstration");
        sampleUsers = [
          ...sampleUsers,
          {
            id: "sample-user-1",
            name: "Regular User",
            email: "user@example.com",
            role: "user",
            roles: ["user"],
            is_active: true
          },
          {
            id: "sample-user-2",
            name: "SD Admin",
            email: "sdadmin@example.com",
            role: "SDadmin",
            roles: ["SDuser", "SDadmin"],
            is_active: true
          },
          {
            id: "sample-user-3",
            name: "ID User",
            email: "iduser@example.com",
            role: "IDuser",
            roles: ["IDuser"],
            is_active: true
          }
        ];
      }
      
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

  const handleAddUser = () => {
    toast.info("This would open a user creation form in a real app");
    // In a real app, this would navigate to a user creation form
    // navigate("/admin/users/create");
  };
  
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
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  {availableRoles.map((role) => (
                    <TableHead key={role}>{role}</TableHead>
                  ))}
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
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
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default UserManagement;
