'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { CalendarPlus, RefreshCw } from 'lucide-react';
import { userApi } from '@/lib/api';

interface DoctorOption {
  id: string;
  name: string;
  doctorCode?: string;
}

interface CalendarHeaderProps {
  loading?: boolean;
  onRefresh: () => void;
  onCreateNew: () => void;
  isAdmin?: boolean;
  selectedDoctorId?: string | null;
  onDoctorSelect?: (doctorId: string | null) => void;
  onShowDoctorList?: () => void;
  onShowAdminAppointments?: () => void;
}

export function CalendarHeader({ 
  loading, 
  onRefresh, 
  onCreateNew, 
  isAdmin = false, 
  selectedDoctorId,
  onDoctorSelect,
  onShowAdminAppointments,
}: CalendarHeaderProps) {
  const [doctors, setDoctors] = useState<DoctorOption[]>([]);
  const [loadingDoctors, setLoadingDoctors] = useState(false);

  useEffect(() => {
    if (isAdmin && onDoctorSelect) {
      setLoadingDoctors(true);
      userApi.getDoctors()
        .then((res) => {
          const data = res.data as Array<{ id: string; name: string; doctor?: { doctorCode?: string } }>;
          setDoctors(data.map((d) => ({
            id: d.id,
            name: d.name,
            doctorCode: d.doctor?.doctorCode,
          })));
        })
        .catch(() => setDoctors([]))
        .finally(() => setLoadingDoctors(false));
    }
  }, [isAdmin, onDoctorSelect]);

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight text-primary">
          Quản lý lịch làm việc
        </h1>
        
        {isAdmin && onDoctorSelect && (
          <div className="flex items-center gap-3 mt-2">
            <Label htmlFor="doctor-select" className="text-sm text-gray-600">
              Chọn bác sĩ:
            </Label>
            <Select
              value={selectedDoctorId ?? '__all__'}
              onValueChange={(v) => onDoctorSelect(v === '__all__' ? null : v)}
              disabled={loadingDoctors}
            >
              <SelectTrigger id="doctor-select" className="w-[220px]">
                <SelectValue placeholder="Chọn bác sĩ để tạo lịch" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">-- Tất cả --</SelectItem>
                {doctors.map((d) => (
                  <SelectItem key={d.id} value={d.id}>
                    {d.doctorCode ? `${d.name} (${d.doctorCode})` : d.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedDoctorId && (
              <p className="text-sm text-primary font-medium">
                Đang chọn bác sĩ để tạo lịch
              </p>
            )}
          </div>
        )}
      </div>
      
      <div className="flex items-center gap-3">
        {isAdmin && (
          <Button
            variant="outline"
            size="sm"
            onClick={onShowAdminAppointments}
            className="border-gray-300"
          >
            Lịch đã đặt
          </Button>
        )}
        <Button
          variant="outline"
          size="sm"
          onClick={onRefresh}
          disabled={loading}
          className="border-slate-200 hover:bg-slate-100 hover:text-slate-900 rounded-xl"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Làm mới
        </Button>
        
        <Button
          onClick={onCreateNew}
          disabled={loading}
          className="bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white rounded-xl shadow-md shadow-teal-600/20"
        >
          <CalendarPlus className="h-4 w-4 mr-2" />
          Tạo lịch mới
        </Button>
      </div>
    </div>
  );
}
