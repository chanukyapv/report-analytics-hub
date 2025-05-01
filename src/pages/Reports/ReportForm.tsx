
import { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { getMetrics, getWeeklyReport, createWeeklyReport, updateWeeklyReport, getFYConfigs } from "@/lib/api";
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

interface Quarter {
  name: string;
  weeks: string[];
}

interface FYConfig {
  id: string;
  fy: string;
  quarters: Quarter[];
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
  const [fyConfigs, setFYConfigs] = useState<FYConfig[]>([]);
  const [availableQuarters, setAvailableQuarters] = useState<Quarter[]>([]);
  const [availableWeeks, setAvailableWeeks] = useState<string[]>([]);
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
  
  // Update available quarters when FY changes
  const handleFYChange = (value: string) => {
    form.setValue("fy", value);
    form.setValue("quarter", "");
    form.setValue("week_date", "");
    
    const selectedFY = fyConfigs.find(config => config.fy === value);
    if (selectedFY) {
      setAvailableQuarters(selectedFY.quarters);
    } else {
      setAvailableQuarters([]);
    }
    
    setAvailableWeeks([]);
    handleFormChange();
  };
  
  // Update available weeks when quarter changes
  const handleQuarterChange = (value: string) => {
    form.setValue("quarter", value);
    form.setValue("week_date", "");
    
    const selectedFY = fyConfigs.find(config => config.fy === form.getValues("fy"));
    if (selectedFY) {
      const selectedQuarter = selectedFY.quarters.find(q => q.name === value);
      if (selectedQuarter) {
        setAvailableWeeks(selectedQuarter.weeks);
      } else {
        setAvailableWeeks([]);
      }
    }
    
    handleFormChange();
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
        
        // Fetch FY configs
        const fyConfigsData = await getFYConfigs(token);
        setFYConfigs(fyConfigsData);
        
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
          
          // Set available quarters and weeks
          const selectedFY = fyConfigsData.find(config => config.fy === report.fy);
          if (selectedFY) {
            setAvailableQuarters(selectedFY.quarters);
            
            const selectedQuarter = selectedFY.quarters.find(q => q.name === report.quarter);
            if (selectedQuarter) {
              setAvailableWeeks(selectedQuarter.weeks);
            }
          }
        } else {
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
            {isEditing ? "Update the report details" : "Fill in the details to create a new report"}
          </p>
        </div>
        {autoSaveStatus && (
          <div className="text-sm text-gray-500">{autoSaveStatus}</div>
        )}
      </div>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} onChange={handleFormChange}>
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Report Information</CardTitle>
              <CardDescription>Select the fiscal year, quarter, and week</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="fy"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fiscal Year</FormLabel>
                      <Select 
                        disabled={isEditing}
                        onValueChange={handleFYChange} 
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select fiscal year" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {fyConfigs.map((config) => (
                            <SelectItem key={config.id} value={config.fy}>
                              {config.fy}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="quarter"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Quarter</FormLabel>
                      <Select 
                        disabled={isEditing || !form.getValues("fy")}
                        onValueChange={handleQuarterChange} 
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select quarter" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {availableQuarters.map((quarter) => (
                            <SelectItem key={quarter.name} value={quarter.name}>
                              {quarter.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="week_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Week Ending</FormLabel>
                      <Select 
                        disabled={isEditing || !form.getValues("quarter")}
                        onValueChange={(value) => {
                          field.onChange(value);
                          handleFormChange();
                        }} 
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select week" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {availableWeeks.map((week) => (
                            <SelectItem key={week} value={week}>
                              {new Date(week).toLocaleDateString()}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>
          
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
