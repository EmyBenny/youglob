import React, { createContext, useContext, useState } from 'react';
import type { UserProfile } from '../types/ecommerce';

export interface DesignGuestUser {
  uid: string;
  email: string;
  displayName: string;
  emailVerified: boolean;
}

interface AuthContextValue {
  user: DesignGuestUser;
  profile: UserProfile;
  authReady: boolean;
  isAdmin: boolean;
  authError: string | null;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  toggleWishlist: (productId: string) => Promise<void>;
  getIdToken: () => Promise<string | null>;
}

const WISHLIST_STORAGE_KEY = 'youglob_design_wishlist_v1';

const GUEST_USER: DesignGuestUser = {
  uid: 'youglob-preview-guest',
  email: 'customer@youglobtech.com',
  displayName: 'YouGlob Shopper',
  emailVerified: true,
};

function loadInitialWishlist(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(WISHLIST_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.map(String).slice(0, 50) : [];
  } catch {
    return [];
  }
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [wishlist, setWishlist] = useState<string[]>(() => loadInitialWishlist());

  const profile: UserProfile = {
    uid: GUEST_USER.uid,
    email: GUEST_USER.email,
    displayName: GUEST_USER.displayName,
    role: 'admin',
    wishlist,
  };

  const signInWithGoogle = async () => {
    // Authentication intentionally disabled during design phase
  };

  const logout = async () => {
    // Authentication intentionally disabled during design phase
  };

  const toggleWishlist = async (productId: string) => {
    setWishlist((prev) => {
      const exists = prev.includes(productId);
      const next = exists ? prev.filter((id) => id !== productId) : [...prev, productId].slice(0, 50);
      if (typeof window !== 'undefined') {
        try {
          window.localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(next));
        } catch {
          // Ignore storage quota issues
        }
      }
      return next;
    });
  };

  const getIdToken = async (): Promise<string | null> => null;

  return (
    <AuthContext.Provider
      value={{
        user: GUEST_USER,
        profile,
        authReady: true,
        isAdmin: true,
        authError: null,
        signInWithGoogle,
        logout,
        toggleWishlist,
        getIdToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return ctx;
}
