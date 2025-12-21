import { useState, useEffect } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        // Store user ID for data isolation
        if (session?.user?.id) {
          localStorage.setItem("current_user_id", session.user.id);
        } else {
          localStorage.removeItem("current_user_id");
        }
        
        setLoading(false);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      // Store user ID for data isolation
      if (session?.user?.id) {
        localStorage.setItem("current_user_id", session.user.id);
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
    // Generate a unique anonymous session ID
    const anonymousId = `anon_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem("anonymous_session_id", anonymousId);
    localStorage.setItem("current_user_id", anonymousId);
    
    const { error } = await supabase.auth.signInAnonymously();
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
    // Check if this is an anonymous session
    const isAnonymous = localStorage.getItem("anonymous_session_id");
    
    // For anonymous users: clear ALL data (intentional data loss)
    if (isAnonymous) {
      const anonymousId = localStorage.getItem("anonymous_session_id");
      // Clear anonymous-specific data
      localStorage.removeItem("tracked_factors__" + anonymousId);
      localStorage.removeItem("daily_factor_counts__" + anonymousId);
      localStorage.removeItem("mood_history__" + anonymousId);
      localStorage.removeItem("anonymous_session_id");
    }
    
    // Clear onboarding state so user re-answers questions on next login
    localStorage.removeItem("termsAcceptedAt");
    
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
