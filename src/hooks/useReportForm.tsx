
import { useState, useCallback, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useNavigate, useParams } from "react-router-dom";
import debounce from "lodash.debounce";
import { toast } from "sonner";
import { getMetrics, getWeeklyReport, createWeeklyReport, updateWeeklyReport } from "@/lib/api";

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

export const useReportForm = () => {
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
  
  // Auto-save debounced function
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
        if (isSubmit) {
          // For final submission
          let result;
          if (isEditing) {
            result = await updateWeeklyReport(token, id as string, input);
          } else {
            result = await createWeeklyReport(token, input);
          }
          
          setAutoSaveStatus("Report saved successfully!");
          toast.success("Report saved successfully!");
          navigate("/reports");
        } else {
          // For auto-save, we just want to save draft but not submit
          setAutoSaveStatus("Draft saved");
        }
      } catch (error) {
        console.error("Error saving report:", error);
        setAutoSaveStatus("Error saving");
        if (isSubmit) {
          const errorMsg = error instanceof Error ? error.message : "Failed to save report";
          toast.error(errorMsg);
        }
      }
    }, 1000),
    [isEditing, id, navigate]
  );
  
  // Handle form changes for auto-save
  const handleFormChange = () => {
    const data = form.getValues();
    setAutoSaveStatus("Saving...");
    debouncedSave(data);
  };
  
  // Handle form submission
  const onSubmit = async (data: FormValues) => {
    setIsSaving(true);
    await debouncedSave(data, true); // Pass true for final submission
    setIsSaving(false);
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
          report.metrics.forEach((metric: any) => {
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
          metricsData.forEach((metric: Metric) => {
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

  return {
    form,
    metrics,
    isLoading,
    isSaving,
    autoSaveStatus,
    isEditing,
    handleFormChange,
    onSubmit,
    formatDate
  };
};
