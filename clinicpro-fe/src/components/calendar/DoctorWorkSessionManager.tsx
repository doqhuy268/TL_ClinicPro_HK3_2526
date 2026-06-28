'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Calendar, Clock, Edit, Trash2, CheckCircle, XCircle, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { DoctorAppointmentsPanel } from '@/components/calendar/DoctorAppointmentsPanel';
import { WorkSession, WorkSessionStatus } from '@/lib/types/work-session';
import { workSessionApi } from '@/lib/api';

interface DoctorWorkSessionManagerProps {
  workSessions: WorkSession[];
  onUpdateStatus: (sessionId: string, status: string) => void;
  onEdit: (session: WorkSession) => void;
  onDelete: (sessionId: string) => void;
  loading?: boolean;
  currentDoctorId: string;
  user?: {
    id: string;
    email?: string;
    phone?: string;
  };
}

const statusConfig = {
  PENDING: {
    label: 'Chờ duyệt',
    color: 'bg-amber-100 text-amber-800 border-amber-200',
    icon: AlertCircle,
  },
  APPROVED: {
    label: 'Đã duyệt',
    color: 'bg-green-100 text-green-800 border-green-200',
    icon: CheckCircle,
  },
  IN_PROGRESS: {
    label: 'Đang tiến hành',
    color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    icon: Clock,
  },
  CANCELED: {
    label: 'Đã hủy',
    color: 'bg-red-100 text-red-800 border-red-200',
    icon: XCircle,
  },
  COMPLETED: {
    label: 'Hoàn thành',
    color: 'bg-green-100 text-green-800 border-green-200',
    icon: CheckCircle,
  },
};

