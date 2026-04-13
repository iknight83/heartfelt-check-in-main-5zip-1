import { lazy, Suspense, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter, Routes, Route } from "react-router-dom";
import PageLoader from "@/components/ui/PageLoader";

import { initRevenueCat } from "@/services/revenueCatService";
import Index from "./pages/Index";
import Home from "./pages/Home";
import MoodDetail from "./pages/MoodDetail";
import TriggerSelection from "./pages/TriggerSelection";
import MoodAdjust from "./pages/MoodAdjust";

const Insights = lazy(() => import("./pages/Insights"));
const Paywall = lazy(() => import("./pages/Paywall"));
const Profile = lazy(() => import("./pages/Profile"));
const SettingsTrackedFactors = lazy(() => import("./pages/SettingsTrackedFactors"));
const SettingsNotifications = lazy(() => import("./pages/SettingsNotifications"));
const SettingsPrivacy = lazy(() => import("./pages/SettingsPrivacy"));
const SettingsAccount = lazy(() => import("./pages/SettingsAccount"));
const SettingsInsights = lazy(() => import("./pages/SettingsInsights"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const TermsOfUse = lazy(() => import("./pages/TermsOfUse"));
const HelpFeedback = lazy(() => import("./pages/HelpFeedback"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const PaymentSuccess = lazy(() => import("./pages/PaymentSuccess"));
const PaymentCancel = lazy(() => import("./pages/PaymentCancel"));
const PaymentError = lazy(() => import("./pages/PaymentError"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient();

const App = () => {
  useEffect(() => {
    initRevenueCat();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <HashRouter>
          <Suspense fallback={<PageLoader />}>
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
              <Route path="/payment/success" element={<PaymentSuccess />} />
              <Route path="/payment/cancel" element={<PaymentCancel />} />
              <Route path="/payment/error" element={<PaymentError />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </HashRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
