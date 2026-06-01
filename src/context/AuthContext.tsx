import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { api, getToken, setToken, clearToken, Profile } from '../lib/api';

interface AuthContextType {
  user: Profile | null;
  profile: Profile | null;
  loading: boolean;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      setLoading(false);
      return;
    }

    api.auth
      .me()
      .then((p) => setProfile(p))
      .catch(() => {
        clearToken();
        setProfile(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const signUp = async (email: string, password: string, fullName: string) => {
    try {
      // Create the account but do not auto-login; the user is sent to /login.
      await api.auth.signup({ email, password, full_name: fullName });
      return { error: null };
    } catch (err) {
      return { error: err as Error };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { token, profile } = await api.auth.login({ email, password });
      setToken(token);
      setProfile(profile);
      return { error: null };
    } catch (err) {
      return { error: err as Error };
    }
  };

  const signOut = async () => {
    clearToken();
    setProfile(null);
  };

  return (
    <AuthContext.Provider value={{ user: profile, profile, loading, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
