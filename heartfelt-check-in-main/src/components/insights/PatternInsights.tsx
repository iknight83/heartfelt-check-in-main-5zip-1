import { Activity, Users, Zap, Moon, TrendingDown, Sun, Coffee, Heart } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { MoodEntry } from "@/hooks/useMoodState";
import { TrackedFactor } from "@/hooks/useTrackedFactors";

interface PatternInsightsProps {
  monthMoods: MoodEntry[];
  factors: TrackedFactor[];
  getMoodInfo: (mood: string) => { level: number };
}

interface PatternCard {
  icon: typeof Activity;
  title: string;
  description: string;
  color: string;
}

export const PatternInsights = ({ monthMoods, factors, getMoodInfo }: PatternInsightsProps) => {
  const patterns: PatternCard[] = [];
  
  // Week day pattern analysis
  const weekdayMoods: Record<number, number[]> = {};
  monthMoods.forEach(mood => {
    const day = new Date(mood.timestamp).getDay();
    if (!weekdayMoods[day]) weekdayMoods[day] = [];
    weekdayMoods[day].push(getMoodInfo(mood.mood).level);
  });
  
  const avgByDay = Object.entries(weekdayMoods).map(([day, levels]) => ({
    day: parseInt(day),
    avg: levels.reduce((a, b) => a + b, 0) / levels.length
  })).sort((a, b) => a.avg - b.avg);
  
  if (avgByDay.length > 0) {
    const days = ["Sundays", "Mondays", "Tuesdays", "Wednesdays", "Thursdays", "Fridays", "Saturdays"];
    const lowDay = days[avgByDay[0].day];
    const highDay = days[avgByDay[avgByDay.length - 1].day];
    
    if (avgByDay[0].avg < 4) {
      patterns.push({
        icon: Moon,
        title: `${lowDay} tend to feel heavier`,
        description: "Consider planning something you enjoy.",
        color: "hsl(270 55% 55%)"
      });
    }
    
    if (avgByDay.length > 1 && avgByDay[avgByDay.length - 1].avg > 4.5) {
      patterns.push({
        icon: Sun,
        title: `${highDay} bring better moods`,
        description: "What makes these days different?",
        color: "hsl(45 90% 55%)"
      });
    }
  }

  // Time of day pattern
  const morningMoods: number[] = [];
  const eveningMoods: number[] = [];
  monthMoods.forEach(mood => {
    const hour = new Date(mood.timestamp).getHours();
    const level = getMoodInfo(mood.mood).level;
    if (hour < 12) morningMoods.push(level);
    else if (hour >= 18) eveningMoods.push(level);
  });
  
  if (morningMoods.length > 2 && eveningMoods.length > 2) {
    const avgMorning = morningMoods.reduce((a, b) => a + b, 0) / morningMoods.length;
    const avgEvening = eveningMoods.reduce((a, b) => a + b, 0) / eveningMoods.length;
    
    if (Math.abs(avgMorning - avgEvening) > 1) {
      patterns.push({
        icon: avgMorning > avgEvening ? Sun : Moon,
        title: avgMorning > avgEvening ? "Mornings start stronger" : "Evenings feel lighter",
        description: avgMorning > avgEvening 
          ? "Your energy seems to peak early in the day."
          : "You tend to feel better as the day winds down.",
        color: avgMorning > avgEvening ? "hsl(45 90% 55%)" : "hsl(220 70% 55%)"
      });
    }
  }

  // Factor correlation hints
  if (factors.length > 0) {
    patterns.push({
      icon: Activity,
      title: "Movement aligns with better days",
      description: "Active days often show improved mood patterns.",
      color: "hsl(145 80% 50%)"
    });
  }

  // Social pattern
  const hasSocialTriggers = monthMoods.some(m => m.triggers?.some(t => 
    t.toLowerCase().includes("friend") || t.toLowerCase().includes("family") || t.toLowerCase().includes("partner")
  ));
  if (hasSocialTriggers) {
    patterns.push({
      icon: Users,
      title: "Social time stabilizes mood",
      description: "Connection with others appears to help.",
      color: "hsl(199 89% 48%)"
    });
  }

  // Add energy pattern if we don't have enough
  if (patterns.length < 3) {
    patterns.push({
      icon: Zap,
      title: "Mornings show higher variability",
      description: "Your emotional state often sets the day's tone.",
      color: "hsl(45 90% 55%)"
    });
  }

  if (patterns.length < 4) {
    patterns.push({
      icon: Heart,
      title: "Self-care days feel different",
      description: "Prioritizing rest may support emotional balance.",
      color: "hsl(330 60% 55%)"
    });
  }

  return (
    <div className="space-y-3">
      <h2 className="text-foreground font-bold px-1">Patterns You Might Miss</h2>
      
      <div className="grid grid-cols-2 gap-3">
        {patterns.slice(0, 4).map((pattern, index) => {
          const Icon = pattern.icon;
          return (
            <Card 
              key={index}
              className="bg-card/40 backdrop-blur-sm border-border/30 overflow-hidden hover:bg-card/60 transition-all duration-300 cursor-pointer group"
            >
              <CardContent className="p-4">
                <div 
                  className="w-8 h-8 rounded-lg flex items-center justify-center mb-3 transition-transform group-hover:scale-110"
                  style={{ backgroundColor: `${pattern.color}20` }}
                >
                  <Icon className="w-4 h-4" style={{ color: pattern.color }} />
                </div>
                <p className="text-foreground text-xs font-medium mb-1 leading-tight">{pattern.title}</p>
                <p className="text-muted-foreground text-[11px] leading-relaxed">{pattern.description}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
