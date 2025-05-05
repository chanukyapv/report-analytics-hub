
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getAllAutomationMetadata } from "@/lib/api";
import { toast } from "sonner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Search, Plus, Loader2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Automation {
  id: string;
  apaid: string;
  rpa_name: string;
  priority: string;
  lifecycle_status: string;
  category: string;
  created_at: string;
  updated_at: string;
}

const AutomationsList = () => {
  const [userRoles, setUserRoles] = useState<string[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const navigate = useNavigate();
  
  // Get user roles from localStorage
  useEffect(() => {
    const userJson = localStorage.getItem("user");
    if (userJson) {
      try {
        const user = JSON.parse(userJson);
        const roles = [...(user.roles || []), user.role];
        setUserRoles(roles);
        setIsAdmin(roles.includes("IDadmin"));
      } catch (e) {
        console.error("Error parsing user data:", e);
      }
    }
  }, []);
  
  // Fetch automations data
  const { data: automations, isLoading, error } = useQuery<Automation[]>({
    queryKey: ['indusit-automations'],
    queryFn: async () => {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("No authentication token found");
      
      return await getAllAutomationMetadata(token);
    },
    enabled: userRoles.length > 0
  });
  
  // Handle errors
  useEffect(() => {
    if (error) {
      toast.error("Failed to load automations");
      console.error("Automations data error:", error);
    }
  }, [error]);
  
  // Filter automations based on search term and filters
  const filteredAutomations = automations?.filter(automation => {
    const matchesSearch = 
      automation.apaid.toLowerCase().includes(searchTerm.toLowerCase()) ||
      automation.rpa_name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = !categoryFilter || automation.category === categoryFilter;
    const matchesPriority = !priorityFilter || automation.priority === priorityFilter;
    
    return matchesSearch && matchesCategory && matchesPriority;
  }) || [];
  
  // Get unique categories and priorities for filters
  const categories = automations 
    ? [...new Set(automations.map(a => a.category))] 
    : [];
  
  const priorities = automations 
    ? [...new Set(automations.map(a => a.priority))] 
    : [];
  
  // Check if user has access
  const hasAccess = userRoles.some(role => ["IDuser", "IDadmin"].includes(role));
  
  if (!hasAccess) {
    return (
      <div className="container mx-auto p-4">
        <Card>
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>You do not have permission to access the IndusIT Dashboard</CardDescription>
          </CardHeader>
          <CardContent>
            <p>Please contact your administrator if you believe you should have access.</p>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Automations</h1>
          <p className="text-muted-foreground">
            View and manage automations deployed on IndusIT
          </p>
        </div>
        
        <div className="flex gap-2">
          {isAdmin && (
            <Button asChild>
              <Link to="/indusit/automations/create">
                <Plus className="mr-2 h-4 w-4" /> New Automation
              </Link>
            </Button>
          )}
          <Button variant="outline" asChild>
            <Link to="/indusit-dashboard">
              Back to Dashboard
            </Link>
          </Button>
        </div>
      </div>
      
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Filter Automations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center space-x-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by APAID or name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Categories</SelectItem>
                {categories.map((category, index) => (
                  <SelectItem key={index} value={category}>{category}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Priorities</SelectItem>
                {priorities.map((priority, index) => (
                  <SelectItem key={index} value={priority}>{priority}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>
      
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2">Loading automations...</span>
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Automations List</CardTitle>
            <CardDescription>
              {filteredAutomations.length} automation{filteredAutomations.length !== 1 ? 's' : ''} found
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredAutomations.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>APAID</TableHead>
                    <TableHead>RPA Name</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Lifecycle Status</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Last Updated</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAutomations.map((automation) => (
                    <TableRow key={automation.id}>
                      <TableCell className="font-medium">{automation.apaid}</TableCell>
                      <TableCell>{automation.rpa_name}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          automation.priority === "P1" 
                            ? "bg-red-100 text-red-800" 
                            : automation.priority === "P2" 
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-green-100 text-green-800"
                        }`}>
                          {automation.priority}
                        </span>
                      </TableCell>
                      <TableCell>{automation.lifecycle_status}</TableCell>
                      <TableCell>{automation.category}</TableCell>
                      <TableCell>{automation.updated_at}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => navigate(`/indusit/automations/${automation.apaid}`)}
                          >
                            View
                          </Button>
                          {isAdmin && (
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => navigate(`/indusit/automations/edit/${automation.id}`)}
                            >
                              Edit
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No automations found matching your criteria
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AutomationsList;
