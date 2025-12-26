import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Check, AlertCircle, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";

type VerificationState = "verifying" | "success" | "success_anonymous" | "pending" | "failed";

const PaymentSuccess = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [state, setState] = useState<VerificationState>("verifying");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [retryCount, setRetryCount] = useState(0);
  const [planName, setPlanName] = useState<string>("");

  useEffect(() => {
    const verifyPayment = async () => {
      const transactionRef = searchParams.get("ref") || searchParams.get("reference") || searchParams.get("trxref");

      if (!transactionRef) {
        setErrorMessage("Missing transaction reference");
        setState("failed");
        return;
      }

      console.log("=== VERIFYING PAYSTACK PAYMENT ===");
      console.log("Reference:", transactionRef);

      try {
        const response = await fetch("/api/paystack/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            reference: transactionRef,
          }),
        });

        const data = await response.json();
        console.log("Verify response:", data);

        if (data.success) {
          const userId = localStorage.getItem("current_user_id");
          const isAnonymousPayment = localStorage.getItem("is_anonymous_payment") === "true";
          
          setPlanName(data.plan || localStorage.getItem("pending_payment_plan") || "Premium");
          
          if (userId) {
            localStorage.setItem(`deeper_insights_subscribed__${userId}`, "true");
            localStorage.setItem(`subscription_plan__${userId}`, data.plan);
            localStorage.setItem(`subscription_activated_at__${userId}`, new Date().toISOString());
          }
          
          if (isAnonymousPayment || (userId && userId.startsWith("anon_"))) {
            localStorage.setItem("pending_subscription_transaction", transactionRef);
            setState("success_anonymous");
          } else {
            setState("success");
          }
          
          localStorage.removeItem("pending_payment_plan");
          localStorage.removeItem("pending_transaction_ref");
        } else if (data.status === "pending" && retryCount < 10) {
          setTimeout(() => {
            setRetryCount(prev => prev + 1);
          }, 3000);
        } else {
          setErrorMessage(data.message || "Payment verification failed");
          setState("failed");
        }
      } catch (err) {
        console.error("Failed to verify payment:", err);
        if (retryCount < 5) {
          setTimeout(() => {
            setRetryCount(prev => prev + 1);
          }, 3000);
        } else {
          setErrorMessage("Unable to verify payment. Please contact support.");
          setState("failed");
        }
      }
    };

    verifyPayment();
  }, [searchParams, retryCount]);

  if (state === "verifying") {
    return (
      <div className="min-h-screen gradient-bg flex flex-col items-center justify-center px-6">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
        <p className="text-foreground text-lg">Verifying your payment...</p>
        {retryCount > 0 && (
          <p className="text-soft text-sm mt-2">
            Still waiting for confirmation... (attempt {retryCount + 1})
          </p>
        )}
      </div>
    );
  }

  if (state === "failed") {
    return (
      <div className="min-h-screen gradient-bg flex flex-col items-center justify-center px-6">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-10 h-10 text-red-500" />
          </div>
          
          <h1 className="text-2xl font-semibold text-foreground mb-3">
            Verification Failed
          </h1>
          
          <p className="text-soft mb-8">
            {errorMessage || "We couldn't verify your payment. If you were charged, please contact support with your transaction reference."}
          </p>
          
          <div className="space-y-3">
            <Button onClick={() => setRetryCount(prev => prev + 1)} className="w-full">
              Try Again
            </Button>
            <Button variant="outline" onClick={() => navigate("/home")} className="w-full">
              Go to Home
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (state === "success_anonymous") {
    return (
      <div className="min-h-screen gradient-bg flex flex-col items-center justify-center px-6">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-6">
            <Check className="w-10 h-10 text-green-500" />
          </div>
          
          <h1 className="text-2xl font-semibold text-foreground mb-3">
            Payment Successful!
          </h1>
          
          <p className="text-soft mb-4">
            Thank you for purchasing {planName} access!
          </p>
          
          <div className="bg-card/50 rounded-xl p-4 mb-6 border border-border">
            <div className="flex items-center gap-3 mb-2">
              <UserPlus className="w-5 h-5 text-primary" />
              <span className="font-medium text-foreground">Almost there!</span>
            </div>
            <p className="text-soft text-sm text-left">
              Let's finish setting up your account to secure your subscription and access all features.
            </p>
          </div>
          
          <div className="space-y-3">
            <Button onClick={() => navigate("/?continue=reminder")} className="w-full">
              Continue Setup
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-bg flex flex-col items-center justify-center px-6">
      <div className="text-center max-w-md">
        <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-6">
          <Check className="w-10 h-10 text-green-500" />
        </div>
        
        <h1 className="text-2xl font-semibold text-foreground mb-3">
          Payment Successful
        </h1>
        
        <p className="text-soft mb-8">
          Thank you for subscribing! You now have full access to all premium features and insights.
        </p>
        
        <div className="space-y-3">
          <Button onClick={() => navigate("/insights")} className="w-full">
            View Your Insights
          </Button>
          <Button variant="outline" onClick={() => navigate("/home")} className="w-full">
            Go to Home
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccess;
