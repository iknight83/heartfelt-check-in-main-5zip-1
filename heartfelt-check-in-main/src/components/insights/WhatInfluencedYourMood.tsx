import { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { MoodEntry } from "@/hooks/useMoodState";

interface WhatInfluencedYourMoodProps {
  monthMoods: MoodEntry[];
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

const BASELINE = 3;
const MIN_ENTRIES = 3;

export const WhatInfluencedYourMood = ({ monthMoods }: WhatInfluencedYourMoodProps) => {
  const triggerData = useMemo(() => {
    const triggerSet = new Set<string>();
    monthMoods.forEach(e => (e.triggers ?? []).forEach(t => triggerSet.add(t)));

    return Array.from(triggerSet)
      .map(trigger => {
        const withTrigger = monthMoods.filter(e => (e.triggers ?? []).includes(trigger));
        const avgMood =
          withTrigger.length > 0
            ? withTrigger.reduce((s, e) => s + (MOOD_TO_LEVEL5[e.mood] ?? 3), 0) / withTrigger.length
            : BASELINE;
        return { trigger, count: withTrigger.length, avgMood, delta: avgMood - BASELINE };
      })
      .sort((a, b) => b.avgMood - a.avgMood);
  }, [monthMoods]);

  const usedTriggers = triggerData.filter(t => t.count > 0);

  if (monthMoods.length < MIN_ENTRIES || usedTriggers.length === 0) {
    return (
      <Card className="bg-card/60 backdrop-blur-sm border-border/40">
        <CardContent className="p-5">
          <h2 className="text-foreground font-bold mb-3">What Influenced Your Mood</h2>
          <div className="rounded-xl bg-muted/10 border border-border/20 p-4 text-center">
            <p className="text-muted-foreground text-sm leading-relaxed">
              Add triggers to your check-ins to discover what impacts your mood.
            </p>
            <p className="text-muted-foreground/40 text-xs mt-1.5">
              When you've used a trigger 3+ times, patterns will appear here.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card/60 backdrop-blur-sm border-border/40 overflow-hidden">
      <CardContent className="p-5">
        <h2 className="text-foreground font-bold mb-4">What Influenced Your Mood</h2>

        <div className="space-y-3">
          {usedTriggers.map(({ trigger, count, avgMood, delta }) => {
            const barColor =
              delta >= 0.5  ? "#22c55e" :
              delta >= 0.1  ? "#06b6d4" :
              delta <= -0.5 ? "#ef4444" :
              delta <= -0.1 ? "#f97316" :
              "rgba(255,255,255,0.3)";

            const barWidth = Math.min(50, (Math.abs(delta) / 2) * 100);
            const isPositive = delta >= 0;

            return (
              <div key={trigger} className="rounded-xl bg-muted/10 border border-border/20 p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-foreground/80 text-sm">{trigger}</span>
                    <span className="text-muted-foreground/50 text-xs">({count}×)</span>
                  </div>
                  <span className="text-xs font-semibold" style={{ color: barColor }}>
                    avg {avgMood.toFixed(1)}/5
                  </span>
                </div>

                {/* Delta bar centred at Okay (3) */}
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground/40 text-[9px] w-5 text-right">Low</span>
                  <div className="flex-1 h-1 bg-border/30 rounded-full relative">
                    <div className="absolute left-1/2 top-0 w-px h-full bg-border/60" />
                    <div
                      className="absolute h-full rounded-full"
                      style={{
                        left: isPositive ? "50%" : `${50 - barWidth}%`,
                        width: `${barWidth}%`,
                        backgroundColor: barColor,
                        minWidth: 2,
                      }}
                    />
                  </div>
                  <span className="text-muted-foreground/40 text-[9px] w-7">Great</span>
                </div>

                {count < 5 && (
                  <p className="text-muted-foreground/40 text-[10px] mt-1.5">
                    Low confidence — log more entries with this trigger
                  </p>
                )}
              </div>
            );
          })}
        </div>

        <p className="text-muted-foreground/40 text-xs mt-3 italic">
          Correlations, not causes. Many factors affect your mood.
        </p>
      </CardContent>
    </Card>
  );
};
