import { useState, useEffect, useMemo, useCallback } from "react";
import { getMoodHistory } from "./useMoodState";

export type SubscriptionStatus = "trial" | "expired" | "subscribed" | "loading";

interface SubscriptionAccess {
  hasAccess: boolean;
  plan: string | null;
  status: "active" | "expired" | "none";
  expiresAt: string | null;
  isLifetime: boolean;
}

interface UseSubscriptionResult {
  status: SubscriptionStatus;
  isTrialActive: boolean;
  isSubscribed: boolean;
  isExpired: boolean;
  isLoading: boolean;
  plan: string | null;
  expiresAt: Date | null;
  isLifetime: boolean;
  trialDaysRemaining: number;
  trialDaysUsed: number;
  trialStartDate: Date | null;
  maxAllowedConfidence: 'Exploratory' | 'Emerging' | 'Moderate' | 'Strong';
  canGenerateNewPatterns: boolean;
  subscribe: (plan?: "monthly" | "annual" | "lifetime") => void;
  checkAccess: () => Promise<boolean>;
  refreshSubscription: () => Promise<void>;
}

const TRIAL_DURATION_DAYS = 7;
const SUBSCRIPTION_KEY = "deeper_insights_subscribed";
const SUBSCRIPTION_PLAN_KEY = "subscription_plan";
const SUBSCRIPTION_ACTIVATED_KEY = "subscription_activated_at";
const SUBSCRIPTION_EXPIRES_KEY = "subscription_expires_at";
const SUBSCRIPTION_IS_LIFETIME_KEY = "subscription_is_lifetime";
const TRIAL_STARTED_KEY = "trial_started_at";

const getUserId = (): string | null => {
  try {
    return localStorage.getItem("current_user_id");
  } catch {
    return null;
  }
};

const getUserStorageKey = (baseKey: string): string => {
  const userId = getUserId();
  return userId ? `${baseKey}__${userId}` : baseKey;
};

const getUniqueCheckInDays = (): number => {
  const moodHistory = getMoodHistory();
  const uniqueDates = new Set<string>();
  
  moodHistory.forEach(entry => {
    const date = new Date(entry.timestamp);
    const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    uniqueDates.add(dateKey);
  });
  
  return uniqueDates.size;
};

