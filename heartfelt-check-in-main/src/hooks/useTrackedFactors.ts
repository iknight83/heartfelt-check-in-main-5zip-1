import { useState, useEffect, useCallback } from "react";
import { format } from "date-fns";

export interface TrackedFactor {
  id: string;
  emoji: string;
  name: string;
  count: number;
  isCustom?: boolean;
}

interface DailyFactorCounts {
  [dateKey: string]: {
    [factorId: string]: number;
  };
}

const STORAGE_KEY = "tracked_factors";
const DAILY_COUNTS_KEY = "daily_factor_counts";

// Get user ID from localStorage to isolate data per user
const getUserId = (): string | null => {
  try {
    return localStorage.getItem("current_user_id");
  } catch {
    return null;
  }
};

// Get storage key with user isolation
const getUserStorageKey = (baseKey: string): string => {
  const userId = getUserId();
  return userId ? `${baseKey}__${userId}` : baseKey;
};

// All available factors that can be tracked (original onboarding factors only)
export const ALL_AVAILABLE_FACTORS = [
  { id: "caffeine", emoji: "☕", label: "Caffeine" },
  { id: "alcohol", emoji: "🍷", label: "Alcohol" },
  { id: "medication", emoji: "💊", label: "Medication" },
  { id: "activity", emoji: "🏃", label: "Physical activity" },
  { id: "intimacy", emoji: "❤️", label: "Intimacy" },
  { id: "cycle", emoji: "🩸", label: "Cycle / Hormones" },
  { id: "mindfulness", emoji: "🧘", label: "Mindfulness" },
];

const defaultFactors: TrackedFactor[] = [];

// Get the base factors (without counts)
export const getTrackedFactors = (): TrackedFactor[] => {
  try {
    // Don't load if no user ID is set - prevents loading wrong data
    const userId = getUserId();
    if (!userId) {
      return defaultFactors;
    }
    
    const key = getUserStorageKey(STORAGE_KEY);
    const stored = localStorage.getItem(key);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error("Error reading factors from localStorage:", e);
  }
  return defaultFactors;
};

// Get daily counts
const getDailyCounts = (): DailyFactorCounts => {
  try {
    const key = getUserStorageKey(DAILY_COUNTS_KEY);
    const stored = localStorage.getItem(key);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error("Error reading daily counts from localStorage:", e);
  }
  return {};
};

// Save daily counts
const saveDailyCounts = (counts: DailyFactorCounts) => {
  try {
    const key = getUserStorageKey(DAILY_COUNTS_KEY);
    localStorage.setItem(key, JSON.stringify(counts));
  } catch (e) {
    console.error("Error saving daily counts to localStorage:", e);
  }
};

// Get factors with counts for a specific date
export const getFactorsForDate = (date: Date): TrackedFactor[] => {
  // Don't load if no user ID is set - prevents loading wrong data
  const userId = getUserId();
  if (!userId) {
    return [];
  }
  
  const factors = getTrackedFactors();
  const dateKey = format(date, "yyyy-MM-dd");
  const dailyCounts = getDailyCounts();
  const dateCounts = dailyCounts[dateKey] || {};

  return factors.map((f) => ({
    ...f,
    count: dateCounts[f.id] || 0,
  }));
};

export const saveTrackedFactors = (factors: TrackedFactor[]) => {
  // Save only the base factors (without counts)
  const baseFactors = factors.map(({ id, emoji, name, isCustom }) => ({
    id,
    emoji,
    name,
    count: 0,
    isCustom,
  }));
  try {
    const key = getUserStorageKey(STORAGE_KEY);
    localStorage.setItem(key, JSON.stringify(baseFactors));
  } catch (e) {
    console.error("Error saving factors to localStorage:", e);
  }
};

