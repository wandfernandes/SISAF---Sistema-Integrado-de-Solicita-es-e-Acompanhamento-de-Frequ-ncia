import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Sidebar } from "@/components/nav/sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { Loader2, CheckCircle2, AlertCircle, Clock, Star, FileEdit } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
// Função auxiliar para obter a cor do status
function getStatusColor(status) {
    switch (status) {
        case "paid":
            return "bg-green-100 text-green-800";
        case "returned":
            return "bg-red-100 text-red-800";
        case "in_review":
            return "bg-blue-100 text-blue-800";
        case "awaiting_signature":
            return "bg-purple-100 text-purple-800";
        case "signed":
            return "bg-indigo-100 text-indigo-800";
        case "in_payment":
            return "bg-yellow-100 text-yellow-800";
        case "dispatched":
            return "bg-gray-100 text-gray-800";
        default:
            return "bg-yellow-100 text-yellow-800";
    }
}
// Função auxiliar para obter o texto do status em português
function getStatusText(status) {
    switch (status) {
        case "pending":
            return "Aguardando Processamento";
        case "in_review":
            return "Em Análise";
        case "awaiting_signature":
            return "Aguardando Assinatura";
        case "signed":
            return "Assinado";
        case "in_payment":
            return "Em Pagamento";
        case "paid":
            return "Pago";
        case "returned":
            return "Retornado";
        case "dispatched":
            return "Despachado";
        default:
            return status;
    }
}
export default function Payments() {
    const { user } = useAuth();
    const { toast } = useToast();
    const [open, setOpen] = useState(false);
    const [selectedStatus, setSelectedStatus] = useState("");
    const [statusNote, setStatusNote] = useState("");
    const [selectedPaymentId, setSelectedPaymentId] = useState(null);
    const [editMode, setEditMode] = useState(false);
    const [selectedPayment, setSelectedPayment] = useState(null);
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const { data: payments, isLoading } = useQuery({
        queryKey: ["/api/payments"],
    });
    const form = useForm({
        resolver: zodResolver(insertPaymentSchema),
        defaultValues: {
            seiNumber: "",
            contractObject: "",
            beneficiary: "",
            orderNumber: "",
            portaria: "",
            contractValue: "",
            additiveValue: "",
            invoiceDocument: "",
            invoiceValue: "",
            gerofAnalyst: "",
            attestation: false,
            notes: "",
            isPriority: false,
            certFgts: false,
            certFederal: false,
            certMunicipal: false,
            certTrabalhista: false,
            certEstadual: false,
        },
    });
    const editForm = useForm({
        resolver: zodResolver(insertPaymentSchema),
        defaultValues: {
            seiNumber: "",
            contractObject: "",
            beneficiary: "",
            orderNumber: "",
            portaria: "",
            contractValue: "",
            additiveValue: "",
            invoiceDocument: "",
            invoiceValue: "",
            gerofAnalyst: "",
            attestation: false,
            notes: "",
            isPriority: false,
            certFgts: false,
            certFederal: false,
            certMunicipal: false,
            certTrabalhista: false,
            certEstadual: false,
        },
    });
    const createPayment = useMutation({
        mutationFn: async (data) => {
            const formattedData = {
                ...data,
                contractValue: parseFloat(data.contractValue || "0").toFixed(2),
                additiveValue: parseFloat(data.additiveValue || "0").toFixed(2),
                invoiceValue: parseFloat(data.invoiceValue || "0").toFixed(2),
                history: [{
                        status: "pending",
                        date: new Date().toISOString(),
                        note: "Pagamento criado"
                    }]
            };
            const res = await apiRequest("POST", "/api/payments", formattedData);
            if (!res.ok) {
                const error = await res.text();
                throw new Error(error);
            }
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/payments"] });
            setOpen(false);
            form.reset();
            toast({
                title: "Sucesso",
                description: "Pagamento criado com sucesso",
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
    const updatePayment = useMutation({
        mutationFn: async (data) => {
            const formattedData = {
                ...data,
                contractValue: parseFloat(data.contractValue || "0").toFixed(2),
                additiveValue: parseFloat(data.additiveValue || "0").toFixed(2),
                invoiceValue: parseFloat(data.invoiceValue || "0").toFixed(2)
            };
            console.log("Enviando dados para atualização:", formattedData);
            const res = await apiRequest("PATCH", `/api/payments/${selectedPayment?.id}`, formattedData);
            if (!res.ok) {
                const error = await res.text();
                throw new Error(error);
            }
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/payments"] });
            setEditDialogOpen(false);
            setSelectedPayment(null);
            editForm.reset();
            toast({
                title: "Sucesso",
                description: "Pagamento atualizado com sucesso",
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
    const updatePaymentStatus = useMutation({
        mutationFn: async ({ id, status, note }) => {
            const res = await apiRequest("PATCH", `/api/payments/${id}`, {
                status,
                history: [
                    ...(payments?.find(p => p.id === id)?.history || []),
                    {
                        status,
                        date: new Date().toISOString(),
                        note
                    }
                ]
            });
            if (!res.ok) {
                const error = await res.text();
                throw new Error(error);
            }
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/payments"] });
            setSelectedStatus("");
            setStatusNote("");
            setSelectedPaymentId(null);
            toast({
                title: "Sucesso",
                description: "Status do pagamento atualizado com sucesso",
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
    const updatePriorityMutation = useMutation({
        mutationFn: async ({ id, isPriority }) => {
            const res = await apiRequest("PATCH", `/api/payments/${id}/priority`, {
                isPriority
            });
            if (!res.ok) {
                const error = await res.text();
                throw new Error(error);
            }
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/payments"] });
            toast({
                title: "Sucesso",
                description: "Prioridade do pagamento atualizada com sucesso",
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
    // Função para abrir o diálogo de edição com os dados do pagamento selecionado
    const handleEditPayment = (payment) => {
        setSelectedPayment(payment);
        // Preencher o formulário com os dados do pagamento
        editForm.reset({
            seiNumber: payment.seiNumber,
            contractObject: payment.contractObject,
            beneficiary: payment.beneficiary,
            orderNumber: payment.orderNumber,
            portaria: payment.portaria,
            contractValue: payment.contractValue.toString(),
            additiveValue: payment.additiveValue.toString(),
            invoiceDocument: payment.invoiceDocument,
            invoiceValue: payment.invoiceValue.toString(),
            gerofAnalyst: payment.gerofAnalyst,
            attestation: payment.attestation,
            notes: payment.notes || "",
            isPriority: payment.isPriority,
            certFgts: payment.certFgts,
            certFederal: payment.certFederal,
            certMunicipal: payment.certMunicipal,
            certTrabalhista: payment.certTrabalhista,
            certEstadual: payment.certEstadual,
        });
        setEditDialogOpen(true);
    };
    if (!user || user.role !== "admin") {
        return (<div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-2">Acesso Negado</h1>
          <p className="text-muted-foreground">
            Apenas administradores podem acessar o sistema de pagamentos.
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
      <div className="flex-1 overflow-auto p-4 md:p-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Gerenciamento de Pagamentos</h1>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>Novo Pagamento</Button>
            </DialogTrigger>
            <DialogContent className="w-[95vw] max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Criar Novo Pagamento</DialogTitle>
              </DialogHeader>
              <form onSubmit={form.handleSubmit((data) => createPayment.mutate(data))} className="space-y-6">
                {/* Seção de Informações Básicas */}
                <div className="space-y-4">
                  <h2 className="text-lg font-semibold">Informações Básicas</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label>Número SEI</label>
                      <Input {...form.register("seiNumber")}/>
                      {form.formState.errors.seiNumber && (<p className="text-sm text-red-500">
                          {form.formState.errors.seiNumber.message}
                        </p>)}
                    </div>
                    <div className="space-y-2">
                      <label>Objeto do Contrato</label>
                      <Input {...form.register("contractObject")}/>
                      {form.formState.errors.contractObject && (<p className="text-sm text-red-500">
                          {form.formState.errors.contractObject.message}
                        </p>)}
                    </div>
                    <div className="space-y-2">
                      <label>Beneficiário</label>
                      <Input {...form.register("beneficiary")}/>
                      {form.formState.errors.beneficiary && (<p className="text-sm text-red-500">
                          {form.formState.errors.beneficiary.message}
                        </p>)}
                    </div>
                    <div className="space-y-2">
                      <label>Número do Pedido</label>
                      <Input {...form.register("orderNumber")}/>
                      {form.formState.errors.orderNumber && (<p className="text-sm text-red-500">
                          {form.formState.errors.orderNumber.message}
                        </p>)}
                    </div>
                    <div className="space-y-2">
                      <label>Portaria</label>
                      <Input {...form.register("portaria")}/>
                      {form.formState.errors.portaria && (<p className="text-sm text-red-500">
                          {form.formState.errors.portaria.message}
                        </p>)}
                    </div>
                  </div>
                </div>

                {/* Seção de Valores */}
                <div className="space-y-4">
                  <h2 className="text-lg font-semibold">Valores</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label>Valor do Contrato</label>
                      <Input type="number" step="0.01" {...form.register("contractValue")}/>
                      {form.formState.errors.contractValue && (<p className="text-sm text-red-500">
                          {form.formState.errors.contractValue.message}
                        </p>)}
                    </div>
                    <div className="space-y-2">
                      <label>Valor Aditivo</label>
                      <Input type="number" step="0.01" {...form.register("additiveValue")}/>
                      {form.formState.errors.additiveValue && (<p className="text-sm text-red-500">
                          {form.formState.errors.additiveValue.message}
                        </p>)}
                    </div>
                  </div>
                </div>

                {/* Seção de Envio de Pagamento */}
                <div className="space-y-4">
                  <h2 className="text-lg font-semibold">Envio de Pagamento</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label>NF/Fatura/Documento</label>
                      <Input {...form.register("invoiceDocument")}/>
                      {form.formState.errors.invoiceDocument && (<p className="text-sm text-red-500">
                          {form.formState.errors.invoiceDocument.message}
                        </p>)}
                    </div>
                    <div className="space-y-2">
                      <label>Valor Fatura</label>
                      <Input type="number" step="0.01" {...form.register("invoiceValue")}/>
                      {form.formState.errors.invoiceValue && (<p className="text-sm text-red-500">
                          {form.formState.errors.invoiceValue.message}
                        </p>)}
                    </div>
                    <div className="space-y-2">
                      <label>Analista GEROF</label>
                      <Input {...form.register("gerofAnalyst")}/>
                      {form.formState.errors.gerofAnalyst && (<p className="text-sm text-red-500">
                          {form.formState.errors.gerofAnalyst.message}
                        </p>)}
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Switch id="payment-attestation" {...form.register("attestation")}/>
                        <Label htmlFor="payment-attestation">Atesto</Label>
                      </div>
                      {form.formState.errors.attestation && (<p className="text-sm text-red-500">
                          {form.formState.errors.attestation.message}
                        </p>)}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label>Anotações</label>
                    <Textarea {...form.register("notes")} className="min-h-[100px]"/>
                    {form.formState.errors.notes && (<p className="text-sm text-red-500">
                        {form.formState.errors.notes.message}
                      </p>)}
                  </div>

                  {/* Opção para definir como prioritário */}
                  <div className="flex items-center space-x-2">
                    <Switch id="payment-priority" {...form.register("isPriority")}/>
                    <Label htmlFor="payment-priority">Marcar como Processo Prioritário</Label>
                  </div>

                  {/* Nova seção de certidões */}
                  <div className="space-y-2 mt-4">
                    <h2 className="text-lg font-semibold">Certidões</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="flex items-center space-x-2">
                        <Switch id="cert-fgts" {...form.register("certFgts")}/>
                        <Label htmlFor="cert-fgts">FGTS</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch id="cert-federal" {...form.register("certFederal")}/>
                        <Label htmlFor="cert-federal">Certidão Federal</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch id="cert-municipal" {...form.register("certMunicipal")}/>
                        <Label htmlFor="cert-municipal">Certidão Municipal</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch id="cert-trabalhista" {...form.register("certTrabalhista")}/>
                        <Label htmlFor="cert-trabalhista">Certidão Trabalhista</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch id="cert-estadual" {...form.register("certEstadual")}/>
                        <Label htmlFor="cert-estadual">Certidão Estadual</Label>
                      </div>
                    </div>
                  </div>
                </div>

                <Button type="submit" className="w-full" disabled={createPayment.isPending}>
                  {createPayment.isPending && (<Loader2 className="h-4 w-4 animate-spin mr-2"/>)}
                  Criar Pagamento
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Diálogo de edição de pagamento */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="w-[95vw] max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Editar Pagamento</DialogTitle>
            </DialogHeader>
            <form onSubmit={editForm.handleSubmit((data) => updatePayment.mutate(data))} className="space-y-6">
              {/* Seção de Informações Básicas */}
              <div className="space-y-4">
                <h2 className="text-lg font-semibold">Informações Básicas</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label>Número SEI</label>
                    <Input {...editForm.register("seiNumber")}/>
                    {editForm.formState.errors.seiNumber && (<p className="text-sm text-red-500">
                        {editForm.formState.errors.seiNumber.message}
                      </p>)}
                  </div>
                  <div className="space-y-2">
                    <label>Objeto do Contrato</label>
                    <Input {...editForm.register("contractObject")}/>
                    {editForm.formState.errors.contractObject && (<p className="text-sm text-red-500">
                        {editForm.formState.errors.contractObject.message}
                      </p>)}
                  </div>
                  <div className="space-y-2">
                    <label>Beneficiário</label>
                    <Input {...editForm.register("beneficiary")}/>
                    {editForm.formState.errors.beneficiary && (<p className="text-sm text-red-500">
                        {editForm.formState.errors.beneficiary.message}
                      </p>)}
                  </div>
                  <div className="space-y-2">
                    <label>Número do Pedido</label>
                    <Input {...editForm.register("orderNumber")}/>
                    {editForm.formState.errors.orderNumber && (<p className="text-sm text-red-500">
                        {editForm.formState.errors.orderNumber.message}
                      </p>)}
                  </div>
                  <div className="space-y-2">
                    <label>Portaria</label>
                    <Input {...editForm.register("portaria")}/>
                    {editForm.formState.errors.portaria && (<p className="text-sm text-red-500">
                        {editForm.formState.errors.portaria.message}
                      </p>)}
                  </div>
                </div>
              </div>

              {/* Seção de Valores */}
              <div className="space-y-4">
                <h2 className="text-lg font-semibold">Valores</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label>Valor do Contrato</label>
                    <Input type="number" step="0.01" {...editForm.register("contractValue")}/>
                    {editForm.formState.errors.contractValue && (<p className="text-sm text-red-500">
                        {editForm.formState.errors.contractValue.message}
                      </p>)}
                  </div>
                  <div className="space-y-2">
                    <label>Valor Aditivo</label>
                    <Input type="number" step="0.01" {...editForm.register("additiveValue")}/>
                    {editForm.formState.errors.additiveValue && (<p className="text-sm text-red-500">
                        {editForm.formState.errors.additiveValue.message}
                      </p>)}
                  </div>
                </div>
              </div>

              {/* Seção de Envio de Pagamento */}
              <div className="space-y-4">
                <h2 className="text-lg font-semibold">Envio de Pagamento</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label>NF/Fatura/Documento</label>
                    <Input {...editForm.register("invoiceDocument")}/>
                    {editForm.formState.errors.invoiceDocument && (<p className="text-sm text-red-500">
                        {editForm.formState.errors.invoiceDocument.message}
                      </p>)}
                  </div>
                  <div className="space-y-2">
                    <label>Valor Fatura</label>
                    <Input type="number" step="0.01" {...editForm.register("invoiceValue")}/>
                    {editForm.formState.errors.invoiceValue && (<p className="text-sm text-red-500">
                        {editForm.formState.errors.invoiceValue.message}
                      </p>)}
                  </div>
                  <div className="space-y-2">
                    <label>Analista GEROF</label>
                    <Input {...editForm.register("gerofAnalyst")}/>
                    {editForm.formState.errors.gerofAnalyst && (<p className="text-sm text-red-500">
                        {editForm.formState.errors.gerofAnalyst.message}
                      </p>)}
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Switch id="edit-payment-attestation" {...editForm.register("attestation")}/>
                      <Label htmlFor="edit-payment-attestation">Atesto</Label>
                    </div>
                    {editForm.formState.errors.attestation && (<p className="text-sm text-red-500">
                        {editForm.formState.errors.attestation.message}
                      </p>)}
                  </div>
                </div>
                <div className="space-y-2">
                  <label>Anotações</label>
                  <Textarea {...editForm.register("notes")} className="min-h-[100px]"/>
                  {editForm.formState.errors.notes && (<p className="text-sm text-red-500">
                      {editForm.formState.errors.notes.message}
                    </p>)}
                </div>

                {/* Opção para definir como prioritário */}
                <div className="flex items-center space-x-2">
                  <Switch id="edit-payment-priority" {...editForm.register("isPriority")}/>
                  <Label htmlFor="edit-payment-priority">Marcar como Processo Prioritário</Label>
                </div>

                {/* Nova seção de certidões */}
                <div className="space-y-2 mt-4">
                  <h2 className="text-lg font-semibold">Certidões</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="flex items-center space-x-2">
                      <Switch id="edit-cert-fgts" {...editForm.register("certFgts")}/>
                      <Label htmlFor="edit-cert-fgts">FGTS</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch id="edit-cert-federal" {...editForm.register("certFederal")}/>
                      <Label htmlFor="edit-cert-federal">Certidão Federal</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch id="edit-cert-municipal" {...editForm.register("certMunicipal")}/>
                      <Label htmlFor="edit-cert-municipal">Certidão Municipal</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch id="edit-cert-trabalhista" {...editForm.register("certTrabalhista")}/>
                      <Label htmlFor="edit-cert-trabalhista">Certidão Trabalhista</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch id="edit-cert-estadual" {...editForm.register("certEstadual")}/>
                      <Label htmlFor="edit-cert-estadual">Certidão Estadual</Label>
                    </div>
                  </div>
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={updatePayment.isPending}>
                {updatePayment.isPending && (<Loader2 className="h-4 w-4 animate-spin mr-2"/>)}
                Salvar Alterações
              </Button>
            </form>
          </DialogContent>
        </Dialog>

        {payments?.length === 0 ? (<div className="text-center py-8">
            <p className="text-muted-foreground">Nenhum pagamento registrado ainda.</p>
          </div>) : (<div className="space-y-4">
            {payments?.map((payment) => (<div key={payment.id} className={`p-6 border rounded-lg bg-card space-y-4 ${payment.isPriority ? 'border-orange-500 border-2' : ''}`}>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div className="flex items-center gap-2">
                    {payment.isPriority && (<Star className="h-5 w-5 text-orange-500 fill-orange-500"/>)}
                    <div>
                      <h3 className="font-medium text-lg">SEI: {payment.seiNumber}</h3>
                      <p className="text-sm text-muted-foreground">
                        {payment.beneficiary}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <div className={`px-3 py-1 rounded-full text-sm ${getStatusColor(payment.status)}`}>
                      {getStatusText(payment.status)}
                    </div>

                    {/* Toggle para prioridade */}
                    <div className="flex items-center gap-2 ml-2">
                      <Switch id={`priority-${payment.id}`} checked={payment.isPriority} onCheckedChange={(checked) => updatePriorityMutation.mutate({ id: payment.id, isPriority: checked })}/>
                      <Label htmlFor={`priority-${payment.id}`} className="text-sm font-medium">
                        {payment.isPriority ? 'Prioritário' : 'Normal'}
                      </Label>
                    </div>

                    {/* Botão de editar */}
                    <Button variant="outline" size="sm" className="ml-2" onClick={() => handleEditPayment(payment)}>
                      <FileEdit className="h-4 w-4 mr-1"/>
                      Editar
                    </Button>
                  </div>
                </div>

                {/* Timeline do processo */}
                <div className="mt-4 space-y-3">
                  <h4 className="font-medium">Histórico do Processo</h4>
                  <div className="space-y-2">
                    {payment.history?.map((event, index) => (<div key={index} className="flex items-start gap-3">
                        <div className="mt-1">
                          {event.status === "paid" ? (<CheckCircle2 className="h-5 w-5 text-green-500"/>) : event.status === "returned" ? (<AlertCircle className="h-5 w-5 text-red-500"/>) : (<Clock className="h-5 w-5 text-blue-500"/>)}
                        </div>
                        <div>
                          <div className="font-medium">{getStatusText(event.status)}</div>
                          <div className="text-sm text-muted-foreground">
                            {format(new Date(event.date), "dd/MM/yyyy HH:mm")}
                          </div>
                          {event.note && <div className="text-sm mt-1">{event.note}</div>}
                        </div>
                      </div>))}
                  </div>
                </div>

                {/* Informações detalhadas */}
                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 text-sm">
                  <div>
                    <span className="font-medium">SEI:</span> {payment.seiNumber}
                  </div>
                  <div>
                    <span className="font-medium">Beneficiário:</span> {payment.beneficiary}
                  </div>
                  <div>
                    <span className="font-medium">Objeto do Contrato:</span>{" "}
                    {payment.contractObject}
                  </div>
                  <div>
                    <span className="font-medium">Nº do Pedido:</span> {payment.orderNumber}
                  </div>
                  <div>
                    <span className="font-medium">Portaria:</span> {payment.portaria}
                  </div>
                  <div>
                    <span className="font-medium">Valor do Contrato:</span> R${" "}
                    {Number(payment.contractValue).toLocaleString("pt-BR", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                })}
                  </div>
                  <div>
                    <span className="font-medium">Valor Aditivo:</span> R${" "}
                    {Number(payment.additiveValue).toLocaleString("pt-BR", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                })}
                  </div>
                  <div>
                    <span className="font-medium">NF/Fatura/Documento:</span>{" "}
                    {payment.invoiceDocument}
                  </div>
                  <div>
                    <span className="font-medium">Valor Fatura:</span> R${" "}
                    {Number(payment.invoiceValue).toLocaleString("pt-BR", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                })}
                  </div>
                  <div>
                    <span className="font-medium">Analista GEROF:</span>{" "}
                    {payment.gerofAnalyst}
                  </div>
                  <div>
                    <span className="font-medium">Atesto:</span>{" "}
                    <span className={`px-2 py-1 text-xs rounded-full cursor-pointer hover:opacity-80 ${payment.attestation ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`} onClick={() => {
                    updatePayment.mutate({
                        id: payment.id,
                        attestation: !payment.attestation
                    });
                }}>
                      {payment.attestation ? '✓ Realizado' : '✗ Pendente'}
                    </span>
                  </div>

                  {/* Exibindo status das certidões */}
                  <div className="col-span-1 sm:col-span-2 mt-2">
                    <span className="font-medium">Certidões:</span>
                    <div className="flex flex-wrap gap-2 mt-1">
                      <span className={`px-2 py-1 text-xs rounded-full cursor-pointer hover:opacity-80 ${payment.certFgts ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`} onClick={() => {
                    updatePayment.mutate({
                        id: payment.id,
                        certFgts: !payment.certFgts
                    });
                }}>
                        FGTS {payment.certFgts ? '✓' : '✗'}
                      </span>
                      <span className={`px-2 py-1 text-xs rounded-full cursor-pointer hover:opacity-80 ${payment.certFederal ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`} onClick={() => {
                    updatePayment.mutate({
                        id: payment.id,
                        certFederal: !payment.certFederal
                    });
                }}>
                        Federal {payment.certFederal ? '✓' : '✗'}
                      </span>
                      <span className={`px-2 py-1 text-xs rounded-full cursor-pointer hover:opacity-80 ${payment.certMunicipal ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`} onClick={() => {
                    updatePayment.mutate({
                        id: payment.id,
                        certMunicipal: !payment.certMunicipal
                    });
                }}>
                        Municipal {payment.certMunicipal ? '✓' : '✗'}
                      </span>
                      <span className={`px-2 py-1 text-xs rounded-full cursor-pointer hover:opacity-80 ${payment.certTrabalhista ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`} onClick={() => {
                    updatePayment.mutate({
                        id: payment.id,
                        certTrabalhista: !payment.certTrabalhista
                    });
                }}>
                        Trabalhista {payment.certTrabalhista ? '✓' : '✗'}
                      </span>
                      <span className={`px-2 py-1 text-xs rounded-full cursor-pointer hover:opacity-80 ${payment.certEstadual ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`} onClick={() => {
                    updatePayment.mutate({
                        id: payment.id,
                        certEstadual: !payment.certEstadual
                    });
                }}>
                        Estadual {payment.certEstadual ? '✓' : '✗'}
                      </span>
                    </div>
                  </div>

                  {payment.notes && (<div className="col-span-1 sm:col-span-2">
                      <span className="font-medium">Anotações:</span>
                      <p className="mt-1">{payment.notes}</p>
                    </div>)}
                  <div className="col-span-1 sm:col-span-2 text-xs text-muted-foreground">
                    <div>
                      Criado em {format(new Date(payment.createdAt), "dd/MM/yyyy HH:mm")}
                    </div>
                    <div>
                      Atualizado em{" "}
                      {format(new Date(payment.updatedAt), "dd/MM/yyyy HH:mm")}
                    </div>
                  </div>
                </div>
              </div>))}
          </div>)}
      </div>
    </div>);
}
//# sourceMappingURL=payments.jsx.map