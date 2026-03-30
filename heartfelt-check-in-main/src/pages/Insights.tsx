import { useState, useMemo, useEffect, useRef } from "react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth } from "date-fns";
import { ChevronDown, Download } from "lucide-react";
import BottomNav from "@/components/home/BottomNav";
import { getMoodHistory, MoodEntry } from "@/hooks/useMoodState";
import { getTrackedFactors } from "@/hooks/useTrackedFactors";
import { useMoodData } from "@/hooks/useMoodData";
import { useTriggerInsights } from "@/hooks/useTriggerInsights";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { MoodTimelineWithTriggers } from "@/components/insights/MoodTimelineWithTriggers";
import { EmotionBreakdown } from "@/components/insights/EmotionBreakdown";
import { ReflectiveCard } from "@/components/insights/ReflectiveCard";
import { EmotionalConsistency } from "@/components/insights/EmotionalConsistency";
import { InfluenceTracking } from "@/components/insights/InfluenceTracking";
import { WhatInfluencedYourMood } from "@/components/insights/WhatInfluencedYourMood";
import { PatternsYouMightMiss } from "@/components/insights/PatternsYouMightMiss";
import { ContextQualityWarning } from "@/components/insights/ContextQualityWarning";
import { ProPreview } from "@/components/insights/ProPreview";

type NavTab = "home" | "insights" | "you";

// Mood colors for visualization
const MOOD_LEVEL_COLORS: Record<string, { color: string; level: number; category: "positive" | "neutral" | "negative" }> = {
  "Amazing": { color: "hsl(45, 90%, 50%)", level: 7, category: "positive" },
  "Thrilled": { color: "hsl(45, 90%, 50%)", level: 7, category: "positive" },
  "Great": { color: "hsl(140, 60%, 50%)", level: 6, category: "positive" },
  "Happy": { color: "hsl(140, 60%, 50%)", level: 6, category: "positive" },
  "Nice": { color: "hsl(190, 80%, 50%)", level: 5, category: "positive" },
  "Content": { color: "hsl(190, 80%, 50%)", level: 5, category: "positive" },
  "Cheerful": { color: "hsl(160, 70%, 50%)", level: 5, category: "positive" },
  "Good": { color: "hsl(170, 65%, 50%)", level: 5, category: "positive" },
  "Okay": { color: "hsl(210, 70%, 55%)", level: 4, category: "neutral" },
  "Calm": { color: "hsl(210, 70%, 55%)", level: 4, category: "neutral" },
  "Ok": { color: "hsl(210, 70%, 55%)", level: 4, category: "neutral" },
  "Meh": { color: "hsl(270, 55%, 55%)", level: 3, category: "neutral" },
  "Uninspired": { color: "hsl(270, 55%, 55%)", level: 3, category: "neutral" },
  "Low": { color: "hsl(330, 60%, 55%)", level: 2, category: "negative" },
  "Sad": { color: "hsl(330, 60%, 55%)", level: 2, category: "negative" },
  "Awful": { color: "hsl(0, 70%, 55%)", level: 1, category: "negative" },
  "Angry": { color: "hsl(0, 70%, 55%)", level: 1, category: "negative" },
};

const getMoodInfo = (mood: string) => {
  return MOOD_LEVEL_COLORS[mood] || { color: "hsl(210, 70%, 55%)", level: 4, category: "neutral" as const };
};

// Calculate emotional stability score (kept for potential future use)
const getStabilityScore = (moods: MoodEntry[]) => {
  if (moods.length < 2) return { score: 50, description: "Track more moods to measure consistency." };
  
  let changes = 0;
  const sortedMoods = [...moods].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  
  for (let i = 1; i < sortedMoods.length; i++) {
    const prevLevel = getMoodInfo(sortedMoods[i - 1].mood).level;
    const currLevel = getMoodInfo(sortedMoods[i].mood).level;
    changes += Math.abs(currLevel - prevLevel);
  }
  
  const avgChange = changes / (sortedMoods.length - 1);
  const score = Math.max(0, Math.min(100, 100 - (avgChange * 15)));
  
  if (score > 75) return { score, description: "Your emotional state remains relatively consistent day to day." };
  if (score > 50) return { score, description: "You experience moderate emotional shifts, which is completely normal." };
  return { score, description: "Your emotions are dynamic, responding to life's varied experiences." };
};

