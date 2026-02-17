import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import PaywallScreen from "@/components/PaywallScreen";
import { useSubscription } from "@/hooks/useSubscription";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Shield, Check } from "lucide-react";
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";

type PaidPlanType = "lifetime" | "annual" | "monthly";

interface PlanDetails {
  name: string;
  price: string;
  period: string;
}

const PLAN_DETAILS: Record<PaidPlanType, PlanDetails> = {
  lifetime: { name: "Lifetime Access", price: "$59.99", period: "once-off" },
  annual: { name: "Annual Access", price: "$21.99", period: "/ year" },
  monthly: { name: "Monthly Access", price: "$2.99", period: "/ month" },
};

const Paywall = () => {
  const navigate = useNavigate();
  const { subscribe } = useSubscription();
  const { user, loading } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);
  const [confirmingPlan, setConfirmingPlan] = useState<PaidPlanType | null>(null);
  const [paypalClientId, setPaypalClientId] = useState<string | null>(null);
  const [loadingClientId, setLoadingClientId] = useState(false);

  useEffect(() => {
    const fetchClientId = async () => {
      setLoadingClientId(true);
      try {
        const res = await fetch("/api/paypal/client-id");
        const data = await res.json();
        if (data.clientId) {
          setPaypalClientId(data.clientId);
        }
      } catch (err) {
        console.error("Failed to fetch PayPal client ID:", err);
      } finally {
        setLoadingClientId(false);
      }
    };
    fetchClientId();
  }, []);

  const handleContinue = async (plan: "lifetime" | "annual" | "monthly" | "trial") => {
    if (plan === "trial") {
      const userId = user?.id;
      if (!userId) {
        toast.error("Please sign in to start a free trial");
        navigate("/");
        return;
      }
      
      try {
        setIsProcessing(true);
        const response = await fetch("/api/paypal/trial/start", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId }),
        });
        
        const data = await response.json();
        
        if (data.success && data.isTrialActive) {
          toast.success("Your 7-day free trial has started!");
          navigate("/home");
        } else if (data.hasTrial && !data.isTrialActive) {
          toast.error("Your free trial has expired. Please select a paid plan.");
        } else {
          toast.error(data.message || "Failed to start trial");
        }
      } catch (error) {
        console.error("Failed to start trial:", error);
        toast.error("Failed to start trial. Please try again.");
      } finally {
        setIsProcessing(false);
      }
    } else {
      setConfirmingPlan(plan);
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
      
      const response = await fetch(`/api/paypal/subscription/${userId}`);
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
        <p className="text-foreground text-lg">{isProcessing ? "Processing..." : "Loading..."}</p>
      </div>
    );
  }

  if (confirmingPlan && paypalClientId) {
    const planDetails = PLAN_DETAILS[confirmingPlan];
    const userId = user?.id;

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
          <div className="bg-card/50 border border-border/30 rounded-2xl p-5 w-full mb-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-foreground font-medium text-lg">{planDetails.name}</span>
              <div className="text-right">
                <span className="text-foreground font-semibold text-xl">{planDetails.price}</span>
                {planDetails.period !== "once-off" && (
                  <span className="text-muted-foreground text-sm ml-1">{planDetails.period}</span>
                )}
              </div>
            </div>
            {planDetails.period === "once-off" && (
              <span className="text-muted-foreground text-sm">{planDetails.period}</span>
            )}
            <p className="text-muted-foreground text-sm mt-2">
              Unlock all premium features and insights.
            </p>
            <div className="mt-3 space-y-1.5">
              {["Emotional pattern analysis", "Mood trend insights", "Personalized guidance"].map((f) => (
                <div key={f} className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-sm text-foreground/80">{f}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="w-full mb-4">
            <PayPalScriptProvider options={{
              clientId: paypalClientId,
              currency: "USD",
              intent: "capture",
            }}>
              <PayPalButtons
                style={{
                  layout: "vertical",
                  color: "gold",
                  shape: "rect",
                  label: "paypal",
                  tagline: false,
                }}
                fundingSource={undefined}
                createOrder={async () => {
                  const res = await fetch("/api/paypal/create-order", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ userId, plan: confirmingPlan }),
                  });
                  const data = await res.json();
                  if (data.orderId) {
                    return data.orderId;
                  }
                  throw new Error(data.message || "Failed to create order");
                }}
                onApprove={async (data: { orderID: string }) => {
                  setIsProcessing(true);
                  try {
                    const res = await fetch("/api/paypal/capture-order", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ orderId: data.orderID }),
                    });
                    const result = await res.json();

                    if (result.success) {
                      if (userId) {
                        localStorage.setItem(`deeper_insights_subscribed__${userId}`, "true");
                        localStorage.setItem(`subscription_plan__${userId}`, result.plan);
                        localStorage.setItem(`subscription_activated_at__${userId}`, new Date().toISOString());
                      }
                      toast.success("Payment successful! Welcome to premium.");
                      navigate("/home");
                    } else {
                      toast.error(result.message || "Payment could not be verified.");
                      setIsProcessing(false);
                    }
                  } catch (err) {
                    console.error("Capture error:", err);
                    toast.error("Something went wrong. Please contact support.");
                    setIsProcessing(false);
                  }
                }}
                onError={(err: Record<string, unknown>) => {
                  console.error("PayPal error:", err);
                  toast.error("Payment failed. Please try again.");
                }}
                onCancel={() => {
                  toast.info("Payment cancelled.");
                }}
              />
            </PayPalScriptProvider>
          </div>

          <div className="flex items-center gap-2 mb-4">
            <Shield className="w-4 h-4 text-emerald-400" />
            <span className="text-xs text-muted-foreground">Secured by PayPal. We never see your card details.</span>
          </div>

          <Button 
            variant="ghost"
            onClick={handleGoBack}
            className="w-full py-4 text-muted-foreground"
          >
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  if (confirmingPlan && !paypalClientId) {
    return (
      <div className="min-h-screen gradient-bg flex flex-col items-center justify-center px-6">
        {loadingClientId ? (
          <>
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
            <p className="text-foreground text-lg">Loading payment options...</p>
          </>
        ) : (
          <div className="text-center">
            <p className="text-foreground text-lg mb-4">Payment system unavailable</p>
            <p className="text-muted-foreground mb-6">Please try again later.</p>
            <Button onClick={handleGoBack}>Go back</Button>
          </div>
        )}
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
