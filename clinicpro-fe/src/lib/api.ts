import api from './config';
import { CreateMedicalRecordDto, UpdateMedicalRecordDto } from '@/lib/types/medical-record';

// Pagination types
export type PageParams = { page?: number; limit?: number };
export type PagedResponse<T> = { data: T[]; meta: { total: number; page: number; limit: number } };

// Patient Profile Types
export interface PatientProfile {
  id: string;
  patientId: string;
  name: string;
  dateOfBirth: string;
  gender: string;
  address: string;
  occupation: string;
  emergencyContact: {
    name: string;
    phone: string;
    relationship: string;
  };
  healthInsurance: string;
  relationship: string;
  profileCode?: string;
  patientCode?: string;
  patient?: {
    id?: string;
    patientCode?: string;
    user?: {
      id?: string;
      phone?: string;
      name?: string;
      [key: string]: unknown;
    } | null;
    [key: string]: unknown;
  } | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePatientProfileDto {
  patientId: string;
  name: string;
  dateOfBirth: string;
  gender: string;
  address: string;
  occupation: string;
  emergencyContact: {
    name: string;
    phone: string;
    relationship: string;
  };
  healthInsurance: string;
  relationship: string;
}

// Auth API
export const authApi = {
  // Đăng nhập truyền thống (Email/SĐT & Mật khẩu)
  login: (credentials: { identifier: string; password: string }) =>
    api.post('/auth/login', credentials),
  
  // Đăng nhập Google (Google OAuth2)
  googleLogin: (data: { code: string }) =>
    api.post('/auth/google/token', data),
  
  // Làm mới token (Refresh Token)
  refreshToken: (data: { refreshToken: string }) =>
    api.post('/auth/refresh', data),
  
  // Lấy thông tin người dùng (Me)
  getMe: () =>
    api.get('/auth/me'),
  
  logout: () =>
    api.post('/auth/logout'),
};

// Register API
export const registerApi = {
  step1: (data: { phone?: string; email?: string }) =>
    api.post('/register/step1', data),
  
  verifyOtp: (data: { sessionId: string; otp: string }) =>
    api.post('/register/verify-otp', data),
  
  resendOtp: (data: { sessionId: string }) =>
    api.post('/register/resend-otp', data),
  
  complete: (data: { 
    sessionId: string;
    name: string;
    dateOfBirth: string;
    gender: string;
    address: string;
    citizenId?: string;
    avatar?: string;
    password: string;
  }) =>
    api.post('/register/complete', data),
};

// User API
export const userApi = {
  /** Danh sách bác sĩ (dùng cho Admin chọn khi tạo lịch) */
  getDoctors: (params?: { specialty?: string }) =>
    api.get('/users/doctors', { params }),

  getProfile: () =>
    api.get('/user/profile'),
  
  updateProfile: (data: Record<string, unknown>) =>
    api.put('/user/profile', data),
  
  changePassword: (data: { 
    currentPassword: string; 
    newPassword: string; 
    confirmPassword: string;
  }) =>
    api.put('/user/change-password', data),
  
  // Update current user profile
  updateMe: (data: {
    name?: string;
    dateOfBirth?: string;
    gender?: string;
    address?: string;
    citizenId?: string;
    avatar?: string;
    email?: string;
    phone?: string;
    password?: string;
    // role-specific fields
    degrees?: string[];
    yearsExperience?: number;
    workHistory?: string;
    description?: string;
    loyaltyPoints?: number;
    adminCode?: string;
  }) =>
    api.put('/users/me', data),
};

// Medical Services API
export const medicalApi = {
  getFacilities: () =>
    api.get('/medical/facilities'),
  
  getServices: () =>
    api.get('/medical/services'),
  
  bookAppointment: (data: Record<string, unknown>) =>
    api.post('/medical/appointments', data),
  
  getAppointments: () =>
    api.get('/medical/appointments'),
};

// Medical Records API (paginated)
export const medicalRecordApi = {
  // Get all medical records (role-based filtering, paginated)
  getAll: (params?: PageParams) =>
    api.get('/medical-records', { params }),
  
  // Get medical records by patient profile (paginated)
  getByPatientProfile: (patientProfileId: string, params?: PageParams) =>
    api.get(`/medical-records/patient-profile/${patientProfileId}`, { params }),
  
  // Get medical records by doctor
  getByDoctor: (doctorId: string) =>
    api.get(`/medical-records/doctor/${doctorId}`),
  
  // Get single medical record
  getById: (id: string) =>
    api.get(`/medical-records/${id}`),
  
  // Create medical record
  create: (data: CreateMedicalRecordDto) =>
    api.post('/medical-records', data),
  
  // Update medical record
  update: (id: string, data: UpdateMedicalRecordDto) =>
    api.patch(`/medical-records/${id}`, data),
  
  // Delete medical record
  delete: (id: string) =>
    api.delete(`/medical-records/${id}`),
  
  // Get templates
  getTemplates: () =>
    api.get('/medical-records/templates'),
  
  // Get template by ID
  getTemplateById: (templateId: string) =>
    api.get(`/medical-records/templates/${templateId}`),
};

// Admin API (paginated)
export const adminApi = {
  // Get all users with optional role filter
  getAllUsers: (params?: { role?: string } & PageParams) =>
    api.get('/admin/users', { params }),
  
  // Get user by ID
  getUserById: (userId: string) =>
    api.get(`/admin/users/${userId}`),
  
  // Create new user
  createUser: (data: {
    name: string;
    dateOfBirth: string;
    gender: string;
    address: string;
    citizenId: string;
    avatar?: string;
    password: string;
    email?: string;
    phone?: string;
    role: string;
    loyaltyPoints?: number;
    degrees?: string[];
    yearsExperience?: number;
    workHistory?: string;
    description?: string;
    adminCode?: string;
  }) =>
    api.post('/admin/users', data),
  
  // Update user
  updateUser: (userId: string, data: {
    name?: string;
    dateOfBirth?: string;
    gender?: string;
    address?: string;
    citizenId?: string;
    avatar?: string;
    email?: string;
    phone?: string;
    password?: string;
    degrees?: string[];
    yearsExperience?: number;
    workHistory?: string;
    description?: string;
    loyaltyPoints?: number;
    adminCode?: string;
  }) =>
    api.put(`/admin/users/${userId}`, data),
  
  // Delete user
  deleteUser: (userId: string) =>
    api.delete(`/admin/users/${userId}`),

  // specialties, templates, services, counters (paginated)
  getSpecialties: (params?: PageParams) => api.get('/admin/specialties', { params }),
  getTemplates: (params?: { specialtyId?: string } & PageParams) => api.get('/admin/templates', { params }),
  getServices: (params?: PageParams) => api.get('/admin/services', { params }),
  getCounters: (params?: { isActive?: boolean } & PageParams) => api.get('/admin/counters', { params }),
};

// Receptionist API (paginated)
export const receptionistApi = {
  // Register new patient
  registerPatient: (data: {
    name: string;
    dateOfBirth: string;
    gender: string;
    address: string;
    citizenId: string;
    avatar?: string;
    phone: string;
    email?: string;
    password: string;
  }) =>
    api.post('/receptionists/patients', data),
  
  // Update patient
  updatePatient: (patientId: string, data: {
    name?: string;
    dateOfBirth?: string;
    gender?: string;
    address?: string;
    citizenId?: string;
    avatar?: string;
    phone?: string;
    email?: string;
    loyaltyPoints?: number;
    password?: string;
  }) =>
    api.put(`/receptionists/patients/${patientId}`, data),

  // List users (by role) for receptionist
  getUsers: (params?: { role?: string } & PageParams) =>
    api.get('/receptionists/users', { params }),

  // List patients for receptionist
  getPatients: (params?: PageParams) =>
    api.get('/receptionists/patients', { params }),

  // List appointments for receptionist
  getAppointments: (params?: PageParams) =>
    api.get('/receptionists/appointments', { params }),
};

// News API
export const newsApi = {
  getNews: (params?: { category?: string; page?: number; limit?: number }) =>
    api.get('/news', { params }),
  
  getNewsById: (id: string) =>
    api.get(`/news/${id}`),
};

// Cashier/Invoice Payments API
export const cashierApi = {
  // Lookup prescription by code (for cashier scanning)
  getPrescriptionByCode: (prescriptionCode: string) =>
    api.get(`/prescriptions/${encodeURIComponent(prescriptionCode)}`),

  // Preview invoice for selected services on a prescription
  previewInvoice: (data: {
    prescriptionCode: string;
    paymentMethod: 'CASH' | 'CARD' | 'TRANSFER' | 'WALLET';
    selectedServiceCodes: string[];
  }) => api.post('/invoice-payments/preview', data),

  // Create invoice draft (not yet paid)
  createInvoiceDraft: (data: {
    prescriptionCode: string;
    paymentMethod: 'CASH' | 'CARD' | 'TRANSFER' | 'WALLET';
    cashierId: string;
    selectedServiceCodes: string[];
    returnUrl?: string;
    cancelUrl?: string;
  }) => api.post('/invoice-payments/create', data),

  // Manually refresh a transfer transaction (PayOS)
  refreshTransferTransaction: (
    invoiceCode: string,
    data: { returnUrl?: string; cancelUrl?: string }
  ) => api.post(`/invoice-payments/invoice/${encodeURIComponent(invoiceCode)}/refresh`, data),

  // Confirm payment for an invoice
  confirmPayment: (data: { invoiceCode: string; cashierId: string; transactionId?: string }) =>
    api.post('/invoice-payments/confirm', data),

  // TEST MODE: Simulate PayOS payment success
  simulateTestPayment: (data: { invoiceCode: string; orderCode?: string }) =>
    api.post('/invoice-payments/test/simulate-payment', data),

  // Get invoice by ID
  getInvoiceById: (invoiceId: string) =>
    api.get(`/invoice-payments/invoice-by-id/${encodeURIComponent(invoiceId)}`),
};

// Patient Profile API
export const patientProfileApi = {
  // Lấy patient profile theo patient ID
  getByPatientId: (patientId: string) =>
    api.get(`/patient-profiles/patient/${patientId}`),
  
  // Lấy patient profile theo ID
  getById: (patientProfileId: string) =>
    api.get(`/patient-profiles/${patientProfileId}`),
  
  // Tạo patient profile mới
  create: (data: {
    patientId: string;
    name: string;
    dateOfBirth: string;
    gender: string;
    address: string;
    occupation: string;
    emergencyContact: {
      name: string;
      phone: string;
      relationship: string;
    };
    healthInsurance: string;
    relationship: string;
  }) =>
    api.post('/patient-profiles', data),
  
  // Cập nhật patient profile
  update: (patientProfileId: string, data: Partial<CreatePatientProfileDto>) =>
    api.patch(`/patient-profiles/${patientProfileId}`, data),
  
  // Xóa patient profile
  delete: (patientProfileId: string) =>
    api.delete(`/patient-profiles/${patientProfileId}`),
};

// Service Management API
export const serviceApi = {
  // Tìm kiếm dịch vụ
  search: (params: { query: string; limit?: number; offset?: number }) =>
    api.get('/services/search', { params }),
  
  // Lấy tất cả dịch vụ
  getAll: (params?: { limit?: number; offset?: number }) =>
    api.get('/services', { params }),
  
  // Lấy dịch vụ theo ID
  getById: (id: string) =>
    api.get(`/services/${id}`),
  
  // Quét mã phiếu chỉ định
  scanPrescription: (data: { prescriptionCode: string }) =>
    api.post('/services/scan-prescription', data),
  
  // Cập nhật trạng thái dịch vụ
  updateStatus: (data: {
    prescriptionServiceId: string;
    status: 'PENDING' | 'WAITING' | 'SERVING' | 'WAITING_RESULT' | 'COMPLETED' | 'DELAYED' | 'CANCELLED';
    note?: string;
  }) =>
    api.put('/services/prescription-service/status', data),
  
  // Cập nhật kết quả dịch vụ
  updateResults: (data: {
    prescriptionServiceId: string;
    results: string[];
    note?: string;
  }) =>
    api.put('/services/prescription-service/results', data),
  
  // Lấy danh sách dịch vụ của user hiện tại
  getMyServices: (params?: {
    status?: 'PENDING' | 'WAITING' | 'SERVING' | 'WAITING_RESULT' | 'COMPLETED' | 'DELAYED' | 'CANCELLED';
    workSessionId?: string;
    limit?: number;
    offset?: number;
  }) =>
    api.get('/services/my-services', { params }),
  
  // Lấy thông tin work session hiện tại
  getCurrentWorkSession: () =>
    api.get('/services/work-session'),
  
  // Bắt đầu thực hiện dịch vụ (chuyển sang SERVING)
  startService: (prescriptionServiceId: string) =>
    api.post(`/services/prescription-service/${prescriptionServiceId}/start`),
  
  // Hoàn thành dịch vụ (chuyển sang WAITING_RESULT)
  completeService: (prescriptionServiceId: string) =>
    api.post(`/services/prescription-service/${prescriptionServiceId}/complete`),
  
  // Lấy danh sách dịch vụ theo mã bác sĩ
  getByDoctorCode: (doctorCode: string, params?: { limit?: number; offset?: number }) =>
    api.get(`/services/doctors/${encodeURIComponent(doctorCode)}/services`, { params }),
  
  // Lấy danh sách dịch vụ theo vị trí (booth/clinicRoom)
  getByLocation: (params: { serviceIds: string[] }) => {
    const serviceIdsParam = params.serviceIds.join(',');
    return api.get('/services/by-location', { params: { serviceIds: serviceIdsParam } });
  },
};

// Work Session Management API
export const workSessionApi = {
  // Tạo work sessions (Doctor/Technician/Admin). Admin cần truyền userId (authId của Doctor/Technician).
  create: (data: {
    userId?: string;
    workSessions: {
      startTime: string;
      endTime: string;
      serviceIds: string[];
    }[];
  }) =>
    api.post('/work-sessions', data),
  
  // Lấy lịch làm việc của tôi (Doctor/Technician)
  getMySchedule: (params?: { startDate?: string; endDate?: string }) =>
    api.get('/work-sessions/my-schedule', { params }),
  
  // Lấy work sessions của user khác (Admin only)
  getUserWorkSessions: (userId: string, params: {
    userType: 'DOCTOR' | 'TECHNICIAN';
    startDate?: string;
    endDate?: string;
  }) =>
    api.get(`/work-sessions/user/${userId}`, { params }),
  
  // Lấy tất cả work sessions (Admin only)
  getAll: (params?: {
    startDate?: string;
    endDate?: string;
    status?: 'PENDING' | 'APPROVED' | 'IN_PROGRESS' | 'CANCELED' | 'COMPLETED';
    userType?: 'DOCTOR' | 'TECHNICIAN';
    limit?: number;
    offset?: number;
  }) =>
    api.get('/work-sessions', { params }),
  
  // Lấy work session theo ID
  getById: (id: string) =>
    api.get(`/work-sessions/${id}`),
  
  // Lấy work sessions theo booth (Admin only)
  getByBooth: (boothId: string, params?: { startDate?: string; endDate?: string }) =>
    api.get(`/work-sessions/booth/${boothId}`, { params }),
  
  // Lấy work sessions theo ngày (Admin only)
  getByDate: (date: string, params?: { userType?: 'DOCTOR' | 'TECHNICIAN' }) =>
    api.get(`/work-sessions/date/${date}`, { params }),
  
  // Cập nhật work session (Doctor/Technician/Admin)
  update: (id: string, data: {
    startTime?: string;
    endTime?: string;
    status?: 'PENDING' | 'APPROVED' | 'IN_PROGRESS' | 'CANCELED' | 'COMPLETED';
    boothId?: string;
    serviceIds?: string[];
  }) =>
    api.put(`/work-sessions/${id}`, data),
  
  // Xóa work session (Doctor/Technician/Admin)
  delete: (id: string) =>
    api.delete(`/work-sessions/${id}`),
  
  // Kiểm tra xung đột thời gian (Conflict validation)
  validateConflict: (data: {
    workSessions: {
      startTime: string;
      endTime: string;
      serviceIds: string[];
    }[];
  }) =>
    api.post('/work-sessions/validate-conflict', data),
  
  // Kiểm tra quyền truy cập (Permission validation)
  validatePermission: (userId: string, userType: 'DOCTOR' | 'TECHNICIAN') =>
    api.get(`/work-sessions/validate-permission/${userId}?userType=${userType}`),
  
  // Utility functions for common operations
  
  // Tạo work session với validation tự động
  createWithValidation: async (data: {
    workSessions: {
      startTime: string;
      endTime: string;
      serviceIds: string[];
    }[];
  }) => {
    // First validate for conflicts
    const conflictResult = await api.post('/work-sessions/validate-conflict', data);
    if (conflictResult.data.hasConflict) {
      throw new Error(`Conflict detected: ${conflictResult.data.message}`);
    }
    // If no conflict, create the work sessions
    return api.post('/work-sessions', data);
  },
  
  // Lấy work sessions với pagination và filtering
  getWithFilters: (params: {
    startDate?: string;
    endDate?: string;
    status?: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
    userType?: 'DOCTOR' | 'TECHNICIAN';
    userId?: string;
    boothId?: string;
    date?: string;
    limit?: number;
    offset?: number;
  }) => {
    const { userId, boothId, date, ...otherParams } = params;
    
    if (userId) {
      return api.get(`/work-sessions/user/${userId}`, { params: otherParams });
    }
    if (boothId) {
      return api.get(`/work-sessions/booth/${boothId}`, { params: otherParams });
    }
    if (date) {
      return api.get(`/work-sessions/date/${date}`, { params: otherParams });
    }
    return api.get('/work-sessions', { params: otherParams });
  },
};

// Appointment Booking API
export const appointmentBookingApi = {
  // Get all specialties
  getSpecialties: () =>
    api.get('/appointment-booking/specialties'),

  // Get doctors by specialty
  getDoctorsBySpecialty: (specialtyId: string) =>
    api.get(`/appointment-booking/specialties/${specialtyId}/doctors`),

  // Get available doctors by specialty and date
  getAvailableDoctors: (params: { specialtyId: string; date: string }) =>
    api.get('/appointment-booking/doctors/available', { params }),

  // Get doctor services for specific date
  getDoctorServices: (doctorId: string, params: { date: string }) =>
    api.get(`/appointment-booking/doctors/${doctorId}/services`, { params }),

  // Get available time slots for doctor, service and date
  getAvailableSlots: (doctorId: string, params: { serviceId: string; date: string }) =>
    api.get(`/appointment-booking/doctors/${doctorId}/available-slots`, { params }),

  // Get doctor working days for a month
  getDoctorWorkingDays: (doctorId: string, params: { month: string }) =>
    api.get(`/appointment-booking/doctors/${doctorId}/working-days`, { params }),

  // Book an appointment
  bookAppointment: (data: {
    patientProfileId: string;
    doctorId: string;
    serviceId: string;
    date: string;
    startTime: string;
    endTime: string;
  }) =>
    api.post('/appointment-booking/appointments', data),

  // Get patient appointments
  getPatientAppointments: () =>
    api.get('/appointment-booking/patient/appointments'),

  // Get doctor appointments (requires doctor auth token)
  getDoctorAppointments: () =>
    api.get('/appointment-booking/doctor/appointments'),

  // Get appointment by code
  getAppointmentByCode: (code: string) =>
    api.get(`/appointment-booking/appointments/code/${encodeURIComponent(code)}`),

  // Admin: Get all appointments with optional filters
  getAllAppointments: (params?: { doctorId?: string; date?: string }) =>
    api.get('/appointment-booking/appointments', { params }),

  // Cancel appointment (doctor/admin)
  cancelAppointment: (appointmentId: string) =>
    api.patch(`/appointment-booking/appointments/${appointmentId}/cancel`, {}),
};

// AI Chatbot API
export const aiChatbotApi = {
  chat: (data: {
    message: string;
    conversationId?: string;
    userId?: string;
  }) => api.post('/ai-chatbot/chat', data, { timeout: 120000 }),
};

// Public API
export const publicApi = {
  // GET /public/doctors?specialtyId=&specialtyName=
  getDoctors: (params?: { specialtyId?: string; specialtyName?: string }) =>
    api.get('/public/doctors', { params }),

  // GET /public/specialties
  getSpecialties: () => api.get('/public/specialties'),
};

// Medication Prescription API
export const medicationPrescriptionApi = {
  // Create medication prescription (Doctor only)
  create: (data: {
    patientProfileId: string;
    medicalRecordId?: string;
    note?: string;
    status?: 'DRAFT' | 'SIGNED' | 'CANCELLED';
    items: {
      name: string;
      ndc?: string;
      strength?: string;
      dosageForm?: string;
      route?: string;
      dose?: number;
      doseUnit?: string;
      frequency?: string;
      durationDays?: number;
      quantity?: number;
      quantityUnit?: string;
      instructions?: string;
    }[];
  }) =>
    api.post('/medication-prescriptions', data),

  // Get medication prescription by code (Doctor/Patient)
  getByCode: (code: string) =>
    api.get(`/medication-prescriptions/${encodeURIComponent(code)}`),

  // Update medication prescription (Doctor only)
  update: (id: string, data: {
    note?: string;
    status?: 'DRAFT' | 'SIGNED' | 'CANCELLED';
    items?: {
      name: string;
      ndc?: string;
      strength?: string;
      dosageForm?: string;
      route?: string;
      dose?: number;
      doseUnit?: string;
      frequency?: string;
      durationDays?: number;
      quantity?: number;
      quantityUnit?: string;
      instructions?: string;
    }[];
  }) =>
    api.patch(`/medication-prescriptions/${id}`, data),

  // Delete medication prescription (Doctor only)
  delete: (id: string) =>
    api.delete(`/medication-prescriptions/${id}`),

  // Get patient's medication prescriptions
  getPatientPrescriptions: (params?: { page?: number; limit?: number }) =>
    api.get('/medication-prescriptions', {
      params: params
        ? {
            limit: params.limit,
            skip: params.page && params.limit ? (params.page - 1) * params.limit : undefined,
          }
        : undefined,
    }),

  // Get medication prescriptions by patient profile (for patient)
  getPrescriptionsByPatientProfile: (patientProfileId: string, params?: { page?: number; limit?: number }) =>
    api.get(`/medication-prescriptions/mine/profiles/${patientProfileId}`, {
      params: params
        ? {
            limit: params.limit,
            skip: params.page && params.limit ? (params.page - 1) * params.limit : undefined,
          }
        : undefined,
    }),

  // Get doctor's medication prescriptions
  getDoctorPrescriptions: (params?: { page?: number; limit?: number }) =>
    api.get('/medication-prescriptions/mine', {
      params: params
        ? {
            limit: params.limit,
            skip: params.page && params.limit ? (params.page - 1) * params.limit : undefined,
          }
        : undefined,
    }),

  // Get medication prescriptions by medical record
  getByMedicalRecord: (medicalRecordId: string, params?: { page?: number; limit?: number }) =>
    api.get(`/medication-prescriptions/medical-record/${medicalRecordId}`, {
      params: params
        ? {
            limit: params.limit,
            skip: params.page && params.limit ? (params.page - 1) * params.limit : undefined,
          }
        : undefined,
    }),

  // Send feedback for a prescription (patient or doctor)
  sendFeedback: (id: string, data: { message: string; isUrgent?: boolean }) =>
    api.post(`/medication-prescriptions/${id}/feedback`, data),

  // Doctor: get feedback for their prescriptions
  getMyFeedback: (params?: { date?: string; isUrgent?: boolean }) =>
    api.get('/medication-prescriptions/feedback/mine', { params }),

  // Admin: get all feedback
  getAdminFeedback: (params?: { date?: string; isUrgent?: boolean }) =>
    api.get('/medication-prescriptions/feedback/admin', { params }),

  // Doctor: respond to feedback
  respondFeedback: (id: string, data: { responseNote: string }) =>
    api.post(`/medication-prescriptions/${id}/feedback/respond`, data),
};

// Drug Search API (OpenFDA)
export const drugSearchApi = {
  // Exact search
  search: (
    query: string,
    params?: { page?: number; limit?: number; skip?: number }
  ) =>
    api.get(
      `/medication-prescriptions/drugs/search/${encodeURIComponent(query)}`,
      {
        params:
          params && (params.page || params.limit || params.skip)
            ? {
                limit: params.limit,
                skip:
                  params.skip !== undefined
                    ? params.skip
                    : params.page && params.limit
                    ? (params.page - 1) * params.limit
                    : undefined,
              }
            : undefined,
      }
    ),

  // Partial search
  searchPartial: (
    query: string,
    params?: { page?: number; limit?: number; skip?: number }
  ) =>
    api.get(
      `/medication-prescriptions/drugs/search-partial/${encodeURIComponent(query)}`,
      {
        params:
          params && (params.page || params.limit || params.skip)
            ? {
                limit: params.limit,
                skip:
                  params.skip !== undefined
                    ? params.skip
                    : params.page && params.limit
                    ? (params.page - 1) * params.limit
                    : undefined,
              }
            : undefined,
      }
    ),
};
