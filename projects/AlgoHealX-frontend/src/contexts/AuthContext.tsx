import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface User {
  id: string;
  wallet_address: string;
  name: string;
  email: string;
  phone: string;
  role: 'producer' | 'regulator' | 'distributor';
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (walletAddress: string) => Promise<User | null>;
  logout: () => void;
  signup: (data: Omit<User, 'id'>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is already logged in (stored in localStorage)
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = async (walletAddress: string): Promise<User | null> => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('wallet_address', walletAddress)
        .single();

      if (error || !data) {
        return null;
      }

      const userData: User = {
        id: data.id,
        wallet_address: data.wallet_address,
        name: data.name,
        email: data.email,
        phone: data.phone,
        role: data.role as 'producer' | 'regulator' | 'distributor',
      };

      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));
      return userData;
    } catch (error) {
      console.error('Login error:', error);
      return null;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  const signup = async (data: Omit<User, 'id'>) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .insert([{
          wallet_address: data.wallet_address,
          name: data.name,
          email: data.email,
          phone: data.phone,
          role: data.role,
        }]);

      if (error) throw error;

      // Auto-login after signup
      await login(data.wallet_address);
    } catch (error) {
      console.error('Signup error:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, signup }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};