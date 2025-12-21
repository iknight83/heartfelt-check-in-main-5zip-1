import { useState, useEffect, useMemo } from "react";
import { format, isSameDay } from "date-fns";
import DateIndicator from "@/components/home/DateIndicator";
import FactorsList from "@/components/home/FactorsList";
import BottomNav from "@/components/home/BottomNav";
import AddFactorModal from "@/components/home/AddFactorModal";
import LatestMoods from "@/components/home/LatestMoods";
import { getMoodHistory, deleteMoodFromHistory, MoodEntry } from "@/hooks/useMoodState";
import { useTrackedFactors, ALL_AVAILABLE_FACTORS } from "@/hooks/useTrackedFactors";
import { useAuth } from "@/hooks/useAuth";

type NavTab = "home" | "insights" | "you";

const Home = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<NavTab>("home");
  const [showAddFactorModal, setShowAddFactorModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [moodHistory, setMoodHistory] = useState<MoodEntry[]>([]);
  const [refreshKey, setRefreshKey] = useState(0); // Force re-render when user changes
  const { factors, incrementFactor, decrementFactor, addFactor } = useTrackedFactors(selectedDate);

  // Get factors that are not yet being tracked
  const availableFactors = ALL_AVAILABLE_FACTORS.filter(
    (af) => !factors.some((f) => f.id === af.id)
  );

  // Filter moods for the selected date
  const filteredMoods = useMemo(() => {
    return moodHistory.filter((mood) => {
      const moodDate = new Date(mood.timestamp);
      return isSameDay(moodDate, selectedDate);
    });
  }, [moodHistory, selectedDate]);

  // Refresh mood data and factors when page gains focus or user ID changes
  // This ensures data is loaded AFTER user authentication is complete
  useEffect(() => {
    const handleFocus = () => {
      setMoodHistory(getMoodHistory());
      setRefreshKey(prev => prev + 1); // Force factor reload
    };
    
    window.addEventListener("focus", handleFocus);
    // Load moods after user ID is available (when user is authenticated or anonymous)
    setMoodHistory(getMoodHistory());
    // Force factor reload by incrementing key
    setRefreshKey(prev => prev + 1);
    
    return () => window.removeEventListener("focus", handleFocus);
  }, [user]); // Re-run when user changes (after auth completes)

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

  return (
    <div className="min-h-screen gradient-bg pb-24" key={refreshKey}>
      <div className="max-w-md mx-auto px-5 pt-12 space-y-8">
        <DateIndicator 
          selectedDate={selectedDate} 
          onDateChange={setSelectedDate} 
        />

        <LatestMoods moods={filteredMoods} onDelete={handleDeleteMood} selectedDate={selectedDate} />

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
