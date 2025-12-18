import { useMemo } from "react";
import { format, isSameDay, isToday } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { TrackedFactor, getFactorsForDate } from "@/hooks/useTrackedFactors";
import { MoodEntry } from "@/hooks/useMoodState";

interface InfluenceTrackingProps {
  factors: TrackedFactor[];
  daysInMonth: Date[];
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
  moodsByDay: Record<string, MoodEntry[]>;
  getMoodInfo: (mood: string) => { color: string; level: number };
  calendarRef: React.RefObject<HTMLDivElement>;
}

export const InfluenceTracking = ({
  factors,
  daysInMonth,
  selectedDate,
  onDateSelect,
  moodsByDay,
  getMoodInfo,
  calendarRef
}: InfluenceTrackingProps) => {
  // Calculate factor influence categories
  const factorInfluence = useMemo(() => {
    const influences: { factor: TrackedFactor; impact: "uplifting" | "neutral" | "draining"; avgMoodWhenUsed: number }[] = [];
    
    factors.forEach(factor => {
      let totalMood = 0;
      let daysWithFactor = 0;
      
      daysInMonth.forEach(day => {
        const dayFactors = getFactorsForDate(day);
        const dayFactor = dayFactors.find(f => f.id === factor.id);
        const dayMoods = moodsByDay[format(day, "yyyy-MM-dd")] || [];
        
        if (dayFactor && dayFactor.count > 0 && dayMoods.length > 0) {
          const avgLevel = dayMoods.reduce((sum, m) => sum + getMoodInfo(m.mood).level, 0) / dayMoods.length;
          totalMood += avgLevel;
          daysWithFactor++;
        }
      });
      
      if (daysWithFactor > 0) {
        const avgMood = totalMood / daysWithFactor;
        let impact: "uplifting" | "neutral" | "draining" = "neutral";
        if (avgMood >= 5) impact = "uplifting";
        else if (avgMood <= 3) impact = "draining";
        
        influences.push({ factor, impact, avgMoodWhenUsed: avgMood });
      } else {
        influences.push({ factor, impact: "neutral", avgMoodWhenUsed: 4 });
      }
    });
    
    return influences;
  }, [factors, daysInMonth, moodsByDay, getMoodInfo]);

  const uplifting = factorInfluence.filter(f => f.impact === "uplifting");
  const neutral = factorInfluence.filter(f => f.impact === "neutral");
  const draining = factorInfluence.filter(f => f.impact === "draining");

  return (
    <Card className="bg-card/60 backdrop-blur-sm border-border/40 overflow-hidden">
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-foreground font-bold">Influence Tracking</h2>
          <button 
            onClick={() => onDateSelect(new Date())}
            className="text-accent text-xs font-medium hover:text-accent/80 transition-colors"
          >
            Today
          </button>
        </div>
        
        {/* Calendar strip */}
        <div 
          ref={calendarRef}
          className="overflow-x-auto scrollbar-hide -mx-5 px-5 mb-5"
        >
          <div className="flex gap-1" style={{ width: "max-content" }}>
            {daysInMonth.map((day) => {
              const dayMoods = moodsByDay[format(day, "yyyy-MM-dd")] || [];
              const hasMood = dayMoods.length > 0;
              const isSelected = isSameDay(day, selectedDate);
              const isTodayDate = isToday(day);
              
              return (
                <button
                  key={format(day, "yyyy-MM-dd")}
                  data-date={format(day, "yyyy-MM-dd")}
                  onClick={() => onDateSelect(day)}
                  className={`flex flex-col items-center gap-0.5 py-2 px-2 rounded-xl transition-all duration-200 min-w-[38px] ${
                    isSelected 
                      ? "bg-accent/20 ring-1 ring-accent/40" 
                      : "hover:bg-card-hover"
                  }`}
                >
                  <span className={`text-[10px] ${isSelected ? "text-accent" : "text-muted-foreground"}`}>
                    {format(day, "EEE").slice(0, 2)}
                  </span>
                  <span className={`text-xs font-bold ${
                    isSelected ? "text-foreground" : "text-foreground/80"
                  }`}>
                    {format(day, "d")}
                  </span>
                  <div 
                    className={`w-1.5 h-1.5 rounded-full ${
                      hasMood ? "" : isTodayDate ? "bg-accent/40" : "bg-transparent"
                    }`}
                    style={hasMood ? { 
                      backgroundColor: getMoodInfo(dayMoods[0].mood).color,
                      boxShadow: `0 0 6px ${getMoodInfo(dayMoods[0].mood).color}`
                    } : {}}
                  />
                </button>
              );
            })}
          </div>
        </div>

        {/* Factor rows with influence grouping */}
        {factors.length > 0 ? (
          <div className="space-y-4">
            {/* Uplifting */}
            {uplifting.length > 0 && (
              <div>
                <p className="text-xs text-emerald-400/80 font-medium mb-2 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  Most uplifting
                </p>
                <div className="space-y-2">
                  {uplifting.map(({ factor }) => (
                    <FactorRow 
                      key={factor.id} 
                      factor={factor} 
                      selectedDate={selectedDate}
                      accentColor="hsl(145 80% 50%)"
                    />
                  ))}
                </div>
              </div>
            )}
            
            {/* Neutral */}
            {neutral.length > 0 && (
              <div>
                <p className="text-xs text-muted-foreground font-medium mb-2 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground" />
                  Neutral influence
                </p>
                <div className="space-y-2">
                  {neutral.map(({ factor }) => (
                    <FactorRow 
                      key={factor.id} 
                      factor={factor} 
                      selectedDate={selectedDate}
                      accentColor="hsl(var(--accent))"
                    />
                  ))}
                </div>
              </div>
            )}
            
            {/* Draining */}
            {draining.length > 0 && (
              <div>
                <p className="text-xs text-orange-400/80 font-medium mb-2 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-400" />
                  Often draining
                </p>
                <div className="space-y-2">
                  {draining.map(({ factor }) => (
                    <FactorRow 
                      key={factor.id} 
                      factor={factor} 
                      selectedDate={selectedDate}
                      accentColor="hsl(30 90% 55%)"
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <p className="text-muted-foreground text-sm">Start tracking factors to see their influence.</p>
        )}
      </CardContent>
    </Card>
  );
};

const FactorRow = ({ 
  factor, 
  selectedDate, 
  accentColor 
}: { 
  factor: TrackedFactor; 
  selectedDate: Date;
  accentColor: string;
}) => {
  const dayFactors = getFactorsForDate(selectedDate);
  const dayFactor = dayFactors.find(f => f.id === factor.id);
  const dayCount = dayFactor?.count || 0;
  const maxCount = 5;
  
  // Generate dots for visual representation
  const dots = Array.from({ length: maxCount }, (_, i) => i < dayCount);

  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-2 min-w-0">
        <span className="text-sm shrink-0">{factor.emoji}</span>
        <span className="text-foreground text-xs font-medium truncate">{factor.name}</span>
      </div>
      <div className="flex items-center gap-1">
        {dots.map((filled, idx) => (
          <div
            key={idx}
            className={`w-2 h-2 rounded-full transition-all duration-300 ${
              filled ? "" : "bg-border/40"
            }`}
            style={filled ? { 
              backgroundColor: accentColor,
              boxShadow: `0 0 4px ${accentColor}60`
            } : {}}
          />
        ))}
        <span className="text-muted-foreground text-xs ml-1 min-w-[20px] text-right">{dayCount}</span>
      </div>
    </div>
  );
};
