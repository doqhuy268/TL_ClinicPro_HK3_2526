"use client";

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useAppointmentBookingContext } from '@/lib/contexts/AppointmentBookingContext';
import { Clock, CheckCircle, XCircle } from 'lucide-react';
import { TimeSlot } from '@/lib/types/appointment-booking';

export function SelectTimeStep() {
  const {
    selectedDoctor,
    selectedService,
    selectedDate,
    availableSlots,
    loading,
    selectTimeSlot,
    loadAvailableSlots,
  } = useAppointmentBookingContext();

  useEffect(() => {
    if (selectedDoctor && selectedService && selectedDate) {
      loadAvailableSlots(selectedDoctor.doctorId, selectedService.serviceId, selectedDate);
    }
  }, [selectedDoctor, selectedService, selectedDate, loadAvailableSlots]);

  const handleSelectTimeSlot = (timeSlot: TimeSlot) => {
    selectTimeSlot(timeSlot);
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    return `${hours}:${minutes}`;
  };

  // Chỉ hiển thị các slot bắt đầu sau thời gian hiện tại 1 giờ (áp dụng cho ngày hôm nay)
  const now = new Date();
  const cutoff = new Date(now.getTime() + 60 * 60 * 1000);
  const todayStr = now.toISOString().slice(0, 10);
  const filteredSlots =
    selectedDate === todayStr
      ? availableSlots.filter((slot) => {
          const slotStart = new Date(`${selectedDate}T${slot.startTime}`);
          return slotStart.getTime() > cutoff.getTime();
        })
      : availableSlots;

  const groupSlotsByTime = (slots: TimeSlot[]) => {
    const grouped: { [key: string]: TimeSlot[] } = {};

    slots.forEach(slot => {
      const timeKey = slot.startTime;
      if (!grouped[timeKey]) {
        grouped[timeKey] = [];
      }
      grouped[timeKey].push(slot);
    });

    return grouped;
  };

  const groupedFilteredSlots = groupSlotsByTime(filteredSlots);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {Array.from({ length: 8 }).map((_, index) => (
            <Skeleton key={index} className="h-16 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Available Time Slots */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {Object.entries(groupedFilteredSlots).map(([timeKey, slots]) => {
          const slot = slots[0]; // All slots in a group should have the same availability
          const isAvailable = slot.isAvailable;
          
          return (
            <Button
              key={timeKey}
              variant={isAvailable ? "outline" : "secondary"}
              className={`h-16 flex flex-col items-center justify-center space-y-1 ${
                isAvailable 
                  ? 'hover:bg-primary hover:text-white cursor-pointer border-2 hover:border-primary' 
                  : 'cursor-not-allowed opacity-50'
              }`}
              disabled={!isAvailable}
              onClick={() => isAvailable && handleSelectTimeSlot(slot)}
            >
              <div className="flex items-center space-x-1">
                <Clock className="w-4 h-4" />
                <span className="font-medium">{formatTime(slot.startTime)}</span>
              </div>
              <div className="flex items-center space-x-1">
                {isAvailable ? (
                  <>
                    <CheckCircle className="w-3 h-3 text-green-500" />
                    <span className="text-xs">Có sẵn</span>
                  </>
                ) : (
                  <>
                    <XCircle className="w-3 h-3 text-red-500" />
                    <span className="text-xs">Đã đặt</span>
                  </>
                )}
              </div>
            </Button>
          );
        })}
      </div>

      {(filteredSlots.length === 0 || availableSlots.length === 0) && !loading && (
        <div className="text-center py-8">
          <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">Không có giờ khám nào khả dụng</p>
          <p className="text-sm text-gray-400 mt-2">
            Bác sĩ cần tạo lịch làm việc cho ngày {selectedDate} với dịch vụ bạn chọn. Thử chọn ngày khác hoặc liên hệ phòng khám.
          </p>
        </div>
      )}

      {/* Legend */}
      <div className="flex items-center justify-center space-x-4 text-sm text-gray-600">
        <div className="flex items-center space-x-1">
          <CheckCircle className="w-4 h-4 text-green-500" />
          <span>Có sẵn</span>
        </div>
        <div className="flex items-center space-x-1">
          <XCircle className="w-4 h-4 text-red-500" />
          <span>Đã đặt</span>
        </div>
      </div>
    </div>
  );
}
