import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Sidebar } from "@/components/nav/sidebar";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle, } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Bell, Loader2, Search, Send, Users } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger, } from "@/components/ui/tabs";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
// Definição do schema para validação do formulário
const notificationSchema = z.object({
    type: z.string().min(1, "Selecione um tipo de notificação"),
    title: z.string().min(3, "O título deve ter pelo menos 3 caracteres"),
    message: z.string().min(10, "A mensagem deve ter pelo menos 10 caracteres"),
    userId: z.string().optional(),
});
export default function NotificationsManager() {
    const { user } = useAuth();
    const { toast } = useToast();
    const [selectedUsers, setSelectedUsers] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    // Form para envio de notificação
    const form = useForm({
        resolver: zodResolver(notificationSchema),
        defaultValues: {
            type: "info",
            title: "",
            message: "",
            userId: "",
        },
    });
    // Consulta para buscar usuários
    const { data: users = [] } = useQuery({
        queryKey: ["/api/users"],
    });
    // Consulta para buscar todas as notificações enviadas
    const { data: notifications = [], isLoading: isLoadingNotifications } = useQuery({
        queryKey: ["/api/notifications/all"],
        enabled: user?.role === "admin" || user?.role === "hr",
    });
    // Mutation para enviar notificação
    const sendNotification = useMutation({
        mutationFn: async (data) => {
            const res = await apiRequest("POST", "/api/notifications/send", data);
            if (!res.ok)
                throw new Error("Falha ao enviar notificação");
            return res.json();
        },
        onSuccess: () => {
            toast({
                title: "Notificação enviada",
                description: selectedUsers.length > 0
                    ? `Notificação enviada para ${selectedUsers.length} usuário(s)`
                    : "Notificação enviada para todos os usuários",
            });
            form.reset();
            setSelectedUsers([]);
            queryClient.invalidateQueries({ queryKey: ["/api/notifications/all"] });
        },
        onError: (error) => {
            toast({
                title: "Erro ao enviar notificação",
                description: error.message,
                variant: "destructive",
            });
        },
    });
    // Função para lidar com a submissão do formulário
    const onSubmit = (data) => {
        let userIds = [];
        // Se há um userId específico no formulário, use-o
        if (data.userId && data.userId !== "all") {
            userIds = [parseInt(data.userId)];
        }
        // Caso contrário, use os usuários selecionados na lista
        else if (selectedUsers.length > 0) {
            userIds = selectedUsers;
        }
        // Se nenhum usuário selecionado e userId é "all", envie para todos (userIds vazio)
        sendNotification.mutate({
            type: data.type,
            title: data.title,
            message: data.message,
            userIds,
        });
    };
    // Filtrar usuários com base no termo de busca
    const filteredUsers = users.filter((user) => user.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.workUnit.toLowerCase().includes(searchTerm.toLowerCase()));
    // Alternar seleção de usuário
    const toggleUserSelection = (userId) => {
        setSelectedUsers((prevSelected) => prevSelected.includes(userId)
            ? prevSelected.filter((id) => id !== userId)
            : [...prevSelected, userId]);
    };
    // Selecionar todos os usuários filtrados
    const selectAllFilteredUsers = () => {
        const filteredUserIds = filteredUsers.map((user) => user.id);
        setSelectedUsers(filteredUserIds);
    };
    // Limpar seleção
    const clearSelection = () => {
        setSelectedUsers([]);
    };
    // Lidar com a mudança de seleção no dropdown
    const handleUserSelectChange = (value) => {
        form.setValue("userId", value);
        // Se selecionar "all", limpar a seleção manual
        if (value === "all") {
            setSelectedUsers([]);
        }
        // Se selecionar um usuário específico, atualizar a seleção manual
        else if (value !== "") {
            setSelectedUsers([parseInt(value)]);
        }
    };
    // Fix implicit 'any' type in onChange event handler
    const handleSearchInputChange = (e) => {
        setSearchTerm(e.target.value);
    };
    return (<div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 overflow-auto p-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold mb-8 flex items-center">
            <Bell className="mr-2 h-6 w-6"/>
            Gerenciador de Notificações
          </h1>

          <Tabs defaultValue="send">
            <TabsList className="mb-6">
              <TabsTrigger value="send">Enviar Notificações</TabsTrigger>
              <TabsTrigger value="history">Histórico de Notificações</TabsTrigger>
            </TabsList>

            <TabsContent value="send">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Formulário de envio */}
                <Card className="md:col-span-1">
                  <CardHeader>
                    <CardTitle>Enviar Notificação</CardTitle>
                    <CardDescription>
                      Crie e envie uma notificação para usuários específicos ou para todos
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="type">Tipo de Notificação</Label>
                        <Select onValueChange={(value) => form.setValue("type", value)} defaultValue={form.watch("type")}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione um tipo"/>
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="info">Informativo</SelectItem>
                            <SelectItem value="warning">Aviso</SelectItem>
                            <SelectItem value="urgent">Urgente</SelectItem>
                            <SelectItem value="reminder">Lembrete</SelectItem>
                          </SelectContent>
                        </Select>
                        {form.formState.errors.type && (<p className="text-sm text-red-500">
                            {form.formState.errors.type.message}
                          </p>)}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="title">Título</Label>
                        <Input id="title" {...form.register("title")} placeholder="Título da notificação"/>
                        {form.formState.errors.title && (<p className="text-sm text-red-500">
                            {form.formState.errors.title.message}
                          </p>)}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="message">Mensagem</Label>
                        <Textarea id="message" {...form.register("message")} placeholder="Conteúdo da notificação" rows={4}/>
                        {form.formState.errors.message && (<p className="text-sm text-red-500">
                            {form.formState.errors.message.message}
                          </p>)}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="recipient">Destinatário</Label>
                        <Select onValueChange={handleUserSelectChange} defaultValue="">
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione destinatário"/>
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Todos os usuários</SelectItem>
                            <SelectItem value="selected">Usuários selecionados</SelectItem>
                            {users.map((user) => (<SelectItem key={user.id} value={String(user.id)}>
                                {user.fullName}
                              </SelectItem>))}
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground mt-1">
                          Selecione "Usuários selecionados" e marque os usuários na lista ao lado,
                          ou escolha "Todos os usuários" para enviar para todos.
                        </p>
                      </div>
                    </form>
                  </CardContent>
                  <CardFooter>
                    <Button type="submit" onClick={form.handleSubmit(onSubmit)} disabled={sendNotification.isPending} className="w-full">
                      {sendNotification.isPending ? (<>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin"/>
                          Enviando...
                        </>) : (<>
                          <Send className="mr-2 h-4 w-4"/>
                          Enviar Notificação
                        </>)}
                    </Button>
                  </CardFooter>
                </Card>

                {/* Lista de usuários */}
                <Card className="md:col-span-2">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span className="flex items-center">
                        <Users className="mr-2 h-5 w-5"/>
                        Selecionar Destinatários
                      </span>
                      <span className="text-sm font-normal">
                        {selectedUsers.length} selecionados
                      </span>
                    </CardTitle>
                    <CardDescription>
                      Selecione usuários para enviar a notificação
                    </CardDescription>
                    <div className="relative mt-2">
                      <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground"/>
                      <Input placeholder="Buscar por nome ou unidade" value={searchTerm} onChange={handleSearchInputChange} className="pl-8"/>
                    </div>
                    <div className="flex space-x-2 mt-4">
                      <Button variant="outline" size="sm" onClick={selectAllFilteredUsers}>
                        Selecionar Todos
                      </Button>
                      <Button variant="outline" size="sm" onClick={clearSelection}>
                        Limpar Seleção
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="border rounded-md overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-12"></TableHead>
                            <TableHead>Nome</TableHead>
                            <TableHead>Unidade</TableHead>
                            <TableHead>Tipo</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredUsers.length === 0 ? (<TableRow>
                              <TableCell colSpan={4} className="text-center h-24 text-muted-foreground">
                                Nenhum usuário encontrado
                              </TableCell>
                            </TableRow>) : (filteredUsers.map((user) => (<TableRow key={user.id} className={selectedUsers.includes(user.id)
                ? "bg-primary/10"
                : ""} onClick={() => toggleUserSelection(user.id)} style={{ cursor: "pointer" }}>
                                <TableCell>
                                  <input type="checkbox" checked={selectedUsers.includes(user.id)} onChange={() => toggleUserSelection(user.id)} className="h-4 w-4"/>
                                </TableCell>
                                <TableCell>{user.fullName}</TableCell>
                                <TableCell>{user.workUnit}</TableCell>
                                <TableCell>
                                  <Badge variant={user.role === "admin"
                ? "default"
                : user.role === "hr"
                    ? "outline"
                    : "secondary"}>
                                    {user.role === "admin"
                ? "Admin"
                : user.role === "hr"
                    ? "RH"
                    : "Usuário"}
                                  </Badge>
                                </TableCell>
                              </TableRow>)))}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="history">
              <Card>
                <CardHeader>
                  <CardTitle>Histórico de Notificações Enviadas</CardTitle>
                  <CardDescription>
                    Visualize todas as notificações enviadas no sistema
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoadingNotifications ? (<div className="flex justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground"/>
                    </div>) : notifications.length === 0 ? (<div className="text-center py-8 text-muted-foreground">
                      Nenhuma notificação enviada ainda
                    </div>) : (<div className="border rounded-md overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Título</TableHead>
                            <TableHead>Tipo</TableHead>
                            <TableHead>Destinatário</TableHead>
                            <TableHead>Data</TableHead>
                            <TableHead>Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {notifications.map((notification) => (<TableRow key={notification.id}>
                              <TableCell className="font-medium">
                                {notification.title}
                              </TableCell>
                              <TableCell>
                                <Badge variant={notification.type === "urgent"
                    ? "destructive"
                    : notification.type === "warning"
                        ? "warning"
                        : "default"}>
                                  {notification.type === "info"
                    ? "Informativo"
                    : notification.type === "warning"
                        ? "Aviso"
                        : notification.type === "urgent"
                            ? "Urgente"
                            : notification.type === "reminder"
                                ? "Lembrete"
                                : notification.type}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                {notification.userName || "Todos os usuários"}
                              </TableCell>
                              <TableCell>
                                {format(new Date(notification.createdAt), "dd/MM/yyyy HH:mm")}
                              </TableCell>
                              <TableCell>
                                <Badge variant={notification.read ? "outline" : "secondary"}>
                                  {notification.read ? "Lida" : "Não lida"}
                                </Badge>
                              </TableCell>
                            </TableRow>))}
                        </TableBody>
                      </Table>
                    </div>)}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>);
}
//# sourceMappingURL=notifications-manager.jsx.map