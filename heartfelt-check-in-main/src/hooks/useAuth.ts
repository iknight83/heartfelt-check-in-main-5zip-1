import { useState, useEffect, useCallback } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

const syncSubscriptionFromBackend = async (userId: string) => {
  try {
    const response = await fetch(`/api/paystack/subscription/${userId}`);
    if (!response.ok) return;
    
    const data = await response.json();
    const subscriptionKey = `deeper_insights_subscribed__${userId}`;
    const planKey = `subscription_plan__${userId}`;
    const expiresKey = `subscription_expires_at__${userId}`;
    const lifetimeKey = `subscription_is_lifetime__${userId}`;

    if (data.hasSubscription) {
      localStorage.setItem(subscriptionKey, "true");
      if (data.plan) localStorage.setItem(planKey, data.plan);
      if (data.expiresAt) localStorage.setItem(expiresKey, data.expiresAt);
      localStorage.setItem(lifetimeKey, data.isLifetime ? "true" : "false");
    } else if (data.status === "expired") {
      localStorage.setItem(subscriptionKey, "false");
    }
  } catch (error) {
    console.error("Failed to sync subscription on login:", error);
  }
};

// Migrate pending onboarding data to user-scoped keys
const migratePendingDataToUser = (userId: string) => {
  // Migrate pending tracked factors from onboarding (new format)
  const pendingOnboardingFactors = localStorage.getItem("pending_tracked_factors");
  if (pendingOnboardingFactors && !localStorage.getItem(`tracked_factors__${userId}`)) {
    localStorage.setItem(`tracked_factors__${userId}`, pendingOnboardingFactors);
    localStorage.removeItem("pending_tracked_factors");
  }
  
  // Migrate tracked factors (legacy format)
  const pendingFactors = localStorage.getItem("tracked_factors");
  if (pendingFactors && !localStorage.getItem(`tracked_factors__${userId}`)) {
    localStorage.setItem(`tracked_factors__${userId}`, pendingFactors);
    localStorage.removeItem("tracked_factors");
  }
  
  // Migrate daily factor counts
  const pendingCounts = localStorage.getItem("daily_factor_counts");
  if (pendingCounts && !localStorage.getItem(`daily_factor_counts__${userId}`)) {
    localStorage.setItem(`daily_factor_counts__${userId}`, pendingCounts);
    localStorage.removeItem("daily_factor_counts");
  }
  
  // Migrate mood history
  const pendingMoods = localStorage.getItem("mood_history");
  if (pendingMoods && !localStorage.getItem(`mood_history__${userId}`)) {
    localStorage.setItem(`mood_history__${userId}`, pendingMoods);
    localStorage.removeItem("mood_history");
  }
  
  // Migrate current mood
  const pendingCurrentMood = localStorage.getItem("current_mood");
  if (pendingCurrentMood && !localStorage.getItem(`current_mood__${userId}`)) {
    localStorage.setItem(`current_mood__${userId}`, pendingCurrentMood);
    localStorage.removeItem("current_mood");
  }
  
  // Migrate termsAcceptedAt
  const pendingTerms = localStorage.getItem("termsAcceptedAt");
  if (pendingTerms && !localStorage.getItem(`termsAcceptedAt__${userId}`)) {
    localStorage.setItem(`termsAcceptedAt__${userId}`, pendingTerms);
    localStorage.removeItem("termsAcceptedAt");
  }
  
  // Migrate trial started
  const pendingTrial = localStorage.getItem("trial_started_at");
  if (pendingTrial && !localStorage.getItem(`trial_started_at__${userId}`)) {
    localStorage.setItem(`trial_started_at__${userId}`, pendingTrial);
    localStorage.removeItem("trial_started_at");
  }
};

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        // Store user ID for data isolation
        if (session?.user?.id) {
          localStorage.setItem("current_user_id", session.user.id);
          // Migrate any pending data from before auth
          migratePendingDataToUser(session.user.id);
          // Sync subscription status from backend on login
          if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
            await syncSubscriptionFromBackend(session.user.id);
          }
        } else {
          localStorage.removeItem("current_user_id");
        }
        
        setLoading(false);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      // Store user ID for data isolation
      if (session?.user?.id) {
        localStorage.setItem("current_user_id", session.user.id);
        // Migrate any pending/legacy data to user-scoped keys
        migratePendingDataToUser(session.user.id);
        // Sync subscription status from backend for returning users
        await syncSubscriptionFromBackend(session.user.id);
      } else {
        localStorage.removeItem("current_user_id");
      }
      
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    const redirectUrl = `${window.location.origin}/home`;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: redirectUrl,
      },
    });
    return { error };
  };

  const signInWithApple = async () => {
    const redirectUrl = `${window.location.origin}/home`;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "apple",
      options: {
        redirectTo: redirectUrl,
      },
    });
    return { error };
  };

  const signInAnonymously = async () => {
    // Mark this as an anonymous session - the actual user ID will come from Supabase
    localStorage.setItem("anonymous_session_id", "pending");
    
    const { data, error } = await supabase.auth.signInAnonymously();
    
    // Once Supabase returns, update with the actual anonymous user ID
    if (data?.user?.id) {
      localStorage.setItem("anonymous_session_id", data.user.id);
      localStorage.setItem("current_user_id", data.user.id);
      
      // Migrate any pending onboarding data to the user-scoped keys
      migratePendingDataToUser(data.user.id);
    }
    
    return { error };
  };

  const signInWithEmail = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signUpWithEmail = async (email: string, password: string) => {
    const redirectUrl = `${window.location.origin}/home`;
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
      },
    });
    return { error };
  };

  const signOut = async () => {
    // Get current user ID before clearing anything
    const userId = localStorage.getItem("current_user_id");
    const isAnonymous = localStorage.getItem("anonymous_session_id");
    
    // For anonymous users: clear ALL data (intentional data loss)
    if (isAnonymous && userId) {
      // Clear anonymous-specific data
      localStorage.removeItem("tracked_factors__" + userId);
      localStorage.removeItem("daily_factor_counts__" + userId);
      localStorage.removeItem("mood_history__" + userId);
      localStorage.removeItem("current_mood__" + userId);
      localStorage.removeItem("termsAcceptedAt__" + userId);
      localStorage.removeItem("trial_started_at__" + userId);
      localStorage.removeItem("deeper_insights_subscribed__" + userId);
      localStorage.removeItem("anonymous_session_id");
      // Also clear global keys if they exist
      localStorage.removeItem("termsAcceptedAt");
    }
    
    // For email users: KEEP their termsAcceptedAt so they skip onboarding on return
    // Also KEEP their factor/mood data - only clear the session-related state
    // DON'T clear termsAcceptedAt for email users!
    
    const { error } = await supabase.auth.signOut();
    
    // Clear user ID after sign out
    localStorage.removeItem("current_user_id");
    
    return { error };
  };

  const resetPassword = async (email: string) => {
    const redirectUrl = `${window.location.origin}/reset-password`;
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: redirectUrl,
    });
    return { error };
  };

  const updatePassword = async (newPassword: string) => {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });
    return { error };
  };

  return {
    user,
    session,
    loading,
    signInWithGoogle,
    signInWithApple,
    signInAnonymously,
    signInWithEmail,
    signUpWithEmail,
    signOut,
    resetPassword,
    updatePassword,
  };
};
