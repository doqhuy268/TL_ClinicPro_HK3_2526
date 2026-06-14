"use client";

import { useState, useEffect, useMemo, useCallback } from 'react';
import { statisticsApi } from '../services/statistics';
import {
  KPIData,
  RevenueData,
  WorkSessionData,
  ExaminationVolumeData,
  PaymentMethodData,
  TopServicesData,
  PatientSpendingData,
  KPIRequestParams,
  RevenueRequestParams,
  WorkSessionRequestParams,
  ExaminationVolumeRequestParams,
  PaymentMethodRequestParams,
  TopServicesRequestParams,
  PatientSpendingRequestParams,
  AppointmentsByTimeData,
  ExaminationsByTimeData,
  RevenueByTimeData,
  TimeBasedRequestParams,
  PeriodType,
} from '../types/statistics';

// Base hook for statistics data
const useStatisticsData = <T, P>(
  apiCall: (params: P) => Promise<{ data: T }>,
  params: P,
  enabled: boolean = true
) => {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Memoize params to prevent unnecessary re-renders
  const paramsKey = JSON.stringify(params);
   
  const memoizedParams = useMemo(() => {
    return params;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paramsKey]);

  // Memoize the fetch function
  const fetchData = useCallback(async () => {
    if (!enabled) {
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const response = await apiCall(memoizedParams);
      setData(response.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
     
    } finally {
      setLoading(false);
    }
  }, [apiCall, memoizedParams, enabled]);

  useEffect(() => {
    
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
};

// KPI Statistics Hook
export const useKPIStatistics = (
  period: PeriodType,
  startDate?: string,
  endDate?: string,
  enabled: boolean = true
) => {
  const params: KPIRequestParams = {
    period,
    ...(startDate && startDate.trim() && { startDate }),
    ...(endDate && endDate.trim() && { endDate }),
  };

  // For custom period, ensure we have both dates
  const shouldEnable = enabled && (period !== 'custom' || (!!startDate && !!endDate && startDate.trim() !== '' && endDate.trim() !== ''));
  console.log('useKPIStatistics: shouldEnable:', shouldEnable, 'period:', period, 'startDate:', startDate, 'endDate:', endDate);

  return useStatisticsData<KPIData, KPIRequestParams>(
    statisticsApi.getKPI,
    params,
    shouldEnable
  );
};

// Revenue Statistics Hook
export const useRevenueStatistics = (
  period: PeriodType,
  startDate?: string,
  endDate?: string,
  enabled: boolean = true
) => {
  const params: RevenueRequestParams = {
    period,
    ...(startDate && startDate.trim() && { startDate }),
    ...(endDate && endDate.trim() && { endDate }),
  };

  // For custom period, ensure we have both dates
  const shouldEnable = enabled && (period !== 'custom' || (!!startDate && !!endDate && startDate.trim() !== '' && endDate.trim() !== ''));

  return useStatisticsData<RevenueData, RevenueRequestParams>(
    statisticsApi.getRevenue,
    params,
    shouldEnable
  );
};

// Work Session Statistics Hook
export const useWorkSessionStatistics = (
  period: PeriodType,
  startDate?: string,
  endDate?: string,
  enabled: boolean = true
) => {
  const params: WorkSessionRequestParams = {
    period,
    ...(startDate && startDate.trim() && { startDate }),
    ...(endDate && endDate.trim() && { endDate }),
  };

  // For custom period, ensure we have both dates
  const shouldEnable = enabled && (period !== 'custom' || (!!startDate && !!endDate && startDate.trim() !== '' && endDate.trim() !== ''));

  return useStatisticsData<WorkSessionData, WorkSessionRequestParams>(
    statisticsApi.getWorkSessions,
    params,
    shouldEnable
  );
};

// Examination Volume Statistics Hook
export const useExaminationVolumeStatistics = (
  period: PeriodType,
  startDate?: string,
  endDate?: string,
  enabled: boolean = true
) => {
  const params: ExaminationVolumeRequestParams = {
    period,
    ...(startDate && startDate.trim() && { startDate }),
    ...(endDate && endDate.trim() && { endDate }),
  };

  // For custom period, ensure we have both dates
  const shouldEnable = enabled && (period !== 'custom' || (!!startDate && !!endDate && startDate.trim() !== '' && endDate.trim() !== ''));

  return useStatisticsData<ExaminationVolumeData, ExaminationVolumeRequestParams>(
    statisticsApi.getExaminationVolume,
    params,
    shouldEnable
  );
};

// Payment Method Statistics Hook
export const usePaymentMethodStatistics = (
  period: PeriodType,
  startDate?: string,
  endDate?: string,
  enabled: boolean = true
) => {
  const params: PaymentMethodRequestParams = {
    period,
    ...(startDate && startDate.trim() && { startDate }),
    ...(endDate && endDate.trim() && { endDate }),
  };

  // For custom period, ensure we have both dates
  const shouldEnable = enabled && (period !== 'custom' || (!!startDate && !!endDate && startDate.trim() !== '' && endDate.trim() !== ''));

  return useStatisticsData<PaymentMethodData, PaymentMethodRequestParams>(
    statisticsApi.getPaymentMethods,
    params,
    shouldEnable
  );
};

// Top Services Statistics Hook
export const useTopServicesStatistics = (
  period: PeriodType,
  startDate?: string,
  endDate?: string,
  enabled: boolean = true
) => {
  const params: TopServicesRequestParams = {
    period,
    ...(startDate && startDate.trim() && { startDate }),
    ...(endDate && endDate.trim() && { endDate }),
  };

  // For custom period, ensure we have both dates
  const shouldEnable = enabled && (period !== 'custom' || (!!startDate && !!endDate && startDate.trim() !== '' && endDate.trim() !== ''));

  return useStatisticsData<TopServicesData, TopServicesRequestParams>(
    statisticsApi.getTopServices,
    params,
    shouldEnable
  );
};

// Patient Spending Statistics Hook
export const usePatientSpendingStatistics = (
  patientId?: string,
  patientProfileId?: string,
  period: PeriodType = 'month',
  startDate?: string,
  endDate?: string,
  enabled: boolean = true
) => {
  const params: PatientSpendingRequestParams = {
    period,
    ...(patientId && { patientId }),
    ...(patientProfileId && { patientProfileId }),
    ...(startDate && { startDate }),
    ...(endDate && { endDate }),
  };

  return useStatisticsData<PatientSpendingData, PatientSpendingRequestParams>(
    statisticsApi.getPatientSpending,
    params,
    enabled && (!!patientId || !!patientProfileId)
  );
};

// Combined Dashboard Statistics Hook - Only for KPI stats
export const useDashboardStatistics = (
  period: PeriodType = 'day',
  startDate?: string,
  endDate?: string,
  enabled: boolean = true
) => {
  const kpi = useKPIStatistics(period, startDate, endDate, enabled);

  return {
    kpi,
    loading: kpi.loading,
    error: kpi.error,
    refetch: () => {
      kpi.refetch();
    },
  };
};

// Time-based Statistics Hooks
export const useAppointmentsByTime = (
  period: PeriodType,
  startDate?: string,
  endDate?: string,
  enabled: boolean = true
) => {
  const params: TimeBasedRequestParams = {
    period,
    ...(startDate && startDate.trim() && { startDate }),
    ...(endDate && endDate.trim() && { endDate }),
  };

  // For custom period, ensure we have both dates
  const shouldEnable = enabled && (period !== 'custom' || (!!startDate && !!endDate && startDate.trim() !== '' && endDate.trim() !== ''));

  return useStatisticsData<AppointmentsByTimeData, TimeBasedRequestParams>(
    statisticsApi.getAppointmentsByTime,
    params,
    shouldEnable
  );
};

export const useExaminationsByTime = (
  period: PeriodType,
  startDate?: string,
  endDate?: string,
  enabled: boolean = true
) => {
  const params: TimeBasedRequestParams = {
    period,
    ...(startDate && startDate.trim() && { startDate }),
    ...(endDate && endDate.trim() && { endDate }),
  };

  // For custom period, ensure we have both dates
  const shouldEnable = enabled && (period !== 'custom' || (!!startDate && !!endDate && startDate.trim() !== '' && endDate.trim() !== ''));

  return useStatisticsData<ExaminationsByTimeData, TimeBasedRequestParams>(
    statisticsApi.getExaminationsByTime,
    params,
    shouldEnable
  );
};

export const useRevenueByTime = (
  period: PeriodType,
  startDate?: string,
  endDate?: string,
  enabled: boolean = true
) => {
  const params: TimeBasedRequestParams = {
    period,
    ...(startDate && startDate.trim() && { startDate }),
    ...(endDate && endDate.trim() && { endDate }),
  };

  // For custom period, ensure we have both dates
  const shouldEnable = enabled && (period !== 'custom' || (!!startDate && !!endDate && startDate.trim() !== '' && endDate.trim() !== ''));

  return useStatisticsData<RevenueByTimeData, TimeBasedRequestParams>(
    statisticsApi.getRevenueByTime,
    params,
    shouldEnable
  );
};

// Period Selection Hook
export const usePeriodSelection = (initialPeriod: PeriodType = 'day') => {
  const [period, setPeriod] = useState<PeriodType>(initialPeriod);
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');

  const handlePeriodChange = useCallback((newPeriod: PeriodType) => {
    setPeriod(newPeriod);
    if (newPeriod !== 'custom') {
      setCustomStartDate('');
      setCustomEndDate('');
    }
  }, []);

  const handleCustomDateChange = useCallback((startDate: string, endDate: string) => {
    setCustomStartDate(startDate);
    setCustomEndDate(endDate);
  }, []);

  const getCurrentParams = useCallback(() => {
    if (period === 'custom') {
      return {
        period: 'custom' as PeriodType,
        startDate: customStartDate,
        endDate: customEndDate,
      };
    }
    
    return {
      period,
    };
  }, [period, customStartDate, customEndDate]);

  return {
    period,
    customStartDate,
    customEndDate,
    handlePeriodChange,
    handleCustomDateChange,
    getCurrentParams,
  };
};
