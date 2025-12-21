import { useState, useEffect, useCallback } from "react";

export interface MoodEntry {
  mood: string;
  triggers: string[];
  time: string;
  note: string;
  timestamp: number;
  id: string;
}

const STORAGE_KEY = "current_mood";
const MOOD_HISTORY_KEY = "mood_history";

const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

// Get user ID from localStorage to isolate mood data per user
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

const getDefaultMood = (): MoodEntry => ({
  id: generateId(),
  mood: "Uninspired",
  triggers: ["Work", "Myself"],
  time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }),
  note: "",
  timestamp: Date.now(),
});

export const useMoodState = () => {
  const [moodEntry, setMoodEntry] = useState<MoodEntry>(() => {
    try {
      const key = getUserStorageKey(STORAGE_KEY);
      const stored = localStorage.getItem(key);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.error("Error reading mood from localStorage:", e);
    }
    return getDefaultMood();
  });

  useEffect(() => {
    try {
      const key = getUserStorageKey(STORAGE_KEY);
      localStorage.setItem(key, JSON.stringify(moodEntry));
    } catch (e) {
      console.error("Error saving mood to localStorage:", e);
    }
  }, [moodEntry]);

  const updateMood = useCallback((updates: Partial<MoodEntry>) => {
    setMoodEntry((prev) => ({
      ...prev,
      ...updates,
      timestamp: Date.now(),
    }));
  }, []);

  return { moodEntry, updateMood };
};

// Helper to get current mood from localStorage (for components that don't use the hook)
export const getCurrentMood = (): MoodEntry => {
  try {
    const key = getUserStorageKey(STORAGE_KEY);
    const stored = localStorage.getItem(key);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error("Error reading mood from localStorage:", e);
  }
  return getDefaultMood();
};

// Helper to save mood to localStorage
export const saveMood = (updates: Partial<MoodEntry>) => {
  const current = getCurrentMood();
  const updated = { ...current, ...updates, timestamp: Date.now() };
  try {
    const key = getUserStorageKey(STORAGE_KEY);
    localStorage.setItem(key, JSON.stringify(updated));
  } catch (e) {
    console.error("Error saving mood to localStorage:", e);
  }
  return updated;
};

// Get mood history from localStorage
export const getMoodHistory = (): MoodEntry[] => {
  try {
    const key = getUserStorageKey(MOOD_HISTORY_KEY);
    const stored = localStorage.getItem(key);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error("Error reading mood history from localStorage:", e);
  }
  return [];
};

// Add a new mood entry to history with optional custom date
export const addMoodToHistory = (
  mood: string = "Okay", 
  triggers: string[] = [], 
  note: string = "",
  customDate?: Date
): MoodEntry => {
  const entryDate = customDate || new Date();
  
  const newEntry: MoodEntry = {
    id: generateId(),
    mood,
    triggers,
    time: entryDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }),
    note,
    timestamp: entryDate.getTime(),
  };
  
  const history = getMoodHistory();
  const updatedHistory = [newEntry, ...history];
  
  try {
    const key = getUserStorageKey(MOOD_HISTORY_KEY);
    localStorage.setItem(key, JSON.stringify(updatedHistory));
  } catch (e) {
    console.error("Error saving mood history to localStorage:", e);
  }
  
  return newEntry;
};

// Update an existing mood entry in history
export const updateMoodInHistory = (
  id: string,
  updates: Partial<Omit<MoodEntry, 'id'>>
): MoodEntry | null => {
  const history = getMoodHistory();
  const index = history.findIndex(entry => entry.id === id);
  
  if (index === -1) return null;
  
  const updatedEntry = { ...history[index], ...updates };
  history[index] = updatedEntry;
  
  try {
    const key = getUserStorageKey(MOOD_HISTORY_KEY);
    localStorage.setItem(key, JSON.stringify(history));
  } catch (e) {
    console.error("Error updating mood in localStorage:", e);
  }
  
  return updatedEntry;
};

// Delete a mood entry from history
export const deleteMoodFromHistory = (id: string): void => {
  const history = getMoodHistory();
  const updatedHistory = history.filter(entry => entry.id !== id);
  
  try {
    const key = getUserStorageKey(MOOD_HISTORY_KEY);
    localStorage.setItem(key, JSON.stringify(updatedHistory));
  } catch (e) {
    console.error("Error deleting mood from localStorage:", e);
  }
};
