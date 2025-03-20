import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Sidebar } from "@/components/nav/sidebar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { format } from "date-fns";
import { Loader2, CheckCircle2, XCircle, Calendar } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
export default function ApprovalsPage() {
    const { user } = useAuth();
    const { toast } = useToast();
    const [rejectionReason, setRejectionReason] = useState("");
    const [selectedLeave, setSelectedLeave] = useState(null);
    const [selectedVacation, setSelectedVacation] = useState(null);
    const [seiNumber, setSeiNumber] = useState("");
    const [isApprovalDialogOpen, setIsApprovalDialogOpen] = useState(false);
    const [isRejectionDialogOpen, setIsRejectionDialogOpen] = useState(false);
    const { data: medicalLeaves, isLoading: isLoadingLeaves } = useQuery({
        queryKey: ["/api/medical-leaves/pending"],
        enabled: user?.role === "admin" || user?.role === "hr",
    });
    const { data: vacationPeriods, isLoading: isLoadingVacations } = useQuery({
        queryKey: ["/api/vacation-periods/pending"],
        enabled: user?.role === "admin" || user?.role === "hr",
    });
    const updateMedicalLeaveStatus = useMutation({
        mutationFn: async ({ id, status, rejectionReason, seiNumber, }) => {
            const response = await apiRequest("PATCH", `/api/medical-leaves/${id}`, {
                status,
                rejectionReason,
                seiNumber,
                reviewedAt: new Date().toISOString(),
            });
            if (!response.ok) {
                const error = await response.text();
                throw new Error(error);
            }
            return response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/medical-leaves/pending"] });
            setSelectedLeave(null);
            setRejectionReason("");
            setSeiNumber("");
            setIsApprovalDialogOpen(false);
            setIsRejectionDialogOpen(false);
            toast({
                title: "Sucesso",
                description: "Status do atestado atualizado com sucesso",
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
    const updateVacationStatus = useMutation({
        mutationFn: async ({ id, status, rejectionReason, seiNumber, }) => {
            const response = await apiRequest("PATCH", `/api/vacation-periods/${id}`, {
                status,
                rejectionReason,
                seiNumber,
                reviewedAt: new Date().toISOString(),
                reviewedBy: user?.id,
            });
            if (!response.ok) {
                const error = await response.text();
                throw new Error(error);
            }
            return response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/vacation-periods/pending"] });
            setSelectedVacation(null);
            setRejectionReason("");
            setSeiNumber("");
            setIsApprovalDialogOpen(false);
            setIsRejectionDialogOpen(false);
            toast({
                title: "Sucesso",
                description: "Status da solicitação de férias atualizado com sucesso",
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
    if (!user || (user.role !== "admin" && user.role !== "hr")) {
        return (<div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-2">Acesso Negado</h1>
          <p className="text-muted-foreground">
            Apenas administradores e RH podem acessar esta página.
          </p>
        </div>
      </div>);
    }
    if (isLoadingLeaves || isLoadingVacations) {
        return (<div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin"/>
      </div>);
    }
    return (<div className="flex h-screen bg-background">
      <Sidebar />
      <div className="flex-1 overflow-auto p-8">
        <h1 className="text-3xl font-bold mb-8">Aprovações</h1>

        <Tabs defaultValue="medical" className="space-y-6">
          <TabsList>
            <TabsTrigger value="medical">
              Atestados Médicos ({medicalLeaves?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="vacation">
              Férias ({vacationPeriods?.length || 0})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="medical" className="space-y-4">
            {medicalLeaves?.map((leave) => (<Card key={leave.id}>
                <CardHeader className="pb-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="font-medium text-lg">
                        {leave.userName || "Nome não disponível"}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {leave.userWorkUnit || "Unidade não disponível"}
                      </p>
                    </div>
                    <div className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm">
                      Pendente
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p><strong>Data de Emissão:</strong> {format(new Date(leave.issueDate), "dd/MM/yyyy")}</p>
                        <p><strong>Duração:</strong> {leave.leaveDuration} {leave.leaveType === 'days' ? 'dias' : 'horas'}</p>
                      </div>
                      {leave.isCompanion && (<div>
                          <p><strong>Acompanhado:</strong> {leave.companionName}</p>
                          <p><strong>Parentesco:</strong> {leave.companionRelationship}</p>
                        </div>)}
                    </div>

                    <div className="flex gap-2">
                      <Button onClick={() => {
                setSelectedLeave(leave);
                setIsApprovalDialogOpen(true);
            }}>
                        <CheckCircle2 className="h-4 w-4 mr-2"/>
                        Aprovar
                      </Button>
                      <Button variant="destructive" onClick={() => {
                setSelectedLeave(leave);
                setIsRejectionDialogOpen(true);
            }}>
                        <XCircle className="h-4 w-4 mr-2"/>
                        Reprovar
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>))}
          </TabsContent>

          <TabsContent value="vacation" className="space-y-4">
            {vacationPeriods?.map((vacation) => (<Card key={vacation.id}>
                <CardHeader className="pb-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="font-medium text-lg">
                        Férias - {vacation.acquisitionPeriod}
                      </CardTitle>
                      <div className="flex items-center gap-2 mt-1">
                        <Calendar className="h-4 w-4 text-muted-foreground"/>
                        <span className="text-sm text-muted-foreground">
                          {format(new Date(vacation.startDate), "dd/MM/yyyy")} até{" "}
                          {format(new Date(vacation.endDate), "dd/MM/yyyy")}
                        </span>
                      </div>
                    </div>
                    <div className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm">
                      Pendente
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <p><strong>Total de dias:</strong> {vacation.totalDays}</p>
                      <p><strong>Data de retorno:</strong> {format(new Date(vacation.returnDate), "dd/MM/yyyy")}</p>
                      {vacation.observation && (<p><strong>Observação:</strong> {vacation.observation}</p>)}
                    </div>

                    <div className="flex gap-2">
                      <Button onClick={() => {
                setSelectedVacation(vacation);
                setIsApprovalDialogOpen(true);
            }}>
                        <CheckCircle2 className="h-4 w-4 mr-2"/>
                        Aprovar
                      </Button>
                      <Button variant="destructive" onClick={() => {
                setSelectedVacation(vacation);
                setIsRejectionDialogOpen(true);
            }}>
                        <XCircle className="h-4 w-4 mr-2"/>
                        Reprovar
                      </Button>

                      {/* Novas opções para marcar férias como gozadas ou vencidas */}
                      <div className="flex ml-2">
                        <Button variant="outline" size="sm" onClick={async () => {
                try {
                    await apiRequest("PATCH", `/api/vacation-periods/${vacation.id}/mark-taken`, {});
                    queryClient.invalidateQueries({ queryKey: ["/api/vacation-periods/pending"] });
                    toast({
                        title: "Sucesso",
                        description: "Férias marcadas como gozadas",
                    });
                }
                catch (error) {
                    toast({
                        title: "Erro",
                        description: "Erro ao marcar férias como gozadas",
                        variant: "destructive",
                    });
                }
            }}>
                          Marcar como Gozadas
                        </Button>
                        <Button variant="outline" size="sm" className="ml-2 text-amber-600 border-amber-600 hover:bg-amber-50" onClick={async () => {
                try {
                    await apiRequest("PATCH", `/api/vacation-periods/${vacation.id}/mark-expired`, {});
                    queryClient.invalidateQueries({ queryKey: ["/api/vacation-periods/pending"] });
                    toast({
                        title: "Sucesso",
                        description: "Férias marcadas como vencidas",
                    });
                }
                catch (error) {
                    toast({
                        title: "Erro",
                        description: "Erro ao marcar férias como vencidas",
                        variant: "destructive",
                    });
                }
            }}>
                          Marcar como Vencidas
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>))}
          </TabsContent>
        </Tabs>

        <Dialog open={isApprovalDialogOpen} onOpenChange={setIsApprovalDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {selectedLeave ? "Aprovar Atestado" : "Aprovar Férias"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Número do SEI</Label>
                <Input value={seiNumber} onChange={(e) => setSeiNumber(e.target.value)} placeholder="Digite o número do processo SEI"/>
              </div>
              <Button className="w-full" disabled={!seiNumber} onClick={() => {
            if (selectedLeave) {
                updateMedicalLeaveStatus.mutate({
                    id: selectedLeave.id,
                    status: "approved",
                    seiNumber,
                });
            }
            else if (selectedVacation) {
                updateVacationStatus.mutate({
                    id: selectedVacation.id,
                    status: "approved",
                    seiNumber,
                });
            }
        }}>
                Confirmar Aprovação
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={isRejectionDialogOpen} onOpenChange={setIsRejectionDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {selectedLeave ? "Reprovar Atestado" : "Reprovar Férias"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Motivo da Reprovação</Label>
                <Textarea value={rejectionReason} onChange={(e) => setRejectionReason(e.target.value)} placeholder="Digite o motivo da reprovação"/>
              </div>
              <Button variant="destructive" className="w-full" disabled={!rejectionReason} onClick={() => {
            if (selectedLeave) {
                updateMedicalLeaveStatus.mutate({
                    id: selectedLeave.id,
                    status: "rejected",
                    rejectionReason,
                });
            }
            else if (selectedVacation) {
                updateVacationStatus.mutate({
                    id: selectedVacation.id,
                    status: "rejected",
                    rejectionReason,
                });
            }
        }}>
                Confirmar Reprovação
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>);
}
//# sourceMappingURL=approvals.jsx.map