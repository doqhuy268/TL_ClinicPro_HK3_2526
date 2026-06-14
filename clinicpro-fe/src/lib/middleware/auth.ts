import { NextRequest, NextResponse } from 'next/server';
import { AuthUser, UserRole, ROUTE_ACCESS, ROUTE_PERMISSIONS, ROLE_PERMISSIONS, PermissionValue } from '../types/auth';

export interface AuthContext {
  user: AuthUser | null;
  isAuthenticated: boolean;
  hasPermission: (permission: string) => boolean;
  hasRole: (role: UserRole) => boolean;
  canAccessRoute: (route: string) => boolean;
}

class AuthMiddleware {
  private static instance: AuthMiddleware;
  private currentUser: AuthUser | null = null;

  private constructor() {}

  public static getInstance(): AuthMiddleware {
    if (!AuthMiddleware.instance) {
      AuthMiddleware.instance = new AuthMiddleware();
    }
    return AuthMiddleware.instance;
  }

  /**
   * Get current user from localStorage (client-side) or session (server-side)
   */
  private async getCurrentUser(): Promise<AuthUser | null> {
    if (typeof window !== 'undefined') {
      // Client-side: get from localStorage
      const userStr = localStorage.getItem('auth_user');
      const token = localStorage.getItem('auth_token');
      
      if (!userStr || !token) {
        return null;
      }

      try {
        const user = JSON.parse(userStr) as AuthUser;
        // Verify token is still valid
        if (this.isTokenValid(token)) {
          return user;
        }
        return null;
      } catch (error) {
        console.error('Error parsing user from localStorage:', error);
        return null;
      }
    }
    
    // Server-side: would need to implement session handling
    return null;
  }

  /**
   * Check if token is valid (basic validation)
   */
  private isTokenValid(token: string): boolean {
    try {
      // Basic JWT validation - decode base64url safely
      const base64Url = token.split('.')[1];
      if (!base64Url) return false;
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const padded = base64.padEnd(base64.length + (4 - (base64.length % 4)) % 4, '=');
      const json = typeof window !== 'undefined'
        ? atob(padded)
        : Buffer.from(padded, 'base64').toString('utf-8');
      const payload = JSON.parse(json);
      const currentTime = Math.floor(Date.now() / 1000);
      
      return payload.exp > currentTime;
    } catch (error) {
      console.error('Error parsing token:', error);
      return false;
    }
  }

  /**
   * Check if user has specific permission
   */
  public hasPermission(user: AuthUser | null, permission: string): boolean {
    if (!user) return false;
    
    const userPermissions = ROLE_PERMISSIONS[user.role] || [];
    return userPermissions.includes(permission as PermissionValue);
  }

  /**
   * Check if user has specific role
   */
  public hasRole(user: AuthUser | null, role: UserRole): boolean {
    if (!user) return false;
    return user.role === role;
  }

  /**
   * Check if user can access specific route
   */
  public canAccessRoute(user: AuthUser | null, route: string): boolean {
    if (!user) return false;

    // Check role-based access
    const allowedRoles = ROUTE_ACCESS[route];
    if (allowedRoles && !allowedRoles.includes(user.role)) {
      return false;
    }

    // Check permission-based access
    const requiredPermissions = ROUTE_PERMISSIONS[route];
    if (requiredPermissions && requiredPermissions.length > 0) {
      return requiredPermissions.every(permission => 
        this.hasPermission(user, permission)
      );
    }

    return true;
  }

  /**
   * Middleware function for Next.js
   */
  public async middleware(_request: NextRequest): Promise<NextResponse | null> {
    void _request;
    // Skip all redirects here to avoid SSR/localStorage mismatch.
    // Client-side will enforce auth via useAuth provider.
    return null;
  }

  /**
   * Check if route is public (no auth required)
   */
  private isPublicRoute(pathname: string): boolean {
    const publicRoutes = [
      '/login',
      '/register',
      '/forgot-password',
      '/reset-password',
      '/api/auth',
      '/api/register',
      '/_next',
      '/favicon.ico',
    ];

    return publicRoutes.some(route => pathname.startsWith(route));
  }

  /**
   * Check if route requires authentication
   */
  private requiresAuth(pathname: string): boolean {
    // All routes except public ones require authentication
    return !this.isPublicRoute(pathname);
  }

  /**
   * Get auth context for client-side use
   */
  public async getAuthContext(): Promise<AuthContext> {
    const user = await this.getCurrentUser();
    
    return {
      user,
      isAuthenticated: !!user,
      hasPermission: (permission: string) => this.hasPermission(user, permission),
      hasRole: (role: UserRole) => this.hasRole(user, role),
      canAccessRoute: (route: string) => this.canAccessRoute(user, route),
    };
  }

  /**
   * Set current user (for client-side)
   */
  public setCurrentUser(user: AuthUser | null): void {
    this.currentUser = user;
  }

  /**
   * Get current user (for client-side)
   */
  public getCurrentUserSync(): AuthUser | null {
    return this.currentUser;
  }

  /**
   * Logout user
   */
  public logout(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
      localStorage.removeItem('refresh_token');
    }
    this.currentUser = null;
  }
}

export const authMiddleware = AuthMiddleware.getInstance();

// Export middleware function for Next.js
export function middleware(request: NextRequest): Promise<NextResponse | null> {
  return authMiddleware.middleware(request);
}

// Configure which routes to run middleware on
// Route matcher config must be exported from the root middleware file.
