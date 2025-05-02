
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { getFYConfigs } from "@/lib/api";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useForm } from "react-hook-form";

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
}

const ReportFormStep1 = () => {
  const navigate = useNavigate();
  const [fyConfigs, setFYConfigs] = useState<FYConfig[]>([]);
  const [availableQuarters, setAvailableQuarters] = useState<Quarter[]>([]);
  const [availableWeeks, setAvailableWeeks] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const form = useForm<FormValues>({
    defaultValues: {
      fy: "",
      quarter: "",
      week_date: "",
    },
  });

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
  };

  // Handle form submission to proceed to the next step
  const onSubmit = (data: FormValues) => {
    // Store the selected values in session storage
    sessionStorage.setItem("reportFormData", JSON.stringify(data));
    
    // Navigate to the actual form
    navigate("/reports/create-form");
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
        toast.error("Only admins can create reports");
        navigate("/reports");
        return;
      }
    } catch (e) {
      navigate("/login");
      return;
    }
    
    const fetchData = async () => {
      try {
        // Fetch FY configs
        const fyConfigsData = await getFYConfigs(token);
        setFYConfigs(fyConfigsData);
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("Failed to load fiscal year configurations");
        navigate("/reports");
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  // Format date for display (DD-MM-YYYY)
  const formatDate = (dateStr: string) => {
    try {
      const parts = dateStr.split('-');
      // Check if already in DD-MM-YYYY format
      if (parts[0].length === 2) return dateStr;
      
      // Assuming it's in YYYY-MM-DD format
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-GB'); // DD/MM/YYYY
    } catch (e) {
      return dateStr; // Return original if parsing fails
    }
  };

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
          <h1 className="text-3xl font-bold">Create New Report</h1>
          <p className="text-gray-600">
            Step 1: Select Fiscal Year, Quarter, and Week
          </p>
        </div>
      </div>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <Card>
            <CardHeader>
              <CardTitle>Report Period</CardTitle>
              <CardDescription>
                Select the fiscal year, quarter, and week for the new report
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <FormField
                control={form.control}
                name="fy"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fiscal Year</FormLabel>
                    <Select 
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
                    <FormMessage />
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
                      disabled={!form.getValues("fy")}
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
                    <FormMessage />
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
                      disabled={!form.getValues("quarter")}
                      onValueChange={(value) => {
                        field.onChange(value);
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
                            {formatDate(week)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="flex justify-end mt-6">
                <Button 
                  type="submit" 
                  disabled={!form.getValues("week_date")}
                >
                  Continue to Report Form
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
      </Form>
    </div>
  );
};

export default ReportFormStep1;
