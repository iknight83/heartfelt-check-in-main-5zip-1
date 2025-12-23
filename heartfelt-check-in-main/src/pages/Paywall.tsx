import { useState } from "react";
import { useNavigate } from "react-router-dom";
import PaywallScreen from "@/components/PaywallScreen";
import { useSubscription } from "@/hooks/useSubscription";
import { toast } from "sonner";

/**
 * Paywall Page - Handles subscription plan selection and payment flow
 * 
 * Flow:
 * 1. User sees pricing options (Free Trial, Monthly, Annual, Lifetime)
 * 2. If FREE TRIAL selected → User goes directly into the app (no payment)
 * 3. If PAID PLAN selected → User is redirected to Ozow payment page
 * 
 * Important: No card/bank details are collected here - all payment happens on Ozow
 */
const Paywall = () => {
  const navigate = useNavigate();
  const { subscribe } = useSubscription();
  const [isProcessing, setIsProcessing] = useState(false);

  /**
   * Initiates Ozow payment for paid plans (Monthly, Annual, Lifetime)
   * 
   * Steps:
   * 1. Get user ID from localStorage (must be signed in)
   * 2. Call backend API to create payment request
   * 3. Backend generates unique transaction reference
   * 4. Backend builds Ozow payment URL with Merchant Code and Private Key
   * 5. Create hidden form with payment data and submit to Ozow
   * 6. User is redirected to Ozow to complete payment
   * 
   * @param plan - The selected plan: "monthly", "annual", or "lifetime"
   */
  const initiateOzowPayment = async (plan: "lifetime" | "annual" | "monthly") => {
    // Step 1: Check if user is signed in
    const userId = localStorage.getItem("current_user_id");
    if (!userId) {
      toast.error("Please sign in to subscribe");
      console.error("Payment failed: No user ID found in localStorage");
      return;
    }

    try {
      setIsProcessing(true);
      console.log(`Initiating ${plan} subscription payment for user: ${userId}`);

      // Step 2: Call backend to create payment request
      const response = await fetch("/api/ozow/initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          plan,
        }),
      });

      const data = await response.json();
      console.log("Ozow API response:", data);

      // Step 3: Check if payment data was returned successfully
      if (data.status === "ok" && data.paymentUrl && data.paymentData) {
        // Step 4: Create hidden form to POST payment data to Ozow
        // This is required by Ozow - we can't just redirect with a URL
        const form = document.createElement("form");
        form.method = "POST";
        form.action = data.paymentUrl; // https://pay.ozow.com
        form.style.display = "none";

        // Add all payment fields as hidden inputs
        Object.entries(data.paymentData).forEach(([key, value]) => {
          const input = document.createElement("input");
          input.type = "hidden";
          input.name = key;
          input.value = String(value);
          form.appendChild(input);
        });

        // Step 5: Submit form to redirect user to Ozow payment page
        document.body.appendChild(form);
        console.log("Redirecting to Ozow payment page...");
        form.submit();
      } else {
        // Payment initiation failed
        throw new Error(data.message || data.error || "Failed to initiate payment");
      }
    } catch (error) {
      console.error("Payment initiation error:", error);
      toast.error("Failed to start payment. Please try again.");
      setIsProcessing(false);
    }
  };

  /**
   * Handles the "Continue" button click
   * 
   * Decision logic:
   * - FREE TRIAL → Navigate directly to app (no payment needed)
   * - PAID PLAN → Redirect to Ozow for payment
   * 
   * @param plan - The selected plan type
   */
  const handleContinue = (plan: "lifetime" | "annual" | "monthly" | "trial") => {
    console.log(`User selected plan: ${plan}`);
    
    if (plan === "trial") {
      // FREE TRIAL: User goes directly into the app without payment
      console.log("Free trial selected - redirecting to app");
      navigate("/home");
    } else {
      // PAID PLAN: Redirect to Ozow payment page
      console.log(`Paid plan selected (${plan}) - initiating Ozow payment`);
      initiateOzowPayment(plan);
    }
  };

  /**
   * Restores a previous subscription from the server
   * Useful if user reinstalls app or clears local data
   */
  const handleRestore = async () => {
    const userId = localStorage.getItem("current_user_id");
    if (!userId) {
      toast.error("Please sign in to restore purchases");
      return;
    }

    try {
      setIsProcessing(true);
      
      // Check server for existing subscription
      const response = await fetch(`/api/ozow/subscription/${userId}`);
      const data = await response.json();

      if (data.hasSubscription) {
        // User has an active subscription - restore it locally
        localStorage.setItem(`deeper_insights_subscribed__${userId}`, "true");
        localStorage.setItem(`subscription_plan__${userId}`, data.plan);
        localStorage.setItem(`subscription_activated_at__${userId}`, data.activatedAt);
        toast.success("Your subscription has been restored!");
        navigate("/insights");
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

  // Show loading spinner while processing payment
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
