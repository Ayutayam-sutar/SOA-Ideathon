import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { authService } from '../services/authService';

export type ResourceType = 'cost_savings' | 'pricing' | 'full_contact' | 'cross_tenant_data' | 'admin_dashboard';

interface AuthContextType {
  user: User | null;
  role: UserRole | null;
  isLoading: boolean;
  hasAccess: (resourceType: ResourceType) => boolean;
  login: (email: string, password: string, role?: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  role: null,
  isLoading: true,
  hasAccess: () => false,
  login: async () => {},
  logout: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      try {
        const currentUser = await authService.me();
        setUser(currentUser);
      } catch (error) {
        console.error('Auth init failed:', error);
      } finally {
        setIsLoading(false);
      }
    };
    initAuth();
  }, []);

  const login = async (email: string, password: string, role?: string) => {
    const { user } = await authService.login(email, password, role);
    setUser(user);
  };

  const logout = async () => {
    await authService.logout();
    setUser(null);
  };

  const hasAccess = (resourceType: ResourceType) => {
    if (!user) return false;
    
    if (user.role === 'admin') {
      return true; // Admins have full visibility
    }
    
    if (user.role === 'business') {
      // Businesses can see costs for their own data, but not cross-tenant
      if (resourceType === 'cross_tenant_data') return false;
      if (resourceType === 'admin_dashboard') return false;
      return true; 
    }
    
    if (user.role === 'agent') {
      // Agents cannot see commercial pricing, cost savings, or full contact details (masked)
      if (resourceType === 'cost_savings') return false;
      if (resourceType === 'pricing') return false;
      if (resourceType === 'full_contact') return false;
      if (resourceType === 'cross_tenant_data') return false;
      if (resourceType === 'admin_dashboard') return false;
      return true;
    }
    
    return false;
  };

  return (
    <AuthContext.Provider value={{ user, role: user?.role as UserRole, isLoading, hasAccess, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
