// Statistics API Types based on backend responses

export type PeriodType = 'day' | 'week' | 'month' | 'custom';

export interface Period {
  startDate: string;
  endDate: string;
  periodType?: PeriodType;
}

// KPI Statistics
export interface AppointmentStats {
  total: number;
  confirmed: number;
  completed: number;
  cancelled: number;
  pending: number;
  confirmedPercent: number;
  completedPercent: number;
  cancelledPercent: number;
}

export interface PatientStats {
  newPatients: number;
  returningPatients: number;
  totalPatients: number;
  newPatientsPercent: number;
  returningPatientsPercent: number;
}

export interface DoctorRatingStats {
  averageRating: number;
  totalDoctors: number;
  activeDoctors: number;
  totalRatings: number;
  ratingDistribution: Array<{
    rating: number;
    count: number;
  }>;
}

export interface KPIData {
  appointmentStats: AppointmentStats;
  patientStats: PatientStats;
  doctorRatingStats: DoctorRatingStats;
  period: Period;
}

// Revenue Statistics
export interface RevenueOverview {
  totalRevenue: number;
  paidRevenue: number;
  accountsReceivable: number;
  paidPercent: number;
  arPercent: number;
}

export interface RevenueByTime {
  date: string;
  revenue: number;
  paidRevenue: number;
  accountsReceivable: number;
}

export interface RevenueBySpecialty {
  specialtyId: string;
  specialtyName: string;
  revenue: number;
  appointmentCount: number;
}

export interface RevenueByService {
  serviceId: string;
  serviceName: string;
  revenue: number;
  usageCount: number;
}

export interface RevenueData {
  overview: RevenueOverview;
  byTime: RevenueByTime[];
  bySpecialty: RevenueBySpecialty[];
  byService: RevenueByService[];
  period: Period;
}

// Work Session Statistics
export interface WorkSessionByDoctor {
  doctorId: string;
  doctorName: string;
  totalSessions: number;
  completedSessions: number;
  canceledSessions: number;
  approvedSessions?: number;
  pendingSessions?: number;
  inProgressSessions?: number;
  completionRate: number;
}

export interface WorkSessionByTechnician {
  technicianId: string;
  technicianName: string;
  totalSessions: number;
  completedSessions: number;
  canceledSessions: number;
  approvedSessions?: number;
  pendingSessions?: number;
  inProgressSessions?: number;
  completionRate: number;
}

export interface WorkSessionSummary {
  totalSessions: number;
  completedSessions: number;
  canceledSessions: number;
  approvedSessions: number;
  pendingSessions: number;
  inProgressSessions?: number;
  completedPercent: number;
  canceledPercent: number;
  approvedPercent?: number;
  pendingPercent?: number;
  inProgressPercent?: number;
}

export interface WorkSessionData {
  byDoctor: WorkSessionByDoctor[];
  byTechnician: WorkSessionByTechnician[];
  summary: WorkSessionSummary;
  period: Period;
}

// Examination Volume Statistics
export interface ExaminationByDoctor {
  doctorId: string;
  doctorName: string;
  totalAppointments: number;
  completedAppointments: number;
  averageDurationMinutes: number;
}

export interface ExaminationByTime {
  date: string;
  totalAppointments: number;
  completedAppointments: number;
  averageDurationMinutes: number;
}

export interface ExaminationSummary {
  totalAppointments: number;
  completedAppointments: number;
  averageDurationMinutes: number;
  appointmentsPerDay: number;
}

export interface ExaminationVolumeData {
  byDoctor: ExaminationByDoctor[];
  byTime: ExaminationByTime[];
  summary: ExaminationSummary;
  period: Period;
}

// Payment Method Statistics
export interface PaymentMethodStats {
  paymentMethod: 'CASH' | 'CARD' | 'TRANSFER' | 'WALLET';
  revenue: number;
  invoiceCount: number;
  paidCount: number;
  paidPercent: number;
}

