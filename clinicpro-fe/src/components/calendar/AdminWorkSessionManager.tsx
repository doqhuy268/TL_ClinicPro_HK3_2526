'use client';

import { useEffect, useMemo, useState, useCallback } from 'react';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Calendar, Clock, User, Edit, CheckCircle, XCircle, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { WorkSession, WorkSessionStatus } from '@/lib/types/work-session';
import { adminApi, workSessionApi } from '@/lib/api';
// import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';

interface AdminWorkSessionManagerProps {
  workSessions: WorkSession[];
  onUpdateStatus: (sessionId: string, status: string) => void;
  onEdit: (session: WorkSession) => void;
  onDelete: (sessionId: string) => void;
  loading?: boolean;
  selectedDoctorId?: string | null;
  onSelectDoctor?: (doctorId: string | null) => void;
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

export function AdminWorkSessionManager({
  workSessions,
  onUpdateStatus,
  onEdit,
  loading = false,
  selectedDoctorId: controlledDoctorId,
  onSelectDoctor,
}: AdminWorkSessionManagerProps) {
  const [showManager, setShowManager] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [sortBy,] = useState<'date' | 'status' | 'doctor'>('date');
  const [internalDoctorId, setInternalDoctorId] = useState<string | null>(null);
  const [doctors, setDoctors] = useState<Array<{ id: string; name: string; email?: string; doctorCode: string }>>([]);
  const [doctorSearch, setDoctorSearch] = useState('');
  const [loadingDoctors, setLoadingDoctors] = useState(false);
  // Client-side filters & pagination for large datasets
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(20);
  const [doctorSessions, setDoctorSessions] = useState<WorkSession[]>([]);
  const [loadingSessions, setLoadingSessions] = useState<boolean>(false);

  const selectedDoctorId = controlledDoctorId ?? internalDoctorId;

  useEffect(() => {
    if (!showManager) return;
    const loadDoctors = async () => {
      try {
        setLoadingDoctors(true);
        // Fetch all doctors via pagination to avoid missing users
        const pageSize = 100;
        let page = 1;
        const all: Array<{ id: string; name: string; email?: string; doctorCode: string }> = [];
        // Loop until no more results
        while (true) {
          const resp = await adminApi.getAllUsers({ role: 'DOCTOR', page, limit: pageSize });
          const dataPage = resp.data?.data || resp.data || [];
          const meta = resp.data?.meta;
          type DoctorLite = { id: string; name: string; email?: string; doctorCode?: string };
          const normalizedPage = (Array.isArray(dataPage) ? (dataPage as DoctorLite[]) : []).map((d) => ({
            id: d.id,
            name: d.name,
            email: d.email,
            doctorCode: d.doctorCode || '',
          }));
          all.push(...normalizedPage);
          // Break conditions
          if (normalizedPage.length < pageSize) break;
          if (meta?.total && page * pageSize >= meta.total) break;
          page += 1;
        }
        setDoctors(all);
      } catch {
        setDoctors([]);
      } finally {
        setLoadingDoctors(false);
      }
    };
    loadDoctors();
  }, [showManager]);

  useEffect(() => {
    const loadDoctorSessions = async () => {
      if (!selectedDoctorId) return;
      try {
        setLoadingSessions(true);
        const params: { userType: 'DOCTOR'; startDate?: string; endDate?: string } = { userType: 'DOCTOR' };
        if (dateFrom) params.startDate = dateFrom;
        if (dateTo) params.endDate = dateTo;
        const resp = await workSessionApi.getUserWorkSessions(selectedDoctorId, params);
        const data = resp.data?.data || resp.data || [];
        setDoctorSessions(Array.isArray(data) ? data : []);
        setPage(1);
      } catch {
        setDoctorSessions([]);
      } finally {
        setLoadingSessions(false);
      }
    };
    loadDoctorSessions();
  }, [selectedDoctorId, dateFrom, dateTo]);

  // Handle status update with reload for doctor-specific view
  const handleStatusUpdate = useCallback(async (sessionId: string, status: string) => {
    try {
      await onUpdateStatus(sessionId, status);
      // If viewing a specific doctor's sessions, reload doctorSessions to reflect the change
      if (selectedDoctorId) {
        const params: { userType: 'DOCTOR'; startDate?: string; endDate?: string } = { userType: 'DOCTOR' };
        if (dateFrom) params.startDate = dateFrom;
        if (dateTo) params.endDate = dateTo;
        try {
          setLoadingSessions(true);
          const resp = await workSessionApi.getUserWorkSessions(selectedDoctorId, params);
          const data = resp.data?.data || resp.data || [];
          setDoctorSessions(Array.isArray(data) ? data : []);
        } catch (err) {
          console.error('Failed to reload doctor sessions:', err);
        } finally {
          setLoadingSessions(false);
        }
      }
      // If viewing all sessions, workSessions from props will be updated by parent
    } catch (err) {
      // Error is handled by parent component
      throw err;
    }
  }, [onUpdateStatus, selectedDoctorId, dateFrom, dateTo]);

  const filteredDoctors = useMemo(() => {
    const q = doctorSearch.toLowerCase();
    return doctors.filter(d =>
      d.name?.toLowerCase().includes(q) ||
      d.email?.toLowerCase().includes(q) ||
      d.doctorCode?.toLowerCase().includes(q)
    );
  }, [doctors, doctorSearch]);

  const filteredSessions = (selectedDoctorId ? doctorSessions : workSessions).filter(session => {
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

  const sortedSessions = [...dateFilteredSessions].sort((a, b) => {
    switch (sortBy) {
      case 'date':
    return new Date(a.startTime).getTime() - new Date(b.startTime).getTime();
      case 'status':
        return a.status.localeCompare(b.status);
      case 'doctor':
        const doctorA = a.doctor?.name || '';
        const doctorB = b.doctor?.name || '';
        return doctorA.localeCompare(doctorB);
      default:
        return 0;
    }
  });

  // Pagination (client-side)
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
        Quản lý lịch làm việc
      </Button>

      {/* Sidebar Manager */}
      <Sheet open={showManager} onOpenChange={setShowManager}>
        <SheetContent side="right" className="bg-white w-[92vw] md:w-[92vw] lg:w-[85vw] xl:w-[80vw] 2xl:w-[75vw] max-w-none sm:max-w-none p-0">
          <SheetHeader className="px-10 py-6 border-b">
            <SheetTitle className="flex items-center gap-3 text-xl">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Calendar className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <div className="font-semibold">Quản lý lịch làm việc</div>
                <div className="text-sm font-normal text-gray-600 mt-1">
                  Quản lý và theo dõi tất cả lịch làm việc của bác sĩ
                </div>
              </div>
            </SheetTitle>
          </SheetHeader>

          <div className="flex-1 flex flex-col space-y-6 overflow-hidden px-10 py-6 h-[calc(100vh-88px)]">
            {/* Step 1: Doctor selection when none selected */}
            {!selectedDoctorId && (
              <div className="bg-white p-2.5 rounded-lg">
                <div className="flex items-center justify-between mb-4">
                  <div className="text-base font-semibold text-gray-800 pl-2">Danh sách bác sĩ</div>
                  <div className="w-80">
                    <Input
                      placeholder="Tìm kiếm theo tên, email hoặc mã bác sĩ..."
                      value={doctorSearch}
                      onChange={(e) => setDoctorSearch(e.target.value)}
                      className="h-10"
                    />
                  </div>
                </div>
                <div className="border rounded-lg bg-white max-h-[70vh] overflow-y-auto p-0">
                  {loadingDoctors ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="animate-spin rounded-full h-8 w-8 border-4 border-gray-200 border-t-[#0F766E]"></div>
                    </div>
                  ) : filteredDoctors.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">Không có bác sĩ nào</div>
                  ) : (
                    <div className="divide-y">
                      {filteredDoctors.map((d) => (
                        <button
                          key={d.id}
                          type="button"
                          className="w-full text-left px-4 py-3 hover:bg-gray-50 focus:bg-gray-50 transition-colors"
                          onClick={() => {
                            setInternalDoctorId(d.id);
                            onSelectDoctor?.(d.id);
                          }}
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-[#0F766E]/10 flex items-center justify-center shrink-0">
                              <User className="h-5 w-5 text-[#0F766E]" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="font-medium text-gray-900 truncate" title={d.name}>{d.name}</div>
                              <div className="text-xs text-gray-500 truncate" title={d.email || ''}>{d.email || '—'}</div>
                            </div>
                            <div className="text-[11px] text-gray-500 whitespace-nowrap">Nhấn để xem lịch</div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Step 2: Filters and list when doctor selected */}
            {selectedDoctorId && (
              <>
                <div className="flex items-end justify-end h-2">
                
                    <Button variant="outline" size="sm" onClick={() => { setInternalDoctorId(null); onSelectDoctor?.(null); }}>Hủy chọn</Button>
               
                </div>

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
                      <input type="date" value={dateFrom} onChange={(e)=>{ setPage(1); setDateFrom(e.target.value); }} className="h-10 px-2 border rounded bg-white" />
                      <span className="text-gray-500">-</span>
                      <input type="date" value={dateTo} onChange={(e)=>{ setPage(1); setDateTo(e.target.value); }} className="h-10 px-2 border rounded bg-white" />
                    </div>

                   

                    <div className="ml-auto grid grid-cols-3 gap-3">
                      <div className="text-xs text-gray-600 bg-white px-3 py-2 rounded-lg border">
                        <div className="font-medium text-gray-800">Tổng</div>
                        <div className="text-base font-semibold">{sortedSessions.length}</div>
                      </div>
                      <div className="text-xs text-gray-600 bg-white px-3 py-2 rounded-lg border">
                        <div className="font-medium text-gray-800">Chờ duyệt</div>
                        <div className="text-base font-semibold">{filteredSessions.filter(s=>s.status==='PENDING').length}</div>
                      </div>
                      <div className="text-xs text-gray-600 bg-white px-3 py-2 rounded-lg border">
                        <div className="font-medium text-gray-800">Đã hủy</div>
                        <div className="text-base font-semibold">{filteredSessions.filter(s=>s.status==='CANCELED').length}</div>
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
                          <TableHead className="font-semibold text-gray-700 py-4 w-[18%]">Bác sĩ</TableHead>
                          <TableHead className="font-semibold text-gray-700 py-4 w-[12%]">Ngày</TableHead>
                          <TableHead className="font-semibold text-gray-700 py-4 w-[14%]">Thời gian</TableHead>
                          <TableHead className="font-semibold text-gray-700 py-4 w-[30%]">Dịch vụ</TableHead>
                          <TableHead className="font-semibold text-gray-700 py-4 w-[12%]">Booth</TableHead>
                          <TableHead className="font-semibold text-gray-700 py-4 w-[10%]">Trạng thái</TableHead>
                          <TableHead className="font-semibold text-gray-700 py-4 text-center w-[8%]">Thao tác</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {loading || loadingSessions ? (
                          <TableRow>
                            <TableCell colSpan={7} className="text-center py-12">
                              <div className="flex flex-col items-center justify-center space-y-3">
                                <div className="animate-spin rounded-full h-8 w-8 border-4 border-gray-200 border-t-[#0F766E]"></div>
                                <div className="text-gray-500">Đang tải dữ liệu...</div>
                              </div>
                            </TableCell>
                          </TableRow>
                        ) : sortedSessions.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={7} className="text-center py-12">
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
                                  <div className="flex items-center gap-3">
                                    <div className="p-2 bg-blue-100 rounded-full">
                                      <User className="h-4 w-4 text-blue-600" />
                                    </div>
                                    <div>
                                      <div className="font-semibold text-gray-800">
                                        {session.doctor?.auth.name || 'Không xác định'}
                                      </div>
                                      <div className="text-sm text-gray-500">
                                        {session.doctor?.doctorCode || 'Chưa có mã bác sĩ'}
                                      </div>
                                    </div>
                                  </div>
                                </TableCell>
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
                                    <Select
                                      value={session.status}
                                      onValueChange={(value) => handleStatusUpdate(session.id, value)}
                                    >
                                      <SelectTrigger className="w-36 h-9 text-xs">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="PENDING">Chờ duyệt</SelectItem>
                                        <SelectItem value="APPROVED">Đã duyệt</SelectItem>
                                        {/* <SelectItem value="IN_PROGRESS">Đang tiến hành</SelectItem> */}
                                        <SelectItem value="CANCELED">Đã hủy</SelectItem>
                                        {/* <SelectItem value="COMPLETED">Hoàn thành</SelectItem> */}
                                      </SelectContent>
                                    </Select>
                                    
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => onEdit(session)}
                                      className="h-9 w-9 p-0 "
                                      title="Chỉnh sửa"
                                    >
                                      <Edit className="h-4 w-4" />
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
                <Select value={String(pageSize)} onValueChange={(v)=>{ setPage(1); setPageSize(Number(v)); }}>
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
                <Button variant="outline" size="sm" disabled={currentPage<=1} onClick={()=>setPage(p=>Math.max(1,p-1))}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" disabled={currentPage>=totalPages} onClick={()=>setPage(p=>Math.min(totalPages,p+1))}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
              </>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
