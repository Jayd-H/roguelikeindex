"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
  ReactNode,
} from "react";
import { LoginModal } from "@/components/ui/login-modal";

interface UserStats {
  favorites: number;
  owned: number;
  reviews: number;
}

interface User {
  id: string;
  email: string;
  name: string | null;
  stats: UserStats;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  openLoginModal: () => void;
  requireAuth: (action: () => void) => void;
  refreshUser: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const pendingActionRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        setUser(data.user);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [refreshTrigger]);

  useEffect(() => {
    if (user && pendingActionRef.current) {
      const action = pendingActionRef.current;
      pendingActionRef.current = null;
      action();
    }
  }, [user]);

  const openLoginModal = () => setIsModalOpen(true);

  const requireAuth = (action: () => void) => {
    if (user) {
      action();
    } else {
      pendingActionRef.current = action;
      openLoginModal();
    }
  };

  const refreshUser = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, openLoginModal, requireAuth, refreshUser }}
    >
      {children}
      <LoginModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          if (!user) pendingActionRef.current = null;
        }}
      />
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
