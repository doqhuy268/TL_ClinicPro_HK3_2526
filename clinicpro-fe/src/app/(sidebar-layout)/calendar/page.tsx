'use client';

import { useState, useMemo, useEffect } from 'react';
import { toast } from 'sonner';
import { CalendarHeader } from '@/components/calendar/CalendarHeader';
import { CalendarStats } from '@/components/calendar/CalendarStats';
import { CalendarErrorDisplay } from '@/components/calendar/CalendarErrorDisplay';
import { WorkSessionCalendar } from '@/components/calendar/WorkSessionCalendar';
import { WorkSessionForm } from '@/components/calendar/WorkSessionForm';
import { WorkSessionDetails } from '@/components/calendar/WorkSessionDetails';
import { useWorkSessionCalendar } from '@/lib/hooks/useWorkSessionCalendar';
import { WorkSession, WorkSessionFormData, CalendarEvent } from '@/lib/types/work-session';
import { useAuth, useIsAdmin, useIsDoctor, useIsTechnician } from '@/lib/hooks/useAuth';
import { AdminWorkSessionManager } from '@/components/calendar/AdminWorkSessionManager';
import { DoctorWorkSessionManager } from '@/components/calendar/DoctorWorkSessionManager';
import { DoctorAppointmentsPanel } from '@/components/calendar/DoctorAppointmentsPanel';
import { AdminAppointmentsSheet } from '@/components/calendar/AdminAppointmentsSheet';

