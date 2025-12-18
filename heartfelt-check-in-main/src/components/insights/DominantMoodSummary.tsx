import { Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface MoodData {
  mood: string;
  percentage: number;
  color: string;
  category: "positive" | "neutral" | "negative";
}

interface DominantMoodSummaryProps {
  dominatingMoods: MoodData[];
  personality: { label: string; description: string };
  moodSummary: string;
}

export const DominantMoodSummary = ({ 
  dominatingMoods, 
  personality, 
  moodSummary 
}: DominantMoodSummaryProps) => {
  const primaryMood = dominatingMoods[0];

  return (
    <Card className="bg-card/60 backdrop-blur-sm border-border/40 overflow-hidden">
      <CardContent className="p-5">
        <div className="flex items-start gap-4 mb-4">
          <div className="relative shrink-0">
            <div 
              className="w-14 h-14 rounded-2xl flex items-center justify-center"
              style={{ 
                background: primaryMood 
                  ? `linear-gradient(135deg, ${primaryMood.color}30, ${primaryMood.color}10)`
                  : 'linear-gradient(135deg, hsl(var(--accent) / 0.2), hsl(var(--accent) / 0.1))'
              }}
            >
              <Sparkles className="w-6 h-6 text-accent" />
            </div>
            {primaryMood && (
              <div 
                className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold"
                style={{ 
                  backgroundColor: `${primaryMood.color}30`,
                  color: primaryMood.color
                }}
              >
                {primaryMood.percentage}%
              </div>
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            <h2 className="text-foreground font-bold text-lg mb-1">{personality.label}</h2>
            <p className="text-muted-foreground text-sm leading-relaxed">
              {moodSummary}
            </p>
          </div>
        </div>

        {/* Dominant mood pills */}
        <div className="flex gap-2 flex-wrap">
          {dominatingMoods.slice(0, 3).map((mood, idx) => (
            <div
              key={mood.mood}
              className="px-3 py-1.5 rounded-full border transition-all duration-300"
              style={{ 
                backgroundColor: `${mood.color}15`,
                borderColor: `${mood.color}30`
              }}
            >
              <div className="flex items-center gap-2">
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ 
                    backgroundColor: mood.color,
                    boxShadow: `0 0 6px ${mood.color}80`
                  }}
                />
                <span className="text-foreground text-xs font-medium">{mood.mood}</span>
                <span className="text-muted-foreground text-xs">{mood.percentage}%</span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
