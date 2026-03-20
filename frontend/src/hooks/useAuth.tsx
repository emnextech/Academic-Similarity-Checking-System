import {
  createContext,
  useContext,
  useEffect,
  useState,
  type PropsWithChildren
} from "react";
import type { User } from "../types";
import * as authService from "../services/authService";

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function hydrateSession() {
      if (!authService.getStoredToken()) {
        setIsLoading(false);
        return;
      }

      try {
        const me = await authService.fetchMe();
        setUser(me);
      } catch {
        authService.logout();
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    }

    void hydrateSession();
  }, []);

  const value: AuthContextType = {
    user,
    isLoading,
    login: async (email: string, password: string) => {
      const data = await authService.login(email, password);
      setUser(data.user);
    },
    logout: () => {
      authService.logout();
      setUser(null);
    }
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return context;
}
