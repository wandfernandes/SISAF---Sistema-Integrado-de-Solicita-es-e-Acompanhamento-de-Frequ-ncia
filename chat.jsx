import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Sidebar } from "@/components/nav/sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Loader2, Send, User, Users, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useWebSocket } from "@/context/websocket-context";
import { format } from "date-fns";
export default function ChatPage() {
    const { user } = useAuth();
    const { toast } = useToast();
    const { isConnected, sendChatMessage } = useWebSocket();
    const [selectedUserId, setSelectedUserId] = useState(null);
    const [newMessage, setNewMessage] = useState("");
    const [searchQuery, setSearchQuery] = useState("");
    const [isMassMessage, setIsMassMessage] = useState(false);
    const messagesEndRef = useRef(null);
    // Buscar lista de conversas
    const { data: conversations = [], isLoading: isLoadingConversations } = useQuery({
        queryKey: ["/api/chat"],
    });
    // Buscar mensagens da conversa selecionada
    const { data: messages = [], isLoading: isLoadingMessages } = useQuery({
        queryKey: ["/api/chat", selectedUserId],
        enabled: !!selectedUserId && !isMassMessage,
    });
    // Buscar todos os usuários (para iniciar novas conversas)
    const { data: allUsers = [], isLoading: isLoadingUsers } = useQuery({
        queryKey: ["/api/users"],
    });
    // Enviar mensagem via HTTP (alternativa ao WebSocket)
    const sendMessageMutation = useMutation({
        mutationFn: async (data) => {
            try {
                if (data.isToAll) {
                    // Corrigindo o formato do payload para broadcast - apenas enviando o campo message
                    const res = await apiRequest("POST", "/api/chat/broadcast", { message: data.message });
                    return res.json();
                }
                else {
                    // Corrigindo o formato do payload para mensagem individual
                    const res = await apiRequest("POST", `/api/chat/${data.userId}`, { message: data.message });
                    return res.json();
                }
            }
            catch (error) {
                console.error("Error sending message:", error);
                throw error;
            }
        },
        onSuccess: () => {
            if (!isMassMessage) {
                queryClient.invalidateQueries({ queryKey: ["/api/chat", selectedUserId] });
            }
            queryClient.invalidateQueries({ queryKey: ["/api/chat"] });
        },
        onError: (error) => {
            toast({
                title: "Erro ao enviar mensagem",
                description: error.message || "Ocorreu um erro ao enviar a mensagem",
                variant: "destructive",
            });
        },
    });
    // Marcar mensagens como lidas
    const markAsReadMutation = useMutation({
        mutationFn: async (userId) => {
            try {
                const res = await apiRequest("PATCH", `/api/chat/${userId}/read`, {});
                return res.json();
            }
            catch (error) {
                console.error("Error marking messages as read:", error);
                throw error;
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/chat"] });
        },
    });
    // Selecionar usuário para conversa ou modo de mensagem em massa
    const selectUser = (userId) => {
        try {
            setSelectedUserId(userId);
            setIsMassMessage(false);
            // Marcar mensagens como lidas quando selecionar usuário
            if (userId !== null) {
                markAsReadMutation.mutate(userId);
            }
        }
        catch (error) {
            console.error("Error selecting user:", error);
            toast({
                title: "Erro ao selecionar usuário",
                description: "Ocorreu um erro ao carregar as mensagens deste usuário",
                variant: "destructive",
            });
        }
    };
    // Ativar modo de mensagem em massa
    const selectMassMessage = () => {
        setSelectedUserId(null);
        setIsMassMessage(true);
    };
    // Enviar mensagem
    const handleSendMessage = () => {
        if (!newMessage.trim())
            return;
        try {
            if (isMassMessage) {
                // Enviar mensagem para todos - corrigido o formato do payload
                console.log("Enviando mensagem para todos:", { message: newMessage });
                sendMessageMutation.mutate({
                    userId: null,
                    message: newMessage,
                    isToAll: true
                });
            }
            else if (selectedUserId) {
                // Tentar enviar via WebSocket primeiro
                if (isConnected) {
                    // Usar o conteúdo trimado da mensagem para evitar erros com espaços
                    const trimmedMessage = newMessage.trim();
                    if (trimmedMessage) {
                        sendChatMessage(selectedUserId, trimmedMessage);
                        // Atualizar imediatamente a UI com a mensagem enviada
                        const optimisticMessage = {
                            id: Date.now(), // ID temporário
                            senderId: user?.id || 0,
                            message: trimmedMessage,
                            createdAt: new Date().toISOString(),
                            read: true,
                            isFromCurrentUser: true,
                        };
                        queryClient.setQueryData(["/api/chat", selectedUserId], (old = []) => [
                            ...old, // Manter mensagens antigas no topo
                            optimisticMessage, // Adicionar nova mensagem embaixo
                        ]);
                    }
                }
                else {
                    // Fallback para HTTP se WebSocket não estiver disponível
                    console.log("Enviando mensagem individual via HTTP:", { message: newMessage });
                    sendMessageMutation.mutate({
                        userId: selectedUserId,
                        message: newMessage.trim(),
                        isToAll: false
                    });
                }
            }
            setNewMessage("");
        }
        catch (error) {
            console.error("Error in handleSendMessage:", error);
            toast({
                title: "Erro ao enviar mensagem",
                description: "Ocorreu um erro ao processar sua mensagem",
                variant: "destructive",
            });
        }
    };
    // Rolar para o fim das mensagens quando receber novas
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);
    // Marcar mensagens como lidas quando a conversa estiver aberta
    useEffect(() => {
        if (selectedUserId) {
            const interval = setInterval(() => {
                markAsReadMutation.mutate(selectedUserId);
            }, 5000); // Verifica a cada 5 segundos
            return () => clearInterval(interval);
        }
    }, [selectedUserId]);
    // Filtrar usuários baseado na pesquisa
    const filteredConversations = conversations.filter(conv => conv.userName.toLowerCase().includes(searchQuery.toLowerCase()));
    const filteredAvailableUsers = allUsers.filter(u => u.id !== user?.id &&
        !conversations.some(c => c.userId === u.id) &&
        ((u.fullName && u.fullName.toLowerCase().includes(searchQuery.toLowerCase())) ||
            (u.username && u.username.toLowerCase().includes(searchQuery.toLowerCase()))));
    if (isLoadingConversations || isLoadingUsers) {
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
      <div className="flex-1 overflow-hidden flex">
        {/* Lista de contatos */}
        <div className="w-1/4 border-r p-4 overflow-y-auto">
          <h2 className="text-xl font-bold mb-4">Conversas</h2>

          {/* Campo de pesquisa */}
          <div className="relative mb-4">
            <Search className="absolute left-2 top-3 h-4 w-4 text-muted-foreground"/>
            <Input placeholder="Pesquisar usuários..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-8"/>
          </div>

          {/* Botão de mensagem em massa */}
          <Card className={`p-3 cursor-pointer flex items-center justify-between hover:bg-accent mb-4 ${isMassMessage ? "bg-accent" : "bg-primary/10"}`} onClick={selectMassMessage}>
            <div className="flex items-center">
              <Avatar className="h-10 w-10 mr-3 bg-primary/20">
                <Users className="h-6 w-6"/>
              </Avatar>
              <div>
                <div className="font-medium">Mensagem para todos</div>
                <div className="text-xs text-muted-foreground">Envie mensagens em massa</div>
              </div>
            </div>
          </Card>

          {filteredConversations.length > 0 ? (<div className="space-y-2">
              {filteredConversations.map((conversation) => (<Card key={conversation.userId} className={`p-3 cursor-pointer flex items-center justify-between hover:bg-accent ${selectedUserId === conversation.userId && !isMassMessage ? "bg-accent" : ""}`} onClick={() => selectUser(conversation.userId)}>
                  <div className="flex items-center">
                    <Avatar className="h-10 w-10 mr-3">
                      <User className="h-6 w-6"/>
                    </Avatar>
                    <div>
                      <div className="font-medium">{conversation.userName}</div>
                    </div>
                  </div>
                  {conversation.unreadCount > 0 && (<Badge variant="destructive" className="rounded-full px-2">
                      {conversation.unreadCount}
                    </Badge>)}
                </Card>))}
            </div>) : (searchQuery ? (<p className="text-muted-foreground">Nenhum resultado para "{searchQuery}"</p>) : (<p className="text-muted-foreground">Nenhuma conversa ainda</p>))}

          <div className="mt-6">
            <h3 className="text-md font-semibold mb-2">Iniciar nova conversa</h3>
            {filteredAvailableUsers.length > 0 ? (<div className="space-y-2">
                {filteredAvailableUsers.map((u) => (<Card key={u.id} className="p-3 cursor-pointer flex items-center hover:bg-accent" onClick={() => selectUser(u.id)}>
                    <Avatar className="h-8 w-8 mr-2">
                      <User className="h-5 w-5"/>
                    </Avatar>
                    <div className="font-medium">{u.fullName || u.username}</div>
                  </Card>))}
              </div>) : (searchQuery ? (<p className="text-muted-foreground">Nenhum usuário encontrado para "{searchQuery}"</p>) : (<p className="text-muted-foreground">Nenhum usuário disponível</p>))}
          </div>
        </div>

        {/* Área de mensagens */}
        <div className="flex-1 flex flex-col">
          {selectedUserId || isMassMessage ? (<>
              {/* Cabeçalho com nome do contato */}
              <div className="p-4 border-b flex justify-between items-center">
                <div className="flex items-center">
                  <Avatar className="h-8 w-8 mr-2">
                    {isMassMessage ? (<Users className="h-5 w-5"/>) : (<User className="h-5 w-5"/>)}
                  </Avatar>
                  <h2 className="text-lg font-semibold">
                    {isMassMessage ? ("Mensagem para todos os usuários") : (conversations.find(c => c.userId === selectedUserId)?.userName ||
                allUsers.find(u => u.id === selectedUserId)?.fullName ||
                allUsers.find(u => u.id === selectedUserId)?.username ||
                "Usuário")}
                  </h2>
                </div>
                {!isMassMessage && (isConnected ? (<Badge variant="outline" className="bg-green-100 text-green-800">
                      Online
                    </Badge>) : (<Badge variant="outline" className="bg-gray-100">
                      Offline
                    </Badge>))}
              </div>

              {/* Mensagens */}
              <div className="flex-1 overflow-y-auto p-4 flex flex-col-reverse">
                <div ref={messagesEndRef}/>
                {isMassMessage ? (<div className="text-center text-muted-foreground my-8">
                    Escreva uma mensagem para enviar a todos os usuários do sistema
                  </div>) : isLoadingMessages ? (<div className="flex justify-center my-4">
                    <Loader2 className="h-6 w-6 animate-spin"/>
                  </div>) : messages.length > 0 ? (<div className="space-y-4">
                    {[...messages].reverse().map((message) => (<div key={message.id} className={`flex ${message.isFromCurrentUser ? "justify-end" : "justify-start"}`}>
                        <div className={`max-w-[70%] p-3 rounded-lg ${message.isFromCurrentUser
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary"}`}>
                          <div className="text-sm mb-1">
                            {message.isFromCurrentUser ? "Você" : message.senderName || "Usuário"}
                          </div>
                          <div>{message.message}</div>
                          <div className="text-xs mt-1 opacity-70">
                            {format(new Date(message.createdAt), "dd/MM/yyyy HH:mm")}
                          </div>
                        </div>
                      </div>))}
                  </div>) : (<div className="text-center text-muted-foreground my-8">
                    Inicie uma conversa enviando uma mensagem
                  </div>)}
              </div>

              {/* Campo de input de mensagem */}
              <div className="p-4 border-t">
                <form className="flex gap-2" onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
            }}>
                  <Input placeholder={isMassMessage
                ? "Digite uma mensagem para todos os usuários..."
                : "Digite sua mensagem..."} value={newMessage} onChange={(e) => setNewMessage(e.target.value)} className="flex-1"/>
                  <Button type="submit" disabled={!newMessage.trim() || sendMessageMutation.isPending} className={isMassMessage ? "bg-orange-600 hover:bg-orange-700" : ""}>
                    {sendMessageMutation.isPending ? (<Loader2 className="h-4 w-4 animate-spin"/>) : (<>
                        <Send className="h-4 w-4 mr-2"/>
                        {isMassMessage ? "Enviar para todos" : "Enviar"}
                      </>)}
                  </Button>
                </form>
              </div>
            </>) : (<div className="flex-1 flex items-center justify-center p-8 text-center">
              <div>
                <h3 className="text-lg font-medium mb-2">Selecione uma conversa</h3>
                <p className="text-muted-foreground">
                  Escolha um contato da lista para iniciar ou continuar uma conversa
                </p>
              </div>
            </div>)}
        </div>
      </div>
    </div>);
}
//# sourceMappingURL=chat.jsx.map