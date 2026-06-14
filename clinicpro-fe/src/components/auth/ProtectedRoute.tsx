"use client";

import { ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, useHasPermission, useCanAccessRoute } from '@/lib/hooks/useAuth';
import { UserRole, PERMISSIONS } from '@/lib/types/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Shield, Lock, AlertTriangle } from 'lucide-react';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: UserRole;
  requiredPermissions?: string[];
  requiredRoute?: string;
  fallback?: ReactNode;
  showUnauthorizedPage?: boolean;
}

export function ProtectedRoute({
  children,
  requiredRole,
  requiredPermissions = [],
  requiredRoute,
  fallback,
  showUnauthorizedPage = true,
}: ProtectedRouteProps) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  // Check if user has required permissions
  const hasRequiredPermissions = requiredPermissions.every(permission => 
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useHasPermission(permission)
  );

  // Check if user can access required route
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const canAccessRequiredRoute = requiredRoute ? useCanAccessRoute(requiredRoute) : true;

  // Check if user has required role
  const hasRequiredRole = requiredRole ? user?.role === requiredRole : true;

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Check if user is authenticated
  if (!isAuthenticated) {
    if (fallback) {
      return <>{fallback}</>;
    }
    
    if (showUnauthorizedPage) {
      return <UnauthorizedPage message="Bạn cần đăng nhập để truy cập trang này" />;
    }
    
    router.push('/login');
    return null;
  }

  // Check role, permissions, and route access
  if (!hasRequiredRole || !hasRequiredPermissions || !canAccessRequiredRoute) {
    if (fallback) {
      return <>{fallback}</>;
    }

    if (showUnauthorizedPage) {
      return <UnauthorizedPage />;
    }

    router.push('/unauthorized');
    return null;
  }

  return <>{children}</>;
}

// Component for role-based protection
export function RoleProtectedRoute({
  children,
  role,
  ...props
}: Omit<ProtectedRouteProps, 'requiredRole'> & { role: UserRole }) {
  return (
    <ProtectedRoute requiredRole={role} {...props}>
      {children}
    </ProtectedRoute>
  );
}

// Component for permission-based protection
export function PermissionProtectedRoute({
  children,
  permission,
  ...props
}: Omit<ProtectedRouteProps, 'requiredPermissions'> & { permission: string }) {
  return (
    <ProtectedRoute requiredPermissions={[permission]} {...props}>
      {children}
    </ProtectedRoute>
  );
}

// Convenience components for specific roles
export function AdminOnly({ children, ...props }: Omit<ProtectedRouteProps, 'requiredRole'>) {
  return (
    <ProtectedRoute requiredRole="ADMIN" {...props}>
      {children}
    </ProtectedRoute>
  );
}

export function DoctorOnly({ children, ...props }: Omit<ProtectedRouteProps, 'requiredRole'>) {
  return (
    <ProtectedRoute requiredRole="DOCTOR" {...props}>
      {children}
    </ProtectedRoute>
  );
}

export function ReceptionistOnly({ children, ...props }: Omit<ProtectedRouteProps, 'requiredRole'>) {
  return (
    <ProtectedRoute requiredRole="RECEPTIONIST" {...props}>
      {children}
    </ProtectedRoute>
  );
}

export function PatientOnly({ children, ...props }: Omit<ProtectedRouteProps, 'requiredRole'>) {
  return (
    <ProtectedRoute requiredRole="PATIENT" {...props}>
      {children}
    </ProtectedRoute>
  );
}

// Convenience components for specific permissions
export function MedicalRecordsViewOnly({ children, ...props }: Omit<ProtectedRouteProps, 'requiredPermissions'>) {
  return (
    <ProtectedRoute requiredPermissions={[PERMISSIONS.MEDICAL_RECORDS_VIEW]} {...props}>
      {children}
    </ProtectedRoute>
  );
}

export function MedicalRecordsEditOnly({ children, ...props }: Omit<ProtectedRouteProps, 'requiredPermissions'>) {
  return (
    <ProtectedRoute requiredPermissions={[PERMISSIONS.MEDICAL_RECORDS_EDIT]} {...props}>
      {children}
    </ProtectedRoute>
  );
}

export function UsersManageOnly({ children, ...props }: Omit<ProtectedRouteProps, 'requiredPermissions'>) {
  return (
    <ProtectedRoute requiredPermissions={[PERMISSIONS.USERS_VIEW]} {...props}>
      {children}
    </ProtectedRoute>
  );
}

// Unauthorized page component
function UnauthorizedPage({ message = "Bạn không có quyền truy cập trang này" }: { message?: string }) {
  const router = useRouter();

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
            <Shield className="h-6 w-6 text-red-600" />
          </div>
          <CardTitle className="text-xl font-semibold text-gray-900">
            Truy cập bị từ chối
          </CardTitle>
          <CardDescription className="text-gray-600">
            {message}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Lock className="h-4 w-4" />
            <span>Trang này yêu cầu quyền truy cập đặc biệt</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <AlertTriangle className="h-4 w-4" />
            <span>Vui lòng liên hệ quản trị viên nếu bạn cần quyền truy cập</span>
          </div>
          <div className="flex gap-2 pt-4">
            <Button 
              variant="outline" 
              onClick={() => router.back()}
              className="flex-1"
            >
              Quay lại
            </Button>
            <Button 
              onClick={() => router.push('/')}
              className="flex-1"
            >
              Về trang chủ
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
