import { useMemo } from "react";
import { format } from "date-fns";

export type TriggerType = "people" | "activity" | "place" | "external" | "custom";
export type TriggerPolarity = "positive" | "neutral" | "negative" | "unknown";

// NEW: Occurrence-based confidence levels
// Exploratory: 2+ occurrences
// Emerging: 3-4 occurrences  
// Moderate: 5-6 occurrences
// Strong: 7+ occurrences
export type ConfidenceLevel = "Strong" | "Moderate" | "Emerging" | "Exploratory";

// Helper to get confidence from occurrences
export const getConfidenceFromOccurrences = (occurrences: number): ConfidenceLevel => {
  if (occurrences >= 7) return 'Strong';
  if (occurrences >= 5) return 'Moderate';
  if (occurrences >= 3) return 'Emerging';
  return 'Exploratory';
};

export interface TriggerImpact {
  trigger: string;
  category: TriggerType;
  occurrences: number;
  uniqueDays: number;
  avgMoodWhenPresent: number;
  avgMoodWhenAbsent: number;
  impact: "positive" | "negative" | "neutral" | "mixed";
  confidence: ConfidenceLevel;
  confidenceScore: number; // 0-100
  polarity: TriggerPolarity;
}

export interface TriggerPattern {
  description: string;
  triggerNames: string[];
  occurrences: number;
  impact: "positive" | "negative" | "internal";
  explanation: string;
  triggerTypes: TriggerType[];
  confidence: ConfidenceLevel;
}

// Unattributed mood pattern for moods without triggers
export interface UnattributedPattern {
  type: "baseline_drift" | "internal_cycle" | "unattributed" | "day_of_week" | "time_of_day" | "sequence";
  description: string;
  explanation: string;
  moodTrend: "declining" | "improving" | "stable" | "fluctuating";
  avgMood: number;
  count: number;
}

export interface ContextQuality {
  totalMoods: number;
  moodsWithContext: number;
  moodsWithoutContext: number;
  contextPercentage: number;
  hasGoodCoverage: boolean;
}

export interface BaselineDrift {
  isDetected: boolean;
  direction: "declining" | "improving" | "stable";
  magnitude: number;
  explanation: string;
  hasContext: boolean;
}

export interface TriggerInsightsResult {
  triggerImpacts: TriggerImpact[];
  topPositive: TriggerImpact[];
  topNegative: TriggerImpact[];
  patterns: TriggerPattern[];
  unattributedPatterns: UnattributedPattern[];
  baselineDrift: BaselineDrift;
  contextQuality: ContextQuality;
  totalMoodsWithTriggers: number;
  totalMoodsWithoutTriggers: number;
  daysWithTriggerData: number;
  hasEnoughTriggerData: boolean;
  hasEnoughMoodData: boolean;
  progressMessage: string;
  triggersNeededForConfidence: number;
  daysTracked: number;
  phaseDescription: string;
}

// Trigger categories for grouping
const TRIGGER_TO_TYPE: Record<string, TriggerType> = {
  "Myself": "people",
  "Partner": "people",
  "Family": "people",
  "Friends": "people",
  "Colleagues": "people",
  "Work": "activity",
  "Training": "activity",
  "Hobby": "activity",
  "Resting": "activity",
  "Studying": "activity",
  "Music": "activity",
  "TV": "activity",
  "Physical activity": "activity",
  "Exercise": "activity",
  "Home": "place",
  "Office": "place",
  "School": "place",
  "University": "place",
  "News": "external",
  "Economy": "external",
  "Social Media": "external",
  "Weather": "external",
};

const getTriggerType = (trigger: string): TriggerType => {
  return TRIGGER_TO_TYPE[trigger] || "custom";
};

// Descriptive phase labels (not unlock-based)
const getPhaseDescription = (uniqueDays: number): string => {
  if (uniqueDays >= 7) return "Strengthening confidence";
  if (uniqueDays >= 5) return "Refining patterns";
  if (uniqueDays >= 3) return "Exploring patterns";
  return "Getting started";
};

// Minimum thresholds
const MIN_OCCURRENCES_FOR_DISPLAY = 2; // Show all triggers with 2+ occurrences
const GOOD_CONTEXT_COVERAGE = 0.6;

interface MoodWithTriggers {
  id: string;
  level: number;
  timestamp: Date;
  triggers: string[];
  label: string;
}

