'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Settings, Brain, Loader2, FileText, ChevronLeft, ChevronRight } from 'lucide-react';
import { Template } from '@/lib/types/medical-record';
import { medicalRecordService } from '@/lib/services/medical-record.service';
import { toast } from 'sonner';
import { useAuth } from '@/lib/hooks/useAuth';
import { useRouter } from 'next/navigation';

export default function SystemSettingsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [updatingIds, setUpdatingIds] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(0);
  const [limit] = useState(10);
  // const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // Check if user is ADMIN
  useEffect(() => {
    if (user && user.role !== 'ADMIN') {
      toast.error('Bạn không có quyền truy cập trang này');
      router.push('/dashboard');
    }
  }, [user, router]);

  const loadTemplates = async () => {
    try {
      setIsLoading(true);
      const offset = currentPage * limit;
      const response = await medicalRecordService.getAllTemplates(limit, offset);
      const templatesData = Array.isArray(response.data) ? response.data : [];
      setTemplates(templatesData);
      
      if (response.meta) {
        // setTotal(response.meta.total || 0);
        setTotalPages(response.meta.totalPages || 0);
      }
    } catch (error) {
      console.error('Error loading templates:', error);
      toast.error('Có lỗi xảy ra khi tải danh sách template');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === 'ADMIN') {
      loadTemplates();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, currentPage]);

  const handleToggleAutoDiagnosis = async (templateId: string, currentValue: boolean) => {
    try {
      setUpdatingIds((prev) => new Set(prev).add(templateId));
      const updatedTemplate = await medicalRecordService.updateTemplateAutoDiagnosis(
        templateId,
        !currentValue
      );
      
      // Update local state
      setTemplates((prev) =>
        prev.map((t) => (t.id === templateId ? updatedTemplate : t))
      );
      
      toast.success(
        `Đã ${!currentValue ? 'bật' : 'tắt'} chuẩn đoán tự động cho template "${updatedTemplate.name}"`
      );
    } catch (error) {
      console.error('Error updating template:', error);
      toast.error('Có lỗi xảy ra khi cập nhật cấu hình');
    } finally {
      setUpdatingIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(templateId);
        return newSet;
      });
    }
  };

  if (user?.role !== 'ADMIN') {
    return null;
  }

  return (
    <div className="container mx-auto px-8 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Settings className="h-6 w-6" />
          Cài đặt hệ thống
        </h1>
        <p className="text-sm text-gray-600 mt-1">
          Quản lý cấu hình hệ thống
        </p>
      </div>

      <Card>
        <CardContent className="py-12">
          <div className="text-center">
            <Settings className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p className="text-gray-500">Tính năng đang được phát triển cho phiên bản tiếp theo.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
