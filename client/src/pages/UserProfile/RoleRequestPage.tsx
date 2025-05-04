
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Clock, CheckCircle, XCircle, ShieldAlert, ShieldCheck } from "lucide-react";
import { fetchUserRoleRequests, requestRole, fetchCurrentUser } from "@/lib/api";

export function RoleRequestPage() {
  const [selectedRole, setSelectedRole] = useState("");
  const [notes, setNotes] = useState("");

  const { data: currentUser } = useQuery({
    queryKey: ["me"],
    queryFn: fetchCurrentUser
  });

  const { data: roleRequests, refetch } = useQuery({
    queryKey: ["userRoleRequests"],
    queryFn: fetchUserRoleRequests
  });

  const requestRoleMutation = useMutation({
    mutationFn: requestRole,
    onSuccess: () => {
      toast.success("Role request submitted successfully");
      setSelectedRole("");
      setNotes("");
      refetch();
    },
    onError: (error: any) => {
      toast.error(`Failed to submit request: ${error.message}`);
    }
  });

  const handleSubmitRequest = () => {
    if (!selectedRole) {
      toast.error("Please select a role");
      return;
    }

    requestRoleMutation.mutate({
      role: selectedRole,
      notes: notes
    });
  };

  // Function to check if the user can request a specific role
  const canRequestRole = (role: string) => {
    // Don't allow requesting current role
    if (currentUser?.role === role) return false;
    
    // Check if there's already a pending request for this role
    const hasPendingRequest = roleRequests?.some(
      (req: any) => req.requested_role === role && req.status === "pending"
    );
    
    return !hasPendingRequest;
  };

  return (
    <div className="container py-6 space-y-8">
      <h1 className="text-3xl font-bold">Role Requests</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Request Dashboard Access</CardTitle>
              <CardDescription>
                Request access to different dashboard roles
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h3 className="text-sm font-medium">Your Current Role</h3>
                <Badge className="text-sm" variant="outline">
                  {currentUser?.role || "Loading..."}
                </Badge>
              </div>
              
              <div className="space-y-2">
                <h3 className="text-sm font-medium">Request New Role</h3>
                <Select value={selectedRole} onValueChange={setSelectedRole}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a role to request" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SDuser" disabled={!canRequestRole("SDuser")}>
                      Service Dashboard User
                    </SelectItem>
                    <SelectItem value="SDadmin" disabled={!canRequestRole("SDadmin")}>
                      Service Dashboard Admin
                    </SelectItem>
                    <SelectItem value="IDuser" disabled={!canRequestRole("IDuser")}>
                      IndusIT Dashboard User
                    </SelectItem>
                    <SelectItem value="IDadmin" disabled={!canRequestRole("IDadmin")}>
                      IndusIT Dashboard Admin
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <h3 className="text-sm font-medium">Notes (Optional)</h3>
                <Textarea 
                  placeholder="Explain why you need access to this role"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                onClick={handleSubmitRequest}
                disabled={!selectedRole || requestRoleMutation.isPending}
                className="w-full"
              >
                {requestRoleMutation.isPending ? "Submitting..." : "Submit Request"}
              </Button>
            </CardFooter>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle>Your Role Requests</CardTitle>
              <CardDescription>
                View the status of your access requests
              </CardDescription>
            </CardHeader>
            <CardContent>
              {roleRequests?.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  You haven't made any role requests yet
                </div>
              ) : (
                <div className="space-y-4">
                  {roleRequests?.map((request: any) => (
                    <Card key={request.id} className="overflow-hidden">
                      <div className={`p-4 ${
                        request.status === 'pending' ? 'bg-yellow-50 border-l-4 border-yellow-400' :
                        request.status === 'approved' ? 'bg-green-50 border-l-4 border-green-400' :
                        'bg-red-50 border-l-4 border-red-400'
                      }`}>
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-medium">
                              {request.requested_role}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              Requested on {request.request_date}
                            </p>
                          </div>
                          <div>
                            {request.status === "pending" && (
                              <Badge variant="warning" className="flex items-center gap-1">
                                <Clock className="w-3 h-3" /> Pending
                              </Badge>
                            )}
                            {request.status === "approved" && (
                              <Badge variant="success" className="flex items-center gap-1">
                                <CheckCircle className="w-3 h-3" /> Approved
                              </Badge>
                            )}
                            {request.status === "rejected" && (
                              <Badge variant="destructive" className="flex items-center gap-1">
                                <XCircle className="w-3 h-3" /> Rejected
                              </Badge>
                            )}
                          </div>
                        </div>
                        {request.notes && (
                          <div className="mt-2 text-sm">
                            <strong>Notes:</strong> {request.notes}
                          </div>
                        )}
                        {(request.status === "approved" || request.status === "rejected") && (
                          <div className="mt-2 text-xs text-muted-foreground">
                            {request.approved_by_name && `Processed by ${request.approved_by_name} on ${request.approval_date}`}
                          </div>
                        )}
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-amber-500" />
            Role Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <ShieldCheck className="h-4 w-4" />
            <AlertTitle>Dashboard Access Roles</AlertTitle>
            <AlertDescription className="space-y-2">
              <div>
                <strong>Service Dashboard User (SDuser):</strong> Can view service dashboard metrics and reports
              </div>
              <div>
                <strong>Service Dashboard Admin (SDadmin):</strong> Can manage metrics and create reports
              </div>
              <div>
                <strong>IndusIT Dashboard User (IDuser):</strong> Can view automation data and related information
              </div>
              <div>
                <strong>IndusIT Dashboard Admin (IDadmin):</strong> Can manage automation data and infrastructure
              </div>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
}

export default RoleRequestPage;
