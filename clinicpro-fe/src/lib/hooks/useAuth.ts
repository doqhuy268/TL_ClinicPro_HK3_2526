"use client";

import React, { useState, useEffect, createContext, useContext, ReactNode, useCallback } from 'react';
import { AuthUser, AuthState, LoginCredentials, AuthResponse, UserRole } from '../types/auth';
import { authMiddleware, AuthContext as MiddlewareAuthContext } from '../middleware/auth';
import { authApi, userApi } from '../api';
import api from '../config';

// Safe localStorage utility for SSR
const safeLocalStorage = {
  getItem: (key: string): string | null => {
    if (typeof window === 'undefined') return null;
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  setItem: (key: string, value: string): void => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(key, value);
    } catch {
      // Ignore errors (e.g., when storage is full or disabled)
    }
  },
  removeItem: (key: string): void => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.removeItem(key);
    } catch {
      // Ignore errors
    }
  }
};

// Safe date formatting utility for SSR
// const safeDateFormat = {
//   toLocaleDateString: (date: Date, locale: string = 'vi-VN'): string => {
//     if (typeof window === 'undefined') {
//       // On server, return a consistent format
//       return date.toISOString().split('T')[0];
//     }
//     return date.toLocaleDateString(locale);
//   },
//   toLocaleString: (date: Date, locale: string = 'vi-VN', options?: Intl.DateTimeFormatOptions): string => {
//     if (typeof window === 'undefined') {
//       // On server, return a consistent format
//       return date.toISOString();
//     }
//     return date.toLocaleString(locale, options);
//   }
// };

