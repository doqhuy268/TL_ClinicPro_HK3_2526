import api from '../config';
import {
  KPIRequestParams,
  RevenueRequestParams,
  WorkSessionRequestParams,
  ExaminationVolumeRequestParams,
  PaymentMethodRequestParams,
  TopServicesRequestParams,
  PatientSpendingRequestParams,
  TimeBasedRequestParams,
} from '../types/statistics';

// Statistics API
export const statisticsApi = {
  // Quick KPI Statistics
  getKPI: (params: KPIRequestParams) =>
    api.get('/statistics/kpi', { params }),

  // Revenue Statistics
  getRevenue: (params: RevenueRequestParams) =>
    api.get('/statistics/revenue', { params }),

  // Work Session Statistics
  getWorkSessions: (params: WorkSessionRequestParams) =>
    api.get('/statistics/work-sessions', { params }),

  // Examination Volume Statistics
  getExaminationVolume: (params: ExaminationVolumeRequestParams) =>
    api.get('/statistics/examination-volume', { params }),

  // Payment Method Statistics
  getPaymentMethods: (params: PaymentMethodRequestParams) =>
    api.get('/statistics/payment-methods', { params }),

  // Top Services Statistics
  getTopServices: (params: TopServicesRequestParams) =>
    api.get('/statistics/top-services', { params }),

  // Patient Spending Statistics
  getPatientSpending: (params: PatientSpendingRequestParams) =>
    api.get('/statistics/patient-spending', { params }),

  // Time-based Statistics
  getAppointmentsByTime: (params: TimeBasedRequestParams) =>
    api.get('/statistics/appointments/by-time', { params }),

  getExaminationsByTime: (params: TimeBasedRequestParams) =>
    api.get('/statistics/examinations/by-time', { params }),

  getRevenueByTime: (params: TimeBasedRequestParams) =>
    api.get('/statistics/revenue/by-time', { params }),
};

// Utility functions for date calculations
export const getDateRange = (period: string, startDate?: string, endDate?: string) => {
  const now = new Date();
  
  switch (period) {
    case 'day':
      return {
        startDate: new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString(),
        endDate: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999).toISOString(),
      };
    
    case 'week':
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - now.getDay() + 1); // Monday
      weekStart.setHours(0, 0, 0, 0);
      
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6); // Sunday
      weekEnd.setHours(23, 59, 59, 999);
      
      return {
        startDate: weekStart.toISOString(),
        endDate: weekEnd.toISOString(),
      };
    
    case 'month':
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
      
      return {
        startDate: monthStart.toISOString(),
        endDate: monthEnd.toISOString(),
      };
    
    case 'custom':
      return {
        startDate: startDate || new Date().toISOString(),
        endDate: endDate || new Date().toISOString(),
      };
    
    default:
      return {
        startDate: new Date().toISOString(),
        endDate: new Date().toISOString(),
      };
  }
};

// Format currency for Vietnamese Dong
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

// Format number with Vietnamese locale
export const formatNumber = (num: number): string => {
  return new Intl.NumberFormat('vi-VN').format(num);
};

// Format percentage
export const formatPercentage = (value: number, decimals: number = 1): string => {
  return `${value.toFixed(decimals)}%`;
};

// Get period label in Vietnamese
export const getPeriodLabel = (period: string): string => {
  switch (period) {
    case 'day':
      return 'Hôm nay';
    case 'week':
      return 'Tuần này';
    case 'month':
      return 'Tháng này';
    case 'custom':
      return 'Tùy chỉnh';
    default:
      return 'Không xác định';
  }
};

// Calculate growth percentage
export const calculateGrowth = (current: number, previous: number): number => {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
};

// Get growth color class
export const getGrowthColor = (growth: number): string => {
  if (growth > 0) return 'text-green-600';
  if (growth < 0) return 'text-red-600';
  return 'text-gray-600';
};

// Get growth icon
export const getGrowthIcon = (growth: number): '↗' | '↘' | '→' => {
  if (growth > 0) return '↗';
  if (growth < 0) return '↘';
  return '→';
};
