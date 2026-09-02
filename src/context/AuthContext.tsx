import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, UserPrivileges, LoginCredentials, RegisterCredentials } from '../types';
import {
  api,
  setApiUserId,
  getApiUserId,
  setApiAuthToken,
  getApiAuthToken
} from '../api/client';

interface AuthContextType {
  currentUser: User | null;
  users: User[];
  isAdmin: boolean;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<User>;
  register: (credentials: RegisterCredentials) => Promise<User>;
  logout: () => Promise<void>;
  switchUser: (userId: string) => Promise<void>;
  refreshUsers: () => Promise<void>;
  updateUserProfile: (userId: string, data: Partial<User>) => Promise<User>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  hasPrivilege: (privilegeKey: keyof UserPrivileges) => boolean;
  hasRole: (role: 'admin' | 'basic') => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUserData = useCallback(async () => {
    try {
      setIsLoading(true);
      const allUsers = await api.getUsers();
      setUsers(allUsers);

      const token = getApiAuthToken();
      const storedUserId = getApiUserId();

      if (token) {
        try {
          const authMe = await api.getAuthMe();
          if (authMe?.user) {
            setCurrentUser(authMe.user);
            setApiUserId(authMe.user.id);
            return;
          }
        } catch {
          // Token expired or invalid
          setApiAuthToken('');
        }
      }

      // Check if stored user exists
      if (storedUserId) {
        const found = allUsers.find((u) => u.id === storedUserId);
        if (found) {
          setCurrentUser(found);
          return;
        }
      }

      // Fallback: pick first admin user or first active user
      if (allUsers.length > 0) {
        const defaultUser = allUsers.find((u) => u.role === 'admin') || allUsers[0];
        setCurrentUser(defaultUser);
        setApiUserId(defaultUser.id);
      } else {
        setCurrentUser(null);
      }
    } catch (err) {
      console.error('Failed to load user auth context:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

  const login = async (credentials: LoginCredentials): Promise<User> => {
    setIsLoading(true);
    try {
      const res = await api.login(credentials);
      setApiAuthToken(res.token);
      setApiUserId(res.user.id);
      setCurrentUser(res.user);
      await refreshUsers();
      return res.user;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (credentials: RegisterCredentials): Promise<User> => {
    setIsLoading(true);
    try {
      const res = await api.register(credentials);
      setApiAuthToken(res.token);
      setApiUserId(res.user.id);
      setCurrentUser(res.user);
      await refreshUsers();
      return res.user;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    setIsLoading(true);
    try {
      await api.logout();
    } catch {
      // Ignore network errors on logout
    } finally {
      setApiAuthToken('');
      setCurrentUser(null);
      setIsLoading(false);
    }
  };

  const switchUser = async (userId: string) => {
    try {
      setIsLoading(true);
      const res = await api.switchDemoUser(userId);
      setApiAuthToken(res.token);
      setApiUserId(res.user.id);
      setCurrentUser(res.user);
      await refreshUsers();
    } catch {
      setApiUserId(userId);
      const found = users.find((u) => u.id === userId);
      if (found) {
        setCurrentUser(found);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const refreshUsers = async () => {
    try {
      const allUsers = await api.getUsers();
      setUsers(allUsers);
    } catch (err) {
      console.error('Failed to refresh users:', err);
    }
  };

  const updateUserProfile = async (userId: string, data: Partial<User>): Promise<User> => {
    const updated = await api.updateUser(userId, data);
    setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, ...updated } : u)));
    if (currentUser?.id === userId) {
      setCurrentUser((prev) => (prev ? { ...prev, ...updated } : updated));
    }
    return updated;
  };

  const changePassword = async (currentPassword: string, newPassword: string) => {
    await api.changePassword({ currentPassword, newPassword });
  };

  const isAdmin = currentUser?.role === 'admin';
  const isAuthenticated = currentUser !== null;

  const hasPrivilege = (privilegeKey: keyof UserPrivileges): boolean => {
    if (!currentUser) return false;
    if (currentUser.role === 'admin') return true;
    return !!currentUser.privileges?.[privilegeKey];
  };

  const hasRole = (role: 'admin' | 'basic'): boolean => {
    if (!currentUser) return false;
    return currentUser.role === role;
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        users,
        isAdmin,
        isAuthenticated,
        isLoading,
        login,
        register,
        logout,
        switchUser,
        refreshUsers,
        updateUserProfile,
        changePassword,
        hasPrivilege,
        hasRole
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

