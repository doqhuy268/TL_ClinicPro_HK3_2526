// Reception domain types aligned with RECEPTIONIST_COUNTER_API_GUIDE

export type CounterAssignmentStatus = 'ACTIVE' | 'COMPLETED' | 'CANCELLED';

// Backend may return Vietnamese labels for priority level, so allow string
export type PriorityLevel = 'HIGH' | 'MEDIUM' | 'LOW' | string;

// Statuses that appear in guide responses
export type PatientStatus = 'READY' | 'PREPARING' | 'CALLED' | 'SERVING' | 'MISSED' | 'COMPLETED';

export interface CounterAssignment {
  id: string;
  status: CounterAssignmentStatus;
  assignedAt: string;
  completedAt?: string | null;
  receptionistId: string;
}

export interface CounterItem {
  id: string; // counter id
  counterCode: string;
  counterName: string;
  isActive?: boolean;
  currentAssignment?: CounterAssignment | null;
}

export interface GetCountersResponse {
  counters: CounterItem[];
}

export interface OpenCounterRequest {
  counterId: string;
  notes?: string;
}

export interface OpenCounterResponse {
  success: boolean;
  assignment: CounterAssignment;
  counter: {
    id: string;
    counterCode: string;
    counterName: string;
  };
}

export interface CloseCounterRequest {
  counterId: string;
  notes?: string;
}

export interface CloseCounterResponse {
  success: boolean;
}

export interface GetCurrentCounterResponse {
  id: string; // counter id
  counterCode: string;
  counterName: string;
  isActive?: boolean;
  currentAssignment: CounterAssignment;
}

// Patient shown in queue and current-patient responses
export interface PatientInQueue {
  ticketId: string;
  patientProfileCode?: string;
  appointmentCode?: string;
  patientName: string;
  patientAge: number;
  patientGender: 'MALE' | 'FEMALE' | string;
  priorityScore?: number;
  priorityLevel: PriorityLevel;
  counterId: string;
  counterCode: string;
  counterName: string;
  queueNumber: string;
  sequence?: number;
  assignedAt: string;
  estimatedWaitTime?: number;
  metadata?: Record<string, unknown>;
  status: PatientStatus;
  callCount?: number;
  isPriority?: boolean;
}

// GET /counter-assignment/counters/{counterId}/current-patient
export interface GetCurrentPatientResponse {
  success: boolean;
  hasPatient: boolean;
  patient?: PatientInQueue | null;
}

// GET /counter-assignment/counters/{counterId}/queue
// Backend may return array<PatientInQueue>
export interface QueueResponseNormalized {
  queue: PatientInQueue[];
  total: number;
}

// GET /counter-assignment/counters/{counterId}/queue-status
// Guide shows wrapper { success, status: { ... } }
export interface QueueStatusRaw {
  success: boolean;
  status: {
    current?: { ticketId: string; patientName?: string; status?: PatientStatus } | null;
    queue?: Array<{ ticketId: string; patientName?: string; status?: PatientStatus; isPriority?: boolean }>;
    queueCount?: number;
    skippedCount?: number;
    isOnline?: boolean;
  };
}

export interface CallNextPatientResponse {
  success: boolean;
  message?: string;
  patient?: PatientInQueue;
}

export interface SkipCurrentPatientResponse {
  success: boolean;
  message?: string;
  patient?: PatientInQueue; // new current
  skippedPatient?: PatientInQueue;
}

export interface MarkServedResponse {
  success: boolean;
  message?: string;
}

