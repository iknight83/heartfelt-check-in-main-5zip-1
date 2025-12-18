import { useState, useEffect } from "react";
import { X, Check } from "lucide-react";

interface ResetAction {
  title: string;
  duration: number;
  steps: string[];
}

interface ResetActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  mood?: string;
  triggers?: string[];
}

const ResetActionModal = ({ isOpen, onClose, mood, triggers }: ResetActionModalProps) => {
  const [action, setAction] = useState<ResetAction | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchAction();
    } else {
      // Reset state when modal closes
      setAction(null);
      setCurrentStep(0);
      setCompleted(false);
      setError(null);
    }
  }, [isOpen, mood, triggers]);

  const fetchAction = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-reset-action`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          mood: mood || 'uninspired',
          triggers: triggers || [],
          intensity: 'medium',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate action');
      }

      const data = await response.json();
      setAction(data);
    } catch (err) {
      console.error('Error fetching action:', err);
      setError('Something went wrong. Try again.');
      // Use fallback action
      setAction({
        title: "Pattern Break",
        duration: 60,
        steps: [
          "Stand up and look for 5 blue objects around you.",
          "Touch 3 different textures near you.",
          "Take one slow breath in through the nose, out through the mouth.",
          "Sit back down when done."
        ]
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStepComplete = () => {
    if (action && currentStep < action.steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      setCompleted(true);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-background/95 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-md mx-4 animate-in fade-in zoom-in-95 duration-300">
        <div className="bg-card/80 backdrop-blur-md rounded-3xl border border-border/30 p-8 shadow-2xl">
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <div className="w-12 h-12 rounded-full border-2 border-accent/30 border-t-accent animate-spin" />
              <p className="text-muted-foreground text-sm">Creating your reset...</p>
            </div>
          ) : completed ? (
            <div className="flex flex-col items-center justify-center py-8 space-y-6">
              <div className="w-16 h-16 rounded-full bg-accent/20 flex items-center justify-center">
                <Check className="w-8 h-8 text-accent" />
              </div>
              <div className="text-center space-y-2">
                <h2 className="text-xl font-medium text-foreground">Done</h2>
                <p className="text-muted-foreground text-sm">How do you feel now?</p>
              </div>
              <button
                onClick={onClose}
                className="px-8 py-3 rounded-full bg-accent text-accent-foreground font-medium hover:bg-accent/90 transition-colors"
              >
                Close
              </button>
            </div>
          ) : action ? (
            <div className="space-y-6">
              {/* Title */}
              <div className="text-center space-y-2">
                <h2 className="text-2xl font-medium text-foreground">{action.title}</h2>
                <p className="text-muted-foreground text-sm">~{action.duration} seconds</p>
              </div>

              {/* Progress dots */}
              <div className="flex justify-center gap-2">
                {action.steps.map((_, index) => (
                  <div
                    key={index}
                    className={`w-2 h-2 rounded-full transition-colors ${
                      index < currentStep 
                        ? 'bg-accent' 
                        : index === currentStep 
                          ? 'bg-accent/70' 
                          : 'bg-muted'
                    }`}
                  />
                ))}
              </div>

              {/* Current step */}
              <div className="bg-muted/30 rounded-2xl p-6 min-h-[120px] flex items-center justify-center">
                <p className="text-lg text-center text-foreground leading-relaxed">
                  {action.steps[currentStep]}
                </p>
              </div>

              {/* Action button */}
              <button
                onClick={handleStepComplete}
                className="w-full py-4 rounded-2xl bg-accent text-accent-foreground font-medium hover:bg-accent/90 transition-colors"
              >
                {currentStep < action.steps.length - 1 ? 'Next' : 'Done'}
              </button>

              {/* Step counter */}
              <p className="text-center text-muted-foreground text-sm">
                Step {currentStep + 1} of {action.steps.length}
              </p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-8 space-y-4">
              <p className="text-muted-foreground">{error}</p>
              <button
                onClick={fetchAction}
                className="px-6 py-2 rounded-full bg-accent/20 text-accent hover:bg-accent/30 transition-colors"
              >
                Try again
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default ResetActionModal;
