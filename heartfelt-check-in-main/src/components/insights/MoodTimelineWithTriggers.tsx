import { useMemo } from "react";
import { format, getDaysInMonth, startOfMonth, addDays } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface MoodEntry {
  id: string;
  level: number;
  timestamp: Date;
  label: string;
  triggers: string[];
}

interface MoodTimelineWithTriggersProps {
  moodEntries: MoodEntry[];
  selectedMonth: Date;
}

const MOOD_COLORS: Record<string, string> = {
  "Awful": "#ef4444", "Angry": "#ef4444", "Frustrated": "#ef4444", "Overwhelmed": "#ef4444",
  "Drained": "#ef4444", "Hopeless": "#ef4444", "Broken": "#ef4444", "Devastated": "#ef4444", "Miserable": "#ef4444",
  "Low": "#f97316", "Sad": "#f97316", "Irritated": "#f97316", "Worried": "#f97316",
  "Embarrassed": "#f97316", "Down": "#f97316", "Anxious": "#f97316", "Lonely": "#f97316", "Stressed": "#f97316",
  "Meh": "#a855f7", "Uninspired": "#a855f7", "Restless": "#a855f7", "Indifferent": "#a855f7",
  "Tired": "#a855f7", "Bored": "#a855f7", "Distracted": "#a855f7", "Unfocused": "#a855f7", "Flat": "#a855f7",
  "Okay": "#3b82f6", "Ok": "#3b82f6", "Calm": "#3b82f6", "Steady": "#3b82f6",
  "Balanced": "#3b82f6", "Peaceful": "#3b82f6", "Easygoing": "#3b82f6", "Neutral": "#3b82f6", "Stable": "#3b82f6", "Fine": "#3b82f6",
  "Nice": "#06b6d4", "Relaxed": "#06b6d4", "Comfortable": "#06b6d4", "Hopeful": "#06b6d4",
  "Lively": "#06b6d4", "Content": "#06b6d4", "Pleasant": "#06b6d4", "Optimistic": "#06b6d4", "Cheerful": "#06b6d4",
  "Great": "#22c55e", "Good": "#22c55e", "Happy": "#22c55e", "Joyful": "#22c55e",
  "Satisfied": "#22c55e", "Motivated": "#22c55e", "Grateful": "#22c55e", "Energetic": "#22c55e", "Confident": "#22c55e", "Fulfilled": "#22c55e",
  "Amazing": "#eab308", "Thrilled": "#eab308", "Radiant": "#eab308", "Inspired": "#eab308",
  "Alive": "#eab308", "Ecstatic": "#eab308", "Blissful": "#eab308", "Euphoric": "#eab308", "Empowered": "#eab308",
};

const getMoodColor = (label: string, level: number): string => {
  if (MOOD_COLORS[label]) return MOOD_COLORS[label];
  if (level <= 1) return "#ef4444";
  if (level <= 2) return "#f97316";
  if (level <= 3) return "#a855f7";
  if (level <= 4) return "#3b82f6";
  if (level <= 5) return "#06b6d4";
  if (level <= 6) return "#22c55e";
  return "#eab308";
};

const levelToBarHeight = (level: number): number => {
  return Math.round(Math.max(14, Math.min(100, (level / 7) * 100)));
};

const MIN_ENTRIES = 3;

