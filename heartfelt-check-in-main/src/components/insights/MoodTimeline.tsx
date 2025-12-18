import { useMemo } from "react";
import { format, getDaysInMonth, startOfMonth, addDays } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface MoodEntry {
  id: string;
  level: number;
  timestamp: Date;
  label: string;
}

interface MoodTimelineProps {
  moodEntries: MoodEntry[];
  selectedMonth: Date;
}

// Mood level to color mapping
const getMoodColor = (level: number, label?: string): string => {
  // Map common labels first
  const labelColors: Record<string, string> = {
    "Awful": "hsl(0, 70%, 55%)",
    "Angry": "hsl(0, 70%, 55%)",
    "Bad": "hsl(330, 60%, 55%)",
    "Sad": "hsl(330, 60%, 55%)",
    "Low": "hsl(330, 60%, 55%)",
    "Meh": "hsl(270, 55%, 55%)",
    "Uninspired": "hsl(270, 55%, 55%)",
    "Okay": "hsl(210, 70%, 55%)",
    "Ok": "hsl(210, 70%, 55%)",
    "Calm": "hsl(210, 70%, 55%)",
    "Nice": "hsl(190, 80%, 50%)",
    "Content": "hsl(190, 80%, 50%)",
    "Cheerful": "hsl(160, 70%, 50%)",
    "Good": "hsl(140, 60%, 50%)",
    "Happy": "hsl(140, 60%, 50%)",
    "Great": "hsl(140, 60%, 50%)",
    "Amazing": "hsl(45, 90%, 50%)",
    "Awesome": "hsl(45, 90%, 50%)",
    "Thrilled": "hsl(45, 90%, 50%)",
  };

  if (label && labelColors[label]) {
    return labelColors[label];
  }

  // Fallback to level-based colors
  if (level <= 20) return "hsl(0, 70%, 55%)"; // Awful - red
  if (level <= 35) return "hsl(330, 60%, 55%)"; // Bad - pink
  if (level <= 45) return "hsl(270, 55%, 55%)"; // Meh - purple
  if (level <= 55) return "hsl(210, 70%, 55%)"; // Ok - blue
  if (level <= 65) return "hsl(190, 80%, 50%)"; // Nice - cyan
  if (level <= 80) return "hsl(140, 60%, 50%)"; // Good - green
  return "hsl(45, 90%, 50%)"; // Amazing - yellow/gold
};

export const MoodTimeline = ({ moodEntries, selectedMonth }: MoodTimelineProps) => {
  const daysCount = getDaysInMonth(selectedMonth);
  
  // Group moods by day
  const moodsByDay = useMemo(() => {
    const map = new Map<number, MoodEntry[]>();
    
    moodEntries.forEach(entry => {
      const entryDate = new Date(entry.timestamp);
      if (entryDate.getMonth() === selectedMonth.getMonth() && 
          entryDate.getFullYear() === selectedMonth.getFullYear()) {
        const day = entryDate.getDate();
        if (!map.has(day)) map.set(day, []);
        map.get(day)!.push(entry);
      }
    });
    
    return map;
  }, [moodEntries, selectedMonth]);

  // Create array of days for the month
  const days = useMemo(() => {
    const start = startOfMonth(selectedMonth);
    return Array.from({ length: daysCount }, (_, i) => ({
      day: i + 1,
      date: addDays(start, i),
      moods: moodsByDay.get(i + 1) || [],
    }));
  }, [daysCount, selectedMonth, moodsByDay]);

  if (moodEntries.length === 0) {
    return (
      <Card className="bg-card/60 backdrop-blur-sm border-border/40">
        <CardContent className="p-5">
          <h2 className="text-foreground font-bold mb-3">Mood Timeline</h2>
          <p className="text-muted-foreground text-sm">Start tracking to see your emotional journey.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card/60 backdrop-blur-sm border-border/40 overflow-hidden">
      <CardContent className="p-5">
        <h2 className="text-foreground font-bold mb-4">Mood Timeline</h2>
        
        {/* Timeline strip */}
        <TooltipProvider delayDuration={100}>
          <div className="flex gap-[2px] items-end h-20">
            {days.map(({ day, date, moods }) => {
              const hasEntry = moods.length > 0;
              
              // Calculate bar height and color based on moods
              const avgLevel = hasEntry 
                ? moods.reduce((sum, m) => sum + m.level, 0) / moods.length 
                : 0;
              const barHeight = hasEntry ? Math.max(15, avgLevel) : 8;
              const primaryMood = moods[0];
              const color = hasEntry ? getMoodColor(avgLevel, primaryMood?.label) : undefined;
              
              return (
                <Tooltip key={day}>
                  <TooltipTrigger asChild>
                    <div className="flex-1 flex flex-col items-center gap-1 cursor-pointer group">
                      {/* Stacked mood markers for multiple entries */}
                      <div className="relative flex flex-col-reverse items-center gap-0.5" style={{ height: `${barHeight}%` }}>
                        {hasEntry ? (
                          moods.slice(0, 3).map((mood, idx) => (
                            <div
                              key={mood.id}
                              className="w-full min-h-[4px] rounded-t-sm transition-all duration-300 group-hover:opacity-80"
                              style={{
                                flex: 1,
                                backgroundColor: getMoodColor(mood.level, mood.label),
                                boxShadow: `0 0 8px ${getMoodColor(mood.level, mood.label)}40`,
                                opacity: 1 - idx * 0.2,
                              }}
                            />
                          ))
                        ) : (
                          <div 
                            className="w-full h-full rounded-t-sm bg-border/20"
                          />
                        )}
                      </div>
                      
                      {/* Day number */}
                      <span className={`text-[9px] transition-colors ${
                        hasEntry ? 'text-muted-foreground' : 'text-muted-foreground/40'
                      }`}>
                        {day}
                      </span>
                    </div>
                  </TooltipTrigger>
                  
                  {hasEntry && (
                    <TooltipContent 
                      side="top" 
                      className="bg-card/95 backdrop-blur-sm border-border/50"
                    >
                      <div className="text-xs space-y-1">
                        <p className="font-medium text-foreground">
                          {format(date, "d MMM")}
                        </p>
                        {moods.map(mood => (
                          <div key={mood.id} className="flex items-center gap-2">
                            <div 
                              className="w-2 h-2 rounded-full" 
                              style={{ backgroundColor: getMoodColor(mood.level, mood.label) }}
                            />
                            <span className="text-muted-foreground">
                              {mood.label} ({format(new Date(mood.timestamp), "HH:mm")})
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
        
        {/* Legend */}
        <div className="flex items-center justify-center gap-3 mt-4 pt-3 border-t border-border/20">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: "hsl(0, 70%, 55%)" }} />
            <span className="text-[10px] text-muted-foreground">Awful</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: "hsl(270, 55%, 55%)" }} />
            <span className="text-[10px] text-muted-foreground">Meh</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: "hsl(210, 70%, 55%)" }} />
            <span className="text-[10px] text-muted-foreground">Ok</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: "hsl(140, 60%, 50%)" }} />
            <span className="text-[10px] text-muted-foreground">Good</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: "hsl(45, 90%, 50%)" }} />
            <span className="text-[10px] text-muted-foreground">Amazing</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
