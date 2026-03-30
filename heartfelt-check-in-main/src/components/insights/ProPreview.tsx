import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { TrendingUp, Lock, Activity, Brain, Layers, Sparkles, Zap, BarChart3, Eye, Lightbulb, Compass, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useSubscription, capConfidence } from "@/hooks/useSubscription";

interface MoodEntry {
  id: string;
  level: number;
  timestamp: Date;
  triggers?: string[];
}

interface TrackedFactor {
  name: string;
  count: number;
  date: string;
  emoji?: string;
}

interface DeeperInsightsProps {
  moodEntries?: MoodEntry[];
  trackedFactors?: TrackedFactor[];
}

// New confidence levels based on OCCURRENCES, not phases
// Exploratory: 2+ occurrences
// Emerging: 3-4 occurrences  
// Moderate: 5-6 occurrences
// Strong: 7+ occurrences
type ConfidenceLevel = 'Exploratory' | 'Emerging' | 'Moderate' | 'Strong';

const getConfidenceFromOccurrences = (occurrences: number): ConfidenceLevel => {
  if (occurrences >= 7) return 'Strong';
  if (occurrences >= 5) return 'Moderate';
  if (occurrences >= 3) return 'Emerging';
  return 'Exploratory';
};

const getConfidenceColor = (confidence: ConfidenceLevel) => {
  switch (confidence) {
    case 'Strong': return 'bg-emerald-500/20 text-emerald-400';
    case 'Moderate': return 'bg-accent/20 text-accent';
    case 'Emerging': return 'bg-amber-500/20 text-amber-400';
    case 'Exploratory': return 'bg-purple-500/20 text-purple-400';
  }
};

// Descriptive phase labels (not unlock-based)
const getPhaseDescription = (uniqueDays: number, isSubscribed: boolean, isExpired: boolean): string => {
  if (isSubscribed) {
    if (uniqueDays >= 7) return "Strengthening confidence";
    if (uniqueDays >= 5) return "Refining patterns";
    if (uniqueDays >= 3) return "Exploring patterns";
    return "Getting started";
  }
  
  if (isExpired) {
    return "Continue tracking to strengthen confidence";
  }
  
  if (uniqueDays >= 7) return "Strengthening confidence";
  if (uniqueDays >= 5) return "Refining patterns";
  if (uniqueDays >= 3) return "Exploring patterns";
  return "Getting started";
};

