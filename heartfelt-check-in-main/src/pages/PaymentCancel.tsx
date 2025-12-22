import { useNavigate } from "react-router-dom";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

const PaymentCancel = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen gradient-bg flex flex-col items-center justify-center px-6">
      <div className="text-center max-w-md">
        <div className="w-20 h-20 rounded-full bg-yellow-500/20 flex items-center justify-center mx-auto mb-6">
          <X className="w-10 h-10 text-yellow-500" />
        </div>
        
        <h1 className="text-2xl font-semibold text-foreground mb-3">
          Payment Cancelled
        </h1>
        
        <p className="text-soft mb-8">
          Your payment was cancelled. No charges were made to your account. You can try again whenever you're ready.
        </p>
        
        <div className="space-y-3">
          <Button onClick={() => navigate("/paywall")} className="w-full">
            Try Again
          </Button>
          <Button variant="outline" onClick={() => navigate("/home")} className="w-full">
            Go to Home
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PaymentCancel;
