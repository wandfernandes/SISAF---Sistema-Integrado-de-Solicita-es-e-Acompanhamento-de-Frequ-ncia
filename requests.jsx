import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Sidebar } from "@/components/nav/sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { insertRequestSchema } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { Loader2 } from "lucide-react";
export default function Requests() {
    const { user } = useAuth();
    const { toast } = useToast();
    const [open, setOpen] = useState(false);
    const { data: requests, isLoading: isLoadingRequests } = useQuery({
        queryKey: ["/api/requests"],
    });
    const form = useForm({
        resolver: zodResolver(insertRequestSchema),
        defaultValues: {
            type: "medical",
            startDate: "",
            endDate: "",
            reason: "",
            documentUrl: "",
        },
    });
    const createRequest = useMutation({
        mutationFn: async (data) => {
            const res = await apiRequest("POST", "/api/requests", data);
            if (!res.ok) {
                const error = await res.text();
                throw new Error(error);
            }
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/requests"] });
            setOpen(false);
            form.reset();
            toast({
                title: "Success",
                description: "Request submitted successfully",
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
    if (isLoadingRequests) {
        return (<div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin"/>
      </div>);
    }
    return (<div className="flex h-screen bg-background">
      <Sidebar />
      <div className="flex-1 overflow-auto p-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Leave Requests</h1>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>New Request</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Request</DialogTitle>
              </DialogHeader>
              <form onSubmit={form.handleSubmit((data) => createRequest.mutate(data))} className="space-y-4">
                <div className="space-y-2">
                  <label>Type</label>
                  <Select name="type" onValueChange={(value) => form.setValue("type", value)} defaultValue="medical">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="medical">Medical</SelectItem>
                      <SelectItem value="vacation">Vacation</SelectItem>
                      <SelectItem value="license">License</SelectItem>
                    </SelectContent>
                  </Select>
                  {form.formState.errors.type && (<p className="text-sm text-red-500">
                      {form.formState.errors.type.message}
                    </p>)}
                </div>
                <div className="space-y-2">
                  <label>Start Date</label>
                  <Input type="date" {...form.register("startDate")}/>
                  {form.formState.errors.startDate && (<p className="text-sm text-red-500">
                      {form.formState.errors.startDate.message}
                    </p>)}
                </div>
                <div className="space-y-2">
                  <label>End Date</label>
                  <Input type="date" {...form.register("endDate")}/>
                  {form.formState.errors.endDate && (<p className="text-sm text-red-500">
                      {form.formState.errors.endDate.message}
                    </p>)}
                </div>
                <div className="space-y-2">
                  <label>Reason</label>
                  <Textarea {...form.register("reason")}/>
                  {form.formState.errors.reason && (<p className="text-sm text-red-500">
                      {form.formState.errors.reason.message}
                    </p>)}
                </div>
                <div className="space-y-2">
                  <label>Document URL (optional)</label>
                  <Input {...form.register("documentUrl")}/>
                  {form.formState.errors.documentUrl && (<p className="text-sm text-red-500">
                      {form.formState.errors.documentUrl.message}
                    </p>)}
                </div>
                <Button type="submit" className="w-full" disabled={createRequest.isPending}>
                  {createRequest.isPending ? (<Loader2 className="h-4 w-4 animate-spin mr-2"/>) : null}
                  Submit Request
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="space-y-4">
          {requests?.map((request) => (<div key={request.id} className="p-4 border rounded-lg bg-card flex items-center justify-between">
              <div>
                <div className="font-medium">{request.type}</div>
                <div className="text-sm text-muted-foreground">
                  {format(new Date(request.startDate), "PP")} -{" "}
                  {format(new Date(request.endDate), "PP")}
                </div>
                <div className="text-sm mt-1">{request.reason}</div>
              </div>
              <div className={`px-3 py-1 rounded-full text-sm ${request.status === "approved"
                ? "bg-green-100 text-green-800"
                : request.status === "rejected"
                    ? "bg-red-100 text-red-800"
                    : "bg-yellow-100 text-yellow-800"}`}>
                {request.status}
              </div>
            </div>))}
        </div>
      </div>
    </div>);
}
//# sourceMappingURL=requests.jsx.map