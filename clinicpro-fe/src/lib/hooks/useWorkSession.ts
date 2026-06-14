import { useState, useEffect, useCallback } from 'react';
import { serviceApi } from '@/lib/api';
import { GetWorkSessionResponse } from '@/lib/types/service-processing';

export const useWorkSession = () => {
  const [workSession, setWorkSession] = useState<GetWorkSessionResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => setError(null), []);

  // Fetch current work session
  const fetchWorkSession = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await serviceApi.getCurrentWorkSession();
      setWorkSession(response.data);
      return response.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Có lỗi xảy ra khi lấy thông tin work session';
      setError(errorMessage);
      setWorkSession(null);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Refresh work session data
  const refreshWorkSession = useCallback(async () => {
    try {
      await fetchWorkSession();
    } catch (err) {
      // Error is already handled in fetchWorkSession
      console.error('Failed to refresh work session:', err);
    }
  }, [fetchWorkSession]);

  // Auto-fetch work session on mount
  useEffect(() => {
    fetchWorkSession();
  }, [fetchWorkSession]);

  // Check if user has an active work session
  const hasActiveWorkSession = workSession?.workSession?.endTime 
    ? new Date(workSession.workSession.endTime) > new Date() 
    : false;

  // Get current user info from work session
  const currentUser = workSession?.user;

  // Get current booth info
  const currentBooth = workSession?.workSession?.booth;

  return {
    workSession,
    loading,
    error,
    clearError,
    fetchWorkSession,
    refreshWorkSession,
    hasActiveWorkSession,
    currentUser,
    currentBooth,
  };
};
