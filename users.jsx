import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Sidebar } from "@/components/nav/sidebar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Loader2, CheckCircle2, XCircle, Key, Edit2 } from "lucide-react";
function UsersPage() {
    const { user } = useAuth();
    const { toast } = useToast();
    const [resetPasswordDialog, setResetPasswordDialog] = useState({ isOpen: false });
    const [editUserDialog, setEditUserDialog] = useState({ isOpen: false });
    const { data: users, isLoading } = useQuery({
        queryKey: ["/api/users"],
        enabled: user?.role === "admin",
    });
    const updateUser = useMutation({
        mutationFn: async ({ id, updates, }) => {
            const res = await apiRequest("PATCH", `/api/users/${id}`, updates);
            if (!res.ok) {
                const error = await res.text();
                throw new Error(error);
            }
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/users"] });
            toast({
                title: "Sucesso",
                description: "Usuário atualizado com sucesso",
            });
            setEditUserDialog({ isOpen: false, user: undefined });
        },
        onError: (error) => {
            toast({
                title: "Erro",
                description: error.message,
                variant: "destructive",
            });
        },
    });
    const resetPassword = useMutation({
        mutationFn: async (userId) => {
            const res = await apiRequest("POST", `/api/users/${userId}/reset-password`);
            if (!res.ok) {
                const error = await res.text();
                throw new Error(error);
            }
            return res.json();
        },
        onSuccess: (data) => {
            setResetPasswordDialog({
                isOpen: true,
                userId: resetPasswordDialog.userId,
                newPassword: data.newPassword,
            });
            toast({
                title: "Sucesso",
                description: "Senha resetada com sucesso",
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
    if (!user || user.role !== "admin") {
        return (<div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-2">Acesso Negado</h1>
          <p className="text-muted-foreground">
            Apenas administradores podem acessar o gerenciamento de usuários.
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
        <h1 className="text-3xl font-bold mb-8">Gerenciamento de Usuários</h1>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Usuário</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Tipo de Contrato</TableHead>
                <TableHead>Função</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users?.map((user) => (<TableRow key={user.id}>
                  <TableCell>{user.username}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Select value={user.contractType} onValueChange={(value) => updateUser.mutate({
                id: user.id,
                updates: { contractType: value },
            })}>
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="temporary">Temporário</SelectItem>
                        <SelectItem value="permanent">Permanente</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Select value={user.role} onValueChange={(value) => updateUser.mutate({
                id: user.id,
                updates: { role: value },
            })}>
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="user">Usuário</SelectItem>
                        <SelectItem value="hr">RH</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${user.status === "approved"
                ? "bg-green-100 text-green-800"
                : user.status === "rejected"
                    ? "bg-red-100 text-red-800"
                    : "bg-yellow-100 text-yellow-800"}`}>
                      {user.status === "approved"
                ? "Aprovado"
                : user.status === "rejected"
                    ? "Rejeitado"
                    : "Pendente"}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      {user.status === "pending" && (<>
                          <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => updateUser.mutate({
                    id: user.id,
                    updates: { status: "approved" },
                })}>
                            <CheckCircle2 className="h-4 w-4 mr-1"/>
                            Aprovar
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => updateUser.mutate({
                    id: user.id,
                    updates: { status: "rejected" },
                })}>
                            <XCircle className="h-4 w-4 mr-1"/>
                            Rejeitar
                          </Button>
                        </>)}
                      <Button size="sm" variant="outline" onClick={() => {
                setResetPasswordDialog({ isOpen: true, userId: user.id });
                resetPassword.mutate(user.id);
            }}>
                        <Key className="h-4 w-4 mr-1"/>
                        Resetar Senha
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setEditUserDialog({ isOpen: true, user })}>
                        <Edit2 className="h-4 w-4 mr-1"/>
                        Editar
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>))}
            </TableBody>
          </Table>
        </div>

        <Dialog open={resetPasswordDialog.isOpen} onOpenChange={(open) => setResetPasswordDialog({ isOpen: open, userId: undefined, newPassword: undefined })}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Senha Resetada</DialogTitle>
              <DialogDescription>
                A nova senha é: <strong>{resetPasswordDialog.newPassword}</strong>
                <br />
                Certifique-se de fornecer esta senha ao usuário de forma segura.
              </DialogDescription>
            </DialogHeader>
          </DialogContent>
        </Dialog>

        <Dialog open={editUserDialog.isOpen} onOpenChange={(open) => setEditUserDialog({ isOpen: open, user: undefined })}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar Usuário</DialogTitle>
            </DialogHeader>
            {editUserDialog.user && (<form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                updateUser.mutate({
                    id: editUserDialog.user.id,
                    updates: {
                        username: formData.get("username"),
                        email: formData.get("email"),
                        fullName: formData.get("fullName"),
                        cpf: formData.get("cpf"),
                        workUnit: formData.get("workUnit"),
                    },
                });
            }} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="username">Nome de Usuário</Label>
                  <Input id="username" name="username" defaultValue={editUserDialog.user.username}/>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" name="email" type="email" defaultValue={editUserDialog.user.email}/>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fullName">Nome Completo</Label>
                  <Input id="fullName" name="fullName" defaultValue={editUserDialog.user.fullName}/>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cpf">CPF</Label>
                  <Input id="cpf" name="cpf" defaultValue={editUserDialog.user.cpf} maxLength={11}/>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="workUnit">Unidade de Trabalho</Label>
                  <Input id="workUnit" name="workUnit" defaultValue={editUserDialog.user.workUnit}/>
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setEditUserDialog({ isOpen: false, user: undefined })}>
                    Cancelar
                  </Button>
                  <Button type="submit">Salvar</Button>
                </div>
              </form>)}
          </DialogContent>
        </Dialog>
      </div>
    </div>);
}
export default UsersPage;
//# sourceMappingURL=users.jsx.map