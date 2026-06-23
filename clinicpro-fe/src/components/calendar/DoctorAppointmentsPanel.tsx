/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from 'react';
// import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
// import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { appointmentBookingApi } from '@/lib/api';
import { Clock, RefreshCw } from 'lucide-react';

type DoctorService = {
  serviceId: string;
  serviceName: string;
  serviceCode: string;
  price: number;
  timePerPatient: number;
};

type DoctorAppointment = {
  appointmentId: string;
  appointmentCode: string;
  doctorId: string;
  doctorName: string;
  specialtyId: string;
  specialtyName: string;
  date: string;
  startTime: string;
  endTime: string;
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';
  services: DoctorService[];
  createdAt: string;
};

export function DoctorAppointmentsPanel({ asSheet = false }: { asSheet?: boolean }) {
  const [appointments, setAppointments] = useState<DoctorAppointment[]>([]);
  const [loading, setLoading] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [validatingId, setValidatingId] = useState<string | null>(null);
  const [isOpen,] = useState(asSheet);

  const loadAppointments = async () => {
    try {
      setLoading(true);
      const res = await appointmentBookingApi.getDoctorAppointments();
      const data = res.data as any;
      const list: DoctorAppointment[] = Array.isArray(data)
        ? data
        : data?.appointments ?? [];
      setAppointments(list);
    } catch (err) {
      console.error('Failed to load doctor appointments:', err);
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadAppointments();
    }
  }, [isOpen]);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const validateSlot = async (appt: DoctorAppointment) => {
    try {
      setValidatingId(appt.appointmentId);
      const serviceId = appt.services?.[0]?.serviceId;
      if (!serviceId) return;
      const resp = await appointmentBookingApi.getAvailableSlots(appt.doctorId, {
        serviceId,
        date: appt.date,
      });
      const payload = resp.data as any;
      console.log('[Doctor] validate slot', appt.startTime, '→ available-slots:', payload);
      const matched = payload?.slots?.find((s: any) => s.startTime === appt.startTime);
      alert(matched ? `Slot ${appt.startTime} is ${matched.isAvailable ? 'available' : 'occupied'}` : 'Slot not found');
    } finally {
      setValidatingId(null);
    }
  };

  const listBody = (
    <div className="py-1">
      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      ) : appointments.length === 0 ? (
        <div className="text-sm text-center text-gray-600 py-4">Không có lịch hẹn</div>
      ) : (
        <div className="space-y-2 max-h-[70vh] overflow-auto pr-1">
          {appointments.map((a) => (
            <div key={a.appointmentId} className="border rounded px-3 py-2 text-sm flex items-center justify-between">
              <div className="flex flex-col">
                <span className="font-medium">{a.appointmentCode}</span>
                <span className="text-gray-600">{new Date(a.date).toLocaleDateString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })} · <span className="inline-flex items-center gap-1"><Clock className="w-3 h-3" />{a.startTime}-{a.endTime}</span></span>
                <span className="text-gray-600">{a.services?.[0]?.serviceName || '-'}</span>
              </div>
              {/* <div className="flex items-center gap-2">
                <Badge variant="secondary">{a.status}</Badge>
                <Button variant="outline" size="sm" onClick={() => validateSlot(a)} disabled={validatingId === a.appointmentId}>
                  {validatingId === a.appointmentId ? 'Đang kiểm...' : 'Xác thực'}
                </Button>
              </div> */}
            </div>
          ))}
        </div>
      )}
    </div>
  );

  if (asSheet) {
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="font-medium">Lịch hẹn của bác sĩ</span>
          <Button variant="outline" size="sm" onClick={loadAppointments} disabled={loading}>
            <RefreshCw className="w-4 h-4 mr-1" /> Tải lại
          </Button>
        </div>
        {listBody}
      </div>
    );
  }

  // return (
  //   <Card className="border rounded-md">
  //     <CardHeader className="py-3">
  //       <div className="flex items-center justify-between">
  //         <CardTitle className="text-base">Lịch hẹn của bác sĩ</CardTitle>
  //         <div className="flex gap-2">
  //           {isOpen && (
  //             <Button variant="outline" size="sm" onClick={loadAppointments} disabled={loading}>
  //               <RefreshCw className="w-4 h-4 mr-1" /> Tải lại
  //             </Button>
  //           )}
  //           <Button size="sm" onClick={() => setIsOpen((v) => !v)}>
  //             {isOpen ? 'Ẩn danh sách' : 'Xem danh sách'}
  //           </Button>
  //         </div>
  //       </div>
  //     </CardHeader>
  //     {isOpen && <CardContent className="py-3">{listBody}</CardContent>}
  //   </Card>
  // );
}


