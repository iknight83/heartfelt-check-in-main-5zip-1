import { useState } from "react";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";
import { ArrowLeft } from "lucide-react";

const durations = [
  { emoji: "📅", label: "Days" },
  { emoji: "📆", label: "Weeks" },
  { emoji: "🗓️", label: "Months" },
  { emoji: "⏳", label: "Years" },
];

interface DurationScreenProps {
  onNext: (duration: string) => void;
  onBack: () => void;
}

const DurationScreen = ({ onNext, onBack }: DurationScreenProps) => {
  const [selected, setSelected] = useState<string | null>(null);

  const isDisabled = selected === null;

  const handleNext = () => {
    if (selected) {
      onNext(selected);
    }
  };

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
      <main className="flex-1 flex flex-col px-4 sm:px-6 pb-8 max-w-lg mx-auto w-full">
        {/* Header */}
        <div className="text-center mb-8 opacity-0 animate-fade-in">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-3 leading-tight">
            How long has this been going on?
          </h1>
          <p className="text-soft text-base sm:text-lg leading-relaxed">
            Pick the option that feels closest.
          </p>
        </div>

        {/* Duration options */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4 flex-1 content-start">
          {durations.map((duration, index) => (
            <button
              key={duration.label}
              onClick={() => setSelected(duration.label)}
              className={cn(
                "flex flex-col items-center justify-center gap-2 p-6 sm:p-8 rounded-2xl transition-all duration-300 opacity-0 animate-fade-in",
                "bg-card border border-border/50 hover:border-primary/30",
                selected === duration.label
                  ? "border-primary/60 bg-primary/10 glow-soft"
                  : "hover:bg-secondary/30"
              )}
              style={{ animationDelay: `${100 + index * 50}ms`, animationFillMode: "forwards" }}
            >
              <span className="text-4xl sm:text-5xl">{duration.emoji}</span>
              <span className="text-base sm:text-lg font-medium text-foreground">
                {duration.label}
              </span>
            </button>
          ))}
        </div>

        {/* Next button */}
        <div 
          className="mt-8 opacity-0 animate-fade-in"
          style={{ animationDelay: "400ms", animationFillMode: "forwards" }}
        >
          <Button
            onClick={handleNext}
            disabled={isDisabled}
            className={cn(
              "w-full py-6 text-base font-semibold rounded-xl transition-all duration-300",
              !isDisabled && "glow-button hover:scale-[1.01]"
            )}
          >
            Next
          </Button>
        </div>
      </main>
    </div>
  );
};

export default DurationScreen;
