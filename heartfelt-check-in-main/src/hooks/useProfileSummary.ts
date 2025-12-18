import { useMemo } from "react";
import { getMoodHistory, MoodEntry } from "./useMoodState";

interface ProfileSummary {
  totalCheckIns: number;
  uniqueDaysLogged: number;
  currentStreak: number;
  longestStreak: number;
  monthlyAverages: { month: number; average: number; hasData: boolean }[];
  reflections: string[];
  progressPhase: "exploring" | "refining" | "strengthening";
  hasEnoughData: boolean;
}

// Get unique dates from mood entries
const getUniqueDates = (entries: MoodEntry[]): Set<string> => {
  const uniqueDates = new Set<string>();
  entries.forEach(entry => {
    const date = new Date(entry.timestamp);
    const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    uniqueDates.add(dateKey);
  });
  return uniqueDates;
};

// Calculate current streak (consecutive days ending today or yesterday)
const calculateStreak = (uniqueDates: Set<string>): { current: number; longest: number } => {
  if (uniqueDates.size === 0) return { current: 0, longest: 0 };
  
  const sortedDates = Array.from(uniqueDates).sort().reverse();
  const today = new Date();
  const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayKey = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;
  
  // Check if streak is active (logged today or yesterday)
  const streakActive = uniqueDates.has(todayKey) || uniqueDates.has(yesterdayKey);
  
  let currentStreak = 0;
  let longestStreak = 0;
  let tempStreak = 0;
  
  // Calculate streaks by going through sorted dates
  for (let i = 0; i < sortedDates.length; i++) {
    if (i === 0) {
      tempStreak = 1;
    } else {
      const currentDate = new Date(sortedDates[i]);
      const prevDate = new Date(sortedDates[i - 1]);
      const diffDays = Math.round((prevDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (diffDays === 1) {
        tempStreak++;
      } else {
        if (tempStreak > longestStreak) longestStreak = tempStreak;
        tempStreak = 1;
      }
    }
    
    // Update current streak if we're still counting from today/yesterday
    if (i === 0 && streakActive) {
      currentStreak = tempStreak;
    } else if (streakActive && sortedDates[0] === todayKey || sortedDates[0] === yesterdayKey) {
      currentStreak = tempStreak;
    }
  }
  
  if (tempStreak > longestStreak) longestStreak = tempStreak;
  if (streakActive) currentStreak = tempStreak;
  
  return { current: currentStreak, longest: longestStreak };
};

// Map mood labels to numeric scores for averaging
const MOOD_SCORES: Record<string, number> = {
  "Amazing": 5,
  "Good": 4,
  "Okay": 3,
  "Low": 2,
  "Awful": 1,
  // Sub-emotions mapping
  "Energized": 5, "Excited": 5, "Grateful": 5, "Hopeful": 5, "Confident": 5,
  "Content": 4, "Calm": 4, "Relaxed": 4, "Peaceful": 4, "Pleased": 4,
  "Neutral": 3, "Indifferent": 3, "Uncertain": 3, "Mixed": 3,
  "Tired": 2, "Stressed": 2, "Anxious": 2, "Sad": 2, "Frustrated": 2, "Uninspired": 2,
  "Overwhelmed": 1, "Hopeless": 1, "Angry": 1, "Devastated": 1, "Panicked": 1,
};

const getMoodScore = (entry: MoodEntry): number => {
  return MOOD_SCORES[entry.mood] || 3;
};

// Calculate monthly averages for the year chart
const calculateMonthlyAverages = (entries: MoodEntry[]): { month: number; average: number; hasData: boolean }[] => {
  const currentYear = new Date().getFullYear();
  const monthlyData: { [key: number]: number[] } = {};
  
  // Initialize all months
  for (let i = 0; i < 12; i++) {
    monthlyData[i] = [];
  }
  
  // Group scores by month
  entries.forEach(entry => {
    const date = new Date(entry.timestamp);
    if (date.getFullYear() === currentYear) {
      const month = date.getMonth();
      const score = getMoodScore(entry);
      monthlyData[month].push(score);
    }
  });
  
  // Calculate averages
  return Array.from({ length: 12 }, (_, i) => {
    const scores = monthlyData[i];
    const hasData = scores.length > 0;
    const average = hasData ? scores.reduce((a, b) => a + b, 0) / scores.length : 3;
    return { month: i, average, hasData };
  });
};

// Generate reflective insights based on patterns
const generateReflections = (entries: MoodEntry[]): string[] => {
  if (entries.length < 7) return [];
  
  const reflections: string[] = [];
  
  // Analyze weekday vs weekend patterns
  const weekdayScores: number[] = [];
  const weekendScores: number[] = [];
  
  entries.forEach(entry => {
    const day = new Date(entry.timestamp).getDay();
    const score = getMoodScore(entry);
    if (day === 0 || day === 6) {
      weekendScores.push(score);
    } else {
      weekdayScores.push(score);
    }
  });
  
  if (weekdayScores.length >= 3 && weekendScores.length >= 2) {
    const weekdayAvg = weekdayScores.reduce((a, b) => a + b, 0) / weekdayScores.length;
    const weekendAvg = weekendScores.reduce((a, b) => a + b, 0) / weekendScores.length;
    
    if (weekendAvg - weekdayAvg > 0.5) {
      reflections.push("Weekends may bring more emotional ease.");
    } else if (weekdayAvg - weekendAvg > 0.5) {
      reflections.push("Structured weekdays appear to support your emotional rhythm.");
    }
  }
  
  // Analyze time-based patterns
  const morningScores: number[] = [];
  const eveningScores: number[] = [];
  
  entries.forEach(entry => {
    const hour = new Date(entry.timestamp).getHours();
    const score = getMoodScore(entry);
    if (hour >= 5 && hour < 12) {
      morningScores.push(score);
    } else if (hour >= 17 && hour < 23) {
      eveningScores.push(score);
    }
  });
  
  if (morningScores.length >= 3 && eveningScores.length >= 3) {
    const morningAvg = morningScores.reduce((a, b) => a + b, 0) / morningScores.length;
    const eveningAvg = eveningScores.reduce((a, b) => a + b, 0) / eveningScores.length;
    
    if (morningAvg - eveningAvg > 0.5) {
      reflections.push("Morning check-ins suggest higher emotional energy early in the day.");
    } else if (eveningAvg - morningAvg > 0.5) {
      reflections.push("Evening reflection may bring more emotional clarity.");
    }
  }
  
  // Analyze emotional variability
  if (entries.length >= 10) {
    const scores = entries.map(getMoodScore);
    const variance = scores.reduce((sum, score) => {
      const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
      return sum + Math.pow(score - mean, 2);
    }, 0) / scores.length;
    
    if (variance < 0.8) {
      reflections.push("Your emotional patterns show a steady, consistent rhythm.");
    } else if (variance > 1.5) {
      reflections.push("Your emotions show natural variability — this is part of your unique rhythm.");
    }
  }
  
  // Fallback reflections - use soft language
  if (reflections.length === 0 && entries.length >= 7) {
    reflections.push("Your emotional patterns appear to be forming.");
  }
  if (reflections.length < 2 && entries.length >= 14) {
    reflections.push("Deeper patterns may emerge as you continue reflecting.");
  }
  
  return reflections.slice(0, 2);
};

// Determine progress phase based on data quantity
const getProgressPhase = (uniqueDays: number): "exploring" | "refining" | "strengthening" => {
  if (uniqueDays < 7) return "exploring";
  if (uniqueDays < 21) return "refining";
  return "strengthening";
};

export const useProfileSummary = (): ProfileSummary => {
  const moodHistory = getMoodHistory();
  
  return useMemo(() => {
    const uniqueDates = getUniqueDates(moodHistory);
    const uniqueDaysLogged = uniqueDates.size;
    const streaks = calculateStreak(uniqueDates);
    const monthlyAverages = calculateMonthlyAverages(moodHistory);
    const reflections = generateReflections(moodHistory);
    const progressPhase = getProgressPhase(uniqueDaysLogged);
    
    return {
      totalCheckIns: moodHistory.length,
      uniqueDaysLogged,
      currentStreak: streaks.current,
      longestStreak: streaks.longest,
      monthlyAverages,
      reflections,
      progressPhase,
      hasEnoughData: uniqueDaysLogged >= 3,
    };
  }, [moodHistory]);
};
