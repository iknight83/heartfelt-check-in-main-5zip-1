import { useState, useEffect, useMemo, useCallback } from "react";
import { getMoodHistory } from "./useMoodState";

export type SubscriptionStatus = "trial" | "expired" | "subscribed" | "loading";

interface SubscriptionAccess {
  hasAccess: boolean;
  hasSubscription: boolean;
  isPro: boolean;
  isPaid: boolean;
  planType: string | null;
  plan: string | null;
  status: "active" | "expired" | "none";
  expiresAt: string | null;
  isLifetime: boolean;
}

interface UseSubscriptionResult {
  status: SubscriptionStatus;
  isTrialActive: boolean;
  isSubscribed: boolean;
  isProActive: boolean;
  isExpired: boolean;
  isLoading: boolean;
  plan: string | null;
  expiresAt: Date | null;
  isLifetime: boolean;
  trialDaysRemaining: number;
  trialDaysUsed: number;
  trialStartDate: Date | null;
  hasEverUsedTrial: boolean | null;
  maxAllowedConfidence: 'Exploratory' | 'Emerging' | 'Moderate' | 'Strong';
  canGenerateNewPatterns: boolean;
  subscribe: (plan?: "monthly" | "annual" | "lifetime") => void;
  checkAccess: () => Promise<boolean>;
  refreshSubscription: (userIdOverride?: string) => Promise<void>;
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

export const useSubscription = (providedUserId?: string): UseSubscriptionResult => {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [plan, setPlan] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<Date | null>(null);
  const [isLifetime, setIsLifetime] = useState(false);
  const [uniqueCheckInDays, setUniqueCheckInDays] = useState(0);
  const [trialStartTime, setTrialStartTime] = useState<number | null>(null);
  const [hasEverUsedTrial, setHasEverUsedTrial] = useState<boolean | null>(null);
  const [backendChecked, setBackendChecked] = useState(false);
  const [lastCheckedUserId, setLastCheckedUserId] = useState<string | null>(null);

  const getEffectiveUserId = useCallback((): string | null => {
    return providedUserId || getUserId();
  }, [providedUserId]);

  const checkBackendSubscription = useCallback(async (userIdOverride?: string): Promise<SubscriptionAccess | null> => {
    const userId = userIdOverride || getEffectiveUserId();
    if (!userId) return null;

    try {
      const response = await fetch(`/api/paystack/subscription/${userId}`);
      if (!response.ok) return null;
      
      const data = await response.json();
      
      if (data.hasTrial) {
        setHasEverUsedTrial(true);
      } else {
        setHasEverUsedTrial(false);
      }
      
      if (data.isTrialActive && data.trialExpiresAt) {
        const trialExpiry = new Date(data.trialExpiresAt);
        const trialStartKey = `${TRIAL_STARTED_KEY}__${userId}`;
        const now = Date.now();
        const msRemaining = trialExpiry.getTime() - now;
        const trialStartTime = now - ((TRIAL_DURATION_DAYS * 24 * 60 * 60 * 1000) - msRemaining);
        localStorage.setItem(trialStartKey, trialStartTime.toString());
        setTrialStartTime(trialStartTime);
      }
      
      return {
        hasAccess: data.hasActiveAccess || data.hasSubscription || data.isTrialActive,
        hasSubscription: data.is_pro || data.hasSubscription || false,
        isPro: data.is_pro || false,
        isPaid: data.is_paid || false,
        planType: data.plan_type || null,
        plan: data.plan || null,
        status: data.status || (data.hasSubscription ? "active" : "none"),
        expiresAt: data.expiresAt || null,
        isLifetime: data.isLifetime || false,
      };
    } catch (error) {
      console.error("Failed to check backend subscription:", error);
      return null;
    }
  }, [getEffectiveUserId]);

  const syncLocalStorage = useCallback((access: SubscriptionAccess) => {
    const subscriptionKey = getUserStorageKey(SUBSCRIPTION_KEY);
    const planKey = getUserStorageKey(SUBSCRIPTION_PLAN_KEY);
    const expiresKey = getUserStorageKey(SUBSCRIPTION_EXPIRES_KEY);
    const lifetimeKey = getUserStorageKey(SUBSCRIPTION_IS_LIFETIME_KEY);

    if (access.hasSubscription) {
      localStorage.setItem(subscriptionKey, "true");
      if (access.plan) localStorage.setItem(planKey, access.plan);
      if (access.expiresAt) localStorage.setItem(expiresKey, access.expiresAt);
      localStorage.setItem(lifetimeKey, access.isLifetime ? "true" : "false");
    } else if (access.status === "expired") {
      localStorage.setItem(subscriptionKey, "false");
    }
  }, []);

  const refreshSubscription = useCallback(async (userIdOverride?: string) => {
    setIsLoading(true);
    const access = await checkBackendSubscription(userIdOverride);
    
    if (access) {
      syncLocalStorage(access);
      setIsSubscribed(access.hasSubscription);
      setPlan(access.plan);
      setExpiresAt(access.expiresAt ? new Date(access.expiresAt) : null);
      setIsLifetime(access.isLifetime);
    }
    
    setBackendChecked(true);
    setIsLoading(false);
  }, [checkBackendSubscription, syncLocalStorage]);

  useEffect(() => {
    const currentUserId = getEffectiveUserId();
    
    if (!currentUserId) {
      setIsLoading(false);
      setHasEverUsedTrial(false);
      setIsSubscribed(false);
      setPlan(null);
      setExpiresAt(null);
      setIsLifetime(false);
      setTrialStartTime(null);
      setBackendChecked(false);
      setLastCheckedUserId(null);
      return;
    }
    
    if (currentUserId !== lastCheckedUserId) {
      setLastCheckedUserId(currentUserId);
      setIsLoading(true);
      setBackendChecked(false);
      setHasEverUsedTrial(null);
    }
    
    const subscriptionKey = `${SUBSCRIPTION_KEY}__${currentUserId}`;
    const planKey = `${SUBSCRIPTION_PLAN_KEY}__${currentUserId}`;
    const expiresKey = `${SUBSCRIPTION_EXPIRES_KEY}__${currentUserId}`;
    const lifetimeKey = `${SUBSCRIPTION_IS_LIFETIME_KEY}__${currentUserId}`;
    const trialStartKey = `${TRIAL_STARTED_KEY}__${currentUserId}`;
    
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

    const startTime = localStorage.getItem(trialStartKey);
    if (startTime) {
      setTrialStartTime(parseInt(startTime));
    } else {
      setTrialStartTime(null);
    }

    setUniqueCheckInDays(getUniqueCheckInDays());

    refreshSubscription(currentUserId);
  }, [providedUserId, getEffectiveUserId, refreshSubscription, lastCheckedUserId]);

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
    const access = await checkBackendSubscription();
    if (access) {
      syncLocalStorage(access);
      setIsSubscribed(access.hasSubscription);
      setPlan(access.plan);
      setExpiresAt(access.expiresAt ? new Date(access.expiresAt) : null);
      setIsLifetime(access.isLifetime);
      setBackendChecked(true);
      return access.hasAccess;
    }
    return isSubscribed || (trialStartTime !== null && (() => {
      const now = Date.now();
      const millisecondsPerDay = 24 * 60 * 60 * 1000;
      const daysSinceStart = (now - trialStartTime) / millisecondsPerDay;
      return Math.max(0, TRIAL_DURATION_DAYS - Math.floor(daysSinceStart)) > 0;
    })());
  }, [checkBackendSubscription, syncLocalStorage, isSubscribed, trialStartTime]);

  const isProActive = useMemo(() => {
    if (!isSubscribed) return false;
    if (isLifetime) return true;
    if (!expiresAt) return false;
    const now = new Date();
    return expiresAt > now;
  }, [isSubscribed, isLifetime, expiresAt]);

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

    if (isProActive) {
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

    if (isSubscribed && !isProActive) {
      return {
        status: "expired" as SubscriptionStatus,
        isTrialActive: false,
        isExpired: true,
        trialDaysRemaining: 0,
        trialDaysUsed: uniqueCheckInDays,
        maxAllowedConfidence: "Emerging" as const,
        canGenerateNewPatterns: false,
      };
    }

    let trialDaysRemaining = 0;
    let trialDaysUsed = 0;
    let isTrialActive = false;

    if (trialStartTime) {
      const now = Date.now();
      const millisecondsPerDay = 24 * 60 * 60 * 1000;
      const daysSinceStart = (now - trialStartTime) / millisecondsPerDay;
      
      trialDaysUsed = Math.floor(daysSinceStart);
      trialDaysRemaining = Math.max(0, TRIAL_DURATION_DAYS - trialDaysUsed);
      isTrialActive = trialDaysRemaining > 0;
    }

    return {
      status: isTrialActive ? "trial" : "expired" as SubscriptionStatus,
      isTrialActive,
      isExpired: !isTrialActive,
      trialDaysRemaining,
      trialDaysUsed,
      maxAllowedConfidence: "Emerging" as const,
      canGenerateNewPatterns: isTrialActive,
    };
  }, [isLoading, isSubscribed, isProActive, trialStartTime, uniqueCheckInDays]);

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
    isProActive,
    isLoading,
    plan,
    expiresAt,
    isLifetime,
    hasEverUsedTrial,
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
