'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield } from 'lucide-react';
import { useAuth } from '@/lib/hooks/useAuth';
import { UserManagement } from '@/components/user-management/UserManagement';

export default function UsersPage() {
  const { user, isAuthenticated, isLoading, hasRole } = useAuth();

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <span className="ml-2">Đang tải...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto px-8 py-6 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-red-500" />
              Yêu cầu đăng nhập
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">
              Vui lòng đăng nhập để truy cập hệ thống quản lý người dùng.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isAdmin = hasRole('ADMIN');
  const isReceptionist = hasRole('RECEPTIONIST');

  if (!isAdmin && !isReceptionist) {
    return (
      <div className="container mx-auto px-8 py-6 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-red-500" />
              Không có quyền truy cập
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">
              Chỉ quản trị viên và lễ tân mới có quyền truy cập hệ thống quản lý người dùng.
            </p>
            <p className="text-sm text-gray-500">
              Vai trò hiện tại: {user?.role || 'Không xác định'}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-8 py-6 space-y-6 bg-white">
      <UserManagement onlyPatients={true} />
    </div>
  );
}