export function DoctorWorkSessionManager({
  workSessions,
  onUpdateStatus,
  onEdit,
  onDelete,
  loading = false,
  currentDoctorId,
  user,
}: DoctorWorkSessionManagerProps) {
  const [showManager, setShowManager] = useState(false);
  const [showAppointments, setShowAppointments] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [sortBy] = useState<'date' | 'status'>('date');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(20);
  const [doctorSessions, setDoctorSessions] = useState<WorkSession[]>([]);
  const [loadingSessions, setLoadingSessions] = useState<boolean>(false);

  // Load doctor's own sessions
  useEffect(() => {
    const loadDoctorSessions = async () => {
      if (!currentDoctorId) return;
      try {
        setLoadingSessions(true);
        const params: { startDate?: string; endDate?: string } = {};
        if (dateFrom) params.startDate = dateFrom;
        if (dateTo) params.endDate = dateTo;
        const resp = await workSessionApi.getMySchedule(params);
        const data = resp.data?.data || resp.data || [];
        setDoctorSessions(Array.isArray(data) ? data : []);
        setPage(1);
      } catch (error) {
        console.error('Error loading doctor sessions:', error);
        setDoctorSessions([]);
      } finally {
        setLoadingSessions(false);
      }
    };
    loadDoctorSessions();
  }, [currentDoctorId, dateFrom, dateTo]);

  // Use doctorSessions if available, otherwise fallback to workSessions prop filtered by current doctor
  const sessionsToUse = doctorSessions.length > 0 ? doctorSessions : 
    workSessions.filter(session => {
      // Try multiple ways to match the doctor
      return session.doctor?.id === currentDoctorId || 
             session.doctor?.auth?.email === user?.email ||
             session.doctor?.auth?.phone === user?.phone;
    });

  // Filter sessions by status
  const filteredSessions = sessionsToUse.filter(session => {
    if (filterStatus === 'ALL') return true;
    return session.status === filterStatus;
  });

  // Date range filter
  const dateFilteredSessions = filteredSessions.filter((s) => {
    const d = new Date(s.startTime);
    const afterFrom = dateFrom ? d >= new Date(`${dateFrom}T00:00:00+07:00`) : true;
    const beforeTo = dateTo ? d <= new Date(`${dateTo}T23:59:59+07:00`) : true;
    return afterFrom && beforeTo;
  });

  // Sort sessions
  const sortedSessions = [...dateFilteredSessions].sort((a, b) => {
    switch (sortBy) {
      case 'date':
    return new Date(a.startTime).getTime() - new Date(b.startTime).getTime();
      case 'status':
        return a.status.localeCompare(b.status);
      default:
        return 0;
    }
  });

  // Pagination
  const totalItems = sortedSessions.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const currentPage = Math.min(page, totalPages);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedSessions = sortedSessions.slice(startIndex, endIndex);

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('vi-VN', {
      timeZone: 'Asia/Ho_Chi_Minh',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      timeZone: 'Asia/Ho_Chi_Minh',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const getStatusConfig = (status: WorkSessionStatus) => {
    if (status in statusConfig) {
      return statusConfig[status as keyof typeof statusConfig];
    }
    return statusConfig.PENDING;
  };

  return (
    <>
      {/* Toggle Button */}
      <Button
        onClick={() => setShowManager(true)}
        variant="outline"
        className="fixed bottom-6 right-6 z-50 shadow-lg"
      >
        <Calendar className="h-4 w-4 mr-2" />
        Lịch làm việc của tôi
      </Button>
      <Button
        onClick={() => setShowAppointments(true)}
        variant="outline"
        className="fixed bottom-20 right-6 z-50 shadow-lg"
      >
        <Calendar className="h-4 w-4 mr-2" />
        Lịch hẹn của tôi
      </Button>

      {/* Sidebar Manager */}
      <Sheet open={showManager} onOpenChange={setShowManager}>
        <SheetContent side="right" className="bg-white w-[92vw] md:w-[85vw] lg:w-[80vw] xl:w-[75vw] 2xl:w-[75vw] max-w-none sm:max-w-none p-0">
          <SheetHeader className="px-10 py-6 border-b">
            <SheetTitle className="flex items-center gap-3 text-xl">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Calendar className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <div className="font-semibold">Lịch làm việc của tôi</div>
                
              </div>
            </SheetTitle>
          </SheetHeader>

          <div className="flex-1 flex flex-col space-y-6 overflow-hidden px-10 py-6 h-[calc(100vh-88px)]">
            {/* Filters and Controls */}
            <div className="bg-white p-2.5 rounded-lg border">
              <div className="flex flex-wrap gap-6 items-center">
                <div className="flex items-center gap-3">
                  <label className="text-sm font-semibold text-gray-700 min-w-fit">Lọc theo trạng thái:</label>
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-60 h-10 bg-white border-gray-300">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">Tất cả trạng thái</SelectItem>
                      <SelectItem value="PENDING">Chờ duyệt</SelectItem>
                      <SelectItem value="APPROVED">Đã duyệt</SelectItem>
                      <SelectItem value="IN_PROGRESS">Đang tiến hành</SelectItem>
                      <SelectItem value="CANCELED">Đã hủy</SelectItem>
                      <SelectItem value="COMPLETED">Hoàn thành</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center gap-3">
                  <label className="text-sm font-semibold text-gray-700 min-w-fit">Khoảng ngày:</label>
                  <input 
                    type="date" 
                    value={dateFrom} 
                    onChange={(e) => { setPage(1); setDateFrom(e.target.value); }} 
                    className="h-10 px-2 border rounded bg-white" 
                  />
                  <span className="text-gray-500">-</span>
                  <input 
                    type="date" 
                    value={dateTo} 
                    onChange={(e) => { setPage(1); setDateTo(e.target.value); }} 
                    className="h-10 px-2 border rounded bg-white" 
                  />
                </div>

                <div className="ml-auto grid grid-cols-3 gap-3">
                  <div className="text-xs text-gray-600 bg-white px-3 py-2 rounded-lg border">
                    <div className="font-medium text-gray-800">Tổng</div>
                    <div className="text-base font-semibold">{sessionsToUse.length}</div>
                  </div>
                  <div className="text-xs text-gray-600 bg-white px-3 py-2 rounded-lg border">
                    <div className="font-medium text-gray-800">Chờ duyệt</div>
                    <div className="text-base font-semibold">{sessionsToUse.filter(s => s.status === 'PENDING').length}</div>
                  </div>
                  <div className="text-xs text-gray-600 bg-white px-3 py-2 rounded-lg border">
                    <div className="font-medium text-gray-800">Hoàn thành</div>
                    <div className="text-base font-semibold">{sessionsToUse.filter(s => s.status === 'COMPLETED').length}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Work Sessions Table */}
            <div className="flex-1 overflow-hidden">
              <Card className="h-full flex flex-col">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-800">Danh sách lịch làm việc</h3>
                    <div className="text-sm text-gray-500">
                      Hiển thị {Math.min(endIndex, totalItems)} / {totalItems}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 p-0 overflow-hidden">
                  <div className="h-full overflow-auto">
                    <Table>
                      <TableHeader className="sticky top-0 bg-gray-50 z-10">
                        <TableRow className="border-b-2">
                          <TableHead className="font-semibold text-gray-700 py-4 w-[15%]">Ngày</TableHead>
                          <TableHead className="font-semibold text-gray-700 py-4 w-[15%]">Thời gian</TableHead>
                          <TableHead className="font-semibold text-gray-700 py-4 w-[35%]">Dịch vụ</TableHead>
                          <TableHead className="font-semibold text-gray-700 py-4 w-[15%]">Booth</TableHead>
                          <TableHead className="font-semibold text-gray-700 py-4 w-[10%]">Trạng thái</TableHead>
                          <TableHead className="font-semibold text-gray-700 py-4 text-center w-[10%]">Thao tác</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {loading || loadingSessions ? (
                          <TableRow>
                            <TableCell colSpan={6} className="text-center py-12">
                              <div className="flex flex-col items-center justify-center space-y-3">
                                <div className="animate-spin rounded-full h-8 w-8 border-4 border-gray-200 border-t-[#0F766E]"></div>
                                <div className="text-gray-500">Đang tải dữ liệu...</div>
                              </div>
                            </TableCell>
                          </TableRow>
                        ) : sortedSessions.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={6} className="text-center py-12">
                              <div className="flex flex-col items-center justify-center space-y-3">
                                <Calendar className="h-12 w-12 text-gray-300" />
                                <div className="text-gray-500 text-lg">Không có lịch làm việc nào</div>
                                <div className="text-gray-400 text-sm">Hãy tạo lịch làm việc mới để bắt đầu</div>
                              </div>
                            </TableCell>
                          </TableRow>
                        ) : (
                          paginatedSessions.map((session, index) => {
                            const statusConfig = getStatusConfig(session.status);
                            const StatusIcon = statusConfig.icon;

                            return (
                              <TableRow 
                                key={session.id} 
                                className={`hover:bg-gray-50 transition-colors ${
                                  index % 2 === 0 ? 'bg-white' : 'bg-gray-25'
                                }`}
                              >
                                <TableCell className="py-4">
                                  <div className="flex items-center gap-2">
                                    <Calendar className="h-4 w-4 text-gray-400" />
                                    <span className="font-medium">{formatDate(session.startTime)}</span>
                                  </div>
                                </TableCell>
                                <TableCell className="py-4">
                                  <div className="flex items-center gap-2">
                                    <Clock className="h-4 w-4 text-gray-400" />
                                    <span className="font-medium">
                                      {formatTime(session.startTime)} - {formatTime(session.endTime)}
                                    </span>
                                  </div>
                                </TableCell>
                                <TableCell className="py-4">
                                  <div className="max-w-xl">
                                    {session.services.length > 0 ? (
                                      <div className="flex flex-wrap gap-1.5">
                                        {session.services.map((s, idx) => (
                                          <span key={idx} className="text-xs bg-gray-100 px-2 py-1 rounded-full text-gray-700 border border-gray-200">
                                            {s.service?.name || 'Unknown'}
                                          </span>
                                        ))}
                                      </div>
                                    ) : (
                                      <span className="text-sm text-gray-400 italic">Không có dịch vụ</span>
                                    )}
                                  </div>
                                </TableCell>
                                <TableCell className="py-4">
                                  <div className="text-sm">
                                    {session.booth?.name ? (
                                      <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
                                        {session.booth.name}
                                      </span>
                                    ) : (
                                      <span className="text-gray-400 italic">Chưa phân công</span>
                                    )}
                                  </div>
                                </TableCell>
                                <TableCell className="py-4">
                                  <Badge className={`${statusConfig.color} font-medium`}>
                                    <StatusIcon className="h-3 w-3 mr-1" />
                                    {statusConfig.label}
                                  </Badge>
                                </TableCell>
                                <TableCell className="py-4">
                                  <div className="flex items-center justify-center gap-2">
                                    {/* Doctor can only change to CANCELED status */}
                                    {session.status === 'CANCELED' ? (
                                      <div className="w-36 h-9 flex items-center justify-center text-xs bg-gray-50 rounded border">
                                        {getStatusConfig(session.status).label}
                                      </div>
                                    ) : (
                                      <Select
                                        value={session.status}
                                        onValueChange={(value) => onUpdateStatus(session.id, value)}
                                      >
                                        <SelectTrigger className="w-36 h-9 text-xs">
                                          <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value={session.status}>
                                            {getStatusConfig(session.status).label}
                                          </SelectItem>
                                          <SelectItem value="CANCELED">Đã hủy</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    )}
                                    
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => onEdit(session)}
                                      className="h-9 w-9 p-0"
                                      title="Chỉnh sửa"
                                    >
                                      <Edit className="h-4 w-4" />
                                    </Button>
                                    
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => onDelete(session.id)}
                                      className="h-9 w-9 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 hover:border-red-300"
                                      title="Xóa"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            );
                          })
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </div>
            

            {/* Pagination Controls */}
            <div className="flex items-center justify-between py-3">
              <div className="text-sm text-gray-600">
                Trang {currentPage}/{totalPages}
              </div>
              <div className="flex items-center gap-2">
                <Select value={String(pageSize)} onValueChange={(v) => { setPage(1); setPageSize(Number(v)); }}>
                  <SelectTrigger className="w-[140px] h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10 / trang</SelectItem>
                    <SelectItem value="20">20 / trang</SelectItem>
                    <SelectItem value="50">50 / trang</SelectItem>
                    <SelectItem value="100">100 / trang</SelectItem>
                  </SelectContent>
                </Select>
                <Button 
                  variant="outline" 
                  size="sm" 
                  disabled={currentPage <= 1} 
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  disabled={currentPage >= totalPages} 
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Appointments Sidebar */}
      <Sheet open={showAppointments} onOpenChange={setShowAppointments}>
        <SheetContent side="right" className="bg-white w-[92vw] md:w-[70vw] lg:w-[50vw] xl:w-[45vw] 2xl:w-[40vw] max-w-none sm:max-w-none p-0">
          <SheetHeader className="px-8 py-5 border-b">
            <SheetTitle className="flex items-center gap-3 text-lg">
              <div className="p-2 bg-emerald-100 rounded-lg">
                <Calendar className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <div className="font-semibold">Lịch hẹn của tôi</div>
                
              </div>
            </SheetTitle>
          </SheetHeader>
          <div className="px-8 py-5">
            <DoctorAppointmentsPanel asSheet />
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
