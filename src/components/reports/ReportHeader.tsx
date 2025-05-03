
import React from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface ReportHeaderProps {
  isEditing: boolean;
  formatDate: (dateStr: string) => string;
  fyValue: string;
  quarterValue: string;
  weekDateValue: string;
  autoSaveStatus: string;
}

const ReportHeader = ({ 
  isEditing, 
  formatDate, 
  fyValue, 
  quarterValue, 
  weekDateValue,
  autoSaveStatus 
}: ReportHeaderProps) => {
  const navigate = useNavigate();
  
  return (
    <>
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
              : `Creating report for FY ${fyValue}, ${quarterValue}, Week Ending ${formatDate(weekDateValue)}`
            }
          </p>
        </div>
        {autoSaveStatus && (
          <div className="text-sm text-gray-500">{autoSaveStatus}</div>
        )}
      </div>
    </>
  );
};

export default ReportHeader;
