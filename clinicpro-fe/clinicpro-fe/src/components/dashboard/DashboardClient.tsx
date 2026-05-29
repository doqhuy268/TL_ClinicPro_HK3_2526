"use client";

import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { ChartStatisticsCards, ChartDetailedStatisticsCards } from "@/components/dashboard/ChartStatisticsCards";
import { ChartRevenueStatistics, ChartPaymentMethodStatistics } from "@/components/dashboard/ChartRevenueStatistics";
import { PeriodSelector } from "@/components/dashboard/PeriodSelector";
import { ChartAdvancedStatistics } from "@/components/dashboard/ChartAdvancedStatistics";
import { useDashboardStatistics, usePeriodSelection } from "@/lib/hooks/use-statistics";
import { 
  useRevenueStatistics, 
  useWorkSessionStatistics, 
  useExaminationVolumeStatistics, 
  useTopServicesStatistics,
  usePaymentMethodStatistics
} from "@/lib/hooks/use-statistics";
import { PeriodType } from "@/lib/types/statistics";
import { useAuth } from "@/lib/hooks/useAuth";
import { medicationPrescriptionApi } from '@/lib/api';
import { MedicationPrescription } from '@/lib/types/medication-prescription';

export function DashboardClient() {
  const { user } = useAuth();
  const userRole = user?.role;
  const canViewFeedback = userRole === 'DOCTOR' || userRole === 'ADMIN';
  const isDoctor = userRole === 'DOCTOR';
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [feedbackDate, setFeedbackDate] = useState<string>('');
  const [feedbackUrgentFilter, setFeedbackUrgentFilter] = useState<string>('all');
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [feedbackList, setFeedbackList] = useState<MedicationPrescription[]>([]);
  const [respondDialogOpen, setRespondDialogOpen] = useState(false);
  const [selectedFeedback, setSelectedFeedback] = useState<MedicationPrescription | null>(null);
  const [responseNote, setResponseNote] = useState('');
  const [submittingResponse, setSubmittingResponse] = useState(false);

  const {
    period,
    customStartDate,
    customEndDate,
    handlePeriodChange,
    handleCustomDateChange,
    getCurrentParams
  } = usePeriodSelection('day');

  const params = useMemo(() => getCurrentParams(), [getCurrentParams]);
  
  
  // Check if user can view KPI stats
  const canViewKPI = ['ADMIN', 'RECEPTIONIST', 'DOCTOR'].includes(userRole || '');
  
  // Role-based data fetching - only call APIs if user has permission
  const dashboardStats = useDashboardStatistics(
    params.period as PeriodType, 
    params.startDate, 
    params.endDate,
    canViewKPI
  );
  
  // Revenue stats - only for ADMIN and CASHIER
  const revenueStats = useRevenueStatistics(
    params.period as PeriodType, 
    params.startDate, 
    params.endDate,
    ['ADMIN', 'CASHIER'].includes(userRole || '')
  );
  
  // Payment method stats - only for ADMIN and CASHIER
  const paymentStats = usePaymentMethodStatistics(
    params.period as PeriodType, 
    params.startDate, 
    params.endDate,
    ['ADMIN', 'CASHIER'].includes(userRole || '')
  );
  
  // Work session stats - for ADMIN, RECEPTIONIST, DOCTOR, TECHNICIAN
  const workSessionStats = useWorkSessionStatistics(
    params.period as PeriodType, 
    params.startDate, 
    params.endDate,
    ['ADMIN', 'RECEPTIONIST', 'DOCTOR', 'TECHNICIAN'].includes(userRole || '')
  );
  
  // Examination volume stats - for ADMIN, RECEPTIONIST, DOCTOR
  const examinationStats = useExaminationVolumeStatistics(
    params.period as PeriodType, 
    params.startDate, 
    params.endDate,
    ['ADMIN', 'RECEPTIONIST', 'DOCTOR'].includes(userRole || '')
  );
  
  // Top services stats - for ADMIN and RECEPTIONIST
  const topServicesStats = useTopServicesStatistics(
    params.period as PeriodType, 
    params.startDate, 
    params.endDate,
    ['ADMIN', 'RECEPTIONIST'].includes(userRole || '')
  );

  // Check permissions
  const canViewRevenue = ['ADMIN', 'CASHIER'].includes(userRole || '');
  const canViewPaymentMethods = ['ADMIN', 'CASHIER'].includes(userRole || '');
  const canViewWorkSessions = ['ADMIN', 'RECEPTIONIST', 'DOCTOR', 'TECHNICIAN'].includes(userRole || '');
  const canViewExaminationVolume = ['ADMIN', 'RECEPTIONIST', 'DOCTOR'].includes(userRole || '');
  const canViewTopServices = ['ADMIN', 'RECEPTIONIST'].includes(userRole || '');

  // Fetch feedback list for doctor/admin
  const fetchFeedback = async (params?: { date?: string; isUrgent?: boolean }) => {
    if (!canViewFeedback) return;
    try {
      setFeedbackLoading(true);
      const res =
        userRole === 'ADMIN'
          ? await medicationPrescriptionApi.getAdminFeedback(params)
          : await medicationPrescriptionApi.getMyFeedback(params);
      const data = Array.isArray(res.data?.results) ? res.data.results : res.data || [];
      setFeedbackList(data as MedicationPrescription[]);
    } catch (err) {
      console.error('Error loading feedback', err);
      toast.error('Không thể tải danh sách phản hồi');
    } finally {
      setFeedbackLoading(false);
    }
  };

  const handleRespondFeedback = (feedback: MedicationPrescription) => {
    setSelectedFeedback(feedback);
    setResponseNote('');
    setRespondDialogOpen(true);
  };

  const handleSubmitResponse = async () => {
    if (!selectedFeedback || !responseNote.trim()) {
      toast.error('Vui lòng nhập nội dung phản hồi');
      return;
    }
    try {
      setSubmittingResponse(true);
      const res = await medicationPrescriptionApi.respondFeedback(selectedFeedback.id, {
        responseNote: responseNote.trim(),
      });
      const updated = res.data?.data || res.data;
      
      // Update local state
      setFeedbackList(prev =>
        prev.map(fb => (fb.id === selectedFeedback.id ? { ...fb, ...updated } : fb))
      );
      
      toast.success('Đã gửi phản hồi thành công');
      setRespondDialogOpen(false);
      setSelectedFeedback(null);
      setResponseNote('');
    } catch (error: unknown) {
      console.error('Error responding to feedback:', error);
      const errorMessage = (error as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Không thể gửi phản hồi';
      toast.error(errorMessage);
    } finally {
      setSubmittingResponse(false);
    }
  };

  useEffect(() => {
    if (feedbackOpen) {
      const params: { date?: string; isUrgent?: boolean } = {};
      if (feedbackDate) params.date = feedbackDate;
      if (feedbackUrgentFilter === 'urgent') params.isUrgent = true;
      else if (feedbackUrgentFilter === 'normal') params.isUrgent = false;
      fetchFeedback(Object.keys(params).length > 0 ? params : undefined);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [feedbackOpen, feedbackDate, feedbackUrgentFilter]);

  return (
    <>
      {/* Period Selector + Feedback trigger */}
      <div className="space-y-3 relative">
        <PeriodSelector
          period={period}
          customStartDate={customStartDate}
          customEndDate={customEndDate}
          onPeriodChange={handlePeriodChange}
          onCustomDateChange={handleCustomDateChange}
          loading={dashboardStats.loading}
        />
        {canViewFeedback && (
          <div className="flex justify-end absolute right-3 top-1/2 -translate-y-1/2">
            <Sheet open={feedbackOpen} onOpenChange={setFeedbackOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm">
                  Xem phản hồi đơn thuốc
                </Button>
              </SheetTrigger>
              <SheetContent className="w-[520px] sm:max-w-[560px] overflow-y-auto pt-6 pb-6 px-6">
                <SheetHeader className="p-0 w-full">
                  <SheetTitle className="flex items-center justify-between">
                    <span className="text-lg font-bold">Phản hồi đơn thuốc</span>
                  </SheetTitle>
                </SheetHeader>
                <SheetClose asChild>
                  
                </SheetClose>
                <div className="mt-4 space-y-4">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Input
                      type="date"
                      value={feedbackDate}
                      onChange={(e) => setFeedbackDate(e.target.value)}
                      className="flex-1 min-w-[150px]"
                    />
                    <Select value={feedbackUrgentFilter} onValueChange={setFeedbackUrgentFilter}>
                      <SelectTrigger className="w-[140px]">
                        <SelectValue placeholder="Mức độ" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tất cả</SelectItem>
                        <SelectItem value="urgent">Khẩn cấp</SelectItem>
                        <SelectItem value="normal">Thường</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      variant="outline"
                      onClick={() => {
                        const params: { date?: string; isUrgent?: boolean } = {};
                        if (feedbackDate) params.date = feedbackDate;
                        if (feedbackUrgentFilter === 'urgent') params.isUrgent = true;
                        else if (feedbackUrgentFilter === 'normal') params.isUrgent = false;
                        fetchFeedback(Object.keys(params).length > 0 ? params : undefined);
                      }}
                      disabled={feedbackLoading}
                    >
                      {feedbackLoading ? 'Đang tải...' : 'Lọc'}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setFeedbackDate('');
                        setFeedbackUrgentFilter('all');
                        fetchFeedback();
                      }}
                    >
                      Xóa lọc
                    </Button>
                  </div>

                  {feedbackLoading ? (
                    <div className="space-y-2 text-sm text-muted-foreground">
                      <div className="h-4 w-32 bg-muted rounded animate-pulse" />
                      <div className="h-16 w-full bg-muted rounded animate-pulse" />
                    </div>
                  ) : feedbackList.length === 0 ? (
                    <div className="text-sm text-muted-foreground bg-muted/40 border rounded-lg p-4">
                      Không có phản hồi.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {feedbackList.map((fb) => (
                        <div key={fb.id} className="border rounded-lg p-3 space-y-2 bg-white shadow-sm">
                          <div className="flex items-center justify-between">
                            <div className="font-semibold text-sm">#{fb.code}</div>
                            <div className="flex items-center gap-2">
                              {fb.feedbackIsUrgent && (
                                <Badge variant="destructive" className="text-xs">Khẩn</Badge>
                              )}
                              {fb.feedbackProcessed && (
                                <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">Đã xử lý</Badge>
                              )}
                              {fb.status && (
                                <Badge variant="outline" className="text-xs">{fb.status}</Badge>
                              )}
                            </div>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {fb.patientProfile?.name || 'Bệnh nhân'}
                          </div>
                          <div className="text-sm leading-relaxed bg-gray-50 p-2 rounded border">{fb.feedbackMessage}</div>
                          {fb.feedbackResponseNote && (
                            <div className="text-sm leading-relaxed bg-blue-50 p-2 rounded border border-blue-200">
                              <div className="font-medium text-blue-900 mb-1">Phản hồi của bác sĩ:</div>
                              <div className="text-blue-800">{fb.feedbackResponseNote}</div>
                              {fb.feedbackResponseAt && (
                                <div className="text-xs text-blue-600 mt-1">
                                  {new Date(fb.feedbackResponseAt).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })}
                                </div>
                              )}
                            </div>
                          )}
                          <div className="flex items-center justify-between text-xs text-gray-500">
                            {fb.feedbackAt ? (
                              <span>Phản hồi: {new Date(fb.feedbackAt).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })}</span>
                            ) : (
                              <span>--</span>
                            )}
                            {fb.doctor?.doctorCode && userRole === 'ADMIN' && (
                              <span>BS: {fb.doctor.doctorCode}</span>
                            )}
                          </div>
                          {isDoctor && !fb.feedbackProcessed && (
                            <div className="pt-2 border-t">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleRespondFeedback(fb)}
                                className="w-full"
                              >
                                Trả lời phản hồi
                              </Button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        )}
      </div>

      {/* KPI Statistics - Available for ADMIN, RECEPTIONIST, DOCTOR */}
      {canViewKPI && (
        <>
          {/* Main Statistics Cards */}
          <ChartStatisticsCards
            data={dashboardStats.kpi.data}
            loading={dashboardStats.loading}
            error={dashboardStats.error}
          />

          {/* Detailed Statistics Cards */}
          <ChartDetailedStatisticsCards
            data={dashboardStats.kpi.data}
            loading={dashboardStats.loading}
            error={dashboardStats.error}
            period={params.period}
            startDate={params.startDate}
            endDate={params.endDate}
          />
        </>
      )}

      {/* Revenue Statistics - Only for ADMIN and CASHIER */}
      {canViewRevenue && (
        <ChartRevenueStatistics
          data={revenueStats.data}
          loading={revenueStats.loading}
          error={revenueStats.error}
        />
      )}

      {/* Payment Method Statistics - Only for ADMIN and CASHIER */}
      {canViewPaymentMethods && (
        <ChartPaymentMethodStatistics
          data={paymentStats.data}
          loading={paymentStats.loading}
          error={paymentStats.error}
        />
      )}

      {/* Advanced Statistics - Role-based tabs */}
      {(canViewWorkSessions || canViewExaminationVolume || canViewTopServices) && (
        <ChartAdvancedStatistics
          workSessionData={workSessionStats.data}
          examinationData={examinationStats.data}
          topServicesData={topServicesStats.data}
          patientSpendingData={null} // Patient spending moved to main-layout
          loading={workSessionStats.loading || examinationStats.loading || topServicesStats.loading}
          error={workSessionStats.error || examinationStats.error || topServicesStats.error}
          userRole={userRole}
          period={params.period}
          startDate={params.startDate}
          endDate={params.endDate}
        />
      )}

      {/* Respond Feedback Dialog */}
      <Dialog open={respondDialogOpen} onOpenChange={setRespondDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Trả lời phản hồi đơn thuốc #{selectedFeedback?.code}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {selectedFeedback?.feedbackMessage && (
              <div className="bg-gray-50 p-3 rounded border">
                <div className="text-sm font-medium mb-1">Phản hồi từ bệnh nhân:</div>
                <div className="text-sm text-gray-700">{selectedFeedback.feedbackMessage}</div>
                {selectedFeedback.feedbackIsUrgent && (
                  <Badge variant="destructive" className="text-xs mt-2">Khẩn cấp</Badge>
                )}
              </div>
            )}
            <div className="space-y-2">
              <label className="text-sm font-medium">Nội dung phản hồi</label>
              <Textarea
                value={responseNote}
                onChange={(e) => setResponseNote(e.target.value)}
                rows={4}
                placeholder="Nhập phản hồi cho bệnh nhân..."
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setRespondDialogOpen(false);
                  setSelectedFeedback(null);
                  setResponseNote('');
                }}
                disabled={submittingResponse}
              >
                Hủy
              </Button>
              <Button onClick={handleSubmitResponse} disabled={submittingResponse}>
                {submittingResponse ? 'Đang gửi...' : 'Gửi phản hồi'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

    </>
  );
}
