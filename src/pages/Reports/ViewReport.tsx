
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { getWeeklyReport, exportReport } from "@/lib/api";
import { Download, ArrowLeft } from "lucide-react";

interface MetricValue {
  metric_id: string;
  name: string;
  value: number;
  comment?: string;
  baseline?: number;
  target?: number;
  unit?: string;
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

const ViewReport = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [report, setReport] = useState<WeeklyReport | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userRole, setUserRole] = useState("");
  
  useEffect(() => {
    const token = localStorage.getItem("token");
    const userJson = localStorage.getItem("user");
    
    if (!token || !userJson || !id) {
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
    
    const fetchReport = async () => {
      try {
        const data = await getWeeklyReport(token, id);
        setReport(data);
      } catch (error) {
        console.error("Error fetching report:", error);
        toast.error("Failed to load report");
        navigate("/reports");
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchReport();
  }, [navigate, id]);
  
  const getMetricStatus = (value: number, baseline?: number, target?: number) => {
    if (!baseline || !target) return "default";
    
    if (value >= target) return "green";
    if (value >= baseline) return "amber";
    return "red";
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
    if (!report) return;
    
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }
    
    try {
      const result = await exportReport(token, {
        fy: report.fy,
        quarter: report.quarter,
        week_date: report.week_date,
        format
      });
      
      window.open(result.url, '_blank');
    } catch (error) {
      console.error(`Error exporting as ${format}:`, error);
      toast.error(`Failed to export as ${format}`);
    }
  };
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading report...</p>
      </div>
    );
  }
  
  if (!report) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Report not found</p>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-8 px-4">
      <Button 
        variant="outline" 
        onClick={() => navigate("/reports")} 
        className="mb-6"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Reports
      </Button>
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold">Report Details</h1>
          <p className="text-gray-600">
            FY: {report.fy} | Quarter: {report.quarter} | 
            Week Ending: {new Date(report.week_date).toLocaleDateString()}
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
          {userRole === "admin" && (
            <Button onClick={() => navigate(`/reports/edit/${report.id}`)}>
              Edit Report
            </Button>
          )}
        </div>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Metrics</CardTitle>
          <CardDescription>
            Report created on {new Date(report.created_at).toLocaleDateString()}
            {report.updated_at && ` | Last updated on ${new Date(report.updated_at).toLocaleDateString()}`}
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
              {report.metrics.map((metric) => {
                const status = getMetricStatus(metric.value, metric.baseline, metric.target);
                return (
                  <TableRow key={metric.metric_id}>
                    <TableCell>{metric.name}</TableCell>
                    <TableCell>{metric.value} {metric.unit}</TableCell>
                    <TableCell>{metric.target} {metric.unit}</TableCell>
                    <TableCell>{metric.baseline} {metric.unit}</TableCell>
                    <TableCell>{getStatusBadge(status)}</TableCell>
                    <TableCell>{metric.comment || "-"}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default ViewReport;
