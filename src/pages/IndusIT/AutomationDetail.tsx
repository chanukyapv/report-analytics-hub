
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getAutomationMetadataByApaid, getExecutionDataByApaid } from "@/lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Loader2, ArrowLeft, Edit, Mail, ExternalLink } from "lucide-react";

const AutomationDetail = () => {
  const { apaid } = useParams<{ apaid: string }>();
  const navigate = useNavigate();
  const [userRoles, setUserRoles] = useState<string[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  
  // Get user roles from localStorage
  useEffect(() => {
    const userJson = localStorage.getItem("user");
    if (userJson) {
      try {
        const user = JSON.parse(userJson);
        const roles = [...(user.roles || []), user.role];
        setUserRoles(roles);
        setIsAdmin(roles.includes("IDadmin"));
      } catch (e) {
        console.error("Error parsing user data:", e);
      }
    }
  }, []);
  
  // Fetch automation metadata
  const { 
    data: automation, 
    isLoading: isLoadingMetadata, 
    error: metadataError 
  } = useQuery({
    queryKey: ['automation-metadata', apaid],
    queryFn: async () => {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("No authentication token found");
      if (!apaid) throw new Error("No APAID provided");
      
      return await getAutomationMetadataByApaid(token, apaid);
    },
    enabled: !!apaid && userRoles.length > 0
  });
  
  // Fetch execution data
  const {
    data: executionData,
    isLoading: isLoadingExecution,
    error: executionError
  } = useQuery({
    queryKey: ['execution-data', apaid],
    queryFn: async () => {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("No authentication token found");
      if (!apaid) throw new Error("No APAID provided");
      
      return await getExecutionDataByApaid(token, apaid);
    },
    enabled: !!apaid && userRoles.length > 0
  });
  
  // Handle errors
  useEffect(() => {
    if (metadataError) {
      toast.error("Failed to load automation details");
      console.error("Automation metadata error:", metadataError);
    }
    
    if (executionError) {
      toast.error("Failed to load execution data");
      console.error("Execution data error:", executionError);
    }
  }, [metadataError, executionError]);
  
  // Check if user has access
  const hasAccess = userRoles.some(role => ["IDuser", "IDadmin"].includes(role));
  
  if (!hasAccess) {
    return (
      <div className="container mx-auto p-4">
        <Card>
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>You do not have permission to access the IndusIT Dashboard</CardDescription>
          </CardHeader>
          <CardContent>
            <p>Please contact your administrator if you believe you should have access.</p>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  const isLoading = isLoadingMetadata || isLoadingExecution;
  
  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => navigate('/indusit/automations')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to List
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">
            {isLoading ? 'Loading Automation...' : automation?.rpa_name}
          </h1>
          {!isLoading && automation && (
            <Badge variant={automation.priority === "P1" ? "destructive" : "secondary"}>
              {automation.priority}
            </Badge>
          )}
        </div>
        
        {isAdmin && !isLoading && automation && (
          <Button onClick={() => navigate(`/indusit/automations/edit/${automation.id}`)}>
            <Edit className="mr-2 h-4 w-4" /> Edit Automation
          </Button>
        )}
      </div>
      
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2">Loading automation details...</span>
        </div>
      ) : automation ? (
        <Tabs defaultValue="details" className="space-y-4">
          <TabsList>
            <TabsTrigger value="details">Metadata</TabsTrigger>
            <TabsTrigger value="execution">Execution Data</TabsTrigger>
            <TabsTrigger value="contacts">Contacts</TabsTrigger>
            <TabsTrigger value="links">Links & Documents</TabsTrigger>
          </TabsList>
          
          <TabsContent value="details">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Basic Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="text-sm font-medium text-muted-foreground">APAID</div>
                    <div>{automation.apaid}</div>
                    
                    <div className="text-sm font-medium text-muted-foreground">RPA Name</div>
                    <div>{automation.rpa_name}</div>
                    
                    <div className="text-sm font-medium text-muted-foreground">Priority</div>
                    <div>{automation.priority}</div>
                    
                    <div className="text-sm font-medium text-muted-foreground">Category</div>
                    <div>{automation.category}</div>
                    
                    <div className="text-sm font-medium text-muted-foreground">Lifecycle Status</div>
                    <div>{automation.lifecycle_status}</div>
                    
                    <div className="text-sm font-medium text-muted-foreground">Frequency</div>
                    <div>{automation.frequency}</div>
                    
                    <div className="text-sm font-medium text-muted-foreground">Tech</div>
                    <div>{automation.tech}</div>
                    
                    <div className="text-sm font-medium text-muted-foreground">Screen Scraping</div>
                    <div>{automation.screen_scraping ? "Yes" : "No"}</div>
                    
                    <div className="text-sm font-medium text-muted-foreground">Connecting to DB</div>
                    <div>{automation.connecting_to_db ? "Yes" : "No"}</div>
                    
                    <div className="text-sm font-medium text-muted-foreground">Housekeeping Activities</div>
                    <div>{automation.house_keeping_activities ? "Yes" : "No"}</div>
                  </div>
                  
                  <Separator />
                  
                  <div>
                    <div className="text-sm font-medium text-muted-foreground mb-2">Description</div>
                    <div className="text-sm">{automation.description}</div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Business Impact</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 gap-2">
                    <div className="text-sm font-medium text-muted-foreground">Business Impact</div>
                    <div className="text-sm">{automation.business_impact}</div>
                    
                    <div className="text-sm font-medium text-muted-foreground">SLA</div>
                    <div>{automation.sla}</div>
                    
                    <div className="text-sm font-medium text-muted-foreground">Expected Volume</div>
                    <div>{automation.avg_volumes_expected} per {automation.frequency}</div>
                  </div>
                  
                  <Separator />
                  
                  <div>
                    <div className="text-sm font-medium text-muted-foreground mb-2">Products Impacted</div>
                    <div className="flex flex-wrap gap-1">
                      {automation.product_impacted.map((product, i) => (
                        <Badge key={i} variant="outline">{product}</Badge>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <div className="text-sm font-medium text-muted-foreground mb-2">Journeys Impacted</div>
                    <div className="flex flex-wrap gap-1">
                      {automation.journey_impacted.map((journey, i) => (
                        <Badge key={i} variant="outline">{journey}</Badge>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <div className="text-sm font-medium text-muted-foreground mb-2">CP Impacted</div>
                    <div className="flex flex-wrap gap-1">
                      {automation.cp_impacted.map((cp, i) => (
                        <Badge key={i} variant="outline">{cp}</Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Input & Interfaces</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="text-sm font-medium text-muted-foreground mb-2">Input Type</div>
                    <div>{automation.input_type}</div>
                  </div>
                  
                  <div>
                    <div className="text-sm font-medium text-muted-foreground mb-2">Input Sources</div>
                    <div className="flex flex-wrap gap-1">
                      {automation.input_source.map((source, i) => (
                        <Badge key={i} variant="outline">{source}</Badge>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <div className="text-sm font-medium text-muted-foreground mb-2">Input Source Details</div>
                    <ul className="list-disc pl-5 space-y-1">
                      {automation.input_source_details.map((detail, i) => (
                        <li key={i} className="text-sm">{detail}</li>
                      ))}
                    </ul>
                  </div>
                  
                  <div>
                    <div className="text-sm font-medium text-muted-foreground mb-2">Interfaces</div>
                    <div className="flex flex-wrap gap-1">
                      {automation.interfaces.map((interface_, i) => (
                        <Badge key={i} variant="outline">{interface_}</Badge>
                      ))}
                    </div>
                  </div>
                  
                  {automation.connecting_to_db && automation.db_table_names && (
                    <div>
                      <div className="text-sm font-medium text-muted-foreground mb-2">DB Tables Used</div>
                      <ul className="list-disc pl-5 space-y-1">
                        {automation.db_table_names.map((table, i) => (
                          <li key={i} className="text-sm">{table}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Additional Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="text-sm font-medium text-muted-foreground mb-2">Support Queue ID</div>
                    <div>{automation.support_queue_id || "N/A"}</div>
                  </div>
                  
                  <div>
                    <div className="text-sm font-medium text-muted-foreground mb-2">Current Open Stories</div>
                    <div>{automation.open_stories || "None"}</div>
                  </div>
                  
                  {automation.addl_details && (
                    <div>
                      <div className="text-sm font-medium text-muted-foreground mb-2">Additional Details</div>
                      <div className="text-sm">{automation.addl_details}</div>
                    </div>
                  )}
                  
                  <div>
                    <div className="text-sm font-medium text-muted-foreground mb-2">Created At</div>
                    <div>{automation.created_at}</div>
                  </div>
                  
                  <div>
                    <div className="text-sm font-medium text-muted-foreground mb-2">Last Updated</div>
                    <div>{automation.updated_at}</div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="execution">
            {executionData ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Current Status</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="text-sm font-medium text-muted-foreground">Status</div>
                      <div>
                        <Badge className={executionData.current_status === "Running" ? "bg-green-600" : "bg-amber-600"}>
                          {executionData.current_status}
                        </Badge>
                      </div>
                      
                      <div className="text-sm font-medium text-muted-foreground">Last Successful Run</div>
                      <div>{executionData.last_successful_execution || "N/A"}</div>
                      
                      <div className="text-sm font-medium text-muted-foreground">Daily Volume</div>
                      <div>{executionData.volumes_daily?.toLocaleString() || "N/A"}</div>
                      
                      <div className="text-sm font-medium text-muted-foreground">Monthly Volume</div>
                      <div>{executionData.volumes_monthly?.toLocaleString() || "N/A"}</div>
                      
                      <div className="text-sm font-medium text-muted-foreground">Business Impact</div>
                      <div>{executionData.business_impact || "N/A"}</div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Infrastructure Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <div className="text-sm font-medium text-muted-foreground mb-2">Infra Details</div>
                      <ul className="list-disc pl-5 space-y-1">
                        {executionData.infra_details.map((detail, i) => (
                          <li key={i} className="text-sm">{detail}</li>
                        ))}
                      </ul>
                    </div>
                    
                    <div>
                      <div className="text-sm font-medium text-muted-foreground mb-2">Web Service URL</div>
                      <div className="text-sm break-all">
                        {executionData.web_service_url ? (
                          <a 
                            href={executionData.web_service_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline flex items-center"
                          >
                            {executionData.web_service_url}
                            <ExternalLink className="h-3 w-3 ml-1" />
                          </a>
                        ) : (
                          "N/A"
                        )}
                      </div>
                    </div>
                    
                    <div>
                      <div className="text-sm font-medium text-muted-foreground mb-2">Application URL</div>
                      <div className="text-sm break-all">
                        {executionData.app_url ? (
                          <a 
                            href={executionData.app_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline flex items-center"
                          >
                            {executionData.app_url}
                            <ExternalLink className="h-3 w-3 ml-1" />
                          </a>
                        ) : (
                          "N/A"
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Execution Data</CardTitle>
                </CardHeader>
                <CardContent>
                  <p>No execution data available for this automation.</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
          
          <TabsContent value="contacts">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Business Contacts</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="text-sm font-medium text-muted-foreground mb-2">Business Owners</div>
                    <ul className="space-y-2">
                      {automation.business_owner.map((owner, i) => (
                        <li key={i} className="flex items-center">
                          <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
                          <a 
                            href={`mailto:${owner}`} 
                            className="text-blue-600 hover:underline"
                          >
                            {owner}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <div>
                    <div className="text-sm font-medium text-muted-foreground mb-2">Subject Matter Experts</div>
                    <ul className="space-y-2">
                      {automation.sme.map((expert, i) => (
                        <li key={i} className="flex items-center">
                          <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
                          <a 
                            href={`mailto:${expert}`} 
                            className="text-blue-600 hover:underline"
                          >
                            {expert}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <div>
                    <div className="text-sm font-medium text-muted-foreground mb-2">Functional ASG SPOCs</div>
                    <ul className="space-y-2">
                      {automation.functional_asg_spocs.map((spoc, i) => (
                        <li key={i} className="flex items-center">
                          <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
                          <a 
                            href={`mailto:${spoc}`} 
                            className="text-blue-600 hover:underline"
                          >
                            {spoc}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Technical Contacts</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="text-sm font-medium text-muted-foreground mb-2">Development Contacts</div>
                    <ul className="space-y-2">
                      {automation.dev_contacts.map((contact, i) => (
                        <li key={i} className="flex items-center">
                          <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
                          <a 
                            href={`mailto:${contact}`} 
                            className="text-blue-600 hover:underline"
                          >
                            {contact}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <div>
                    <div className="text-sm font-medium text-muted-foreground mb-2">Design Contacts</div>
                    <ul className="space-y-2">
                      {automation.design_contacts.map((contact, i) => (
                        <li key={i} className="flex items-center">
                          <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
                          <a 
                            href={`mailto:${contact}`} 
                            className="text-blue-600 hover:underline"
                          >
                            {contact}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="links">
            <Card>
              <CardHeader>
                <CardTitle>Documents & Links</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <div>
                      <div className="text-sm font-medium text-muted-foreground mb-2">Design Documents Path</div>
                      <div>
                        {automation.design_documents_path ? (
                          <a 
                            href={automation.design_documents_path} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline flex items-center"
                          >
                            {automation.design_documents_path}
                            <ExternalLink className="h-3 w-3 ml-1" />
                          </a>
                        ) : (
                          "Not available"
                        )}
                      </div>
                    </div>
                    
                    <div>
                      <div className="text-sm font-medium text-muted-foreground mb-2">SME Sign-off URL</div>
                      <div>
                        {automation.sme_sign_off_url ? (
                          <a 
                            href={automation.sme_sign_off_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline flex items-center"
                          >
                            {automation.sme_sign_off_url}
                            <ExternalLink className="h-3 w-3 ml-1" />
                          </a>
                        ) : (
                          "Not available"
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <div className="text-sm font-medium text-muted-foreground mb-2">Code Repository</div>
                      <div>
                        {automation.code_repo_url ? (
                          <div>
                            <a 
                              href={automation.code_repo_url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline flex items-center"
                            >
                              {automation.code_repo_url}
                              <ExternalLink className="h-3 w-3 ml-1" />
                            </a>
                            <div className="mt-1 text-xs text-muted-foreground">
                              Branch: {automation.code_repo_branch || "main"}
                            </div>
                          </div>
                        ) : (
                          "Not available"
                        )}
                      </div>
                    </div>
                    
                    <div>
                      <div className="text-sm font-medium text-muted-foreground mb-2">Process Flow Charts</div>
                      <div className="space-y-2">
                        {automation.camunda_flow_chart_url && (
                          <div>
                            <a 
                              href={automation.camunda_flow_chart_url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline flex items-center"
                            >
                              Camunda Flow Chart
                              <ExternalLink className="h-3 w-3 ml-1" />
                            </a>
                          </div>
                        )}
                        
                        {automation.ace_url && (
                          <div>
                            <a 
                              href={automation.ace_url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline flex items-center"
                            >
                              ACE URL
                              <ExternalLink className="h-3 w-3 ml-1" />
                            </a>
                          </div>
                        )}
                        
                        {!automation.camunda_flow_chart_url && !automation.ace_url && (
                          <div>No flow charts available</div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Automation Not Found</CardTitle>
            <CardDescription>
              The requested automation could not be found.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate('/indusit/automations')}>
              Back to Automations List
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AutomationDetail;
