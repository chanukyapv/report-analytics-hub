
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { getMetrics, createMetric } from "@/lib/api";
import { ArrowLeft, Save } from "lucide-react";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";

interface Metric {
  id: string;
  name: string;
  baseline: number;
  target: number;
  actual_formula: string;
  unit: string;
}

interface FormValues {
  name: string;
  baseline: number;
  target: number;
  actual_formula: string;
  unit: string;
}

const MetricForm = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const isEditing = !!id;
  
  const form = useForm<FormValues>({
    defaultValues: {
      name: "",
      baseline: 0,
      target: 0,
      actual_formula: "",
      unit: "",
    },
  });
  
  // Handle form submission
  const onSubmit = async (data: FormValues) => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }
    
    setIsSaving(true);
    
    try {
      await createMetric(token, data);
      toast.success(`Metric ${isEditing ? "updated" : "created"} successfully!`);
      navigate("/metrics");
    } catch (error) {
      console.error("Error saving metric:", error);
      toast.error(`Failed to ${isEditing ? "update" : "create"} metric`);
    } finally {
      setIsSaving(false);
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
        toast.error("Only admins can create or edit metrics");
        navigate("/metrics");
        return;
      }
    } catch (e) {
      navigate("/login");
      return;
    }
    
    const fetchData = async () => {
      try {
        if (isEditing && id) {
          // Get all metrics and find the one with matching id
          const metrics = await getMetrics(token);
          const metric = metrics.find((m: Metric) => m.id === id);
          
          if (!metric) {
            toast.error("Metric not found");
            navigate("/metrics");
            return;
          }
          
          // Set form values
          form.setValue("name", metric.name);
          form.setValue("baseline", metric.baseline);
          form.setValue("target", metric.target);
          form.setValue("actual_formula", metric.actual_formula);
          form.setValue("unit", metric.unit);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("Failed to load data");
        navigate("/metrics");
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
        onClick={() => navigate("/metrics")} 
        className="mb-6"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Metrics
      </Button>
      
      <div className="mb-8">
        <h1 className="text-3xl font-bold">{isEditing ? "Edit Metric" : "Create New Metric"}</h1>
        <p className="text-gray-600">
          {isEditing ? "Update the metric details" : "Fill in the details to create a new metric"}
        </p>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Metric Information</CardTitle>
          <CardDescription>Enter the metric details</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Metric name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="baseline"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Baseline</FormLabel>
                      <FormControl>
                        <Input 
                          type="number"
                          step="0.01"
                          placeholder="Baseline value"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="target"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Target</FormLabel>
                      <FormControl>
                        <Input 
                          type="number"
                          step="0.01"
                          placeholder="Target value"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="unit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Unit</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. %, days, dollars" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="actual_formula"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Actual Formula</FormLabel>
                    <FormControl>
                      <Input placeholder="Formula for calculating the metric" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <Button type="submit" disabled={isSaving}>
                <Save className="mr-2 h-4 w-4" />
                {isSaving ? `${isEditing ? "Updating" : "Creating"}...` : `${isEditing ? "Update" : "Create"} Metric`}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};

export default MetricForm;