export const useTriggerInsights = (
  moodEntries: MoodWithTriggers[],
  selectedMonth?: Date
): TriggerInsightsResult => {
  return useMemo(() => {
    const entries = selectedMonth
      ? moodEntries.filter(e => {
          const entryMonth = new Date(e.timestamp);
          return (
            entryMonth.getMonth() === selectedMonth.getMonth() &&
            entryMonth.getFullYear() === selectedMonth.getFullYear()
          );
        })
      : moodEntries;

    // Calculate unique days tracked
    const allDaysTracked = new Set(
      entries.map(e => format(new Date(e.timestamp), "yyyy-MM-dd"))
    );
    const daysTracked = allDaysTracked.size;
    const phaseDescription = getPhaseDescription(daysTracked);

    // Context quality analysis
    const entriesWithTriggers = entries.filter(e => e.triggers && e.triggers.length > 0);
    const entriesWithoutTriggers = entries.filter(e => !e.triggers || e.triggers.length === 0);
    
    const contextQuality: ContextQuality = {
      totalMoods: entries.length,
      moodsWithContext: entriesWithTriggers.length,
      moodsWithoutContext: entriesWithoutTriggers.length,
      contextPercentage: entries.length > 0 
        ? Math.round((entriesWithTriggers.length / entries.length) * 100) 
        : 0,
      hasGoodCoverage: entries.length > 0 && 
        (entriesWithTriggers.length / entries.length) >= GOOD_CONTEXT_COVERAGE,
    };
    
    const daysWithTriggers = new Set(
      entriesWithTriggers.map(e => format(new Date(e.timestamp), "yyyy-MM-dd"))
    );

    // Overall averages
    const overallAvg = entries.length > 0
      ? entries.reduce((sum, e) => sum + e.level, 0) / entries.length
      : 50;
    
    const avgWithTriggers = entriesWithTriggers.length > 0
      ? entriesWithTriggers.reduce((sum, e) => sum + e.level, 0) / entriesWithTriggers.length
      : overallAvg;
      
    const avgWithoutTriggers = entriesWithoutTriggers.length > 0
      ? entriesWithoutTriggers.reduce((sum, e) => sum + e.level, 0) / entriesWithoutTriggers.length
      : overallAvg;

    // Trigger analysis with occurrence-based confidence
    const triggerStats = new Map<string, {
      occurrences: number;
      uniqueDays: Set<string>;
      moodSum: number;
      moods: number[];
      type: TriggerType;
    }>();
    
    entriesWithTriggers.forEach(entry => {
      const dateKey = format(new Date(entry.timestamp), "yyyy-MM-dd");
      
      entry.triggers.forEach(trigger => {
        if (!triggerStats.has(trigger)) {
          triggerStats.set(trigger, {
            occurrences: 0,
            uniqueDays: new Set(),
            moodSum: 0,
            moods: [],
            type: getTriggerType(trigger),
          });
        }
        
        const stats = triggerStats.get(trigger)!;
        stats.occurrences++;
        stats.uniqueDays.add(dateKey);
        stats.moodSum += entry.level;
        stats.moods.push(entry.level);
      });
    });

    // Convert to TriggerImpact with occurrence-based confidence
    const triggerImpacts: TriggerImpact[] = [];
    
    triggerStats.forEach((stats, trigger) => {
      // Show all triggers with 2+ occurrences (Exploratory level)
      if (stats.occurrences < MIN_OCCURRENCES_FOR_DISPLAY) return;
      
      const avgWhenPresent = stats.moodSum / stats.occurrences;
      const difference = avgWhenPresent - avgWithTriggers;
      
      // Get confidence from occurrences
      const confidence = getConfidenceFromOccurrences(stats.occurrences);
      const confidenceScore = Math.min(100, stats.occurrences * 14);
      
      // Impact determination
      let impact: "positive" | "negative" | "neutral" | "mixed";
      
      const variance = stats.moods.reduce((sum, m) => 
        sum + Math.pow(m - avgWhenPresent, 2), 0
      ) / stats.moods.length;
      const stdDev = Math.sqrt(variance);
      
      if (stdDev > 25) {
        impact = "mixed";
      } else if (difference >= 8) {
        impact = "positive";
      } else if (difference <= -8) {
        impact = "negative";
      } else {
        impact = "neutral";
      }
      
      const polarity: TriggerPolarity = 
        impact === "positive" ? "positive" :
        impact === "negative" ? "negative" :
        impact === "mixed" ? "unknown" : "neutral";
      
      triggerImpacts.push({
        trigger,
        category: stats.type,
        occurrences: stats.occurrences,
        uniqueDays: stats.uniqueDays.size,
        avgMoodWhenPresent: Math.round(avgWhenPresent),
        avgMoodWhenAbsent: Math.round(avgWithTriggers),
        impact,
        confidence,
        confidenceScore,
        polarity,
      });
    });
    
    // Sort by occurrences (more data = higher confidence)
    triggerImpacts.sort((a, b) => b.occurrences - a.occurrences);
    
    const topPositive = triggerImpacts.filter(t => t.impact === "positive").slice(0, 3);
    const topNegative = triggerImpacts.filter(t => t.impact === "negative").slice(0, 3);

    // Baseline drift detection
    let baselineDrift: BaselineDrift = {
      isDetected: false,
      direction: "stable",
      magnitude: 0,
      explanation: "",
      hasContext: false,
    };
    
    if (entries.length >= 5) {
      const sortedEntries = [...entries].sort((a, b) => 
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );
      const midpoint = Math.floor(sortedEntries.length / 2);
      const firstHalf = sortedEntries.slice(0, midpoint);
      const secondHalf = sortedEntries.slice(midpoint);
      
      const firstAvg = firstHalf.reduce((sum, e) => sum + e.level, 0) / firstHalf.length;
      const secondAvg = secondHalf.reduce((sum, e) => sum + e.level, 0) / secondHalf.length;
      const change = secondAvg - firstAvg;
      
      if (Math.abs(change) >= 10) {
        const direction: "declining" | "improving" | "stable" = 
          change <= -10 ? "declining" : change >= 10 ? "improving" : "stable";
        
        const driftHasContext = entriesWithTriggers.length >= entries.length * 0.5;
        
        const explanation = direction === "declining"
          ? driftHasContext 
            ? "Your mood appears to be trending lower — tracked triggers may offer clues."
            : "Your mood may be drifting lower. Sometimes feelings shift without a clear external cause."
          : driftHasContext
            ? "Your mood appears to be improving — your tracked activities may be helping."
            : "Your mood seems to be lifting naturally.";
        
        baselineDrift = {
          isDetected: true,
          direction,
          magnitude: Math.abs(Math.round(change)),
          hasContext: driftHasContext,
          explanation,
        };
      }
    }

    // Internal patterns (moods without triggers)
    const unattributedPatterns: UnattributedPattern[] = [];
    const hasEnoughMoodData = entries.length >= 3;
    
    if (hasEnoughMoodData) {
      // Day of Week Analysis
      const dayOfWeekStats = new Map<number, { moods: number[]; count: number }>();
      const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
      
      entries.forEach(entry => {
        const day = new Date(entry.timestamp).getDay();
        const existing = dayOfWeekStats.get(day) || { moods: [], count: 0 };
        dayOfWeekStats.set(day, {
          moods: [...existing.moods, entry.level],
          count: existing.count + 1,
        });
      });
      
      dayOfWeekStats.forEach((stats, dayNum) => {
        if (stats.count >= 2) {
          const avgMood = stats.moods.reduce((s, m) => s + m, 0) / stats.moods.length;
          const diff = avgMood - overallAvg;
          
          if (Math.abs(diff) >= 12) {
            const dayName = dayNames[dayNum];
            const isLower = diff < 0;
            
            unattributedPatterns.push({
              type: "day_of_week",
              description: isLower 
                ? `Lower moods may appear on ${dayName}s`
                : `${dayName}s often align with better moods`,
              explanation: `${stats.count} ${dayName}s show mood around ${Math.round(avgMood)}% (${isLower ? "below" : "above"} your ${Math.round(overallAvg)}% average).`,
              moodTrend: isLower ? "declining" : "improving",
              avgMood: Math.round(avgMood),
              count: stats.count,
            });
          }
        }
      });
      
      // Time of Day Analysis
      const timeOfDayStats = new Map<string, { moods: number[]; count: number }>();
      const getTimeOfDay = (date: Date) => {
        const hour = date.getHours();
        if (hour >= 5 && hour < 12) return "morning";
        if (hour >= 12 && hour < 17) return "afternoon";
        if (hour >= 17 && hour < 21) return "evening";
        return "night";
      };
      const timeLabels: Record<string, string> = {
        morning: "Morning",
        afternoon: "Afternoon",
        evening: "Evening",
        night: "Late night",
      };
      
      entries.forEach(entry => {
        const timeOfDay = getTimeOfDay(new Date(entry.timestamp));
        const existing = timeOfDayStats.get(timeOfDay) || { moods: [], count: 0 };
        timeOfDayStats.set(timeOfDay, {
          moods: [...existing.moods, entry.level],
          count: existing.count + 1,
        });
      });
      
      timeOfDayStats.forEach((stats, timeOfDay) => {
        if (stats.count >= 2) {
          const avgMood = stats.moods.reduce((s, m) => s + m, 0) / stats.moods.length;
          const diff = avgMood - overallAvg;
          
          if (Math.abs(diff) >= 10) {
            const isLower = diff < 0;
            const label = timeLabels[timeOfDay];
            
            unattributedPatterns.push({
              type: "time_of_day",
              description: isLower
                ? `${label} entries tend to be lower`
                : `${label} entries often align with better moods`,
              explanation: `${stats.count} ${label.toLowerCase()} check-ins average ${Math.round(avgMood)}% (${Math.abs(Math.round(diff))}% ${isLower ? "below" : "above"} overall).`,
              moodTrend: isLower ? "declining" : "improving",
              avgMood: Math.round(avgMood),
              count: stats.count,
            });
          }
        }
      });
      
      // General fluctuation (fallback)
      if (unattributedPatterns.length === 0 && entriesWithoutTriggers.length >= 2) {
        const unattributedAvg = avgWithoutTriggers;
        const unattributedVariance = entriesWithoutTriggers.reduce((sum, e) => 
          sum + Math.pow(e.level - unattributedAvg, 2), 0
        ) / entriesWithoutTriggers.length;
        const unattributedStdDev = Math.sqrt(unattributedVariance);
        
        if (unattributedStdDev > 20) {
          unattributedPatterns.push({
            type: "internal_cycle",
            description: "Emotional fluctuations without clear triggers",
            explanation: "Some mood shifts may reflect internal rhythms — this is normal.",
            moodTrend: "fluctuating",
            avgMood: Math.round(unattributedAvg),
            count: entriesWithoutTriggers.length,
          });
        }
      }
    }

    // Trigger patterns
    const patterns: TriggerPattern[] = [];
    
    topPositive.forEach(trigger => {
      if (trigger.occurrences >= 2) {
        const moodQuality = trigger.avgMoodWhenPresent > 60 ? "better" : "steadier";
        
        patterns.push({
          description: `${trigger.trigger} often aligns with ${moodQuality} moods`,
          triggerNames: [trigger.trigger],
          occurrences: trigger.occurrences,
          impact: "positive",
          explanation: `When "${trigger.trigger}" is present, mood tends toward ${trigger.avgMoodWhenPresent}%.`,
          triggerTypes: [trigger.category],
          confidence: trigger.confidence,
        });
      }
    });
    
    topNegative.forEach(trigger => {
      if (trigger.occurrences >= 2) {
        patterns.push({
          description: `${trigger.trigger} often coincides with ${trigger.avgMoodWhenPresent < 40 ? "emotional dips" : "lower moods"}`,
          triggerNames: [trigger.trigger],
          occurrences: trigger.occurrences,
          impact: "negative",
          explanation: `"${trigger.trigger}" tends to appear on days when mood is lower.`,
          triggerTypes: [trigger.category],
          confidence: trigger.confidence,
        });
      }
    });

    // Sort patterns by confidence
    const confidenceOrder: Record<ConfidenceLevel, number> = { 
      Strong: 4, Moderate: 3, Emerging: 2, Exploratory: 1 
    };
    patterns.sort((a, b) => {
      const confDiff = confidenceOrder[b.confidence] - confidenceOrder[a.confidence];
      return confDiff !== 0 ? confDiff : b.occurrences - a.occurrences;
    });

    // Progress messaging
    const hasEnoughTriggerData = entriesWithTriggers.length >= 5 && daysWithTriggers.size >= 2;
    
    let progressMessage: string;
    let triggersNeededForConfidence: number;
    
    if (entries.length === 0) {
      progressMessage = "Start logging moods to see what influences how you feel.";
      triggersNeededForConfidence = 5;
    } else if (daysTracked >= 7) {
      progressMessage = "Patterns established. Insights continue refining as you log.";
      triggersNeededForConfidence = 0;
    } else {
      progressMessage = "Confidence building. Patterns growing clearer.";
      triggersNeededForConfidence = Math.max(0, 5 - entriesWithTriggers.length);
    }

    return {
      triggerImpacts,
      topPositive,
      topNegative,
      patterns: patterns.slice(0, 6),
      unattributedPatterns,
      baselineDrift,
      contextQuality,
      totalMoodsWithTriggers: entriesWithTriggers.length,
      totalMoodsWithoutTriggers: entriesWithoutTriggers.length,
      daysWithTriggerData: daysWithTriggers.size,
      hasEnoughTriggerData,
      hasEnoughMoodData,
      progressMessage,
      triggersNeededForConfidence,
      daysTracked,
      phaseDescription,
    };
  }, [moodEntries, selectedMonth]);
};
