
import React from "react";
import { FormField, FormItem, FormLabel, FormControl } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

interface Metric {
  id: string;
  name: string;
  baseline: number;
  target: number;
  unit: string;
}

interface MetricEntryProps {
  metric: Metric;
  form: any;
  handleFormChange: () => void;
}

const MetricEntry = ({ metric, form, handleFormChange }: MetricEntryProps) => {
  // Get the current value and comment from the form
  const formMetric = form.getValues(`metrics.${metric.id}`);
  const currentValue = formMetric?.value || 0;
  
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

  // Calculate status
  const status = getMetricStatus(currentValue, metric.baseline, metric.target);

  return (
    <div className="border-b pb-4 mb-4 last:border-b-0">
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
};

export default MetricEntry;
