import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Lock, Eye, EyeOff, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { z } from "zod";

const passwordSchema = z.string().min(6, { message: "Password must be at least 6 characters" });

const ResetPassword = () => {
  const navigate = useNavigate();
  const { updatePassword, session } = useAuth();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ password?: string; confirmPassword?: string }>({});
  const [isSuccess, setIsSuccess] = useState(false);

  // Check if user arrived via password reset link
  useEffect(() => {
    if (!session) {
      // Give a moment for the session to establish from the URL token
      const timeout = setTimeout(() => {
        if (!session) {
          toast.error("Invalid or expired reset link. Please request a new one.");
          navigate("/");
        }
      }, 2000);
      return () => clearTimeout(timeout);
    }
  }, [session, navigate]);

  const validateForm = () => {
    const newErrors: { password?: string; confirmPassword?: string } = {};
    
    const passwordResult = passwordSchema.safeParse(password);
    if (!passwordResult.success) {
      newErrors.password = passwordResult.error.errors[0].message;
    }
    
    if (password !== confirmPassword) {
      newErrors.confirmPassword = "Passwords don't match";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsLoading(true);
    
    try {
      const { error } = await updatePassword(password);
      if (error) {
        toast.error("Something went wrong. Please try again.");
      } else {
        setIsSuccess(true);
        toast.success("Your password has been updated.");
      }
    } catch (err) {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen gradient-bg flex flex-col">
        <main className="flex-1 flex flex-col justify-center items-center px-4 sm:px-6 pb-8 max-w-lg mx-auto w-full">
          <div className="text-center opacity-0 animate-fade-in" style={{ animationFillMode: "forwards" }}>
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-3">
              Password updated
            </h1>
            <p className="text-soft text-base mb-8">
              Your password has been successfully reset. You can now sign in with your new password.
            </p>
            <Button
              onClick={() => navigate("/home")}
              className="w-full h-12 text-base font-medium"
            >
              Continue to app
            </Button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-bg flex flex-col">
      {/* Main content */}
      <main className="flex-1 flex flex-col justify-center px-4 sm:px-6 pb-8 max-w-lg mx-auto w-full">
        <div className="text-center mb-8 opacity-0 animate-fade-in" style={{ animationFillMode: "forwards" }}>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-3">
            Set your new password
          </h1>
          <p className="text-soft text-base">
            Choose a new password for your account.
          </p>
        </div>

        <form 
          onSubmit={handleSubmit} 
          className="space-y-5 opacity-0 animate-fade-in"
          style={{ animationDelay: "100ms", animationFillMode: "forwards" }}
        >
          <div className="space-y-2">
            <Label htmlFor="password" className="text-foreground/90">New password</Label>
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

          <div className="space-y-2">
            <Label htmlFor="confirm-password" className="text-foreground/90">Confirm password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                id="confirm-password"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  if (errors.confirmPassword) setErrors(prev => ({ ...prev, confirmPassword: undefined }));
                }}
                className="pl-11 pr-11 bg-card border-border/50 h-12"
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="text-sm text-destructive">{errors.confirmPassword}</p>
            )}
          </div>

          <Button
            type="submit"
            className="w-full h-12 text-base font-medium"
            disabled={isLoading}
          >
            {isLoading ? "Updating..." : "Update password"}
          </Button>
        </form>
      </main>
    </div>
  );
};

export default ResetPassword;