import { useState, useEffect, useMemo, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { format, startOfMonth, endOfMonth, subDays } from "date-fns";
import { getMoodHistory, MoodEntry as LocalMoodEntry } from "./useMoodState";
import { getTrackedFactors, TrackedFactor, getFactorsForDate } from "./useTrackedFactors";

// Database types for Supabase
export interface DbMoodEntry {
  id: string;
  user_id: string | null;
  created_at: string;
  mood_score: number;
  mood_label: string;
  sub_emotions: string[] | null;
  notes: string | null;
  time_of_day_bucket: string | null;
}

export interface DbFactorEntry {
  id: string;
  user_id: string | null;
  created_at: string;
  factor_type: string;
  factor_emoji: string | null;
  intensity: number | null;
  mood_entry_id: string | null;
}

// Normalized types for the UI
export interface NormalizedMoodEntry {
  id: string;
  level: number; // 0-100 scale
  timestamp: Date;
  label: string;
  subEmotions: string[];
  notes: string;
  timeOfDayBucket: string;
  triggers: string[];
}

// Type for trigger insights
export interface MoodWithTriggers {
  id: string;
  level: number;
  timestamp: Date;
  triggers: string[];
  label: string;
}

export interface NormalizedFactorEntry {
  name: string;
  emoji: string;
  count: number;
  date: string; // yyyy-MM-dd format
}

// Map mood labels to numeric levels (0-100 scale)
const MOOD_LABEL_TO_LEVEL: Record<string, number> = {
  "Awful": 10,
  "Angry": 15,
  "Terrible": 15,
  "Bad": 25,
  "Sad": 25,
  "Low": 30,
  "Down": 35,
  "Meh": 40,
  "Uninspired": 42,
  "Bored": 45,
  "Okay": 50,
  "Ok": 50,
  "Calm": 55,
  "Relaxed": 58,
  "Content": 60,
  "Nice": 62,
  "Cheerful": 65,
  "Good": 70,
  "Happy": 75,
  "Great": 80,
  "Excited": 82,
  "Thrilled": 85,
  "Amazing": 90,
  "Awesome": 95,
};

// Convert mood score (-3 to +3) to level (0-100)
const moodScoreToLevel = (score: number): number => {
  // -3 → 0, 0 → 50, +3 → 100
  return Math.round(((score + 3) / 6) * 100);
};

// Convert mood label to level
const moodLabelToLevel = (label: string): number => {
  return MOOD_LABEL_TO_LEVEL[label] || 50;
};

// Get time of day bucket from timestamp
const getTimeOfDayBucket = (date: Date): string => {
  const hour = date.getHours();
  if (hour >= 5 && hour < 12) return "morning";
  if (hour >= 12 && hour < 17) return "afternoon";
  if (hour >= 17 && hour < 21) return "evening";
  return "night";
};

export const useMoodData = (selectedMonth: Date = new Date()) => {
  const [dbMoods, setDbMoods] = useState<DbMoodEntry[]>([]);
  const [dbFactors, setDbFactors] = useState<DbFactorEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  // Check auth state
  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUserId(user?.id || null);
    };
    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUserId(session?.user?.id || null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Fetch data from Supabase
  useEffect(() => {
    const fetchData = async () => {
      if (!userId) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      const start = startOfMonth(selectedMonth);
      const end = endOfMonth(selectedMonth);
      
      // Also fetch 30 days back for baseline calculations
      const thirtyDaysAgo = subDays(new Date(), 30);
      const fetchStart = thirtyDaysAgo < start ? thirtyDaysAgo : start;

      try {
        const [moodResult, factorResult] = await Promise.all([
          supabase
            .from('mood_entries')
            .select('*')
            .gte('created_at', fetchStart.toISOString())
            .lte('created_at', end.toISOString())
            .order('created_at', { ascending: false }),
          supabase
            .from('factor_entries')
            .select('*')
            .gte('created_at', fetchStart.toISOString())
            .lte('created_at', end.toISOString())
            .order('created_at', { ascending: false }),
        ]);

        if (moodResult.data) setDbMoods(moodResult.data);
        if (factorResult.data) setDbFactors(factorResult.data);
      } catch (error) {
        console.error('Error fetching mood data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [userId, selectedMonth]);

  // Normalize mood entries (combine DB + localStorage for non-auth users)
  const normalizedMoods = useMemo((): NormalizedMoodEntry[] => {
    // If user is logged in, use DB data
    if (userId && dbMoods.length > 0) {
      return dbMoods.map(entry => ({
        id: entry.id,
        level: moodScoreToLevel(entry.mood_score),
        timestamp: new Date(entry.created_at),
        label: entry.mood_label,
        subEmotions: entry.sub_emotions || [],
        notes: entry.notes || "",
        timeOfDayBucket: entry.time_of_day_bucket || getTimeOfDayBucket(new Date(entry.created_at)),
        triggers: [],
      }));
    }

    // Fall back to localStorage for non-auth users
    const localMoods = getMoodHistory();
    return localMoods.map(entry => ({
      id: entry.id,
      level: moodLabelToLevel(entry.mood),
      timestamp: new Date(entry.timestamp),
      label: entry.mood,
      subEmotions: [],
      notes: entry.note || "",
      timeOfDayBucket: getTimeOfDayBucket(new Date(entry.timestamp)),
      triggers: entry.triggers || [],
    }));
  }, [userId, dbMoods]);

  // Normalize factor entries (combine DB + localStorage)
  const normalizedFactors = useMemo((): NormalizedFactorEntry[] => {
    // If user is logged in, use DB data
    if (userId && dbFactors.length > 0) {
      const factorsByDateAndType = new Map<string, { count: number; emoji: string }>();
      
      dbFactors.forEach(entry => {
        const date = format(new Date(entry.created_at), "yyyy-MM-dd");
        const key = `${date}|${entry.factor_type}`;
        const existing = factorsByDateAndType.get(key);
        
        if (existing) {
          existing.count += entry.intensity || 1;
        } else {
          factorsByDateAndType.set(key, {
            count: entry.intensity || 1,
            emoji: entry.factor_emoji || "📊",
          });
        }
      });

      const result: NormalizedFactorEntry[] = [];
      factorsByDateAndType.forEach((value, key) => {
        const [date, name] = key.split("|");
        result.push({
          name,
          emoji: value.emoji,
          count: value.count,
          date,
        });
      });
      
      return result;
    }

    // Fall back to localStorage
    const localFactors = getTrackedFactors();
    const result: NormalizedFactorEntry[] = [];
    
    // Get factors for the last 30 days
    for (let i = 0; i < 30; i++) {
      const date = subDays(new Date(), i);
      const dateKey = format(date, "yyyy-MM-dd");
      const dayFactors = getFactorsForDate(date);
      
      dayFactors.forEach(factor => {
        if (factor.count > 0) {
          result.push({
            name: factor.name,
            emoji: factor.emoji,
            count: factor.count,
            date: dateKey,
          });
        }
      });
    }
    
    return result;
  }, [userId, dbFactors]);

  // Convert to ProPreview format
  const moodEntriesForInsights = useMemo(() => {
    return normalizedMoods.map(m => ({
      id: m.id,
      level: m.level,
      timestamp: m.timestamp,
      triggers: m.triggers,
    }));
  }, [normalizedMoods]);

  const trackedFactorsForInsights = useMemo(() => {
    return normalizedFactors;
  }, [normalizedFactors]);

  // Get tracked factor types (unique names)
  const trackedFactorTypes = useMemo(() => {
    const types = getTrackedFactors();
    return types;
  }, []);

  // Entries formatted for trigger insights
  const moodsWithTriggers: MoodWithTriggers[] = useMemo(() => {
    return normalizedMoods.map(m => ({
      id: m.id,
      level: m.level,
      timestamp: m.timestamp,
      triggers: m.triggers,
      label: m.label,
    }));
  }, [normalizedMoods]);

  return {
    moodEntries: normalizedMoods,
    factorEntries: normalizedFactors,
    moodEntriesForInsights,
    trackedFactorsForInsights,
    trackedFactorTypes,
    moodsWithTriggers,
    isLoading,
    isAuthenticated: !!userId,
  };
};

// Helper to save mood entry to Supabase
export const saveMoodEntryToDb = async (
  moodLabel: string,
  moodScore: number,
  subEmotions: string[] = [],
  notes: string = ""
) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const timeOfDayBucket = getTimeOfDayBucket(new Date());

  const { data, error } = await supabase
    .from('mood_entries')
    .insert({
      user_id: user.id,
      mood_label: moodLabel,
      mood_score: moodScore,
      sub_emotions: subEmotions,
      notes,
      time_of_day_bucket: timeOfDayBucket,
    })
    .select()
    .single();

  if (error) {
    console.error('Error saving mood entry:', error);
    return null;
  }

  return data;
};

// Helper to save factor entry to Supabase
export const saveFactorEntryToDb = async (
  factorType: string,
  factorEmoji: string,
  intensity: number = 1,
  moodEntryId?: string
) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('factor_entries')
    .insert({
      user_id: user.id,
      factor_type: factorType,
      factor_emoji: factorEmoji,
      intensity,
      mood_entry_id: moodEntryId || null,
    })
    .select()
    .single();

  if (error) {
    console.error('Error saving factor entry:', error);
    return null;
  }

  return data;
};
