
import { ConstructionIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface UnderConstructionProps {
  title: string;
}

const UnderConstruction = ({ title }: UnderConstructionProps) => {
  return (
    <div className="container mx-auto py-12">
      <h1 className="text-3xl font-bold mb-8">{title}</h1>
      
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-20">
          <div className="bg-amber-100 p-8 rounded-full mb-6">
            <ConstructionIcon className="h-16 w-16 text-amber-500" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Under Construction</h2>
          <p className="text-gray-600 text-center max-w-md mb-6">
            This dashboard is currently under development and will be available soon. 
            Please check back later for updates.
          </p>
          <div className="w-full max-w-sm bg-gray-200 h-2.5 rounded-full overflow-hidden">
            <div className="bg-amber-500 h-2.5 rounded-full w-2/5"></div>
          </div>
          <p className="text-sm text-gray-500 mt-2">Development progress: 40%</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default UnderConstruction;