export const MoodTimelineWithTriggers = ({ moodEntries, selectedMonth }: MoodTimelineWithTriggersProps) => {
  const daysCount = getDaysInMonth(selectedMonth);

  const moodsByDay = useMemo(() => {
    const map = new Map<number, MoodEntry[]>();
    moodEntries.forEach(entry => {
      const entryDate = new Date(entry.timestamp);
      if (
        entryDate.getMonth() === selectedMonth.getMonth() &&
        entryDate.getFullYear() === selectedMonth.getFullYear()
      ) {
        const day = entryDate.getDate();
        if (!map.has(day)) map.set(day, []);
        map.get(day)!.push(entry);
      }
    });
    return map;
  }, [moodEntries, selectedMonth]);

  const days = useMemo(() => {
    const start = startOfMonth(selectedMonth);
    return Array.from({ length: daysCount }, (_, i) => ({
      day: i + 1,
      date: addDays(start, i),
      moods: moodsByDay.get(i + 1) || [],
    }));
  }, [daysCount, selectedMonth, moodsByDay]);

  const monthName = format(selectedMonth, "MMMM");

  if (moodEntries.length < MIN_ENTRIES) {
    return (
      <Card className="bg-card/60 backdrop-blur-sm border-border/40">
        <CardContent className="p-5">
          <h2 className="text-foreground font-bold mb-3">Mood Timeline — {monthName}</h2>
          <div className="flex flex-col items-center py-4 gap-3">
            <div className="h-1.5 rounded-full bg-border/30 w-full overflow-hidden">
              <div
                className="h-full rounded-full bg-accent/60 transition-all duration-500"
                style={{ width: `${Math.min(100, (moodEntries.length / MIN_ENTRIES) * 100)}%` }}
              />
            </div>
            <p className="text-muted-foreground text-sm text-center">
              Log {MIN_ENTRIES} moods to see your timeline
              <span className="text-accent font-medium"> ({moodEntries.length}/{MIN_ENTRIES})</span>
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card/60 backdrop-blur-sm border-border/40 overflow-hidden">
      <CardContent className="p-5">
        <h2 className="text-foreground font-bold mb-4">Mood Timeline — {monthName}</h2>

        <TooltipProvider delayDuration={100}>
          <div className="flex gap-[2px] items-end h-20">
            {days.map(({ day, date, moods }) => {
              const hasEntry = moods.length > 0;
              const avgLevel = hasEntry
                ? moods.reduce((sum, m) => sum + m.level, 0) / moods.length
                : 0;
              const barH = hasEntry ? levelToBarHeight(avgLevel) : 10;
              const primaryLabel = moods[0]?.label ?? "";
              const color = hasEntry ? getMoodColor(primaryLabel, avgLevel) : undefined;

              return (
                <Tooltip key={day}>
                  <TooltipTrigger asChild>
                    <div className="flex-1 flex flex-col items-center gap-0.5 cursor-pointer group">
                      <div
                        className="w-full rounded-t-[2px] transition-all duration-300 group-hover:brightness-125"
                        style={{
                          height: `${barH}%`,
                          backgroundColor: hasEntry ? color : "rgba(255,255,255,0.07)",
                          boxShadow: hasEntry ? `0 0 6px ${color}50` : "none",
                        }}
                      />
                      {day % 5 === 0 || day === 1 ? (
                        <span className="text-[9px] text-muted-foreground/60 mt-0.5">{day}</span>
                      ) : (
                        <span className="text-[9px] text-transparent mt-0.5">{day}</span>
                      )}
                    </div>
                  </TooltipTrigger>

                  {hasEntry && (
                    <TooltipContent
                      side="top"
                      className="bg-card/95 backdrop-blur-sm border-border/50 max-w-[180px]"
                    >
                      <div className="text-xs space-y-1.5">
                        <p className="font-medium text-foreground">{format(date, "d MMM")}</p>
                        {moods.map(mood => (
                          <div key={mood.id} className="flex items-center gap-2">
                            <div
                              className="w-2 h-2 rounded-full flex-shrink-0"
                              style={{ backgroundColor: getMoodColor(mood.label, mood.level) }}
                            />
                            <span className="text-muted-foreground">
                              {mood.label} · {format(new Date(mood.timestamp), "HH:mm")}
                            </span>
                          </div>
                        ))}
                      </div>
                    </TooltipContent>
                  )}
                </Tooltip>
              );
            })}
          </div>
        </TooltipProvider>

        <div className="flex items-center justify-center gap-4 mt-4 pt-3 border-t border-border/20">
          {[
            { label: "Low", color: "#ef4444" },
            { label: "Okay", color: "#3b82f6" },
            { label: "Great", color: "#22c55e" },
            { label: "No entry", color: "rgba(255,255,255,0.1)" },
          ].map(({ label, color }) => (
            <div key={label} className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full border border-white/10" style={{ backgroundColor: color }} />
              <span className="text-[10px] text-muted-foreground">{label}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
