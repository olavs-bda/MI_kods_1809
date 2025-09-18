"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { supabase, getCurrentUser } from "./supabase";

const AuthContext = createContext({
  user: null,
  isLoading: true,
  signIn: async () => {},
  signUp: async () => {},
  signOut: async () => {},
  resetPassword: async () => {},
});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      const { user, error } = await getCurrentUser();
      setUser(user);
      setIsLoading(false);
    };

    fetchUser();

    // Set up auth state listener
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth state changed:", event, session?.user?.email);

      if (session?.user) {
        setUser(session.user);

        // Handle automatic redirect after email confirmation
        if (event === "SIGNED_IN" && typeof window !== "undefined") {
          const currentPath = window.location.pathname;
          if (currentPath === "/login" || currentPath === "/") {
            // Check if this is a new user by looking at user metadata
            const isNewUser =
              session.user.user_metadata?.new_user ||
              new Date(session.user.created_at) > new Date(Date.now() - 60000); // Created in last minute

            setTimeout(() => {
              window.location.href = isNewUser ? "/onboarding" : "/dashboard";
            }, 1000);
          }
        }
      } else {
        setUser(null);
      }
      setIsLoading(false);
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  const value = {
    user,
    isLoading,
    signIn: async (email, password) => {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      return { data, error };
    },
    signUp: async (email, password) => {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });
      return { data, error };
    },
    signOut: async () => {
      const { error } = await supabase.auth.signOut();
      return { error };
    },
    resetPassword: async (email) => {
      const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      return { data, error };
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  return useContext(AuthContext);
};