export default function CalendarPage() {
  const [showForm, setShowForm] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [editingSession, setEditingSession] = useState<WorkSession | null>(null);
  const [selectedSession, setSelectedSession] = useState<WorkSession | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedDoctorId, setSelectedDoctorId] = useState<string | null>(null);
  const [, setShowDoctorList] = useState(false);
  // Filtered events from WorkSessionCalendar (for stats)
  const [filteredCalendarEvents, setFilteredCalendarEvents] = useState<CalendarEvent[]>([]);
  const [showAdminAppointments, setShowAdminAppointments] = useState(false);

  // Auth hooks
  const { isLoading: authLoading, user } = useAuth();
  const isAdmin = useIsAdmin();
  const isDoctor = useIsDoctor();
  const isTechnician = useIsTechnician();

  // Check if user has access to calendar
  const hasCalendarAccess = isAdmin || isDoctor || isTechnician;

  const {
    workSessions,
    services,
    calendarEvents,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    selectedDate: currentDate,
    viewMode,
    loading,
    error,
    setViewMode,
    clearError,
    handleCreateWorkSession,
    handleUpdateWorkSession,
    handleDeleteWorkSession,
    refreshCalendar,
    // Admin-specific functions
    handleUpdateWorkSessionStatus,
    handleCreateWorkSessionForUser,
    handleUpdateWorkSessionForUser,
    handleDeleteWorkSessionForUser,
  } = useWorkSessionCalendar({
    selectedDoctorId: isAdmin ? selectedDoctorId : undefined,
    isAdmin,
    // Only fetch when auth finished determining roles
    isReady: !authLoading,
  });

  // Filter work sessions by specialty for stats (based on filtered events)
  // If filteredCalendarEvents is not set or empty, use all work sessions
  const filteredWorkSessions = useMemo((): WorkSession[] => {
    // If filteredCalendarEvents hasn't been set yet (initial state), use all work sessions
    if (filteredCalendarEvents.length === 0) {
      // Check if we have calendarEvents but no filtered events - means no filter applied
      if (calendarEvents.length > 0) {
        return workSessions;
      }
      // Otherwise, return empty array (still loading)
      return [];
    }
    // Extract work session IDs from filtered events
    const filteredEventIds = new Set(filteredCalendarEvents.map(e => e.id));
    return workSessions.filter((session) => {
      return filteredEventIds.has(session.id);
    });
  }, [workSessions, filteredCalendarEvents, calendarEvents.length]);

  // Auto-update selectedSession when workSessions change (e.g., after status update)
  useEffect(() => {
    if (selectedSession?.id && showDetails) {
      const updatedSession = workSessions.find(s => s.id === selectedSession.id);
      if (updatedSession) {
        // Update if status or other key fields changed
        if (
          updatedSession.status !== selectedSession.status ||
          updatedSession.startTime !== selectedSession.startTime ||
          updatedSession.endTime !== selectedSession.endTime
        ) {
          setSelectedSession(updatedSession);
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workSessions, showDetails]);

  // Access control - redirect if no permission
  if (!hasCalendarAccess) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Không có quyền truy cập</h1>
          <p className="text-gray-600">Bạn không có quyền xem trang quản lý lịch làm việc.</p>
        </div>
      </div>
    );
  }

  // Handle calendar event click
  const handleEventClick = (workSession: WorkSession) => {
    setSelectedSession(workSession);
    setShowDetails(true);
  };

  // Handle date selection for creating new session
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleDateSelect = (date: Date, allDay: boolean) => {
    // Normalize the date to UTC midnight to ensure consistency
    // FullCalendar with timeZone="UTC" may return dates with time components
    // We want just the date part (year, month, day) without time
    const normalizedDate = new Date(Date.UTC(
      date.getUTCFullYear(),
      date.getUTCMonth(),
      date.getUTCDate(),
      0, 0, 0, 0
    ));
    setSelectedDate(normalizedDate);
    setEditingSession(null);
    setShowForm(true);
  };

  // Handle form submission
  const handleFormSubmit = async (formData: WorkSessionFormData) => {
    try {
      if (editingSession) {
        if (isAdmin && selectedDoctorId) {
          await handleUpdateWorkSessionForUser(editingSession.id, formData, selectedDoctorId);
        } else if (isAdmin) {
          toast.error('Vui lòng chọn bác sĩ trước khi cập nhật lịch.');
          return;
        } else {
          await handleUpdateWorkSession(editingSession.id, formData);
        }
        toast.success('Cập nhật lịch làm việc thành công!');
      } else {
        if (isAdmin && selectedDoctorId) {
          await handleCreateWorkSessionForUser(formData, selectedDoctorId);
        } else if (isAdmin) {
          toast.error('Vui lòng chọn bác sĩ trước khi tạo lịch.');
          return;
        } else {
          await handleCreateWorkSession(formData);
        }
        toast.success('Tạo lịch làm việc thành công!');
      }
      setShowForm(false);
      setEditingSession(null);
      setSelectedDate(null);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string | string[] } } })?.response?.data?.message ||
        (err instanceof Error ? err.message : null) ||
        'Có lỗi xảy ra';
      toast.error(Array.isArray(msg) ? msg.join(', ') : msg);
    }
  };

  // Handle edit session
  const handleEditSession = (session: WorkSession) => {
    setEditingSession(session);
    setShowDetails(false);
    setShowForm(true);
  };

  // Handle delete session
  const handleDeleteSession = async (sessionId: string) => {
    try {
      if (isAdmin && selectedDoctorId) {
        await handleDeleteWorkSessionForUser(sessionId, selectedDoctorId);
      } else {
        await handleDeleteWorkSession(sessionId);
      }
      toast.success('Xóa lịch làm việc thành công!');
      setShowDetails(false);
      setSelectedSession(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Có lỗi xảy ra khi xóa');
    }
  };



  const handleStatusUpdate = async (sessionId: string, status: string) => {
    try {
      await handleUpdateWorkSessionStatus(sessionId, status);
      // Force a small delay to ensure state updates, then reload to sync with server
      await new Promise(resolve => setTimeout(resolve, 100));
      await refreshCalendar();
      
      toast.success('Cập nhật trạng thái thành công!');
      // selectedSession will be auto-updated via useEffect when workSessions refreshes
    } catch (err) {
      const message =
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (err as any)?.response?.data?.message ||
        (err instanceof Error ? err.message : null) ||
        'Có lỗi xảy ra khi cập nhật trạng thái';
      toast.error(message);
    }
  };

  // Handle refresh
  const handleRefresh = async () => {
    try {
      await refreshCalendar();
      toast.success('Cập nhật dữ liệu thành công!');
    } catch (err) {
      console.error('Failed to refresh calendar:', err);
      toast.error('Có lỗi xảy ra khi cập nhật dữ liệu');
    }
  };


  const handleCreateNew = () => {
    setSelectedDate(new Date());
    setEditingSession(null);
    setShowForm(true);
  };

  // Handle date change from calendar (when user navigates to different month)

  return (
    <div className="min-h-screen">
      <div className="flex flex-col gap-6 px-8 py-8">
        {/* Header */}
        <CalendarHeader
          loading={loading}
          onRefresh={handleRefresh}
          onCreateNew={handleCreateNew}
          isAdmin={isAdmin}
          selectedDoctorId={selectedDoctorId}
          onDoctorSelect={setSelectedDoctorId}
          onShowAdminAppointments={() => setShowAdminAppointments(true)}
          onShowDoctorList={() => setShowDoctorList(true)}
        />

        {/* Error Display */}
        {error && (
          <CalendarErrorDisplay
            error={error}
            onClear={clearError}
            onRetry={handleRefresh}
          />
        )}

        {/* Main Layout: Calendar + Sidebar */}
        <div className="grid grid-cols-1 xl:grid-cols-6 gap-6">
          {/* Calendar - Main Content */}
          <div className="xl:col-span-6">
            <WorkSessionCalendar
              events={calendarEvents}
              loading={loading}
              onEventClick={handleEventClick}
              onDateSelect={handleDateSelect}
              onSpecialtyFilterChange={setFilteredCalendarEvents}
              view={viewMode}
              onViewChange={setViewMode}
              height="calc(100vh - 280px)"
              isAdmin={isAdmin}
              selectedDoctorId={isAdmin ? selectedDoctorId : null}
              isReady={!authLoading}
            />
          </div>
        </div>
        <div className=" gap-6">
            <CalendarStats workSessions={filteredWorkSessions} services={services} showOnlyStats={true} />
          </div>
        {/* Bottom Modules - Services & Status */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
          <CalendarStats workSessions={filteredWorkSessions} services={services} showOnlyServices={true} />
          <CalendarStats workSessions={filteredWorkSessions} services={services} showOnlyStatus={true} />
        </div>
        {isDoctor && (
          <div>
            <DoctorAppointmentsPanel />
          </div>
        )}
      </div>

      {/* Modals */}
      <WorkSessionForm
        isOpen={showForm}
        onClose={() => {
          setShowForm(false);
          setEditingSession(null);
          setSelectedDate(null);
        }}
        onSubmit={handleFormSubmit}
        editingSession={editingSession}
        selectedDate={selectedDate || undefined}
        loading={loading}
      />

      <WorkSessionDetails
        isOpen={showDetails}
        onClose={() => {
          setShowDetails(false);
          setSelectedSession(null);
        }}
        workSession={selectedSession}
        onEdit={handleEditSession}
        onDelete={handleDeleteSession}
        onStatusUpdate={handleStatusUpdate}
        loading={loading}
        canEdit={true}
        canDelete={true}
        canChangeStatus={isAdmin} // Only admin can change status
        isAdmin={isAdmin}
        isDoctor={isDoctor}
      />

      {/* Admin-specific modals */}
      {isAdmin && (
        <>
          <AdminWorkSessionManager
            workSessions={workSessions}
            onUpdateStatus={handleStatusUpdate}
            onEdit={handleEditSession}
            onDelete={handleDeleteSession}
            loading={loading}
          />
          <AdminAppointmentsSheet
            open={showAdminAppointments}
            onOpenChange={setShowAdminAppointments}
          />
        </>
      )}

      {/* Doctor-specific modals */}
      {isDoctor && user?.id && (
        <>
          <DoctorWorkSessionManager
            workSessions={workSessions}
            onUpdateStatus={handleStatusUpdate}
            onEdit={handleEditSession}
            onDelete={handleDeleteSession}
            loading={loading}
            currentDoctorId={user.id}
            user={user}
          />
        </>
      )}
    </div>
  );
}
