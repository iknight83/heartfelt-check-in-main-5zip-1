import { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { MoodEntry } from "@/hooks/useMoodState";

interface PatternsYouMightMissProps {
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

const TIME_BUCKETS = ["Morning", "Afternoon", "Evening", "Night"] as const;
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;
const MIN_ENTRIES = 7;
const MIN_TIME_BUCKET = 3;
const MIN_WEEKDAY_BUCKET = 2;

const getTimeBucket = (hour: number): typeof TIME_BUCKETS[number] => {
  if (hour >= 5 && hour < 12) return "Morning";
  if (hour >= 12 && hour < 17) return "Afternoon";
  if (hour >= 17 && hour < 21) return "Evening";
  return "Night";
};

export const PatternsYouMightMiss = ({ monthMoods }: PatternsYouMightMissProps) => {
  const { timeOfDay, weekdays } = useMemo(() => {
    const timeBuckets: Record<string, number[]> = { Morning: [], Afternoon: [], Evening: [], Night: [] };
    const dayBuckets: Record<string, number[]> = Object.fromEntries(WEEKDAYS.map(d => [d, []]));

    monthMoods.forEach(e => {
      const level = MOOD_TO_LEVEL5[e.mood] ?? 3;
      const dt = new Date(e.timestamp);
      timeBuckets[getTimeBucket(dt.getHours())].push(level);
      dayBuckets[WEEKDAYS[dt.getDay()]].push(level);
    });

    const timeOfDay = TIME_BUCKETS.map(label => ({
      label,
      count: timeBuckets[label].length,
      avg:
        timeBuckets[label].length >= MIN_TIME_BUCKET
          ? parseFloat((timeBuckets[label].reduce((s, v) => s + v, 0) / timeBuckets[label].length).toFixed(1))
          : null,
    })).filter(b => b.count > 0);

    const weekdays = WEEKDAYS.map(day => ({
      day,
      count: dayBuckets[day].length,
      avg:
        dayBuckets[day].length >= MIN_WEEKDAY_BUCKET
          ? parseFloat((dayBuckets[day].reduce((s, v) => s + v, 0) / dayBuckets[day].length).toFixed(1))
          : null,
    }));

    return { timeOfDay, weekdays };
  }, [monthMoods]);

  if (monthMoods.length < MIN_ENTRIES) {
    return (
      <Card className="bg-card/60 backdrop-blur-sm border-border/40">
        <CardContent className="p-5">
          <h2 className="text-foreground font-bold mb-3">Patterns You Might Miss</h2>
          <div className="flex flex-col items-center py-4 gap-3">
            <div className="h-1.5 rounded-full bg-border/30 w-full overflow-hidden">
              <div
                className="h-full rounded-full bg-accent/60 transition-all duration-500"
                style={{ width: `${Math.min(100, (monthMoods.length / MIN_ENTRIES) * 100)}%` }}
              />
            </div>
            <p className="text-muted-foreground text-sm text-center">
              Patterns unlock after {MIN_ENTRIES} check-ins
              <span className="text-accent font-medium"> ({monthMoods.length}/{MIN_ENTRIES})</span>
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const bestTimeOfDay = timeOfDay.filter(b => b.avg !== null).sort((a, b) => b.avg! - a.avg!)[0];
  const bestWeekday = weekdays.filter(d => d.avg !== null).sort((a, b) => b.avg! - a.avg!)[0];
  const worstWeekday = weekdays.filter(d => d.avg !== null).sort((a, b) => a.avg! - b.avg!)[0];

  return (
    <Card className="bg-card/60 backdrop-blur-sm border-border/40 overflow-hidden">
      <CardContent className="p-5">
        <h2 className="text-foreground font-bold mb-4">Patterns You Might Miss</h2>

        {/* Time of day */}
        {timeOfDay.length > 0 && (
          <div className="mb-5">
            <p className="text-muted-foreground/50 text-[10px] uppercase tracking-wider font-medium mb-3">
              Time of day
            </p>
            <div className="flex gap-2">
              {timeOfDay.map(({ label, count, avg }) => (
                <div key={label} className="flex-1 text-center">
                  <div className="h-10 rounded bg-border/20 flex items-end overflow-hidden mb-1">
                    {avg !== null && (
                      <div
                        className="w-full rounded-t-sm transition-all duration-500"
                        style={{
                          height: `${(avg / 5) * 100}%`,
                          backgroundColor:
                            label === bestTimeOfDay?.label ? "hsl(var(--accent))" : "rgba(255,255,255,0.12)",
                        }}
                      />
                    )}
                  </div>
                  <p className="text-muted-foreground/50 text-[9px]">{label.slice(0, 3)}</p>
                  {avg !== null ? (
                    <p className="text-muted-foreground text-[10px] font-medium">{avg}</p>
                  ) : (
                    <p className="text-muted-foreground/30 text-[9px]">({count})</p>
                  )}
                </div>
              ))}
            </div>
            {bestTimeOfDay && (
              <p className="text-muted-foreground text-xs mt-2">
                You tend to feel best in the{" "}
                <span className="text-accent">{bestTimeOfDay.label}</span>{" "}
                (avg {bestTimeOfDay.avg})
              </p>
            )}
          </div>
        )}

        {/* Day of week */}
        <div>
          <p className="text-muted-foreground/50 text-[10px] uppercase tracking-wider font-medium mb-3">
            Day of week
          </p>
          <div className="flex gap-1">
            {weekdays.map(({ day, avg }) => (
              <div key={day} className="flex-1 text-center">
                <div className="h-8 rounded bg-border/20 flex items-end overflow-hidden mb-1">
                  {avg !== null && (
                    <div
                      className="w-full rounded-t-sm transition-all duration-500"
                      style={{
                        height: `${(avg / 5) * 100}%`,
                        backgroundColor:
                          day === bestWeekday?.day ? "#22c55e" :
                          day === worstWeekday?.day ? "#ef4444" :
                          "rgba(255,255,255,0.12)",
                      }}
                    />
                  )}
                </div>
                <p
                  className="text-[9px]"
                  style={{ color: avg !== null ? "rgba(255,255,255,0.4)" : "rgba(255,255,255,0.1)" }}
                >
                  {day}
                </p>
              </div>
            ))}
          </div>
          {bestWeekday && worstWeekday && bestWeekday.day !== worstWeekday.day && (
            <p className="text-muted-foreground text-xs mt-2">
              Best day: <span className="text-green-400">{bestWeekday.day}</span> · Toughest:{" "}
              <span className="text-red-400">{worstWeekday.day}</span>
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
