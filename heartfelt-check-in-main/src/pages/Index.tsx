import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import CheckInScreen from "@/components/CheckInScreen";
import DurationScreen from "@/components/DurationScreen";
import SupportCheckScreen from "@/components/SupportCheckScreen";
import JourneyAuthScreen from "@/components/JourneyAuthScreen";
import ReminderScreen from "@/components/ReminderScreen";
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
  selectedPlan: "lifetime" | "annual" | "monthly" | "trial" | null;
  pendingPaymentRef: string | null;
}

type OnboardingStep = "emotions" | "duration" | "support" | "factorSelection" | "paywall" | "reminder" | "auth";

const Index = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, loading } = useAuth();
  const [step, setStep] = useState<OnboardingStep>("emotions");
  const [selections, setSelections] = useState<UserSelections>({
    emotions: [],
    duration: null,
    hasSupport: null,
    skippedEmotions: false,
    authMethod: null,
    reminderTime: null,
    trackingFactors: null,
    selectedPlan: null,
    pendingPaymentRef: null,
  });

  useEffect(() => {
    if (loading) return;
    
    const timeoutId = setTimeout(() => {
      const userId = localStorage.getItem("current_user_id");
      
      let hasCompletedOnboarding = false;
      if (userId) {
        hasCompletedOnboarding = !!localStorage.getItem(`termsAcceptedAt__${userId}`);
      }
      if (!hasCompletedOnboarding) {
        hasCompletedOnboarding = !!localStorage.getItem("termsAcceptedAt");
      }
      
      if (hasCompletedOnboarding && userId) {
        navigate("/home", { replace: true });
        return;
      }

      const continueStep = searchParams.get("continue");
      if (continueStep === "reminder") {
        setStep("reminder");
      }

      const pendingRef = localStorage.getItem("pending_transaction_ref");
      const pendingPlan = localStorage.getItem("pending_payment_plan");
      if (pendingRef && pendingPlan) {
        setSelections(prev => ({
          ...prev,
          pendingPaymentRef: pendingRef,
          selectedPlan: pendingPlan as "lifetime" | "annual" | "monthly",
        }));
      }
    }, 100);
    
    return () => clearTimeout(timeoutId);
  }, [navigate, loading, searchParams]);

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

  const handleFactorSelectionContinue = (factors: string[]) => {
    setSelections((prev) => ({ ...prev, trackingFactors: factors }));
    setStep("paywall");
  };

  const handlePaywallContinue = async (plan: "lifetime" | "annual" | "monthly" | "trial") => {
    setSelections((prev) => ({ ...prev, selectedPlan: plan }));

    if (plan === "trial") {
      localStorage.setItem("pending_plan", "trial");
      setStep("reminder");
      return;
    }

    try {
      const response = await fetch("/api/paystack/initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan, isAnonymous: true }),
      });

      const data = await response.json();

      if (data.status === "ok" && data.authorizationUrl) {
        localStorage.setItem("pending_payment_plan", plan);
        localStorage.setItem("pending_transaction_ref", data.reference);
        localStorage.setItem("pending_anon_user_id", data.userId);
        window.location.href = data.authorizationUrl;
      } else {
        console.error("Payment initiation failed:", data);
      }
    } catch (error) {
      console.error("Payment error:", error);
    }
  };

  const handleReminderEnable = (time: string) => {
    setSelections((prev) => ({ ...prev, reminderTime: time }));
    setStep("auth");
  };

  const handleReminderSkip = () => {
    setSelections((prev) => ({ ...prev, reminderTime: null }));
    setStep("auth");
  };

  const handleAuthComplete = async (method: "google" | "apple" | "anonymous" | "email") => {
    setSelections((prev) => ({ ...prev, authMethod: method }));
    
    const userId = localStorage.getItem("current_user_id");
    
    if (!userId) {
      console.error("No user ID after auth");
      return;
    }

    const pendingRef = localStorage.getItem("pending_transaction_ref");
    const pendingPlan = localStorage.getItem("pending_payment_plan") || localStorage.getItem("pending_plan");

    if (pendingRef && pendingPlan && pendingPlan !== "trial") {
      try {
        const claimResponse = await fetch("/api/paystack/claim", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reference: pendingRef, newUserId: userId }),
        });

        const claimData = await claimResponse.json();
        if (claimData.success) {
          localStorage.setItem(`deeper_insights_subscribed__${userId}`, "true");
          localStorage.setItem(`subscription_plan__${userId}`, pendingPlan);
        }
      } catch (error) {
        console.error("Failed to claim subscription:", error);
      }

      localStorage.removeItem("pending_transaction_ref");
      localStorage.removeItem("pending_payment_plan");
      localStorage.removeItem("pending_anon_user_id");
    }

    if (pendingPlan === "trial") {
      const trialKey = `trial_started_at__${userId}`;
      if (!localStorage.getItem(trialKey)) {
        localStorage.setItem(trialKey, Date.now().toString());
      }
      localStorage.removeItem("pending_plan");
    }

    const onboardingKey = `termsAcceptedAt__${userId}`;
    localStorage.setItem(onboardingKey, new Date().toISOString());

    navigate("/home", { replace: true });
  };

  const handleRestorePurchases = async () => {
    const userId = localStorage.getItem("current_user_id");
    if (!userId) return;

    try {
      const response = await fetch(`/api/paystack/subscription/${userId}`);
      const data = await response.json();
      if (data.hasSubscription) {
        localStorage.setItem(`deeper_insights_subscribed__${userId}`, "true");
        localStorage.setItem(`subscription_plan__${userId}`, data.plan);
        navigate("/home", { replace: true });
      }
    } catch (error) {
      console.error("Restore failed:", error);
    }
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

  if (step === "paywall") {
    return <PaywallScreen onContinue={handlePaywallContinue} onRestore={handleRestorePurchases} />;
  }

  if (step === "reminder") {
    return <ReminderScreen onEnable={handleReminderEnable} onSkip={handleReminderSkip} onBack={() => setStep("paywall")} />;
  }

  if (step === "auth") {
    return <JourneyAuthScreen onContinue={handleAuthComplete} onRegister={() => handleAuthComplete("email")} onBack={() => setStep("reminder")} />;
  }

  return null;
};

export default Index;
