import { useMemo } from "react";
import { format, getDaysInMonth, startOfMonth, addDays } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Users, Briefcase, MapPin, Globe, Tag, AlertCircle } from "lucide-react";

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

// Trigger type icons
const getTriggerIcon = (trigger: string) => {
  const peopleWords = ["myself", "partner", "family", "friends", "colleagues"];
  const activityWords = ["work", "training", "hobby", "resting", "studying", "music", "tv", "physical", "exercise"];
  const placeWords = ["home", "office", "school", "university"];
  const externalWords = ["news", "economy", "social media", "weather"];
  
  const lowerTrigger = trigger.toLowerCase();
  
  if (peopleWords.some(w => lowerTrigger.includes(w))) return Users;
  if (activityWords.some(w => lowerTrigger.includes(w))) return Briefcase;
  if (placeWords.some(w => lowerTrigger.includes(w))) return MapPin;
  if (externalWords.some(w => lowerTrigger.includes(w))) return Globe;
  return Tag;
};

// Mood level to color mapping
const getMoodColor = (level: number, label?: string): string => {
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

  if (level <= 20) return "hsl(0, 70%, 55%)";
  if (level <= 35) return "hsl(330, 60%, 55%)";
  if (level <= 45) return "hsl(270, 55%, 55%)";
  if (level <= 55) return "hsl(210, 70%, 55%)";
  if (level <= 65) return "hsl(190, 80%, 50%)";
  if (level <= 80) return "hsl(140, 60%, 50%)";
  return "hsl(45, 90%, 50%)";
};

export const MoodTimelineWithTriggers = ({ moodEntries, selectedMonth }: MoodTimelineWithTriggersProps) => {
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
    return Array.from({ length: daysCount }, (_, i) => {
      const moods = moodsByDay.get(i + 1) || [];
      const hasContext = moods.some(m => m.triggers && m.triggers.length > 0);
      const allTriggers = moods.flatMap(m => m.triggers || []);
      const uniqueTriggers = [...new Set(allTriggers)];
      
      return {
        day: i + 1,
        date: addDays(start, i),
        moods,
        hasContext,
        triggers: uniqueTriggers,
      };
    });
  }, [daysCount, selectedMonth, moodsByDay]);

  // Count entries with/without context
  const stats = useMemo(() => {
    let withContext = 0;
    let withoutContext = 0;
    
    days.forEach(d => {
      d.moods.forEach(m => {
        if (m.triggers && m.triggers.length > 0) withContext++;
        else withoutContext++;
      });
    });
    
    return { withContext, withoutContext };
  }, [days]);

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
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-foreground font-bold">Mood Timeline</h2>
          {stats.withoutContext > 0 && (
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-amber-500/10 border border-amber-500/20">
              <AlertCircle className="w-3 h-3 text-amber-400" />
              <span className="text-amber-400 text-[10px] font-medium">
                {stats.withoutContext} without context
              </span>
            </div>
          )}
        </div>
        
        {/* Timeline strip with trigger overlay */}
        <TooltipProvider delayDuration={100}>
          <div className="flex gap-[2px] items-end h-24">
            {days.map(({ day, date, moods, hasContext, triggers }) => {
              const hasEntry = moods.length > 0;
              
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
                      {/* Trigger indicators (top layer) */}
                      {hasEntry && triggers.length > 0 && (
                        <div className="flex items-center justify-center gap-0.5 h-3 mb-0.5">
                          {triggers.slice(0, 2).map((trigger, idx) => {
                            const Icon = getTriggerIcon(trigger);
                            return (
                              <Icon 
                                key={idx} 
                                className="w-2.5 h-2.5 text-accent/70"
                              />
                            );
                          })}
                          {triggers.length > 2 && (
                            <span className="text-[8px] text-muted-foreground">+{triggers.length - 2}</span>
                          )}
                        </div>
                      )}
                      
                      {/* No context indicator */}
                      {hasEntry && !hasContext && (
                        <div className="h-3 mb-0.5 flex items-center justify-center">
                          <div className="w-1.5 h-1.5 rounded-full bg-amber-400/50" />
                        </div>
                      )}
                      
                      {/* Empty space for alignment when no entry */}
                      {!hasEntry && <div className="h-3 mb-0.5" />}
                      
                      {/* Mood bars */}
                      <div className="relative flex flex-col-reverse items-center gap-0.5 flex-1" style={{ height: `${barHeight}%` }}>
                        {hasEntry ? (
                          moods.slice(0, 3).map((mood, idx) => (
                            <div
                              key={mood.id}
                              className={`w-full min-h-[4px] rounded-t-sm transition-all duration-300 group-hover:opacity-80 ${
                                !mood.triggers?.length ? "opacity-50" : ""
                              }`}
                              style={{
                                flex: 1,
                                backgroundColor: getMoodColor(mood.level, mood.label),
                                boxShadow: mood.triggers?.length 
                                  ? `0 0 8px ${getMoodColor(mood.level, mood.label)}40`
                                  : "none",
                                opacity: mood.triggers?.length ? 1 - idx * 0.2 : 0.4,
                              }}
                            />
                          ))
                        ) : (
                          <div className="w-full h-full rounded-t-sm bg-border/20" />
                        )}
                      </div>
                      
                      {/* Day number */}
                      <span className={`text-[9px] transition-colors ${
                        hasEntry 
                          ? hasContext 
                            ? 'text-muted-foreground' 
                            : 'text-amber-400/60'
                          : 'text-muted-foreground/40'
                      }`}>
                        {day}
                      </span>
                    </div>
                  </TooltipTrigger>
                  
                  {hasEntry && (
                    <TooltipContent 
                      side="top" 
                      className="bg-card/95 backdrop-blur-sm border-border/50 max-w-[200px]"
                    >
                      <div className="text-xs space-y-2">
                        <p className="font-medium text-foreground">
                          {format(date, "d MMM")}
                        </p>
                        
                        {moods.map(mood => (
                          <div key={mood.id} className="space-y-1">
                            <div className="flex items-center gap-2">
                              <div 
                                className="w-2 h-2 rounded-full" 
                                style={{ backgroundColor: getMoodColor(mood.level, mood.label) }}
                              />
                              <span className="text-muted-foreground">
                                {mood.label} ({format(new Date(mood.timestamp), "HH:mm")})
                              </span>
                            </div>
                            
                            {mood.triggers && mood.triggers.length > 0 ? (
                              <div className="flex flex-wrap gap-1 ml-4">
                                {mood.triggers.map((trigger, idx) => (
                                  <span 
                                    key={idx}
                                    className="px-1.5 py-0.5 rounded bg-accent/10 text-accent text-[10px]"
                                  >
                                    {trigger}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <p className="text-amber-400/70 text-[10px] ml-4 italic">
                                No context logged
                              </p>
                            )}
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
        <div className="flex items-center justify-between mt-4 pt-3 border-t border-border/20">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: "hsl(0, 70%, 55%)" }} />
              <span className="text-[10px] text-muted-foreground">Low</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: "hsl(210, 70%, 55%)" }} />
              <span className="text-[10px] text-muted-foreground">Ok</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: "hsl(45, 90%, 50%)" }} />
              <span className="text-[10px] text-muted-foreground">Great</span>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <Users className="w-2.5 h-2.5 text-accent/70" />
              <span className="text-[9px] text-muted-foreground/60">= has context</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-amber-400/50" />
              <span className="text-[9px] text-muted-foreground/60">= missing</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
