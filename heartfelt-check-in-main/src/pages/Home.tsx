import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { isSameDay, format } from "date-fns";
import DateIndicator from "@/components/home/DateIndicator";
import FactorsList from "@/components/home/FactorsList";
import BottomNav from "@/components/home/BottomNav";
import AddFactorModal from "@/components/home/AddFactorModal";
import LatestMoods from "@/components/home/LatestMoods";
import HomeSkeleton from "@/components/home/HomeSkeleton";
import { getMoodHistory, deleteMoodFromHistory, MoodEntry } from "@/hooks/useMoodState";
import { useTrackedFactors, ALL_AVAILABLE_FACTORS } from "@/hooks/useTrackedFactors";
import { useAuth } from "@/hooks/useAuth";

type NavTab = "home" | "insights" | "you";

const getMoodStyle = (mood: string): { emoji: string; color: string; bg: string } => {
  const awful = ["Frustrated","Overwhelmed","Drained","Hopeless","Angry","Broken","Devastated","Miserable","Awful"];
  const low   = ["Irritated","Worried","Embarrassed","Down","Anxious","Sad","Lonely","Stressed","Low"];
  const meh   = ["Uninspired","Restless","Indifferent","Tired","Bored","Distracted","Unfocused","Flat","Meh"];
  const okay  = ["Steady","Balanced","Peaceful","Easygoing","Calm","Neutral","Stable","Fine","Okay"];
  const nice  = ["Relaxed","Comfortable","Hopeful","Lively","Content","Pleasant","Optimistic","Cheerful","Nice"];
  const great = ["Joyful","Satisfied","Motivated","Grateful","Energetic","Confident","Fulfilled","Happy","Great"];
  const amazing = ["Thrilled","Radiant","Inspired","Alive","Ecstatic","Blissful","Euphoric","Empowered","Amazing"];

  if (awful.includes(mood))   return { emoji: "😔", color: "#ef4444", bg: "rgba(239,68,68,0.25)" };
  if (low.includes(mood))     return { emoji: "😕", color: "#f97316", bg: "rgba(249,115,22,0.25)" };
  if (meh.includes(mood))     return { emoji: "😐", color: "#a855f7", bg: "rgba(168,85,247,0.25)" };
  if (okay.includes(mood))    return { emoji: "🙂", color: "#3b82f6", bg: "rgba(59,130,246,0.25)" };
  if (nice.includes(mood))    return { emoji: "😊", color: "#06b6d4", bg: "rgba(6,182,212,0.25)" };
  if (great.includes(mood))   return { emoji: "😄", color: "#22c55e", bg: "rgba(34,197,94,0.25)" };
  if (amazing.includes(mood)) return { emoji: "🤩", color: "#eab308", bg: "rgba(234,179,8,0.25)" };
  return { emoji: "😐", color: "#3b82f6", bg: "rgba(59,130,246,0.25)" };
};

