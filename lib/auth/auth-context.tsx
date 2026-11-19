"use client";

import type React from "react";
import { createContext, useContext, useEffect, useState } from "react";
import { useAuthActions } from "@convex-dev/auth/react";
import type { User, Tenant } from "../types/database";
import { useConvexAuth } from "convex/react";
import { useRouter } from "next/navigation"; // Import the router

interface AuthContextType {
  user: User | null;
  tenant: Tenant | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (
    email: string,
    password: string,
    name: string,
    tenantData?: { name: string; slug: string }
  ) => Promise<void>;
  logout: () => void;
  hasPermission: (permission: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);
  const { signIn, signOut } = useAuthActions();
  const { isAuthenticated } = useConvexAuth();
  const router = useRouter(); // Initialize the router

  // For now, we'll set user and tenant to null since we need to implement
  // user data fetching with the new auth system
  const user = null;
  const tenant = null;

  useEffect(() => {
    // Set loading to false once we have the auth status
    setIsLoading(false);
  }, [isAuthenticated]);

  const login = async (email: string, password: string) => {
    try {
      await signIn("password", { email, password, flow: "signIn" });
    } catch (error) {
      console.error("Login failed:", error);
      throw new Error("Login failed");
    }
  };

  const register = async (
    email: string,
    password: string,
    name: string,
    tenantData?: { name: string; slug: string }
  ) => {
    try {
      await signIn("password", {
        email,
        password,
        name,
        flow: "signUp",
        // Additional data for tenant creation can be passed here
        ...(tenantData && { tenantData }),
      });
      // Redirect to the login page after successful registration
      router.push("/login");
    } catch (error) {
      console.error("Registration failed:", error);
      throw new Error("Registration failed");
    }
  };

  const logout = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const hasPermission = (permission: string): boolean => {
    if (!user) return false;

    // Import permission checking logic
    const { hasPermission: checkPermission } = require("./permissions");
    return checkPermission((user as any).role, permission);
  };

  const value = {
    user,
    tenant,
    isLoading,
    isAuthenticated,
    login,
    register,
    logout,
    hasPermission,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
