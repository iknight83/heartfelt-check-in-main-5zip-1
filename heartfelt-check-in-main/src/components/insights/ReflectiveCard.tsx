import { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { MoodEntry } from "@/hooks/useMoodState";

interface ReflectiveCardProps {
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

const LEVEL5_CONFIG: Record<number, { label: string; color: string }> = {
  1: { label: "Low",   color: "#ef4444" },
  2: { label: "Bad",   color: "#f97316" },
  3: { label: "Okay",  color: "#a855f7" },
  4: { label: "Good",  color: "#10b981" },
  5: { label: "Great", color: "#22c55e" },
};

const TONE_MAP: Record<number, (pct: number) => { title: string; body: string }> = {
  1: (pct) => ({ title: "Challenging Month",   body: `${pct}% of your check-ins this month were Low. That takes courage to acknowledge.` }),
  2: ()    => ({ title: "Tough Stretch",       body: "Most of your entries this month landed in the Bad range. Noticing that is the first step." }),
  3: ()    => ({ title: "Steady Month",        body: "You mostly felt Okay this month — balanced and moving through it." }),
  4: (pct) => ({ title: "Positive Month",      body: `${pct}% of your check-ins were Good this month. Things seem to be flowing well.` }),
  5: (pct) => ({ title: "Great Month",         body: `You were feeling Great for ${pct}% of this month. Take note of what made that happen.` }),
};

const MIN_ENTRIES = 3;

export const ReflectiveCard = ({ monthMoods }: ReflectiveCardProps) => {
  const reflection = useMemo(() => {
    if (monthMoods.length < MIN_ENTRIES) return null;

    const counts: Record<number, number> = {};
    monthMoods.forEach(e => {
      const level = MOOD_TO_LEVEL5[e.mood] ?? 3;
      counts[level] = (counts[level] || 0) + 1;
    });

    const dominantLevel = Number(
      Object.entries(counts).sort((a, b) => Number(b[1]) - Number(a[1]))[0][0]
    );
    const dominantPct = Math.round((counts[dominantLevel] / monthMoods.length) * 100);

    const triggerCounts: Record<string, number> = {};
    monthMoods.forEach(e => {
      (e.triggers ?? []).forEach(t => { triggerCounts[t] = (triggerCounts[t] || 0) + 1; });
    });
    const topDescriptors = Object.entries(triggerCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([t]) => t);

    const noteSnippet = monthMoods
      .filter(e => e.note && e.note.trim().length > 0)
      .map(e => {
        const words = e.note.trim().split(" ");
        return words.slice(0, 6).join(" ") + (words.length > 6 ? "…" : "");
      })[0] ?? null;

    const tone = TONE_MAP[dominantLevel]?.(dominantPct) ?? { title: "This Month", body: "Keep logging to reveal your patterns." };

    const allMoodLabels = Object.entries(counts)
      .sort((a, b) => Number(b[1]) - Number(a[1]))
      .map(([level, count]) => ({
        level: Number(level),
        ...LEVEL5_CONFIG[Number(level)],
        pct: Math.round((Number(count) / monthMoods.length) * 100),
      }));

    return { tone, dominantLevel, dominantPct, topDescriptors, noteSnippet, allMoodLabels };
  }, [monthMoods]);

  if (!reflection) {
    return (
      <Card className="bg-card/60 backdrop-blur-sm border-border/40">
        <CardContent className="p-5">
          <p className="text-muted-foreground text-sm text-center py-2">
            Log {MIN_ENTRIES} moods to get your personal reflection
          </p>
        </CardContent>
      </Card>
    );
  }

  const { tone, dominantLevel, dominantPct, topDescriptors, noteSnippet, allMoodLabels } = reflection;
  const dominantColor = LEVEL5_CONFIG[dominantLevel]?.color ?? "#3b82f6";

  return (
    <Card className="bg-card/60 backdrop-blur-sm border-border/40 overflow-hidden">
      <CardContent className="p-5">
        <div className="flex items-start gap-3">
          <div className="relative flex-shrink-0 mt-0.5">
            <span className="text-3xl leading-none">✦</span>
            <div
              className="absolute -bottom-1 -right-2 text-[9px] font-bold px-1.5 py-0.5 rounded-full border"
              style={{
                color: dominantColor,
                backgroundColor: `${dominantColor}15`,
                borderColor: `${dominantColor}40`,
              }}
            >
              {dominantPct}%
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-foreground font-bold text-base mb-1.5">{tone.title}</p>
            <p className="text-muted-foreground text-sm leading-relaxed mb-2">{tone.body}</p>

            {noteSnippet && (
              <blockquote className="border-l-2 border-accent/50 pl-3 mb-2">
                <p className="text-accent/80 text-xs italic">"{noteSnippet}"</p>
              </blockquote>
            )}

            {topDescriptors.length > 0 && (
              <p className="text-muted-foreground/60 text-xs">
                You described yourself as: {topDescriptors.join(", ")}
              </p>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5 mt-4">
          {allMoodLabels
            .filter(m => m.pct > 0)
            .map(m => (
              <span
                key={m.level}
                className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs border"
                style={{
                  color: m.color,
                  backgroundColor: `${m.color}15`,
                  borderColor: `${m.color}30`,
                }}
              >
                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: m.color }} />
                {m.label} {m.pct}%
              </span>
            ))}
        </div>
      </CardContent>
    </Card>
  );
};
