import { useState } from "react";
import EmotionCard from "./EmotionCard";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";

const emotions = [
  { emoji: "😰", label: "Anxiety" },
  { emoji: "😞", label: "Depression" },
  { emoji: "😵‍💫", label: "Mood swings" },
  { emoji: "😨", label: "Fear" },
  { emoji: "😢", label: "Loss" },
  { emoji: "😔", label: "Loneliness" },
  { emoji: "💔", label: "Breakup" },
  { emoji: "😶", label: "Feeling numb" },
  { emoji: "😎", label: "All good, just looking around" },
];

interface CheckInScreenProps {
  onContinue: (emotions: string[]) => void;
  onSkip: () => void;
}

const CheckInScreen = ({ onContinue, onSkip }: CheckInScreenProps) => {
  const [selected, setSelected] = useState<string[]>([]);

  const toggleSelection = (label: string) => {
    setSelected((prev) =>
      prev.includes(label)
        ? prev.filter((item) => item !== label)
        : [...prev, label]
    );
  };

  const isDisabled = selected.length === 0;

  const handleContinue = () => {
    onContinue(selected);
  };

  return (
    <div className="min-h-screen gradient-bg flex flex-col">
      {/* Skip button */}
      <div className="flex justify-end p-4 sm:p-6">
        <button 
          onClick={onSkip}
          className="text-muted-foreground hover:text-foreground text-sm font-medium transition-colors duration-200 px-3 py-1.5 rounded-lg hover:bg-secondary/50"
        >
          Skip
        </button>
      </div>

      {/* Main content */}
      <main className="flex-1 flex flex-col px-4 sm:px-6 pb-8 max-w-lg mx-auto w-full">
        {/* Header */}
        <div className="text-center mb-8 opacity-0 animate-fade-in">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-3 leading-tight">
            What brought you here today?
          </h1>
          <p className="text-soft text-base sm:text-lg leading-relaxed">
            Choose anything that feels relevant right now.
            <br className="hidden sm:block" />
            <span className="text-muted-foreground"> You can select more than one.</span>
          </p>
        </div>

        {/* Emotion grid */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4 flex-1 content-start">
          {emotions.map((emotion, index) => (
            <EmotionCard
              key={emotion.label}
              emoji={emotion.emoji}
              label={emotion.label}
              selected={selected.includes(emotion.label)}
              onClick={() => toggleSelection(emotion.label)}
              delay={100 + index * 50}
            />
          ))}
        </div>

        {/* Continue button */}
        <div 
          className="mt-8 opacity-0 animate-fade-in"
          style={{ animationDelay: "600ms" }}
        >
          <Button
            onClick={handleContinue}
            disabled={isDisabled}
            className={cn(
              "w-full py-6 text-base font-semibold rounded-xl transition-all duration-300",
              !isDisabled && "glow-button hover:scale-[1.01]"
            )}
          >
            Continue
          </Button>
        </div>
      </main>
    </div>
  );
};

export default CheckInScreen;
