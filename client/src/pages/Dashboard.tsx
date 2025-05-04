
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { fetchCurrentUser, fetchUserRoleRequests, fetchSystemStats } from "@/lib/api";
import { BarChart, GanttChart, PieChart, Users } from "lucide-react";

const Dashboard = () => {
  const [user, setUser] = useState<any>(null);
  const { data: currentUser } = useQuery({
    queryKey: ["me"],
    queryFn: fetchCurrentUser
  });

  const { data: roleRequests } = useQuery({
    queryKey: ["userRoleRequests"],
    queryFn: fetchUserRoleRequests
  });

  const { data: systemStats } = useQuery({
    queryKey: ["systemStats"],
    queryFn: fetchSystemStats,
    enabled: currentUser?.role === "appadmin"
  });
  
  useEffect(() => {
    // Get user from local storage or API
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    
    if (currentUser) {
      setUser(currentUser);
      localStorage.setItem("user", JSON.stringify(currentUser));
    }
  }, [currentUser]);
  
  if (!user) return <div>Loading...</div>;
  
  const pendingRequests = roleRequests?.filter((req: any) => req.status === "pending").length;
  const isSDUser = user.role === "SDuser" || user.role === "SDadmin" || user.role === "admin" || user.role === "appadmin";
  const isSDAdmin = user.role === "SDadmin" || user.role === "admin" || user.role === "appadmin";
  const isIDUser = user.role === "IDuser" || user.role === "IDadmin" || user.role === "admin" || user.role === "appadmin";
  const isIDAdmin = user.role === "IDadmin" || user.role === "admin" || user.role === "appadmin";
  const isAppAdmin = user.role === "appadmin";
  
  return (
    <div className="container py-6">
      <h1 className="text-3xl font-bold mb-6">Welcome, {user.name}</h1>
      
      {user.role === "user" && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Get Started</CardTitle>
            <CardDescription>Request access to the dashboards you need</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="mb-4">You currently have limited access. Request access to one of our dashboards:</p>
            <Button asChild>
              <Link to="/profile/role-requests">Request Dashboard Access</Link>
            </Button>
          </CardContent>
        </Card>
      )}
      
      {pendingRequests > 0 && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-8">
          <div className="flex">
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                You have {pendingRequests} pending access request{pendingRequests > 1 ? 's' : ''}. An administrator will review your request soon.
              </p>
            </div>
          </div>
        </div>
      )}
      
      {/* Admin Stats */}
      {isAppAdmin && systemStats && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">System Overview</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center">
                  <Users className="h-4 w-4 mr-2" />
                  Total Users
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{systemStats.total_users}</div>
                <p className="text-xs text-muted-foreground">
                  {systemStats.active_users} active users
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center">
                  <GanttChart className="h-4 w-4 mr-2" />
                  Role Requests
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{systemStats.pending_requests}</div>
                <p className="text-xs text-muted-foreground">
                  Pending approvals
                </p>
              </CardContent>
            </Card>
            
            <Card className="col-span-2">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  User Roles Distribution
                </CardTitle>
              </CardHeader>
              <CardContent className="h-32 flex items-center">
                <div className="w-full flex justify-around items-end h-full">
                  {systemStats.users_by_role?.map((role: any, index: number) => (
                    <div key={role.role} className="flex flex-col items-center">
                      <div 
                        className="bg-primary/80 hover:bg-primary" 
                        style={{ 
                          height: `${Math.max(20, role.count * 10)}px`, 
                          width: '30px',
                          opacity: 0.6 + (index * 0.1)
                        }}
                      ></div>
                      <div className="mt-2 text-xs font-medium">{role.role}</div>
                      <div className="text-xs text-muted-foreground">{role.count}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div className="flex justify-end mt-4">
            <Button asChild>
              <Link to="/admin/users">View User Management</Link>
            </Button>
          </div>
        </div>
      )}

      {/* Available Dashboards */}
      <h2 className="text-xl font-semibold mb-4">Your Dashboards</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isSDUser && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart className="h-5 w-5 mr-2 text-blue-500" />
                Service Dashboard
              </CardTitle>
              <CardDescription>
                Track and manage service metrics
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="space-y-4">
                <Link to="/service/metrics">
                  <Button variant="outline" className="w-full justify-start">
                    View Metrics
                  </Button>
                </Link>
                <Link to="/service/reports">
                  <Button variant="outline" className="w-full justify-start">
                    View Reports
                  </Button>
                </Link>
                {isSDAdmin && (
                  <Link to="/service/metrics/new">
                    <Button variant="default" className="w-full justify-start">
                      Create New Metric
                    </Button>
                  </Link>
                )}
              </div>
            </CardContent>
          </Card>
        )}
        
        {isIDUser && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <PieChart className="h-5 w-5 mr-2 text-green-500" />
                IndusIT Dashboard
              </CardTitle>
              <CardDescription>
                Monitor automation and deployment
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="space-y-4">
                <Link to="/indusit/dashboard">
                  <Button variant="outline" className="w-full justify-start">
                    View Dashboard
                  </Button>
                </Link>
                <Link to="/indusit/automations">
                  <Button variant="outline" className="w-full justify-start">
                    View Automations
                  </Button>
                </Link>
                {isIDAdmin && (
                  <Button variant="default" className="w-full justify-start">
                    Manage Infrastructure
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}
        
        <Card>
          <CardHeader>
            <CardTitle>User Profile</CardTitle>
            <CardDescription>
              Manage your account and access
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-x-2">
                <span className="font-medium">Role:</span>
                <span>{user.role}</span>
              </div>
              <Link to="/profile/role-requests">
                <Button variant="outline" className="w-full justify-start">
                  Manage Role Requests
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
