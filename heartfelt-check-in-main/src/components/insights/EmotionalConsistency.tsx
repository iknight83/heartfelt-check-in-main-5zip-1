import { Card, CardContent } from "@/components/ui/card";

interface EmotionalConsistencyProps {
  stability: { score: number; description: string };
  entryCount: number;
}

const MIN_ENTRIES = 7;

const getScoreLabel = (score: number) => {
  if (score >= 80) return { label: "Very stable", color: "#22c55e" };
  if (score >= 60) return { label: "Fairly steady", color: "#3b82f6" };
  if (score >= 40) return { label: "Some variation", color: "#f59e0b" };
  return { label: "High variability", color: "#ef4444" };
};

export const EmotionalConsistency = ({ stability, entryCount }: EmotionalConsistencyProps) => {
  const isLocked = entryCount < MIN_ENTRIES;

  if (isLocked) {
    return (
      <Card className="bg-card/60 backdrop-blur-sm border-border/40">
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-foreground font-bold">Emotional Consistency</h2>
            <span className="text-xs text-muted-foreground px-2 py-1 rounded-full bg-muted/20 border border-border/30">
              {entryCount}/{MIN_ENTRIES} days
            </span>
          </div>

          <div className="rounded-xl bg-muted/10 border border-border/20 p-5 flex flex-col items-center gap-3 text-center">
            <span className="text-2xl">📊</span>
            <p className="text-foreground text-sm font-medium">Score unlocks at {MIN_ENTRIES} days</p>
            <p className="text-muted-foreground text-xs leading-relaxed">
              You need {MIN_ENTRIES - entryCount} more check-in{MIN_ENTRIES - entryCount !== 1 ? "s" : ""} for a
              meaningful consistency reading
            </p>
            <div className="w-full h-1.5 rounded-full bg-border/30 overflow-hidden mt-1">
              <div
                className="h-full rounded-full bg-accent transition-all duration-500"
                style={{ width: `${Math.min(100, (entryCount / MIN_ENTRIES) * 100)}%` }}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const score = Math.round(stability.score);
  const { label: scoreLabel, color: scoreColor } = getScoreLabel(score);

  return (
    <Card className="bg-card/60 backdrop-blur-sm border-border/40 overflow-hidden">
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-foreground font-bold">Emotional Consistency</h2>
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center font-bold text-sm"
            style={{
              backgroundColor: `${scoreColor}20`,
              color: scoreColor,
            }}
          >
            {score}
          </div>
        </div>

        <div className="relative h-2 rounded-full bg-border/30 overflow-hidden mb-3">
          <div
            className="h-full rounded-full transition-all duration-700 ease-out"
            style={{
              width: `${score}%`,
              backgroundColor: scoreColor,
              boxShadow: `0 0 8px ${scoreColor}50`,
            }}
          />
        </div>

        <p className="font-medium mb-1" style={{ color: scoreColor }}>
          {scoreLabel}
        </p>
        <p className="text-muted-foreground text-sm leading-relaxed">
          {stability.description}
        </p>
      </CardContent>
    </Card>
  );
};
