import { useState } from "react";
import { useNavigate } from "react-router-dom";
import PaywallScreen from "@/components/PaywallScreen";
import { useSubscription } from "@/hooks/useSubscription";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Lock, Shield, ExternalLink } from "lucide-react";

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
  const [isProcessing, setIsProcessing] = useState(false);
  const [confirmingPlan, setConfirmingPlan] = useState<PaidPlanType | null>(null);

  const getOrCreateTempUserId = (): string => {
    let userId = localStorage.getItem("current_user_id");
    
    if (!userId) {
      userId = `anon_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
      localStorage.setItem("current_user_id", userId);
      localStorage.setItem("is_anonymous_payment", "true");
    }
    
    return userId;
  };

  const initiateOzowPayment = async (plan: PaidPlanType) => {
    try {
      setIsProcessing(true);
      
      const userId = getOrCreateTempUserId();
      console.log("=== INITIATING OZOW PAYMENT ===");
      console.log("User ID:", userId);
      console.log("Plan:", plan);

      const response = await fetch("/api/ozow/initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, plan }),
      });

      console.log("API Response Status:", response.status);
      
      const data = await response.json();
      console.log("API Response Data:", JSON.stringify(data, null, 2));

      if (data.status === "ok" && data.paymentUrl && data.paymentData) {
        console.log("Payment URL received:", data.paymentUrl);
        console.log("Transaction Reference:", data.paymentData.TransactionReference);
        localStorage.setItem("pending_payment_plan", plan);
        localStorage.setItem("pending_transaction_ref", data.paymentData.TransactionReference);
        
        const form = document.createElement("form");
        form.method = "POST";
        form.action = data.paymentUrl;
        form.style.display = "none";

        Object.entries(data.paymentData).forEach(([key, value]) => {
          const input = document.createElement("input");
          input.type = "hidden";
          input.name = key;
          input.value = String(value);
          form.appendChild(input);
        });

        document.body.appendChild(form);
        console.log("=== SUBMITTING FORM TO OZOW ===");
        form.submit();
      } else {
        console.error("=== OZOW INITIATION FAILED ===");
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
      initiateOzowPayment(confirmingPlan);
    }
  };

  const handleGoBack = () => {
    setConfirmingPlan(null);
  };

  const handleRestore = async () => {
    const userId = localStorage.getItem("current_user_id");
    if (!userId) {
      toast.error("Please sign in to restore purchases");
      return;
    }

    try {
      setIsProcessing(true);
      
      const response = await fetch(`/api/ozow/subscription/${userId}`);
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

  if (isProcessing) {
    return (
      <div className="min-h-screen gradient-bg flex flex-col items-center justify-center px-6">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
        <p className="text-foreground text-lg">Redirecting to payment...</p>
      </div>
    );
  }

  if (confirmingPlan) {
    const planDetails = PLAN_DETAILS[confirmingPlan];
    const isAnonymous = !localStorage.getItem("current_user_id") || 
                        localStorage.getItem("current_user_id")?.startsWith("anon_");

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
              <span className="text-sm font-medium text-foreground">Secure Ozow Payment</span>
            </div>
            
            <div className="relative rounded-xl overflow-hidden border border-border/30 bg-white">
              <img 
                src="/ozow-preview.png" 
                alt="Ozow secure payment preview" 
                className="w-full h-auto opacity-90"
                style={{ maxHeight: "200px", objectFit: "cover", objectPosition: "top" }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
              <div className="absolute bottom-3 left-3 right-3 flex items-center gap-2">
                <Lock className="w-4 h-4 text-emerald-400" />
                <span className="text-xs text-foreground/80">
                  You'll be redirected to Ozow to complete payment securely
                </span>
              </div>
            </div>
          </div>

          <div className="bg-card/30 border border-border/20 rounded-xl p-4 w-full mb-8">
            <p className="text-sm font-medium text-foreground mb-2">What happens next:</p>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <ExternalLink className="w-4 h-4 mt-0.5 flex-shrink-0 text-primary" />
                <span>You'll be redirected to Ozow to complete payment</span>
              </li>
              <li className="flex items-start gap-2">
                <Shield className="w-4 h-4 mt-0.5 flex-shrink-0 text-primary" />
                <span>We don't store your payment details</span>
              </li>
              {isAnonymous && (
                <li className="flex items-start gap-2">
                  <Lock className="w-4 h-4 mt-0.5 flex-shrink-0 text-amber-400" />
                  <span className="text-amber-200/80">
                    After payment, you'll be asked to create an account to activate your subscription
                  </span>
                </li>
              )}
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
