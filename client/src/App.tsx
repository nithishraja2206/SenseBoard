import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/Dashboard";
import MoodCanvas from "@/pages/MoodCanvas";
import FlowMapView from "@/pages/FlowMapView";
import Profile from "@/pages/Profile";
import AppLayout from "@/components/layout/AppLayout";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/project/:projectId">
        {(params) => <Dashboard projectId={params.projectId} />}
      </Route>
      {/* <Route path="/moodboard/:moodBoardId">
        {(params) => <MoodCanvas moodBoardId={params.moodBoardId} />}
      </Route> */}
      <Route path="/project/:projectId/moodboard/:moodBoardId">
        {(params) => (
          <MoodCanvas
            projectId={params.projectId}
            moodBoardId={params.moodBoardId}
          />
        )}
      </Route>
      <Route path="/flowmap/:moodBoardId">
        {(params) => <FlowMapView moodBoardId={params.moodBoardId} />}
      </Route>
      <Route path="/profile" component={Profile} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <AppLayout>
          <Router />
        </AppLayout>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
