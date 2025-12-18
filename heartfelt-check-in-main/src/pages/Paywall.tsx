import { useNavigate } from "react-router-dom";
import PaywallScreen from "@/components/PaywallScreen";
import { useSubscription } from "@/hooks/useSubscription";

const Paywall = () => {
  const navigate = useNavigate();
  const { subscribe } = useSubscription();

  const handleContinue = (plan: "lifetime" | "annual" | "monthly" | "trial") => {
    if (plan === "trial") {
      // Free trial - just navigate to insights
      navigate("/insights");
    } else {
      // Paid plan - subscribe and navigate
      subscribe();
      navigate("/insights");
    }
  };

  const handleRestore = () => {
    // Placeholder for restore purchases
    console.log("Restore purchases requested");
  };

  return (
    <PaywallScreen 
      onContinue={handleContinue} 
      onRestore={handleRestore} 
    />
  );
};

export default Paywall;
