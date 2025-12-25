import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { LanguageProvider } from "./contexts/LanguageContext";
import { GoogleMapsProvider } from "./contexts/GoogleMapsContext";
import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";
import Intro from "./pages/Intro";
import Auth from "./pages/Auth";
import Today from "./pages/Today";
import MapPage from "./pages/MapPage";
import Twin from "./pages/Twin";
import HistoryPage from "./pages/HistoryPage";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AuthProvider>
              <GoogleMapsProvider>
                <Routes>
                  <Route path="/" element={<Intro />} />
                  <Route path="/auth" element={<Auth />} />
                  <Route element={
                    <ProtectedRoute>
                      <Layout />
                    </ProtectedRoute>
                  }>
                    <Route path="/today" element={<Today />} />
                    <Route path="/map" element={<MapPage />} />
                    <Route path="/twin" element={<Twin />} />
                    <Route path="/history" element={<HistoryPage />} />
                    <Route path="/profile" element={<Profile />} />
                  </Route>
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </GoogleMapsProvider>
            </AuthProvider>
          </BrowserRouter>
        </TooltipProvider>
      </LanguageProvider>
    </QueryClientProvider>
  );
};

export default App;
