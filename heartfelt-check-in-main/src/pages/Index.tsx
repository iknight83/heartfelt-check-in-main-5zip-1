import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import CheckInScreen from "@/components/CheckInScreen";
import DurationScreen from "@/components/DurationScreen";
import SupportCheckScreen from "@/components/SupportCheckScreen";
import JourneyAuthScreen from "@/components/JourneyAuthScreen";
import ReminderScreen from "@/components/ReminderScreen";
import FactorsPreviewScreen from "@/components/FactorsPreviewScreen";
import FactorSelectionScreen from "@/components/FactorSelectionScreen";
import PaywallScreen from "@/components/PaywallScreen";
import { useAuth } from "@/hooks/useAuth";

interface UserSelections {
  emotions: string[];
  duration: string | null;
  hasSupport: boolean | null;
  skippedEmotions: boolean;
  authMethod: "google" | "apple" | "anonymous" | "email" | null;
  reminderTime: string | null;
  trackingFactors: string[] | null;
  selectedPlan: "lifetime" | "annual" | "monthly" | null;
}

const Index = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [step, setStep] = useState<"emotions" | "duration" | "support" | "factorSelection" | "auth" | "reminder" | "paywall">("emotions");
  const [selections, setSelections] = useState<UserSelections>({
    emotions: [],
    duration: null,
    hasSupport: null,
    skippedEmotions: false,
    authMethod: null,
    reminderTime: null,
    trackingFactors: null,
    selectedPlan: null,
  });

  // Check if user has already completed onboarding
  useEffect(() => {
    if (loading) return;
    
    const hasCompletedOnboarding = localStorage.getItem("termsAcceptedAt");
    if (hasCompletedOnboarding) {
      // User already completed onboarding - go directly to home
      navigate("/home", { replace: true });
      return;
    }
    
    // If we reach here, user hasn't completed onboarding yet
    // They should start from the beginning (emotions)
  }, [navigate, loading]);

  const handleEmotionsContinue = (emotions: string[]) => {
    setSelections((prev) => ({ ...prev, emotions, skippedEmotions: false }));
    setStep("duration");
  };

  const handleEmotionsSkip = () => {
    setSelections((prev) => ({ ...prev, emotions: [], skippedEmotions: true }));
    setStep("duration");
  };

  const handleDurationNext = (duration: string) => {
    setSelections((prev) => ({ ...prev, duration }));
    setStep("support");
  };

  const handleSupportSelect = (hasSupport: boolean) => {
    setSelections((prev) => ({ ...prev, hasSupport }));
    setStep("factorSelection");
  };

  const handleAuthContinue = (method: "google" | "apple" | "anonymous" | "email") => {
    setSelections((prev) => ({ ...prev, authMethod: method }));
    
    // Check if user already completed onboarding before (termsAcceptedAt is set)
    const hasCompletedOnboarding = localStorage.getItem("termsAcceptedAt");
    
    // If user is authenticated with email AND already completed onboarding, they're returning - go to home
    // Otherwise, continue with onboarding (new users need to answer questions again)
    if (method === "email" && user && hasCompletedOnboarding) {
      // Existing account with completed onboarding - go straight to home
      // User's factors are already preserved in localStorage
      navigate("/home", { replace: true });
    } else {
      // New user or returning user who needs to re-do onboarding - continue to reminder
      setStep("reminder");
    }
  };

  const handleFactorSelectionContinue = (factors: string[]) => {
    setSelections((prev) => ({ ...prev, trackingFactors: factors }));
    setStep("auth");
  };

  const handleReminderEnable = (time: string) => {
    setSelections((prev) => ({ ...prev, reminderTime: time }));
    // TODO: Request notification permission here
    setStep("paywall");
  };

  const handleReminderSkip = () => {
    setSelections((prev) => ({ ...prev, reminderTime: null }));
    setStep("paywall");
  };

  const handlePaywallContinue = (plan: "lifetime" | "annual" | "monthly") => {
    setSelections((prev) => ({ ...prev, selectedPlan: plan }));
    // Mark onboarding as completed BEFORE navigating to home
    localStorage.setItem("termsAcceptedAt", new Date().toISOString());
    navigate("/home", { replace: true });
  };

  const handleRestorePurchases = () => {
    // TODO: Implement restore purchases logic
    console.log("Restore purchases requested");
  };

  const handleRegister = () => {
    // For now, treat register as email flow
    handleAuthContinue("email");
  };

  if (step === "emotions") {
    return (
      <CheckInScreen 
        onContinue={handleEmotionsContinue} 
        onSkip={handleEmotionsSkip} 
      />
    );
  }

  if (step === "duration") {
    return <DurationScreen onNext={handleDurationNext} onBack={() => setStep("emotions")} />;
  }

  if (step === "support") {
    return <SupportCheckScreen onSelect={handleSupportSelect} onBack={() => setStep("duration")} />;
  }

  if (step === "factorSelection") {
    return <FactorSelectionScreen onContinue={handleFactorSelectionContinue} onBack={() => setStep("support")} />;
  }

  if (step === "auth") {
    return <JourneyAuthScreen onContinue={handleAuthContinue} onRegister={handleRegister} onBack={() => setStep("factorSelection")} />;
  }

  if (step === "reminder") {
    return <ReminderScreen onEnable={handleReminderEnable} onSkip={handleReminderSkip} onBack={() => setStep("auth")} />;
  }

  if (step === "paywall") {
    return <PaywallScreen onContinue={handlePaywallContinue} onRestore={handleRestorePurchases} />;
  }

  return null;
};

export default Index;
