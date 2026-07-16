"use client";
import { useState, useEffect, useMemo } from 'react';
import QRCode from 'react-qr-code';
import { useAuth } from '@/lib/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  User,
  Stethoscope,
  Calendar,
  Clock,
  FileText,
  RefreshCw,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useAppointmentBookingContext } from '@/lib/contexts/AppointmentBookingContext';
import { Appointment } from '@/lib/types/appointment-booking';

const buildAppointmentQrInfo = (appointment: Appointment) => {
  // Chỉ hiển thị mã appointment code đơn giản: APT-xxx
  const payload = appointment.appointmentCode || '';

  return {
    payload,
    descriptors: [
      { label: 'Mã lịch hẹn', value: appointment.appointmentCode, prefix: 'APT' },
    ],
  };
};

export function MyAppointments() {
  const { user } = useAuth();
  const { loadPatientAppointments } = useAppointmentBookingContext();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  useEffect(() => {
    const fetchAppointments = async () => {
      if (!user) return;
      try {
        setIsLoading(true);
        const data = await loadPatientAppointments();
        setAppointments(data);
      } catch (error) {
        console.error('Error fetching appointments:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchAppointments();
  }, [user, loadPatientAppointments]);

  const handleRefresh = async () => {
    if (!user) return;
    try {
      setIsLoading(true);
      const data = await loadPatientAppointments();
      setAppointments(data);
    } catch (error) {
      console.error('Error refreshing appointments:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Pagination logic
  const totalPages = Math.ceil(appointments.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentAppointments = useMemo(() => {
    return appointments.slice(startIndex, endIndex);
  }, [appointments, startIndex, endIndex]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800 border border-yellow-200';
      case 'CONFIRMED':
        return 'bg-green-100 text-green-800 border border-green-200';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800 border border-red-200';
      case 'COMPLETED':
        return 'bg-blue-100 text-blue-800 border border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border border-gray-200';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'Đã đặt';
      case 'CONFIRMED':
        return 'Đã xác nhận';
      case 'CANCELLED':
        return 'Đã hủy';
      case 'COMPLETED':
        return 'Hoàn thành';
      default:
        return status;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (timeString: string) => {
    const [hours, minutes] = timeString.split(':');
    return `${hours}:${minutes}`;
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, index) => (
          <Card key={index}>
            <CardHeader>
              <div className="flex items-center space-x-3">
                <Skeleton className="w-12 h-12 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-5 w-48" />
                  <Skeleton className="h-4 w-32" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Lịch hẹn của tôi</h2>
          <p className="text-gray-600">
            Tổng cộng {appointments.length} lịch hẹn
            {totalPages > 1 && (
              <span className="ml-2 text-sm">
                • Hiển thị {startIndex + 1}-{Math.min(endIndex, appointments.length)}
              </span>
            )}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={isLoading}
          className="flex items-center space-x-2"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Làm mới</span>
        </Button>
      </div>

      {/* Appointments List */}
      {appointments.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Chưa có lịch hẹn nào
            </h3>
            <p className="text-gray-600 mb-4">
              Bạn chưa có lịch hẹn khám bệnh nào. Hãy đặt lịch ngay!
            </p>
            <Button asChild>
              <a href="/booking">Đặt lịch khám</a>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="space-y-4 ">
            {currentAppointments.map((appointment) => (
              <Card key={appointment.appointmentId} className="hover:shadow-md transition-shadow border border-gray-200">
                {(() => {
                  const qrInfo = buildAppointmentQrInfo(appointment);
                  const hasQr = Boolean(qrInfo.payload);
                  return (
                    <>
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-[#0F766E] rounded-full flex items-center justify-center">
                        <Stethoscope className="w-6 h-6  text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-lg text-gray-900">{appointment.appointmentCode}</CardTitle>
                        <p className="text-sm text-gray-500">
                          Tạo lúc: {new Date(appointment.createdAt).toLocaleString('vi-VN')}
                        </p>
                      </div>
                      <Badge className={getStatusColor(appointment.status)}>
                        {getStatusText(appointment.status)}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      
                      {hasQr && (
                        <div className="hidden sm:flex flex-col items-center gap-2 rounded-lg border border-dashed border-primary/30 bg-primary/5 p-2">
                          <div className="bg-white p-1 rounded-md border border-gray-200">
                            <QRCode value={qrInfo.payload} size={72} style={{ width: '72px', height: '72px' }} />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                 
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Doctor Info */}
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                        <User className="w-5 h-5 text-gray-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Bác sĩ</p>
                        <p className="font-medium text-gray-900">{appointment.doctorName}</p>
                      </div>
                    </div>

                    {/* Date Info */}
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                        <Calendar className="w-5 h-5 text-gray-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Ngày khám</p>
                        <p className="font-medium text-gray-900">{formatDate(appointment.date)}</p>
                      </div>
                    </div>

                    {/* Time Info */}
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                        <Clock className="w-5 h-5 text-gray-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Giờ khám</p>
                        <p className="font-medium text-gray-900">
                          {formatTime(appointment.startTime)} - {formatTime(appointment.endTime)}
                        </p>
                      </div>
                    </div>

                    {/* Service Info */}
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                        <FileText className="w-5 h-5 text-gray-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Dịch vụ</p>
                        <p className="font-medium text-gray-900">{appointment.serviceName}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
                    </>
                  );
                })()}
              </Card>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center space-x-2 pt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="flex items-center space-x-1"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              
              <div className="flex items-center space-x-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <Button
                    key={page}
                    variant={page === currentPage ? "default" : "outline"}
                    size="sm"
                    onClick={() => handlePageChange(page)}
                    className="w-8 h-8 p-0"
                  >
                    {page}
                  </Button>
                ))}
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="flex items-center space-x-1"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
