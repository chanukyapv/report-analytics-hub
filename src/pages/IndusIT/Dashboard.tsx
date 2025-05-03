
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { useQuery } from "@tanstack/react-query";
import { PieChart, Pie, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, Cell } from "recharts";
import { Link } from "react-router-dom";
import { getIndusITDashboardSummary, getAdminDashboardSummary } from "@/lib/api";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LayoutDashboard, Shield, AlertTriangle, CheckCircle, AlertCircle, Server } from "lucide-react";

export default function IndusITDashboard() {
  const { toast } = useToast();
  const [token, setToken] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string>("");

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

  const { data: dashboardData, isLoading, error } = useQuery({
    queryKey: ["indusITDashboard"],
    queryFn: () => {
      if (!token) throw new Error("No authentication token");
      return getIndusITDashboardSummary(token);
    },
    enabled: !!token,
  });

  const { 
    data: adminDashboardData,
    isLoading: isAdminDataLoading,
    error: adminDataError
  } = useQuery({
    queryKey: ["adminDashboard"],
    queryFn: () => {
      if (!token) throw new Error("No authentication token");
      return getAdminDashboardSummary(token);
    },
    enabled: !!token && (userRole === "admin" || userRole === "IDadmin"),
  });

  if (error) {
    toast({
      title: "Error loading dashboard",
      description: (error as Error).message,
      variant: "destructive",
    });
  }

  if (adminDataError && (userRole === "admin" || userRole === "IDadmin")) {
    toast({
      title: "Error loading admin data",
      description: (adminDataError as Error).message,
      variant: "destructive",
    });
  }

  // Colors for charts
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];
  const STATUS_COLORS = {
    'Design': '#8884d8',
    'Development': '#82ca9d',
    'Operational': '#00C49F',
    'SwitchOff': '#ff8042',
    'Rationalized': '#0088FE',
  };

  const BOT_STATUS_COLORS = {
    'Running': '#00C49F',
    'Stopped': '#ff8042',
    'Error': '#ff0000',
    'Unknown': '#8884d8',
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold tracking-tight">IndusIT Dashboard</h1>
        {(userRole === "admin" || userRole === "IDadmin") && (
          <Link 
            to="/indusit/automation/create" 
            className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground ring-offset-background transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            Add New Automation
          </Link>
        )}
      </div>

      <Tabs defaultValue="user" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="user" className="flex items-center gap-2">
            <LayoutDashboard className="h-4 w-4" />
            <span>User Dashboard</span>
          </TabsTrigger>
          {(userRole === "admin" || userRole === "IDadmin") && (
            <TabsTrigger value="admin" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              <span>Admin Dashboard</span>
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="user">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
          ) : dashboardData ? (
            <>
              {/* Key Metrics Cards */}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Total Automations</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{dashboardData.total_automations}</div>
                    <p className="text-xs text-muted-foreground">Across all categories and statuses</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Volumes Processed Today</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{dashboardData.volumes_processed_today.toLocaleString()}</div>
                    <p className="text-xs text-muted-foreground">Total transactions processed</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Total Servers</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{dashboardData.total_servers}</div>
                    <p className="text-xs text-muted-foreground">
                      <Link to="/indusit/servers" className="text-blue-600 hover:underline">View Details</Link>
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Total Interfaces</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{dashboardData.total_interfaces}</div>
                    <p className="text-xs text-muted-foreground">
                      <Link to="/indusit/interfaces" className="text-blue-600 hover:underline">View Details</Link>
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Charts Row */}
              <div className="grid gap-4 md:grid-cols-2 mb-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Automations by Category</CardTitle>
                    <CardDescription>Distribution of automations across categories</CardDescription>
                  </CardHeader>
                  <CardContent className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={dashboardData.automations_by_category}
                          cx="50%"
                          cy="50%"
                          labelLine={true}
                          outerRadius={100}
                          fill="#8884d8"
                          dataKey="count"
                          nameKey="category"
                          label={({category, count}) => `${category}: ${count}`}
                        >
                          {dashboardData.automations_by_category.map((entry: any, index: number) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Automations by Status</CardTitle>
                    <CardDescription>Lifecycle status distribution</CardDescription>
                  </CardHeader>
                  <CardContent className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={dashboardData.automations_by_status}
                        margin={{
                          top: 5,
                          right: 30,
                          left: 20,
                          bottom: 50,
                        }}
                      >
                        <XAxis dataKey="status" angle={-45} textAnchor="end" height={80} />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="count" name="Number of Automations">
                          {dashboardData.automations_by_status.map((entry: any) => (
                            <Cell 
                              key={`cell-${entry.status}`} 
                              fill={STATUS_COLORS[entry.status as keyof typeof STATUS_COLORS] || COLORS[0]} 
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>

              {/* P1 Bots Status Table */}
              <Card>
                <CardHeader>
                  <CardTitle>Priority P1 Bots Status</CardTitle>
                  <CardDescription>Current status of critical automations</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="border rounded-md">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b bg-muted/50">
                          <th className="p-2 text-left font-medium">APAID</th>
                          <th className="p-2 text-left font-medium">RPA Name</th>
                          <th className="p-2 text-left font-medium">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {dashboardData.priority_p1_bots_status.length > 0 ? (
                          dashboardData.priority_p1_bots_status.map((bot: any, index: number) => (
                            <tr key={index} className={index % 2 ? "bg-muted/20" : ""}>
                              <td className="p-2">{bot.apaid}</td>
                              <td className="p-2">{bot.rpa_name}</td>
                              <td className="p-2">
                                <div className="flex items-center">
                                  <span
                                    className={`w-3 h-3 rounded-full mr-2 ${
                                      bot.current_status === "Running"
                                        ? "bg-green-500"
                                        : bot.current_status === "Stopped"
                                        ? "bg-yellow-500"
                                        : bot.current_status === "Error"
                                        ? "bg-red-500"
                                        : "bg-gray-500"
                                    }`}
                                  ></span>
                                  {bot.current_status}
                                </div>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={3} className="p-2 text-center">No P1 bots found</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>

              {/* Links to other pages */}
              <div className="grid gap-4 md:grid-cols-3 mt-6">
                <Link to="/indusit/automations">
                  <Card className="hover:bg-muted/50 cursor-pointer transition-colors">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium">Automations</CardTitle>
                      <LayoutDashboard className="h-5 w-5 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <p className="text-xs text-muted-foreground">View and manage all automations</p>
                    </CardContent>
                  </Card>
                </Link>
                <Link to="/indusit/interfaces">
                  <Card className="hover:bg-muted/50 cursor-pointer transition-colors">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium">Interfaces</CardTitle>
                      <Shield className="h-5 w-5 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <p className="text-xs text-muted-foreground">Manage automation interfaces</p>
                    </CardContent>
                  </Card>
                </Link>
                <Link to="/indusit/microbots">
                  <Card className="hover:bg-muted/50 cursor-pointer transition-colors">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium">Microbots</CardTitle>
                      <Server className="h-5 w-5 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <p className="text-xs text-muted-foreground">View and manage microbots</p>
                    </CardContent>
                  </Card>
                </Link>
              </div>
            </>
          ) : (
            <div className="text-center p-10">
              <p className="text-muted-foreground">No data available.</p>
            </div>
          )}
        </TabsContent>

        {(userRole === "admin" || userRole === "IDadmin") && (
          <TabsContent value="admin">
            {isAdminDataLoading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
              </div>
            ) : adminDashboardData ? (
              <>
                {/* Admin Metrics Cards */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Last DR Date</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{adminDashboardData.last_dr_date || "N/A"}</div>
                      <p className="text-xs text-muted-foreground">Date of last disaster recovery test</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Current Vulnerabilities</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{adminDashboardData.current_vulnerabilities}</div>
                      <p className="text-xs text-muted-foreground">Total vulnerabilities detected</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Critical Vulnerabilities</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-red-600">{adminDashboardData.critical_vulnerabilities}</div>
                      <p className="text-xs text-muted-foreground">Requires immediate attention</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">High Vulnerabilities</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-amber-600">{adminDashboardData.high_vulnerabilities}</div>
                      <p className="text-xs text-muted-foreground">Should be addressed soon</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Vulnerability Chart */}
                <Card>
                  <CardHeader>
                    <CardTitle>Vulnerability Distribution</CardTitle>
                    <CardDescription>Breakdown of current vulnerability types</CardDescription>
                  </CardHeader>
                  <CardContent className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={[
                            { name: "Critical", value: adminDashboardData.critical_vulnerabilities },
                            { name: "High", value: adminDashboardData.high_vulnerabilities },
                            { name: "Medium", value: adminDashboardData.medium_vulnerabilities },
                            { name: "Low", value: adminDashboardData.low_vulnerabilities },
                          ]}
                          cx="50%"
                          cy="50%"
                          labelLine={true}
                          outerRadius={100}
                          fill="#8884d8"
                          dataKey="value"
                          nameKey="name"
                          label={({name, value}) => `${name}: ${value}`}
                        >
                          <Cell fill="#EF4444" />
                          <Cell fill="#F59E0B" />
                          <Cell fill="#F59E0B" />
                          <Cell fill="#10B981" />
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </>
            ) : (
              <div className="text-center p-10">
                <p className="text-muted-foreground">No admin data available.</p>
              </div>
            )}
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
