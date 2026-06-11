import api from '../config';

// Types
export type Role = 'DOCTOR' | 'RECEPTIONIST' | 'ADMIN' | 'CASHIER' | 'TECHNICIAN';
export type CertificateType = 'LICENSE' | 'DEGREE' | 'TRAINING' | 'OTHER';

export interface Certificate {
  id?: string;
  code?: string;
  title: string;
  type: CertificateType;
  issuedBy?: string;
  issuedAt?: string;
  expiryAt?: string;
  file?: string;
  description?: string;
}

export interface DoctorInfo {
  specialtyId: string;
  yearsExperience?: number;
  rating?: number;
  workHistory?: string;
  description?: string;
  position?: string;
  isActive?: boolean;
}

export interface CreateStaffDto {
  name: string;
  dateOfBirth: string;
  gender: string;
  address: string;
  role: Role;
  phone?: string;
  email?: string;
  avatar?: string;
  citizenId?: string;
  doctorInfo?: Partial<DoctorInfo>;
  adminInfo?: { position?: string };
  technicianInfo?: Record<string, never>;
  receptionistInfo?: Record<string, never>;
  cashierInfo?: Record<string, never>;
  certificates?: Omit<Certificate, 'id'>[];
}

export interface UpdateStaffDto {
  name?: string;
  dateOfBirth?: string;
  gender?: string;
  address?: string;
  phone?: string;
  email?: string;
  avatar?: string;
  citizenId?: string;
  doctorInfo?: Partial<DoctorInfo>;
  technicianInfo?: { isActive?: boolean };
  receptionistInfo?: { isActive?: boolean };
  cashierInfo?: { isActive?: boolean };
  adminInfo?: { isActive?: boolean; position?: string };
  certificates?: Omit<Certificate, 'id'>[];
  replaceAllCertificates?: boolean;
}

export interface StaffMember {
  id: string;
  name: string;
  dateOfBirth: string;
  gender: string;
  address: string;
  role: Role;
  phone?: string;
  email?: string;
  avatar?: string;
  citizenId?: string;
  doctor?: DoctorInfo & { 
    id?: string;
    doctorCode?: string;
    authId?: string;
    certificates?: Certificate[];
  };
  receptionist?: { 
    id: string; 
    authId: string; 
    receptionistCode: string; 
    isActive: boolean; 
  };
  technician?: { 
    id: string; 
    authId: string; 
    technicianCode: string; 
    isActive: boolean; 
    certificates?: Certificate[];
  };
  cashier?: { 
    id: string; 
    authId: string; 
    cashierCode: string; 
    isActive: boolean; 
  };
  admin?: { 
    id: string; 
    authId: string; 
    adminCode: string; 
    position?: string; 
    isActive: boolean;
  };
}

export interface StaffListResponse {
  data: StaffMember[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Staff Management API Service
export const staffService = {
  /**
   * Tạo nhân viên mới
   * @param data - Thông tin nhân viên cần tạo
   * @returns Promise với thông tin nhân viên đã tạo
   */
  create: (data: CreateStaffDto) =>
    api.post('/staff', data),

  /**
   * Lấy danh sách nhân viên với phân trang và lọc theo vai trò
   * @param params - Tham số phân trang và lọc
   * @returns Promise với danh sách nhân viên và metadata
   */
  getAll: (params?: { 
    role?: Role;
    page?: number;
    limit?: number;
  }) =>
    api.get<StaffListResponse>('/staff', { params }),

  /**
   * Lấy thông tin chi tiết một nhân viên theo authId
   * @param authId - ID của tài khoản Auth
   * @returns Promise với thông tin chi tiết nhân viên
   */
  getById: (authId: string) =>
    api.get<StaffMember>(`/staff/${authId}`),

  /**
   * Cập nhật thông tin nhân viên
   * @param authId - ID của tài khoản Auth
   * @param data - Dữ liệu cần cập nhật
   * @returns Promise với thông tin nhân viên đã cập nhật
   */
  update: (authId: string, data: UpdateStaffDto) =>
    api.put<StaffMember>(`/staff/${authId}`, data),

  /**
   * Vô hiệu hóa nhân viên (soft delete)
   * @param authId - ID của tài khoản Auth
   * @returns Promise với kết quả thành công
   */
  delete: (authId: string) =>
    api.delete<{ success: boolean }>(`/staff/${authId}`),
};

