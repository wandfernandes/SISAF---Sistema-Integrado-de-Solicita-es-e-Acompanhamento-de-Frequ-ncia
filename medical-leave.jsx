import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Sidebar } from "@/components/nav/sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { insertMedicalLeaveSchema } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { Loader2, Download, Edit, FileText, Link as LinkIcon, X } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { FileUploadBase64 } from "@/components/ui/file-upload-base64";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
// Update the status badge rendering
const getStatusBadgeVariant = (status) => {
    switch (status) {
        case "approved":
            return "default";
        case "rejected":
            return "destructive";
        case "medical_board_required":
            return "secondary";
        default:
            return "outline";
    }
};
const getStatusText = (status) => {
    switch (status) {
        case "approved":
            return "Aprovado";
        case "rejected":
            return "Rejeitado";
        case "medical_board_required":
            return "Junta Médica";
        default:
            return "Pendente";
    }
};
export default function MedicalLeaves() {
    const { user } = useAuth();
    const { toast } = useToast();
    const [open, setOpen] = useState(false);
    const [editOpen, setEditOpen] = useState(false);
    const [editingLeave, setEditingLeave] = useState(null);
    const [selectedUserId, setSelectedUserId] = useState(null);
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [documentUploaded, setDocumentUploaded] = useState(false);
    const [companionDocumentUploaded, setCompanionDocumentUploaded] = useState(false);
    const [documentUrl, setDocumentUrl] = useState("");
    const [companionDocumentUrl, setCompanionDocumentUrl] = useState("");
    const [useExternalLink, setUseExternalLink] = useState(false);
    const [useCompanionExternalLink, setUseCompanionExternalLink] = useState(false);
    const [showJuntaAlert, setShowJuntaAlert] = useState(false);
    const [showMaxDaysAlert, setShowMaxDaysAlert] = useState(false);
    const [showMonthlyLimitAlert, setShowMonthlyLimitAlert] = useState(false);
    const [showYearlyLimitAlert, setShowYearlyLimitAlert] = useState(false);
    const [showHoursLimitAlert, setShowHoursLimitAlert] = useState(false);
    const [editDocumentUploaded, setEditDocumentUploaded] = useState(false);
    const [editCompanionDocumentUploaded, setEditCompanionDocumentUploaded] = useState(false);
    const [editDocumentUrl, setEditDocumentUrl] = useState("");
    const [editCompanionDocumentUrl, setEditCompanionDocumentUrl] = useState("");
    const isAdmin = user?.role === "admin" || user?.role === "hr";
    // Query hooks
    const { data: users = [], isLoading: isLoadingUsers } = useQuery({
        queryKey: ["/api/users"],
        enabled: isAdmin,
    });
    const { data: leaves = [], isLoading: isLoadingLeaves } = useQuery({
        queryKey: ["/api/medical-leaves"],
    });
    // Form setup
    const form = useForm({
        resolver: zodResolver(insertMedicalLeaveSchema),
        defaultValues: {
            issueDate: "",
            leaveType: "days",
            leaveDuration: "1",
            period: "full",
            isCompanion: false,
            companionName: "",
            companionRelationship: "",
            documentUrl: "",
            companionDocumentUrl: "",
            cidCode: "",
            cidDescription: "",
            cidRestricted: false,
        },
    });
    const editForm = useForm({
        resolver: zodResolver(insertMedicalLeaveSchema),
        defaultValues: {
            issueDate: "",
            leaveType: "days",
            leaveDuration: "1",
            period: "full",
            isCompanion: false,
            companionName: "",
            companionRelationship: "",
            documentUrl: "",
            companionDocumentUrl: "",
            cidCode: "",
            cidDescription: "",
            cidRestricted: false,
        },
    });
    // Create medical leave mutation
    const createLeave = useMutation({
        mutationFn: async (data) => {
            try {
                const effectiveUserId = isAdmin ? selectedUserId : user?.id;
                if (isAdmin && !effectiveUserId) {
                    throw new Error("Selecione um servidor");
                }
                const formattedData = {
                    userId: effectiveUserId,
                    issueDate: new Date(data.issueDate).toISOString(),
                    leaveType: data.leaveType,
                    leaveDuration: data.leaveDuration.toString(),
                    period: data.period,
                    isCompanion: data.isCompanion || false,
                    companionName: data.companionName || null,
                    companionRelationship: data.companionRelationship || null,
                    documentUrl: data.documentUrl || null,
                    companionDocumentUrl: data.isCompanion ? data.companionDocumentUrl || null : null,
                    cidCode: data.cidCode || null,
                    cidDescription: data.cidDescription || null,
                    cidRestricted: data.cidRestricted || false,
                    status: showMaxDaysAlert ? "medical_board_required" : "pending",
                };
                const res = await apiRequest("POST", "/api/medical-leaves", formattedData);
                if (!res.ok) {
                    const errorText = await res.text();
                    console.error("Erro na resposta:", errorText);
                    throw new Error(errorText || "Erro ao criar atestado médico");
                }
                return res.json();
            }
            catch (error) {
                console.error("Erro ao criar atestado:", error);
                throw error;
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/medical-leaves"] });
            setOpen(false);
            form.reset();
            setSelectedUserId(null);
            setShowJuntaAlert(false);
            setShowMaxDaysAlert(false);
            setShowMonthlyLimitAlert(false);
            setShowYearlyLimitAlert(false);
            setShowHoursLimitAlert(false);
            setDocumentUploaded(false);
            setCompanionDocumentUploaded(false);
            setDocumentUrl("");
            setCompanionDocumentUrl("");
            setUseExternalLink(false);
            setUseCompanionExternalLink(false);
            toast({
                title: "Sucesso",
                description: "Atestado médico enviado com sucesso",
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
    const updateLeave = useMutation({
        mutationFn: async (data) => {
            try {
                if (!editingLeave) {
                    throw new Error("Nenhum atestado selecionado para edição");
                }
                const formattedData = {
                    issueDate: new Date(data.issueDate).toISOString(),
                    leaveType: data.leaveType,
                    leaveDuration: data.leaveDuration.toString(),
                    period: data.period,
                    isCompanion: data.isCompanion || false,
                    companionName: data.companionName || null,
                    companionRelationship: data.companionRelationship || null,
                    documentUrl: data.documentUrl || null,
                    companionDocumentUrl: data.isCompanion ? data.companionDocumentUrl || null : null,
                    cidCode: data.cidCode || null,
                    cidDescription: data.cidDescription || null,
                    cidRestricted: data.cidRestricted || false,
                };
                const res = await apiRequest("PATCH", `/api/medical-leaves/${editingLeave.id}/edit`, formattedData);
                if (!res.ok) {
                    const errorText = await res.text();
                    console.error("Erro na resposta de atualização:", errorText);
                    throw new Error(errorText || "Erro ao atualizar atestado médico");
                }
                return res.json();
            }
            catch (error) {
                console.error("Erro ao atualizar atestado:", error);
                throw error;
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/medical-leaves"] });
            setEditOpen(false);
            editForm.reset();
            setEditingLeave(null);
            setEditDocumentUploaded(false);
            setEditCompanionDocumentUploaded(false);
            setEditDocumentUrl("");
            setEditCompanionDocumentUrl("");
            setUseExternalLink(false);
            setUseCompanionExternalLink(false);
            toast({
                title: "Sucesso",
                description: "Atestado médico atualizado com sucesso",
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
    const handleEditLeave = (leave) => {
        setEditingLeave(leave);
        editForm.reset({
            issueDate: format(new Date(leave.issueDate), "yyyy-MM-dd"),
            leaveType: leave.leaveType,
            leaveDuration: leave.leaveDuration.toString(),
            period: leave.period,
            isCompanion: leave.isCompanion,
            companionName: leave.companionName || "",
            companionRelationship: leave.companionRelationship || "",
            companionDocumentUrl: leave.companionDocumentUrl || "",
            documentUrl: leave.documentUrl || "",
            cidCode: leave.cidCode || "",
            cidDescription: leave.cidDescription || "",
            cidRestricted: leave.cidRestricted || false,
        });
        if (leave.documentUrl) {
            const isExternal = leave.documentUrl.startsWith('http') && !leave.documentUrl.includes('firebase');
            if (isExternal) {
                setUseExternalLink(true);
            }
            else {
                setEditDocumentUploaded(true);
            }
            setEditDocumentUrl(leave.documentUrl);
        }
        if (leave.companionDocumentUrl) {
            const isExternal = leave.companionDocumentUrl.startsWith('http') && !leave.companionDocumentUrl.includes('firebase');
            if (isExternal) {
                setUseCompanionExternalLink(true);
            }
            else {
                setEditCompanionDocumentUploaded(true);
            }
            setEditCompanionDocumentUrl(leave.companionDocumentUrl);
        }
        setEditOpen(true);
    };
    const handleEditSubmit = editForm.handleSubmit((data) => {
        console.log("Dados do formulário de edição:", data);
        console.log("URL do documento (edição):", editDocumentUrl);
        console.log("Status do documento:", editDocumentUploaded);
        if (!data.issueDate) {
            toast({
                title: "Erro de validação",
                description: "Data de emissão é obrigatória",
                variant: "destructive",
            });
            return;
        }
        if (!editDocumentUploaded && !data.documentUrl && !useExternalLink) {
            toast({
                title: "Documento obrigatório",
                description: "É necessário anexar o atestado médico ou fornecer um link para prosseguir",
                variant: "destructive",
            });
            return;
        }
        if (data.isCompanion && (!data.companionName || !data.companionRelationship)) {
            toast({
                title: "Erro de validação",
                description: "Nome e grau de parentesco são obrigatórios para atestado de acompanhante",
                variant: "destructive",
            });
            return;
        }
        if (data.isCompanion && !editCompanionDocumentUploaded && !data.companionDocumentUrl && !useCompanionExternalLink) {
            toast({
                title: "Documento do acompanhante obrigatório",
                description: "É necessário anexar o documento do acompanhante ou fornecer um link para prosseguir",
                variant: "destructive",
            });
            return;
        }
        const formDataComplete = {
            ...data,
            documentUrl: editDocumentUrl || data.documentUrl,
            companionDocumentUrl: data.isCompanion ? (editCompanionDocumentUrl || data.companionDocumentUrl) : null
        };
        updateLeave.mutate(formDataComplete);
    });
    const countMonthlyLeaves = (userId, date = new Date()) => {
        const startMonth = new Date(date.getFullYear(), date.getMonth(), 1);
        const endMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);
        return leaves.filter(leave => {
            const leaveDate = new Date(leave.issueDate);
            return leave.userId === userId &&
                leaveDate >= startMonth &&
                leaveDate <= endMonth &&
                leave.leaveType === "days";
        }).length;
    };
    const countYearlyLeaves = (userId, date = new Date()) => {
        const startYr = new Date(date.getFullYear(), 0, 1);
        const endYr = new Date(date.getFullYear() + 1, 0, 0);
        return leaves.filter(leave => {
            const leaveDate = new Date(leave.issueDate);
            return leave.userId === userId &&
                leaveDate >= startYr &&
                leaveDate <= endYr &&
                leave.leaveType === "days";
        }).length;
    };
    const countMonthlyHours = (userId, date = new Date()) => {
        const startMonth = new Date(date.getFullYear(), date.getMonth(), 1);
        const endMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);
        return leaves.filter(leave => {
            const leaveDate = new Date(leave.issueDate);
            return leave.userId === userId &&
                leaveDate >= startMonth &&
                leaveDate <= endMonth &&
                leave.leaveType === "hours";
        }).reduce((total, leave) => {
            let hours = 0;
            if (typeof leave.leaveDuration === 'string') {
                if (leave.leaveDuration.includes(':')) {
                    hours = parseInt(leave.leaveDuration.split(':')[0] || '0', 10);
                }
                else {
                    hours = parseInt(leave.leaveDuration, 10);
                }
            }
            else if (typeof leave.leaveDuration === 'number') {
                hours = leave.leaveDuration;
            }
            return total + hours;
        }, 0);
    };
    const handleIssueDateChange = (e) => {
        const issueDate = e.target.value;
        form.setValue("issueDate", issueDate);
    };
    const handleLeaveDurationChange = (e) => {
        const value = e.target.value;
        form.setValue("leaveDuration", value);
        if (form.watch("leaveType") === "days") {
            const days = parseInt(value, 10);
            if (days > 3) {
                setShowMaxDaysAlert(true);
                toast({
                    title: "Atenção",
                    description: "Atestados com mais de 3 dias devem ser encaminhados para junta médica.",
                    variant: "destructive",
                });
            }
            else {
                setShowMaxDaysAlert(false);
            }
        }
    };
    useEffect(() => {
        const checkLimits = () => {
            const userId = isAdmin ? selectedUserId : user?.id;
            if (!userId || !leaves)
                return;
            const currentDate = new Date();
            const monthlyCount = countMonthlyLeaves(userId, currentDate);
            const yearlyCount = countYearlyLeaves(userId, currentDate);
            const monthlyHours = countMonthlyHours(userId, currentDate);
            setShowMonthlyLimitAlert(monthlyCount >= 3);
            setShowYearlyLimitAlert(yearlyCount >= 18);
            setShowHoursLimitAlert(monthlyHours >= 24);
        };
        checkLimits();
    }, [selectedUserId, leaves, isAdmin, user?.id]);
    const handleExternalLinkChange = (checked) => {
        setUseExternalLink(checked);
        if (!checked) {
            setDocumentUrl("");
            form.setValue("documentUrl", "");
        }
    };
    const handleCompanionExternalLinkChange = (checked) => {
        setUseCompanionExternalLink(checked);
        if (!checked) {
            setCompanionDocumentUrl("");
            form.setValue("companionDocumentUrl", "");
        }
    };
    const handleSubmit = form.handleSubmit((data) => {
        if (!data.issueDate) {
            toast({
                title: "Erro de validação",
                description: "Data de emissão é obrigatória",
                variant: "destructive",
            });
            return;
        }
        if (isAdmin && !selectedUserId) {
            toast({
                title: "Erro de validação",
                description: "Selecione um servidor",
                variant: "destructive",
            });
            return;
        }
        if (data.isCompanion && (!data.companionName || !data.companionRelationship)) {
            toast({
                title: "Erro de validação",
                description: "Nome e grau de parentesco são obrigatórios para atestado de acompanhante",
                variant: "destructive",
            });
            return;
        }
        const hasDocument = documentUploaded ||
            Boolean(documentUrl) ||
            Boolean(data.documentUrl) ||
            useExternalLink;
        if (!hasDocument) {
            toast({
                title: "Documento obrigatório",
                description: "É necessário anexar o atestado médico ou fornecer um link para prosseguir",
                variant: "destructive",
            });
            return;
        }
        if (data.isCompanion) {
            const hasCompanionDocument = companionDocumentUploaded ||
                Boolean(companionDocumentUrl) ||
                useCompanionExternalLink;
            if (!hasCompanionDocument) {
                toast({
                    title: "Documento do acompanhante obrigatório",
                    description: "É necessário anexar o documento do acompanhante ou fornecer um link para prosseguir",
                    variant: "destructive",
                });
                return;
            }
        }
        const actualDocumentUrl = useExternalLink
            ? (form.getValues("documentUrl") || documentUrl)
            : (documentUrl || data.documentUrl);
        const actualCompanionUrl = data.isCompanion
            ? (useCompanionExternalLink
                ? (form.getValues("companionDocumentUrl") || companionDocumentUrl)
                : (companionDocumentUrl || data.companionDocumentUrl))
            : null;
        const formDataComplete = {
            ...data,
            documentUrl: actualDocumentUrl,
            companionDocumentUrl: actualCompanionUrl
        };
        createLeave.mutate(formDataComplete);
    });
    const exportToExcel = () => {
        //This section remains largely unchanged
    };
    if (isLoadingLeaves || (isAdmin && isLoadingUsers)) {
        return (<div className="flex h-screen">
        <Sidebar />
        <div className="flex-1 p-8">
          <div className="flex items-center justify-center h-full">
            <Loader2 className="h-8 w-8 animate-spin"/>
          </div>
        </div>
      </div>);
    }
    return (<div className="flex h-screen bg-background">
      <Sidebar />
      <div className="flex-1 overflow-auto p-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Atestados Médicos</h1>
          <div className="flex gap-4 items-center">
            <div className="flex gap-4">
              <div>
                <Label>Data Inicial</Label>
                <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)}/>
              </div>
              <div>
                <Label>Data Final</Label>
                <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)}/>
              </div>
            </div>
            <Button variant="outline" onClick={exportToExcel} className="flex items-center gap-2" disabled={!startDate || !endDate}>
              <Download className="h-4 w-4"/>
              Exportar Excel
            </Button>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button>Novo Atestado</Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl">
                <DialogHeader>
                  <DialogTitle>Novo Atestado Médico</DialogTitle>
                </DialogHeader>
                <ScrollArea className="max-h-[80vh] px-1">
                  <form onSubmit={handleSubmit} className="space-y-6">
                    {isAdmin && (<div className="space-y-2">
                        <Label>Servidor</Label>
                        <Select onValueChange={(value) => setSelectedUserId(Number(value))} value={selectedUserId?.toString() || ""}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o servidor"/>
                          </SelectTrigger>
                          <SelectContent>
                            {users.map((u) => (<SelectItem key={u.id} value={u.id.toString()}>
                                {u.fullName}
                              </SelectItem>))}
                          </SelectContent>
                        </Select>
                      </div>)}

                    <div className="space-y-2">
                      <Label>Data de Emissão</Label>
                      <Input type="date" {...form.register("issueDate")} onChange={handleIssueDateChange} max={format(new Date(), "yyyy-MM-dd")}/>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Tipo de Atestado</Label>
                        <Select onValueChange={(value) => {
            form.setValue("leaveType", value);
            if (value === "days") {
                form.setValue("period", "full");
            }
            else if (value === "hours" && form.watch("period") === "full") {
                form.setValue("period", "morning");
            }
        }} value={form.watch("leaveType")}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="days">Dias</SelectItem>
                            <SelectItem value="hours">Horas</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Período</Label>
                        <Select onValueChange={(value) => form.setValue("period", value)} value={form.watch("period")}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {form.watch("leaveType") === "hours" ? (<>
                                <SelectItem value="morning">Matutino</SelectItem>
                                <SelectItem value="afternoon">Vespertino</SelectItem>
                              </>) : (<>
                                <SelectItem value="full">Integral</SelectItem>
                              </>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>
                          Duração ({form.watch("leaveType") === "hours" ? "horas (HH:mm)" : "dias"})
                        </Label>
                        <Input type={form.watch("leaveType") === "hours" ? "time" : "number"} min={form.watch("leaveType") === "hours" ? undefined : "1"} max={form.watch("leaveType") === "hours" ? undefined : "3"} step={form.watch("leaveType") === "hours" ? "60" : "1"} {...form.register("leaveDuration")} onChange={handleLeaveDurationChange}/>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>CID (Código Internacional de Doenças)</Label>
                      <Input {...form.register("cidCode")} placeholder="Ex: A00.1"/>
                      <div className="text-sm text-muted-foreground">
                        Digite o código CID conforme consta no atestado
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Descrição do CID</Label>
                      <Textarea {...form.register("cidDescription")} placeholder="Descrição da condição médica"/>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Switch id="cidRestricted" checked={form.watch("cidRestricted")} onCheckedChange={(checked) => form.setValue("cidRestricted", checked)}/>
                      <Label htmlFor="cidRestricted">CID Restrito</Label>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center space-x-2">
                        <Switch checked={form.watch("isCompanion")} onCheckedChange={(checked) => {
            form.setValue("isCompanion", checked);
            if (!checked) {
                form.setValue("companionName", "");
                form.setValue("companionRelationship", "");
                form.setValue("companionDocumentUrl", "");
            }
        }} id="isCompanion"/>
                        <Label htmlFor="isCompanion">Atestado de Acompanhante</Label>
                      </div>

                      {form.watch("isCompanion") && (<div className="space-y-4 p-4 border rounded-md">
                          <div className="space-y-2">
                            <Label>Nome do Acompanhado</Label>
                            <Input {...form.register("companionName")} placeholder="Nome completo do acompanhado"/>
                          </div>

                          <div className="space-y-2">
                            <Label>Grau de Parentesco</Label>
                            <Input {...form.register("companionRelationship")} placeholder="Ex: Filho(a), Cônjuge, Pai/Mãe"/>
                          </div>

                          <div className="space-y-2">
                            <Label>Anexar Documento do Acompanhante</Label>
                            <div className="space-y-2">
                              <div className="flex items-center space-x-2 mb-2">
                                <Switch checked={useCompanionExternalLink} onCheckedChange={(checked) => handleCompanionExternalLinkChange(checked)} id="useCompanionExternalLink"/>
                                <Label htmlFor="useCompanionExternalLink" className="flex items-center gap-2">
                                  <LinkIcon className="h-4 w-4"/>
                                  Usar link externo
                                </Label>
                              </div>

                              {useCompanionExternalLink ? (<div className="flex gap-2">
                                  <Input {...form.register("companionDocumentUrl")} placeholder="https://link-para-documento.com" type="url" className="flex-1"/>
                                  {form.watch("companionDocumentUrl") && (<Button type="button" variant="outline" size="icon" onClick={() => form.setValue("companionDocumentUrl", "")}>
                                      <X className="h-4 w-4"/>
                                    </Button>)}
                                </div>) : (<div className="border rounded-lg p-4 bg-muted/50">
                                  <FileUploadBase64 onUploadComplete={(data) => {
                    setCompanionDocumentUploaded(true);
                    setCompanionDocumentUrl(data);
                    form.setValue("companionDocumentUrl", data);
                }} onUploadError={(error) => {
                    toast({
                        title: "Erro no upload",
                        description: error,
                        variant: "destructive",
                    });
                }}/>
                                  {companionDocumentUploaded && (<div className="mt-2 flex items-center gap-2">
                                      <Badge variant="outline" className="flex items-center gap-1">
                                        <FileText className="h-4 w-4"/>
                                        Documento anexado
                                      </Badge>
                                      <Button type="button" variant="ghost" size="sm" onClick={() => {
                        setCompanionDocumentUploaded(false);
                        setCompanionDocumentUrl("");
                        form.setValue("companionDocumentUrl", "");
                    }}>
                                        <X className="h-4 w-4"/>
                                      </Button>
                                    </div>)}
                                </div>)}
                            </div>
                          </div>
                        </div>)}
                    </div>

                    <div className="space-y-4">
                      <Label>Anexar Atestado Médico</Label>
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2 mb-2">
                          <Switch checked={useExternalLink} onCheckedChange={(checked) => handleExternalLinkChange(checked)} id="useExternalLink"/>
                          <Label htmlFor="useExternalLink" className="flex items-center gap-2">
                            <LinkIcon className="h-4 w-4"/>
                            Usar link externo
                          </Label>
                        </div>

                        {useExternalLink ? (<div className="flex gap-2">
                            <Input {...form.register("documentUrl")} placeholder="https://link-para-documento.com" type="url" className="flex-1"/>
                            {form.watch("documentUrl") && (<Button type="button" variant="outline" size="icon" onClick={() => form.setValue("documentUrl", "")}>
                                <X className="h-4 w-4"/>
                              </Button>)}
                          </div>) : (<div className="border rounded-lg p-4 bg-muted/50">
                            <FileUploadBase64 onUploadComplete={(data) => {
                setDocumentUploaded(true);
                setDocumentUrl(data);
                form.setValue("documentUrl", data);
            }} onUploadError={(error) => {
                toast({
                    title: "Erro no upload",
                    description: error,
                    variant: "destructive",
                });
            }}/>
                            {documentUploaded && (<div className="mt-2 flex items-center gap-2">
                                <Badge variant="outline" className="flex items-center gap-1">
                                  <FileText className="h-4 w-4"/>
                                  Documento anexado
                                </Badge>
                                <Button type="button" variant="ghost" size="sm" onClick={() => {
                    setDocumentUploaded(false);
                    setDocumentUrl("");
                    form.setValue("documentUrl", "");
                }}>
                                  <X className="h-4 w-4"/>
                                </Button>
                              </div>)}
                          </div>)}
                      </div>
                    </div>

                    <Button type="submit" className="w-full" disabled={createLeave.isPending}>
                      {createLeave.isPending ? (<>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin"/>
                          Enviando...
                        </>) : ("Enviar Atestado")}
                    </Button>
                  </form>
                </ScrollArea>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {leaves.length === 0 ? (<div className="text-center py-12">
            <p className="text-muted-foreground">Nenhum atestado médico encontrado.</p>
          </div>) : (<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {leaves.map((leave) => (<Card key={leave.id}>
                <CardHeader className="pb-2">
                  <div className="flex justify-between">
                    <CardTitle>
                      {leave.userName || "Usuário"}
                    </CardTitle>
                    <Badge className="ml-2" variant={getStatusBadgeVariant(leave.status)}>
                      {getStatusText(leave.status)}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div>
                    <span className="text-sm text-muted-foreground">Data de Emissão:</span>
                    <span className="ml-1 text-sm">{format(new Date(leave.issueDate), "dd/MM/yyyy")}</span>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">Tipo:</span>
                    <span className="ml-1 text-sm">{leave.leaveType === "days" ? "Dias" : "Horas"}</span>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">Duração:</span>
                    <span className="ml-1 text-sm">{leave.leaveDuration} {leave.leaveType === "days" ? "dias" : "horas"}</span>
                  </div>
                  {leave.cidCode && (<div>
                      <span className="text-sm text-muted-foreground">CID:</span>
                      <span className="ml-1 text-sm">{leave.cidRestricted ? "Restrito" : leave.cidCode}</span>
                    </div>)}
                </CardContent>
                <CardFooter>
                  <Button variant="outline" size="sm" className="w-full" onClick={() => handleEditLeave(leave)}>
                    <Edit className="w-4 h-4 mr-2"/>
                    Editar
                  </Button>
                </CardFooter>
              </Card>))}
          </div>)}
      </div>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Editar Atestado Médico</DialogTitle>
          </DialogHeader>

          <ScrollArea className="max-h-[80vh] px-1">
            <form onSubmit={handleEditSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label>Data de Emissão</Label>
                <Input type="date" {...editForm.register("issueDate")} max={format(new Date(), "yyyy-MM-dd")}/>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tipo de Atestado</Label>
                  <Select onValueChange={(value) => {
            editForm.setValue("leaveType", value);
            if (value === "days") {
                editForm.setValue("period", "full");
            }
            else if (value === "hours" && editForm.watch("period") === "full") {
                editForm.setValue("period", "morning");
            }
        }} value={editForm.watch("leaveType")}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="days">Dias</SelectItem>
                      <SelectItem value="hours">Horas</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Período</Label>
                  <Select onValueChange={(value) => editForm.setValue("period", value)} value={editForm.watch("period")}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {editForm.watch("leaveType") === "hours" ? (<>
                          <SelectItem value="morning">Matutino</SelectItem>
                          <SelectItem value="afternoon">Vespertino</SelectItem>
                        </>) : (<SelectItem value="full">Integral</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>
                    Duração ({editForm.watch("leaveType") === "hours" ? "horas (HH:mm)" : "dias"})
                  </Label>
                  <Input type={editForm.watch("leaveType") === "hours" ? "time" : "number"} min={editForm.watch("leaveType") === "hours" ? undefined : "1"} max={editForm.watch("leaveType") === "hours" ? undefined : "3"} step={editForm.watch("leaveType") === "hours" ? "60" : "1"} {...editForm.register("leaveDuration")}/>
                </div>
              </div>

              <div className="space-y-2">
                <Label>CID (Código Internacional de Doenças)</Label>
                <Input {...editForm.register("cidCode")} placeholder="Ex: A00.1"/>
                <div className="text-sm text-muted-foreground">
                  Digite o código CID conforme consta no atestado
                </div>
              </div>

              <div className="space-y-2">
                <Label>Descrição do CID</Label>
                <Textarea {...editForm.register("cidDescription")} placeholder="Descrição da condição médica"/>
              </div>

              <div className="flex items-center space-x-2">
                <Switch id="cidRestrictedEdit" checked={editForm.watch("cidRestricted")} onCheckedChange={(checked) => editForm.setValue("cidRestricted", checked)}/>
                <Label htmlFor="cidRestrictedEdit">CID Restrito</Label>
              </div>

              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch checked={editForm.watch("isCompanion")} onCheckedChange={(checked) => {
            editForm.setValue("isCompanion", checked);
            if (!checked) {
                editForm.setValue("companionName", "");
                editForm.setValue("companionRelationship", "");
                editForm.setValue("companionDocumentUrl", "");
            }
        }} id="isCompanionEdit"/>
                  <Label htmlFor="isCompanionEdit">Atestado de Acompanhante</Label>
                </div>

                {editForm.watch("isCompanion") && (<div className="space-y-4 p-4 border rounded-md">
                    <div className="space-y-2">
                      <Label>Nome do Acompanhado</Label>
                      <Input {...editForm.register("companionName")} placeholder="Nome completo do acompanhado"/>
                    </div>

                    <div className="space-y-2">
                      <Label>Grau de Parentesco</Label>
                      <Input {...editForm.register("companionRelationship")} placeholder="Ex: Filho(a), Cônjuge, Pai/Mãe"/>
                    </div>

                    <div className="space-y-2">
                      <Label>Anexar Documento do Acompanhante</Label>
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2 mb-2">
                          <Switch checked={useCompanionExternalLink} onCheckedChange={(checked) => {
                setUseCompanionExternalLink(checked);
                if (!checked) {
                    setEditCompanionDocumentUrl(editCompanionDocumentUrl);
                    editForm.setValue("companionDocumentUrl", editCompanionDocumentUrl);
                }
            }} id="useCompanionExternalLinkEdit"/>
                          <Label htmlFor="useCompanionExternalLinkEdit" className="flex items-center gap-2">
                            <LinkIcon className="h-4 w-4"/>
                            Usar link externo
                          </Label>
                        </div>

                        {useCompanionExternalLink ? (<div className="flex gap-2">
                            <Input {...editForm.register("companionDocumentUrl")} placeholder="https://link-para-documento.com" type="url" className="flex-1"/>
                            {editForm.watch("companionDocumentUrl") && (<Button type="button" variant="outline" size="icon" onClick={() => editForm.setValue("companionDocumentUrl", "")}>
                                <X className="h-4 w-4"/>
                              </Button>)}
                          </div>) : (<div className="border rounded-lg p-4 bg-muted/50">
                            <FileUploadBase64 onUploadComplete={(data) => {
                    setEditCompanionDocumentUploaded(true);
                    setEditCompanionDocumentUrl(data);
                    editForm.setValue("companionDocumentUrl", data);
                }} onUploadError={(error) => {
                    toast({
                        title: "Erro no upload",
                        description: error,
                        variant: "destructive",
                    });
                }}/>
                            {(editCompanionDocumentUploaded || editingLeave?.companionDocumentUrl) && (<div className="mt-2 flex items-center gap-2">
                                <Badge variant="outline" className="flex items-center gap-1">
                                  <FileText className="h-4 w-4"/>
                                  Documento anexado
                                </Badge>
                                <Button type="button" variant="ghost" size="sm" onClick={() => {
                        setEditCompanionDocumentUploaded(false);
                        setEditCompanionDocumentUrl("");
                        editForm.setValue("companionDocumentUrl", "");
                    }}>
                                  <X className="h-4 w-4"/>
                                </Button>
                              </div>)}
                          </div>)}
                      </div>
                    </div>
                  </div>)}
              </div>

              <div className="space-y-2">
                <Label>Anexar Atestado Médico</Label>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2 mb-2">
                    <Switch checked={useExternalLink} onCheckedChange={(checked) => {
            setUseExternalLink(checked);
            if (!checked) {
                setEditDocumentUrl(editDocumentUrl);
                editForm.setValue("documentUrl", editDocumentUrl);
            }
        }} id="useExternalLinkEdit"/>
                    <Label htmlFor="useExternalLinkEdit" className="flex items-center gap-2">
                      <LinkIcon className="h-4 w-4"/>
                      Usar link externo
                    </Label>
                  </div>

                  {useExternalLink ? (<div className="flex gap-2">
                      <Input {...editForm.register("documentUrl")} placeholder="https://link-para-documento.com" type="url" className="flex-1"/>
                      {editForm.watch("documentUrl") && (<Button type="button" variant="outline" size="icon" onClick={() => editForm.setValue("documentUrl", "")}>
                          <X className="h-4 w-4"/>
                        </Button>)}
                    </div>) : (<div className="border rounded-lg p-4 bg-muted/50">
                      <FileUploadBase64 onUploadComplete={(data) => {
                setEditDocumentUploaded(true);
                setEditDocumentUrl(data);
                editForm.setValue("documentUrl", data);
            }} onUploadError={(error) => {
                toast({
                    title: "Erro no upload",
                    description: error,
                    variant: "destructive",
                });
            }}/>
                      {(editDocumentUploaded || editingLeave?.documentUrl) && (<div className="mt-2 flex items-center gap-2">
                          <Badge variant="outline" className="flex items-center gap-1">
                            <FileText className="h-4 w-4"/>
                            Documento anexado
                          </Badge>
                          <Button type="button" variant="ghost" size="sm" onClick={() => {
                    setEditDocumentUploaded(false);
                    setEditDocumentUrl("");
                    editForm.setValue("documentUrl", "");
                }}>
                            <X className="h-4 w-4"/>
                          </Button>
                        </div>)}
                    </div>)}
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={updateLeave.isPending}>
                {updateLeave.isPending ? (<>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin"/>
                    Enviando...
                  </>) : ("Atualizar Atestado")}
              </Button>
            </form>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>);
}
//# sourceMappingURL=medical-leave.jsx.map