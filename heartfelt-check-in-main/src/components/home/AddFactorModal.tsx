import { useState } from "react";
import { Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface AvailableFactor {
  id: string;
  emoji: string;
  label: string;
}

interface AddFactorModalProps {
  isOpen: boolean;
  onClose: () => void;
  availableFactors: AvailableFactor[];
  onSelectFactor: (factor: AvailableFactor) => void;
  onAddCustomFactor: (factor: { id: string; emoji: string; label: string; isCustom: boolean }) => void;
}

const emojiOptions = ["😊", "💪", "🎯", "🌟", "🔥", "💫", "🌈", "⭐", "❤️", "🧠", "🎵", "📚", "🍎", "💤", "🚶", "🧘", "🌿", "☀️"];

const AddFactorModal = ({ 
  isOpen, 
  onClose, 
  availableFactors, 
  onSelectFactor,
  onAddCustomFactor 
}: AddFactorModalProps) => {
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [customName, setCustomName] = useState("");
  const [selectedEmoji, setSelectedEmoji] = useState("😊");
  const [error, setError] = useState("");

  const handleSelect = (factor: AvailableFactor) => {
    onSelectFactor(factor);
    onClose();
  };

  const handleAddCustom = () => {
    const trimmedName = customName.trim();
    
    if (!trimmedName) {
      setError("Please enter a name");
      return;
    }
    
    if (trimmedName.length > 20) {
      setError("Name must be 20 characters or less");
      return;
    }

    const customFactor = {
      id: `custom-${Date.now()}`,
      emoji: selectedEmoji,
      label: trimmedName,
      isCustom: true,
    };

    onAddCustomFactor(customFactor);
    setCustomName("");
    setSelectedEmoji("😊");
    setShowCustomForm(false);
    setError("");
    onClose();
  };

  const handleClose = () => {
    setShowCustomForm(false);
    setCustomName("");
    setSelectedEmoji("😊");
    setError("");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="bg-card border-border max-w-sm mx-auto max-h-[70vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-foreground text-center">Add a factor to track</DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto space-y-2 py-2">
          {!showCustomForm ? (
            <>
              {availableFactors.map((factor) => (
                <button
                  key={factor.id}
                  onClick={() => handleSelect(factor)}
                  className="w-full flex items-center gap-4 p-4 rounded-xl border border-border/30 bg-background hover:border-accent/50 hover:bg-accent/5 transition-all duration-200"
                >
                  <span className="text-2xl">{factor.emoji}</span>
                  <span className="text-foreground font-medium">{factor.label}</span>
                </button>
              ))}
              
              <button
                onClick={() => setShowCustomForm(true)}
                className="w-full flex items-center gap-4 p-4 rounded-xl border border-dashed border-border/50 bg-background/50 hover:border-accent/50 hover:bg-accent/5 transition-all duration-200"
              >
                <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center">
                  <Plus className="w-4 h-4 text-accent" />
                </div>
                <span className="text-muted-foreground font-medium">Add your own</span>
              </button>
            </>
          ) : (
            <div className="space-y-4 py-2">
              <div>
                <label className="text-sm text-muted-foreground mb-2 block">Factor name</label>
                <Input
                  value={customName}
                  onChange={(e) => {
                    setCustomName(e.target.value);
                    setError("");
                  }}
                  placeholder="e.g., Reading, Journaling..."
                  maxLength={20}
                  className="bg-background border-border/50"
                />
                {error && <p className="text-destructive text-sm mt-1">{error}</p>}
              </div>
              
              <div>
                <label className="text-sm text-muted-foreground mb-2 block">Choose an emoji</label>
                <div className="flex flex-wrap gap-2">
                  {emojiOptions.map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => setSelectedEmoji(emoji)}
                      className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl transition-all ${
                        selectedEmoji === emoji
                          ? "bg-accent/30 border-2 border-accent"
                          : "bg-background border border-border/30 hover:border-accent/50"
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="flex gap-3 pt-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowCustomForm(false);
                    setError("");
                  }}
                  className="flex-1"
                >
                  Back
                </Button>
                <Button
                  onClick={handleAddCustom}
                  className="flex-1"
                >
                  Add factor
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddFactorModal;