const Insights = () => {
  const [activeTab, setActiveTab] = useState<NavTab>("insights");
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const calendarRef = useRef<HTMLDivElement>(null);
  
  // Use the new mood data hook
  const { 
    moodEntries: normalizedMoods, 
    moodEntriesForInsights,
    trackedFactorsForInsights,
    trackedFactorTypes,
    moodsWithTriggers,
    isLoading 
  } = useMoodData(selectedMonth);
  
  // Use trigger-driven insights
  const triggerInsights = useTriggerInsights(moodsWithTriggers, selectedMonth);
  
  // Also get localStorage data for backwards compatibility
  const moodHistory = getMoodHistory();
  const factors = getTrackedFactors();

  useEffect(() => {
    const scrollToToday = () => {
      if (calendarRef.current) {
        const todayButton = calendarRef.current.querySelector(`[data-date="${format(new Date(), "yyyy-MM-dd")}"]`);
        if (todayButton) {
          todayButton.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
        }
      }
    };
    setTimeout(scrollToToday, 100);
  }, []);
  
  const daysInMonth = useMemo(() => {
    const start = startOfMonth(selectedMonth);
    const end = endOfMonth(selectedMonth);
    return eachDayOfInterval({ start, end });
  }, [selectedMonth]);

  const monthMoods = useMemo(() => {
    return moodHistory.filter((mood) => {
      const moodDate = new Date(mood.timestamp);
      return isSameMonth(moodDate, selectedMonth);
    });
  }, [moodHistory, selectedMonth]);

  const moodsByDay = useMemo(() => {
    const byDay: Record<string, MoodEntry[]> = {};
    monthMoods.forEach((mood) => {
      const dayKey = format(new Date(mood.timestamp), "yyyy-MM-dd");
      if (!byDay[dayKey]) byDay[dayKey] = [];
      byDay[dayKey].push(mood);
    });
    return byDay;
  }, [monthMoods]);

  // Convert normalized moods to timeline format
  const timelineMoods = useMemo(() => {
    return normalizedMoods.map(m => ({
      id: m.id,
      level: m.level,
      timestamp: m.timestamp,
      label: m.label,
    }));
  }, [normalizedMoods]);

  const monthName = format(selectedMonth, "MMMM");

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Premium gradient header */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-accent/8 via-transparent to-transparent" />
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
        <div className="absolute top-20 right-1/4 w-64 h-64 bg-purple-500/5 rounded-full blur-3xl" />
        
        <div className="relative max-w-md mx-auto px-5 pt-12 pb-6">
          {/* Month Header */}
          <div className="flex items-center justify-between">
            <Popover>
              <PopoverTrigger asChild>
                <button className="flex items-center gap-2 group">
                  <div>
                    <p className="text-muted-foreground text-sm font-medium">Your Insights</p>
                    <p className="text-foreground text-2xl font-bold flex items-center gap-2">
                      {monthName}
                      <ChevronDown className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                    </p>
                  </div>
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={selectedMonth}
                  onSelect={(date) => {
                    if (date) {
                      setSelectedMonth(date);
                      setSelectedDate(date);
                    }
                  }}
                  defaultMonth={selectedMonth}
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
            
            {/* Export button (Pro) */}
            <button className="w-10 h-10 rounded-xl bg-card/60 border border-border/30 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-card transition-all duration-300">
              <Download className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto px-5 space-y-5">
        {/* Context Quality Warning - Show if data quality issues */}
        <ContextQualityWarning
          contextQuality={triggerInsights.contextQuality}
          daysTracked={triggerInsights.daysTracked}
          daysWithTriggerData={triggerInsights.daysWithTriggerData}
        />

        {/* Mood Timeline with Trigger Overlay */}
        <MoodTimelineWithTriggers 
          moodEntries={moodsWithTriggers}
          selectedMonth={selectedMonth}
        />

        {/* Emotional Breakdown (Graphic-Based) */}
        <EmotionBreakdown 
          moodsByDay={moodsByDay}
        />

        {/* Reflective Card — dominant mood, descriptors, note snippet */}
        <ReflectiveCard monthMoods={monthMoods} />

        {/* Emotional Consistency Score — SD-based + waveform */}
        <EmotionalConsistency monthMoods={monthMoods} selectedMonth={selectedMonth} />

        {/* Influence Tracking (Factors → Mood) */}
        <InfluenceTracking 
          factors={factors}
          daysInMonth={daysInMonth}
          selectedDate={selectedDate}
          onDateSelect={setSelectedDate}
          moodsByDay={moodsByDay}
          getMoodInfo={getMoodInfo}
          calendarRef={calendarRef}
        />

        {/* What Influenced Your Mood — trigger delta bars, self-gating */}
        <WhatInfluencedYourMood monthMoods={monthMoods} />

        {/* Patterns You Might Miss — time-of-day + weekday bars, self-gating */}
        <PatternsYouMightMiss monthMoods={monthMoods} />

        {/* Pro-Only Preview Sections - Now with real data */}
        <ProPreview 
          moodEntries={moodEntriesForInsights}
          trackedFactors={trackedFactorsForInsights}
        />

        {/* Gentle spacing before nav */}
        <div className="h-4" />
      </div>

      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
};

export default Insights;
