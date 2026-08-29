import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { api, setApiUserId, getApiUserId } from '../api/client';

interface AuthContextType {
  currentUser: User | null;
  users: User[];
  isAdmin: boolean;
  isLoading: boolean;
  switchUser: (userId: string) => Promise<void>;
  refreshUsers: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUserData = async (userIdToSelect?: string) => {
    try {
      setIsLoading(true);
      if (userIdToSelect) {
        setApiUserId(userIdToSelect);
      }
      const [allUsers, me] = await Promise.all([
        api.getUsers(),
        api.getCurrentUser()
      ]);
      setUsers(allUsers);
      setCurrentUser(me);
    } catch (err) {
      console.error('Failed to load user auth context:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUserData(getApiUserId());
  }, []);

  const switchUser = async (userId: string) => {
    await fetchUserData(userId);
  };

  const refreshUsers = async () => {
    try {
      const allUsers = await api.getUsers();
      setUsers(allUsers);
    } catch (err) {
      console.error('Failed to refresh users:', err);
    }
  };

  const isAdmin = currentUser?.role === 'admin';

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        users,
        isAdmin,
        isLoading,
        switchUser,
        refreshUsers
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
