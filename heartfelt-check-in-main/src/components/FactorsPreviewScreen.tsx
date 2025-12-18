import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

interface FactorsPreviewScreenProps {
  onChooseFactors: () => void;
  onBack: () => void;
}

const MoodPatternPreview = () => {
  // Generate smooth curve points for the mood line
  const points = [
    { x: 0, y: 60 },
    { x: 15, y: 45 },
    { x: 30, y: 55 },
    { x: 45, y: 35 },
    { x: 60, y: 50 },
    { x: 75, y: 30 },
    { x: 90, y: 40 },
    { x: 100, y: 35 },
  ];

  const pathD = points.reduce((acc, point, i) => {
    if (i === 0) return `M ${point.x} ${point.y}`;
    const prev = points[i - 1];
    const cpX = (prev.x + point.x) / 2;
    return `${acc} C ${cpX} ${prev.y}, ${cpX} ${point.y}, ${point.x} ${point.y}`;
  }, "");

  const factors = [
    { label: "Movement", bars: [true, false, true, true, false, true, false, true, true, false, true, false] },
    { label: "Sleep", bars: [true, true, false, true, true, true, false, true, false, true, true, true] },
    { label: "Social", bars: [false, true, true, false, true, false, true, false, true, true, false, true] },
    { label: "Stimulants", bars: [true, false, false, true, false, true, false, false, true, false, true, false] },
  ];

  return (
    <div className="w-full rounded-2xl bg-card/50 border border-border/30 p-5 backdrop-blur-sm">
      {/* Mood Line Graph */}
      <div className="relative h-24 mb-6">
        <svg className="w-full h-full" viewBox="0 0 100 80" preserveAspectRatio="none">
          <defs>
            <linearGradient id="moodGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="hsl(210, 80%, 60%)" />
              <stop offset="50%" stopColor="hsl(160, 60%, 50%)" />
              <stop offset="100%" stopColor="hsl(45, 80%, 55%)" />
            </linearGradient>
            <linearGradient id="moodGradientFill" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="hsl(210, 80%, 60%)" stopOpacity="0.15" />
              <stop offset="50%" stopColor="hsl(160, 60%, 50%)" stopOpacity="0.15" />
              <stop offset="100%" stopColor="hsl(45, 80%, 55%)" stopOpacity="0.15" />
            </linearGradient>
          </defs>
          {/* Fill under the curve */}
          <path
            d={`${pathD} L 100 80 L 0 80 Z`}
            fill="url(#moodGradientFill)"
          />
          {/* The curve line */}
          <path
            d={pathD}
            fill="none"
            stroke="url(#moodGradient)"
            strokeWidth="2"
            strokeLinecap="round"
          />
          {/* Dots on the curve */}
          {points.map((point, i) => (
            <circle
              key={i}
              cx={point.x}
              cy={point.y}
              r="2.5"
              fill="hsl(var(--background))"
              stroke="url(#moodGradient)"
              strokeWidth="1.5"
            />
          ))}
        </svg>
      </div>

      {/* Factor Rows */}
      <div className="space-y-3">
        {factors.map((factor) => (
          <div key={factor.label} className="flex items-center gap-3">
            <span className="text-xs text-soft w-20 shrink-0">{factor.label}</span>
            <div className="flex gap-1.5 flex-1">
              {factor.bars.map((active, i) => (
                <div
                  key={i}
                  className={`h-4 w-1.5 rounded-full transition-all ${
                    active
                      ? "bg-primary/60"
                      : "bg-muted/30"
                  }`}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Caption */}
      <p className="text-xs text-soft/70 text-center mt-5">
        Patterns become clearer over time
      </p>
    </div>
  );
};

const FactorsPreviewScreen = ({ onChooseFactors, onBack }: FactorsPreviewScreenProps) => {
  return (
    <div className="min-h-screen gradient-bg flex flex-col px-6 py-8">
      {/* Back Button */}
      <button
        onClick={onBack}
        className="self-start p-2 -ml-2 text-soft hover:text-foreground transition-colors"
        aria-label="Go back"
      >
        <ArrowLeft className="w-5 h-5" />
      </button>

      {/* Content */}
      <div className="flex-1 flex flex-col justify-center max-w-md mx-auto w-full">
        {/* Title */}
        <h1 className="text-2xl font-bold text-foreground text-center mb-3 opacity-0 animate-fade-in" style={{ animationFillMode: "forwards" }}>
          See what influences how you feel
        </h1>

        {/* Subtitle */}
        <p className="text-soft text-center mb-8 opacity-0 animate-fade-in" style={{ animationDelay: "0.1s", animationFillMode: "forwards" }}>
          Some habits and experiences can impact your mood over time.
        </p>

        {/* Preview Graphic */}
        <div className="mb-8 opacity-0 animate-fade-in" style={{ animationDelay: "0.2s", animationFillMode: "forwards" }}>
          <MoodPatternPreview />
        </div>

        {/* Supporting Copy */}
        <p className="text-sm text-soft/80 text-center mb-8 opacity-0 animate-fade-in" style={{ animationDelay: "0.3s", animationFillMode: "forwards" }}>
          This helps you spot connections between habits and emotions.
        </p>

        {/* Button */}
        <div className="opacity-0 animate-fade-in" style={{ animationDelay: "0.4s", animationFillMode: "forwards" }}>
          <Button
            onClick={onChooseFactors}
            className="w-full py-6 text-base font-medium rounded-xl"
          >
            Choose factors to track
          </Button>
        </div>
      </div>
    </div>
  );
};

export default FactorsPreviewScreen;
