import { ArrowLeft, Plus, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";

const DEFAULT_FACTORS = [
  { id: "alcohol", name: "Alcohol", emoji: "🍷", enabled: true },
  { id: "medication", name: "Medication", emoji: "💊", enabled: true },
  { id: "caffeine", name: "Caffeine", emoji: "☕", enabled: true },
  { id: "intimacy", name: "Intimacy", emoji: "💕", enabled: true },
  { id: "cycle", name: "Cycle/Hormones", emoji: "🌙", enabled: true },
  { id: "activity", name: "Physical activity", emoji: "🏃", enabled: true },
  { id: "mindfulness", name: "Mindfulness", emoji: "🧘", enabled: true },
];

interface TrackedFactor {
  id: string;
  name: string;
  emoji: string;
  enabled: boolean;
}

const SettingsTrackedFactors = () => {
  const navigate = useNavigate();
  const [factors, setFactors] = useState<TrackedFactor[]>([]);
  const [showAddNew, setShowAddNew] = useState(false);
  const [newFactorName, setNewFactorName] = useState("");
  const [newFactorEmoji, setNewFactorEmoji] = useState("✨");

  useEffect(() => {
    const stored = localStorage.getItem("trackedFactors");
    if (stored) {
      setFactors(JSON.parse(stored));
    } else {
      setFactors(DEFAULT_FACTORS);
    }
  }, []);

  const saveFactors = (updated: TrackedFactor[]) => {
    setFactors(updated);
    localStorage.setItem("trackedFactors", JSON.stringify(updated));
  };

  const toggleFactor = (id: string) => {
    const updated = factors.map(f => 
      f.id === id ? { ...f, enabled: !f.enabled } : f
    );
    saveFactors(updated);
  };

  const removeFactor = (id: string) => {
    const updated = factors.filter(f => f.id !== id);
    saveFactors(updated);
    toast({ title: "Factor removed" });
  };

  const addFactor = () => {
    if (!newFactorName.trim()) return;
    
    const newFactor: TrackedFactor = {
      id: `custom-${Date.now()}`,
      name: newFactorName.trim(),
      emoji: newFactorEmoji,
      enabled: true,
    };
    
    saveFactors([...factors, newFactor]);
    setNewFactorName("");
    setNewFactorEmoji("✨");
    setShowAddNew(false);
    toast({ title: "Factor added" });
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <div className="sticky top-0 bg-background/95 backdrop-blur-sm border-b border-border/50 z-10">
        <div className="flex items-center gap-3 p-4">
          <button 
            onClick={() => navigate("/you")}
            className="p-2 -ml-2 hover:bg-muted rounded-full transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-semibold">Tracked Factors</h1>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Explanation */}
        <div className="bg-muted/30 rounded-xl p-4">
          <p className="text-sm text-muted-foreground leading-relaxed">
            Tracked factors help uncover patterns over time. You can change these anytime.
          </p>
        </div>

        {/* Currently Tracked */}
        <div className="space-y-3">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
            Currently Tracked
          </h2>
          
          <div className="space-y-2">
            {factors.map((factor) => (
              <div 
                key={factor.id}
                className="flex items-center justify-between bg-card rounded-xl p-4 border border-border/50"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">{factor.emoji}</span>
                  <span className="font-medium">{factor.name}</span>
                </div>
                
                <div className="flex items-center gap-3">
                  <Switch
                    checked={factor.enabled}
                    onCheckedChange={() => toggleFactor(factor.id)}
                  />
                  {factor.id.startsWith("custom-") && (
                    <button
                      onClick={() => removeFactor(factor.id)}
                      className="p-1 text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Add New Factor */}
        {showAddNew ? (
          <div className="bg-card rounded-xl p-4 border border-border/50 space-y-4">
            <h3 className="font-medium">Add New Factor</h3>
            
            <div className="flex gap-3">
              <Input
                value={newFactorEmoji}
                onChange={(e) => setNewFactorEmoji(e.target.value)}
                className="w-16 text-center text-xl"
                maxLength={2}
              />
              <Input
                value={newFactorName}
                onChange={(e) => setNewFactorName(e.target.value)}
                placeholder="Factor name"
                className="flex-1"
                maxLength={20}
              />
            </div>
            
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={() => setShowAddNew(false)}
              >
                Cancel
              </Button>
              <Button 
                className="flex-1"
                onClick={addFactor}
                disabled={!newFactorName.trim()}
              >
                Add
              </Button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowAddNew(true)}
            className="w-full flex items-center justify-center gap-2 p-4 rounded-xl border-2 border-dashed border-border/50 text-muted-foreground hover:border-primary/50 hover:text-foreground transition-colors"
          >
            <Plus className="w-5 h-5" />
            <span>Add new factor</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default SettingsTrackedFactors;
