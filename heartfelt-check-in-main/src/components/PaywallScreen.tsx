import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Check, Clock } from "lucide-react";
import { useSubscription } from "@/hooks/useSubscription";

interface PaywallScreenProps {
  onContinue: (plan: "lifetime" | "annual" | "monthly" | "trial") => void;
  onRestore: () => void;
}

type PlanType = "lifetime" | "annual" | "monthly" | "trial";

interface Plan {
  id: PlanType;
  name: string;
  price: string;
  period: string;
  subtext: string;
  badge?: string;
  isRecommended?: boolean;
  isTrial?: boolean;
}

const basePlans: Plan[] = [
  {
    id: "lifetime",
    name: "Lifetime Access",
    price: "$59.99",
    period: "once-off",
    subtext: "For long-term self-understanding.",
    badge: "Best value",
    isRecommended: true,
  },
  {
    id: "annual",
    name: "Annual Access",
    price: "$21.99",
    period: "/ year",
    subtext: "Just $1.83 per month",
  },
  {
    id: "monthly",
    name: "Monthly Access",
    price: "$2.99",
    period: "/ month",
    subtext: "Cancel anytime",
  },
];

const features = [
  "See emotional patterns you can't notice day-to-day",
  "Understand what situations may affect your mood",
  "Track how your emotional baseline changes over time",
  "Get gentle guidance on what to pay attention to",
];

const PaywallScreen = ({ onContinue, onRestore }: PaywallScreenProps) => {
  const { isSubscribed, hasEverUsedTrial } = useSubscription();
  const [selectedPlan, setSelectedPlan] = useState<PlanType>("lifetime");

  const showFreeTrial = !isSubscribed && hasEverUsedTrial === false;

  const plans: Plan[] = [
    ...basePlans,
    ...(showFreeTrial ? [{
      id: "trial" as PlanType,
      name: "Free Trial",
      price: "$0",
      period: "/ 7 days",
      subtext: "Try all features free",
      isTrial: true,
    }] : []),
  ];

  const handleContinue = () => {
    onContinue(selectedPlan);
  };

  return (
    <div className="min-h-screen gradient-bg flex flex-col px-6 py-8">
      {/* Restore Purchases - Top Right */}
      <div className="flex justify-end opacity-0 animate-fade-in" style={{ animationFillMode: "forwards" }}>
        <button
          onClick={onRestore}
          className="text-soft hover:text-foreground transition-colors text-sm"
        >
          Restore purchases
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col justify-center max-w-md mx-auto w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 
            className="text-2xl font-semibold text-foreground mb-3 opacity-0 animate-fade-in"
            style={{ animationDelay: "0.1s", animationFillMode: "forwards" }}
          >
            Understand your emotional patterns
          </h1>
          <p 
            className="text-soft text-base opacity-0 animate-fade-in"
            style={{ animationDelay: "0.2s", animationFillMode: "forwards" }}
          >
            Make sense of your emotions — not just track them.
          </p>
        </div>

        {/* Features */}
        <div 
          className="mb-8 space-y-3 opacity-0 animate-fade-in"
          style={{ animationDelay: "0.25s", animationFillMode: "forwards" }}
        >
          {features.map((feature, index) => (
            <div key={index} className="flex items-center gap-3">
              <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                <Check className="w-3 h-3 text-primary" />
              </div>
              <span className="text-foreground text-sm">{feature}</span>
            </div>
          ))}
        </div>

        {/* Pricing Cards */}
        <div 
          className="space-y-3 mb-8 opacity-0 animate-fade-in"
          style={{ animationDelay: "0.3s", animationFillMode: "forwards" }}
        >
          {plans.map((plan) => (
            <button
              key={plan.id}
              onClick={() => setSelectedPlan(plan.id)}
              className={`w-full p-4 rounded-2xl border-2 transition-all duration-200 text-left relative ${
                selectedPlan === plan.id
                  ? "border-primary bg-primary/10"
                  : "border-border/30 bg-card/50 hover:border-border/50"
              }`}
            >
              {plan.badge && (
                <span className="absolute -top-2.5 right-4 bg-primary text-primary-foreground text-xs font-medium px-2.5 py-0.5 rounded-full">
                  {plan.badge}
                </span>
              )}
              
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-foreground font-medium">{plan.name}</span>
                  </div>
                  <p className="text-soft text-sm mt-0.5">{plan.subtext}</p>
                </div>
                
                <div className="text-right">
                  <div className="flex items-baseline gap-1">
                    <span className="text-foreground font-semibold text-lg">{plan.price}</span>
                    {plan.period !== "one-time" && (
                      <span className="text-soft text-sm">{plan.period}</span>
                    )}
                  </div>
                  {plan.period === "one-time" && (
                    <span className="text-soft text-xs">{plan.period}</span>
                  )}
                </div>
              </div>

              {/* Selection indicator */}
              <div className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                selectedPlan === plan.id
                  ? "border-primary bg-primary"
                  : "border-border/50"
              }`}>
                {selectedPlan === plan.id && (
                  <Check className="w-3 h-3 text-primary-foreground" />
                )}
              </div>
              
              {/* Adjust padding to account for radio */}
              <div className="pl-8" />
            </button>
          ))}
        </div>

        {/* CTA Button */}
        <div 
          className="space-y-4 opacity-0 animate-fade-in"
          style={{ animationDelay: "0.4s", animationFillMode: "forwards" }}
        >
          <Button
            onClick={handleContinue}
            className="w-full py-6 text-base font-medium rounded-xl"
          >
            Continue
          </Button>
          
          <p className="text-center text-soft text-sm">
            One-click cancellation. No hidden fees.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PaywallScreen;
