
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { getServiceMetricDashboard, exportReport } from "@/lib/api";
import { BarChart2, Download } from "lucide-react";

interface MetricValue {
  metric_id: string;
  name: string;
  value: number;
  comment?: string;
  baseline?: number;
  target?: number;
  unit?: string;
  status?: string;
}

interface WeekInfo {
  date: string;
  fy: string;
  quarter: string;
  weekNumber: number;
}

interface ReportSummary {
  total: number;
  green: number;
  amber: number;
  red: number;
}

interface DashboardData {
  weekInfo: WeekInfo;
  report: MetricValue[];
  summary: ReportSummary;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    const token = localStorage.getItem("token");
    const user = localStorage.getItem("user");
    
    if (!token || !user) {
      navigate("/login");
      return;
    }
    
    const fetchDashboardData = async () => {
      try {
        const data = await getServiceMetricDashboard(token);
        setDashboardData(data);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
        toast.error("Failed to load dashboard data");
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchDashboardData();
  }, [navigate]);
  
  // Format date from "DD-MM-YYYY" format for display
  const formatDate = (dateStr: string) => {
    if (!dateStr) return "";
    
    // Check if already in DD-MM-YYYY format
    if (dateStr.indexOf('-') === 2) {
      return dateStr;
    }
    
    try {
      // Convert from YYYY-MM-DD to DD-MM-YYYY
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        return `${parts[2]}-${parts[1]}-${parts[0]}`;
      }
      return dateStr;
    } catch (e) {
      return dateStr;
    }
  };
  
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "green": 
        return <Badge className="bg-green-500">Target Achieved</Badge>;
      case "amber": 
        return <Badge className="bg-yellow-500">Above Baseline, Below Target</Badge>;
      case "red": 
        return <Badge className="bg-red-500">Below Baseline</Badge>;
      default:
        return <Badge>Unknown</Badge>;
    }
  };
  
  const handleExport = async (format: string) => {
    const token = localStorage.getItem("token");
    if (!token || !dashboardData) return;
    
    try {
      const result = await exportReport(token, {
        fy: dashboardData.weekInfo.fy,
        quarter: dashboardData.weekInfo.quarter,
        week_date: dashboardData.weekInfo.date,
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
        <p>Loading dashboard...</p>
      </div>
    );
  }
  
  if (!dashboardData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>No dashboard data available</p>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold">QLA1 - Service Metrics Dashboard</h1>
          <p className="text-gray-600">
            FY: {dashboardData.weekInfo.fy} | Quarter: {dashboardData.weekInfo.quarter} | 
            Week Ending: {formatDate(dashboardData.weekInfo.date)}
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => handleExport("pdf")} variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export PDF
          </Button>
          <Button onClick={() => handleExport("excel")} variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export Excel
          </Button>
          <Button onClick={() => navigate("/reports")}>View All Reports</Button>
        </div>
      </div>
      
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Total Metrics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData.summary.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Target Achieved</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <div className="text-2xl font-bold">{dashboardData.summary.green}</div>
              <Badge className="ml-2 bg-green-500">{Math.round((dashboardData.summary.green / dashboardData.summary.total) * 100)}%</Badge>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Above Baseline, Below Target</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <div className="text-2xl font-bold">{dashboardData.summary.amber}</div>
              <Badge className="ml-2 bg-yellow-500">{Math.round((dashboardData.summary.amber / dashboardData.summary.total) * 100)}%</Badge>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Below Baseline</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <div className="text-2xl font-bold">{dashboardData.summary.red}</div>
              <Badge className="ml-2 bg-red-500">{Math.round((dashboardData.summary.red / dashboardData.summary.total) * 100)}%</Badge>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Metrics Table */}
      <Card>
        <CardHeader>
          <CardTitle>Latest Metrics Report</CardTitle>
          <CardDescription>
            Showing metrics for week ending {formatDate(dashboardData.weekInfo.date)}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Metric</TableHead>
                <TableHead>Value</TableHead>
                <TableHead>Target</TableHead>
                <TableHead>Baseline</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Comment</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {dashboardData.report.map((metric) => (
                <TableRow key={metric.metric_id}>
                  <TableCell>{metric.name}</TableCell>
                  <TableCell>{metric.value} {metric.unit}</TableCell>
                  <TableCell>{metric.target} {metric.unit}</TableCell>
                  <TableCell>{metric.baseline} {metric.unit}</TableCell>
                  <TableCell>{getStatusBadge(metric.status || '')}</TableCell>
                  <TableCell>{metric.comment || "-"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
