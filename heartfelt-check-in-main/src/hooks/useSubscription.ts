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

  // Initialize from localStorage
  useEffect(() => {
    const storedSubscription = localStorage.getItem(SUBSCRIPTION_KEY);
    if (storedSubscription === "true") {
      setIsSubscribed(true);
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

    // Trial is based on unique check-in days, not calendar time
    // Missing days do NOT reset progress or show warnings
    const trialDaysUsed = Math.min(uniqueCheckInDays, TRIAL_DURATION_DAYS);
    const trialDaysRemaining = Math.max(0, TRIAL_DURATION_DAYS - uniqueCheckInDays);
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
  }, [isSubscribed, uniqueCheckInDays]);

  const subscribe = () => {
    // Placeholder: In real implementation, this would trigger payment flow
    localStorage.setItem(SUBSCRIPTION_KEY, "true");
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
