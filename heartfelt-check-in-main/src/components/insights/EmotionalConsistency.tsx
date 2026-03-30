import { useMemo } from "react";
import { format, getDaysInMonth, startOfMonth, addDays } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { MoodEntry } from "@/hooks/useMoodState";

interface EmotionalConsistencyProps {
  monthMoods: MoodEntry[];
  selectedMonth: Date;
}

const MOOD_TO_LEVEL5: Record<string, number> = {
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

const MIN_ENTRIES = 7;

const getScoreLabel = (score: number) => {
  if (score >= 80) return { label: "Very stable", color: "#22c55e" };
  if (score >= 60) return { label: "Fairly steady", color: "#3b82f6" };
  if (score >= 40) return { label: "Some variation", color: "#f59e0b" };
  return { label: "High variability", color: "#ef4444" };
};

export const EmotionalConsistency = ({ monthMoods, selectedMonth }: EmotionalConsistencyProps) => {
  const daysCount = getDaysInMonth(selectedMonth);

  const { score, dailyAvgs } = useMemo(() => {
    const dayMap = new Map<string, number[]>();
    monthMoods.forEach(e => {
      const key = format(new Date(e.timestamp), "yyyy-MM-dd");
      const level = MOOD_TO_LEVEL5[e.mood] ?? 3;
      if (!dayMap.has(key)) dayMap.set(key, []);
      dayMap.get(key)!.push(level);
    });

    const start = startOfMonth(selectedMonth);
    const avgs: (number | null)[] = Array.from({ length: daysCount }, (_, i) => {
      const key = format(addDays(start, i), "yyyy-MM-dd");
      const arr = dayMap.get(key);
      return arr ? arr.reduce((s, v) => s + v, 0) / arr.length : null;
    });

    if (monthMoods.length < MIN_ENTRIES) return { score: null, dailyAvgs: avgs };

    const levels = monthMoods.map(e => MOOD_TO_LEVEL5[e.mood] ?? 3);
    const mean = levels.reduce((s, v) => s + v, 0) / levels.length;
    const variance = levels.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / levels.length;
    const sd = Math.sqrt(variance);
    const scoreVal = Math.round(Math.max(0, Math.min(100, (1 - sd / 2.0) * 100)));
    return { score: scoreVal, dailyAvgs: avgs };
  }, [monthMoods, daysCount, selectedMonth]);

  if (score === null) {
    return (
      <Card className="bg-card/60 backdrop-blur-sm border-border/40">
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-foreground font-bold">Emotional Consistency</h2>
            <span className="text-xs text-muted-foreground px-2 py-1 rounded-full bg-muted/20 border border-border/30">
              {monthMoods.length}/{MIN_ENTRIES} days
            </span>
          </div>
          <div className="rounded-xl bg-muted/10 border border-border/20 p-5 flex flex-col items-center gap-3 text-center">
            <span className="text-2xl">📊</span>
            <p className="text-foreground text-sm font-medium">Score unlocks after {MIN_ENTRIES} check-ins</p>
            <p className="text-muted-foreground text-xs leading-relaxed">
              {MIN_ENTRIES - monthMoods.length} more check-in{MIN_ENTRIES - monthMoods.length !== 1 ? "s" : ""} needed for a meaningful consistency reading
            </p>
            <div className="w-full h-1.5 rounded-full bg-border/30 overflow-hidden mt-1">
              <div
                className="h-full rounded-full bg-accent transition-all duration-500"
                style={{ width: `${Math.min(100, (monthMoods.length / MIN_ENTRIES) * 100)}%` }}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const scoreLabel = getScoreLabel(score);

  return (
    <Card className="bg-card/60 backdrop-blur-sm border-border/40 overflow-hidden">
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-foreground font-bold">Emotional Consistency</h2>
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center font-bold text-sm"
            style={{ backgroundColor: `${scoreLabel.color}20`, color: scoreLabel.color }}
          >
            {score}
          </div>
        </div>

        {/* Waveform — actual daily mood bars (not uniform height) */}
        <div className="flex items-end gap-[2px] h-10 mb-1">
          {dailyAvgs.map((avg, i) => (
            <div
              key={i}
              className="flex-1 rounded-t-[1px] transition-all duration-300"
              style={{
                height: avg !== null ? `${(avg / 5) * 100}%` : "10%",
                backgroundColor: avg !== null ? "hsl(var(--accent))" : "rgba(255,255,255,0.06)",
                opacity: avg !== null ? 0.9 : 0.3,
                minHeight: 2,
              }}
            />
          ))}
        </div>
        <div className="h-px rounded-full bg-accent/20 mb-4" />

        <p className="font-semibold text-sm mb-1" style={{ color: scoreLabel.color }}>
          {scoreLabel.label}
        </p>
        <p className="text-muted-foreground text-sm leading-relaxed">
          Your mood {score >= 60 ? "stays relatively consistent" : "shifts notably"} day to day.
        </p>
        <p className="text-muted-foreground/50 text-xs mt-1">
          Higher consistency means fewer sudden mood shifts throughout the month.
        </p>
      </CardContent>
    </Card>
  );
};
