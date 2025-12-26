import { useState } from "react";
import { useNavigate } from "react-router-dom";
import PaywallScreen from "@/components/PaywallScreen";
import { useSubscription } from "@/hooks/useSubscription";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Lock, Shield, ExternalLink, CreditCard } from "lucide-react";

type PaidPlanType = "lifetime" | "annual" | "monthly";

interface PlanDetails {
  name: string;
  price: string;
  period: string;
}

const PLAN_DETAILS: Record<PaidPlanType, PlanDetails> = {
  lifetime: { name: "Lifetime Access", price: "R999", period: "once-off" },
  annual: { name: "Annual Access", price: "R349", period: "/ year" },
  monthly: { name: "Monthly Access", price: "R49", period: "/ month" },
};

const Paywall = () => {
  const navigate = useNavigate();
  const { subscribe } = useSubscription();
  const { user, loading } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);
  const [confirmingPlan, setConfirmingPlan] = useState<PaidPlanType | null>(null);

  const initiatePaystackPayment = async (plan: PaidPlanType) => {
    try {
      setIsProcessing(true);
      
      const userId = user?.id;
      
      if (!userId) {
        toast.error("Please sign in to make a purchase");
        setIsProcessing(false);
        setConfirmingPlan(null);
        navigate("/");
        return;
      }
      
      console.log("=== PAYSTACK INITIATE ===");
      console.log("User ID:", userId);
      console.log("Plan:", plan);

      const response = await fetch("/api/paystack/initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, plan }),
      });

      console.log("API Response Status:", response.status);
      
      const data = await response.json();
      console.log("API Response Data:", JSON.stringify(data, null, 2));

      if (data.status === "ok" && data.authorizationUrl) {
        console.log("=== PAYSTACK REDIRECT ===");
        console.log("Authorization URL:", data.authorizationUrl);
        console.log("Reference:", data.reference);
        
        localStorage.setItem("pending_payment_plan", plan);
        localStorage.setItem("pending_transaction_ref", data.reference);
        
        window.location.href = data.authorizationUrl;
      } else {
        console.error("=== PAYSTACK INITIATION FAILED ===");
        console.error("Response data:", data);
        const errorMsg = data.message || data.error || "Failed to initiate payment";
        toast.error(errorMsg);
        setIsProcessing(false);
        setConfirmingPlan(null);
      }
    } catch (error) {
      console.error("=== PAYMENT INITIATION ERROR ===");
      console.error("Error:", error);
      toast.error("Failed to start payment. Please try again.");
      setIsProcessing(false);
      setConfirmingPlan(null);
    }
  };

  const handleContinue = (plan: "lifetime" | "annual" | "monthly" | "trial") => {
    if (plan === "trial") {
      navigate("/home");
    } else {
      setConfirmingPlan(plan);
    }
  };

  const handleConfirmPayment = () => {
    if (confirmingPlan) {
      initiatePaystackPayment(confirmingPlan);
    }
  };

  const handleGoBack = () => {
    setConfirmingPlan(null);
  };

  const handleRestore = async () => {
    const userId = user?.id;
    if (!userId) {
      toast.error("Please sign in to restore purchases");
      return;
    }

    try {
      setIsProcessing(true);
      
      const response = await fetch(`/api/paystack/subscription/${userId}`);
      const data = await response.json();

      if (data.hasSubscription) {
        localStorage.setItem(`deeper_insights_subscribed__${userId}`, "true");
        localStorage.setItem(`subscription_plan__${userId}`, data.plan);
        localStorage.setItem(`subscription_activated_at__${userId}`, data.activatedAt);
        toast.success("Your subscription has been restored!");
        navigate("/home");
      } else {
        toast.info("No previous subscription found");
      }
    } catch (error) {
      console.error("Restore subscription error:", error);
      toast.error("Failed to restore subscription. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  if (loading || isProcessing) {
    return (
      <div className="min-h-screen gradient-bg flex flex-col items-center justify-center px-6">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
        <p className="text-foreground text-lg">{isProcessing ? "Redirecting to payment..." : "Loading..."}</p>
      </div>
    );
  }

  if (confirmingPlan) {
    const planDetails = PLAN_DETAILS[confirmingPlan];

    return (
      <div className="min-h-screen gradient-bg flex flex-col px-6 py-8">
        <button 
          onClick={handleGoBack}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6 self-start"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Go back</span>
        </button>

        <div className="flex-1 flex flex-col items-center justify-center max-w-md mx-auto w-full">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-semibold text-foreground mb-2">
              Confirm your subscription
            </h1>
            <p className="text-muted-foreground">
              You're about to subscribe to:
            </p>
          </div>

          <div className="bg-card/50 border border-border/30 rounded-2xl p-5 w-full mb-6">
            <div className="flex items-center justify-between">
              <span className="text-foreground font-medium text-lg">{planDetails.name}</span>
              <div className="text-right">
                <span className="text-foreground font-semibold text-xl">{planDetails.price}</span>
                {planDetails.period !== "once-off" && (
                  <span className="text-muted-foreground text-sm ml-1">{planDetails.period}</span>
                )}
              </div>
            </div>
          </div>

          <div className="w-full mb-6">
            <div className="flex items-center gap-2 mb-3">
              <Shield className="w-4 h-4 text-emerald-400" />
              <span className="text-sm font-medium text-foreground">Secure Paystack Payment</span>
            </div>
            
            <div className="relative rounded-xl overflow-hidden border border-border/30 bg-gradient-to-br from-blue-600 to-blue-800 p-6">
              <div className="flex items-center gap-3 mb-4">
                <CreditCard className="w-8 h-8 text-white" />
                <div>
                  <p className="text-white font-semibold">Paystack</p>
                  <p className="text-blue-200 text-sm">Secure Payment Gateway</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-emerald-300" />
                <span className="text-sm text-blue-100">
                  Your payment is protected by bank-level security
                </span>
              </div>
            </div>
          </div>

          <div className="bg-card/30 border border-border/20 rounded-xl p-4 w-full mb-8">
            <p className="text-sm font-medium text-foreground mb-2">What happens next:</p>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <ExternalLink className="w-4 h-4 mt-0.5 flex-shrink-0 text-primary" />
                <span>You'll be redirected to Paystack to complete payment</span>
              </li>
              <li className="flex items-start gap-2">
                <Shield className="w-4 h-4 mt-0.5 flex-shrink-0 text-primary" />
                <span>We don't store your card details</span>
              </li>
            </ul>
          </div>

          <div className="w-full space-y-3">
            <Button 
              onClick={handleConfirmPayment}
              className="w-full py-6 text-base font-medium rounded-xl"
            >
              <Lock className="w-4 h-4 mr-2" />
              Continue to Secure Payment
            </Button>
            
            <Button 
              variant="ghost"
              onClick={handleGoBack}
              className="w-full py-4 text-muted-foreground"
            >
              Go back
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <PaywallScreen 
      onContinue={handleContinue} 
      onRestore={handleRestore} 
    />
  );
};

export default Paywall;
