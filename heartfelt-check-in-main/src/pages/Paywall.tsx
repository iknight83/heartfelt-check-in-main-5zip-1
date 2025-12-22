import { useState } from "react";
import { useNavigate } from "react-router-dom";
import PaywallScreen from "@/components/PaywallScreen";
import { useSubscription } from "@/hooks/useSubscription";
import { toast } from "sonner";


const Paywall = () => {
  const navigate = useNavigate();
  const { subscribe } = useSubscription();
  const [isProcessing, setIsProcessing] = useState(false);

  const initiateOzowPayment = async (plan: "lifetime" | "annual" | "monthly") => {
    const userId = localStorage.getItem("current_user_id");
    if (!userId) {
      toast.error("Please sign in to subscribe");
      return;
    }

    try {
      setIsProcessing(true);

      const response = await fetch("/api/ozow/initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          plan,
        }),
      });

      const data = await response.json();

      if (data.status === "ok" && data.paymentUrl && data.paymentData) {
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
        form.submit();
      } else {
        throw new Error(data.message || "Failed to initiate payment");
      }
    } catch (error) {
      console.error("Payment initiation error:", error);
      toast.error("Failed to start payment. Please try again.");
      setIsProcessing(false);
    }
  };

  const handleContinue = (plan: "lifetime" | "annual" | "monthly" | "trial") => {
    if (plan === "trial") {
      navigate("/insights");
    } else {
      initiateOzowPayment(plan);
    }
  };

  const handleRestore = () => {
    const userId = localStorage.getItem("current_user_id");
    if (userId) {
      const isSubscribed = localStorage.getItem(`deeper_insights_subscribed__${userId}`);
      if (isSubscribed === "true") {
        toast.success("Your subscription has been restored!");
        navigate("/insights");
      } else {
        toast.info("No previous subscription found");
      }
    } else {
      toast.error("Please sign in to restore purchases");
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

  return (
    <PaywallScreen 
      onContinue={handleContinue} 
      onRestore={handleRestore} 
    />
  );
};

export default Paywall;
