import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "./hooks/use-auth";
import { WebSocketProvider } from "./context/websocket-context";
import { ThemeProvider } from "./hooks/use-theme";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth-page";
import Dashboard from "@/pages/dashboard";
import VacationRequests from "@/pages/vacation";
import Approvals from "@/pages/approvals";
import Payments from "@/pages/payments";
import Analytics from "@/pages/analytics";
import UsersPage from "@/pages/users";
import MedicalLeaves from "@/pages/medical-leave";
import HRApproval from "@/pages/hr-approval";
import FirebaseTest from "@/pages/firebase-test";
import NotificationsManager from "@/pages/notifications-manager";
import ChatPage from "@/pages/chat"; // Importando a página de chat
import { ProtectedRoute } from "./lib/protected-route";
function Router() {
    return (<Switch>
      <Route path="/auth" component={AuthPage}/>
      <ProtectedRoute path="/" component={Dashboard}/>
      <ProtectedRoute path="/vacation" component={VacationRequests}/>
      <ProtectedRoute path="/approvals" component={Approvals}/>
      <ProtectedRoute path="/payments" component={Payments}/>
      <ProtectedRoute path="/analytics" component={Analytics}/>
      <ProtectedRoute path="/users" component={UsersPage}/>
      <ProtectedRoute path="/medical-certificate" component={MedicalLeaves}/>
      <ProtectedRoute path="/hr-approval" component={HRApproval}/> 
      <ProtectedRoute path="/firebase-test" component={FirebaseTest}/> 
      <ProtectedRoute path="/notifications-manager" component={NotificationsManager}/> 
      <ProtectedRoute path="/chat" component={ChatPage}/> {/* Nova rota para o chat */}
      <Route component={NotFound}/>
    </Switch>);
}
function App() {
    return (<QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <WebSocketProvider>
            <Router />
            <Toaster />
          </WebSocketProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>);
}
export default App;
//# sourceMappingURL=App.jsx.map