interface AuthContextValue extends MiddlewareAuthContext {
  login: (credentials: LoginCredentials) => Promise<boolean>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<boolean>;
  updateProfile: (data: Partial<AuthUser>) => Promise<boolean>;
  updateAvatar: (avatarUrl: string) => Promise<boolean>;
  reloadAuth: () => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: true,
  });
  const [error, setError] = useState<string | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const initializeAuth = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true }));
      
      // Get auth context from middleware
      const authContext = await authMiddleware.getAuthContext();
      
      if (authContext.isAuthenticated) {
        const existingToken = safeLocalStorage.getItem('auth_token');
        
        if (existingToken) {
          // Set authorization header
          api.defaults.headers.common.Authorization = `Bearer ${existingToken}`;
          
          // Always fetch full user data from /me endpoint to ensure we have complete info
          // (including doctor/receptionist/admin details like doctorCode)
          try {
            const meResponse = await authApi.getMe();
            const fullUserData = meResponse.data as AuthUser;
            
            // Update stored user data with complete information
            safeLocalStorage.setItem('auth_user', JSON.stringify(fullUserData));
            
            // Update state with complete user data
            setState({
              user: fullUserData,
              token: existingToken,
              isAuthenticated: true,
              isLoading: false,
            });
            
            // Update middleware cache with complete user data
            authMiddleware.setCurrentUser(fullUserData);
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          } catch (meError: any) {
            console.error('Error fetching user data from /me:', meError);
            
            // If /me returns 401 (Unauthorized), token is invalid/expired
            // Clear auth and require user to login again
            if (meError?.response?.status === 401) {
              console.log('Token expired or invalid, clearing auth state');
              // Clear all auth data
              safeLocalStorage.removeItem('auth_token');
              safeLocalStorage.removeItem('auth_user');
              safeLocalStorage.removeItem('refresh_token');
              delete api.defaults.headers.common.Authorization;
              authMiddleware.logout();
              
              setState({
                user: null,
                token: null,
                isAuthenticated: false,
                isLoading: false,
              });
            } else {
              // For other errors, fallback to cached user data if available
              // This handles network errors or temporary API issues
              if (authContext.user) {
                console.warn('Using cached user data due to /me error');
                setState({
                  user: authContext.user,
                  token: existingToken,
                  isAuthenticated: true,
                  isLoading: false,
                });
                authMiddleware.setCurrentUser(authContext.user);
              } else {
                // If no cached user and /me fails, clear auth
                setState({
                  user: null,
                  token: null,
                  isAuthenticated: false,
                  isLoading: false,
                });
              }
            }
          }
        } else {
          // No token, clear auth state
          setState({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
          });
        }
      } else {
        setState({
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false,
        });
      }
    } catch (error) {
      console.error('Error initializing auth:', error);
      setState({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  }, []);

  // Initialize auth state on mount
  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  const login = async (credentials: LoginCredentials): Promise<boolean> => {
    try {
      setError(null);
      setState(prev => ({ ...prev, isLoading: true }));

      const response = await authApi.login(credentials);
      const data = response.data as unknown as Partial<AuthResponse> & { accessToken?: string };

      // Normalize tokens
      const token = (data as { token?: string; accessToken?: string }).token || data.accessToken || null;
      const refreshToken = (data as { refreshToken?: string }).refreshToken || null;
      if (!token) throw new Error('Token is missing in login response');

      safeLocalStorage.setItem('auth_token', token);
      if (refreshToken) safeLocalStorage.setItem('refresh_token', refreshToken);

      // Ensure axios instance sends Authorization header immediately (including this tab/session)
      api.defaults.headers.common.Authorization = `Bearer ${token}`;

      // Always fetch full user data from /me endpoint to ensure we have complete info
      // (including doctor/receptionist/admin details like doctorCode)
      let user: AuthUser | null = null;
      try {
        const meResponse = await authApi.getMe();
        user = meResponse.data as AuthUser;
      } catch (meError) {
        console.error('Failed to fetch current user from /me after login:', meError);
        // Fallback to user from login response if /me fails
        user = (data as { user?: AuthUser }).user as AuthUser | undefined || null;
      }

      if (user) {
        // Store complete user data with all role-specific information
        safeLocalStorage.setItem('auth_user', JSON.stringify(user));
        // Update middleware cache with complete user data
        authMiddleware.setCurrentUser(user);
      } else {
        throw new Error('Unable to fetch user data after login');
      }

      // Update state with complete user data
      setState({
        user,
        token,
        isAuthenticated: true,
        isLoading: false,
      });

      return true;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || error?.message || 'Đăng nhập thất bại';
      setError(errorMessage);
      setState(prev => ({ ...prev, isLoading: false }));
      return false;
    }
  };

  const logout = async (): Promise<void> => {
    // Prevent multiple simultaneous logout calls
    if (isLoggingOut) {
      console.warn('Logout already in progress');
      return;
    }

    setIsLoggingOut(true);
    
    try {
      // First, try to call logout API with timeout to prevent hanging
      // This must be done BEFORE clearing the token, so the API call has the Authorization header
      try {
        const logoutPromise = authApi.logout();
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Logout timeout')), 5000)
        );
        
        await Promise.race([logoutPromise, timeoutPromise]);
      } catch (apiError) {
        // Log error but continue with local cleanup even if API call fails
        console.error('Error calling logout API (non-blocking):', apiError);
      }
      
      // After API call (success or failure), clear local state
      // Clear local storage items
      safeLocalStorage.removeItem('auth_token');
      safeLocalStorage.removeItem('auth_user');
      safeLocalStorage.removeItem('refresh_token');
      
      // Clear middleware cache
      authMiddleware.logout();
      
      // Remove default Authorization header
      delete api.defaults.headers.common.Authorization;
      
      // Clear state
      setState({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
      });
      
      setError(null);
    } catch (error) {
      console.error('Unexpected error during logout:', error);
      // Ensure cleanup even if something unexpected happens
      safeLocalStorage.removeItem('auth_token');
      safeLocalStorage.removeItem('auth_user');
      safeLocalStorage.removeItem('refresh_token');
      authMiddleware.logout();
      delete api.defaults.headers.common.Authorization;
      setState({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
      });
    } finally {
      setIsLoggingOut(false);
    }
  };

  const refreshToken = async (): Promise<boolean> => {
    try {
      const refreshToken = safeLocalStorage.getItem('refresh_token');
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await authApi.refreshToken({ refreshToken });
      const authData: AuthResponse = response.data;

      // Update stored tokens
      safeLocalStorage.setItem('auth_token', authData.token);
      safeLocalStorage.setItem('refresh_token', authData.refreshToken);
      
      // Set authorization header with new token
      api.defaults.headers.common.Authorization = `Bearer ${authData.token}`;

      // Always fetch full user data from /me endpoint to ensure we have complete info
      // (including doctor/receptionist/admin details like doctorCode)
      let fullUserData: AuthUser;
      try {
        const meResponse = await authApi.getMe();
        fullUserData = meResponse.data as AuthUser;
      } catch (meError) {
        console.error('Failed to fetch user data from /me after token refresh:', meError);
        // Fallback to user from refresh token response if /me fails
        fullUserData = authData.user;
      }

      // Update stored user data with complete information
      safeLocalStorage.setItem('auth_user', JSON.stringify(fullUserData));

      // Update state with complete user data
      setState(prev => ({
        ...prev,
        user: fullUserData,
        token: authData.token,
      }));

      // Update middleware with complete user data
      authMiddleware.setCurrentUser(fullUserData);

      return true;
    } catch (error) {
      console.error('Error refreshing token:', error);
      await logout();
      return false;
    }
  };

  const updateProfile = async (data: Partial<AuthUser>): Promise<boolean> => {
    try {
      setError(null);
      
      const response = await userApi.updateProfile(data);
      const updatedUser = response.data;

      // Update stored user data
      safeLocalStorage.setItem('auth_user', JSON.stringify(updatedUser));

      // Update state
      setState(prev => ({
        ...prev,
        user: updatedUser,
      }));

      // Update middleware
      authMiddleware.setCurrentUser(updatedUser);

      return true;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Cập nhật thông tin thất bại';
      setError(errorMessage);
      return false;
    }
  };

  const updateAvatar = async (avatarUrl: string): Promise<boolean> => {
    try {
      setError(null);
      
      // Update user data with new avatar URL
      const updatedUser = { ...state.user, avatar: avatarUrl } as AuthUser;

      // Update stored user data
      safeLocalStorage.setItem('auth_user', JSON.stringify(updatedUser));

      // Update state
      setState(prev => ({
        ...prev,
        user: updatedUser,
      }));

      // Update middleware
      authMiddleware.setCurrentUser(updatedUser);

      return true;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Cập nhật avatar thất bại';
      setError(errorMessage);
      return false;
    }
  };

  const hasPermission = (permission: string): boolean => {
    return authMiddleware.hasPermission(state.user, permission);
  };

  const hasRole = (role: UserRole): boolean => {
    return authMiddleware.hasRole(state.user, role);
  };

  const canAccessRoute = (route: string): boolean => {
    return authMiddleware.canAccessRoute(state.user, route);
  };

  const value: AuthContextValue = {
    user: state.user,
    isAuthenticated: state.isAuthenticated,
    hasPermission,
    hasRole,
    canAccessRoute,
    login,
    logout,
    refreshToken,
    updateProfile,
    updateAvatar,
    reloadAuth: initializeAuth,
    isLoading: state.isLoading,
    error,
  };

  return React.createElement(AuthContext.Provider, { value }, children);
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Convenience hooks for specific roles
export function useIsAdmin() {
  const { hasRole } = useAuth();
  return hasRole('ADMIN');
}

export function useIsDoctor() {
  const { hasRole } = useAuth();
  return hasRole('DOCTOR');
}

export function useIsReceptionist() {
  const { hasRole } = useAuth();
  return hasRole('RECEPTIONIST');
}

export function useIsTechnician() {
  const { hasRole } = useAuth();
  return hasRole('TECHNICIAN');
}

export function useIsPatient() {
  const { hasRole } = useAuth();
  return hasRole('PATIENT');
}

// Permission hooks
export function useHasPermission(permission: string) {
  const { hasPermission } = useAuth();
  return hasPermission(permission);
}

export function useCanAccessRoute(route: string) {
  const { canAccessRoute } = useAuth();
  return canAccessRoute(route);
}
