/* eslint-disable @typescript-eslint/no-unused-vars */
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useWorkSessionManagement } from './useWorkSessionManagement';
import { serviceApi, workSessionApi } from '@/lib/api';
import {
  WorkSession,
  CalendarEvent,
  WorkSessionStatusColors,
  Service,
  WorkSessionFormData,
} from '@/lib/types/work-session';

interface UseWorkSessionCalendarOptions {
  selectedDoctorId?: string | null;
  isAdmin?: boolean;
  // Prevent initial fetch until auth/role is determined by caller
  isReady?: boolean;
}

export const useWorkSessionCalendar = (options: UseWorkSessionCalendarOptions = {}) => {
  const { selectedDoctorId, isAdmin = false, isReady = true } = options;
  const [workSessions, setWorkSessions] = useState<WorkSession[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day'>('month');
  
  const {
    loading,
    error,
    clearError,
    getMySchedule,
    createWorkSessions,
    updateWorkSession,
    deleteWorkSession,
    validateTimeConflicts,
  } = useWorkSessionManagement();

  // Load available services on mount
  useEffect(() => {
    const loadServices = async () => {
      try {
        const response = await serviceApi.getAll();
        // Handle API response structure: { success, message, data: { services: [...] } }
        const servicesData = response.data?.data?.services || response.data?.services || response.data || [];
        setServices(Array.isArray(servicesData) ? servicesData : []);
      } catch (err) {
        console.error('Failed to load services:', err);
        setServices([]); // Ensure services is always an array
      }
    };
    loadServices();
  }, []);

  // Format a Date to YYYY-MM-DD in local time (avoid UTC shift)
  const formatLocalDate = (date: Date): string => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  // Load work sessions when date changes
  const loadWorkSessions = useCallback(async (startDate?: Date, endDate?: Date) => {
    try {
      // Avoid fetching until auth/role is ready
      if (!isReady) return;
      const start = startDate || new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
      // Use first day of next month as end boundary to avoid excluding the last day
      const end = endDate || new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 1);
      
      let response;
      
      if (isAdmin && selectedDoctorId) {
        // Admin viewing specific doctor's schedule
        response = await workSessionApi.getUserWorkSessions(selectedDoctorId, {
          userType: 'DOCTOR',
          startDate: formatLocalDate(start),
          endDate: formatLocalDate(end),
        });
      } else if (isAdmin) {
        // Admin viewing all work sessions
        response = await workSessionApi.getAll({
          startDate: formatLocalDate(start),
          endDate: formatLocalDate(end),
        });
      } else {
        // Regular user viewing their own schedule
        response = await getMySchedule({
          startDate: formatLocalDate(start),
          endDate: formatLocalDate(end),
        });
      }
      
      // Handle work session response structure
      // Response structure from API can be:
      // - { data: WorkSession[] } (from useWorkSessionManagement)
      // - { data: { data: WorkSession[] } } (nested)
      // - WorkSession[] (direct array)
      
      let workSessionsData: WorkSession[] = [];
      
      if (response) {
        // Check if response has data property
        if (response.data !== undefined) {
          // If data is an array, use it directly
          if (Array.isArray(response.data)) {
            workSessionsData = response.data;
          }
          // If data is an object with nested data
          else if (response.data && typeof response.data === 'object' && response.data.data) {
            if (Array.isArray(response.data.data)) {
              workSessionsData = response.data.data;
            }
          }
          // If data is an object with workSessions property
          else if (response.data && typeof response.data === 'object' && response.data.workSessions) {
            if (Array.isArray(response.data.workSessions)) {
              workSessionsData = response.data.workSessions;
            }
          }
        }
        // If response is directly an array
        else if (Array.isArray(response)) {
          workSessionsData = response;
        }
      }
      
      // Always create a new array reference to ensure React detects the change
      // This forces React to recognize the state change and trigger re-render
      const newSessionsArray = Array.isArray(workSessionsData) ? [...workSessionsData] : [];
      setWorkSessions(newSessionsArray);
      
      // Log for debugging (can be removed in production)
      console.log('Work sessions loaded:', newSessionsArray.length, 'sessions');
    } catch (err) {
      console.error('Failed to load work sessions:', err);
    }
  }, [selectedDate, getMySchedule, isAdmin, selectedDoctorId, isReady]);

  // Load events with custom date range for calendar
  const loadEvents = useCallback(async (startDate: Date, endDate: Date) => {
    try {
      // Avoid fetching until auth/role is ready
      if (!isReady) return;
      
      let response;
      
      if (isAdmin && selectedDoctorId) {
        // Admin viewing specific doctor's schedule
        response = await workSessionApi.getUserWorkSessions(selectedDoctorId, {
          userType: 'DOCTOR',
          startDate: formatLocalDate(startDate),
          endDate: formatLocalDate(endDate),
        });
      } else if (isAdmin) {
        // Admin viewing all work sessions
        response = await workSessionApi.getAll({
          startDate: formatLocalDate(startDate),
          endDate: formatLocalDate(endDate),
        });
      } else {
        // Regular user viewing their own schedule
        response = await getMySchedule({
          startDate: formatLocalDate(startDate),
          endDate: formatLocalDate(endDate),
        });
      }
      
      // Handle work session response structure
      const workSessionsData = response.data || response || [];
      const sessions = Array.isArray(workSessionsData) ? workSessionsData : [];
      
      // Convert to calendar events
      const events = sessions.map((session: WorkSession) => {
        const statusColors = WorkSessionStatusColors[session.status];
        
        // Handle new service structure: array of {serviceId, workSessionId, service: {...}}
        const serviceNames = session.services
          .map(serviceItem => serviceItem.service?.name || 'Unknown Service')
          .join(', ');
        
        return {
          id: session.id,
          title: `${serviceNames}${session.booth ? ` - ${session.booth.name}` : ''}`,
          start: session.startTime,
          end: session.endTime,
          backgroundColor: statusColors.backgroundColor,
          borderColor: statusColors.borderColor,
          textColor: statusColors.textColor,
          extendedProps: {
            workSession: session,
            status: session.status,
            services: session.services,
            booth: session.booth,
          },
        };
      });
      
      return events;
    } catch (err) {
      console.error('Failed to load events:', err);
      return [];
    }
  }, [getMySchedule, isAdmin, selectedDoctorId, isReady]);

  // Load work sessions when component mounts or date changes
  useEffect(() => {
    loadWorkSessions();
  }, [loadWorkSessions]);

  // Convert work sessions to calendar events
  const calendarEvents = useMemo((): CalendarEvent[] => {
    return workSessions.map((session) => {
      const statusColors = WorkSessionStatusColors[session.status];
      
      // Handle new service structure: array of {serviceId, workSessionId, service: {...}}
      const serviceNames = session.services
        .map(serviceItem => serviceItem.service?.name || 'Unknown Service')
        .join(', ');
      
      return {
        id: session.id,
        title: `${serviceNames}${session.booth ? ` - ${session.booth.name}` : ''}`,
        start: session.startTime,
        end: session.endTime,
        backgroundColor: statusColors.backgroundColor,
        borderColor: statusColors.borderColor,
        textColor: statusColors.textColor,
        extendedProps: {
          workSession: session,
          status: session.status,
          services: session.services,
          booth: session.booth,
        },
      };
    });
  }, [workSessions]);

  // Helper: chuyển date+time (giờ địa phương) thành Date rồi toISOString() để gửi UTC
  // User chọn 08:00 = 8h sáng giờ địa phương → gửi đúng 8h sáng UTC nếu máy dùng UTC, hoặc convert nếu máy dùng VN
  const createLocalDateTime = (dateStr: string, timeStr: string): Date => {
    const [year, month, day] = dateStr.split('-').map(Number);
    const [hours, minutes] = timeStr.split(':').map(Number);
    // new Date(y, m-1, d, h, min) = giờ địa phương
    const localDate = new Date(year, month - 1, day, hours, minutes, 0);
    return localDate;
  };

  // Create new work session
  const handleCreateWorkSession = useCallback(async (formData: WorkSessionFormData) => {
    // User chọn 08:00–12:00 = giờ địa phương → chuyển sang UTC để gửi API
    const startDateTime = createLocalDateTime(formData.date, formData.startTime);
    const endDateTime = createLocalDateTime(formData.date, formData.endTime);

    // Validate time conflicts
    const validation = validateTimeConflicts(
      {
        startTime: startDateTime.toISOString(),
        endTime: endDateTime.toISOString(),
      },
      workSessions
    );

    if (validation.hasConflict) {
      throw new Error(validation.message || 'Có xung đột về thời gian');
    }

    const createData = {
      workSessions: [{
        startTime: startDateTime.toISOString(),
        endTime: endDateTime.toISOString(),
        serviceIds: formData.serviceIds,
      }],
    };

    await createWorkSessions(createData);
    await loadWorkSessions();
  }, [createWorkSessions, validateTimeConflicts, workSessions, loadWorkSessions]);

  // Update work session
  const handleUpdateWorkSession = useCallback(async (
    sessionId: string, 
    updateData: Partial<WorkSessionFormData>
  ) => {
    const session = workSessions.find(s => s.id === sessionId);
    if (!session) {
      throw new Error('Không tìm thấy lịch làm việc');
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updatePayload: any = {};

    if (updateData.startTime || updateData.endTime || updateData.date) {
      const currentStart = new Date(session.startTime);
      const currentEnd = new Date(session.endTime);
      
      // Get UTC date and time from session (matching what's stored in backend)
      const getUTCDateStr = (date: Date): string => {
        const y = date.getUTCFullYear();
        const m = String(date.getUTCMonth() + 1).padStart(2, '0');
        const d = String(date.getUTCDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
      };
      
      // Get UTC time from session
      const getUTCTimeStr = (date: Date): string => {
        const h = String(date.getUTCHours()).padStart(2, '0');
        const m = String(date.getUTCMinutes()).padStart(2, '0');
        return `${h}:${m}`;
      };
      
      const date = updateData.date || getUTCDateStr(currentStart);
      const startTime = updateData.startTime || getUTCTimeStr(currentStart);
      const endTime = updateData.endTime || getUTCTimeStr(currentEnd);

      // Use the same UTC conversion function as create
      const startDateTime = createLocalDateTime(date, startTime);
      const endDateTime = createLocalDateTime(date, endTime);

      // Validate time conflicts (excluding current session)
      const validation = validateTimeConflicts(
        {
          startTime: startDateTime.toISOString(),
          endTime: endDateTime.toISOString(),
        },
        workSessions,
        sessionId
      );

      if (validation.hasConflict) {
        throw new Error(validation.message || 'Có xung đột về thời gian');
      }

      updatePayload.startTime = startDateTime.toISOString();
      updatePayload.endTime = endDateTime.toISOString();
    }

    if (updateData.serviceIds) {
      updatePayload.serviceIds = updateData.serviceIds;
    }

    await updateWorkSession(sessionId, updatePayload);
    await loadWorkSessions();
  }, [updateWorkSession, validateTimeConflicts, workSessions, loadWorkSessions]);

  // Delete work session
  const handleDeleteWorkSession = useCallback(async (sessionId: string) => {
    await deleteWorkSession(sessionId);
    await loadWorkSessions();
  }, [deleteWorkSession, loadWorkSessions]);

  // Get work sessions for a specific date
  const getSessionsForDate = useCallback((date: Date): WorkSession[] => {
    const targetDate = formatLocalDate(date);
    return workSessions.filter(session => {
      const dt = new Date(session.startTime);
      const sessionDate = formatLocalDate(dt);
      return sessionDate === targetDate;
    });
  }, [workSessions]);

  // Check if a time slot is available
  const isTimeSlotAvailable = useCallback((
    date: string, 
    startTime: string, 
    endTime: string,
    excludeId?: string
  ): boolean => {
    const startDateTime = new Date(`${date}T${startTime}`);
    const endDateTime = new Date(`${date}T${endTime}`);

    const validation = validateTimeConflicts(
      {
        startTime: startDateTime.toISOString(),
        endTime: endDateTime.toISOString(),
      },
      workSessions,
      excludeId
    );

    return !validation.hasConflict;
  }, [validateTimeConflicts, workSessions]);

  // Admin-specific functions
  const handleUpdateWorkSessionStatus = useCallback(async (sessionId: string, status: string) => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await workSessionApi.update(sessionId, { status: status as any });
      
      // Force reload work sessions to get updated data from server
      // This ensures we have the latest state from backend
      await loadWorkSessions();
    } catch (err) {
      // If update fails, reload to ensure consistency
      await loadWorkSessions();
      throw err;
    }
  }, [loadWorkSessions]);

  const handleCreateWorkSessionForUser = useCallback(async (formData: WorkSessionFormData, userId: string) => {
    const startDateTime = createLocalDateTime(formData.date, formData.startTime);
    const endDateTime = createLocalDateTime(formData.date, formData.endTime);

    const createData = {
      userId,
      workSessions: [{
        startTime: startDateTime.toISOString(),
        endTime: endDateTime.toISOString(),
        serviceIds: formData.serviceIds,
      }],
    };

    await workSessionApi.create(createData);
    await loadWorkSessions();
  }, [loadWorkSessions]);

  const handleUpdateWorkSessionForUser = useCallback(async (
    sessionId: string, 
    updateData: Partial<WorkSessionFormData>,
    userId: string
  ) => {
    const session = workSessions.find(s => s.id === sessionId);
    if (!session) {
      throw new Error('Không tìm thấy lịch làm việc');
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updatePayload: any = {};

    if (updateData.startTime || updateData.endTime || updateData.date) {
      const currentStart = new Date(session.startTime);
      const currentEnd = new Date(session.endTime);
      
      const date = updateData.date || currentStart.toISOString().split('T')[0];
      const startTime = updateData.startTime || currentStart.toTimeString().slice(0, 5);
      const endTime = updateData.endTime || currentEnd.toTimeString().slice(0, 5);

      const startDateTime = new Date(`${date}T${startTime}`);
      const endDateTime = new Date(`${date}T${endTime}`);

      updatePayload.startTime = startDateTime.toISOString();
      updatePayload.endTime = endDateTime.toISOString();
    }

    if (updateData.serviceIds) {
      updatePayload.serviceIds = updateData.serviceIds;
    }

    await workSessionApi.update(sessionId, updatePayload);
    await loadWorkSessions();
  }, [workSessions, loadWorkSessions]);

  const handleDeleteWorkSessionForUser = useCallback(async (sessionId: string, userId: string) => {
    await workSessionApi.delete(sessionId);
    await loadWorkSessions();
  }, [loadWorkSessions]);

  // Refresh calendar data
  const refreshCalendar = useCallback(async () => {
    await loadWorkSessions();
  }, [loadWorkSessions]);

  return {
    // State
    workSessions,
    services,
    calendarEvents,
    selectedDate,
    viewMode,
    loading,
    error,
    
    // Actions
    setSelectedDate,
    setViewMode,
    clearError,
    handleCreateWorkSession,
    handleUpdateWorkSession,
    handleDeleteWorkSession,
    getSessionsForDate,
    isTimeSlotAvailable,
    refreshCalendar,
    loadWorkSessions,
    loadEvents,
    
    // Admin-specific functions
    handleUpdateWorkSessionStatus,
    handleCreateWorkSessionForUser,
    handleUpdateWorkSessionForUser,
    handleDeleteWorkSessionForUser,
  };
};
