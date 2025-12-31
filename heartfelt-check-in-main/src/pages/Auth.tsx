import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Mail, Lock, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { z } from "zod";

const emailSchema = z.string().trim().email({ message: "Please enter a valid email address" });
const passwordSchema = z.string().min(6, { message: "Password must be at least 6 characters" });

interface AuthProps {
  mode: "signin" | "signup";
  onBack: () => void;
  onSuccess: () => void;
  onToggleMode?: () => void;
}

const Auth = ({ mode, onBack, onSuccess, onToggleMode }: AuthProps) => {
  const navigate = useNavigate();
  const { signInWithEmail, signUpWithEmail, resetPassword } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotEmailError, setForgotEmailError] = useState<string | undefined>();

  const validateForm = () => {
    const newErrors: { email?: string; password?: string } = {};
    
    const emailResult = emailSchema.safeParse(email);
    if (!emailResult.success) {
      newErrors.email = emailResult.error.errors[0].message;
    }
    
    const passwordResult = passwordSchema.safeParse(password);
    if (!passwordResult.success) {
      newErrors.password = passwordResult.error.errors[0].message;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsLoading(true);
    
    try {
      if (mode === "signin") {
        const { error } = await signInWithEmail(email, password);
        if (error) {
          if (error.message.includes("Invalid login credentials")) {
            toast.error("Invalid email or password. Please try again.");
          } else {
            toast.error(error.message || "Something went wrong. Please try again.");
          }
        } else {
          onSuccess();
        }
      } else {
        const { error } = await signUpWithEmail(email, password);
        if (error) {
          if (error.message.includes("already registered")) {
            toast.error("This email is already registered. Please sign in instead.");
          } else {
            toast.error(error.message || "Something went wrong. Please try again.");
          }
        } else {
          toast.success("Account created successfully!");
          onSuccess();
        }
      }
    } catch (err) {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const emailResult = emailSchema.safeParse(forgotEmail);
    if (!emailResult.success) {
      setForgotEmailError(emailResult.error.errors[0].message);
      return;
    }
    
    setForgotEmailError(undefined);
    setIsLoading(true);
    
    try {
      const { error } = await resetPassword(forgotEmail);
      if (error) {
        toast.error("We couldn't send the reset email. Please try again.");
      } else {
        toast.success("We've sent you an email with a link to reset your password.");
        setShowForgotPassword(false);
        setForgotEmail("");
      }
    } catch (err) {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (showForgotPassword) {
    return (
      <div className="min-h-screen gradient-bg flex flex-col">
        {/* Header */}
        <div className="h-14 sm:h-16 flex items-center px-4">
          <button
            onClick={() => setShowForgotPassword(false)}
            className="p-2 -ml-2 text-foreground/70 hover:text-foreground transition-colors rounded-lg hover:bg-secondary/30"
            aria-label="Go back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        </div>

        {/* Main content */}
        <main className="flex-1 flex flex-col justify-center px-4 sm:px-6 pb-8 max-w-lg mx-auto w-full">
          <div className="text-center mb-8 opacity-0 animate-fade-in" style={{ animationFillMode: "forwards" }}>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-3">
              Reset your password
            </h1>
            <p className="text-soft text-base">
              Enter your email and we'll send you a link to reset your password.
            </p>
          </div>

          <form 
            onSubmit={handleForgotPassword} 
            className="space-y-5 opacity-0 animate-fade-in"
            style={{ animationDelay: "100ms", animationFillMode: "forwards" }}
          >
            <div className="space-y-2">
              <Label htmlFor="forgot-email" className="text-foreground/90">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="forgot-email"
                  type="email"
                  placeholder="your@email.com"
                  value={forgotEmail}
                  onChange={(e) => {
                    setForgotEmail(e.target.value);
                    if (forgotEmailError) setForgotEmailError(undefined);
                  }}
                  className="pl-11 bg-card border-border/50 h-12"
                  disabled={isLoading}
                />
              </div>
              {forgotEmailError && (
                <p className="text-sm text-destructive">{forgotEmailError}</p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full h-12 text-base font-medium"
              disabled={isLoading}
            >
              {isLoading ? "Sending..." : "Send reset link"}
            </Button>
          </form>

          <div 
            className="text-center mt-6 opacity-0 animate-fade-in"
            style={{ animationDelay: "200ms", animationFillMode: "forwards" }}
          >
            <p className="text-soft text-sm">
              Remember your password?{" "}
              <button
                onClick={() => setShowForgotPassword(false)}
                className="text-primary hover:text-primary/80 font-medium transition-colors"
              >
                Sign in
              </button>
            </p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-bg flex flex-col">
      {/* Header */}
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
        <div className="text-center mb-8 opacity-0 animate-fade-in" style={{ animationFillMode: "forwards" }}>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-3">
            {mode === "signin" ? "Welcome back" : "Create your account"}
          </h1>
          <p className="text-soft text-base">
            {mode === "signin" 
              ? "Sign in to continue your journey" 
              : "Start tracking your emotional patterns"}
          </p>
        </div>

        <form 
          onSubmit={handleSubmit} 
          className="space-y-5 opacity-0 animate-fade-in"
          style={{ animationDelay: "100ms", animationFillMode: "forwards" }}
        >
          <div className="space-y-2">
            <Label htmlFor="email" className="text-foreground/90">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errors.email) setErrors(prev => ({ ...prev, email: undefined }));
                }}
                className="pl-11 bg-card border-border/50 h-12"
                disabled={isLoading}
              />
            </div>
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-foreground/90">Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errors.password) setErrors(prev => ({ ...prev, password: undefined }));
                }}
                className="pl-11 pr-11 bg-card border-border/50 h-12"
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {errors.password && (
              <p className="text-sm text-destructive">{errors.password}</p>
            )}
          </div>

          {mode === "signin" && (
            <div className="text-right">
              <button
                type="button"
                onClick={() => setShowForgotPassword(true)}
                className="text-sm text-primary hover:text-primary/80 font-medium transition-colors"
              >
                Forgot password?
              </button>
            </div>
          )}

          <Button
            type="submit"
            className="w-full h-12 text-base font-medium"
            disabled={isLoading}
          >
            {isLoading 
              ? "Please wait..." 
              : mode === "signin" ? "Sign in" : "Create account"}
          </Button>
        </form>

        <div 
          className="text-center mt-6 opacity-0 animate-fade-in"
          style={{ animationDelay: "200ms", animationFillMode: "forwards" }}
        >
          <p className="text-soft text-sm">
            {mode === "signin" ? "Don't have an account? " : "Already have an account? "}
            <button
              onClick={onToggleMode}
              className="text-primary hover:text-primary/80 font-medium transition-colors"
            >
              {mode === "signin" ? "Register" : "Sign in"}
            </button>
          </p>
        </div>
      </main>
    </div>
  );
};

export default Auth;