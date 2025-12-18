import { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { MoodEntry } from "@/hooks/useMoodState";

interface EmotionData {
  mood: string;
  count: number;
  percentage: number;
  color: string;
  category: "positive" | "neutral" | "negative";
}

interface EmotionBreakdownProps {
  emotionDistribution: EmotionData[];
  moodsByDay: Record<string, MoodEntry[]>;
}

export const EmotionBreakdown = ({ emotionDistribution, moodsByDay }: EmotionBreakdownProps) => {
  // Generate timeline dots from daily moods
  const timelineDots = useMemo(() => {
    const dots: { day: number; color: string; level: number }[] = [];
    Object.entries(moodsByDay).forEach(([dateKey, moods]) => {
      const day = parseInt(dateKey.split("-")[2]);
      moods.forEach((mood, idx) => {
        const emotionData = emotionDistribution.find(e => e.mood === mood.mood);
        if (emotionData) {
          dots.push({
            day,
            color: emotionData.color,
            level: emotionData.category === "positive" ? 3 : emotionData.category === "neutral" ? 2 : 1
          });
        }
      });
    });
    return dots.sort((a, b) => a.day - b.day);
  }, [moodsByDay, emotionDistribution]);

  if (emotionDistribution.length === 0) {
    return (
      <Card className="bg-card/60 backdrop-blur-sm border-border/40">
        <CardContent className="p-5">
          <h2 className="text-foreground font-bold mb-3">Emotional Breakdown</h2>
          <p className="text-muted-foreground text-sm">Start tracking moods to see your emotional patterns.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card/60 backdrop-blur-sm border-border/40 overflow-hidden">
      <CardContent className="p-5">
        <h2 className="text-foreground font-bold mb-4">Emotional Breakdown</h2>
        
        {/* Horizontal emotion distribution bars */}
        <div className="space-y-3 mb-6">
          {emotionDistribution.slice(0, 6).map((emotion) => (
            <div key={emotion.mood} className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-foreground text-sm font-medium">{emotion.mood}</span>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground text-xs">{emotion.count}x</span>
                  <span className="text-foreground text-xs font-semibold min-w-[32px] text-right">
                    {emotion.percentage}%
                  </span>
                </div>
              </div>
              <div className="relative h-2 rounded-full bg-border/30 overflow-hidden">
                <div
                  className="absolute inset-y-0 left-0 rounded-full transition-all duration-700 ease-out"
                  style={{ 
                    width: `${emotion.percentage}%`,
                    backgroundColor: emotion.color,
                    boxShadow: `0 0 12px ${emotion.color}40`
                  }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Timeline dots showing when moods occurred */}
        <div className="pt-4 border-t border-border/30">
          <p className="text-muted-foreground text-xs mb-3">When moods occurred</p>
          <div className="flex flex-wrap gap-1">
            {timelineDots.slice(0, 60).map((dot, idx) => (
              <div
                key={idx}
                className="w-2 h-2 rounded-full transition-all duration-300"
                style={{ 
                  backgroundColor: dot.color,
                  transform: `scale(${0.8 + dot.level * 0.15})`,
                  boxShadow: `0 0 4px ${dot.color}60`
                }}
              />
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
