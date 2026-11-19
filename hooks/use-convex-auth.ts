"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export function useAuth() {
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const router = useRouter();

  // Get current user from session
  const currentUser = useQuery(
    api.auth.getCurrentUser,
    sessionToken ? { sessionToken } : "skip"
  );

  useEffect(() => {
    // Get session token from localStorage or cookies
    const token = localStorage.getItem("sessionToken");
    setSessionToken(token);

    if (currentUser) {
      setUser(currentUser);
    } else if (token) {
      // Token exists but user not found, clear invalid token
      localStorage.removeItem("sessionToken");
      setSessionToken(null);
    }
  }, [currentUser]);

  const signIn = useMutation(api.auth.signIn);
  const signOut = useMutation(api.auth.signOut);

  const handleSignIn = async (email: string, password: string) => {
    try {
      const result = await signIn({ email, password });
      if (result.sessionToken) {
        localStorage.setItem("sessionToken", result.sessionToken);
        setSessionToken(result.sessionToken);
        router.push("/dashboard");
        return { success: true };
      }
      return { success: false, error: "Invalid credentials" };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Sign in failed",
      };
    }
  };

  const handleSignOut = async () => {
    if (sessionToken) {
      await signOut({ sessionToken });
      localStorage.removeItem("sessionToken");
      setSessionToken(null);
      setUser(null);
      router.push("/login");
    }
  };

  return {
    user,
    sessionToken,
    isAuthenticated: !!sessionToken && !!user,
    signIn: handleSignIn,
    signOut: handleSignOut,
  };
}

export function useCurrentUser() {
  const { user, sessionToken } = useAuth();
  return { user, sessionToken };
}