export const useSubscription = (): UseSubscriptionResult => {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [plan, setPlan] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<Date | null>(null);
  const [isLifetime, setIsLifetime] = useState(false);
  const [uniqueCheckInDays, setUniqueCheckInDays] = useState(0);
  const [trialStartTime, setTrialStartTime] = useState<number | null>(null);
  const [backendChecked, setBackendChecked] = useState(false);

  const checkBackendSubscription = useCallback(async (): Promise<SubscriptionAccess | null> => {
    const userId = getUserId();
    if (!userId) return null;

    try {
      const response = await fetch(`/api/paystack/subscription/${userId}`);
      if (!response.ok) return null;
      
      const data = await response.json();
      return {
        hasAccess: data.hasSubscription,
        plan: data.plan || null,
        status: data.status || (data.hasSubscription ? "active" : "none"),
        expiresAt: data.expiresAt || null,
        isLifetime: data.isLifetime || false,
      };
    } catch (error) {
      console.error("Failed to check backend subscription:", error);
      return null;
    }
  }, []);

  const syncLocalStorage = useCallback((access: SubscriptionAccess) => {
    const subscriptionKey = getUserStorageKey(SUBSCRIPTION_KEY);
    const planKey = getUserStorageKey(SUBSCRIPTION_PLAN_KEY);
    const expiresKey = getUserStorageKey(SUBSCRIPTION_EXPIRES_KEY);
    const lifetimeKey = getUserStorageKey(SUBSCRIPTION_IS_LIFETIME_KEY);

    if (access.hasAccess) {
      localStorage.setItem(subscriptionKey, "true");
      if (access.plan) localStorage.setItem(planKey, access.plan);
      if (access.expiresAt) localStorage.setItem(expiresKey, access.expiresAt);
      localStorage.setItem(lifetimeKey, access.isLifetime ? "true" : "false");
    } else if (access.status === "expired") {
      localStorage.setItem(subscriptionKey, "false");
    }
  }, []);

  const refreshSubscription = useCallback(async () => {
    setIsLoading(true);
    const access = await checkBackendSubscription();
    
    if (access) {
      syncLocalStorage(access);
      setIsSubscribed(access.hasAccess);
      setPlan(access.plan);
      setExpiresAt(access.expiresAt ? new Date(access.expiresAt) : null);
      setIsLifetime(access.isLifetime);
    }
    
    setBackendChecked(true);
    setIsLoading(false);
  }, [checkBackendSubscription, syncLocalStorage]);

  useEffect(() => {
    const subscriptionKey = getUserStorageKey(SUBSCRIPTION_KEY);
    const planKey = getUserStorageKey(SUBSCRIPTION_PLAN_KEY);
    const expiresKey = getUserStorageKey(SUBSCRIPTION_EXPIRES_KEY);
    const lifetimeKey = getUserStorageKey(SUBSCRIPTION_IS_LIFETIME_KEY);
    const trialStartKey = getUserStorageKey(TRIAL_STARTED_KEY);
    
    const storedSubscription = localStorage.getItem(subscriptionKey);
    const storedPlan = localStorage.getItem(planKey);
    const storedExpires = localStorage.getItem(expiresKey);
    const storedLifetime = localStorage.getItem(lifetimeKey);
    
    if (storedSubscription === "true") {
      setIsSubscribed(true);
      setPlan(storedPlan);
      setExpiresAt(storedExpires ? new Date(storedExpires) : null);
      setIsLifetime(storedLifetime === "true");
    }

    let startTime = localStorage.getItem(trialStartKey);
    if (!startTime && storedSubscription !== "true") {
      startTime = Date.now().toString();
      localStorage.setItem(trialStartKey, startTime);
    }
    if (startTime) {
      setTrialStartTime(parseInt(startTime));
    }

    setUniqueCheckInDays(getUniqueCheckInDays());

    refreshSubscription();
  }, [refreshSubscription]);

  useEffect(() => {
    const interval = setInterval(() => {
      setUniqueCheckInDays(getUniqueCheckInDays());
    }, 2000);
    
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!backendChecked || isLifetime || !isSubscribed || !expiresAt) return;

    const now = new Date();
    if (expiresAt <= now) {
      setIsSubscribed(false);
      const subscriptionKey = getUserStorageKey(SUBSCRIPTION_KEY);
      localStorage.setItem(subscriptionKey, "false");
    }
  }, [backendChecked, isLifetime, isSubscribed, expiresAt]);

  const checkAccess = useCallback(async (): Promise<boolean> => {
    await refreshSubscription();
    return isSubscribed;
  }, [refreshSubscription, isSubscribed]);

  const subscriptionDetails = useMemo(() => {
    if (isLoading) {
      return {
        status: "loading" as SubscriptionStatus,
        isTrialActive: false,
        isExpired: false,
        trialDaysRemaining: 0,
        trialDaysUsed: 0,
        maxAllowedConfidence: "Emerging" as const,
        canGenerateNewPatterns: false,
      };
    }

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
      maxAllowedConfidence: "Emerging" as const,
      canGenerateNewPatterns: isTrialActive,
    };
  }, [isLoading, isSubscribed, trialStartTime, uniqueCheckInDays]);

  const subscribe = (planType?: "monthly" | "annual" | "lifetime") => {
    const subscriptionKey = getUserStorageKey(SUBSCRIPTION_KEY);
    const planKey = getUserStorageKey(SUBSCRIPTION_PLAN_KEY);
    const activatedKey = getUserStorageKey(SUBSCRIPTION_ACTIVATED_KEY);
    const lifetimeKey = getUserStorageKey(SUBSCRIPTION_IS_LIFETIME_KEY);
    
    localStorage.setItem(subscriptionKey, "true");
    if (planType) {
      localStorage.setItem(planKey, planType);
      localStorage.setItem(lifetimeKey, planType === "lifetime" ? "true" : "false");
    }
    localStorage.setItem(activatedKey, new Date().toISOString());
    setIsSubscribed(true);
    setPlan(planType || null);
    setIsLifetime(planType === "lifetime");
  };

  return {
    ...subscriptionDetails,
    isSubscribed,
    isLoading,
    plan,
    expiresAt,
    isLifetime,
    trialStartDate: trialStartTime ? new Date(trialStartTime) : null,
    subscribe,
    checkAccess,
    refreshSubscription,
  };
};

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
