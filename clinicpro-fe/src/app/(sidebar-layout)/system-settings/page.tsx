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
          Quản lý cấu hình chuẩn đoán tự động cho các template bệnh án
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-purple-600" />
              Cấu hình chuẩn đoán tự động
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
              <span className="ml-2 text-gray-600">Đang tải...</span>
            </div>
          ) : templates.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p className="text-gray-600">Chưa có template nào</p>
            </div>
          ) : (
            <>
              <div className="space-y-4">
                {templates.map((template) => (
                  <div
                    key={template.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="font-medium text-gray-900">{template.name}</h3>
                        {template.isActive ? (
                          <Badge className="bg-green-100 text-green-800 text-xs">
                            Đang hoạt động
                          </Badge>
                        ) : (
                          <Badge className="bg-gray-100 text-gray-800 text-xs">
                            Không hoạt động
                          </Badge>
                        )}
                      </div>
                      <div className="text-sm text-gray-600 space-y-1">
                        <p>
                          <span className="font-medium">Mã template:</span> {template.templateCode}
                        </p>
                        {template.specialty && (
                          <p>
                            <span className="font-medium">Chuyên khoa:</span>{' '}
                            {template.specialty.name}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-4 ml-4">
                      <div className="flex items-center gap-2">
                        <Switch
                          id={`auto-diagnosis-${template.id}`}
                          checked={template.enableAutoDiagnosis ?? false}
                          onCheckedChange={() =>
                            handleToggleAutoDiagnosis(
                              template.id,
                              template.enableAutoDiagnosis ?? false
                            )
                          }
                          disabled={updatingIds.has(template.id) || !template.isActive}
                        />
                        <Label
                          htmlFor={`auto-diagnosis-${template.id}`}
                          className="text-sm font-medium cursor-pointer"
                        >
                          Chuẩn đoán tự động
                        </Label>
                      </div>
                      {updatingIds.has(template.id) && (
                        <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-6 pt-4 border-t">
                  <div className="text-sm text-gray-600">
                    Trang {currentPage + 1} / {totalPages}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(0)}
                      disabled={currentPage === 0 || isLoading}
                    >
                      Đầu
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((prev) => Math.max(0, prev - 1))}
                      disabled={currentPage === 0 || isLoading}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Trước
                    </Button>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum: number;
                        if (totalPages <= 5) {
                          pageNum = i;
                        } else if (currentPage < 3) {
                          pageNum = i;
                        } else if (currentPage > totalPages - 4) {
                          pageNum = totalPages - 5 + i;
                        } else {
                          pageNum = currentPage - 2 + i;
                        }
                        return (
                          <Button
                            key={pageNum}
                            variant={currentPage === pageNum ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setCurrentPage(pageNum)}
                            disabled={isLoading}
                            className="min-w-[40px]"
                          >
                            {pageNum + 1}
                          </Button>
                        );
                      })}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((prev) => Math.min(totalPages - 1, prev + 1))}
                      disabled={currentPage >= totalPages - 1 || isLoading}
                    >
                      Sau
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(totalPages - 1)}
                      disabled={currentPage >= totalPages - 1 || isLoading}
                    >
                      Cuối
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
