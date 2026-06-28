"use client";

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAppointmentBookingContext, AppointmentBookingProvider } from '@/lib/contexts/AppointmentBookingContext';
import { BookingFlow, BOOKING_STEPS } from '@/lib/types/appointment-booking';
import { SelectSpecialtyStep } from '@/components/appointment-booking/SelectSpecialtyStep';
import { SelectDateStep } from '@/components/appointment-booking/SelectDateStep';
import { SelectDoctorStep } from '@/components/appointment-booking/SelectDoctorStep';
import { SelectServiceStep } from '@/components/appointment-booking/SelectServiceStep';
import { SelectTimeStep } from '@/components/appointment-booking/SelectTimeStep';
import { ConfirmBookingStep } from '@/components/appointment-booking/ConfirmBookingStep';
import { ChevronLeft, CheckCircle, Calendar, User } from 'lucide-react';
import { toast } from 'sonner';
import { useEffect } from 'react';

function AppointmentBookingInner() {
  const {
    currentStep,
    bookingFlow,
    prevStep,
    setBookingFlowType,
    error,
    success,
    resetBooking,
    selectedSpecialty,
    selectedDoctor,
    selectedDate,
    selectedService,
    selectedTimeSlot,
    setError,
    setSuccess,
  } = useAppointmentBookingContext();

  // Show success/error messages
  useEffect(() => {
    if (success) {
      toast.success(success);
      setSuccess(null);
    }
  }, [success, setSuccess]);

  useEffect(() => {
    if (error) {
      toast.error(error);
      setError(null);
    }
  }, [error, setError]);

  const renderStep = () => {
    switch (currentStep) {
      case 1: return <SelectSpecialtyStep />;
      case 2:
        if (bookingFlow === 'BY_DATE') return <SelectDateStep />;
        if (bookingFlow === 'BY_DOCTOR') return <SelectDoctorStep />;
        return null;
      case 3:
        if (bookingFlow === 'BY_DATE') return <SelectDoctorStep />;
        if (bookingFlow === 'BY_DOCTOR') return <SelectDateStep />;
        return null;
      case 4:
        if (bookingFlow === 'BY_DATE') return <SelectServiceStep />;
        if (bookingFlow === 'BY_DOCTOR') return <SelectServiceStep />;
        return null;
      case 5:
        if (bookingFlow === 'BY_DATE') return <SelectTimeStep />;
        if (bookingFlow === 'BY_DOCTOR') return <SelectTimeStep />;
        return null;
      case 6: return <ConfirmBookingStep />;
      default: return <SelectSpecialtyStep />;
    }
  };

  const getStepTitle = () => {
    const step = BOOKING_STEPS.find(s => s.id === currentStep);
    return step ? step.name : 'Đặt lịch khám';
  };

  const getStepDescription = () => {
    const step = BOOKING_STEPS.find(s => s.id === currentStep);
    return step ? step.description : '';
  };

  const canGoBack = currentStep > 1;

  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">
          Đặt lịch khám bệnh
        </h1>
        <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto">
          Chọn chuyên khoa, bác sĩ và thời gian phù hợp với bạn
        </p>
      </div>

      {/* Booking Flow Selection */}
      {currentStep === 1 && (
        <Card className="mb-6 border border-gray-200 shadow-sm">
          <CardHeader className="">
              <CardTitle className="text-xl font-semibold text-gray-900">Chọn cách đặt lịch</CardTitle>
             
          </CardHeader>
          <CardContent>
            <Tabs value={bookingFlow} onValueChange={(value) => setBookingFlowType(value as BookingFlow)}>
              <TabsList className="grid w-full grid-cols-2 h-12">
                <TabsTrigger value="BY_DATE" className="flex items-center space-x-2 text-sm font-medium">
                  <Calendar className="w-4 h-4" />
                  <span>Theo ngày</span>
                </TabsTrigger>
                <TabsTrigger value="BY_DOCTOR" className="flex items-center space-x-2 text-sm font-medium">
                  <User className="w-4 h-4" />
                  <span>Theo bác sĩ</span>
                </TabsTrigger>
              </TabsList>
              <TabsContent value="BY_DATE" className="mt-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center shrink-0">
                      <Calendar className="w-4 h-4 text-blue-500" />
                    </div>
                    <div>
                      <h4 className="font-medium text-blue-800 mb-2">Đặt lịch theo ngày</h4>
                      <p className="text-sm text-blue-600 mb-3">
                        Bạn muốn chọn ngày trước, sau đó chọn bác sĩ có sẵn trong ngày đó.
                      </p>
                      <div className="text-xs text-blue-500 font-medium">
                        Quy trình: Chọn chuyên khoa → Chọn ngày → Chọn bác sĩ → Chọn dịch vụ → Chọn giờ
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>
              <TabsContent value="BY_DOCTOR" className="mt-6">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center shrink-0">
                      <User className="w-4 h-4 text-green-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-green-900 mb-2">Đặt lịch theo bác sĩ</h4>
                      <p className="text-sm text-green-700 mb-3">
                        Bạn muốn chọn bác sĩ trước, sau đó xem lịch trống của bác sĩ đó.
                      </p>
                      <div className="text-xs text-green-600 font-medium">
                        Quy trình: Chọn chuyên khoa → Chọn bác sĩ → Chọn ngày → Chọn dịch vụ → Chọn giờ
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}

      {/* Progress Steps */}
      <Card className="mb-6 border border-gray-200 shadow-sm">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between overflow-x-auto pb-2">
            {BOOKING_STEPS.map((step, index) => {
              const isActive = step.id === currentStep;
              const isCompleted = step.id < currentStep;
              const isAccessible = step.id <= currentStep + 1;

              return (
                  <div key={step.id} className="flex items-center min-w-0 shrink-0">
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-200 ${
                        isCompleted
                          ? 'bg-green-500 text-white shadow-md'
                          : isActive
                            ? 'bg-primary text-white shadow-lg '
                            : isAccessible
                              ? 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                              : 'bg-gray-100 text-gray-400'
                      }`}
                    >
                      {isCompleted ? (
                        <CheckCircle className="w-5 h-5" />
                      ) : (
                        step.id
                      )}
                    </div>
                    <span className={`text-xs mt-2 text-center max-w-16 leading-tight ${
                      isActive ? 'text-primary font-semibold' : 'text-gray-500'
                    }`}>
                      {step.name}
                    </span>
                  </div>
                  {index < BOOKING_STEPS.length - 1 && (
                    <div className={`flex-1 h-0.5 mx-3 min-w-8 transition-colors duration-200 ${
                      step.id < currentStep ? 'bg-green-500' : 'bg-gray-200'
                    }`} />
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Current Step */}
      <Card className="border border-gray-200 shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                <span className="text-sm font-semibold text-primary">{currentStep}</span>
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">{getStepTitle()}</h2>
                <p className="text-sm text-gray-600 mt-1">{getStepDescription()}</p>
              </div>
            </div>
            {currentStep > 1 && (
              <Badge variant="outline" className="ml-auto">
                {bookingFlow === 'BY_DATE' ? 'Theo ngày' : 'Theo bác sĩ'}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {renderStep()}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-6">
        <Button
          variant="outline"
          onClick={prevStep}
          disabled={!canGoBack}
          className="flex items-center space-x-2 w-full sm:w-auto"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Quay lại</span>
        </Button>

        <div className="flex space-x-2 w-full sm:w-auto">
          <Button
            variant="outline"
            onClick={resetBooking}
            className="flex-1 sm:flex-none"
          >
            Bắt đầu lại
          </Button>
        </div>
      </div>

      {/* Selected Information Summary */}
      {(selectedSpecialty || selectedDoctor || selectedDate || selectedService || selectedTimeSlot) && (
        <Card className="mt-6 border border-gray-200 shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              Thông tin đã chọn
            </CardTitle>
            <p className="text-sm text-gray-600 mt-1">Tóm tắt các lựa chọn của bạn</p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
              {selectedSpecialty && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                    <span className="text-blue-600 text-sm font-semibold">1</span>
                  </div>
                  <p className="text-xs text-blue-600 font-medium mb-1">Chuyên khoa</p>
                  <p className="font-semibold text-blue-900 text-sm">{selectedSpecialty.name}</p>
                </div>
              )}
              {selectedDoctor && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                    <span className="text-green-600 text-sm font-semibold">2</span>
                  </div>
                  <p className="text-xs text-green-600 font-medium mb-1">Bác sĩ</p>
                  <p className="font-semibold text-green-900 text-sm">{selectedDoctor.doctorName}</p>
                </div>
              )}
              {selectedDate && (
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 text-center">
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-2">
                    <span className="text-purple-600 text-sm font-semibold">3</span>
                  </div>
                  <p className="text-xs text-purple-600 font-medium mb-1">Ngày</p>
                  <p className="font-semibold text-purple-900 text-sm">
                    {new Date(selectedDate).toLocaleDateString('vi-VN')}
                  </p>
                </div>
              )}
              {selectedService && (
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 text-center">
                  <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-2">
                    <span className="text-orange-600 text-sm font-semibold">4</span>
                  </div>
                  <p className="text-xs text-orange-600 font-medium mb-1">Dịch vụ</p>
                  <p className="font-semibold text-orange-900 text-sm">{selectedService.serviceName}</p>
                </div>
              )}
              {selectedTimeSlot && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
                  <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-2">
                    <span className="text-red-600 text-sm font-semibold">5</span>
                  </div>
                  <p className="text-xs text-red-600 font-medium mb-1">Giờ</p>
                  <p className="font-semibold text-red-900 text-sm">
                    {selectedTimeSlot.startTime} - {selectedTimeSlot.endTime}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export function AppointmentBooking() {
  return (
    <AppointmentBookingProvider>
      <AppointmentBookingInner />
    </AppointmentBookingProvider>
  );
}
