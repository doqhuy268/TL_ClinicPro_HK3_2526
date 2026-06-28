'use client';

import { useEffect, useMemo, useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { appointmentBookingApi } from '@/lib/api';
import { staffService } from '@/lib/services/staff.service';
import { Calendar, Filter, RefreshCw, XCircle } from 'lucide-react';
import { toast } from 'sonner';

type AdminAppointment = {
  appointmentId: string;
  appointmentCode?: string;
  doctorId: string;
  doctorName?: string;
  patientName?: string;
  date: string;
  startTime: string;
  endTime: string;
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';
  services?: Array<{ serviceName?: string }>;
  createdAt?: string;
};

type DoctorOption = { id: string; name: string; doctorCode?: string };

interface AdminAppointmentsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AdminAppointmentsSheet({ open, onOpenChange }: AdminAppointmentsSheetProps) {
  const [appointments, setAppointments] = useState<AdminAppointment[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingDoctors, setLoadingDoctors] = useState(false);
  const [cancelingId, setCancelingId] = useState<string | null>(null);
  const [doctors, setDoctors] = useState<DoctorOption[]>([]);
  const [doctorId, setDoctorId] = useState<string>('all');
  const [date, setDate] = useState<string>('');

  const statusConfig: Record<string, { label: string; color: string }> = {
    PENDING: { label: 'Chờ xác nhận', color: 'bg-amber-100 text-amber-800 border border-amber-200' },
    CONFIRMED: { label: 'Đã xác nhận', color: 'bg-emerald-100 text-emerald-800 border border-emerald-200' },
    CANCELLED: { label: 'Đã hủy', color: 'bg-red-100 text-red-700 border border-red-200' },
    COMPLETED: { label: 'Hoàn thành', color: 'bg-blue-100 text-blue-800 border border-blue-200' },
  };

  const loadDoctors = async () => {
    try {
      setLoadingDoctors(true);
      const resp = await staffService.getAll({ role: 'DOCTOR', page: 1, limit: 100 });
      const data = (resp.data as unknown as { data?: DoctorOption[] })?.data || (resp.data as unknown as DoctorOption[]) || [];
      setDoctors(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load doctors', err);
      toast.error('Không tải được danh sách bác sĩ');
      setDoctors([]);
    } finally {
      setLoadingDoctors(false);
    }
  };

  const loadAppointments = async () => {
    try {
      setLoading(true);
      const params: { doctorId?: string; date?: string } = {};
      if (doctorId && doctorId !== 'all') params.doctorId = doctorId;
      if (date) params.date = date;
      const resp = await appointmentBookingApi.getAllAppointments(params);
      const payload = resp.data as { appointments?: AdminAppointment[]; totalAppointments?: number } | AdminAppointment[];
      const list = Array.isArray(payload) ? payload : (payload?.appointments ?? []);
      setAppointments(list || []);
    } catch (err) {
      console.error('Failed to load appointments', err);
      toast.error('Không tải được lịch hẹn');
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!open) return;
    loadDoctors();
    loadAppointments();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const handleApplyFilters = () => {
    loadAppointments();
  };

  const handleCancel = async (id: string) => {
    try {
      setCancelingId(id);
      const resp = await appointmentBookingApi.cancelAppointment(id);
      const updatedStatus = (resp.data as { status?: string })?.status || 'CANCELLED';
      setAppointments((prev) =>
        prev.map((appt) =>
          appt.appointmentId === id ? { ...appt, status: updatedStatus as AdminAppointment['status'] } : appt
        )
      );
      toast.success('Đã hủy lịch hẹn');
    } catch (err) {
      console.error('Failed to cancel appointment', err);
      toast.error('Không thể hủy lịch hẹn');
    } finally {
      setCancelingId(null);
    }
  };

  const appointmentItems = useMemo(() => {
    return appointments.map((appt) => {
      const status = statusConfig[appt.status] || statusConfig.PENDING;
      return (
        <div
          key={appt.appointmentId}
          className="border rounded-lg p-3 flex flex-col gap-2 hover:bg-gray-50"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge className={status.color}>{status.label}</Badge>
              <span className="text-sm text-gray-600">{appt.appointmentCode || appt.appointmentId}</span>
            </div>
            <div className="text-xs text-gray-500">
              {appt.createdAt ? new Date(appt.createdAt).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' }) : ''}
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-800">
            <div className="space-y-1">
              <div className="font-semibold text-gray-900">{appt.patientName || 'Bệnh nhân'}</div>
              <div className="text-gray-600">{appt.doctorName}</div>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-gray-700">
                <Calendar className="w-4 h-4" />
                <span>{new Date(appt.date).toLocaleDateString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })}</span>
                <span className="text-gray-500">· {appt.startTime}-{appt.endTime}</span>
              </div>
              <div className="text-gray-600">
                {appt.services?.map((s) => s.serviceName).filter(Boolean).join(', ') || '---'}
              </div>
            </div>
          </div>
          {appt.status !== 'CANCELLED' && (
            <div className="flex justify-end">
              <Button
                variant="destructive"
                size="sm"
                onClick={() => handleCancel(appt.appointmentId)}
                disabled={cancelingId === appt.appointmentId}
                className="flex items-center gap-2"
              >
                {cancelingId === appt.appointmentId ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Đang hủy...
                  </>
                ) : (
                  <>
                    <XCircle className="w-4 h-4" />
                    Hủy lịch
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      );
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appointments, cancelingId]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="bg-white w-[92vw] md:w-[70vw] lg:w-[60vw] xl:w-[50vw] 2xl:w-[45vw] max-w-none sm:max-w-none p-0">
        <SheetHeader className="px-8 py-5 border-b">
          <SheetTitle className="flex items-center gap-3 text-lg">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Calendar className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <div className="font-semibold">Lịch hẹn (Admin)</div>
              <div className="text-sm text-gray-500">Lọc theo bác sĩ và ngày</div>
            </div>
          </SheetTitle>
        </SheetHeader>

        <div className="px-8 py-5 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
            <div className="space-y-1">
              <span className="text-sm text-gray-700">Bác sĩ</span>
              <Select
                value={doctorId}
                onValueChange={(value) => setDoctorId(value)}
                disabled={loadingDoctors}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Chọn bác sĩ" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả</SelectItem>
                  {doctors.map((doc) => (
                    <SelectItem key={doc.id} value={doc.id}>
                      {doc.name} {doc.doctorCode ? `(${doc.doctorCode})` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <span className="text-sm text-gray-700">Ngày</span>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={handleApplyFilters}
                disabled={loading}
                className="w-full md:w-auto"
              >
                <Filter className="w-4 h-4 mr-2" />
                Áp dụng
              </Button>
              <Button
                variant="ghost"
                onClick={loadAppointments}
                disabled={loading}
                className="w-full md:w-auto"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Làm mới
              </Button>
            </div>
          </div>

          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          ) : appointments.length === 0 ? (
            <div className="text-center text-gray-600 py-6">Không có lịch hẹn</div>
          ) : (
            <div className="space-y-3 max-h-[70vh] overflow-auto pr-1">
              {appointmentItems}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