const Home = () => {
  const { loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<NavTab>("home");
  const [showAddFactorModal, setShowAddFactorModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [moodHistory, setMoodHistory] = useState<MoodEntry[]>([]);
  const [isReady, setIsReady] = useState(false);
  const hasLoadedData = useRef(false);
  const { factors, incrementFactor, decrementFactor, addFactor } = useTrackedFactors(selectedDate);

  const availableFactors = ALL_AVAILABLE_FACTORS.filter(
    (af) => !factors.some((f) => f.id === af.id)
  );

  const filteredMoods = useMemo(() => {
    return moodHistory.filter((mood) => {
      const moodDate = new Date(mood.timestamp);
      return isSameDay(moodDate, selectedDate);
    });
  }, [moodHistory, selectedDate]);

  // Streak calculation
  const streak = useMemo(() => {
    const uniqueDates = new Set<string>();
    moodHistory.forEach(e => uniqueDates.add(format(new Date(e.timestamp), "yyyy-MM-dd")));
    let count = 0;
    const cursor = new Date();
    if (!uniqueDates.has(format(cursor, "yyyy-MM-dd"))) {
      cursor.setDate(cursor.getDate() - 1);
    }
    while (uniqueDates.has(format(cursor, "yyyy-MM-dd"))) {
      count++;
      cursor.setDate(cursor.getDate() - 1);
      if (count > 3650) break;
    }
    return count;
  }, [moodHistory]);

  // Yesterday's latest entry
  const yesterdayEntry = useMemo((): MoodEntry | null => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const entries = moodHistory.filter(e => isSameDay(new Date(e.timestamp), yesterday));
    if (!entries.length) return null;
    return entries.sort((a, b) => b.timestamp - a.timestamp)[0];
  }, [moodHistory]);

  // 7-day week data (Mon → Sun order relative to today)
  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - 6 + i);
      const dayEntries = moodHistory.filter(e => isSameDay(new Date(e.timestamp), d));
      const latest = dayEntries.sort((a, b) => b.timestamp - a.timestamp)[0] || null;
      return {
        date: d,
        label: format(d, "EEE").toUpperCase().slice(0, 3),
        entry: latest,
        isToday: isSameDay(d, new Date()),
      };
    });
  }, [moodHistory]);

  const loadUserData = useCallback(() => {
    const userId = localStorage.getItem("current_user_id");
    if (userId) {
      setMoodHistory(getMoodHistory());
      hasLoadedData.current = true;
      setIsReady(true);
      return true;
    }
    return false;
  }, []);

  useEffect(() => {
    if (loadUserData()) return;
    
    const interval = setInterval(() => {
      if (loadUserData()) {
        clearInterval(interval);
      }
    }, 50);
    
    return () => clearInterval(interval);
  }, [loadUserData]);

  useEffect(() => {
    if (!authLoading && !hasLoadedData.current) {
      loadUserData();
    }
  }, [authLoading, loadUserData]);

  useEffect(() => {
    const handleFocus = () => {
      const userId = localStorage.getItem("current_user_id");
      if (userId) {
        setMoodHistory(getMoodHistory());
      }
    };
    
    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, []);

  const handleAddFactor = () => {
    setShowAddFactorModal(true);
  };

  const handleSelectFactor = (factor: { id: string; emoji: string; label: string }) => {
    addFactor({
      id: factor.id,
      emoji: factor.emoji,
      name: factor.label,
    });
  };

  const handleAddCustomFactor = (factor: { id: string; emoji: string; label: string; isCustom: boolean }) => {
    addFactor({
      id: factor.id,
      emoji: factor.emoji,
      name: factor.label,
      isCustom: true,
    });
  };

  const handleDeleteMood = (id: string) => {
    deleteMoodFromHistory(id);
    setMoodHistory(getMoodHistory());
  };

  if (!isReady) {
    return <HomeSkeleton />;
  }

  return (
    <div className="min-h-screen gradient-bg pb-24">
      <div className="max-w-md mx-auto px-5 pt-12 space-y-6">
        <DateIndicator 
          selectedDate={selectedDate} 
          onDateChange={setSelectedDate} 
        />

        {/* Streak Card */}
        {streak > 0 && (
          <div className="rounded-2xl bg-card/30 border border-border/30 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🔥</span>
              <div>
                <p className="text-foreground font-semibold text-base leading-tight">
                  <span className="text-accent">{streak}</span> day streak
                </p>
                <p className="text-muted-foreground text-xs">Keep it going!</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              {weekDays.map((day, i) => {
                const style = day.entry ? getMoodStyle(day.entry.mood) : null;
                return (
                  <div
                    key={i}
                    className="w-3 h-3 rounded-full transition-all"
                    style={
                      style
                        ? { backgroundColor: style.color, boxShadow: `0 0 4px ${style.color}80` }
                        : { backgroundColor: "rgba(255,255,255,0.12)" }
                    }
                  />
                );
              })}
            </div>
          </div>
        )}

        {/* Yesterday Strip */}
        {yesterdayEntry && (
          <div className="rounded-2xl bg-card/20 border-l-4 border-accent/60 pl-4 pr-4 py-3 flex items-start gap-2">
            <span className="w-2 h-2 rounded-full bg-accent mt-1.5 flex-shrink-0" />
            <p className="text-sm text-foreground/80 leading-relaxed">
              Yesterday you felt{" "}
              <span
                className="font-semibold"
                style={{ color: getMoodStyle(yesterdayEntry.mood).color }}
              >
                {yesterdayEntry.mood}
              </span>
              {yesterdayEntry.note ? (
                <span className="text-muted-foreground"> · "{yesterdayEntry.note.slice(0, 40)}{yesterdayEntry.note.length > 40 ? "…" : ""}"</span>
              ) : null}
            </p>
          </div>
        )}

        <LatestMoods moods={filteredMoods} onDelete={handleDeleteMood} selectedDate={selectedDate} />

        {/* This Week */}
        <div className="space-y-3">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">This Week</p>
          <div className="flex justify-between">
            {weekDays.map((day, i) => {
              const style = day.entry ? getMoodStyle(day.entry.mood) : null;
              return (
                <div key={i} className="flex flex-col items-center gap-1.5">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-lg transition-all"
                    style={
                      style
                        ? { backgroundColor: style.bg, border: `2px solid ${style.color}60` }
                        : { backgroundColor: "rgba(255,255,255,0.06)", border: "2px solid rgba(255,255,255,0.08)" }
                    }
                  >
                    {style ? style.emoji : ""}
                  </div>
                  <p
                    className="text-xs font-medium"
                    style={{ color: day.isToday ? "hsl(var(--accent))" : "hsl(var(--muted-foreground))" }}
                  >
                    {day.label}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        <FactorsList
          factors={factors}
          onIncrement={incrementFactor}
          onDecrement={decrementFactor}
          onAdd={handleAddFactor}
        />
      </div>

      <BottomNav 
        activeTab={activeTab} 
        onTabChange={setActiveTab} 
      />

      <AddFactorModal
        isOpen={showAddFactorModal}
        onClose={() => setShowAddFactorModal(false)}
        availableFactors={availableFactors}
        onSelectFactor={handleSelectFactor}
        onAddCustomFactor={handleAddCustomFactor}
      />
    </div>
  );
};

export default Home;
