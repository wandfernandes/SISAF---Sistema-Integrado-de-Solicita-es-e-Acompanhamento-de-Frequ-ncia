import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Sidebar } from "@/components/nav/sidebar";
import { Button } from "@/components/ui/button";
import { widgets } from "@/components/dashboard/widgets";
import { Loader2, Settings2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
const defaultWidgets = [
    "upcoming_vacations",
    "recent_medical_leaves",
    "vacation_balance",
];
// Widgets disponíveis por role
const roleWidgets = {
    admin: [
        "upcoming_vacations",
        "recent_medical_leaves",
        "vacation_balance",
        "vacation_calendar",
        "medical_leave_history",
        "work_unit_summary",
        "notifications",
    ],
    hr: [
        "upcoming_vacations",
        "recent_medical_leaves",
        "vacation_balance",
        "vacation_calendar",
        "work_unit_summary",
        "notifications",
    ],
    user: [
        "upcoming_vacations",
        "recent_medical_leaves",
        "vacation_balance",
        "notifications",
    ],
};
export default function Dashboard() {
    const { user } = useAuth();
    const { toast } = useToast();
    const [isCustomizing, setIsCustomizing] = useState(false);
    const [selectedWidgets, setSelectedWidgets] = useState(defaultWidgets);
    const { data: preferences } = useQuery({
        queryKey: ["/api/user/preferences"],
        enabled: !!user,
    });
    // Busca dados de férias com informações dos usuários
    const { data: vacations, isLoading: isLoadingVacations } = useQuery({
        queryKey: ["/api/vacation-periods"],
        enabled: !!user,
        select: (data) => {
            if (!data)
                return [];
            // Adicionar nome do usuário se disponível
            return data.map((vacation) => ({
                ...vacation,
                userName: vacation.userName || vacation.userFullName || "Servidor"
            }));
        }
    });
    // Busca atestados com informações dos usuários
    const { data: medicalLeaves, isLoading: isLoadingLeaves } = useQuery({
        queryKey: ["/api/medical-leaves"],
        enabled: !!user,
        select: (data) => {
            if (!data)
                return [];
            // Mapear os dados para incluir o nome do usuário
            return data.map((leave) => ({
                ...leave,
                // O back-end já está enviando userName, mas vamos garantir que tenha um valor
                userName: leave.userName || "Servidor"
            }));
        }
    });
    const updatePreferences = useMutation({
        mutationFn: async (widgets) => {
            const response = await apiRequest("POST", "/api/user/preferences", {
                dashboardLayout: widgets,
            });
            return response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/user/preferences"] });
            setIsCustomizing(false);
            toast({
                title: "Sucesso",
                description: "Preferências atualizadas com sucesso",
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
    const activeWidgets = preferences?.dashboardLayout || selectedWidgets;
    const availableWidgets = roleWidgets[user?.role || "user"];
    if (isLoadingVacations || isLoadingLeaves) {
        return (<div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin"/>
      </div>);
    }
    return (<div className="flex h-screen bg-background">
      <Sidebar />
      <div className="flex-1 overflow-auto p-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <Dialog open={isCustomizing} onOpenChange={setIsCustomizing}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Settings2 className="h-4 w-4 mr-2"/>
                Personalizar
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Personalizar Dashboard</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-4">
                  {availableWidgets.map((key) => (<div key={key} className="flex items-center space-x-2">
                      <Checkbox id={key} checked={selectedWidgets.includes(key)} onCheckedChange={(checked) => {
                if (checked) {
                    setSelectedWidgets([...selectedWidgets, key]);
                }
                else {
                    setSelectedWidgets(selectedWidgets.filter((w) => w !== key));
                }
            }}/>
                      <Label htmlFor={key}>
                        {key
                .split("_")
                .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                .join(" ")}
                      </Label>
                    </div>))}
                </div>
                <Button className="w-full" onClick={() => updatePreferences.mutate(selectedWidgets)} disabled={updatePreferences.isPending}>
                  {updatePreferences.isPending ? (<>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin"/>
                      Salvando...
                    </>) : ("Salvar Preferências")}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {activeWidgets.filter(widget => availableWidgets.includes(widget)).map((widgetKey) => {
            const Widget = widgets[widgetKey];
            return (<Widget key={widgetKey} data={widgetKey === "upcoming_vacations" || widgetKey === "vacation_balance"
                    ? vacations
                    : widgetKey === "recent_medical_leaves"
                        ? medicalLeaves
                        : null} isLoading={isLoadingVacations || isLoadingLeaves} userRole={user?.role}/>);
        })}
        </div>
      </div>
    </div>);
}
//# sourceMappingURL=dashboard.jsx.map