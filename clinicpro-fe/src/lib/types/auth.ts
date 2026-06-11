import { Admin, Doctor, Patient, Receptionist, Cashier } from "./user";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatar: string | null;
  role: UserRole;
  dateOfBirth: string;
  gender: 'male' | 'female' | 'other';
  address: string;
  citizenId: string;
  patient?: Patient | null;
  doctor?: Doctor | null;
  receptionist?: Receptionist | null;
  admin?: Admin | null;
  cashier?: Cashier | null;
}

export type UserRole = 'PATIENT' | 'DOCTOR' | 'RECEPTIONIST' | 'ADMIN' | 'CASHIER' | 'TECHNICIAN';

export interface AuthState {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface LoginCredentials {
  identifier: string; // email or phone
  password: string;
}

export interface AuthResponse {
  user: AuthUser;
  token: string;
  refreshToken: string;
}

export interface Permission {
  id: string;
  name: string;
  description: string;
  resource: string;
  action: string;
}

export interface RolePermissions {
  role: UserRole;
  permissions: Permission[];
}

// Permission constants
export const PERMISSIONS = {
  // Medical Records
  MEDICAL_RECORDS_VIEW: 'medical-records:view',
  MEDICAL_RECORDS_CREATE: 'medical-records:create',
  MEDICAL_RECORDS_EDIT: 'medical-records:edit',
  MEDICAL_RECORDS_DELETE: 'medical-records:delete',
  
  // Patient Profiles
  PATIENT_PROFILES_VIEW: 'patient-profiles:view',
  PATIENT_PROFILES_CREATE: 'patient-profiles:create',
  PATIENT_PROFILES_EDIT: 'patient-profiles:edit',
  PATIENT_PROFILES_DELETE: 'patient-profiles:delete',
  
  // Users
  USERS_VIEW: 'users:view',
  USERS_CREATE: 'users:create',
  USERS_EDIT: 'users:edit',
  USERS_DELETE: 'users:delete',
  
  // Reports
  REPORTS_VIEW: 'reports:view',
  REPORTS_CREATE: 'reports:create',
  REPORTS_EXPORT: 'reports:export',
  
  // Calendar
  CALENDAR_VIEW: 'calendar:view',
  CALENDAR_CREATE: 'calendar:create',
  CALENDAR_EDIT: 'calendar:edit',
  CALENDAR_DELETE: 'calendar:delete',
  
  // System
  SYSTEM_SETTINGS: 'system:settings',
  SYSTEM_LOGS: 'system:logs',
} as const;

export type PermissionKey = keyof typeof PERMISSIONS;
export type PermissionValue = typeof PERMISSIONS[PermissionKey];

// Role-based permissions mapping
export const ROLE_PERMISSIONS: Record<UserRole, PermissionValue[]> = {
  PATIENT: [
    PERMISSIONS.MEDICAL_RECORDS_VIEW,
    PERMISSIONS.PATIENT_PROFILES_VIEW,
    PERMISSIONS.CALENDAR_VIEW,
  ],
  
  DOCTOR: [
    PERMISSIONS.MEDICAL_RECORDS_VIEW,
    PERMISSIONS.MEDICAL_RECORDS_CREATE,
    PERMISSIONS.MEDICAL_RECORDS_EDIT,
    PERMISSIONS.PATIENT_PROFILES_VIEW,
    PERMISSIONS.PATIENT_PROFILES_CREATE,
    PERMISSIONS.PATIENT_PROFILES_EDIT,
    PERMISSIONS.CALENDAR_VIEW,
    PERMISSIONS.CALENDAR_CREATE,
    PERMISSIONS.CALENDAR_EDIT,
    PERMISSIONS.REPORTS_VIEW,
  ],
  
  RECEPTIONIST: [
    PERMISSIONS.MEDICAL_RECORDS_VIEW,
    PERMISSIONS.MEDICAL_RECORDS_CREATE,
    PERMISSIONS.PATIENT_PROFILES_VIEW,
    PERMISSIONS.PATIENT_PROFILES_CREATE,
    PERMISSIONS.PATIENT_PROFILES_EDIT,
    PERMISSIONS.USERS_VIEW,
    PERMISSIONS.USERS_CREATE,
    PERMISSIONS.CALENDAR_VIEW,
    PERMISSIONS.CALENDAR_CREATE,
    PERMISSIONS.CALENDAR_EDIT,
    PERMISSIONS.REPORTS_VIEW,
  ],
  
  ADMIN: [
    PERMISSIONS.MEDICAL_RECORDS_VIEW,
    PERMISSIONS.MEDICAL_RECORDS_CREATE,
    PERMISSIONS.MEDICAL_RECORDS_EDIT,
    PERMISSIONS.MEDICAL_RECORDS_DELETE,
    PERMISSIONS.PATIENT_PROFILES_VIEW,
    PERMISSIONS.PATIENT_PROFILES_CREATE,
    PERMISSIONS.PATIENT_PROFILES_EDIT,
    PERMISSIONS.PATIENT_PROFILES_DELETE,
    PERMISSIONS.USERS_VIEW,
    PERMISSIONS.USERS_CREATE,
    PERMISSIONS.USERS_EDIT,
    PERMISSIONS.USERS_DELETE,
    PERMISSIONS.REPORTS_VIEW,
    PERMISSIONS.REPORTS_CREATE,
    PERMISSIONS.REPORTS_EXPORT,
    PERMISSIONS.CALENDAR_VIEW,
    PERMISSIONS.CALENDAR_CREATE,
    PERMISSIONS.CALENDAR_EDIT,
    PERMISSIONS.CALENDAR_DELETE,
    PERMISSIONS.SYSTEM_SETTINGS,
    PERMISSIONS.SYSTEM_LOGS,
  ],
  CASHIER: [
  ],
  TECHNICIAN: [
  ],
};

// Route permissions mapping
export const ROUTE_PERMISSIONS: Record<string, PermissionValue[]> = {
  '/': [], // Home page - accessible to all authenticated users
  '/calendar': [PERMISSIONS.CALENDAR_VIEW],
  '/reports': [PERMISSIONS.REPORTS_VIEW],
  '/medical-records': [PERMISSIONS.MEDICAL_RECORDS_VIEW],
  '/medical-records/create': [PERMISSIONS.MEDICAL_RECORDS_CREATE],
  '/medical-records/[id]/edit': [PERMISSIONS.MEDICAL_RECORDS_EDIT],
  '/users': [PERMISSIONS.USERS_VIEW],
  '/users/create': [PERMISSIONS.USERS_CREATE],
  '/users/[id]/edit': [PERMISSIONS.USERS_EDIT],
  '/settings': [PERMISSIONS.SYSTEM_SETTINGS],
  '/logs': [PERMISSIONS.SYSTEM_LOGS],
};

// Route access by role
export const ROUTE_ACCESS: Record<string, UserRole[]> = {
  '/': ['PATIENT', 'DOCTOR', 'RECEPTIONIST', 'ADMIN'],
  '/calendar': ['DOCTOR', 'RECEPTIONIST', 'ADMIN'],
  '/reports': ['DOCTOR', 'RECEPTIONIST', 'ADMIN'],
  '/medical-records': ['PATIENT', 'DOCTOR', 'RECEPTIONIST', 'ADMIN'],
  '/medical-records/create': ['DOCTOR', 'RECEPTIONIST', 'ADMIN'],
  '/medical-records/[id]/edit': ['DOCTOR', 'RECEPTIONIST', 'ADMIN'],
  '/users': ['RECEPTIONIST', 'ADMIN'],
  '/users/create': ['RECEPTIONIST', 'ADMIN'],
  '/users/[id]/edit': ['RECEPTIONIST', 'ADMIN'],
  '/settings': ['ADMIN'],
  '/logs': ['ADMIN'],
};
