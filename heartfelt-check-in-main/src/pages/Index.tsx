import { useState, useEffect, useLayoutEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import CheckInScreen from "@/components/CheckInScreen";
import DurationScreen from "@/components/DurationScreen";
import SupportCheckScreen from "@/components/SupportCheckScreen";
import JourneyAuthScreen from "@/components/JourneyAuthScreen";
import FactorSelectionScreen from "@/components/FactorSelectionScreen";
import PaywallScreen from "@/components/PaywallScreen";
import OnboardingSkeleton from "@/components/OnboardingSkeleton";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";

interface UserSelections {
  emotions: string[];
  duration: string | null;
  hasSupport: boolean | null;
  skippedEmotions: boolean;
  authMethod: "google" | "apple" | "anonymous" | "email" | null;
  trackingFactors: string[] | null;
  selectedPlan: "lifetime" | "annual" | "monthly" | "trial" | null;
  pendingPaymentRef: string | null;
}

type OnboardingStep = "emotions" | "duration" | "support" | "factorSelection" | "auth" | "paywall";

const Index = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  const { isSubscribed, isTrialActive, refreshSubscription } = useSubscription(user?.id);
  const [step, setStep] = useState<OnboardingStep>("emotions");
  const [checkingAccess, setCheckingAccess] = useState(true);
  const [accessCheckComplete, setAccessCheckComplete] = useState(false);
  const [selections, setSelections] = useState<UserSelections>({
    emotions: [],
    duration: null,
    hasSupport: null,
    skippedEmotions: false,
    authMethod: null,
    trackingFactors: null,
    selectedPlan: null,
    pendingPaymentRef: null,
  });

  useLayoutEffect(() => {
    const userId = localStorage.getItem("current_user_id");
    if (userId) {
      const hasCompletedOnboarding = !!localStorage.getItem(`termsAcceptedAt__${userId}`) || 
                                      !!localStorage.getItem("termsAcceptedAt");
      if (hasCompletedOnboarding) {
        navigate("/home", { replace: true });
      }
    }
  }, [navigate]);

  useEffect(() => {
    if (authLoading) return;
    
    const checkUserAccess = async () => {
      const userId = user?.id || localStorage.getItem("current_user_id");
      
      if (!userId) {
        setCheckingAccess(false);
        setAccessCheckComplete(true);
        return;
      }

      let hasCompletedOnboarding = !!localStorage.getItem(`termsAcceptedAt__${userId}`) || 
                                    !!localStorage.getItem("termsAcceptedAt");
      
      if (hasCompletedOnboarding) {
        navigate("/home", { replace: true });
        return;
      }

      await refreshSubscription(userId);
      
      setAccessCheckComplete(true);
    };
    
    checkUserAccess();
  }, [authLoading, user, navigate, refreshSubscription]);
  
  useEffect(() => {
    if (!accessCheckComplete) return;
    
    const userId = user?.id || localStorage.getItem("current_user_id");
    if (!userId) {
      setCheckingAccess(false);
      return;
    }
    
    const hasActiveAccess = isSubscribed || isTrialActive;
    
    if (hasActiveAccess) {
      localStorage.setItem(`termsAcceptedAt__${userId}`, new Date().toISOString());
      navigate("/home", { replace: true });
      return;
    }
    
    setCheckingAccess(false);
  }, [accessCheckComplete, isSubscribed, isTrialActive, user, navigate, searchParams]);

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
    setStep("auth");
  };

  const handleAuthComplete = async (method: "google" | "apple" | "anonymous" | "email") => {
    setSelections((prev) => ({ ...prev, authMethod: method }));
    
    const userId = localStorage.getItem("current_user_id");
    
    if (!userId) {
      console.error("No user ID after auth");
      return;
    }

    setStep("paywall");
  };

  const handlePaywallContinue = async (plan: "lifetime" | "annual" | "monthly" | "trial") => {
    setSelections((prev) => ({ ...prev, selectedPlan: plan }));
    
    const userId = localStorage.getItem("current_user_id");
    
    if (!userId) {
      console.error("No user ID - auth required before paywall");
      setStep("auth");
      return;
    }

    if (plan === "trial") {
      try {
        const response = await fetch("/api/paystack/trial/start", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId }),
        });
        
        const data = await response.json();
        
        if (data.success && data.trialStartedAt) {
          const trialKey = `trial_started_at__${userId}`;
          const trialStart = new Date(data.trialStartedAt).getTime();
          localStorage.setItem(trialKey, trialStart.toString());
        }
      } catch (error) {
        console.error("Failed to start trial:", error);
      }
      completeOnboarding();
      return;
    }

    try {
      const response = await fetch("/api/paystack/initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, plan }),
      });

      const data = await response.json();

      if (data.status === "ok" && data.authorizationUrl) {
        localStorage.setItem("pending_payment_plan", plan);
        localStorage.setItem("pending_transaction_ref", data.reference);
        window.location.href = data.authorizationUrl;
      } else {
        console.error("Payment initiation failed:", data);
      }
    } catch (error) {
      console.error("Payment error:", error);
    }
  };

  const completeOnboarding = () => {
    const userId = localStorage.getItem("current_user_id");
    if (userId) {
      const onboardingKey = `termsAcceptedAt__${userId}`;
      localStorage.setItem(onboardingKey, new Date().toISOString());
    }
    localStorage.removeItem("pending_payment_plan");
    localStorage.removeItem("pending_transaction_ref");
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

  if (authLoading || checkingAccess) {
    return <OnboardingSkeleton />;
  }

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
    return <JourneyAuthScreen onContinue={handleAuthComplete} onRegister={() => handleAuthComplete("email")} onBack={() => setStep("factorSelection")} />;
  }

  if (step === "paywall") {
    return <PaywallScreen onContinue={handlePaywallContinue} onRestore={handleRestorePurchases} />;
  }

  return null;
};

export default Index;
