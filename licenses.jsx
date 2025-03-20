import { Card, CardContent, CardDescription, CardHeader, CardTitle, } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, } from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage, } from "@/components/ui/form";
import { Popover, PopoverContent, PopoverTrigger, } from "@/components/ui/popover";
import { insertLicenseSchema } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useEffect, useState } from "react";
import { format, parse, addDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon, Loader2, FilePlus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
export default function LicensesPage() {
    const { toast } = useToast();
    const [openDialog, setOpenDialog] = useState(false);
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState("all");
    // Query para buscar todas as licenças
    const { data: licenses, isLoading: isLoadingLicenses } = useQuery({
        queryKey: ["/api/licenses"],
        queryFn: async () => {
            const response = await apiRequest("GET", "/api/licenses");
            return response.json();
        },
    });
    // Query para buscar usuários (para admin/HR)
    const { data: users } = useQuery({
        queryKey: ["/api/users"],
        queryFn: async () => {
            const response = await apiRequest("GET", "/api/users");
            return response.json();
        },
        enabled: user?.role === "admin" || user?.role === "hr",
    });
    // Filtrar licenças por status ativo
    const filteredLicenses = licenses?.filter((license) => {
        if (activeTab === "all")
            return true;
        if (activeTab === "pending")
            return license.status === "pending";
        if (activeTab === "approved")
            return license.status === "approved";
        if (activeTab === "rejected")
            return license.status === "rejected";
        return true;
    });
    // Form para criar nova licença
    const form = useForm({
        resolver: zodResolver(insertLicenseSchema),
        defaultValues: {
            userId: user?.id || 0,
            serverName: user?.fullName || "",
            workUnit: user?.workUnit || "",
            seiNumber: "",
            startDate: "",
            endDate: "",
            returnDate: "",
            reason: "",
            observation: "",
        },
    });
    // Preencher valores padrão ao carregar o usuário
    useEffect(() => {
        if (user) {
            form.setValue("userId", user.id);
            form.setValue("serverName", user.fullName || "");
            form.setValue("workUnit", user.workUnit || "");
        }
    }, [user, form]);
    // Mutation para criar nova licença
    const createLicense = useMutation({
        mutationFn: async (data) => {
            const formattedData = {
                ...data,
                startDate: format(parse(data.startDate, "dd/MM/yyyy", new Date()), "yyyy-MM-dd"),
                endDate: format(parse(data.endDate, "dd/MM/yyyy", new Date()), "yyyy-MM-dd"),
                returnDate: format(parse(data.returnDate, "dd/MM/yyyy", new Date()), "yyyy-MM-dd"),
            };
            const response = await apiRequest("POST", "/api/licenses", formattedData);
            return response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/licenses"] });
            toast({
                title: "Licença criada com sucesso",
                description: "Sua solicitação de licença foi registrada e está aguardando aprovação.",
            });
            setOpenDialog(false);
            form.reset();
        },
        onError: (error) => {
            toast({
                title: "Erro ao criar licença",
                description: error.message,
                variant: "destructive",
            });
        },
    });
    // Estado para gerenciar confirmação de aprovação/rejeição
    const [confirmAction, setConfirmAction] = useState({
        open: false,
        action: "approve",
        licenseId: null,
    });
    // Estado para armazenar observação adicional na confirmação
    const [actionObservation, setActionObservation] = useState("");
    // Mutation para atualizar status da licença
    const updateLicenseStatus = useMutation({
        mutationFn: async ({ id, status, observation }) => {
            try {
                const response = await apiRequest("PATCH", `/api/licenses/${id}`, {
                    status,
                    observation: observation || (status === "approved" ? "Licença aprovada." : "Licença rejeitada."),
                });
                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.message || "Erro ao atualizar licença");
                }
                return response.json();
            }
            catch (error) {
                if (error instanceof Error) {
                    throw error;
                }
                throw new Error("Erro desconhecido ao atualizar licença");
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/licenses"] });
            toast({
                title: "Status atualizado",
                description: "O status da licença foi atualizado com sucesso.",
            });
            // Resetar estado de confirmação
            setConfirmAction({ open: false, action: "approve", licenseId: null });
            setActionObservation("");
        },
        onError: (error) => {
            toast({
                title: "Erro ao atualizar status",
                description: error.message,
                variant: "destructive",
            });
        },
    });
    // Calcular data de retorno ao trabalho (1 dia após o término da licença)
    const calculateReturnDate = (date) => {
        if (!date)
            return "";
        try {
            const parsedDate = parse(date, "dd/MM/yyyy", new Date());
            const returnDate = addDays(parsedDate, 1);
            return format(returnDate, "dd/MM/yyyy");
        }
        catch (error) {
            return "";
        }
    };
    // Atualizar data de retorno ao modificar data final
    useEffect(() => {
        const endDate = form.watch("endDate");
        if (endDate) {
            const returnDate = calculateReturnDate(endDate);
            form.setValue("returnDate", returnDate);
        }
    }, [form.watch("endDate")]);
    // Handler para submissão do formulário
    const onSubmit = (data) => {
        createLicense.mutate(data);
    };
    // Obter nome do usuário para exibição
    const getUserName = (userId) => {
        if (!users)
            return "Usuário";
        const user = users.find((u) => u.id === userId);
        return user?.fullName || "Usuário";
    };
    // Obter cor do badge de status
    const getStatusBadgeVariant = (status) => {
        switch (status) {
            case "approved":
                return "success";
            case "rejected":
                return "destructive";
            default:
                return "secondary";
        }
    };
    // Texto do status para exibição
    const getStatusText = (status) => {
        switch (status) {
            case "pending":
                return "Pendente";
            case "approved":
                return "Aprovado";
            case "rejected":
                return "Rejeitado";
            default:
                return status;
        }
    };
    if (isLoadingLicenses) {
        return (<div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin"/>
      </div>);
    }
    return (<div className="container mx-auto py-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Licenças</h1>
          <p className="text-muted-foreground">
            Gerencie suas licenças e acompanhe o status de suas solicitações.
          </p>
        </div>
        <Dialog open={openDialog} onOpenChange={setOpenDialog}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <FilePlus className="h-4 w-4"/>
              Nova Licença
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Solicitar Nova Licença</DialogTitle>
              <DialogDescription>
                Preencha o formulário abaixo para solicitar uma nova licença.
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                {(user?.role === "admin" || user?.role === "hr") && (<FormField control={form.control} name="userId" render={({ field }) => (<FormItem>
                        <FormLabel>Servidor</FormLabel>
                        <Select onValueChange={(value) => {
                    field.onChange(parseInt(value));
                    const selectedUser = users?.find((u) => u.id === parseInt(value));
                    if (selectedUser) {
                        form.setValue("serverName", selectedUser.fullName || "");
                        form.setValue("workUnit", selectedUser.workUnit || "");
                    }
                }} defaultValue={field.value.toString()}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione um servidor"/>
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {users?.map((user) => (<SelectItem key={user.id} value={user.id.toString()}>
                                {user.fullName}
                              </SelectItem>))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>)}/>)}

                <FormField control={form.control} name="serverName" render={({ field }) => (<FormItem>
                      <FormLabel>Nome do Servidor</FormLabel>
                      <FormControl>
                        <Input {...field} readOnly={user?.role !== "admin" && user?.role !== "hr"}/>
                      </FormControl>
                      <FormMessage />
                    </FormItem>)}/>

                <FormField control={form.control} name="workUnit" render={({ field }) => (<FormItem>
                      <FormLabel>Unidade de Lotação</FormLabel>
                      <FormControl>
                        <Input {...field} readOnly={user?.role !== "admin" && user?.role !== "hr"}/>
                      </FormControl>
                      <FormMessage />
                    </FormItem>)}/>

                <FormField control={form.control} name="seiNumber" render={({ field }) => (<FormItem>
                      <FormLabel>Número do Processo SEI</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Ex: 00112-00000000/2023-00"/>
                      </FormControl>
                      <FormMessage />
                    </FormItem>)}/>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <FormField control={form.control} name="startDate" render={({ field }) => (<FormItem className="flex flex-col">
                        <FormLabel>Data de Início</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button variant={"outline"} className={cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                                {field.value ? (format(parse(field.value, "dd/MM/yyyy", new Date()), "dd/MM/yyyy")) : (<span>Selecione uma data</span>)}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50"/>
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar mode="single" selected={field.value ? parse(field.value, "dd/MM/yyyy", new Date()) : undefined} onSelect={(date) => date && field.onChange(format(date, "dd/MM/yyyy"))} initialFocus locale={ptBR}/>
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>)}/>

                  <FormField control={form.control} name="endDate" render={({ field }) => (<FormItem className="flex flex-col">
                        <FormLabel>Data de Término</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button variant={"outline"} className={cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                                {field.value ? (format(parse(field.value, "dd/MM/yyyy", new Date()), "dd/MM/yyyy")) : (<span>Selecione uma data</span>)}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50"/>
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar mode="single" selected={field.value ? parse(field.value, "dd/MM/yyyy", new Date()) : undefined} onSelect={(date) => date && field.onChange(format(date, "dd/MM/yyyy"))} initialFocus locale={ptBR}/>
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>)}/>
                </div>

                <FormField control={form.control} name="returnDate" render={({ field }) => (<FormItem>
                      <FormLabel>Data de Retorno</FormLabel>
                      <FormControl>
                        <Input {...field} readOnly/>
                      </FormControl>
                      <FormDescription>
                        Data calculada automaticamente (1 dia após o término)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>)}/>

                <FormField control={form.control} name="reason" render={({ field }) => (<FormItem>
                      <FormLabel>Motivo da Licença</FormLabel>
                      <FormControl>
                        <Textarea {...field} placeholder="Descreva o motivo da licença" className="min-h-[100px]"/>
                      </FormControl>
                      <FormMessage />
                    </FormItem>)}/>

                <FormField control={form.control} name="observation" render={({ field }) => (<FormItem>
                      <FormLabel>Observações (opcional)</FormLabel>
                      <FormControl>
                        <Textarea {...field} placeholder="Observações adicionais" className="min-h-[80px]" value={field.value || ""}/>
                      </FormControl>
                      <FormMessage />
                    </FormItem>)}/>

                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setOpenDialog(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={createLicense.isPending} className="gap-2">
                    {createLicense.isPending && (<Loader2 className="h-4 w-4 animate-spin"/>)}
                    Solicitar Licença
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <Separator className="my-6"/>

      <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="all">Todas</TabsTrigger>
          <TabsTrigger value="pending">Pendentes</TabsTrigger>
          <TabsTrigger value="approved">Aprovadas</TabsTrigger>
          <TabsTrigger value="rejected">Rejeitadas</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab}>
          {filteredLicenses?.length === 0 ? (<Card>
              <CardContent className="py-10 text-center">
                <p className="text-muted-foreground">
                  Nenhuma licença encontrada nesta categoria.
                </p>
              </CardContent>
            </Card>) : (<div className="space-y-4">
              {filteredLicenses?.map((license) => (<Card key={license.id}>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-center">
                      <div>
                        <CardTitle>Licença #{license.id}</CardTitle>
                        <CardDescription>
                          {user?.role === "admin" || user?.role === "hr"
                    ? `Servidor: ${license.userName || license.serverName}`
                    : `Processo SEI: ${license.seiNumber}`}
                        </CardDescription>
                      </div>
                      <Badge variant={getStatusBadgeVariant(license.status)}>
                        {getStatusText(license.status)}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium">Informações da Licença</p>
                        <div className="mt-2 space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Processo SEI:</span>
                            <span>{license.seiNumber}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Unidade:</span>
                            <span>{license.workUnit}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Motivo:</span>
                            <span>{license.reason}</span>
                          </div>
                        </div>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Período</p>
                        <div className="mt-2 space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Data Início:</span>
                            <span>{format(new Date(license.startDate), "dd/MM/yyyy")}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Data Término:</span>
                            <span>{format(new Date(license.endDate), "dd/MM/yyyy")}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Data Retorno:</span>
                            <span>{format(new Date(license.returnDate), "dd/MM/yyyy")}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {license.observation && (<div className="mt-4 border-t pt-3">
                        <p className="text-sm font-medium">Observações</p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {license.observation}
                        </p>
                      </div>)}

                    {/* Ações para admin/HR */}
                    {(user?.role === "admin" || user?.role === "hr") &&
                    license.status === "pending" && (<div className="mt-4 border-t pt-3 flex justify-end gap-2">
                          <Button variant="outline" size="sm" onClick={() => setConfirmAction({
                        open: true,
                        action: "reject",
                        licenseId: license.id
                    })} disabled={updateLicenseStatus.isPending}>
                            Rejeitar
                          </Button>
                          <Button size="sm" onClick={() => setConfirmAction({
                        open: true,
                        action: "approve",
                        licenseId: license.id
                    })} disabled={updateLicenseStatus.isPending}>
                            {updateLicenseStatus.isPending && (<Loader2 className="h-4 w-4 animate-spin mr-2"/>)}
                            Aprovar
                          </Button>
                        </div>)}
                  </CardContent>
                </Card>))}
            </div>)}
        </TabsContent>
      </Tabs>

      {/* Diálogo de confirmação para aprovação/rejeição */}
      <Dialog open={confirmAction.open} onOpenChange={(open) => {
            if (!open)
                setConfirmAction({ ...confirmAction, open: false });
        }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {confirmAction.action === "approve" ? "Aprovar Licença" : "Rejeitar Licença"}
            </DialogTitle>
            <DialogDescription>
              {confirmAction.action === "approve"
            ? "Confirma a aprovação desta licença? Esta ação não pode ser desfeita."
            : "Confirma a rejeição desta licença? Esta ação não pode ser desfeita."}
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={(e) => {
            e.preventDefault();
            if (!confirmAction.licenseId)
                return;
            updateLicenseStatus.mutate({
                id: confirmAction.licenseId,
                status: confirmAction.action === "approve" ? "approved" : "rejected",
                observation: actionObservation || (confirmAction.action === "approve"
                    ? "Licença aprovada pelo RH."
                    : "Licença rejeitada pelo RH.")
            });
        }}>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="observation">Observação</Label>
                <Textarea id="observation" placeholder="Adicione uma observação (opcional)" value={actionObservation} onChange={(e) => setActionObservation(e.target.value)}/>
              </div>
            </div>
            
            <div className="flex justify-end gap-2 mt-4">
              <Button type="button" variant="outline" onClick={() => setConfirmAction({ ...confirmAction, open: false })}>
                Cancelar
              </Button>
              <Button type="submit" variant={confirmAction.action === "approve" ? "default" : "destructive"} disabled={updateLicenseStatus.isPending}>
                {updateLicenseStatus.isPending && (<Loader2 className="h-4 w-4 animate-spin mr-2"/>)}
                {confirmAction.action === "approve" ? "Aprovar" : "Rejeitar"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>);
}
//# sourceMappingURL=licenses.jsx.map