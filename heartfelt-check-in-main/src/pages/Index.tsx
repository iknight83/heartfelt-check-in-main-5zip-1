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
  const [step, setStep] = useState<"emotions" | "duration" | "support" | "auth" | "reminder" | "factors" | "factorSelection" | "paywall">("emotions");
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

  // Check if user has already completed onboarding or is authenticated
  useEffect(() => {
    if (loading) return;
    
    const hasCompletedOnboarding = localStorage.getItem("termsAcceptedAt") && localStorage.getItem("tracked_factors");
    if (hasCompletedOnboarding) {
      navigate("/home", { replace: true });
      return;
    }
    
    // If user is authenticated but hasn't completed onboarding, skip to reminder step
    if (user && localStorage.getItem("termsAcceptedAt")) {
      setStep("reminder");
    }
  }, [navigate, user, loading]);

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
    setStep("auth");
  };

  const handleAuthContinue = (method: "google" | "apple" | "anonymous" | "email") => {
    setSelections((prev) => ({ ...prev, authMethod: method }));
    
    // If user is authenticated (existing account with sign-in), skip to home
    // For new users or anonymous, continue with onboarding
    if (method === "email" && user) {
      // Email sign-in with existing user - set onboarding as complete and go to home
      localStorage.setItem("termsAcceptedAt", new Date().toISOString());
      localStorage.setItem("tracked_factors", JSON.stringify([])); // Will be populated from their account
      navigate("/home", { replace: true });
    } else {
      // New user or anonymous - continue onboarding
      setStep("reminder");
    }
  };

  const handleReminderEnable = (time: string) => {
    setSelections((prev) => ({ ...prev, reminderTime: time }));
    // TODO: Request notification permission here
    setStep("factors");
  };

  const handleReminderSkip = () => {
    setSelections((prev) => ({ ...prev, reminderTime: null }));
    setStep("factors");
  };

  const handleFactorsChoose = () => {
    setStep("factorSelection");
  };


  const handleFactorSelectionContinue = (factors: string[]) => {
    setSelections((prev) => ({ ...prev, trackingFactors: factors }));
    setStep("paywall");
  };

  const handlePaywallContinue = (plan: "lifetime" | "annual" | "monthly") => {
    setSelections((prev) => ({ ...prev, selectedPlan: plan }));
    navigate("/home");
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

  if (step === "auth") {
    return <JourneyAuthScreen onContinue={handleAuthContinue} onRegister={handleRegister} onBack={() => setStep("support")} />;
  }

  if (step === "reminder") {
    return <ReminderScreen onEnable={handleReminderEnable} onSkip={handleReminderSkip} onBack={() => setStep("auth")} />;
  }

  if (step === "factors") {
    return <FactorsPreviewScreen onChooseFactors={handleFactorsChoose} onBack={() => setStep("reminder")} />;
  }

  if (step === "factorSelection") {
    return <FactorSelectionScreen onContinue={handleFactorSelectionContinue} onBack={() => setStep("factors")} />;
  }

  if (step === "paywall") {
    return <PaywallScreen onContinue={handlePaywallContinue} onRestore={handleRestorePurchases} />;
  }

  return null;
};

export default Index;
