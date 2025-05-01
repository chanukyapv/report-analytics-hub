
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { getWeeklyReports, exportReport } from "@/lib/api";
import { Download, Edit, PieChart, BarChart2 } from "lucide-react";

interface MetricValue {
  metric_id: string;
  name: string;
  value: number;
  comment?: string;
}

interface WeeklyReport {
  id: string;
  fy: string;
  quarter: string;
  week_date: string;
  metrics: MetricValue[];
  created_by: string;
  created_at: string;
  updated_at?: string;
}

const ReportsPage = () => {
  const navigate = useNavigate();
  const [reports, setReports] = useState<WeeklyReport[]>([]);
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
    
    const fetchReports = async () => {
      try {
        const data = await getWeeklyReports(token);
        setReports(data);
      } catch (error) {
        console.error("Error fetching reports:", error);
        toast.error("Failed to load reports");
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchReports();
  }, [navigate]);
  
  const handleExport = async (fy: string, quarter: string, week_date: string, format: string) => {
    const token = localStorage.getItem("token");
    if (!token) return;
    
    try {
      const result = await exportReport(token, {
        fy,
        quarter,
        week_date,
        format
      });
      
      // Open the URL in a new window or trigger download
      window.open(result.url, '_blank');
    } catch (error) {
      console.error(`Error exporting as ${format}:`, error);
      toast.error(`Failed to export as ${format}`);
    }
  };
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading reports...</p>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold">Service Metrics Reports</h1>
          <p className="text-gray-600">View and manage service metrics reports</p>
        </div>
        {userRole === "admin" && (
          <Button onClick={() => navigate("/reports/create")}>Create New Report</Button>
        )}
      </div>
      
      {reports.length === 0 ? (
        <Card>
          <CardContent className="py-10">
            <div className="text-center">
              <p className="text-gray-500">No reports available</p>
              {userRole === "admin" && (
                <Button 
                  onClick={() => navigate("/reports/create")} 
                  className="mt-4"
                >
                  Create First Report
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Weekly Reports</CardTitle>
            <CardDescription>List of all service metrics reports</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>FY</TableHead>
                  <TableHead>Quarter</TableHead>
                  <TableHead>Week Ending</TableHead>
                  <TableHead>Created On</TableHead>
                  <TableHead>Last Updated</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reports.map((report) => (
                  <TableRow key={report.id}>
                    <TableCell>{report.fy}</TableCell>
                    <TableCell>{report.quarter}</TableCell>
                    <TableCell>{new Date(report.week_date).toLocaleDateString()}</TableCell>
                    <TableCell>{new Date(report.created_at).toLocaleDateString()}</TableCell>
                    <TableCell>{report.updated_at ? new Date(report.updated_at).toLocaleDateString() : "-"}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => navigate(`/reports/view/${report.id}`)}
                        >
                          <BarChart2 className="h-4 w-4" />
                          <span className="sr-only">View</span>
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleExport(report.fy, report.quarter, report.week_date, "pdf")}
                        >
                          <Download className="h-4 w-4" />
                          <span className="sr-only">Export PDF</span>
                        </Button>
                        {userRole === "admin" && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => navigate(`/reports/edit/${report.id}`)}
                          >
                            <Edit className="h-4 w-4" />
                            <span className="sr-only">Edit</span>
                          </Button>
                        )}
                      </div>
                    </TableCell>
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

export default ReportsPage;
