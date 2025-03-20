import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Sidebar } from "@/components/nav/sidebar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useState } from "react";
import { format } from "date-fns";
import { Loader2, Eye, Download, Check, X } from "lucide-react";
export default function HRApproval() {
    const { user } = useAuth();
    const { toast } = useToast();
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [rejectionReason, setRejectionReason] = useState("");
    const [filter, setFilter] = useState({
        type: "all",
        status: "pending",
    });
    const { data: requests, isLoading } = useQuery({
        queryKey: ["/api/requests", filter],
        enabled: user?.role === "hr" || user?.role === "admin", // Permitindo admin também
    });
    const updateRequest = useMutation({
        mutationFn: async ({ id, status, rejectionReason, }) => {
            const res = await apiRequest("PATCH", `/api/requests/${id}`, {
                status,
                rejectionReason,
            });
            if (!res.ok) {
                const error = await res.text();
                throw new Error(error);
            }
            return await res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/requests"] });
            setSelectedRequest(null);
            setRejectionReason("");
            toast({
                title: "Sucesso",
                description: "Solicitação atualizada com sucesso",
            });
        },
        onError: (error) => {
            toast({
                title: "Erro",
                description: error.message,
                variant: "destructive",
            });
        },
    });
    if (!user || (user.role !== "hr" && user.role !== "admin")) {
        return (<div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-2">Acesso Negado</h1>
          <p className="text-muted-foreground">
            Esta página é restrita apenas para RH e Administradores.
          </p>
        </div>
      </div>);
    }
    return (<div className="flex h-screen bg-background">
      <Sidebar />
      <div className="flex-1 overflow-auto p-8">
        <h1 className="text-3xl font-bold mb-8">Painel de Aprovações RH</h1>

        <div className="flex gap-4 mb-6">
          <div className="w-48">
            <Label>Tipo</Label>
            <Select value={filter.type} onValueChange={(value) => setFilter({ ...filter, type: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Tipo de Solicitação"/>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="vacation">Férias</SelectItem>
                <SelectItem value="medical">Atestado Médico</SelectItem>
                <SelectItem value="license">Licença</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="w-48">
            <Label>Status</Label>
            <Select value={filter.status} onValueChange={(value) => setFilter({ ...filter, status: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Status"/>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pendentes</SelectItem>
                <SelectItem value="approved">Aprovados</SelectItem>
                <SelectItem value="rejected">Rejeitados</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {isLoading ? (<div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary"/>
          </div>) : (<div className="space-y-4">
            {requests && requests.length > 0 ? (requests.map((request) => (<Card key={request.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle>
                          {request.type === "vacation"
                    ? "Solicitação de Férias"
                    : request.type === "medical"
                        ? "Atestado Médico"
                        : "Licença"}
                        </CardTitle>
                        <CardDescription>
                          {request.userName} - {format(new Date(request.createdAt), "PP")}
                        </CardDescription>
                      </div>
                      <div className={`px-3 py-1 rounded-full text-sm font-medium ${request.status === "pending"
                    ? "bg-yellow-100 text-yellow-800"
                    : request.status === "approved"
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"}`}>
                        {request.status === "pending"
                    ? "Pendente"
                    : request.status === "approved"
                        ? "Aprovado"
                        : "Rejeitado"}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <Label>Período</Label>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(request.startDate), "PP")} -{" "}
                          {request.endDate && format(new Date(request.endDate), "PP")}
                        </p>
                      </div>

                      <div>
                        <Label>Motivo</Label>
                        <p className="text-sm text-muted-foreground">
                          {request.reason}
                        </p>
                      </div>

                      {request.documentUrl && (<div className="flex gap-2">
                          <Button variant="outline" size="sm" onClick={() => window.open(request.documentUrl, "_blank")}>
                            <Eye className="h-4 w-4 mr-2"/>
                            Visualizar Documento
                          </Button>
                          <Button variant="outline" size="sm" asChild>
                            <a href={request.documentUrl} download>
                              <Download className="h-4 w-4 mr-2"/>
                              Download
                            </a>
                          </Button>
                        </div>)}

                      {request.status === "pending" && (<div className="flex gap-2 mt-4">
                          <Button onClick={() => updateRequest.mutate({
                        id: request.id,
                        status: "approved",
                    })} className="bg-green-600 hover:bg-green-700">
                            <Check className="h-4 w-4 mr-2"/>
                            Aprovar
                          </Button>
                          <Dialog open={selectedRequest?.id === request.id} onOpenChange={(open) => setSelectedRequest(open ? request : null)}>
                            <DialogTrigger asChild>
                              <Button variant="destructive">
                                <X className="h-4 w-4 mr-2"/>
                                Rejeitar
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Rejeitar Solicitação</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div className="space-y-2">
                                  <Label>Motivo da Rejeição</Label>
                                  <Textarea value={rejectionReason} onChange={(e) => setRejectionReason(e.target.value)} placeholder="Por favor, forneça um motivo para a rejeição"/>
                                </div>
                                <Button onClick={() => updateRequest.mutate({
                        id: request.id,
                        status: "rejected",
                        rejectionReason,
                    })} disabled={!rejectionReason} className="w-full">
                                  Confirmar Rejeição
                                </Button>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </div>)}
                    </div>
                  </CardContent>
                </Card>))) : (<div className="text-center p-8">
                <p className="text-muted-foreground">Nenhuma solicitação encontrada com os filtros selecionados.</p>
              </div>)}
          </div>)}
      </div>
    </div>);
}
//# sourceMappingURL=hr-approval.jsx.map