export interface PaymentMethodSummary {
  totalRevenue: number;
  paidRevenue: number;
  totalInvoices: number;
  paidInvoices: number;
  overallPaidPercent: number;
}

export interface PaymentMethodData {
  byPaymentMethod: PaymentMethodStats[];
  summary: PaymentMethodSummary;
  period: Period;
}

// Top Services Statistics
export interface TopService {
  serviceId: string;
  serviceName: string;
  usageCount: number;
  revenue: number;
  specialtyName: string;
}

export interface TopPackage {
  packageId: string;
  packageName: string;
  usageCount: number;
  revenue: number;
}

export interface RevenueStructure {
  category: string;
  revenue: number;
  percentage: number;
}

export interface TopServicesSummary {
  totalServiceRevenue: number;
  totalPackageRevenue: number;
  totalServiceUsage: number;
  totalPackageUsage: number;
}

export interface TopServicesData {
  topServices: TopService[];
  topPackages: TopPackage[];
  revenueStructure: RevenueStructure[];
  summary: TopServicesSummary;
  period: Period;
}

// Patient Spending Statistics
export interface ProfileSpending {
  patientProfileId: string;
  profileCode: string;
  profileName: string;
  relationship: string;
  totalSpent: number;
  totalPaid: number;
  accountsReceivable: number;
  invoiceCount: number;
  appointmentCount: number;
  lastVisit: string | null;
}

export interface FamilySpending {
  patientId: string;
  patientCode: string;
  patientName: string;
  totalSpent: number;
  totalPaid: number;
  accountsReceivable: number;
  totalInvoices: number;
  totalAppointments: number;
  profileCount: number;
  profiles: ProfileSpending[];
}

export interface PatientSpendingData {
  familySpending?: FamilySpending;
  profileSpending?: ProfileSpending;
  period: Period;
}

// API Request Parameters
export interface KPIRequestParams {
  period: PeriodType;
  startDate?: string;
  endDate?: string;
}

export interface RevenueRequestParams {
  period: PeriodType;
  startDate?: string;
  endDate?: string;
}

export interface WorkSessionRequestParams {
  period: PeriodType;
  startDate?: string;
  endDate?: string;
}

export interface ExaminationVolumeRequestParams {
  period: PeriodType;
  startDate?: string;
  endDate?: string;
}

export interface PaymentMethodRequestParams {
  period: PeriodType;
  startDate?: string;
  endDate?: string;
}

export interface TopServicesRequestParams {
  period: PeriodType;
  startDate?: string;
  endDate?: string;
}

export interface PatientSpendingRequestParams {
  patientId?: string;
  patientProfileId?: string;
  period: PeriodType;
  startDate?: string;
  endDate?: string;
}

// Time-based Statistics Types
export interface AppointmentTimeData {
  date: string; // ISO date string
  total: number; // Tổng lịch hẹn
  completed: number; // Đã hoàn thành
  pending: number; // Chờ xác nhận
  cancelled: number; // Đã hủy
  confirmed: number; // Đã xác nhận
}

export interface AppointmentsByTimeData {
  data: AppointmentTimeData[];
  period: {
    startDate: string;
    endDate: string;
    periodType: string;
  };
}

export interface ExaminationTimeData {
  date: string;
  totalAppointments: number;
  completedAppointments: number;
  averageDurationMinutes: number;
}

export interface ExaminationsByTimeData {
  data: ExaminationTimeData[];
  period: {
    startDate: string;
    endDate: string;
    periodType: string;
  };
}

export interface RevenueTimeData {
  date: string;
  totalRevenue: number;
  paidRevenue: number;
  accountsReceivable: number;
}

export interface RevenueByTimeData {
  data: RevenueTimeData[];
  period: {
    startDate: string;
    endDate: string;
    periodType: string;
  };
}

// Request parameters for time-based statistics
export interface TimeBasedRequestParams {
  period: PeriodType;
  startDate?: string;
  endDate?: string;
}
