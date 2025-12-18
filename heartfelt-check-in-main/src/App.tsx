import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Home from "./pages/Home";
import MoodDetail from "./pages/MoodDetail";
import TriggerSelection from "./pages/TriggerSelection";
import MoodAdjust from "./pages/MoodAdjust";
import Insights from "./pages/Insights";
import Paywall from "./pages/Paywall";
import Profile from "./pages/Profile";
import SettingsTrackedFactors from "./pages/SettingsTrackedFactors";
import SettingsNotifications from "./pages/SettingsNotifications";
import SettingsPrivacy from "./pages/SettingsPrivacy";
import SettingsAccount from "./pages/SettingsAccount";
import SettingsInsights from "./pages/SettingsInsights";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfUse from "./pages/TermsOfUse";
import HelpFeedback from "./pages/HelpFeedback";
import ResetPassword from "./pages/ResetPassword";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/home" element={<Home />} />
          <Route path="/mood" element={<MoodDetail />} />
          <Route path="/triggers" element={<TriggerSelection />} />
          <Route path="/mood-adjust" element={<MoodAdjust />} />
          <Route path="/insights" element={<Insights />} />
          <Route path="/paywall" element={<Paywall />} />
          <Route path="/you" element={<Profile />} />
          <Route path="/settings/tracked-factors" element={<SettingsTrackedFactors />} />
          <Route path="/settings/notifications" element={<SettingsNotifications />} />
          <Route path="/settings/privacy" element={<SettingsPrivacy />} />
          <Route path="/settings/account" element={<SettingsAccount />} />
          <Route path="/settings/insights" element={<SettingsInsights />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/terms-of-use" element={<TermsOfUse />} />
          <Route path="/help-feedback" element={<HelpFeedback />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
