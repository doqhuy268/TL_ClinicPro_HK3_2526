"use client";

import { useState, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAppointmentBookingContext } from '@/lib/contexts/AppointmentBookingContext';
import { ChevronLeft, ChevronRight, Clock, Calendar, User } from 'lucide-react';

export function SelectDateStep() {
  const {
    selectedSpecialty,
    selectedDoctor,
    workingDays,
    loading,
    selectDate,
    loadAvailableDoctors,
    loadDoctorWorkingDays,
    bookingFlow
  } = useAppointmentBookingContext();

  const [currentMonth, setCurrentMonth] = useState(new Date());

  const formatMonth = (date: Date) => {
    const m = (date.getMonth() + 1).toString().padStart(2, '0');
    const y = date.getFullYear().toString();
    return `${m}/${y}`;
  };

  const formatLocalDate = (date: Date) => {
    const y = date.getFullYear();
    const m = (date.getMonth() + 1).toString().padStart(2, '0');
    const d = date.getDate().toString().padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  // Load doctor's working days for BY_DOCTOR flow
  useEffect(() => {
    if (bookingFlow === 'BY_DOCTOR' && selectedDoctor) {
      const month = formatMonth(currentMonth);
      console.log('[STEP] SelectDateStep → loadDoctorWorkingDays', { doctorId: selectedDoctor.doctorId, month });
      loadDoctorWorkingDays(selectedDoctor.doctorId, month);
    }
  }, [bookingFlow, selectedDoctor, currentMonth, loadDoctorWorkingDays]);

  // Generate calendar days for current month
  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();

    const firstDay = new Date(year, month, 1);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());

    const days = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < 42; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      
      // Use local date format to avoid timezone shifting the day
      const dateString = formatLocalDate(date);
      const isCurrentMonth = date.getMonth() === month;
      const isPast = date < today;
      const isWorkingDay = workingDays.includes(dateString);
      const isToday = date.toDateString() === today.toDateString();

      days.push({
        date,
        dateString,
        isCurrentMonth,
        isPast,
        isWorkingDay,
        isToday,
        dayNumber: date.getDate()
      });
    }

    return days;
  }, [currentMonth, workingDays]);

  const handleDateSelect = async (dateString: string) => {
    if (bookingFlow === 'BY_DATE' && selectedSpecialty) {
      console.log('[STEP] SelectDateStep → loadAvailableDoctors for date', { specialtyId: selectedSpecialty.specialtyId, dateString });
      await loadAvailableDoctors(selectedSpecialty.specialtyId, dateString);
    }
    console.log('[STEP] SelectDateStep → selectDate', { dateString });
    selectDate(dateString);
  };

  const goToPreviousMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const monthNames = [
    'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
    'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'
  ];

  const dayNames = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

  return (
    <div className="space-y-6">
      {/* Context Information */}
      <Card className="border border-gray-200">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            {bookingFlow === 'BY_DATE' ? (
              <>
                <Calendar className="w-5 h-5 text-blue-600" />
                <span>Chọn ngày khám</span>
              </>
            ) : (
              <>
                <User className="w-5 h-5 text-green-600" />
                <span>Lịch làm việc của bác sĩ</span>
              </>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {bookingFlow === 'BY_DATE' ? (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Calendar className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <h4 className="font-medium text-blue-900 mb-1">Chọn ngày khám</h4>
                  <p className="text-sm text-blue-700">
                    Chọn ngày bạn muốn khám. Sau đó sẽ hiển thị danh sách bác sĩ có sẵn trong ngày đó.
                  </p>
                  {selectedSpecialty && (
                    <p className="text-xs text-blue-600 mt-2">
                      Chuyên khoa: <span className="font-medium">{selectedSpecialty.name}</span>
                    </p>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <User className="w-4 h-4 text-green-600" />
                </div>
                <div>
                  <h4 className="font-medium text-green-900 mb-1">Lịch làm việc của bác sĩ</h4>
                  <p className="text-sm text-green-700">
                    Xem lịch làm việc của bác sĩ đã chọn. Chỉ những ngày có dấu tick màu xanh mới có thể đặt lịch.
                  </p>
                  {selectedDoctor && (
                    <p className="text-xs text-green-600 mt-2">
                      Bác sĩ: <span className="font-medium">{selectedDoctor.doctorName}</span>
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Calendar Header */}
      <div className="flex items-center justify-between">
        <Button variant="outline" size="sm" onClick={goToPreviousMonth}>
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <h3 className="text-lg font-semibold">
          {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
        </h3>
        <Button variant="outline" size="sm" onClick={goToNextMonth}>
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>

      {/* Day Names */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {dayNames.map((day) => (
          <div key={day} className="text-center text-sm font-medium text-gray-500 py-2">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map((day, index) => {
          const canSelect = !day.isPast && (
            bookingFlow === 'BY_DOCTOR' ? day.isWorkingDay : true
          );
          
          return (
            <Button
              key={index}
              variant={day.isToday ? "default" : "ghost"}
              size="sm"
              className={`h-12  ${
                !day.isCurrentMonth 
                  ? 'text-gray-300' 
                  : day.isPast 
                    ? 'text-gray-400' 
                    : day.isWorkingDay 
                      ? 'cursor-pointer' 
                      : 'cursor-pointer'
              }`}
              disabled={!canSelect}
              onClick={() => {
                if (!canSelect) return;
                console.log('[UI] Click day', { date: day.dateString, bookingFlow });
                handleDateSelect(day.dateString);
              }}
            >
              <div className="flex flex-col items-center">
                <span className="text-sm">{day.dayNumber}</span>
                {day.isWorkingDay && day.isCurrentMonth && !day.isPast && (
                  <Clock className="w-3 h-3 text-green-500" />
                )}
              </div>
            </Button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center space-x-6 text-sm text-gray-600">
        <div className="flex items-center space-x-1">
          <Clock className="w-4 h-4 text-green-500" />
          <span>{bookingFlow === 'BY_DOCTOR' ? 'Có lịch làm việc' : 'Có thể đặt lịch'}</span>
        </div>
        <div className="flex items-center space-x-1">
          <div className="w-4 h-4 bg-gray-300 rounded"></div>
          <span>{bookingFlow === 'BY_DOCTOR' ? 'Không có lịch' : 'Không thể đặt lịch'}</span>
        </div>
        <div className="flex items-center space-x-1">
          <div className="w-4 h-4 bg-gray-400 rounded"></div>
          <span>Ngày đã qua</span>
        </div>
      </div>

      {loading && (
        <div className="text-center py-4">
          <div className="inline-flex items-center space-x-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
            <span className="text-sm text-gray-600">Đang tải lịch làm việc...</span>
          </div>
        </div>
      )}
    </div>
  );
}
