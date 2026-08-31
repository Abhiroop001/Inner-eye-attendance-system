import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserAccount, EmployeeProfile } from '../types/index.js';
import { apiRequest, setAccessToken, getAccessToken } from '../services/api.js';

interface AuthContextType {
  user: UserAccount | null;
  employeeProfile: EmployeeProfile | null;
  isLoading: boolean;
  login: (credentials: { usernameOrEmail: string; password: string }) => Promise<{ mfaRequired?: boolean; tempToken?: string; user?: UserAccount }>;
  verifyMfa: (params: { tempToken: string; code: string; isRecovery?: boolean }) => Promise<UserAccount>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserAccount | null>(null);
  const [employeeProfile, setEmployeeProfile] = useState<EmployeeProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchCurrentUser = async () => {
    const token = getAccessToken();
    if (!token) {
      setIsLoading(false);
      setUser(null);
      setEmployeeProfile(null);
      return;
    }

    try {
      const data = await apiRequest<{ account: UserAccount; employee?: EmployeeProfile }>('/auth/me');
      setUser(data.account);
      if (data.employee) {
        setEmployeeProfile(data.employee);
      }
    } catch (error) {
      setUser(null);
      setEmployeeProfile(null);
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
      setAccessToken(data.accessToken);
      setUser(data.user);
      await fetchCurrentUser();
      return { user: data.user };
    }

    return {};
  };

  const verifyMfa = async (params: { tempToken: string; code: string; isRecovery?: boolean }) => {
    const data = await apiRequest<{ accessToken: string; user: UserAccount }>('/auth/mfa/verify', {
      method: 'POST',
      body: JSON.stringify(params),
    });

    setAccessToken(data.accessToken);
    setUser(data.user);
    await fetchCurrentUser();
    return data.user;
  };

  const logout = async () => {
    try {
      await apiRequest('/auth/logout', { method: 'POST' });
    } catch (e) {}
    setAccessToken(null);
    setUser(null);
    setEmployeeProfile(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        employeeProfile,
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
