'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { 
  Calendar, 
  Phone, 
  Clock, 
  Stethoscope,
  Eye,
  History,
  Loader2,
  ChevronLeft,
  ChevronRight,
  FileText
} from 'lucide-react';
import { appointmentBookingService, PatientAppointment } from '@/lib/services/appointment-booking.service';
import { toast } from 'sonner';
import { useAuth } from '@/lib/hooks/useAuth';

export default function MyAppointmentsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<PatientAppointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [limit] = useState(10);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [selectedAppointment, setSelectedAppointment] = useState<PatientAppointment | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);

  const loadAppointments = async () => {
    try {
      setIsLoading(true);
      const offset = currentPage * limit;
      const response = await appointmentBookingService.getDoctorMyAppointments(limit, offset);
      setAppointments(response.appointments);
      setTotal(response.meta.total);
      setTotalPages(response.meta.totalPages);
    } catch (error) {
      console.error('Error loading appointments:', error);
      toast.error('Có lỗi xảy ra khi tải danh sách lịch hẹn');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === 'DOCTOR') {
      loadAppointments();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, currentPage]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-green-100 text-green-800';
      case 'CONFIRMED':
        return 'bg-blue-100 text-blue-800';
      case 'COMPLETED':
        return 'bg-green-100 text-green-800';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'Đặt thành công';
      case 'CONFIRMED':
        return 'Đã xác nhận';
      case 'COMPLETED':
        return 'Hoàn thành';
      case 'CANCELLED':
        return 'Đã hủy';
      default:
        return status;
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('vi-VN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const handleViewHistory = (patientProfileId: string) => {
    router.push(`/service-processing/patient-history/${patientProfileId}`);
  };

  if (user?.role !== 'DOCTOR') {
    return (
      <div className="container mx-auto px-8 py-6">
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-gray-600">Bạn không có quyền truy cập trang này</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-8 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Calendar className="h-6 w-6" />
          Lịch hẹn của tôi
        </h1>
        <p className="text-sm text-gray-600 mt-1">
          Danh sách các lịch hẹn khám bệnh
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Danh sách lịch hẹn</span>
            {total > 0 && (
              <span className="text-sm font-normal text-gray-600">
                Tổng số: {total} lịch hẹn
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
              <span className="ml-2 text-gray-600">Đang tải...</span>
            </div>
          ) : appointments.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p className="text-gray-600">Chưa có lịch hẹn nào</p>
            </div>
          ) : (
            <>
              <div className="space-y-4">
                {appointments.map((appointment) => (
                  <div
                    key={appointment.appointmentId}
                    className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-medium text-gray-900 text-lg">
                            {appointment.patientProfile?.name || 'N/A'}
                          </h3>
                          <Badge className={getStatusColor(appointment.status)}>
                            {getStatusText(appointment.status)}
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-600">
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4" />
                            <span>{appointment.patientProfile?.phone || 'Chưa có số điện thoại'}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            <span>{formatDate(appointment.date)}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            <span>{appointment.startTime} - {appointment.endTime}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Stethoscope className="h-4 w-4" />
                            <span>{appointment.specialtyName}</span>
                          </div>
                        </div>

                        {appointment.services.length > 0 && (
                          <div className="mt-3">
                            <p className="text-xs font-medium text-gray-700 mb-1">Dịch vụ:</p>
                            <div className="flex flex-wrap gap-2">
                              {appointment.services.map((service) => (
                                <Badge key={service.serviceId} variant="outline" className="text-xs">
                                  {service.serviceName}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2 ml-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedAppointment(appointment);
                            setIsDetailDialogOpen(true);
                          }}
                          className="flex items-center gap-2"
                        >
                          <Eye className="h-4 w-4" />
                          Chi tiết
                        </Button>
                        {appointment.patientProfile?.id && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewHistory(appointment.patientProfile!.id)}
                            className="flex items-center gap-2"
                          >
                            <History className="h-4 w-4" />
                            Lịch sử
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
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

      {/* Detail Dialog */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Chi tiết lịch hẹn
            </DialogTitle>
            <DialogDescription>
              Thông tin chi tiết về lịch hẹn khám bệnh
            </DialogDescription>
          </DialogHeader>
          {selectedAppointment && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-700">Mã lịch hẹn</p>
                  <p className="text-sm text-gray-900">{selectedAppointment.appointmentCode}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Trạng thái</p>
                  <Badge className={getStatusColor(selectedAppointment.status)}>
                    {getStatusText(selectedAppointment.status)}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Ngày khám</p>
                  <p className="text-sm text-gray-900">{formatDate(selectedAppointment.date)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Thời gian</p>
                  <p className="text-sm text-gray-900">{selectedAppointment.startTime} - {selectedAppointment.endTime}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Chuyên khoa</p>
                  <p className="text-sm text-gray-900">{selectedAppointment.specialtyName}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Bác sĩ</p>
                  <p className="text-sm text-gray-900">{selectedAppointment.doctorName}</p>
                </div>
              </div>

              <div className="border-t pt-4">
                <p className="text-sm font-medium text-gray-700 mb-2">Thông tin bệnh nhân</p>
                <div className="grid grid-cols-2 gap-4 bg-gray-50 p-3 rounded">
                  <div>
                    <p className="text-xs text-gray-600">Họ tên</p>
                    <p className="text-sm font-medium text-gray-900">{selectedAppointment.patientProfile?.name || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Số điện thoại</p>
                    <p className="text-sm font-medium text-gray-900">{selectedAppointment.patientProfile?.phone || 'Chưa có'}</p>
                  </div>
                  {selectedAppointment.patientProfile?.age && (
                    <div>
                      <p className="text-xs text-gray-600">Tuổi</p>
                      <p className="text-sm font-medium text-gray-900">{selectedAppointment.patientProfile.age} tuổi</p>
                    </div>
                  )}
                  {selectedAppointment.patientProfile?.gender && (
                    <div>
                      <p className="text-xs text-gray-600">Giới tính</p>
                      {selectedAppointment.patientProfile.gender === 'male' ? 'Nam' : 'Nữ'}
                    </div>
                  )}
                  {selectedAppointment.patientProfile?.dateOfBirth && (
                    <div>
                      <p className="text-xs text-gray-600">Ngày sinh</p>
                      <p className="text-sm font-medium text-gray-900">
                        {new Date(selectedAppointment.patientProfile.dateOfBirth).toLocaleDateString('vi-VN')}
                      </p>
                    </div>
                  )}
                  {selectedAppointment.patientProfile?.isPregnant && (
                    <div>
                      <p className="text-xs text-gray-600">Đang mang thai</p>
                      <p className="text-sm font-medium text-gray-900">Có</p>
                    </div>
                  )}
                  {selectedAppointment.patientProfile?.isDisabled && (
                    <div>
                      <p className="text-xs text-gray-600">Khuyết tật</p>
                      <p className="text-sm font-medium text-gray-900">Có</p>
                    </div>
                  )}
                </div>
              </div>

              {selectedAppointment.services.length > 0 && (
                <div className="border-t pt-4">
                  <p className="text-sm font-medium text-gray-700 mb-2">Dịch vụ khám</p>
                  <div className="space-y-2">
                    {selectedAppointment.services.map((service) => (
                      <div key={service.serviceId} className="bg-gray-50 p-3 rounded">
                        <p className="text-sm font-medium text-gray-900">{service.serviceName}</p>
                        <p className="text-xs text-gray-600">Mã: {service.serviceCode}</p>
                        {service.price && (
                          <p className="text-xs text-gray-600">Giá: {service.price.toLocaleString('vi-VN')} VNĐ</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedAppointment.patientProfile?.id && (
                <div className="flex justify-end gap-2 pt-4 border-t">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsDetailDialogOpen(false);
                      handleViewHistory(selectedAppointment.patientProfile!.id);
                    }}
                    className="flex items-center gap-2"
                  >
                    <History className="h-4 w-4" />
                    Xem lịch sử khám bệnh
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
