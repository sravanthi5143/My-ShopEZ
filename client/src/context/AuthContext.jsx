import React, { createContext, useState, useEffect } from 'react';
import authService from '../services/authService';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load user session on startup
  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (error) {
        console.error('Failed to parse user session', error);
        localStorage.removeItem('user');
      }
    }
    setLoading(false);
  }, []);

  // Login handler
  const login = async (email, password) => {
    setLoading(true);
    console.log('[DEBUG-CONTEXT] Calling authService.login for:', email);
    try {
      const data = await authService.login({ email, password });
      console.log('[DEBUG-CONTEXT] authService.login succeeded. Storing user state in context.');
      setUser(data);
      return data;
    } catch (error) {
      console.error('[DEBUG-CONTEXT] authService.login error caught:', error);
      throw error.response?.data?.message || error.message || 'Login failed';
    } finally {
      console.log('[DEBUG-CONTEXT] Resetting loading state in context.');
      setLoading(false);
    }
  };

  // Register handler
  const register = async (name, email, password) => {
    setLoading(true);
    try {
      const data = await authService.register({ name, email, password });
      setUser(data);
      setLoading(false);
      return data;
    } catch (error) {
      setLoading(false);
      throw error.response?.data?.message || 'Registration failed';
    }
  };

  // Logout handler
  const logout = () => {
    authService.logout();
    setUser(null);
  };

  // Profile update helper
  const updateLocalUser = (updatedUserData) => {
    const currentUser = JSON.parse(localStorage.getItem('user')) || {};
    const newUser = { ...currentUser, ...updatedUserData };
    localStorage.setItem('user', JSON.stringify(newUser));
    setUser(newUser);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        updateLocalUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
