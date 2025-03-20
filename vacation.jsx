import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Sidebar } from "@/components/nav/sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { format, addDays, parseISO, differenceInDays } from "date-fns";
import { Loader2, Calendar, Filter, AlertCircle, Building2, User as UserIcon, Edit } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
export default function VacationPage() {
    const { user } = useAuth();
    const { toast } = useToast();
    const [open, setOpen] = useState(false);
    const [editOpen, setEditOpen] = useState(false);
    const [approvalOpen, setApprovalOpen] = useState(false);
    const [totalDays, setTotalDays] = useState(0);
    const [returnDate, setReturnDate] = useState(null);
    const [selectedUserId, setSelectedUserId] = useState(null);
    const [selectedPeriod, setSelectedPeriod] = useState(null);
    const [editingPeriod, setEditingPeriod] = useState(null);
    const [seiNumber, setSeiNumber] = useState("");
    const [filterStatus, setFilterStatus] = useState("all");
    const [filterStartDate, setFilterStartDate] = useState("");
    const [filterEndDate, setFilterEndDate] = useState("");
    const [isRetroactive, setIsRetroactive] = useState(false);
    // Gerar anos para o período aquisitivo (últimos 5 anos até próximo ano)
    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 7 }, (_, i) => currentYear - 5 + i);
    const [selectedStartYear, setSelectedStartYear] = useState(currentYear.toString());
    const [selectedEndYear, setSelectedEndYear] = useState((currentYear + 1).toString());
    const form = useForm({
        defaultValues: {
            acquisitionPeriod: `${currentYear}/${currentYear + 1}`,
            startDate: "",
            endDate: "",
            observation: "",
            seiNumber: ""
        }
    });
    // Formulário de edição
    const editForm = useForm({
        defaultValues: {
            acquisitionPeriod: `${currentYear}/${currentYear + 1}`,
            startDate: "",
            endDate: "",
            observation: "",
            seiNumber: ""
        }
    });
    const isAdmin = user?.role === "admin" || user?.role === "hr";
    const { data: users = [], isLoading: isLoadingUsers } = useQuery({
        queryKey: ["/api/users"],
        enabled: isAdmin,
    });
    const { data: periods = [], isLoading: isLoadingPeriods } = useQuery({
        queryKey: ["/api/vacation-periods"],
    });
    const calculateDays = (startDate, endDate) => {
        try {
            if (!startDate || !endDate)
                return 0;
            const start = parseISO(startDate);
            const end = parseISO(endDate);
            if (end < start) {
                return 0;
            }
            const days = differenceInDays(end, start) + 1;
            return days;
        }
        catch (error) {
            console.error("Erro ao calcular datas:", error);
            return 0;
        }
    };
    const updateFormDates = () => {
        try {
            const startDate = form.watch("startDate");
            const endDate = form.watch("endDate");
            if (!startDate || !endDate)
                return;
            const start = parseISO(startDate);
            const end = parseISO(endDate);
            if (end < start) {
                toast({
                    title: "Erro",
                    description: "A data final deve ser posterior à data inicial",
                    variant: "destructive"
                });
                return;
            }
            const days = differenceInDays(end, start) + 1;
            if (days > 30) {
                toast({
                    title: "Atenção",
                    description: "O período máximo de férias é de 30 dias",
                    variant: "destructive"
                });
                return;
            }
            setTotalDays(days);
            const returnDateObj = addDays(end, 1);
            setReturnDate(format(returnDateObj, "yyyy-MM-dd"));
        }
        catch (error) {
            console.error("Erro ao calcular datas:", error);
        }
    };
    // Função para atualizar datas no formulário de edição
    const updateEditFormDates = () => {
        try {
            const startDate = editForm.watch("startDate");
            const endDate = editForm.watch("endDate");
            if (!startDate || !endDate)
                return;
            const days = calculateDays(startDate, endDate);
            if (days <= 0)
                return;
            return {
                totalDays: days,
                returnDate: format(addDays(parseISO(endDate), 1), "yyyy-MM-dd")
            };
        }
        catch (error) {
            console.error("Erro ao calcular datas de edição:", error);
            return null;
        }
    };
    const createVacation = useMutation({
        mutationFn: async (data) => {
            const effectiveUserId = isAdmin ? selectedUserId : user?.id;
            if (!effectiveUserId) {
                throw new Error("Selecione um servidor");
            }
            if (!returnDate) {
                throw new Error("Data de retorno não calculada");
            }
            // Calculando remainingDays e daysUsed com base no tipo de entrada (retroativa ou não)
            let remainingDays = 30 - totalDays;
            let daysUsed = totalDays;
            // Importante: usar o período aquisitivo dos selects
            const acquisitionPeriod = `${selectedStartYear}/${selectedEndYear}`;
            console.log("Período aquisitivo selecionado:", acquisitionPeriod);
            // Para entradas retroativas, modificamos o status diretamente para 'approved'
            // e consideramos que estes dias já foram usados no cálculo
            const status = isRetroactive ? "approved" : "pending";
            const payload = {
                userId: effectiveUserId,
                acquisitionPeriod: acquisitionPeriod,
                startDate: data.startDate,
                endDate: data.endDate,
                returnDate,
                totalDays,
                remainingDays,
                daysUsed,
                observation: data.observation || null,
                status, // Automático para retroativas, pendente para novas
                seiNumber: isRetroactive ? data.seiNumber || "Registro retroativo" : null,
                reviewedBy: isRetroactive ? user?.id : null,
                reviewedAt: isRetroactive ? new Date().toISOString() : null
            };
            console.log("Enviando payload:", payload);
            const response = await apiRequest("POST", "/api/vacation-periods", payload);
            if (!response.ok) {
                const errorText = await response.text();
                console.error("Erro na resposta:", errorText);
                throw new Error(errorText || "Erro ao criar período de férias");
            }
            return response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/vacation-periods"] });
            setOpen(false);
            form.reset();
            setTotalDays(0);
            setReturnDate(null);
            setSelectedUserId(null);
            setIsRetroactive(false);
            toast({
                title: "Sucesso",
                description: isRetroactive
                    ? "Registro retroativo de férias criado com sucesso"
                    : "Solicitação de férias criada com sucesso",
            });
        },
        onError: (error) => {
            toast({
                title: "Erro",
                description: error.message || "Erro ao processar solicitação",
                variant: "destructive",
            });
        },
    });
    const updateVacationStatus = useMutation({
        mutationFn: async ({ id, status, seiNumber }) => {
            const response = await apiRequest("PATCH", `/api/vacation-periods/${id}`, {
                status,
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
            queryClient.invalidateQueries({ queryKey: ["/api/vacation-periods"] });
            setApprovalOpen(false);
            setSelectedPeriod(null);
            setSeiNumber("");
            toast({
                title: "Sucesso",
                description: "Status da solicitação atualizado com sucesso",
            });
        },
        onError: (error) => {
            toast({
                title: "Erro",
                description: error.message || "Erro ao atualizar status",
                variant: "destructive",
            });
        },
    });
    // Nova mutação para atualizar os detalhes de um período de férias (para edição)
    const updateVacationPeriod = useMutation({
        mutationFn: async (data) => {
            if (!editingPeriod) {
                throw new Error("Nenhum período selecionado para edição");
            }
            // Calcular os dias e data de retorno
            const datesInfo = updateEditFormDates();
            if (!datesInfo) {
                throw new Error("Erro ao calcular datas");
            }
            // Usando o período aquisitivo do form de edição
            const payload = {
                acquisitionPeriod: `${data.startYear}/${data.endYear}`,
                startDate: data.startDate,
                endDate: data.endDate,
                returnDate: datesInfo.returnDate,
                totalDays: datesInfo.totalDays,
                remainingDays: 30 - datesInfo.totalDays,
                daysUsed: datesInfo.totalDays,
                observation: data.observation || null
            };
            const response = await apiRequest("PATCH", `/api/vacation-periods/${editingPeriod.id}/edit`, payload);
            if (!response.ok) {
                const errorText = await response.text();
                console.error("Erro na resposta de edição:", errorText);
                throw new Error(errorText || "Erro ao atualizar período de férias");
            }
            return response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/vacation-periods"] });
            setEditOpen(false);
            editForm.reset();
            setEditingPeriod(null);
            toast({
                title: "Sucesso",
                description: "Período de férias atualizado com sucesso",
            });
        },
        onError: (error) => {
            toast({
                title: "Erro",
                description: error.message || "Erro ao atualizar período",
                variant: "destructive",
            });
        },
    });
    const onSubmit = form.handleSubmit(async (data) => {
        if (!data.startDate || !data.endDate) {
            toast({
                title: "Erro",
                description: "Selecione as datas de início e fim das férias",
                variant: "destructive",
            });
            return;
        }
        if (isAdmin && !selectedUserId) {
            toast({
                title: "Erro",
                description: "Selecione um servidor",
                variant: "destructive",
            });
            return;
        }
        if (totalDays === 0) {
            toast({
                title: "Erro",
                description: "Período de férias inválido",
                variant: "destructive",
            });
            return;
        }
        // Para entradas retroativas, exigir número SEI
        if (isRetroactive && !data.seiNumber && isAdmin) {
            toast({
                title: "Erro",
                description: "Número do SEI é necessário para registros retroativos",
                variant: "destructive",
            });
            return;
        }
        await createVacation.mutateAsync(data);
    });
    // Handler para formulário de edição
    const onEditSubmit = editForm.handleSubmit(async (data) => {
        if (!data.startDate || !data.endDate) {
            toast({
                title: "Erro",
                description: "Selecione as datas de início e fim das férias",
                variant: "destructive",
            });
            return;
        }
        const datesInfo = updateEditFormDates();
        if (!datesInfo || datesInfo.totalDays === 0) {
            toast({
                title: "Erro",
                description: "Período de férias inválido",
                variant: "destructive",
            });
            return;
        }
        await updateVacationPeriod.mutateAsync(data);
    });
    // Função para iniciar a edição de um período
    const handleEditPeriod = (period) => {
        setEditingPeriod(period);
        // Extrair os anos do período aquisitivo
        const [startYear, endYear] = period.acquisitionPeriod.split('/');
        editForm.reset({
            startYear,
            endYear,
            startDate: format(new Date(period.startDate), "yyyy-MM-dd"),
            endDate: format(new Date(period.endDate), "yyyy-MM-dd"),
            observation: period.observation || "",
        });
        setEditOpen(true);
    };
    const filteredPeriods = periods.filter(period => {
        // Se o usuário não for admin, mostrar apenas seus próprios períodos
        if (!isAdmin && period.userId !== user?.id) {
            return false;
        }
        let match = true;
        if (filterStatus !== "all") {
            match = match && period.status === filterStatus;
        }
        if (filterStartDate && filterEndDate) {
            const periodStart = new Date(period.startDate);
            const filterStart = new Date(filterStartDate);
            const filterEnd = new Date(filterEndDate);
            match = match && (periodStart >= filterStart && periodStart <= filterEnd);
        }
        return match;
    });
    const getStatusColor = (status) => {
        switch (status) {
            case "approved":
                return "bg-green-100 text-green-800";
            case "rejected":
                return "bg-red-100 text-red-800";
            default:
                return "bg-yellow-100 text-yellow-800";
        }
    };
    const getStatusText = (status) => {
        switch (status) {
            case "approved":
                return "Aprovado";
            case "rejected":
                return "Rejeitado";
            default:
                return "Pendente";
        }
    };
    const getUserById = (userId) => {
        return users.find(u => u.id === userId);
    };
    if (isLoadingPeriods || (isAdmin && isLoadingUsers)) {
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
          <h1 className="text-3xl font-bold">Férias</h1>
          <div className="flex items-center gap-4">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="flex items-center gap-2">
                  <Filter className="h-4 w-4"/>
                  Filtros
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <Select value={filterStatus} onValueChange={setFilterStatus}>
                      <SelectTrigger>
                        <SelectValue placeholder="Todos os status"/>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        <SelectItem value="pending">Pendente</SelectItem>
                        <SelectItem value="approved">Aprovado</SelectItem>
                        <SelectItem value="rejected">Rejeitado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Período</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <Input type="date" value={filterStartDate} onChange={(e) => setFilterStartDate(e.target.value)} placeholder="Data inicial"/>
                      <Input type="date" value={filterEndDate} onChange={(e) => setFilterEndDate(e.target.value)} placeholder="Data final"/>
                    </div>
                  </div>
                </div>
              </PopoverContent>
            </Popover>

            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button>Solicitar Férias</Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>
                    {isAdmin && isRetroactive
            ? "Registrar Férias Anteriores"
            : "Nova Solicitação de Férias"}
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={onSubmit} className="space-y-4">
                  {isAdmin && (<div className="space-y-4">
                      <div>
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
                      </div>

                      {/* Opção para entrada retroativa (apenas admin) */}
                      <div className="flex items-center space-x-2">
                        <Checkbox id="retroactive" checked={isRetroactive} onCheckedChange={(checked) => {
                if (checked === true || checked === false) {
                    setIsRetroactive(checked);
                }
            }}/>
                        <label htmlFor="retroactive" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                          Registro retroativo (férias já gozadas)
                        </label>
                      </div>

                      {/* Campo para número SEI (apenas para registros retroativos) */}
                      {isRetroactive && (<div className="space-y-2">
                          <Label>Número SEI</Label>
                          <Input id="seiNumber" {...form.register("seiNumber")} placeholder="Número do processo SEI"/>
                        </div>)}
                    </div>)}

                  <div>
                    <Label>Período Aquisitivo</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <Select value={selectedStartYear} onValueChange={setSelectedStartYear}>
                        <SelectTrigger>
                          <SelectValue placeholder="Ano Inicial"/>
                        </SelectTrigger>
                        <SelectContent>
                          {years.map((year) => (<SelectItem key={year} value={year.toString()}>
                              {year}
                            </SelectItem>))}
                        </SelectContent>
                      </Select>
                      <Select value={selectedEndYear} onValueChange={setSelectedEndYear}>
                        <SelectTrigger>
                          <SelectValue placeholder="Ano Final"/>
                        </SelectTrigger>
                        <SelectContent>
                          {years.map((year) => (<SelectItem key={year} value={year.toString()}>
                              {year}
                            </SelectItem>))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Data Inicial</Label>
                      <Input type="date" {...form.register("startDate")} onChange={(e) => {
            form.setValue("startDate", e.target.value);
            updateFormDates();
        }}/>
                    </div>
                    <div>
                      <Label>Data Final</Label>
                      <Input type="date" {...form.register("endDate")} onChange={(e) => {
            form.setValue("endDate", e.target.value);
            updateFormDates();
        }}/>
                    </div>
                  </div>
                  {totalDays > 0 && returnDate && (<Alert>
                      <Calendar className="h-4 w-4"/>
                      <AlertTitle>Informações do Período</AlertTitle>
                      <AlertDescription>
                        <div className="mt-2 space-y-1">
                          <p>Total de dias: {totalDays}</p>
                          <p>Data de retorno: {format(parseISO(returnDate), "dd/MM/yyyy")}</p>
                        </div>
                      </AlertDescription>
                    </Alert>)}
                  <div>
                    <Label>Observação</Label>
                    <Input {...form.register("observation")}/>
                  </div>
                  <Button type="submit" className="w-full" disabled={createVacation.isPending}>
                    {createVacation.isPending ? (<>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin"/>
                        Enviando...
                      </>) : (isRetroactive ? "Registrar Férias Anteriores" : "Enviar Solicitação")}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPeriods.map((period) => {
            const periodUser = getUserById(period.userId);
            return (<TooltipProvider key={period.id}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Card className="hover:bg-accent/5 transition-colors">
                      <CardHeader className="pb-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle>Período {period.acquisitionPeriod}</CardTitle>
                            <CardDescription>
                              {format(new Date(period.startDate), "dd/MM/yyyy")} até{" "}
                              {format(new Date(period.endDate), "dd/MM/yyyy")}
                            </CardDescription>
                          </div>
                          <Badge className={getStatusColor(period.status)}>
                            {getStatusText(period.status)}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center gap-2">
                            <UserIcon className="h-4 w-4 text-muted-foreground"/>
                            <span>{periodUser?.fullName || "Nome não disponível"}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Building2 className="h-4 w-4 text-muted-foreground"/>
                            <span>{periodUser?.workUnit || "Unidade não disponível"}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground"/>
                            <span>
                              Retorno: {format(new Date(period.returnDate), "dd/MM/yyyy")}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <AlertCircle className="h-4 w-4 text-muted-foreground"/>
                            <span>
                              {period.daysUsed || 0} dias usados / {period.remainingDays || 30} dias restantes
                            </span>
                          </div>
                          {period.observation && (<p className="text-muted-foreground mt-2">
                              Obs: {period.observation}
                            </p>)}
                          {period.seiNumber && (<p className="text-muted-foreground">
                              SEI: {period.seiNumber}
                            </p>)}

                          {/* Botões de ação com base no status do período */}
                          <div className="flex gap-2 mt-4">
                            {/* Permitir edição apenas para períodos pendentes que pertençam ao usuário ou para admins */}
                            {period.status === "pending" && (period.userId === user?.id || isAdmin ? (<Button size="sm" variant="outline" className="flex-1" onClick={() => handleEditPeriod(period)}>
                                  <Edit className="h-4 w-4 mr-2"/>
                                  Editar
                                </Button>) : null)}

                            {/* Botões de aprovação/rejeição apenas para admin/HR e períodos pendentes */}
                            {isAdmin && period.status === "pending" && (<>
                                <Button size="sm" className="flex-1" onClick={() => {
                        setSelectedPeriod(period);
                        setApprovalOpen(true);
                    }}>
                                  Aprovar
                                </Button>
                                <Button size="sm" variant="destructive" className="flex-1" onClick={() => {
                        updateVacationStatus.mutate({
                            id: period.id,
                            status: "rejected"
                        });
                    }}>
                                  Reprovar
                                </Button>
                              </>)}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Clique para ver mais detalhes</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>);
        })}

          {filteredPeriods.length === 0 && (<div className="col-span-full">
              <Alert>
                <AlertTitle>Nenhum período encontrado</AlertTitle>
                <AlertDescription>
                  Não há períodos de férias que correspondam aos filtros selecionados.
                </AlertDescription>
              </Alert>
            </div>)}
        </div>

        {/* Modal de aprovação */}
        <Dialog open={approvalOpen} onOpenChange={setApprovalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Aprovar Férias</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Número do SEI</Label>
                <Input value={seiNumber} onChange={(e) => setSeiNumber(e.target.value)} placeholder="Digite o número do processo SEI"/>
              </div>
              <Button className="w-full" disabled={!seiNumber || updateVacationStatus.isPending} onClick={() => {
            if (selectedPeriod) {
                updateVacationStatus.mutate({
                    id: selectedPeriod.id,
                    status: "approved",
                    seiNumber
                });
            }
        }}>
                {updateVacationStatus.isPending ? (<>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin"/>
                    Processando...
                  </>) : ("Confirmar Aprovação")}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Modal de edição */}
        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Editar Período de Férias</DialogTitle>
            </DialogHeader>

            <form onSubmit={onEditSubmit} className="space-y-4">
              <div>
                <Label>Período Aquisitivo</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Select onValueChange={(value) => editForm.setValue("startYear", value)} value={editForm.watch("startYear")}>
                    <SelectTrigger>
                      <SelectValue placeholder="Ano Inicial"/>
                    </SelectTrigger>
                    <SelectContent>
                      {years.map((year) => (<SelectItem key={year} value={year.toString()}>
                          {year}
                        </SelectItem>))}
                    </SelectContent>
                  </Select>
                  <Select onValueChange={(value) => editForm.setValue("endYear", value)} value={editForm.watch("endYear")}>
                    <SelectTrigger>
                      <SelectValue placeholder="Ano Final"/>
                    </SelectTrigger>
                    <SelectContent>
                      {years.map((year) => (<SelectItem key={year} value={year.toString()}>
                          {year}
                        </SelectItem>))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Data Inicial</Label>
                  <Input type="date" {...editForm.register("startDate")} onChange={(e) => {
            editForm.setValue("startDate", e.target.value);
            updateEditFormDates();
        }}/>
                </div>
                <div>
                  <Label>Data Final</Label>
                  <Input type="date" {...editForm.register("endDate")} onChange={(e) => {
            editForm.setValue("endDate", e.target.value);
            updateEditFormDates();
        }}/>
                </div>
              </div>

              {editForm.watch("startDate") && editForm.watch("endDate") &&
            updateEditFormDates() && updateEditFormDates().totalDays > 0 && (<Alert>
                  <Calendar className="h-4 w-4"/>
                  <AlertTitle>Informações do Período</AlertTitle>
                  <AlertDescription>
                    <div className="mt-2 space-y-1">
                      <p>Total de dias: {updateEditFormDates().totalDays}</p>
                      <p>Data de retorno: {format(parseISO(updateEditFormDates().returnDate), "dd/MM/yyyy")}</p>
                    </div>
                  </AlertDescription>
                </Alert>)}

              <div>
                <Label>Observação</Label>
                <Input {...editForm.register("observation")}/>
              </div>

              <Button type="submit" className="w-full" disabled={updateVacationPeriod.isPending}>
                {updateVacationPeriod.isPending ? (<>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin"/>
                    Atualizando...
                  </>) : ("Atualizar Período de Férias")}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>);
}
//# sourceMappingURL=vacation.jsx.map