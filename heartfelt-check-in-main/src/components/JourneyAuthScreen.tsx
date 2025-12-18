import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { ArrowLeft, AlertCircle } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import Auth from "@/pages/Auth";

interface JourneyAuthScreenProps {
  onContinue: (method: "anonymous" | "email") => void;
  onRegister: () => void;
  onBack: () => void;
}

const JourneyAuthScreen = ({ onContinue, onRegister, onBack }: JourneyAuthScreenProps) => {
  const navigate = useNavigate();
  const { signInAnonymously } = useAuth();
  const [hasAcceptedTerms, setHasAcceptedTerms] = useState(false);
  const [showError, setShowError] = useState(false);
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const [authMode, setAuthMode] = useState<"main" | "email-signin" | "email-signup">("main");

  const handleAnonymousAuth = async () => {
    if (!hasAcceptedTerms) {
      setShowError(true);
      return;
    }
    
    setIsLoading("anonymous");
    localStorage.setItem("termsAcceptedAt", new Date().toISOString());
    
    const { error } = await signInAnonymously();
    if (error) {
      toast.error("Something went wrong. Please try again.");
      setIsLoading(null);
    } else {
      onContinue("anonymous");
    }
  };

  const handleEmailAuth = () => {
    if (!hasAcceptedTerms) {
      setShowError(true);
      return;
    }
    localStorage.setItem("termsAcceptedAt", new Date().toISOString());
    setAuthMode("email-signin");
  };

  const handleRegister = () => {
    if (!hasAcceptedTerms) {
      setShowError(true);
      return;
    }
    localStorage.setItem("termsAcceptedAt", new Date().toISOString());
    setAuthMode("email-signup");
  };

  const handleEmailSuccess = () => {
    onContinue("email");
  };

  // Show email auth screen
  if (authMode === "email-signin" || authMode === "email-signup") {
    return (
      <Auth 
        mode={authMode === "email-signin" ? "signin" : "signup"}
        onBack={() => setAuthMode("main")}
        onSuccess={handleEmailSuccess}
      />
    );
  }

  return (
    <div className="min-h-screen gradient-bg flex flex-col">
      {/* Header with back button */}
      <div className="h-14 sm:h-16 flex items-center px-4">
        <button
          onClick={onBack}
          className="p-2 -ml-2 text-foreground/70 hover:text-foreground transition-colors rounded-lg hover:bg-secondary/30"
          aria-label="Go back"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
      </div>

      {/* Main content */}
      <main className="flex-1 flex flex-col justify-center px-4 sm:px-6 pb-8 max-w-lg mx-auto w-full">
        {/* Header */}
        <div className="text-center mb-10 opacity-0 animate-fade-in" style={{ animationFillMode: "forwards" }}>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-4 leading-tight">
            Let's start your journey
          </h1>
          <p className="text-soft text-base sm:text-lg leading-relaxed">
            Choose how you'd like to continue. You can stay anonymous if you prefer.
          </p>
        </div>

        {/* Auth buttons */}
        <div 
          className="flex flex-col gap-3 opacity-0 animate-fade-in"
          style={{ animationDelay: "200ms", animationFillMode: "forwards" }}
        >
          {/* Anonymous */}
          <button
            onClick={handleAnonymousAuth}
            disabled={isLoading !== null}
            className={cn(
              "w-full py-4 px-6 text-base font-medium rounded-xl transition-all duration-300",
              "bg-card border border-border/50 text-foreground",
              "hover:border-primary/40 hover:bg-secondary/30 hover:scale-[1.01]",
              "active:scale-[0.99]",
              "flex items-center justify-center gap-3",
              "disabled:opacity-60 disabled:cursor-not-allowed",
              !hasAcceptedTerms && "opacity-60"
            )}
          >
            {isLoading === "anonymous" ? (
              <span className="animate-pulse">Setting up...</span>
            ) : (
              <>
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
                Continue anonymously
              </>
            )}
          </button>

          {/* Anonymous warning */}
          <div className="flex items-start gap-2 px-2 py-2 rounded-lg bg-secondary/20 border border-border/30">
            <AlertCircle className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
            <p className="text-xs text-muted-foreground leading-relaxed">
              Anonymous data is stored locally only. If you delete the app, your data will be lost.
            </p>
          </div>

          {/* Email sign in */}
          <button
            onClick={handleEmailAuth}
            disabled={isLoading !== null}
            className={cn(
              "w-full py-4 px-6 text-base font-medium rounded-xl transition-all duration-300",
              "bg-card border border-border/50 text-foreground",
              "hover:border-primary/40 hover:bg-secondary/30 hover:scale-[1.01]",
              "active:scale-[0.99]",
              "flex items-center justify-center gap-3",
              "disabled:opacity-60 disabled:cursor-not-allowed",
              !hasAcceptedTerms && "opacity-60"
            )}
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect width="20" height="16" x="2" y="4" rx="2" />
              <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
            </svg>
            Sign in with email
          </button>
        </div>

        {/* Legal acceptance */}
        <div 
          className="mt-6 opacity-0 animate-fade-in"
          style={{ animationDelay: "300ms", animationFillMode: "forwards" }}
        >
          <div className="flex items-start gap-3">
            <Checkbox
              id="terms"
              checked={hasAcceptedTerms}
              onCheckedChange={(checked) => {
                setHasAcceptedTerms(checked === true);
                if (checked) setShowError(false);
              }}
              className="mt-0.5"
            />
            <label htmlFor="terms" className="text-sm text-foreground/90 leading-relaxed cursor-pointer">
              I agree to the{" "}
              <button
                type="button"
                onClick={() => navigate("/privacy-policy")}
                className="text-primary hover:text-primary/80 underline underline-offset-2"
              >
                Privacy Policy
              </button>
              {" "}and{" "}
              <button
                type="button"
                onClick={() => navigate("/terms-of-use")}
                className="text-primary hover:text-primary/80 underline underline-offset-2"
              >
                Terms of Use
              </button>
            </label>
          </div>
          <p className="text-xs text-muted-foreground mt-2 ml-7">
            You can review how your data is handled before continuing.
          </p>
          {showError && (
            <p className="text-sm text-destructive mt-3 ml-7">
              Please review and accept the Privacy Policy and Terms of Use to continue.
            </p>
          )}
        </div>

        {/* Register link */}
        <div 
          className="text-center mt-8 opacity-0 animate-fade-in"
          style={{ animationDelay: "400ms", animationFillMode: "forwards" }}
        >
          <p className="text-soft text-sm">
            Don't have an account?{" "}
            <button
              onClick={handleRegister}
              className="text-primary hover:text-primary/80 font-medium transition-colors underline-offset-4 hover:underline"
            >
              Register
            </button>
          </p>
        </div>
      </main>
    </div>
  );
};

export default JourneyAuthScreen;