// Convert onboarding selection to tracked factors
export const initializeFactorsFromOnboarding = (
  selectedIds: string[],
  allFactors: { id: string; label: string; emoji: string; isCustom?: boolean }[]
) => {
  const trackedFactors: TrackedFactor[] = [];
  
  for (const id of selectedIds) {
    const factor = allFactors.find((f) => f.id === id);
    if (factor) {
      trackedFactors.push({
        id: factor.id,
        emoji: factor.emoji,
        name: factor.label,
        count: 0,
        isCustom: factor.isCustom,
      });
    }
  }

  saveTrackedFactors(trackedFactors);
  return trackedFactors;
};

export const useTrackedFactors = (selectedDate: Date = new Date()) => {
  const [factors, setFactors] = useState<TrackedFactor[]>([]);
  const [lastUserId, setLastUserId] = useState<string | null>(null);

  // Update factors when date changes or user ID becomes available
  useEffect(() => {
    const userId = getUserId();
    
    // If user ID changed or became available, reload factors
    if (userId !== lastUserId) {
      setLastUserId(userId);
    }
    
    // Only load if we have a valid user ID
    if (userId) {
      setFactors(getFactorsForDate(selectedDate));
    }
  }, [selectedDate, lastUserId]);

  // Poll for user ID availability (handles async auth completion)
  useEffect(() => {
    const checkUserId = () => {
      const userId = getUserId();
      if (userId && userId !== lastUserId) {
        setLastUserId(userId);
        setFactors(getFactorsForDate(selectedDate));
      }
    };
    
    // Check immediately
    checkUserId();
    
    // Also check on focus in case auth completed
    const handleFocus = () => {
      checkUserId();
    };
    window.addEventListener("focus", handleFocus);
    
    // Poll periodically to catch auth completion
    const interval = setInterval(checkUserId, 500);
    
    return () => {
      window.removeEventListener("focus", handleFocus);
      clearInterval(interval);
    };
  }, [selectedDate, lastUserId]);

  const incrementFactor = useCallback((id: string) => {
    const dateKey = format(selectedDate, "yyyy-MM-dd");
    const dailyCounts = getDailyCounts();
    
    if (!dailyCounts[dateKey]) {
      dailyCounts[dateKey] = {};
    }
    dailyCounts[dateKey][id] = (dailyCounts[dateKey][id] || 0) + 1;
    saveDailyCounts(dailyCounts);

    setFactors((prev) =>
      prev.map((f) =>
        f.id === id ? { ...f, count: dailyCounts[dateKey][id] } : f
      )
    );
  }, [selectedDate]);

  const decrementFactor = useCallback((id: string) => {
    const dateKey = format(selectedDate, "yyyy-MM-dd");
    const dailyCounts = getDailyCounts();
    
    if (!dailyCounts[dateKey] || !dailyCounts[dateKey][id] || dailyCounts[dateKey][id] <= 0) {
      return;
    }
    
    dailyCounts[dateKey][id] = dailyCounts[dateKey][id] - 1;
    saveDailyCounts(dailyCounts);

    setFactors((prev) =>
      prev.map((f) =>
        f.id === id ? { ...f, count: dailyCounts[dateKey][id] } : f
      )
    );
  }, [selectedDate]);

  const addFactor = useCallback((factor: Omit<TrackedFactor, "count">) => {
    const baseFactors = getTrackedFactors();
    const updatedBase = [...baseFactors, { ...factor, count: 0 }];
    saveTrackedFactors(updatedBase);
    
    setFactors((prev) => [...prev, { ...factor, count: 0 }]);
  }, []);

  const resetFactors = useCallback(() => {
    const dateKey = format(selectedDate, "yyyy-MM-dd");
    const dailyCounts = getDailyCounts();
    dailyCounts[dateKey] = {};
    saveDailyCounts(dailyCounts);
    
    setFactors((prev) => prev.map((f) => ({ ...f, count: 0 })));
  }, [selectedDate]);

  return { factors, incrementFactor, decrementFactor, addFactor, resetFactors, setFactors };
};
