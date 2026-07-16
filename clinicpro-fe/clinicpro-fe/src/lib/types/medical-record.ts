/* eslint-disable @typescript-eslint/no-explicit-any */
export interface FieldDefinition {
  name: string;
  label: string;
  type: 'string' | 'text' | 'number' | 'boolean' | 'date' | 'datetime' | 'object' | 'array' | 'select' | 'multiselect';
  required?: boolean;
  properties?: Record<string, { type: string }>;
  items?: {
    type: string;
    properties?: Record<string, { type: string }>;
  };
  options?: string[]; // For select/multiselect types
  placeholder?: string;
  defaultValue?: string | number | boolean;
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
  };
}

export interface Template {
  id: string;
  templateCode: string;
  name: string;
  specialtyName?: string; // Deprecated: use specialty.name instead
  specialty?: {
    id: string;
    name: string;
    specialtyCode: string;
  };
  fields: {
    [x: string]: any;
    fields: FieldDefinition[];
  };
  isActive?: boolean;
  enableAutoDiagnosis?: boolean;
}

export interface MedicalRecord {
  [x: string]: any;
  patientProfile: any;
  id: string;
  patientProfileId: string;
  templateId: string;
  doctorId?: string;
  appointmentId?: string;
  status: MedicalRecordStatus;
  content: Record<string, any>;
  attachments?: Attachment[];
  createdAt: string;
  updatedAt: string;
}

export enum MedicalRecordStatus {
  DRAFT = 'DRAFT',
  COMPLETED = 'COMPLETED',
  IN_PROGRESS = 'IN_PROGRESS',
  CANCELLED = "CANCELLED",
}

export interface CreateMedicalRecordDto {
  patientProfileId: string;
  templateId: string;
  doctorId?: string;
  appointmentCode?: string;
  status?: MedicalRecordStatus;
  content: Record<string, any>;
  files?: File[];
}

export interface UpdateMedicalRecordDto {
  content?: Record<string, any>;
  status?: MedicalRecordStatus;
  files?: File[];
  appendFiles?: boolean;
}

export interface VitalSigns {
  temp?: number;
  bp?: string;
  hr?: number;
  rr?: number;
  o2_sat?: number;
  pain_score?: number;
  weight?: number;
  height?: number;
}

export interface Attachment {
  filename: string;
  filetype: string;
  url: string;
}
