import { useState } from "react";
import { ArrowLeft, Check, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { initializeFactorsFromOnboarding } from "@/hooks/useTrackedFactors";

interface FactorSelectionScreenProps {
  onContinue: (factors: string[]) => void;
  onBack: () => void;
}

interface Factor {
  id: string;
  label: string;
  emoji: string;
  isCustom?: boolean;
}

const defaultFactors: Factor[] = [
  { id: "alcohol", label: "Alcohol", emoji: "🍷" },
  { id: "medication", label: "Medication", emoji: "💊" },
  { id: "caffeine", label: "Caffeine", emoji: "☕" },
  { id: "intimacy", label: "Intimacy", emoji: "❤️" },
  { id: "cycle", label: "Cycle / Hormones", emoji: "🩸" },
  { id: "activity", label: "Physical activity", emoji: "🏃" },
  { id: "mindfulness", label: "Mindfulness", emoji: "🧘" },
];

const emojiOptions = ["✨", "🌙", "🎵", "📚", "🎮", "🍃", "💤", "🌞", "🏠", "💼", "🎯", "🌊", "🔥", "💭", "🎨", "🍎"];

const FactorSelectionScreen = ({ onContinue, onBack }: FactorSelectionScreenProps) => {
  const [selectedFactors, setSelectedFactors] = useState<string[]>([]);
  const [customFactors, setCustomFactors] = useState<Factor[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newFactorName, setNewFactorName] = useState("");
  const [selectedEmoji, setSelectedEmoji] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const allFactors = [...defaultFactors, ...customFactors];

  const toggleFactor = (factorId: string) => {
    setSelectedFactors(prev =>
      prev.includes(factorId)
        ? prev.filter(id => id !== factorId)
        : [...prev, factorId]
    );
  };

  const handleContinue = () => {
    // Only save factors if this is a NEW user (no termsAcceptedAt yet)
    // Returning users keep their existing factors from before sign-out
    const isNewUser = !localStorage.getItem("termsAcceptedAt");
    if (isNewUser) {
      // Only save for brand new users
      initializeFactorsFromOnboarding(selectedFactors, allFactors);
    }
    onContinue(selectedFactors);
  };

  const handleOpenModal = () => {
    setNewFactorName("");
    setSelectedEmoji(null);
    setError(null);
    setIsModalOpen(true);
  };

  const handleAddFactor = () => {
    const trimmedName = newFactorName.trim();
    
    if (!trimmedName) {
      setError("Please enter a factor name");
      return;
    }
    
    if (!selectedEmoji) {
      setError("Please select an emoji");
      return;
    }

    const isDuplicate = allFactors.some(
      f => f.label.toLowerCase() === trimmedName.toLowerCase()
    );
    
    if (isDuplicate) {
      setError("This factor already exists");
      return;
    }

    const newFactor: Factor = {
      id: `custom_${Date.now()}`,
      label: trimmedName,
      emoji: selectedEmoji,
      isCustom: true,
    };

    setCustomFactors(prev => [...prev, newFactor]);
    setSelectedFactors(prev => [...prev, newFactor.id]);
    setIsModalOpen(false);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col px-6 py-8">
      {/* Back button */}
      <button
        onClick={onBack}
        className="absolute top-6 left-6 p-2 text-muted-foreground hover:text-foreground transition-colors"
        aria-label="Go back"
      >
        <ArrowLeft className="w-6 h-6" />
      </button>

      <div className="flex-1 flex flex-col max-w-md mx-auto w-full pt-12">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-semibold text-foreground mb-3">
            Select factors to track
          </h1>
          <p className="text-muted-foreground text-base leading-relaxed">
            These help us notice patterns between your mood and daily habits.
          </p>
        </div>

        {/* Factor list */}
        <div className="flex-1 space-y-3 overflow-y-auto">
          {allFactors.map((factor) => {
            const isSelected = selectedFactors.includes(factor.id);
            return (
              <button
                key={factor.id}
                onClick={() => toggleFactor(factor.id)}
                className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all duration-200 ${
                  isSelected
                    ? "bg-primary/10 border-primary"
                    : "bg-card border-border hover:border-muted-foreground/30"
                }`}
              >
                <div className="flex items-center gap-4">
                  <span className="text-2xl">{factor.emoji}</span>
                  <span className="text-foreground font-medium">{factor.label}</span>
                </div>
                <div
                  className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-200 ${
                    isSelected
                      ? "bg-primary border-primary"
                      : "border-muted-foreground/40"
                  }`}
                >
                  {isSelected && <Check className="w-4 h-4 text-primary-foreground" />}
                </div>
              </button>
            );
          })}

          {/* Add your own button */}
          <button
            onClick={handleOpenModal}
            className="w-full flex items-center gap-4 p-4 rounded-xl border border-dashed border-muted-foreground/30 hover:border-primary/50 hover:bg-primary/5 transition-all duration-200"
          >
            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
              <Plus className="w-5 h-5 text-muted-foreground" />
            </div>
            <span className="text-muted-foreground font-medium">Add your own</span>
          </button>
        </div>

        {/* Continue button */}
        <div className="pt-6 pb-4">
          <Button
            onClick={handleContinue}
            disabled={selectedFactors.length === 0}
            className="w-full h-14 text-lg font-medium rounded-xl"
          >
            Continue
          </Button>
        </div>
      </div>

      {/* Add Custom Factor Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="bg-card border-border max-w-sm mx-auto">
          <DialogHeader>
            <DialogTitle className="text-foreground text-center">Add a custom factor</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-5 pt-2">
            {/* Factor name input */}
            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">Factor name</label>
              <Input
                value={newFactorName}
                onChange={(e) => {
                  setNewFactorName(e.target.value.slice(0, 20));
                  setError(null);
                }}
                placeholder="e.g., Work stress"
                className="bg-background border-border"
                maxLength={20}
              />
              <p className="text-xs text-muted-foreground text-right">
                {newFactorName.length}/20
              </p>
            </div>

            {/* Emoji picker */}
            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">Choose an emoji</label>
              <div className="grid grid-cols-8 gap-2">
                {emojiOptions.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => {
                      setSelectedEmoji(emoji);
                      setError(null);
                    }}
                    className={`w-10 h-10 text-xl rounded-lg flex items-center justify-center transition-all duration-150 ${
                      selectedEmoji === emoji
                        ? "bg-primary/20 ring-2 ring-primary"
                        : "bg-muted hover:bg-muted/80"
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            {/* Error message */}
            {error && (
              <p className="text-sm text-destructive text-center">{error}</p>
            )}

            {/* Add button */}
            <Button
              onClick={handleAddFactor}
              className="w-full h-12 font-medium rounded-xl"
            >
              Add factor
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FactorSelectionScreen;
