
import { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { getMetrics, getWeeklyReport, createWeeklyReport, updateWeeklyReport } from "@/lib/api";
import { ArrowLeft, Save } from "lucide-react";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import debounce from "lodash.debounce";

interface Metric {
  id: string;
  name: string;
  baseline: number;
  target: number;
  unit: string;
}

interface MetricValue {
  metric_id: string;
  value: number;
  comment?: string;
}

interface FormValues {
  fy: string;
  quarter: string;
  week_date: string;
  metrics: {
    [key: string]: {
      value: number;
      comment?: string;
    };
  };
}

const ReportForm = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [metrics, setMetrics] = useState<Metric[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [autoSaveStatus, setAutoSaveStatus] = useState("");
  const isEditing = !!id;
  
  const form = useForm<FormValues>({
    defaultValues: {
      fy: "",
      quarter: "",
      week_date: "",
      metrics: {},
    },
  });
  
  // Auto-save debounced function
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedSave = useCallback(
    debounce(async (data: FormValues, isSubmit = false) => {
      const token = localStorage.getItem("token");
      if (!token) return;
      
      // Convert metrics object to array
      const metricsArray: MetricValue[] = [];
      Object.entries(data.metrics).forEach(([metric_id, { value, comment }]) => {
        metricsArray.push({
          metric_id,
          value: parseFloat(value.toString()),
          comment,
        });
      });
      
      const input = {
        fy: data.fy,
        quarter: data.quarter,
        week_date: data.week_date,
        metrics: metricsArray,
      };
      
      try {
        if (isEditing) {
          await updateWeeklyReport(token, id as string, input);
        } else {
          await createWeeklyReport(token, input);
        }
        
        setAutoSaveStatus(isSubmit ? "Saved successfully!" : "Draft saved");
        
        if (isSubmit) {
          toast.success("Report saved successfully!");
          navigate("/reports");
        }
      } catch (error) {
        console.error("Error saving report:", error);
        setAutoSaveStatus("Error saving");
        if (isSubmit) {
          toast.error("Failed to save report");
        }
      }
    }, 1000),
    [isEditing, id, navigate]
  );
  
  // Handle form changes for auto-save
  const handleFormChange = async () => {
    const data = form.getValues();
    setAutoSaveStatus("Saving...");
    debouncedSave(data);
  };
  
  // Handle form submission
  const onSubmit = async (data: FormValues) => {
    setIsSaving(true);
    await debouncedSave(data, true);
    setIsSaving(false);
  };
  
  // Calculate status based on metric value
  const getMetricStatus = (value: number, baseline: number, target: number) => {
    if (value >= target) return "green";
    if (value >= baseline) return "amber";
    return "red";
  };
  
  // Get status badge
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
  
  // Format date for display (DD-MM-YYYY)
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
  
  // Load data on component mount
  useEffect(() => {
    const token = localStorage.getItem("token");
    const userJson = localStorage.getItem("user");
    
    if (!token || !userJson) {
      navigate("/login");
      return;
    }
    
    // Check if user is admin
    try {
      const user = JSON.parse(userJson);
      if (user.role !== "admin") {
        toast.error("Only admins can create or edit reports");
        navigate("/reports");
        return;
      }
    } catch (e) {
      navigate("/login");
      return;
    }
    
    const fetchData = async () => {
      try {
        // Fetch metrics
        const metricsData = await getMetrics(token);
        setMetrics(metricsData);
        
        // If editing, fetch the report data
        if (isEditing && id) {
          const report = await getWeeklyReport(token, id);
          
          // Set form values
          form.setValue("fy", report.fy);
          form.setValue("quarter", report.quarter);
          form.setValue("week_date", report.week_date);
          
          // Set metrics values
          const metricsObj: { [key: string]: { value: number; comment?: string } } = {};
          report.metrics.forEach((metric) => {
            metricsObj[metric.metric_id] = {
              value: metric.value,
              comment: metric.comment,
            };
          });
          form.setValue("metrics", metricsObj);
        } else {
          // For new report, get values from session storage
          const storedData = sessionStorage.getItem("reportFormData");
          if (storedData) {
            const formData = JSON.parse(storedData);
            form.setValue("fy", formData.fy);
            form.setValue("quarter", formData.quarter);
            form.setValue("week_date", formData.week_date);
          } else {
            // If no stored data, redirect to step 1
            navigate("/reports/create");
            return;
          }
          
          // Initialize metrics object with empty values
          const metricsObj: { [key: string]: { value: number; comment?: string } } = {};
          metricsData.forEach((metric) => {
            metricsObj[metric.id] = {
              value: 0,
              comment: "",
            };
          });
          form.setValue("metrics", metricsObj);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("Failed to load data");
        navigate("/reports");
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [navigate, isEditing, id, form]);
  
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
        onClick={() => navigate("/reports")} 
        className="mb-6"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Reports
      </Button>
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold">{isEditing ? "Edit Report" : "Create New Report"}</h1>
          <p className="text-gray-600">
            {isEditing 
              ? "Update the report details" 
              : `Creating report for FY ${form.getValues("fy")}, ${form.getValues("quarter")}, Week Ending ${formatDate(form.getValues("week_date"))}`
            }
          </p>
        </div>
        {autoSaveStatus && (
          <div className="text-sm text-gray-500">{autoSaveStatus}</div>
        )}
      </div>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} onChange={handleFormChange}>
          <Card>
            <CardHeader>
              <CardTitle>Metrics</CardTitle>
              <CardDescription>Enter values and comments for each metric</CardDescription>
            </CardHeader>
            <CardContent>
              {metrics.map((metric) => {
                // Get the current value and comment from the form
                const formMetric = form.getValues(`metrics.${metric.id}`);
                const currentValue = formMetric?.value || 0;
                
                // Calculate status
                const status = getMetricStatus(currentValue, metric.baseline, metric.target);
                
                return (
                  <div key={metric.id} className="border-b pb-4 mb-4 last:border-b-0">
                    <div className="flex flex-wrap justify-between items-center mb-2">
                      <h3 className="text-lg font-medium">{metric.name}</h3>
                      {getStatusBadge(status)}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-2">
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Target: {metric.target} {metric.unit}</p>
                        <p className="text-sm text-gray-500">Baseline: {metric.baseline} {metric.unit}</p>
                      </div>
                      
                      <div>
                        <FormField
                          control={form.control}
                          name={`metrics.${metric.id}.value`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Value ({metric.unit})</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  step="0.01"
                                  onChange={(e) => {
                                    field.onChange(parseFloat(e.target.value) || 0);
                                    handleFormChange();
                                  }}
                                  value={field.value || ""}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <div>
                        <FormField
                          control={form.control}
                          name={`metrics.${metric.id}.comment`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Comment</FormLabel>
                              <FormControl>
                                <Textarea 
                                  placeholder="Add a comment about this metric"
                                  className="resize-none"
                                  onChange={(e) => {
                                    field.onChange(e.target.value);
                                    handleFormChange();
                                  }}
                                  value={field.value || ""}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
              
              <div className="mt-6">
                <Button type="submit" disabled={isSaving}>
                  <Save className="mr-2 h-4 w-4" />
                  {isSaving ? "Saving..." : "Save Report"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
      </Form>
    </div>
  );
};

export default ReportForm;
