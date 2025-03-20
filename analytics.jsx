import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Sidebar } from "@/components/nav/sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, } from "recharts";
import { Loader2, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
const COLORS = [
    "hsl(var(--primary))",
    "hsl(var(--secondary))",
    "hsl(var(--accent))",
    "hsl(var(--destructive))",
    "hsl(var(--success))",
    "hsl(var(--warning))",
    "hsl(var(--info))",
];
// Função para formatar strings de status para exibição
const formatStatus = (status) => {
    switch (status) {
        case "pending": return "Pendente";
        case "approved": return "Aprovado";
        case "rejected": return "Rejeitado";
        case "in_progress": return "Em Andamento";
        case "completed": return "Concluído";
        case "canceled": return "Cancelado";
        default: return status.charAt(0).toUpperCase() + status.slice(1);
    }
};
export default function Analytics() {
    const { user } = useAuth();
    // Verificar se o usuário está autenticado e tem permissão de admin ou HR
    if (!user) {
        return (<div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-2">Acesso Negado</h1>
          <p className="text-muted-foreground">
            Faça login para acessar as análises.
          </p>
        </div>
      </div>);
    }
    // Verificação adicional para garantir que apenas admin e HR possam acessar
    if (user.role !== "admin" && user.role !== "hr") {
        return (<div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-2">Acesso Restrito</h1>
          <p className="text-muted-foreground">
            Esta área é reservada para administradores e RH.
          </p>
        </div>
      </div>);
    }
    const { data: requestAnalytics, isLoading: isLoadingRequests } = useQuery({
        queryKey: ["/api/analytics/requests"],
    });
    const { data: vacationAnalytics, isLoading: isLoadingVacations } = useQuery({
        queryKey: ["/api/analytics/vacations"],
    });
    const { data: medicalAnalytics, isLoading: isLoadingMedical } = useQuery({
        queryKey: ["/api/analytics/medical-leaves"],
    });
    // Novo query para licenças
    const { data: licenseAnalytics, isLoading: isLoadingLicenses } = useQuery({
        queryKey: ["/api/analytics/licenses"],
    });
    // Apenas admin e HR podem ver analytics de gestão
    const { data: managementAnalytics, isLoading: isLoadingManagement } = useQuery({
        queryKey: ["/api/analytics/management"],
        enabled: user.role === "admin" || user.role === "hr",
    });
    if (isLoadingRequests || isLoadingVacations || isLoadingMedical || isLoadingLicenses || isLoadingManagement ||
        !requestAnalytics || !vacationAnalytics || !medicalAnalytics || !licenseAnalytics) {
        return (<div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin"/>
      </div>);
    }
    return (<div className="flex h-screen bg-background">
      <Sidebar />
      <div className="flex-1 overflow-auto p-8">
        <h1 className="text-3xl font-bold mb-8">Analytics & Reports</h1>

        {/* Tabs para organizar diferentes tipos de análises */}
        <Tabs defaultValue="overview" className="mb-8">
          <TabsList className="mb-4">
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="vacations">Férias</TabsTrigger>
            <TabsTrigger value="medicalLeaves">Licenças Médicas</TabsTrigger>
            <TabsTrigger value="licenses">Licenças</TabsTrigger>
            <TabsTrigger value="management">Gestão</TabsTrigger>
          </TabsList>

          {/* Tab Visão Geral */}
          <TabsContent value="overview">
            {/* Critical Alerts Section - Apenas para admin e HR */}
            {managementAnalytics && managementAnalytics.criticalAlerts.length > 0 && (<div className="mb-8">
                <h2 className="text-xl font-semibold mb-4">Alertas Críticos</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {managementAnalytics.criticalAlerts.map((alert, index) => (<Card key={index} className="border-l-4 border-destructive">
                      <CardContent className="pt-6">
                        <div className="flex items-start gap-4">
                          <AlertTriangle className="h-5 w-5 text-destructive"/>
                          <div>
                            <h3 className="font-medium">{alert.message}</h3>
                            <p className="text-sm text-muted-foreground">
                              Unidades afetadas: {alert.affectedUnits.join(", ")}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>))}
                </div>
              </div>)}

            {/* Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium">Taxa Média de Aprovação</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {vacationAnalytics.approvalRate.toFixed(1)}%
                  </div>
                  <Progress value={vacationAnalytics.approvalRate} className="h-2 mt-2"/>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium">Em Férias Atualmente</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {vacationAnalytics.currentlyOnVacation}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium">Tempo Médio de Aprovação</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {Math.round(vacationAnalytics.averageApprovalTime)} dias
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium">Total de Licenças Médicas</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {medicalAnalytics.totalLeaves}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Monthly Trends */}
            <div className="grid grid-cols-1 gap-6 mb-8">
              <Card>
                <CardHeader>
                  <CardTitle>Tendências Mensais</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart>
                        <CartesianGrid strokeDasharray="3 3"/>
                        <XAxis dataKey="month"/>
                        <YAxis yAxisId="left"/>
                        <YAxis yAxisId="right" orientation="right"/>
                        <Tooltip />
                        <Legend />
                        <Line yAxisId="left" type="monotone" data={vacationAnalytics.vacationsByMonth} dataKey="count" stroke="hsl(var(--primary))" name="Férias"/>
                        <Line yAxisId="right" type="monotone" data={medicalAnalytics.leavesByMonth} dataKey="count" stroke="hsl(var(--destructive))" name="Licenças Médicas"/>
                        {licenseAnalytics && (<Line yAxisId="left" type="monotone" data={licenseAnalytics.licensesByMonth} dataKey="count" stroke="hsl(var(--success))" name="Licenças"/>)}
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Tab Férias */}
          <TabsContent value="vacations">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <Card>
                <CardHeader>
                  <CardTitle>Status das Férias</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={vacationAnalytics.vacationsByStatus} dataKey="count" nameKey="status" cx="50%" cy="50%" outerRadius={80} label={({ status }) => formatStatus(status)}>
                          {vacationAnalytics.vacationsByStatus.map((entry, index) => (<Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]}/>))}
                        </Pie>
                        <Tooltip />
                        <Legend formatter={(value) => formatStatus(value)}/>
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Férias por Localização</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={vacationAnalytics.vacationsByWorkLocation}>
                        <CartesianGrid strokeDasharray="3 3"/>
                        <XAxis dataKey="location"/>
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="count" fill="hsl(var(--primary))"/>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Períodos Críticos de Férias</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {vacationAnalytics.criticalPeriods.length > 0 ? (vacationAnalytics.criticalPeriods.map((period, index) => (<Card key={index} className="border-l-4 border-warning">
                        <CardContent className="py-3">
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="font-medium">
                                {period.startDate} a {period.endDate}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {period.count} servidores de férias simultaneamente
                              </p>
                            </div>
                            <Badge variant="outline">{period.count} servidores</Badge>
                          </div>
                        </CardContent>
                      </Card>))) : (<p className="text-muted-foreground">Nenhum período crítico identificado.</p>)}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab Licenças Médicas */}
          <TabsContent value="medicalLeaves">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <Card>
                <CardHeader>
                  <CardTitle>Licenças Médicas por Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={medicalAnalytics.leavesByStatus} dataKey="count" nameKey="status" cx="50%" cy="50%" outerRadius={80} label={({ status }) => formatStatus(status)}>
                          {medicalAnalytics.leavesByStatus.map((entry, index) => (<Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]}/>))}
                        </Pie>
                        <Tooltip />
                        <Legend formatter={(value) => formatStatus(value)}/>
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Licenças Médicas por Tipo</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={medicalAnalytics.leavesByType}>
                        <CartesianGrid strokeDasharray="3 3"/>
                        <XAxis dataKey="type"/>
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="count" fill="hsl(var(--destructive))"/>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Tempo de Processamento por Mês</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={medicalAnalytics.processingTimeByMonth}>
                      <CartesianGrid strokeDasharray="3 3"/>
                      <XAxis dataKey="month"/>
                      <YAxis label={{ value: 'Dias', angle: -90, position: 'insideLeft' }}/>
                      <Tooltip />
                      <Line type="monotone" dataKey="days" stroke="hsl(var(--destructive))" name="Dias de Processamento"/>
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab Licenças - Nova seção */}
          <TabsContent value="licenses">
            {licenseAnalytics ? (<>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm font-medium">Total de Licenças</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {licenseAnalytics.totalLicenses}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm font-medium">Taxa de Aprovação</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {licenseAnalytics.approvalRate?.toFixed(1) || 0}%
                      </div>
                      <Progress value={licenseAnalytics.approvalRate || 0} className="h-2 mt-2"/>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm font-medium">Tempo Médio de Processamento</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {Math.round(licenseAnalytics.averageProcessingTime || 0)} dias
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm font-medium">Licenças Pendentes</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {licenseAnalytics.licensesByStatus?.find(s => s.status === "pending")?.count || 0}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                  <Card>
                    <CardHeader>
                      <CardTitle>Licenças por Status</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie data={licenseAnalytics.licensesByStatus} dataKey="count" nameKey="status" cx="50%" cy="50%" outerRadius={80} label={({ status }) => formatStatus(status)}>
                              {licenseAnalytics.licensesByStatus?.map((entry, index) => (<Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]}/>))}
                            </Pie>
                            <Tooltip />
                            <Legend formatter={(value) => formatStatus(value)}/>
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Licenças por Motivo</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={licenseAnalytics.licensesByReason}>
                            <CartesianGrid strokeDasharray="3 3"/>
                            <XAxis dataKey="reason"/>
                            <YAxis />
                            <Tooltip />
                            <Bar dataKey="count" fill="hsl(var(--success))"/>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>Licenças por Unidade</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={licenseAnalytics.licensesByUnit}>
                          <CartesianGrid strokeDasharray="3 3"/>
                          <XAxis dataKey="unit"/>
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="count" fill="hsl(var(--info))"/>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </>) : (<div className="text-center py-12">
                <p className="text-muted-foreground">Dados de licenças não disponíveis.</p>
              </div>)}
          </TabsContent>

          {/* Tab Gestão */}
          <TabsContent value="management">
            {managementAnalytics && (<>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                  <Card>
                    <CardHeader>
                      <CardTitle>Taxa de Absenteísmo por Unidade</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={managementAnalytics.absenteeismRate}>
                            <CartesianGrid strokeDasharray="3 3"/>
                            <XAxis dataKey="unit"/>
                            <YAxis />
                            <Tooltip />
                            <Bar dataKey="rate" fill="hsl(var(--primary))" name="Taxa (%)"/>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Tempo Médio de Processamento por Tipo</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={managementAnalytics.processingTimes}>
                            <CartesianGrid strokeDasharray="3 3"/>
                            <XAxis dataKey="type"/>
                            <YAxis />
                            <Tooltip />
                            <Bar dataKey="averageDays" fill="hsl(var(--info))" name="Dias"/>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="mb-8">
                  <h2 className="text-xl font-semibold mb-4">Visão Geral por Unidade</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {managementAnalytics.unitOverview.map((unit, index) => (<Card key={index}>
                        <CardHeader>
                          <CardTitle className="text-lg">{unit.unit}</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Total de Servidores</span>
                              <span className="font-medium">{unit.totalEmployees}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Ausentes Hoje</span>
                              <span className="font-medium">{unit.currentlyAbsent}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Ausências Planejadas</span>
                              <span className="font-medium">{unit.plannedAbsences}</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>))}
                  </div>
                </div>
              </>)}
          </TabsContent>
        </Tabs>
      </div>
    </div>);
}
//# sourceMappingURL=analytics.jsx.map