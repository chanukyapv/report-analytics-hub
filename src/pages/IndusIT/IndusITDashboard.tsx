
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart, PieChart, FileWarning, ShieldAlert, Activity, Database } from "lucide-react";
import { getUserDashboardStats, getAdminDashboardStats } from "@/lib/api";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Link } from "react-router-dom";

interface CategoryCount {
  category: string;
  count: number;
}

interface BotStatus {
  apaid: string;
  rpa_name: string;
  status: string;
}

interface DashboardStats {
  automations_count_by_category: CategoryCount[];
  volumes_processed_today: number;
  p1_bots_status: BotStatus[];
  last_dr_date?: string;
  current_vulns?: number;
}

const IndusITDashboard = () => {
  const [userRoles, setUserRoles] = useState<string[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  
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
  
  // Fetch dashboard data based on user role
  const { data: dashboardData, isLoading, error } = useQuery({
    queryKey: ['indusit-dashboard'],
    queryFn: async () => {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("No authentication token found");
      
      if (isAdmin) {
        return await getAdminDashboardStats(token);
      } else {
        return await getUserDashboardStats(token);
      }
    },
    enabled: userRoles.length > 0
  });
  
  // Handle errors
  useEffect(() => {
    if (error) {
      toast.error("Failed to load dashboard data");
      console.error("Dashboard data error:", error);
    }
  }, [error]);
  
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
          <h1 className="text-3xl font-bold tracking-tight">IndusIT Dashboard</h1>
          <p className="text-muted-foreground">
            Monitor and manage automation deployments on IndusIT platform
          </p>
        </div>
        
        <div className="flex gap-2">
          {isAdmin && (
            <Button asChild>
              <Link to="/indusit/automations/create">
                New Automation
              </Link>
            </Button>
          )}
          <Button variant="outline" asChild>
            <Link to="/indusit/automations">
              View All Automations
            </Link>
          </Button>
        </div>
      </div>
      
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array(4).fill(null).map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-5 w-1/2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-20 mb-2" />
                <Skeleton className="h-4 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : dashboardData ? (
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="p1-bots">P1 Bots</TabsTrigger>
            <TabsTrigger value="categories">Categories</TabsTrigger>
            {isAdmin && <TabsTrigger value="admin">Admin View</TabsTrigger>}
          </TabsList>
          
          <TabsContent value="overview" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total Automations
                  </CardTitle>
                  <Database className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {dashboardData.automations_count_by_category.reduce((acc, curr) => acc + curr.count, 0)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Across all categories
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Volumes Today
                  </CardTitle>
                  <Activity className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {dashboardData.volumes_processed_today.toLocaleString()}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Transactions processed
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    P1 Bots Status
                  </CardTitle>
                  <FileWarning className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {dashboardData.p1_bots_status.filter(bot => bot.status === "Running").length}/
                    {dashboardData.p1_bots_status.length}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    P1 bots currently running
                  </p>
                </CardContent>
              </Card>
              
              {isAdmin && "current_vulns" in dashboardData && (
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Current Vulnerabilities
                    </CardTitle>
                    <ShieldAlert className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {dashboardData.current_vulns}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Open security issues
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
            
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Automation Categories</CardTitle>
                  <CardDescription>
                    Distribution of automations by category
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-60">
                    {dashboardData.automations_count_by_category.map((category, i) => (
                      <div key={i} className="mb-4">
                        <div className="flex items-center justify-between mb-1">
                          <span>{category.category}</span>
                          <span className="text-sm font-medium">{category.count}</span>
                        </div>
                        <Progress 
                          value={category.count / dashboardData.automations_count_by_category.reduce((acc, curr) => acc + curr.count, 0) * 100} 
                        />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>P1 Bots Status</CardTitle>
                  <CardDescription>
                    Critical automation status overview
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {dashboardData.p1_bots_status.length > 0 ? (
                    <div className="h-60 overflow-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>RPA Name</TableHead>
                            <TableHead>APAID</TableHead>
                            <TableHead>Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {dashboardData.p1_bots_status.map((bot, i) => (
                            <TableRow key={i}>
                              <TableCell>{bot.rpa_name}</TableCell>
                              <TableCell>{bot.apaid}</TableCell>
                              <TableCell>
                                <span className={`px-2 py-1 rounded text-xs font-medium ${
                                  bot.status === "Running" 
                                    ? "bg-green-100 text-green-800" 
                                    : "bg-red-100 text-red-800"
                                }`}>
                                  {bot.status}
                                </span>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-60 text-muted-foreground">
                      No P1 bots found
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="p1-bots">
            <Card>
              <CardHeader>
                <CardTitle>Priority 1 Automations</CardTitle>
                <CardDescription>Status of critical business automations</CardDescription>
              </CardHeader>
              <CardContent>
                {dashboardData.p1_bots_status.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>RPA Name</TableHead>
                        <TableHead>APAID</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {dashboardData.p1_bots_status.map((bot, i) => (
                        <TableRow key={i}>
                          <TableCell className="font-medium">{bot.rpa_name}</TableCell>
                          <TableCell>{bot.apaid}</TableCell>
                          <TableCell>
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              bot.status === "Running" 
                                ? "bg-green-100 text-green-800" 
                                : "bg-red-100 text-red-800"
                            }`}>
                              {bot.status}
                            </span>
                          </TableCell>
                          <TableCell>
                            <Button variant="ghost" size="sm" asChild>
                              <Link to={`/indusit/automations/${bot.apaid}`}>
                                View Details
                              </Link>
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="flex items-center justify-center h-40 text-muted-foreground">
                    No P1 bots found
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="categories">
            <Card>
              <CardHeader>
                <CardTitle>Automation Categories</CardTitle>
                <CardDescription>Distribution by category type</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {dashboardData.automations_count_by_category.map((category, i) => (
                    <Card key={i}>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base">{category.category}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-3xl font-bold">{category.count}</div>
                        <Progress 
                          className="mt-2"
                          value={category.count / dashboardData.automations_count_by_category.reduce((acc, curr) => acc + curr.count, 0) * 100} 
                        />
                        <div className="mt-2 text-xs text-muted-foreground">
                          {Math.round(category.count / dashboardData.automations_count_by_category.reduce((acc, curr) => acc + curr.count, 0) * 100)}% of total
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold mb-4">Category Description</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <h4 className="font-medium">SD</h4>
                      <p className="text-sm text-muted-foreground">Service Delivery automations focusing on operational efficiencies.</p>
                    </div>
                    <div>
                      <h4 className="font-medium">RPA</h4>
                      <p className="text-sm text-muted-foreground">Robotic Process Automation for repetitive task automation.</p>
                    </div>
                    <div>
                      <h4 className="font-medium">ShadowIT</h4>
                      <p className="text-sm text-muted-foreground">Automation systems outside of centralized IT control.</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {isAdmin && "last_dr_date" in dashboardData && (
            <TabsContent value="admin">
              <Card>
                <CardHeader>
                  <CardTitle>Admin Dashboard</CardTitle>
                  <CardDescription>Extended metrics for administrators</CardDescription>
                </CardHeader>
                <CardContent className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-lg font-semibold mb-4">Security Overview</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-muted p-4 rounded-lg">
                          <div className="text-sm font-medium text-muted-foreground mb-1">Current Vulnerabilities</div>
                          <div className="text-2xl font-bold">{dashboardData.current_vulns}</div>
                        </div>
                        <div className="bg-muted p-4 rounded-lg">
                          <div className="text-sm font-medium text-muted-foreground mb-1">Last DR Date</div>
                          <div className="text-2xl font-bold">{dashboardData.last_dr_date}</div>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="text-lg font-semibold mb-4">Automation Status</h3>
                      <div className="space-y-2">
                        {dashboardData.automations_count_by_category.map((category, i) => (
                          <div key={i} className="flex justify-between items-center">
                            <span>{category.category}</span>
                            <span className="font-medium">{category.count}</span>
                          </div>
                        ))}
                        <Separator />
                        <div className="flex justify-between items-center font-bold">
                          <span>Total</span>
                          <span>{dashboardData.automations_count_by_category.reduce((acc, curr) => acc + curr.count, 0)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Admin Actions</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Button variant="outline" asChild>
                        <Link to="/indusit/register/infra">Infra Register</Link>
                      </Button>
                      <Button variant="outline" asChild>
                        <Link to="/indusit/register/interface">Interface Register</Link>
                      </Button>
                      <Button variant="outline" asChild>
                        <Link to="/indusit/register/microbot">Microbot Register</Link>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Error Loading Dashboard</CardTitle>
            <CardDescription>
              There was a problem loading the dashboard data.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => window.location.reload()}>
              Try Again
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default IndusITDashboard;
