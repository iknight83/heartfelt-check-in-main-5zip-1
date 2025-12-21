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
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState<NavTab>("home");
  const [showAddFactorModal, setShowAddFactorModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [moodHistory, setMoodHistory] = useState<MoodEntry[]>([]);
  const [isReady, setIsReady] = useState(false); // Track if data is ready to load
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

  // Wait for auth to complete and user ID to be available before loading data
  useEffect(() => {
    if (loading) return;
    
    // Poll for user ID availability
    const checkAndLoad = () => {
      const userId = localStorage.getItem("current_user_id");
      if (userId) {
        setMoodHistory(getMoodHistory());
        setIsReady(true);
        return true;
      }
      return false;
    };
    
    // Try immediately
    if (checkAndLoad()) return;
    
    // Poll until user ID is available (handles async auth)
    const interval = setInterval(() => {
      if (checkAndLoad()) {
        clearInterval(interval);
      }
    }, 100);
    
    return () => clearInterval(interval);
  }, [loading]);

  // Refresh mood data when page gains focus
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

  // Show loading state until data is ready
  if (loading || !isReady) {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center">
        <div className="text-soft animate-pulse">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-bg pb-24">
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
