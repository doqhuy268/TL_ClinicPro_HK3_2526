"use client";

import Image from "next/image";
import Link from "next/link";
import { 
  User, 
  Settings, 
  LogOut, 
  Bell, 
  Shield,
  HelpCircle,
  LogIn,
  Clock,
  Search
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/hooks/useAuth";
import { useEffect, useMemo, useState } from "react";
import { appointmentBookingApi, workSessionApi } from "@/lib/api";

type DoctorAppointment = {
  appointmentId?: string;
  appointmentCode?: string;
  code?: string;
  date?: string;
  startTime?: string;
  endTime?: string;
  createdAt?: string;
  patientName?: string;
  services?: Array<{ serviceName?: string }>;
  doctor?: { auth?: { name?: string } };
};

export function AppHeader() {
  const { user, logout, isAuthenticated, isLoading } = useAuth();
  const [notifications, setNotifications] = useState(0);
  const [apptOpen, setApptOpen] = useState(false);
  const [appointments, setAppointments] = useState<DoctorAppointment[]>([]);
  const [apptLoading, setApptLoading] = useState(false);

  const isDoctor = user?.role === 'DOCTOR';
  const isAdmin = user?.role === 'ADMIN';

  const todayStr = useMemo(() => {
    const d = new Date();
    return d.toISOString().slice(0, 10);
  }, []);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };
  useEffect(() => {
    console.log("isAuthenticated",isAuthenticated);
    console.log("isLoading",isLoading);
    console.log("user",user);
  }, [user, isAuthenticated, isLoading]);

  useEffect(() => {
    const loadAppointments = async () => {
      if (!apptOpen) return;
      if (!isDoctor && !isAdmin) return;
      try {
        setApptLoading(true);
        let list: DoctorAppointment[] = [];
        if (isDoctor) {
          const res = await appointmentBookingApi.getDoctorAppointments();
          const data = res.data as unknown;
          list = Array.isArray(data) ? data as DoctorAppointment[] : ((data as { appointments?: DoctorAppointment[] })?.appointments ?? []);
        } else if (isAdmin) {
          // Admin: lấy lịch làm việc trong ngày và lọc Pending
          const res = await workSessionApi.getByDate(todayStr, { userType: 'DOCTOR' });
          const data = res.data as unknown;
          const sessions = Array.isArray(data) ? data : ((data as { data?: DoctorAppointment[]; workSessions?: DoctorAppointment[] })?.data ?? (data as { workSessions?: DoctorAppointment[] })?.workSessions ?? []);
          list = (sessions as DoctorAppointment[]).filter((s) => (s as { status?: string }).status === 'PENDING');
        }
        // Filter trong ngày
        const filtered = list.filter((a: DoctorAppointment) => {
          const date = a.date || a.createdAt || a.startTime || '';
          return typeof date === 'string' && date.startsWith(todayStr);
        });
        setAppointments(filtered);
        setNotifications(filtered.length);
      } catch (err) {
        console.error('Failed to load appointments for header bell:', err);
        setAppointments([]);
        setNotifications(0);
      } finally {
        setApptLoading(false);
      }
    };
    loadAppointments();
  }, [apptOpen, isDoctor, isAdmin, todayStr]);

  const handleLogout = async () => {
    await logout();
    // Redirect to homepage after logout
    window.location.href = '/';
  };

  const handleProfile = () => {
    // For sidebar-layout users (admin, doctor, receptionist, cashier), 
    // redirect to sidebar-layout profile page
    window.location.href = '/staff-profile';
  };

  const handleSettings = () => {
    // Implement settings navigation
    console.log("Settings clicked");
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Chào buổi sáng";
    if (hour < 18) return "Chào buổi chiều";
    return "Chào buổi tối";
  };

  const getRoleLabel = (role?: string) => {
    switch (role) {
      case 'ADMIN': return 'Quản trị viên';
      case 'DOCTOR': return 'Bác sĩ';
      case 'RECEPTIONIST': return 'Lễ tân';
      case 'PATIENT': return 'Bệnh nhân';
      case 'CASHIER': return 'Thu ngân';
      case 'TECHNICIAN': return 'Kỹ thuật viên';
      default: return 'Người dùng';
    }
  };

  return (
    <header className="h-16 bg-slate-50 flex items-center justify-between px-6 z-10 sticky top-0">
      {/* Left side - Greeting */}
      <div className="flex items-center gap-4">
        <div className="flex flex-col">
          <p className="text-sm text-slate-500 font-medium">{getGreeting()},</p>
          <h2 className="text-base font-bold text-slate-800 -mt-0.5">
            {isAuthenticated && user ? user.name : "Khách"}
          </h2>
        </div>
      </div>

      {/* Right side - Actions */}
      <div className="flex items-center gap-2">
        {/* Search Button */}
        <Button variant="ghost" size="sm" className="h-9 w-9 rounded-xl text-slate-500 hover:text-slate-700 hover:bg-white">
          <Search className="h-4 w-4" />
        </Button>

        {/* Notifications - Only show for Doctor/Admin */}
        {isAuthenticated && !isLoading && (isDoctor || isAdmin) && (
          <DropdownMenu open={apptOpen} onOpenChange={setApptOpen}>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="relative h-9 w-9 rounded-xl text-slate-500 hover:text-slate-700 hover:bg-white">
                <Bell className="h-4 w-4" />
                {notifications > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-rose-500 flex items-center justify-center text-[10px] font-bold text-white ring-2 ring-slate-50">
                    {notifications}
                  </span>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80 rounded-xl shadow-xl border-slate-200/60">
              <DropdownMenuLabel className="font-semibold flex items-center justify-between text-slate-800">
                <span>{isDoctor ? 'Lịch hẹn hôm nay' : 'Lịch làm việc chờ duyệt hôm nay'}</span>
                {apptLoading && <span className="text-xs text-slate-400">Đang tải...</span>}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {appointments.length === 0 ? (
                <div className="px-3 py-6 text-center">
                  <Bell className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm text-slate-400">
                    {apptLoading ? 'Đang tải...' : 'Không có lịch hẹn nào'}
                  </p>
                </div>
              ) : (
                <div className="max-h-[250px] overflow-auto pr-1">
                  {appointments.map((a, idx) => {
                    const start = a.startTime || '';
                    const end = a.endTime || '';
                    const dateLabel = a.date
                      ? new Date(a.date).toLocaleDateString('vi-VN')
                      : (start ? new Date(start).toLocaleDateString('vi-VN') : todayStr);
                    const timeLabel = start ? `${start}${end ? `-${end}` : ''}` : (a.startTime || '');
                    const title = isDoctor ? (a.appointmentCode || a.code || 'Lịch hẹn') : (a.doctor?.auth?.name || 'Bác sĩ');
                    return (
                      <DropdownMenuItem key={a.appointmentId || a.code || a.appointmentCode || `appt-${idx}`} className="flex items-start gap-3 py-3 rounded-lg mx-1">
                        <div className="w-8 h-8 rounded-lg bg-teal-50 flex items-center justify-center shrink-0">
                          <Clock className="h-4 w-4 text-teal-600" />
                        </div>
                        <div className="flex-1">
                          <div className="text-sm font-semibold text-slate-800">{title}</div>
                          <div className="text-xs text-slate-500 mt-0.5">
                            {dateLabel} · {timeLabel || (a.createdAt || '')}
                          </div>
                          {isDoctor && a.patientName && (
                            <div className="text-xs text-teal-600 mt-0.5 font-medium">BN: {a.patientName}</div>
                          )}
                          {a.services?.[0]?.serviceName && (
                            <div className="text-xs text-slate-400">{a.services[0].serviceName}</div>
                          )}
                        </div>
                      </DropdownMenuItem>
                    );
                  })}
                </div>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {/* Divider */}
        <div className="w-px h-6 bg-slate-200 mx-1" />

        {/* User Profile Dropdown or Login Button */}
        {isAuthenticated && user && !isLoading ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild >
              <Button variant="ghost" className="flex items-center gap-2.5 p-1.5 pr-3 rounded-xl hover:bg-white transition-all">
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarImage src={user.avatar || undefined} alt={user.name} />
                  <AvatarFallback className="bg-gradient-to-br from-teal-500 to-emerald-600 text-white text-xs font-bold rounded-lg">
                    {getInitials(user.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden md:flex flex-col items-start">
                  <span className="text-sm font-semibold text-slate-800 leading-tight">{user.name}</span>
                  <span className="text-[10px] text-slate-400 font-medium leading-tight">{getRoleLabel(user.role)}</span>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 rounded-xl shadow-xl border-slate-200/60">
              <DropdownMenuLabel className="font-normal pb-3">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10 rounded-lg">
                    <AvatarImage src={user.avatar || undefined} alt={user.name} />
                    <AvatarFallback className="bg-gradient-to-br from-teal-500 to-emerald-600 text-white text-sm font-bold rounded-lg">
                      {getInitials(user.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <p className="text-sm font-semibold text-slate-800">{user.name}</p>
                    <p className="text-xs text-slate-400">{getRoleLabel(user.role)}</p>
                  </div>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              
              <DropdownMenuItem onClick={handleProfile} className="rounded-lg mx-1 gap-2.5">
                <User className="h-4 w-4 text-slate-400" />
                <span>Hồ sơ cá nhân</span>
              </DropdownMenuItem>
              
              <DropdownMenuItem onClick={handleSettings} className="rounded-lg mx-1 gap-2.5">
                <Settings className="h-4 w-4 text-slate-400" />
                <span>Cài đặt</span>
              </DropdownMenuItem>
              
              <DropdownMenuItem className="rounded-lg mx-1 gap-2.5">
                <Shield className="h-4 w-4 text-slate-400" />
                <span>Bảo mật</span>
              </DropdownMenuItem>
              
              <DropdownMenuItem className="rounded-lg mx-1 gap-2.5">
                <HelpCircle className="h-4 w-4 text-slate-400" />
                <span>Trợ giúp</span>
              </DropdownMenuItem>
              
              <DropdownMenuSeparator />
              
              <DropdownMenuItem onClick={handleLogout} className="rounded-lg mx-1 gap-2.5 text-rose-600 focus:text-rose-600 focus:bg-rose-50">
                <LogOut className="h-4 w-4" />
                <span>Đăng xuất</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : !isLoading ? (
          <div className="flex items-center gap-2">
            <Button variant="ghost" asChild className="rounded-xl text-slate-600 hover:text-slate-800">
              <Link href="/register">
                <span>Đăng ký</span>
              </Link>
            </Button>
            <Button asChild className="rounded-xl bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 shadow-lg shadow-teal-500/20">
              <Link href="/login">
                <LogIn className="mr-2 h-4 w-4" />
                <span>Đăng nhập</span>
              </Link>
            </Button>
          </div>
        ) : null}
      </div>
    </header>
  );
}
