/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useAppointmentBookingContext } from '@/lib/contexts/AppointmentBookingContext';
import { useAuth } from '@/lib/hooks/useAuth';
import { PatientProfile, patientProfileApi } from '@/lib/api';
import {
  User,
  Stethoscope,
  Calendar,
  Clock,
  FileText,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export function ConfirmBookingStep() {
  const { user } = useAuth();
  const {
    selectedSpecialty,
    selectedDoctor,
    selectedDate,
    selectedService,
    selectedTimeSlot,
    bookAppointment,
    resetBooking
  } = useAppointmentBookingContext();
  const router = useRouter();

  const [patientProfiles, setPatientProfiles] = useState<PatientProfile[]>([]);
  const [selectedPatientProfile, setSelectedPatientProfile] = useState<PatientProfile | null>(null);
  const [isLoadingProfiles, setIsLoadingProfiles] = useState(true);
  const [isBooking, setIsBooking] = useState(false);

  // Load patient profiles
  useEffect(() => {
    const loadPatientProfiles = async () => {
      if (!user?.id) return;

      try {
        setIsLoadingProfiles(true);
        const response = await patientProfileApi.getByPatientId(user.id);
        const data = response.data as any;
        const profiles: PatientProfile[] = Array.isArray(data)
          ? data
          : (data?.profiles ?? data?.items ?? data?.data ?? []);
        console.log('[API] getPatientProfiles', { userId: user.id }, '→', profiles);
        setPatientProfiles(profiles);
        if (profiles.length > 0) {
          setSelectedPatientProfile(profiles[0]);
        }
      } catch (error) {
        console.error('Error loading patient profiles:', error);
      } finally {
        setIsLoadingProfiles(false);
      }
    };

    loadPatientProfiles();
  }, [user?.id]);

  const handleBookAppointment = async () => {
    if (!selectedPatientProfile) {
      toast.error('Vui lòng chọn hồ sơ bệnh nhân');
      return;
    }

    setIsBooking(true);
    try {
      const patientProfileId = selectedPatientProfile.id;
      const result = await bookAppointment(patientProfileId);
      
      if (result) {
        toast.success('Đặt lịch khám thành công!');
        router.push('/my-appointments');
      }
    } catch (error) {
      // Handle conflict error when slot already booked
      const axiosError = error as any;
      const data = axiosError?.response?.data;
      const status = axiosError?.response?.status;
      const conflict = data?.conflict;
      const apiMessage =
        data?.message ||
        data?.error ||
        data?.errorMessage ||
        data?.detail ||
        (Array.isArray(data?.errors) ? data.errors[0]?.message : undefined) ||
        (typeof data === 'string' ? data : undefined);
      if (conflict) {
        const { date, startTime, endTime } = conflict;
        toast.error(
          `${apiMessage || 'Khung giờ đã được đặt'}: ${date} ${startTime}-${endTime}`,
        );
      } else if (apiMessage) {
        toast.error(apiMessage);
      } else if (typeof data === 'string') {
        toast.error(data);
      } else if (status) {
        toast.error(`Không thể đặt lịch (mã ${status}), vui lòng thử lại`);
      } else {
        toast.error('Không thể đặt lịch, vui lòng thử lại');
      }
      console.error('Error booking appointment:', error);
    } finally {
      setIsBooking(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    return `${hours}:${minutes}`;
  };

  if (!selectedSpecialty || !selectedDoctor || !selectedDate || !selectedService || !selectedTimeSlot) {
    return (
      <div className="text-center py-8">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <p className="text-gray-500">Thiếu thông tin đặt lịch. Vui lòng quay lại các bước trước.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Appointment Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <CheckCircle className="w-5 h-5 text-green-500" />
            <span>Thông tin đặt lịch</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Specialty */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
              <Stethoscope className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="font-medium">Chuyên khoa</p>
              <p className="text-sm text-gray-600">{selectedSpecialty.name}</p>
            </div>
          </div>

          <Separator />

          {/* Doctor */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="font-medium">Bác sĩ</p>
              <p className="text-sm text-gray-600">{selectedDoctor.doctorName}</p>
            </div>
          </div>

          <Separator />

          {/* Date */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <Calendar className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="font-medium">Ngày khám</p>
              <p className="text-sm text-gray-600">{formatDate(selectedDate)}</p>
            </div>
          </div>

          <Separator />

          {/* Time */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
              <Clock className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="font-medium">Giờ khám</p>
              <p className="text-sm text-gray-600">
                {formatTime(selectedTimeSlot.startTime)} - {formatTime(selectedTimeSlot.endTime)}
              </p>
            </div>
          </div>

          <Separator />

          {/* Service */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
              <FileText className="w-5 h-5 text-purple-600" />
            </div>
            <div className="flex-1">
              <p className="font-medium">Dịch vụ</p>
              <p className="text-sm text-gray-600">{selectedService.serviceName}</p>
              <p className="text-sm font-semibold text-green-600">
                {formatPrice(selectedService.price)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Patient Profile Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Chọn hồ sơ bệnh nhân</CardTitle>
          <CardDescription>
            Vui lòng chọn hồ sơ bệnh nhân để đặt lịch khám
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingProfiles ? (
            <div className="text-center py-4">
              <div className="inline-flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                <span className="text-sm text-gray-600">Đang tải hồ sơ...</span>
              </div>
            </div>
          ) : (
            <Select
              value={selectedPatientProfile?.id || ''}
              onValueChange={(value) => {
                const profile = patientProfiles.find((p) => p.id === value) || null;
                setSelectedPatientProfile(profile);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Chọn hồ sơ bệnh nhân" />
              </SelectTrigger>
              <SelectContent>
                {patientProfiles.map((profile, index: number) => {
                  const key = profile.id || `profile-${index}`;
                  const value = profile.id;
                  return (
                    <SelectItem key={key} value={value}>
                      {profile.name}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          )}
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex justify-end space-x-3">
        <Button
          variant="outline"
          onClick={() => resetBooking()}
          disabled={isBooking}
        >
          Hủy
        </Button>
        <Button
          onClick={handleBookAppointment}
          disabled={!selectedPatientProfile || isBooking}
          className="min-w-[120px]"
        >
          {isBooking ? (
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              <span>Đang đặt...</span>
            </div>
          ) : (
            'Xác nhận đặt lịch'
          )}
        </Button>
      </div>
    </div>
  );
}
