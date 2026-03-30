import { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { MoodEntry } from "@/hooks/useMoodState";

interface EmotionBreakdownProps {
  moodsByDay: Record<string, MoodEntry[]>;
}

const MOOD_TO_CATEGORY: Record<string, number> = {
  "Awful": 1, "Angry": 1, "Frustrated": 1, "Overwhelmed": 1, "Drained": 1,
  "Hopeless": 1, "Broken": 1, "Devastated": 1, "Miserable": 1,
  "Low": 2, "Sad": 2, "Irritated": 2, "Worried": 2, "Embarrassed": 2,
  "Down": 2, "Anxious": 2, "Lonely": 2, "Stressed": 2,
  "Meh": 3, "Uninspired": 3, "Restless": 3, "Indifferent": 3, "Tired": 3,
  "Bored": 3, "Distracted": 3, "Unfocused": 3, "Flat": 3,
  "Okay": 4, "Ok": 4, "Calm": 4, "Steady": 4, "Balanced": 4, "Peaceful": 4,
  "Easygoing": 4, "Neutral": 4, "Stable": 4, "Fine": 4,
  "Nice": 4, "Relaxed": 4, "Comfortable": 4, "Hopeful": 4, "Lively": 4,
  "Content": 4, "Pleasant": 4, "Optimistic": 4, "Cheerful": 4,
  "Great": 5, "Good": 5, "Happy": 5, "Joyful": 5, "Satisfied": 5,
  "Motivated": 5, "Grateful": 5, "Energetic": 5, "Confident": 5, "Fulfilled": 5,
  "Amazing": 5, "Thrilled": 5, "Radiant": 5, "Inspired": 5, "Alive": 5,
  "Ecstatic": 5, "Blissful": 5, "Euphoric": 5, "Empowered": 5,
};

const FIXED_CATEGORIES = [
  { level: 1, label: "Low",   color: "#ef4444" },
  { level: 2, label: "Bad",   color: "#f97316" },
  { level: 3, label: "Okay",  color: "#a855f7" },
  { level: 4, label: "Good",  color: "#3b82f6" },
  { level: 5, label: "Great", color: "#22c55e" },
];

const MIN_ENTRIES = 3;

export const EmotionBreakdown = ({ moodsByDay }: EmotionBreakdownProps) => {
  const { totals, total } = useMemo(() => {
    const counts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    let total = 0;
    Object.values(moodsByDay).forEach(entries => {
      entries.forEach(entry => {
        const cat = MOOD_TO_CATEGORY[entry.mood] ?? 4;
        counts[cat] = (counts[cat] || 0) + 1;
        total++;
      });
    });
    return { totals: counts, total };
  }, [moodsByDay]);

  if (total < MIN_ENTRIES) {
    return (
      <Card className="bg-card/60 backdrop-blur-sm border-border/40">
        <CardContent className="p-5">
          <h2 className="text-foreground font-bold mb-3">Emotional Breakdown</h2>
          <div className="flex flex-col items-center py-4 gap-3">
            <div className="h-1.5 rounded-full bg-border/30 w-full overflow-hidden">
              <div
                className="h-full rounded-full bg-accent/60 transition-all duration-500"
                style={{ width: `${Math.min(100, (total / MIN_ENTRIES) * 100)}%` }}
              />
            </div>
            <p className="text-muted-foreground text-sm text-center">
              Log {MIN_ENTRIES} moods to see your breakdown
              <span className="text-accent font-medium"> ({total}/{MIN_ENTRIES})</span>
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card/60 backdrop-blur-sm border-border/40 overflow-hidden">
      <CardContent className="p-5">
        <h2 className="text-foreground font-bold mb-4">Emotional Breakdown</h2>

        <div className="space-y-3">
          {FIXED_CATEGORIES.map(({ level, label, color }) => {
            const count = totals[level] || 0;
            const pct = total > 0 ? Math.round((count / total) * 100) : 0;
            return (
              <div key={label} className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-foreground text-sm font-medium">{label}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground text-xs">{count} · </span>
                    <span
                      className="text-xs font-semibold min-w-[36px] text-right"
                      style={{ color: count > 0 ? color : undefined }}
                    >
                      {pct}%
                    </span>
                  </div>
                </div>
                <div className="relative h-2 rounded-full bg-border/30 overflow-hidden">
                  <div
                    className="absolute inset-y-0 left-0 rounded-full transition-all duration-700 ease-out"
                    style={{
                      width: `${pct}%`,
                      backgroundColor: color,
                      boxShadow: count > 0 ? `0 0 10px ${color}40` : "none",
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        <p className="text-muted-foreground/60 text-xs mt-5">Based on {total} entries this month</p>
      </CardContent>
    </Card>
  );
};
