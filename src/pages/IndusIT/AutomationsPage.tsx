
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/components/ui/use-toast";
import { getAutomations } from "@/lib/api";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import {
  AlertCircle,
  CheckCircle,
  Clock,
  MoreHorizontal,
  PlusCircle,
  Search,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function AutomationsPage() {
  const { toast } = useToast();
  const [token, setToken] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    const userJson = localStorage.getItem("user");
    
    if (storedToken && userJson) {
      setToken(storedToken);
      try {
        const user = JSON.parse(userJson);
        setUserRole(user.role);
      } catch (e) {
        console.error("Error parsing user data:", e);
      }
    }
  }, []);

  const { data: automations, isLoading, error } = useQuery({
    queryKey: ["automations"],
    queryFn: () => {
      if (!token) throw new Error("No authentication token");
      return getAutomations(token);
    },
    enabled: !!token,
  });

  if (error) {
    toast({
      title: "Error loading automations",
      description: (error as Error).message,
      variant: "destructive",
    });
  }

  // Filter automations based on search query and filters
  const filteredAutomations = automations?.filter((automation: any) => {
    const matchesSearch = 
      searchQuery === "" ||
      automation.apaid.toLowerCase().includes(searchQuery.toLowerCase()) ||
      automation.rpa_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      automation.description.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = categoryFilter === "" || automation.category === categoryFilter;
    const matchesStatus = statusFilter === "" || automation.lifecycle_status === statusFilter;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  // Get unique categories and statuses for filters
  const categories = automations ? 
    Array.from(new Set(automations.map((a: any) => a.category))) : [];
  
  const statuses = automations ? 
    Array.from(new Set(automations.map((a: any) => a.lifecycle_status))) : [];

  // Status badge color mapping
  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "Design":
        return "bg-blue-100 text-blue-800";
      case "Development":
        return "bg-purple-100 text-purple-800";
      case "Operational":
        return "bg-green-100 text-green-800";
      case "SwitchOff":
        return "bg-amber-100 text-amber-800";
      case "Rationalized":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Priority badge color mapping
  const getPriorityBadgeClass = (priority: string) => {
    switch (priority) {
      case "P1":
        return "bg-red-100 text-red-800";
      case "P2":
        return "bg-amber-100 text-amber-800";
      case "P3":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold tracking-tight">IndusIT Automations</h1>
        {(userRole === "admin" || userRole === "IDadmin") && (
          <Link to="/indusit/automation/create">
            <Button className="flex items-center gap-2">
              <PlusCircle className="h-4 w-4" />
              Add Automation
            </Button>
          </Link>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Automations List</CardTitle>
          <CardDescription>
            View and manage all automations deployed on IndusIT platform
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by APAID, name or description..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex gap-4">
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Filter by Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Categories</SelectItem>
                  {categories.map((category: string) => (
                    <SelectItem key={category} value={category}>{category}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Filter by Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Statuses</SelectItem>
                  {statuses.map((status: string) => (
                    <SelectItem key={status} value={status}>{status}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
          ) : filteredAutomations?.length > 0 ? (
            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>APAID</TableHead>
                    <TableHead>RPA Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAutomations.map((automation: any) => (
                    <TableRow key={automation.id}>
                      <TableCell>{automation.apaid}</TableCell>
                      <TableCell>{automation.rpa_name}</TableCell>
                      <TableCell>{automation.category}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={getPriorityBadgeClass(automation.priority)}>
                          {automation.priority}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline" className={getStatusBadgeClass(automation.lifecycle_status)}>
                          {automation.lifecycle_status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <Link to={`/indusit/automation/view/${automation.id}`}>
                              <DropdownMenuItem>View Details</DropdownMenuItem>
                            </Link>
                            {(userRole === "admin" || userRole === "IDadmin") && (
                              <Link to={`/indusit/automation/edit/${automation.id}`}>
                                <DropdownMenuItem>Edit</DropdownMenuItem>
                              </Link>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-10 text-muted-foreground">
              {automations?.length === 0 ? (
                <>
                  <AlertCircle className="h-10 w-10 mx-auto mb-2 text-muted-foreground" />
                  <h3 className="font-medium text-lg mb-1">No automations found</h3>
                  <p>Get started by creating your first automation.</p>
                </>
              ) : (
                <>
                  <Search className="h-10 w-10 mx-auto mb-2 text-muted-foreground" />
                  <h3 className="font-medium text-lg mb-1">No matching automations</h3>
                  <p>Try changing your search or filter criteria.</p>
                </>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
