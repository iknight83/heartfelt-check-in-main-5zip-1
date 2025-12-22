import { useNavigate, useSearchParams } from "react-router-dom";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

const PaymentError = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const errorMessage = searchParams.get("message") || "An error occurred during payment processing.";

  return (
    <div className="min-h-screen gradient-bg flex flex-col items-center justify-center px-6">
      <div className="text-center max-w-md">
        <div className="w-20 h-20 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-6">
          <AlertCircle className="w-10 h-10 text-red-500" />
        </div>
        
        <h1 className="text-2xl font-semibold text-foreground mb-3">
          Payment Error
        </h1>
        
        <p className="text-soft mb-8">
          {errorMessage} Please try again or contact support if the problem persists.
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

export default PaymentError;