export const ProPreview = ({ moodEntries = [], trackedFactors = [] }: DeeperInsightsProps) => {
  const navigate = useNavigate();
  const { 
    isSubscribed, 
    isTrialActive, 
    isExpired, 
    maxAllowedConfidence,
    canGenerateNewPatterns,
    trialDaysRemaining,
  } = useSubscription();
  
  // User sees unlocked content if subscribed OR during trial
  const isUnlocked = isSubscribed || isTrialActive;
  
  // Check if user has 7 days of check-ins (sufficient data)
  const hasSufficientData = moodEntries.length >= 7;
  // Calculate all insights from real data
  const insights = useMemo(() => {
    const now = new Date();
    
    // Get unique days with entries
    const entriesByDate = new Map<string, MoodEntry[]>();
    moodEntries.forEach(entry => {
      const dateKey = new Date(entry.timestamp).toDateString();
      if (!entriesByDate.has(dateKey)) {
        entriesByDate.set(dateKey, []);
      }
      entriesByDate.get(dateKey)!.push(entry);
    });
    
    const uniqueDays = entriesByDate.size;
    const phaseDescription = getPhaseDescription(uniqueDays, isSubscribed, isExpired);
    
    // ═══════════════════════════════════════════════════════════════
    // 1. EMOTIONAL BASELINE (Rolling 14-30 day, recent-weighted)
    // ═══════════════════════════════════════════════════════════════
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const recentEntries = moodEntries.filter(e => new Date(e.timestamp) >= thirtyDaysAgo);
    
    // Weight recent days more heavily (exponential decay)
    let weightedSum = 0;
    let weightSum = 0;
    recentEntries.forEach(entry => {
      const daysAgo = (now.getTime() - new Date(entry.timestamp).getTime()) / (24 * 60 * 60 * 1000);
      const weight = Math.exp(-daysAgo / 14); // Decay factor of 14 days
      weightedSum += entry.level * weight;
      weightSum += weight;
    });
    const baseline = weightSum > 0 ? weightedSum / weightSum : 50;

    // Calculate trend by comparing weeks
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
    
    const thisWeekMoods = recentEntries.filter(e => new Date(e.timestamp) >= oneWeekAgo);
    const lastWeekMoods = recentEntries.filter(e => {
      const d = new Date(e.timestamp);
      return d >= twoWeeksAgo && d < oneWeekAgo;
    });
    
    const thisWeekAvg = thisWeekMoods.length > 0 
      ? thisWeekMoods.reduce((s, e) => s + e.level, 0) / thisWeekMoods.length : baseline;
    const lastWeekAvg = lastWeekMoods.length > 0 
      ? lastWeekMoods.reduce((s, e) => s + e.level, 0) / lastWeekMoods.length : baseline;
    
    const trendDiff = thisWeekAvg - lastWeekAvg;
    let baselineLabel: string;
    let baselineExplanation: string;
    
    if (Math.abs(trendDiff) < 5) {
      baselineLabel = 'Steady';
      baselineExplanation = "Your emotional baseline has remained consistent. You're maintaining stability through daily fluctuations.";
    } else if (trendDiff >= 10) {
      baselineLabel = 'Improving';
      baselineExplanation = "Your baseline mood has lifted noticeably. Small, consistent shifts are adding up over time.";
    } else if (trendDiff >= 5) {
      baselineLabel = 'Gradually improving';
      baselineExplanation = "There's a gentle upward trend in your mood. Progress doesn't have to be dramatic to be real.";
    } else if (trendDiff <= -10) {
      baselineLabel = 'Declining';
      baselineExplanation = "Your mood has been trending lower. This awareness is the first step toward understanding why.";
    } else {
      baselineLabel = 'Drifting downward';
      baselineExplanation = "A slight downward drift in your baseline. This may be temporary — keep tracking to see the pattern.";
    }

    // Check for volatility (high variance regardless of trend)
    const levels = recentEntries.map(e => e.level);
    const mean = levels.length > 0 ? levels.reduce((a, b) => a + b, 0) / levels.length : 50;
    const variance = levels.length > 1 
      ? levels.reduce((sum, l) => sum + Math.pow(l - mean, 2), 0) / (levels.length - 1)
      : 0;
    const stdDev = Math.sqrt(variance);
    
    if (stdDev > 25 && Math.abs(trendDiff) < 8) {
      baselineLabel = 'Volatile';
      baselineExplanation = "Your mood varies significantly day to day. Understanding triggers may help stabilize the swings.";
    }

    // ═══════════════════════════════════════════════════════════════
    // 2. EMOTIONAL CONSISTENCY SCORE (0-100)
    // ═══════════════════════════════════════════════════════════════
    
    // Calculate day-to-day changes
    const sortedEntries = [...recentEntries].sort((a, b) => 
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
    
    let sharpChanges = 0;
    let totalChangeMagnitude = 0;
    const changes: number[] = [];
    
    for (let i = 1; i < sortedEntries.length; i++) {
      const change = Math.abs(sortedEntries[i].level - sortedEntries[i-1].level);
      changes.push(change);
      totalChangeMagnitude += change;
      if (change > 30) sharpChanges++; // Sharp change threshold
    }
    
    // Recovery speed: how quickly mood returns after a dip
    let recoveryScore = 100;
    let inDip = false;
    let dipLength = 0;
    for (const entry of sortedEntries) {
      if (entry.level < 40) {
        inDip = true;
        dipLength++;
      } else if (inDip) {
        recoveryScore -= dipLength * 5; // Penalize slow recovery
        inDip = false;
        dipLength = 0;
      }
    }
    
    // Calculate consistency score
    const avgChange = changes.length > 0 ? totalChangeMagnitude / changes.length : 0;
    const changeScore = Math.max(0, 100 - avgChange * 2);
    const sharpChangeScore = Math.max(0, 100 - (sharpChanges / Math.max(1, sortedEntries.length)) * 200);
    const finalRecoveryScore = Math.max(0, recoveryScore);
    
    const consistencyScore = Math.round(
      (changeScore * 0.4 + sharpChangeScore * 0.35 + finalRecoveryScore * 0.25)
    );
    
    let consistencyLabel: string;
    let consistencyExplanation: string;
    
    if (consistencyScore >= 86) {
      consistencyLabel = 'Very stable';
      consistencyExplanation = "Your emotional state rarely swings dramatically. You maintain equilibrium even during challenges.";
    } else if (consistencyScore >= 61) {
      consistencyLabel = 'Stable';
      consistencyExplanation = "You experience normal fluctuations within a healthy range. Recovery from dips is reasonably quick.";
    } else if (consistencyScore >= 31) {
      consistencyLabel = 'Variable';
      consistencyExplanation = "Your mood shifts more frequently. This isn't bad — it may indicate high sensitivity to your environment.";
    } else {
      consistencyLabel = 'Highly reactive';
      consistencyExplanation = "You experience significant emotional swings. Understanding your triggers can help create more stability.";
    }

    // ═══════════════════════════════════════════════════════════════
    // 3. TRIGGER CONFIDENCE (Evidence-based correlations from triggers)
    // ═══════════════════════════════════════════════════════════════
    
    // Analyze triggers from mood entries (single source of truth)
    const triggerStats = new Map<string, {
      occurrences: number;
      uniqueDays: Set<string>;
      moodSum: number;
      moods: number[];
    }>();
    
    const entriesWithTriggers = moodEntries.filter(e => e.triggers && e.triggers.length > 0);
    const entriesWithoutTriggers = moodEntries.filter(e => !e.triggers || e.triggers.length === 0);
    
    entriesWithTriggers.forEach(entry => {
      const dateKey = new Date(entry.timestamp).toDateString();
      entry.triggers?.forEach(trigger => {
        if (!triggerStats.has(trigger)) {
          triggerStats.set(trigger, {
            occurrences: 0,
            uniqueDays: new Set(),
            moodSum: 0,
            moods: [],
          });
        }
        const stats = triggerStats.get(trigger)!;
        stats.occurrences++;
        stats.uniqueDays.add(dateKey);
        stats.moodSum += entry.level;
        stats.moods.push(entry.level);
      });
    });
    
    // Calculate average mood when no triggers
    const avgWithoutTriggers = entriesWithoutTriggers.length > 0
      ? entriesWithoutTriggers.reduce((s, e) => s + e.level, 0) / entriesWithoutTriggers.length
      : baseline;
    
    // Convert to confidence array - ALWAYS show if 2+ occurrences (Exploratory)
    const triggerConfidences: Array<{
      name: string;
      confidence: number;
      occurrences: number;
      positive: boolean;
      level: ConfidenceLevel;
    }> = [];
    
    triggerStats.forEach((stats, trigger) => {
      const occurrences = stats.occurrences;
      
      // Show all triggers with 2+ occurrences (Exploratory level)
      if (occurrences < 2) return;
      
      const avgWhenPresent = stats.moodSum / occurrences;
      const difference = avgWhenPresent - avgWithoutTriggers;
      const positive = difference >= 0;
      const magnitude = Math.abs(difference);
      
      // Convert to confidence percentage
      const confidencePercent = Math.min(100, Math.round((magnitude / 30) * 100));
      
      // Get confidence level based on occurrences, capped by subscription
      const rawLevel = getConfidenceFromOccurrences(occurrences);
      const level = capConfidence(rawLevel, maxAllowedConfidence);
      
      triggerConfidences.push({
        name: trigger,
        confidence: confidencePercent,
        occurrences,
        positive,
        level
      });
    });
    
    // Sort by occurrences (more data = higher confidence)
    triggerConfidences.sort((a, b) => b.occurrences - a.occurrences);
    
    // Group factors by date for pattern analysis
    const factorsByDate = new Map<string, Map<string, number>>();
    trackedFactors.forEach(factor => {
      if (!factorsByDate.has(factor.date)) {
        factorsByDate.set(factor.date, new Map());
      }
      factorsByDate.get(factor.date)!.set(factor.name, factor.count);
    });
    
    // Calculate daily average moods for pattern detection
    const moodByDate = new Map<string, number>();
    entriesByDate.forEach((entries, date) => {
      const avg = entries.reduce((s, e) => s + e.level, 0) / entries.length;
      moodByDate.set(date, avg);
    });

    // ═══════════════════════════════════════════════════════════════
    // 4. PATTERN CLUSTERS - ALWAYS show at least 1 after 3+ days
    // Types: Time-based, Variability, Context, Location, Internal
    // ═══════════════════════════════════════════════════════════════
    
    interface PatternCluster {
      title: string;
      description: string;
      occurrences: number;
      impact: 'positive' | 'negative' | 'neutral';
      type: 'Time-based' | 'Contextual' | 'Internal' | 'Variability';
      confidence: ConfidenceLevel;
    }
    
    const patterns: PatternCluster[] = [];
    
    // Track time-based data
    const weekdayMoods: number[] = [];
    const weekendMoods: number[] = [];
    const morningMoods: number[] = [];
    const eveningMoods: number[] = [];
    
    moodByDate.forEach((mood, date) => {
      const factors = factorsByDate.get(date);
      const entries = entriesByDate.get(date) || [];
      const dateObj = new Date(date);
      const dayOfWeek = dateObj.getDay();
      
      // Track weekday vs weekend
      if (dayOfWeek === 0 || dayOfWeek === 6) {
        weekendMoods.push(mood);
      } else {
        weekdayMoods.push(mood);
      }
      
      // Track time-of-day patterns
      entries.forEach(e => {
        const hour = new Date(e.timestamp).getHours();
        if (hour >= 6 && hour < 12) morningMoods.push(e.level);
        if (hour >= 18 || hour < 2) eveningMoods.push(e.level);
      });
    });
    
    // 1. TIME-BASED PATTERNS (always check first - no triggers needed)
    if (weekdayMoods.length >= 1 && weekendMoods.length >= 1) {
      const avgWeekday = weekdayMoods.reduce((a, b) => a + b, 0) / weekdayMoods.length;
      const avgWeekend = weekendMoods.reduce((a, b) => a + b, 0) / weekendMoods.length;
      const diff = Math.abs(avgWeekday - avgWeekend);
      const totalOccurrences = weekdayMoods.length + weekendMoods.length;
      
      if (diff > 3) {
        patterns.push({
          title: avgWeekday < avgWeekend ? "Weekday mood dip" : "Weekend mood shift",
          description: avgWeekday < avgWeekend 
            ? "Weekday moods may trend lower than weekends — an exploratory pattern"
            : "Weekend moods may trend lower than weekdays — an exploratory pattern",
          occurrences: totalOccurrences,
          impact: 'neutral',
          type: 'Time-based',
          confidence: capConfidence(getConfidenceFromOccurrences(totalOccurrences), maxAllowedConfidence)
        });
      }
    }
    
    // 2. MORNING VS EVENING
    if (morningMoods.length >= 1 && eveningMoods.length >= 1) {
      const avgMorning = morningMoods.reduce((a, b) => a + b, 0) / morningMoods.length;
      const avgEvening = eveningMoods.reduce((a, b) => a + b, 0) / eveningMoods.length;
      const diff = Math.abs(avgMorning - avgEvening);
      const totalOccurrences = morningMoods.length + eveningMoods.length;
      
      if (diff > 5) {
        patterns.push({
          title: avgMorning > avgEvening ? "Morning energy" : "Evening shift",
          description: avgMorning > avgEvening 
            ? "Morning entries may reflect higher mood than evenings"
            : "Evening entries often differ emotionally from mornings",
          occurrences: totalOccurrences,
          impact: avgMorning > avgEvening ? 'positive' : 'neutral',
          type: 'Time-based',
          confidence: capConfidence(getConfidenceFromOccurrences(totalOccurrences), maxAllowedConfidence)
        });
      }
    }
    
    // 3. TRIGGER-BASED PATTERNS (contextual)
    triggerStats.forEach((stats, trigger) => {
      if (stats.occurrences >= 2) {
        const avgMood = stats.moodSum / stats.occurrences;
        const moodDirection = avgMood < 45 ? 'lower' : avgMood > 55 ? 'higher' : 'mixed';
        
        if (moodDirection !== 'mixed') {
          patterns.push({
            title: `${trigger} influence`,
            description: `${trigger} appears during ${moodDirection}-mood days, but confidence is still ${capConfidence(getConfidenceFromOccurrences(stats.occurrences), maxAllowedConfidence).toLowerCase()}`,
            occurrences: stats.occurrences,
            impact: moodDirection === 'lower' ? 'negative' : 'positive',
            type: 'Contextual',
            confidence: capConfidence(getConfidenceFromOccurrences(stats.occurrences), maxAllowedConfidence)
          });
        }
      }
    });
    
    // 4. INTERNAL PATTERNS (moods without triggers)
    if (entriesWithoutTriggers.length >= 2) {
      const avgUnattributed = entriesWithoutTriggers.reduce((s, e) => s + e.level, 0) / entriesWithoutTriggers.length;
      const variability = entriesWithoutTriggers.length > 1 
        ? Math.sqrt(entriesWithoutTriggers.reduce((sum, e) => sum + Math.pow(e.level - avgUnattributed, 2), 0) / entriesWithoutTriggers.length)
        : 0;
      
      patterns.push({
        title: "Internal patterns",
        description: variability > 15 
          ? "Days without triggers show higher mood variability"
          : avgUnattributed < 45
          ? "Lower moods often appear without logged triggers — some shifts may be internally driven"
          : "Some mood shifts don't have clear external causes — this is normal emotional rhythm",
        occurrences: entriesWithoutTriggers.length,
        impact: 'neutral',
        type: 'Internal',
        confidence: capConfidence(getConfidenceFromOccurrences(entriesWithoutTriggers.length), maxAllowedConfidence)
      });
    }
    
    // 5. VARIABILITY PATTERN (fallback)
    if (patterns.length === 0 && uniqueDays >= 3) {
      const allMoods = moodEntries.map(e => e.level);
      const avgMood = allMoods.reduce((a, b) => a + b, 0) / allMoods.length;
      const varianceVal = allMoods.reduce((sum, m) => sum + Math.pow(m - avgMood, 2), 0) / allMoods.length;
      
      patterns.push({
        title: varianceVal > 400 ? "Natural variation" : "Stable rhythm",
        description: varianceVal > 400 
          ? "Your mood shows natural variation across days — this is normal emotional rhythm"
          : "Your emotional pattern appears relatively consistent across the tracked period",
        occurrences: uniqueDays,
        impact: varianceVal > 400 ? 'neutral' : 'positive',
        type: 'Variability',
        confidence: capConfidence(getConfidenceFromOccurrences(uniqueDays), maxAllowedConfidence)
      });
    }
    
    // Sort: Higher confidence first, then by occurrences
    patterns.sort((a, b) => {
      const confOrder = { 'Strong': 4, 'Moderate': 3, 'Emerging': 2, 'Exploratory': 1 };
      const confDiff = confOrder[b.confidence] - confOrder[a.confidence];
      return confDiff !== 0 ? confDiff : b.occurrences - a.occurrences;
    });
    
    // Limit to max 3 clusters
    const finalPatterns = patterns.slice(0, 3);

    // ═══════════════════════════════════════════════════════════════
    // 5. EMOTIONAL PROFILE (Identity label)
    // ═══════════════════════════════════════════════════════════════
    
    let profile: string;
    let profileExplanation: string;
    
    if (consistencyScore >= 75 && baselineLabel === 'Steady') {
      profile = 'Steady Balancer';
      profileExplanation = "You maintain emotional equilibrium naturally. External events rarely throw you off for long.";
    } else if (baselineLabel === 'Improving' || baselineLabel === 'Gradually improving') {
      profile = 'Momentum Builder';
      profileExplanation = "You're on an upward trajectory. Your patterns show sustainable, positive momentum.";
    } else if (consistencyScore < 40) {
      profile = 'Emotional Cycler';
      profileExplanation = "You experience the full emotional spectrum intensely. This depth can be a strength when understood.";
    } else if (stdDev > 20 && consistencyScore >= 50) {
      profile = 'Reactive Thinker';
      profileExplanation = "You respond strongly to your environment but recover well. Awareness of triggers helps you navigate.";
    } else if (baseline > 60 && consistencyScore >= 60) {
      profile = 'Optimistic Steady';
      profileExplanation = "You tend toward positive emotions and maintain them consistently. A resilient foundation.";
    } else {
      profile = 'Balanced Observer';
      profileExplanation = "You navigate emotions with awareness and adaptability. Your patterns show self-knowledge developing.";
    }

    // ═══════════════════════════════════════════════════════════════
    // 6. CURRENT EMOTIONAL READ (Top-level summary - ALWAYS after 3+ days)
    // ═══════════════════════════════════════════════════════════════
    let currentEmotionalRead = "";
    
    if (uniqueDays >= 3) {
      const strongestTrigger = triggerConfidences[0];
      const hasTimePattern = finalPatterns.some(p => p.type === 'Time-based');
      
      // Build contextual summary
      const parts: string[] = [];
      
      // Baseline component
      if (baselineLabel === 'Volatile') {
        parts.push("Your emotions appear sensitive to routine changes");
      } else if (baselineLabel === 'Declining' || baselineLabel === 'Drifting downward') {
        parts.push("Your baseline has dipped slightly this week");
      } else if (baselineLabel === 'Improving' || baselineLabel === 'Gradually improving') {
        parts.push("Your mood shows upward momentum recently");
      } else {
        parts.push("You're showing early patterns of awareness and reflection");
      }
      
      // Add trigger/time context
      if (strongestTrigger && hasTimePattern) {
        parts.push(`${strongestTrigger.name} and weekends may influence mood variability`);
      } else if (strongestTrigger) {
        parts.push(`with ${strongestTrigger.name} appearing as a potential influence`);
      } else if (hasTimePattern) {
        parts.push("with time-based patterns beginning to emerge");
      } else {
        parts.push("with mixed external influences");
      }
      
      // Add consistency context
      if (consistencyScore < 40) {
        parts.push("Emotional shifts remain frequent but normal.");
      } else if (consistencyScore >= 70) {
        parts.push("Your emotional rhythm appears relatively steady.");
      }
      
      currentEmotionalRead = parts.join(". ").replace(/\.\./g, '.');
    }

    // ═══════════════════════════════════════════════════════════════
    // 7. "WHAT WE'RE NOTICING" - ALWAYS show 2-3 items
    // ═══════════════════════════════════════════════════════════════
    const observations: string[] = [];
    
    // Baseline-based observation (always add one)
    if (baselineLabel === 'Drifting downward' || baselineLabel === 'Declining') {
      if (consistencyScore >= 50) {
        observations.push("Your baseline has dipped slightly, but variability remains moderate — this often reflects pressure rather than instability.");
      } else {
        observations.push("Your emotional baseline appears lower recently. This may be a response to external circumstances.");
      }
    } else if (baselineLabel === 'Improving' || baselineLabel === 'Gradually improving') {
      observations.push("We're noticing an upward trend in your mood baseline. Small, consistent shifts appear to be adding up.");
    } else if (baselineLabel === 'Volatile') {
      observations.push("Your mood shows wider swings than usual. This may suggest sensitivity to your environment or unresolved tension.");
    } else {
      observations.push("Your emotional rhythm appears stable — a sign of consistent self-regulation.");
    }
    
    // Consistency-based observation
    if (consistencyScore < 40) {
      observations.push("Your emotional pattern shows significant variability. This isn't inherently negative — it may indicate high sensitivity to experiences.");
    } else if (consistencyScore >= 75) {
      observations.push("Your emotional consistency appears strong. You seem to recover from fluctuations relatively quickly.");
    }
    
    // Trigger-based observations
    const negativeTriggers = triggerConfidences.filter(t => !t.positive);
    if (negativeTriggers.length > 0) {
      const topNegative = negativeTriggers[0];
      observations.push(`${topNegative.name} appears frequently during mixed-mood days, but not consistently enough to conclude a strong influence.`);
    }
    
    // Unattributed mood observation
    if (entriesWithoutTriggers.length > entriesWithTriggers.length * 0.3 && entriesWithoutTriggers.length >= 2) {
      observations.push("Days without logged triggers show wider emotional range, suggesting internal processing.");
    }
    
    // Fallback observations to ensure 2-3 items
    if (observations.length < 2) {
      observations.push("Your mood patterns are forming — early signals suggest emotional awareness is developing.");
    }
    if (observations.length < 2) {
      observations.push("We're noticing how different contexts may play a role in your emotional rhythm.");
    }
    
    // Limit to 3 observations
    const finalObservations = observations.slice(0, 3);

    // ═══════════════════════════════════════════════════════════════
    // 8. "THINGS TO PAY ATTENTION TO" - ALWAYS generate exactly 3
    // ═══════════════════════════════════════════════════════════════
    const reflectionPrompts: string[] = [];
    
    // 1. Trigger-based prompt (strongest trigger, even if weak)
    const workSchoolTrigger = triggerConfidences.find(t => 
      t.name.toLowerCase().includes('school') || t.name.toLowerCase().includes('work')
    );
    const socialTrigger = triggerConfidences.find(t => 
      t.name.toLowerCase().includes('social') || 
      t.name.toLowerCase().includes('friend') || 
      t.name.toLowerCase().includes('partner')
    );
    const activityTrigger = triggerConfidences.find(t => 
      t.name.toLowerCase().includes('activity') || 
      t.name.toLowerCase().includes('training') || 
      t.name.toLowerCase().includes('exercise')
    );
    
    if (workSchoolTrigger) {
      reflectionPrompts.push(`Notice how your mood differs on days with and without ${workSchoolTrigger.name.toLowerCase()}.`);
    } else if (triggerConfidences[0]) {
      reflectionPrompts.push(`Notice how ${triggerConfidences[0].name} may influence your emotional state.`);
    } else {
      reflectionPrompts.push("Notice which parts of your day tend to shift your mood.");
    }
    
    // 2. Time-based prompt
    const hasWeekendDiff = weekdayMoods.length > 0 && weekendMoods.length > 0;
    const hasMorningEvening = morningMoods.length > 0 && eveningMoods.length > 0;
    
    if (hasWeekendDiff) {
      reflectionPrompts.push("Observe how your mood differs on school days versus non-school days.");
    } else if (hasMorningEvening) {
      reflectionPrompts.push("Observe whether mornings or evenings feel different emotionally.");
    } else {
      reflectionPrompts.push("Pay attention to whether certain times of day affect your mood more than others.");
    }
    
    // 3. Internal state prompt (rest, energy, reflection)
    if (activityTrigger) {
      reflectionPrompts.push("Observe whether active days feel stabilizing or draining.");
    } else if (socialTrigger) {
      reflectionPrompts.push("Notice how social interactions affect your emotional state.");
    } else {
      reflectionPrompts.push("Pay attention to how rest days affect emotional steadiness.");
    }
    
    // Ensure exactly 3 prompts
    const finalReflectionPrompts = reflectionPrompts.slice(0, 3);

    // ═══════════════════════════════════════════════════════════════
    // Generate trend data for visualization
    // ═══════════════════════════════════════════════════════════════
    
    const trendData: number[] = [];
    for (let i = 13; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000).toDateString();
      const dayMood = moodByDate.get(date);
      trendData.push(dayMood !== undefined ? dayMood : baseline);
    }

    return {
      uniqueDays,
      phaseDescription,
      baseline: Math.round(baseline),
      baselineLabel,
      baselineExplanation,
      consistencyScore,
      consistencyLabel,
      consistencyExplanation,
      triggerConfidences,
      patterns: finalPatterns,
      profile,
      profileExplanation,
      currentEmotionalRead,
      observations: finalObservations,
      reflectionPrompts: finalReflectionPrompts,
      trendData,
    };
  }, [moodEntries, trackedFactors, isSubscribed, isExpired, maxAllowedConfidence]);

  // Get unique factor count
  const uniqueFactorCount = new Set(trackedFactors.map(f => f.name)).size;

  if (!isUnlocked) {
    const totalEntries = moodEntries.length;
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <p className="text-foreground font-bold">✦ Deeper Insights</p>
          <button
            onClick={() => navigate('/you')}
            className="text-xs text-amber-400 px-2 py-1 rounded-full bg-amber-500/10 border border-amber-500/20"
          >
            🔒 View Pro
          </button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <LockedFeatureCard
            icon={Layers}
            title="Trigger Patterns"
            description="What actually changes your mood"
            totalEntries={totalEntries}
            required={10}
            accentColor="#3b82f6"
          />
          <LockedFeatureCard
            icon={Brain}
            title="AI Reflections"
            description="Personalised weekly observations"
            totalEntries={totalEntries}
            required={7}
            accentColor="#a855f7"
          />
          <LockedFeatureCard
            icon={TrendingUp}
            title="Long-term Trends"
            description="Track progress over months"
            totalEntries={totalEntries}
            required={60}
            accentColor="#06b6d4"
          />
          <LockedFeatureCard
            icon={Zap}
            title="Emotional Forecasting"
            description="Predict upcoming mood dips"
            totalEntries={totalEntries}
            required={21}
            accentColor="#f59e0b"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">

      {/* Main Deeper Insights Card */}
      <Card className="bg-gradient-to-br from-card/80 to-card/40 backdrop-blur-sm border-border/40 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-40 h-40 bg-accent/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-purple-500/5 rounded-full blur-2xl" />
        
        <CardContent className="p-5 relative">
          <div className="flex items-center gap-2 mb-5">
            <Sparkles className="w-4 h-4 text-accent" />
            <h2 className="text-foreground font-bold">Deeper Insights</h2>
            
            {/* Trial/Subscription Status Badge */}
            {isSubscribed ? (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-medium flex items-center gap-1 ml-auto bg-emerald-500/15 text-emerald-400">
                <Sparkles className="w-2.5 h-2.5" />
                Pro
              </span>
            ) : isTrialActive && hasSufficientData ? (
              <button 
                onClick={() => navigate('/you')}
                className="px-2 py-0.5 rounded-full text-[10px] font-medium flex items-center gap-1 ml-auto bg-amber-500/15 text-amber-400 hover:bg-amber-500/25 transition-colors"
              >
                <Sparkles className="w-2.5 h-2.5" />
                Continue with Pro
              </button>
            ) : isTrialActive ? (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-medium flex items-center gap-1 ml-auto bg-accent/15 text-accent">
                <Clock className="w-2.5 h-2.5" />
                {trialDaysRemaining} days in trial
              </span>
            ) : (
              <button 
                onClick={() => navigate('/you')}
                className="px-2 py-0.5 rounded-full text-[10px] font-medium flex items-center gap-1 ml-auto bg-amber-500/15 text-amber-400 hover:bg-amber-500/25 transition-colors"
              >
                <Lock className="w-2.5 h-2.5" />
                View Pro
              </button>
            )}
          </div>
          
          {/* Insight Modules */}
          <div className="relative">
            {/* Content - blur if no sufficient data OR expired trial */}
            <div className={`space-y-6 transition-all duration-500 ${
              !hasSufficientData || (!isSubscribed && isExpired) 
                ? 'blur-[4px] opacity-50 pointer-events-none select-none' 
                : 'animate-fade-in'
            }`}>
              
              {/* CURRENT EMOTIONAL READ - Top Summary Card (ALWAYS after 3+ days) */}
              {(isUnlocked || hasSufficientData) && insights.currentEmotionalRead && (
                <div className="p-4 rounded-xl bg-gradient-to-br from-accent/10 to-emerald-500/10 border border-accent/30">
                  <div className="flex items-center gap-2 mb-2">
                    <Compass className="w-4 h-4 text-accent" />
                    <span className="text-foreground text-sm font-semibold">Current Emotional Read</span>
                  </div>
                  <p className="text-foreground/80 text-sm leading-relaxed">
                    {insights.currentEmotionalRead}
                  </p>
                </div>
              )}
              
              {/* Phase Description (descriptive, not unlock-based) */}
              {isUnlocked && (
                <div className="flex items-center justify-between px-1">
                  <span className="text-muted-foreground/60 text-xs">
                    {insights.phaseDescription}
                  </span>
                  <span className="text-muted-foreground/40 text-[10px]">
                    {insights.uniqueDays} days tracked
                  </span>
                </div>
              )}

              {/* 1. Emotional Baseline / Trends */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-accent" />
                  <span className="text-foreground text-sm font-medium">Emotional Baseline</span>
                  <span className={`ml-auto text-xs font-medium px-2 py-0.5 rounded-full ${
                    insights.baselineLabel === 'Improving' || insights.baselineLabel === 'Gradually improving'
                      ? 'bg-emerald-500/15 text-emerald-400'
                      : insights.baselineLabel === 'Declining' || insights.baselineLabel === 'Drifting downward'
                      ? 'bg-amber-500/15 text-amber-400'
                      : 'bg-accent/15 text-accent'
                  }`}>
                    {insights.baselineLabel}
                  </span>
                </div>
                
                {/* Trend visualization */}
                <div className="relative h-16 flex items-end gap-0.5">
                  {insights.trendData.map((height, i) => (
                    <div
                      key={i}
                      className="flex-1 rounded-t-sm bg-gradient-to-t from-accent/30 to-accent/70 transition-all duration-300"
                      style={{ height: `${Math.max(10, height)}%` }}
                    />
                  ))}
                </div>
                
                <p className="text-muted-foreground text-xs leading-relaxed">
                  {insights.baselineExplanation}
                </p>
              </div>

              {/* 2. Emotional Consistency */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-cyan-400" />
                  <span className="text-foreground text-sm font-medium">Emotional Consistency</span>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="relative w-16 h-16 flex-shrink-0">
                    <svg className="w-full h-full transform -rotate-90">
                      <circle
                        cx="32"
                        cy="32"
                        r="28"
                        fill="none"
                        stroke="hsl(var(--muted) / 0.3)"
                        strokeWidth="4"
                      />
                      <circle
                        cx="32"
                        cy="32"
                        r="28"
                        fill="none"
                        stroke={
                          insights.consistencyScore >= 61 ? 'hsl(160, 84%, 39%)' :
                          insights.consistencyScore >= 31 ? 'hsl(var(--accent))' :
                          'hsl(38, 92%, 50%)'
                        }
                        strokeWidth="4"
                        strokeLinecap="round"
                        strokeDasharray={`${(insights.consistencyScore / 100) * 176} 176`}
                        className="transition-all duration-1000"
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-foreground font-bold text-lg">{insights.consistencyScore}</span>
                    </div>
                  </div>
                  
                  <div className="flex-1">
                    <p className="text-foreground/80 text-xs font-medium mb-1">{insights.consistencyLabel}</p>
                    <p className="text-muted-foreground text-xs leading-relaxed">
                      {insights.consistencyExplanation}
                    </p>
                  </div>
                </div>
                
                {/* Score legend */}
                <div className="flex gap-2 text-[10px] text-muted-foreground/60">
                  <span>0-30: Reactive</span>
                  <span>•</span>
                  <span>31-60: Variable</span>
                  <span>•</span>
                  <span>61-85: Stable</span>
                  <span>•</span>
                  <span>86+: Very stable</span>
                </div>
              </div>

              {/* 3. Trigger Confidence */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-400" />
                  <span className="text-foreground text-sm font-medium">Trigger Confidence</span>
                </div>
                
                {insights.triggerConfidences.length > 0 ? (
                  <div className="space-y-2.5">
                    {insights.triggerConfidences.slice(0, 5).map((trigger, i) => (
                      <div key={i} className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground text-xs">{trigger.name}</span>
                          <div className="flex items-center gap-2">
                            <span className={`text-[10px] px-1.5 py-0.5 rounded ${getConfidenceColor(trigger.level)}`}>
                              {trigger.level}
                            </span>
                            <span className={`text-[10px] font-medium ${
                              trigger.positive ? 'text-emerald-400' : 'text-amber-400'
                            }`}>
                              {trigger.positive ? '↑' : '↓'}
                            </span>
                          </div>
                        </div>
                        <div className="h-1.5 bg-muted/30 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full transition-all duration-700 ${
                              trigger.positive 
                                ? 'bg-gradient-to-r from-emerald-500/50 to-emerald-400' 
                                : 'bg-gradient-to-r from-amber-500/50 to-amber-400'
                            }`}
                            style={{ width: `${Math.min(100, trigger.occurrences * 14)}%` }}
                          />
                        </div>
                        <span className="text-muted-foreground/50 text-[10px]">
                          {trigger.occurrences} occurrences
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-3 rounded-lg bg-muted/10 border border-border/20">
                    <p className="text-foreground/70 text-xs mb-1">Early signals forming.</p>
                    <p className="text-muted-foreground/60 text-[10px]">
                      Continue logging moods with triggers to reveal connections.
                    </p>
                  </div>
                )}
              </div>

              {/* 4. Pattern Clusters - ALWAYS shows content */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-purple-400" />
                  <span className="text-foreground text-sm font-medium">Pattern Clusters</span>
                </div>
                
                <div className="space-y-2">
                  {insights.patterns.map((pattern, i) => (
                    <div 
                      key={i} 
                      className={`flex items-start gap-2 p-2.5 rounded-lg ${
                        pattern.type === 'Internal' 
                          ? 'bg-purple-500/10 border border-purple-500/20'
                          : pattern.type === 'Time-based'
                          ? 'bg-cyan-500/10 border border-cyan-500/20'
                          : pattern.type === 'Variability'
                          ? 'bg-blue-500/10 border border-blue-500/20'
                          : pattern.impact === 'positive' 
                          ? 'bg-emerald-500/10 border border-emerald-500/20' 
                          : pattern.impact === 'negative'
                          ? 'bg-amber-500/10 border border-amber-500/20'
                          : 'bg-muted/20 border border-border/30'
                      }`}
                    >
                      <div className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${
                        pattern.type === 'Internal' ? 'bg-purple-400' :
                        pattern.type === 'Time-based' ? 'bg-cyan-400' :
                        pattern.type === 'Variability' ? 'bg-blue-400' :
                        pattern.impact === 'positive' ? 'bg-emerald-400' : 
                        pattern.impact === 'negative' ? 'bg-amber-400' : 'bg-muted-foreground/50'
                      }`} />
                      <div className="flex-1">
                        <p className="text-foreground/90 text-xs font-medium mb-0.5">{pattern.title}</p>
                        <p className="text-foreground/60 text-[11px]">{pattern.description}</p>
                        <div className="flex items-center gap-2 mt-1.5">
                          <span className={`text-[10px] px-1.5 py-0.5 rounded ${getConfidenceColor(pattern.confidence)}`}>
                            {pattern.confidence}
                          </span>
                          <span className="text-muted-foreground/50 text-[10px]">
                            {pattern.type}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                <p className="text-muted-foreground/40 text-[10px]">
                  Patterns refine as you log. Confidence strengthens with more data.
                </p>
              </div>

              {/* 5. What We're Noticing - ALWAYS shows 2-3 items */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4 text-sky-400" />
                  <span className="text-foreground text-sm font-medium">What We're Noticing</span>
                </div>
                
                <div className="space-y-2">
                  {insights.observations.map((observation, i) => (
                    <div 
                      key={i} 
                      className="flex items-start gap-2 p-3 rounded-lg bg-sky-500/5 border border-sky-500/10"
                    >
                      <div className="w-1 h-1 rounded-full mt-2 flex-shrink-0 bg-sky-400/60" />
                      <p className="text-foreground/70 text-xs leading-relaxed">{observation}</p>
                    </div>
                  ))}
                </div>
                
                <p className="text-muted-foreground/40 text-[10px]">
                  These signals may change as more context is logged.
                </p>
              </div>

              {/* 6. Things to Pay Attention To - ALWAYS shows exactly 3 */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Lightbulb className="w-4 h-4 text-amber-400" />
                  <span className="text-foreground text-sm font-medium">Things to Pay Attention To</span>
                </div>
                
                <div className="space-y-2">
                  {insights.reflectionPrompts.map((prompt, i) => (
                    <div 
                      key={i} 
                      className="flex items-start gap-2 p-3 rounded-lg bg-amber-500/5 border border-amber-500/10"
                    >
                      <div className="w-1 h-1 rounded-full mt-2 flex-shrink-0 bg-amber-400/60" />
                      <p className="text-foreground/70 text-xs leading-relaxed">{prompt}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* 7. Emotional Profile */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Brain className="w-4 h-4 text-rose-400" />
                  <span className="text-foreground text-sm font-medium">Your Emotional Profile</span>
                </div>
                
                <div className="p-4 rounded-xl bg-gradient-to-br from-accent/10 to-purple-500/10 border border-accent/20">
                  <p className="text-accent font-semibold text-base mb-1">{insights.profile}</p>
                  <p className="text-muted-foreground text-xs leading-relaxed">
                    {insights.profileExplanation}
                  </p>
                </div>
              </div>
            </div>
            
            {/* Lock overlay - shows when insufficient data */}
            {!hasSufficientData && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-t from-card via-card/80 to-transparent">
                <Lock className="w-8 h-8 text-muted-foreground/50 mb-3" />
                <p className="text-muted-foreground text-sm mb-2 text-center px-4">
                  {insights.uniqueDays}/7 days of check-ins
                </p>
                <p className="text-foreground/60 text-xs mb-4 text-center px-6 max-w-xs">
                  Deeper insights become available as you continue logging.
                </p>
                <div className="w-32 h-1.5 bg-muted/30 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-accent rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, (insights.uniqueDays / 7) * 100)}%` }}
                  />
                </div>
              </div>
            )}
            
            {/* Upgrade overlay - shows when on FREE TRIAL with sufficient data */}
            {hasSufficientData && !isSubscribed && isTrialActive && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-t from-card via-card/80 to-transparent">
                <p className="text-muted-foreground text-sm mb-2 text-center px-4">
                  Your patterns are ready
                </p>
                <p className="text-foreground/60 text-xs mb-4 text-center px-6 max-w-xs">
                  Continue with Pro to access your deeper insights.
                </p>
                <button 
                  onClick={() => navigate('/you')}
                  className="px-6 py-3 rounded-full bg-accent/20 border border-accent/30 text-accent text-sm font-medium hover:bg-accent/30 transition-all duration-300 hover:scale-105 flex items-center gap-2 shadow-lg shadow-accent/10"
                >
                  <Sparkles className="w-4 h-4" />
                  View Pro Options
                </button>
              </div>
            )}
            
            {/* Pro overlay - shows when EXPIRED trial AND has sufficient data */}
            {hasSufficientData && !isSubscribed && isExpired && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-t from-card via-card/80 to-transparent">
                <p className="text-muted-foreground text-sm mb-2 text-center px-4">
                  Your patterns are ready
                </p>
                <p className="text-foreground/60 text-xs mb-4 text-center px-6 max-w-xs">
                  Continue with Pro to view your deeper insights.
                </p>
                <button 
                  onClick={() => navigate('/you')}
                  className="px-6 py-3 rounded-full bg-accent/20 border border-accent/30 text-accent text-sm font-medium hover:bg-accent/30 transition-all duration-300 hover:scale-105 flex items-center gap-2 shadow-lg shadow-accent/10"
                >
                  <Sparkles className="w-4 h-4" />
                  Continue with Pro
                </button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

    </div>
  );
};

const LockedFeatureCard = ({ 
  icon: Icon, 
  title, 
  description,
  totalEntries,
  required,
  accentColor,
}: { 
  icon: typeof Activity; 
  title: string; 
  description: string;
  totalEntries: number;
  required: number;
  accentColor: string;
}) => {
  const pct = Math.min(100, Math.round((totalEntries / required) * 100));
  return (
    <Card className="bg-card/30 backdrop-blur-sm border-border/20 overflow-hidden relative cursor-pointer hover:bg-card/40 transition-all duration-300">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div className="w-7 h-7 rounded-lg bg-muted/30 flex items-center justify-center">
            <Icon className="w-3.5 h-3.5 text-muted-foreground" />
          </div>
          <Lock className="w-3 h-3 text-muted-foreground/50" />
        </div>
        <p className="text-foreground/70 text-xs font-medium mb-0.5">{title}</p>
        <p className="text-muted-foreground/60 text-[10px] mb-2">{description}</p>
        <div className="h-0.5 rounded-full bg-border/30 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${pct}%`, backgroundColor: accentColor }}
          />
        </div>
        <p className="text-[9px] text-right mt-1" style={{ color: `${accentColor}90` }}>
          {totalEntries}/{required} entries
        </p>
      </CardContent>
    </Card>
  );
};
