
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { getMetrics } from "@/lib/api";
import { Edit, Trash2 } from "lucide-react";

interface Metric {
  id: string;
  name: string;
  baseline: number;
  target: number;
  actual_formula: string;
  unit: string;
  created_by: string;
}

const MetricsPage = () => {
  const navigate = useNavigate();
  const [metrics, setMetrics] = useState<Metric[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userRole, setUserRole] = useState("");
  
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
    } catch (e) {
      navigate("/login");
      return;
    }
    
    const fetchMetrics = async () => {
      try {
        const data = await getMetrics(token);
        setMetrics(data);
      } catch (error) {
        console.error("Error fetching metrics:", error);
        toast.error("Failed to load metrics");
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchMetrics();
  }, [navigate]);
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading metrics...</p>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold">Metrics</h1>
          <p className="text-gray-600">Manage service metrics</p>
        </div>
        {userRole === "admin" && (
          <Button onClick={() => navigate("/metrics/create")}>Create New Metric</Button>
        )}
      </div>
      
      {metrics.length === 0 ? (
        <Card>
          <CardContent className="py-10">
            <div className="text-center">
              <p className="text-gray-500">No metrics available</p>
              {userRole === "admin" && (
                <Button 
                  onClick={() => navigate("/metrics/create")} 
                  className="mt-4"
                >
                  Create First Metric
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>All Metrics</CardTitle>
            <CardDescription>List of all service metrics</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Baseline</TableHead>
                  <TableHead>Target</TableHead>
                  <TableHead>Unit</TableHead>
                  <TableHead>Formula</TableHead>
                  {userRole === "admin" && <TableHead className="text-right">Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {metrics.map((metric) => (
                  <TableRow key={metric.id}>
                    <TableCell className="font-medium">{metric.name}</TableCell>
                    <TableCell>{metric.baseline} {metric.unit}</TableCell>
                    <TableCell>{metric.target} {metric.unit}</TableCell>
                    <TableCell>{metric.unit}</TableCell>
                    <TableCell>{metric.actual_formula}</TableCell>
                    {userRole === "admin" && (
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => navigate(`/metrics/edit/${metric.id}`)}
                          >
                            <Edit className="h-4 w-4" />
                            <span className="sr-only">Edit</span>
                          </Button>
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default MetricsPage;
