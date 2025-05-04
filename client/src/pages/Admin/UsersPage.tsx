
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { PlusCircle, UserCheck, Clock, XCircle } from "lucide-react";
import { fetchUsers, fetchSystemStats, fetchRoleRequests, updateUserRole, approveRoleRequest } from "@/lib/api";

export function UsersPage() {
  const [activeTab, setActiveTab] = useState("users");
  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false);
  const [isApproveDialogOpen, setIsApproveDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [newRole, setNewRole] = useState("");
  const [approvalStatus, setApprovalStatus] = useState("approved");
  const [notes, setNotes] = useState("");

  const { data: users, refetch: refetchUsers } = useQuery({
    queryKey: ["users"],
    queryFn: fetchUsers
  });

  const { data: systemStats, refetch: refetchStats } = useQuery({
    queryKey: ["systemStats"],
    queryFn: fetchSystemStats
  });

  const { data: roleRequests, refetch: refetchRequests } = useQuery({
    queryKey: ["roleRequests"],
    queryFn: () => fetchRoleRequests()
  });

  const updateRoleMutation = useMutation({
    mutationFn: updateUserRole,
    onSuccess: () => {
      toast.success("User role updated successfully");
      refetchUsers();
      refetchStats();
      setIsUpdateDialogOpen(false);
    },
    onError: (error: any) => {
      toast.error(`Failed to update role: ${error.message}`);
    }
  });

  const approveRequestMutation = useMutation({
    mutationFn: approveRoleRequest,
    onSuccess: () => {
      toast.success(`Request ${approvalStatus === "approved" ? "approved" : "rejected"} successfully`);
      refetchRequests();
      refetchUsers();
      refetchStats();
      setIsApproveDialogOpen(false);
    },
    onError: (error: any) => {
      toast.error(`Failed to process request: ${error.message}`);
    }
  });

  const handleUpdateRole = () => {
    if (!selectedUser || !newRole) {
      toast.error("Please select a user and a role");
      return;
    }

    updateRoleMutation.mutate({
      userId: selectedUser.id,
      role: newRole
    });
  };

  const handleApproveRequest = () => {
    if (!selectedRequest) return;

    approveRequestMutation.mutate({
      requestId: selectedRequest.id,
      status: approvalStatus,
      notes: notes
    });
  };

  const openUpdateDialog = (user: any) => {
    setSelectedUser(user);
    setNewRole(user.role || "user");
    setIsUpdateDialogOpen(true);
  };

  const openApproveDialog = (request: any) => {
    setSelectedRequest(request);
    setApprovalStatus("approved");
    setNotes("");
    setIsApproveDialogOpen(true);
  };

  return (
    <div className="container py-6 space-y-6">
      <h1 className="text-3xl font-bold">User Administration</h1>

      {systemStats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{systemStats.total_users}</div>
              <p className="text-sm text-muted-foreground">Total Users</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{systemStats.active_users}</div>
              <p className="text-sm text-muted-foreground">Active Users</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{systemStats.pending_requests}</div>
              <p className="text-sm text-muted-foreground">Pending Requests</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 space-y-2">
              {systemStats.users_by_role?.map((role: any) => (
                <div key={role.role} className="flex justify-between">
                  <span className="text-sm">{role.role}:</span>
                  <span className="font-bold">{role.count}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="requests">
            Role Requests
            {systemStats?.pending_requests > 0 && (
              <Badge variant="destructive" className="ml-2">
                {systemStats.pending_requests}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="users" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>All Users</CardTitle>
              <CardDescription>Manage user roles and permissions</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Last Login</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users?.map((user: any) => (
                    <TableRow key={user.id}>
                      <TableCell>{user.name}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <Badge variant={user.role === "appadmin" ? "default" : "outline"}>
                          {user.role}
                        </Badge>
                      </TableCell>
                      <TableCell>{user.last_login || "Never"}</TableCell>
                      <TableCell>
                        {user.is_active ? (
                          <Badge variant="success">Active</Badge>
                        ) : (
                          <Badge variant="secondary">Inactive</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openUpdateDialog(user)}
                        >
                          Update Role
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="requests" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Role Requests</CardTitle>
              <CardDescription>Review and approve role requests</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Requested Role</TableHead>
                    <TableHead>Request Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {roleRequests?.map((request: any) => (
                    <TableRow key={request.id}>
                      <TableCell>{request.user_name}</TableCell>
                      <TableCell>{request.user_email}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {request.requested_role}
                        </Badge>
                      </TableCell>
                      <TableCell>{request.request_date}</TableCell>
                      <TableCell>
                        {request.status === "pending" && (
                          <Badge variant="warning" className="flex items-center gap-1">
                            <Clock className="w-3 h-3" /> Pending
                          </Badge>
                        )}
                        {request.status === "approved" && (
                          <Badge variant="success" className="flex items-center gap-1">
                            <UserCheck className="w-3 h-3" /> Approved
                          </Badge>
                        )}
                        {request.status === "rejected" && (
                          <Badge variant="destructive" className="flex items-center gap-1">
                            <XCircle className="w-3 h-3" /> Rejected
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {request.status === "pending" && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openApproveDialog(request)}
                          >
                            Review
                          </Button>
                        )}
                        {request.status !== "pending" && (
                          <div className="text-sm text-muted-foreground">
                            {request.status === "approved" ? "Approved by" : "Rejected by"}: {request.approved_by_name}
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                  {roleRequests?.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">
                        No role requests found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Update Role Dialog */}
      <Dialog open={isUpdateDialogOpen} onOpenChange={setIsUpdateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update User Role</DialogTitle>
            <DialogDescription>
              Change the role for {selectedUser?.name}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <h4 className="font-semibold">Current Role</h4>
              <Badge variant="outline">{selectedUser?.role}</Badge>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-semibold">New Role</h4>
              <Select value={newRole} onValueChange={setNewRole}>
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="SDuser">SD User</SelectItem>
                  <SelectItem value="SDadmin">SD Admin</SelectItem>
                  <SelectItem value="IDuser">ID User</SelectItem>
                  <SelectItem value="IDadmin">ID Admin</SelectItem>
                  <SelectItem value="appadmin">App Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsUpdateDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleUpdateRole}
              disabled={updateRoleMutation.isPending}
            >
              {updateRoleMutation.isPending ? "Updating..." : "Update Role"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Approve Request Dialog */}
      <Dialog open={isApproveDialogOpen} onOpenChange={setIsApproveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Review Role Request</DialogTitle>
            <DialogDescription>
              {selectedRequest?.user_name} is requesting access to the {selectedRequest?.requested_role} role
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <h4 className="font-semibold">Approve or Reject</h4>
              <Select value={approvalStatus} onValueChange={setApprovalStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Select decision" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="approved">Approve</SelectItem>
                  <SelectItem value="rejected">Reject</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-semibold">Notes (optional)</h4>
              <Textarea 
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any comments about this decision"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsApproveDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleApproveRequest} 
              disabled={approveRequestMutation.isPending}
              variant={approvalStatus === "approved" ? "default" : "destructive"}
            >
              {approveRequestMutation.isPending ? "Processing..." : (
                approvalStatus === "approved" ? "Approve Request" : "Reject Request"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default UsersPage;
