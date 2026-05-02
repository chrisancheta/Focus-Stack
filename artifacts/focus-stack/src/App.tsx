import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppStoreProvider, useAppStore } from "@/lib/storeContext";
import { AppShell } from "@/components/layout/AppShell";
import NotFound from "@/pages/not-found";

import WelcomePage from "@/pages/WelcomePage";
import SetupPage from "@/pages/SetupPage";
import HomePage from "@/pages/HomePage";
import FocusPage from "@/pages/FocusPage";
import TrendsPage from "@/pages/TrendsPage";
import SettingsPage from "@/pages/SettingsPage";

const queryClient = new QueryClient();

function RouteGuard() {
  const { state } = useAppStore();
  const isSetup = state.settings !== null;

  return (
    <AppShell>
      <Switch>
        <Route path="/">
          {isSetup ? <Redirect to="/home" /> : <Redirect to="/welcome" />}
        </Route>
        <Route path="/welcome" component={WelcomePage} />
        <Route path="/setup" component={SetupPage} />
        
        <Route path="/home" component={HomePage} />
        <Route path="/focus" component={FocusPage} />
        <Route path="/trends" component={TrendsPage} />
        <Route path="/settings" component={SettingsPage} />

        <Route component={NotFound} />
      </Switch>
    </AppShell>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AppStoreProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <RouteGuard />
          </WouterRouter>
          <Toaster />
        </AppStoreProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
