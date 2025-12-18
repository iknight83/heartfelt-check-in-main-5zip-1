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
      const stored = localStorage.getItem(STORAGE_KEY);
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
      localStorage.setItem(STORAGE_KEY, JSON.stringify(moodEntry));
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
    const stored = localStorage.getItem(STORAGE_KEY);
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
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error("Error saving mood to localStorage:", e);
  }
  return updated;
};

// Get mood history from localStorage
export const getMoodHistory = (): MoodEntry[] => {
  try {
    const stored = localStorage.getItem(MOOD_HISTORY_KEY);
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
    localStorage.setItem(MOOD_HISTORY_KEY, JSON.stringify(updatedHistory));
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
    localStorage.setItem(MOOD_HISTORY_KEY, JSON.stringify(history));
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
    localStorage.setItem(MOOD_HISTORY_KEY, JSON.stringify(updatedHistory));
  } catch (e) {
    console.error("Error deleting mood from localStorage:", e);
  }
};
