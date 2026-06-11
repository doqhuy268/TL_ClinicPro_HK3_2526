import { useState, useCallback } from 'react';
import { workSessionApi } from '@/lib/api';
import {
  CreateWorkSessionDto,
  UpdateWorkSessionDto,
  GetWorkSessionsQuery,
  GetUserWorkSessionsQuery,
  WorkSession,
  WorkSessionsResponse,
  CreateWorkSessionResponse,
  WorkSessionResponse,
  ConflictValidationResult,
} from '@/lib/types/work-session';

export const useWorkSessionManagement = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => setError(null), []);

  // Create work sessions
  const createWorkSessions = useCallback(async (data: CreateWorkSessionDto): Promise<CreateWorkSessionResponse> => {
    setLoading(true);
    setError(null);
    try {
      const response = await workSessionApi.create(data);
      return response.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Có lỗi xảy ra khi tạo lịch làm việc';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Get my schedule
  const getMySchedule = useCallback(async (params?: { startDate?: string; endDate?: string }): Promise<WorkSessionsResponse> => {
    setLoading(true);
    setError(null);
    try {
      const response = await workSessionApi.getMySchedule(params);
      return response.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Có lỗi xảy ra khi lấy lịch làm việc';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Get user work sessions (admin only)
  const getUserWorkSessions = useCallback(async (
    userId: string, 
    params: GetUserWorkSessionsQuery
  ): Promise<WorkSessionsResponse> => {
    setLoading(true);
    setError(null);
    try {
      const response = await workSessionApi.getUserWorkSessions(userId, params);
      return response.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Có lỗi xảy ra khi lấy lịch làm việc của người dùng';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Get all work sessions (admin only)
  const getAllWorkSessions = useCallback(async (params?: GetWorkSessionsQuery): Promise<WorkSessionsResponse> => {
    setLoading(true);
    setError(null);
    try {
      const response = await workSessionApi.getAll(params);
      return response.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Có lỗi xảy ra khi lấy tất cả lịch làm việc';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Get work session by ID
  const getWorkSessionById = useCallback(async (id: string): Promise<WorkSessionResponse> => {
    setLoading(true);
    setError(null);
    try {
      const response = await workSessionApi.getById(id);
      return response.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Có lỗi xảy ra khi lấy thông tin lịch làm việc';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Get work sessions by booth
  const getWorkSessionsByBooth = useCallback(async (
    boothId: string, 
    params?: { startDate?: string; endDate?: string }
  ): Promise<WorkSessionsResponse> => {
    setLoading(true);
    setError(null);
    try {
      const response = await workSessionApi.getByBooth(boothId, params);
      return response.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Có lỗi xảy ra khi lấy lịch làm việc theo phòng';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Get work sessions by date
  const getWorkSessionsByDate = useCallback(async (
    date: string, 
    params?: { userType?: 'DOCTOR' | 'TECHNICIAN' }
  ): Promise<WorkSessionsResponse> => {
    setLoading(true);
    setError(null);
    try {
      const response = await workSessionApi.getByDate(date, params);
      return response.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Có lỗi xảy ra khi lấy lịch làm việc theo ngày';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Update work session
  const updateWorkSession = useCallback(async (
    id: string, 
    data: UpdateWorkSessionDto
  ): Promise<WorkSessionResponse> => {
    setLoading(true);
    setError(null);
    try {
      const response = await workSessionApi.update(id, data);
      return response.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Có lỗi xảy ra khi cập nhật lịch làm việc';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Delete work session
  const deleteWorkSession = useCallback(async (id: string): Promise<{ success: boolean; message: string }> => {
    setLoading(true);
    setError(null);
    try {
      const response = await workSessionApi.delete(id);
      return response.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Có lỗi xảy ra khi xóa lịch làm việc';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Validate time conflicts (client-side validation)
  const validateTimeConflicts = useCallback((
    newSession: { startTime: string; endTime: string },
    existingSessions: WorkSession[],
    excludeId?: string
  ): ConflictValidationResult => {
    const conflicts = existingSessions
      // Ignore sessions that are already canceled
      .filter(session => session.status !== 'CANCELED')
      .filter(session => session.id !== excludeId)
      .filter(session => {
        const existingStart = new Date(session.startTime);
        const existingEnd = new Date(session.endTime);
        const newStart = new Date(newSession.startTime);
        const newEnd = new Date(newSession.endTime);

        // Check for time overlap
        return (
          (newStart >= existingStart && newStart < existingEnd) ||
          (newEnd > existingStart && newEnd <= existingEnd) ||
          (newStart <= existingStart && newEnd >= existingEnd)
        );
      })
      .map(session => ({
        id: session.id,
        startTime: session.startTime,
        endTime: session.endTime,
        services: session.services.map((s) => s.service),
      }));

    return {
      hasConflict: conflicts.length > 0,
      conflicts,
      message: conflicts.length > 0 
        ? `Có ${conflicts.length} lịch làm việc bị trùng thời gian`
        : undefined,
    };
  }, []);

  return {
    loading,
    error,
    clearError,
    createWorkSessions,
    getMySchedule,
    getUserWorkSessions,
    getAllWorkSessions,
    getWorkSessionById,
    getWorkSessionsByBooth,
    getWorkSessionsByDate,
    updateWorkSession,
    deleteWorkSession,
    validateTimeConflicts,
  };
};
