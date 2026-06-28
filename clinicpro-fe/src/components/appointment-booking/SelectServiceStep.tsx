"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useAppointmentBookingContext } from '@/lib/contexts/AppointmentBookingContext';
import { DollarSign, Clock, FileText, ChevronLeft, ChevronRight } from 'lucide-react';
import { Service } from '@/lib/types/appointment-booking';

export function SelectServiceStep() {
  const {
    selectedDoctor,
    selectedDate,
    availableServices,
    loading,
    selectService,
    loadDoctorServices,
  } = useAppointmentBookingContext();

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 4; // 2 rows x 2 columns

  useEffect(() => {
    if (selectedDoctor && selectedDate) {
      console.log('[STEP] SelectServiceStep → loadDoctorServices', { doctorId: selectedDoctor.doctorId, date: selectedDate });
      loadDoctorServices(selectedDoctor.doctorId, selectedDate);
    } else {
      console.log('[STEP] SelectServiceStep → waiting', { hasDoctor: !!selectedDoctor, hasDate: !!selectedDate });
    }
  }, [selectedDoctor, selectedDate, loadDoctorServices]);

  // Pagination logic
  const totalPages = Math.ceil(availableServices.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentServices = availableServices.slice(startIndex, endIndex);

  const handleSelectService = (service: Service) => {
    selectService(service);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Card key={index}>
              <CardHeader>
                <Skeleton className="h-6 w-6 rounded-full" />
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-full" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-4 w-1/3 mt-2" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Results Info */}
      {availableServices.length > 0 && (
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>
            Hiển thị {startIndex + 1}-{Math.min(endIndex, availableServices.length)} trong {availableServices.length} dịch vụ
          </span>
          {totalPages > 1 && (
            <span>
              Trang {currentPage} / {totalPages}
            </span>
          )}
        </div>
      )}

      {/* Services Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {currentServices.map((service) => (
          <Card
            key={service.serviceId}
            className="cursor-pointer hover:shadow-md transition-all duration-200 border-2 hover:border-primary/50 hover:scale-105"
            onClick={() => handleSelectService(service)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                  <FileText className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1">
                  <CardTitle className="text-lg">{service.serviceName}</CardTitle>
                  <CardDescription className="text-sm">
                    {service.serviceCode}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <DollarSign className="w-4 h-4 text-green-500" />
                  <span className="text-lg font-semibold text-green-600">
                    {formatPrice(service.price)}
                  </span>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-blue-500" />
                  <Badge variant="secondary" className="text-xs">
                    {service.timePerPatient} phút
                  </Badge>
                </div>

                <p className="text-sm text-gray-600 mt-2 line-clamp-2">{service.description}</p>
              </div>

              <div className="mt-4 flex justify-end">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSelectService(service);
                  }}
                >
                  Chọn
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            className="flex items-center space-x-1"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Trước</span>
          </Button>
          
          <div className="flex items-center space-x-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <Button
                key={page}
                variant={page === currentPage ? "default" : "outline"}
                size="sm"
                onClick={() => setCurrentPage(page)}
                className="w-8 h-8 p-0"
              >
                {page}
              </Button>
            ))}
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
            className="flex items-center space-x-1"
          >
            <span>Sau</span>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      )}

      {availableServices.length === 0 && !loading && (
        <div className="text-center py-12">
          <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Không có dịch vụ nào khả dụng</h3>
          <p className="text-gray-500">Vui lòng thử lại sau hoặc chọn bác sĩ khác</p>
        </div>
      )}
    </div>
  );
}
