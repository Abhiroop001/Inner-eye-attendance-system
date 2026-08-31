import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserAccount } from '../types/index.js';
import { apiRequest, setAccessToken, getAccessToken } from '../services/api.js';

interface AuthContextType {
  user: UserAccount | null;
  isLoading: boolean;
  login: (credentials: { usernameOrEmail: string; password: string }) => Promise<{ mfaRequired?: boolean; tempToken?: string; user?: UserAccount }>;
  verifyMfa: (params: { tempToken: string; code: string; isRecovery?: boolean }) => Promise<UserAccount>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserAccount | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchCurrentUser = async () => {
    const token = getAccessToken();
    if (!token) {
      setIsLoading(false);
      setUser(null);
      return;
    }

    try {
      const data = await apiRequest<{ account: UserAccount }>('/auth/me');
      if (data.account.role === 'HR') {
        setUser(data.account);
      } else {
        setUser(null);
      }
    } catch (error) {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  const login = async (credentials: { usernameOrEmail: string; password: string }) => {
    const data = await apiRequest<{
      accessToken?: string;
      user?: UserAccount;
      mfaRequired?: boolean;
      tempToken?: string;
    }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });

    if (data.mfaRequired && data.tempToken) {
      return { mfaRequired: true, tempToken: data.tempToken };
    }

    if (data.accessToken && data.user) {
      if (data.user.role !== 'HR') {
        throw new Error('Access denied. This console is restricted to HR Administrators.');
      }
      setAccessToken(data.accessToken);
      setUser(data.user);
      return { user: data.user };
    }

    return {};
  };

  const verifyMfa = async (params: { tempToken: string; code: string; isRecovery?: boolean }) => {
    const data = await apiRequest<{ accessToken: string; user: UserAccount }>('/auth/mfa/verify', {
      method: 'POST',
      body: JSON.stringify(params),
    });

    if (data.user.role !== 'HR') {
      throw new Error('Access denied. This console is restricted to HR Administrators.');
    }

    setAccessToken(data.accessToken);
    setUser(data.user);
    return data.user;
  };

  const logout = async () => {
    try {
      await apiRequest('/auth/logout', { method: 'POST' });
    } catch (e) {}
    setAccessToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        verifyMfa,
        logout,
        refreshProfile: fetchCurrentUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
