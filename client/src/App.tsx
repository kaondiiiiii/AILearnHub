import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "@/lib/protected-route";
import HomePage from "@/pages/home-page";
import AuthPage from "@/pages/auth-page";
import FlashcardsPage from "@/pages/flashcards-page";
import QuizzesPage from "@/pages/quizzes-page";
import LessonsPage from "@/pages/lessons-page";
import AiTutorPage from "@/pages/ai-tutor-page";
import AnalyticsPage from "@/pages/analytics-page";
import MindMapPage from "@/pages/mind-map-page";
import ToolsPage from "@/pages/tools-page";
import ToolDetailPage from "@/pages/tool-detail-page";
import NotFound from "@/pages/not-found";
import TextExplainer from "@/components/ai/text-explainer";

function Router() {
  return (
    <Switch>
      <ProtectedRoute path="/" component={HomePage} />
      <ProtectedRoute path="/flashcards" component={FlashcardsPage} />
      <ProtectedRoute path="/quizzes" component={QuizzesPage} />
      <ProtectedRoute path="/lessons" component={LessonsPage} />
      <ProtectedRoute path="/ai-tutor" component={AiTutorPage} />
      <ProtectedRoute path="/analytics" component={AnalyticsPage} />
      <ProtectedRoute path="/mind-map" component={MindMapPage} />
      <ProtectedRoute path="/tools" component={ToolsPage} />
      <ProtectedRoute path="/tool" component={ToolDetailPage} />
      <Route path="/auth" component={AuthPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <TextExplainer />
          <Router />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
