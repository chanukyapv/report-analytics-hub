
import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Save } from "lucide-react";
import { Form } from "@/components/ui/form";
import { useReportForm } from "@/hooks/useReportForm";
import ReportHeader from "@/components/reports/ReportHeader";
import MetricEntry from "@/components/reports/MetricEntry";

const ReportForm = () => {
  const {
    form,
    metrics,
    isLoading,
    isSaving,
    autoSaveStatus,
    isEditing,
    handleFormChange,
    onSubmit,
    formatDate
  } = useReportForm();
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-8 px-4">
      <ReportHeader 
        isEditing={isEditing}
        formatDate={formatDate}
        fyValue={form.getValues("fy")}
        quarterValue={form.getValues("quarter")}
        weekDateValue={form.getValues("week_date")}
        autoSaveStatus={autoSaveStatus}
      />
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} onChange={handleFormChange}>
          <Card>
            <CardHeader>
              <CardTitle>Metrics</CardTitle>
              <CardDescription>Enter values and comments for each metric</CardDescription>
            </CardHeader>
            <CardContent>
              {metrics.map((metric) => (
                <MetricEntry 
                  key={metric.id}
                  metric={metric}
                  form={form}
                  handleFormChange={handleFormChange}
                />
              ))}
              
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
