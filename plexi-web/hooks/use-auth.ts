"use client";

import { useEffect, useState, useCallback } from "react";
import { getMe, loginWithGitHub, logout as apiLogout, OWNER_LOGIN, type AuthUser } from "@/lib/material-api";

interface UseAuthReturn {
  user: AuthUser | null;
  isOwner: boolean;
  isLoading: boolean;
  login: () => void;
  logout: () => Promise<void>;
}

export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUser = useCallback(async () => {
    setIsLoading(true);
    const me = await getMe();
    setUser(me);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const logout = useCallback(async () => {
    await apiLogout();
    setUser(null);
  }, []);

  return {
    user,
    isOwner: user?.login === OWNER_LOGIN,
    isLoading,
    login: loginWithGitHub,
    logout,
  };
}
