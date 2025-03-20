import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Sidebar } from "@/components/nav/sidebar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Loader2 } from "lucide-react";
export default function UserManagement() {
    const { user } = useAuth();
    const { toast } = useToast();
    const { data: users, isLoading } = useQuery({
        queryKey: ["/api/users"],
    });
    const updateUserMutation = useMutation({
        mutationFn: async ({ userId, updates }) => {
            const res = await apiRequest("PATCH", `/api/users/${userId}`, updates);
            if (!res.ok) {
                const error = await res.text();
                throw new Error(error);
            }
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/users"] });
            toast({
                title: "Success",
                description: "User updated successfully",
            });
        },
        onError: (error) => {
            toast({
                title: "Error",
                description: error.message,
                variant: "destructive",
            });
        },
    });
    if (!user || user.role !== "admin") {
        return (<div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-2">Access Denied</h1>
          <p className="text-muted-foreground">
            Only administrators can access the user management system.
          </p>
        </div>
      </div>);
    }
    if (isLoading) {
        return (<div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin"/>
      </div>);
    }
    return (<div className="flex h-screen bg-background">
      <Sidebar />
      <div className="flex-1 overflow-auto p-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">User Management</h1>
        </div>

        <div className="space-y-4">
          {users?.map((user) => (<div key={user.id} className="p-4 border rounded-lg bg-card">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-medium">{user.username}</h3>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                </div>
                <div className="flex gap-4">
                  <Select defaultValue={user.status || "pending"} onValueChange={(value) => updateUserMutation.mutate({
                userId: user.id,
                updates: { status: value },
            })}>
                    <SelectTrigger className="w-[140px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select defaultValue={user.role} onValueChange={(value) => updateUserMutation.mutate({
                userId: user.id,
                updates: { role: value },
            })}>
                    <SelectTrigger className="w-[140px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user">User</SelectItem>
                      <SelectItem value="hr">HR</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>))}
        </div>
      </div>
    </div>);
}
//# sourceMappingURL=user-management.jsx.map