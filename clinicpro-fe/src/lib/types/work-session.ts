// Work Session Types
export type WorkSessionStatus = 
  | 'PENDING'
  | 'APPROVED' 
  | 'IN_PROGRESS'
  | 'CANCELED'
  | 'COMPLETED';

export type UserType = 'DOCTOR' | 'TECHNICIAN';

export interface Service {
  service?: Service;
  id: string;
  serviceCode: string;
  name: string;
  description?: string;
  price?: number;
  timePerPatient?: number;
}

export interface Booth {
  id: string;
  boothCode: string;
  name: string;
  room: {
    id: string;
    roomCode: string;
    roomName: string;
    specialty: {
      id: string;
      name: string;
    };
  };
}

export interface WorkSessionService {
  id: string;
  workSessionId: string;
  serviceId: string;
  service: Service;
}

export interface WorkSession {
  id: string;
  startTime: string;
  endTime: string;
  status: WorkSessionStatus;
  nextAvailableAt?: string;
  booth?: Booth;
  services: WorkSessionService[];
  doctor?: {
    id: string;
    doctorCode: string;
    name: string;
    specialtyId?: string;
    auth: {
      name: string;
      phone?: string;
      avatar?: string;
      email?: string;
    };
  };
  technician?: {
    id: string;
    technicianCode: string;
    name: string;
    auth: {
      name: string;
      email?: string;
    };
  };
  createdAt: string;
  updatedAt: string;
}

// DTO Types for API requests
export interface CreateWorkSessionDto {
  workSessions: {
    startTime: string;
    endTime: string;
    serviceIds: string[];
  }[];
}

export interface UpdateWorkSessionDto {
  startTime?: string;
  endTime?: string;
  status?: WorkSessionStatus;
  boothId?: string;
  serviceIds?: string[];
}

export interface GetWorkSessionsQuery {
  startDate?: string;
  endDate?: string;
  status?: WorkSessionStatus;
  userType?: UserType;
  limit?: number;
  offset?: number;
}

export interface GetUserWorkSessionsQuery {
  userType: UserType;
  startDate?: string;
  endDate?: string;
}

// Response Types
export type WorkSessionResponse = WorkSessionApiResponse<WorkSession>;
export type WorkSessionsResponse = WorkSessionApiResponse<WorkSession[]>;
export type CreateWorkSessionResponse = WorkSessionApiResponse<WorkSession[]>;

// Calendar Event Type for FullCalendar
export interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  backgroundColor?: string;
  borderColor?: string;
  textColor?: string;
  extendedProps: {
    workSession: WorkSession;
    status: WorkSessionStatus;
    services: WorkSessionService[];
    booth?: Booth;
  };
}

// Status colors for calendar events
export const WorkSessionStatusColors = {
  PENDING: {
    backgroundColor: '#FFF7ED', // amber-50
    borderColor: '#F59E0B',     // amber-500
    textColor: '#B45309'        // amber-700
  },
  APPROVED: {
    backgroundColor: '#ECFEFF', // cyan-50
    borderColor: '#0F766E',     // brand cyan
    textColor: '#0E7490'        // cyan-700
  },
  IN_PROGRESS: {
    backgroundColor: '#FEF3C7', // yellow-100
    borderColor: '#F59E0B',     // amber-500
    textColor: '#92400E'        // amber-800
  },
  CANCELED: {
    backgroundColor: '#FEF2F2', // red-50
    borderColor: '#EF4444',     // red-500
    textColor: '#991B1B'        // red-800
  },
  COMPLETED: {
    backgroundColor: '#F0FDF4', // green-50
    borderColor: '#22C55E',     // green-500
    textColor: '#166534'        // green-800
  }
} as const;

// Form types
export interface WorkSessionFormData {
  startTime: string;
  endTime: string;
  serviceIds: string[];
  date: string;
}

export interface WorkSessionConflict {
  id: string;
  startTime: string;
  endTime: string;
  services: Service[];
}

export interface ConflictValidationResult {
  hasConflict: boolean;
  conflicts: WorkSessionConflict[];
  message?: string;
}

// Permission validation types
export interface PermissionValidationResult {
  hasPermission: boolean;
  message?: string;
  userRole?: string;
  targetUserRole?: string;
}

// API request/response types for validation
export interface ValidateConflictRequest {
  workSessions: {
    startTime: string;
    endTime: string;
    serviceIds: string[];
  }[];
}

export interface ValidatePermissionRequest {
  userId: string;
  userType: 'DOCTOR' | 'TECHNICIAN';
}

// Enhanced response types for API collection
export interface WorkSessionApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data: T;
  meta?: {
    total: number;
    page: number;
    limit: number;
  };
}

export type ConflictValidationResponse = WorkSessionApiResponse<ConflictValidationResult>;
export type PermissionValidationResponse = WorkSessionApiResponse<PermissionValidationResult>;
