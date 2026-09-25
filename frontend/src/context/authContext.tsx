import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

export interface User {
  _id?: string;
  id?: string;
  name: string;
  email: string;
  role?: string;
  rewardPoints?: number;
  [key: string]: any;
}

export interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (user: User) => void;
  logout: () => Promise<void>;
  refreshUser: () => Promise<User | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);

  const refreshUser = async (): Promise<User | null> => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/profile/user`, {
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.data?.user) {
          const freshUser = data.data.user;
          const normalized: User = {
            ...freshUser,
            id: freshUser._id || freshUser.id,
            rewardPoints: Number(freshUser.rewardPoints) || 0,
          };
          setUser(normalized);
          localStorage.setItem("user", JSON.stringify(normalized));
          return normalized;
        }
      }
    } catch (err) {
      console.warn("Failed to refresh user profile:", err);
    }
    return null;
  };

  useEffect(() => {
    const storedUser = localStorage.getItem("user");

    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        setUser(parsed);
        // Refresh latest user data in the background (including latest reward points)
        refreshUser();
      } catch {
        localStorage.removeItem("user");
      }
    }

    const handlePointsUpdate = () => {
      refreshUser();
    };

    window.addEventListener("reward-points-updated", handlePointsUpdate);
    return () => {
      window.removeEventListener("reward-points-updated", handlePointsUpdate);
    };
  }, []);

  const login = (newUser: User) => {
    localStorage.setItem("user", JSON.stringify(newUser));
    setUser(newUser);
  };

  const logout = async () => {
    try {
      await fetch(`${API_BASE_URL}/api/auth/logout`, {
        method: "POST",
        credentials: "include",
      });
    } catch (err) {
      console.warn("Logout request failed:", err);
    } finally {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token: null,
        isAuthenticated: !!user,
        login,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
};
