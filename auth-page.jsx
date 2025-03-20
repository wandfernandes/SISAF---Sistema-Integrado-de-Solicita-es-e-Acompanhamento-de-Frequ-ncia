import { useAuth } from "@/hooks/use-auth";
import { Redirect } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, } from "@/components/ui/select";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { insertUserSchema } from "@shared/schema";
import { z } from "zod";
// Corrigir esquema de login para usar username/password
const loginSchema = z.object({
    username: z.string().min(1, "Username is required"),
    password: z.string().min(1, "Password is required"),
});
// Usar o esquema de inserção do usuário diretamente do schema.ts
// e estender com o campo de confirmação de senha
const registerSchema = insertUserSchema.extend({
    confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
});
export default function AuthPage() {
    const { user, loginMutation, registerMutation } = useAuth();
    const loginForm = useForm({
        resolver: zodResolver(loginSchema),
        defaultValues: { username: "", password: "" },
    });
    const registerForm = useForm({
        resolver: zodResolver(registerSchema),
        defaultValues: {
            fullName: "",
            username: "",
            email: "",
            cpf: "",
            password: "",
            confirmPassword: "",
            age: 18,
            workUnit: "",
            workLocation: "",
            role: "user",
            contractType: "permanent",
            gender: "other",
        },
    });
    if (user) {
        return <Redirect to="/"/>;
    }
    return (<div className="min-h-screen grid grid-cols-2">
      <div className="flex items-center justify-center p-8">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Bem-vindo ao SISAF</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="login">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="register">Registrar</TabsTrigger>
              </TabsList>

              <TabsContent value="login">
                <form onSubmit={loginForm.handleSubmit((data) => loginMutation.mutate(data))} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="username">Usuário</Label>
                    <Input id="username" {...loginForm.register("username")} autoComplete="username"/>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Senha</Label>
                    <Input id="password" type="password" {...loginForm.register("password")} autoComplete="current-password"/>
                  </div>
                  <Button type="submit" className="w-full" disabled={loginMutation.isPending}>
                    Entrar
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="register">
                <form onSubmit={registerForm.handleSubmit((data) => {
            const { confirmPassword, ...registerData } = data;
            registerMutation.mutate(registerData);
        })} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Nome Completo</Label>
                    <Input id="fullName" {...registerForm.register("fullName")}/>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="reg-username">Usuário</Label>
                    <Input id="reg-username" {...registerForm.register("username")} autoComplete="username"/>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" {...registerForm.register("email")} autoComplete="email"/>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="cpf">CPF</Label>
                    <Input id="cpf" {...registerForm.register("cpf")} placeholder="Digite apenas os números" maxLength={11}/>
                    {registerForm.formState.errors.cpf && (<p className="text-sm text-destructive">
                        {registerForm.formState.errors.cpf.message}
                      </p>)}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="age">Idade</Label>
                    <Input id="age" type="number" min="18" max="100" {...registerForm.register("age", { valueAsNumber: true })}/>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="workUnit">Unidade de Lotação</Label>
                    <Input id="workUnit" {...registerForm.register("workUnit")}/>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="workLocation">Local de Trabalho</Label>
                    <Input id="workLocation" {...registerForm.register("workLocation")}/>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="contractType">Tipo de Contrato</Label>
                    <Select onValueChange={(value) => registerForm.setValue("contractType", value)} defaultValue="permanent">
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o tipo de contrato"/>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="permanent">Permanente</SelectItem>
                        <SelectItem value="temporary">Temporário</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="gender">Gênero</Label>
                    <Select onValueChange={(value) => registerForm.setValue("gender", value)} defaultValue="other">
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o gênero"/>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">Masculino</SelectItem>
                        <SelectItem value="female">Feminino</SelectItem>
                        <SelectItem value="other">Outro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="reg-password">Senha</Label>
                    <Input id="reg-password" type="password" {...registerForm.register("password")} autoComplete="new-password"/>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">Confirmar Senha</Label>
                    <Input id="confirm-password" type="password" {...registerForm.register("confirmPassword")} autoComplete="new-password"/>
                  </div>

                  <Button type="submit" className="w-full" disabled={registerMutation.isPending}>
                    Registrar
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      <div className="bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center p-8">
        <div className="text-white max-w-lg">
          <h1 className="text-4xl font-bold mb-4">
            Sistema de Administração Funcional
          </h1>
          <p className="text-lg opacity-90">
            O SISAF ajuda você a gerenciar solicitações, aprovações de RH e
            acompanhamento de pagamentos em um único lugar. Comece agora!
          </p>
        </div>
      </div>
    </div>);
}
//# sourceMappingURL=auth-page.jsx.map