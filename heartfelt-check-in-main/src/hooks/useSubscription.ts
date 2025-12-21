import { useState, useEffect, useMemo } from "react";
import { getMoodHistory } from "./useMoodState";

export type SubscriptionStatus = "trial" | "expired" | "subscribed";

interface UseSubscriptionResult {
  status: SubscriptionStatus;
  isTrialActive: boolean;
  isSubscribed: boolean;
  isExpired: boolean;
  trialDaysRemaining: number;
  trialDaysUsed: number;
  trialStartDate: Date | null;
  maxAllowedConfidence: 'Exploratory' | 'Emerging' | 'Moderate' | 'Strong';
  canGenerateNewPatterns: boolean;
  subscribe: () => void; // Placeholder for payment flow
}

const TRIAL_DURATION_DAYS = 7;
const SUBSCRIPTION_KEY = "deeper_insights_subscribed";
const TRIAL_STARTED_KEY = "trial_started_at";

// Get user ID (includes anonymous session ID)
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

// Count unique days with check-ins (multiple check-ins on same day = 1 day)
const getUniqueCheckInDays = (): number => {
  const moodHistory = getMoodHistory();
  const uniqueDates = new Set<string>();
  
  moodHistory.forEach(entry => {
    const date = new Date(entry.timestamp);
    // Format as YYYY-MM-DD to count unique days
    const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    uniqueDates.add(dateKey);
  });
  
  return uniqueDates.size;
};

export const useSubscription = (): UseSubscriptionResult => {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [uniqueCheckInDays, setUniqueCheckInDays] = useState(0);
  const [trialStartTime, setTrialStartTime] = useState<number | null>(null);

  // Initialize from localStorage
  useEffect(() => {
    const subscriptionKey = getUserStorageKey(SUBSCRIPTION_KEY);
    const trialStartKey = getUserStorageKey(TRIAL_STARTED_KEY);
    
    const storedSubscription = localStorage.getItem(subscriptionKey);
    if (storedSubscription === "true") {
      setIsSubscribed(true);
    }

    // Initialize trial start time for new users
    let startTime = localStorage.getItem(trialStartKey);
    if (!startTime && !storedSubscription) {
      // First visit - set trial start time
      startTime = Date.now().toString();
      localStorage.setItem(trialStartKey, startTime);
    }
    if (startTime) {
      setTrialStartTime(parseInt(startTime));
    }

    // Count unique check-in days
    setUniqueCheckInDays(getUniqueCheckInDays());
  }, []);

  // Re-count when mood history might change (poll every few seconds for updates)
  useEffect(() => {
    const interval = setInterval(() => {
      setUniqueCheckInDays(getUniqueCheckInDays());
    }, 2000);
    
    return () => clearInterval(interval);
  }, []);

  const subscriptionDetails = useMemo(() => {
    if (isSubscribed) {
      return {
        status: "subscribed" as SubscriptionStatus,
        isTrialActive: false,
        isExpired: false,
        trialDaysRemaining: 0,
        trialDaysUsed: uniqueCheckInDays,
        maxAllowedConfidence: "Strong" as const,
        canGenerateNewPatterns: true,
      };
    }

    // Trial is based on calendar time from first visit (7 days)
    let trialDaysRemaining = TRIAL_DURATION_DAYS;
    let trialDaysUsed = 0;

    if (trialStartTime) {
      const now = Date.now();
      const millisecondsPerDay = 24 * 60 * 60 * 1000;
      const daysSinceStart = (now - trialStartTime) / millisecondsPerDay;
      
      trialDaysUsed = Math.floor(daysSinceStart);
      trialDaysRemaining = Math.max(0, TRIAL_DURATION_DAYS - trialDaysUsed);
    }

    const isTrialActive = trialDaysRemaining > 0;

    return {
      status: isTrialActive ? "trial" : "expired" as SubscriptionStatus,
      isTrialActive,
      isExpired: !isTrialActive,
      trialDaysRemaining,
      trialDaysUsed,
      // During trial: cap at Emerging. After trial (expired): cap at Emerging (no progression)
      // Note: Trial expiration is informational only - no loss framing
      maxAllowedConfidence: "Emerging" as const,
      // Can only generate new patterns during trial or when subscribed
      canGenerateNewPatterns: isTrialActive,
    };
  }, [isSubscribed, trialStartTime]);

  const subscribe = () => {
    // Placeholder: In real implementation, this would trigger payment flow
    const subscriptionKey = getUserStorageKey(SUBSCRIPTION_KEY);
    localStorage.setItem(subscriptionKey, "true");
    setIsSubscribed(true);
  };

  return {
    ...subscriptionDetails,
    isSubscribed,
    trialStartDate: null, // No longer time-based
    subscribe,
  };
};

// Helper to cap confidence based on subscription
export const capConfidence = (
  confidence: 'Exploratory' | 'Emerging' | 'Moderate' | 'Strong',
  maxAllowed: 'Exploratory' | 'Emerging' | 'Moderate' | 'Strong'
): 'Exploratory' | 'Emerging' | 'Moderate' | 'Strong' => {
  const order = ['Exploratory', 'Emerging', 'Moderate', 'Strong'];
  const confidenceIndex = order.indexOf(confidence);
  const maxIndex = order.indexOf(maxAllowed);
  
  if (confidenceIndex <= maxIndex) {
    return confidence;
  }
  return maxAllowed;
};
