export enum MedicationPrescriptionStatus {
  DRAFT = 'DRAFT',
  SIGNED = 'SIGNED',
  CANCELLED = 'CANCELLED',
}

export interface MedicationPrescriptionItem {
  id?: string;
  drugId?: string;
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
}

export interface MedicationPrescription {
  id: string;
  code: string;
  doctorId?: string;
  patientProfileId: string;
  medicalRecordId?: string;
  note?: string;
  status: MedicationPrescriptionStatus;
  items: MedicationPrescriptionItem[];
  createdAt: string;
  updatedAt: string;
  // Feedback fields
  feedbackMessage?: string | null;
  feedbackIsUrgent?: boolean | null;
  feedbackById?: string | null;
  feedbackByRole?: 'PATIENT' | 'DOCTOR' | 'ADMIN' | null;
  feedbackAt?: string | null;
  feedbackResponseNote?: string | null;
  feedbackResponseAt?: string | null;
  feedbackProcessed?: boolean;
  // Related entities from API response
  patientProfile?: {
    id: string;
    profileCode: string;
    name: string;
    phone?: string;
    dateOfBirth: string;
    gender: string;
    address: string;
    occupation: string;
    emergencyContact: {
      name: string;
      phone: string;
      relationship: string;
    };
    healthInsurance?: string;
    relationship: string;
    isActive: boolean;
  };
  doctor?: {
    id: string;
    doctorCode: string;
    degrees?: string[];
    yearsExperience?: number;
    rating?: number;
    workHistory?: string;
    description?: string;
  };
  medicalRecord?: {
    id: string;
    medicalRecordCode: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    content: Record<string, any>;
    status: string;
  };
}

export interface CreateMedicationPrescriptionDto {
  code?: string;
  patientProfileId: string;
  medicalRecordId?: string;
  note?: string;
  status?: MedicationPrescriptionStatus;
  items: CreateMedicationPrescriptionItemDto[];
}

export interface CreateMedicationPrescriptionItemDto {
  drugId?: string;
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
}

export interface UpdateMedicationPrescriptionDto {
  note?: string;
  status?: MedicationPrescriptionStatus;
  items?: UpdateMedicationPrescriptionItemDto[];
}

export interface UpdateMedicationPrescriptionItemDto {
  drugId?: string;
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
}

// Drug search types
// Drug search types (OpenFDA label API formatted by backend)
export interface DrugSearchResult {
  id: string;
  openfda: {
    brand_name: string | null;
    generic_name: string | null;
    route: string | null;
    dosage_form: string | null;
    manufacturer_name: string | null;
  };
  indications_and_usage: string | null;
  dosage_and_administration: string | null;
  warnings: string | null;
  contraindications: string | null;
  adverse_reactions: string | null;
  // Legacy optional fields for backward compatibility
  product_ndc?: string;
  strength?: string;
}

export interface DrugSearchResponse {
  results: DrugSearchResult[];
  total: number;
  limit: number;
  skip: number;
}

export interface DrugByNdcResponse {
  id?: string;
  openfda?: {
    brand_name?: string | null;
    generic_name?: string | null;
    route?: string | null;
    dosage_form?: string | null;
    manufacturer_name?: string | null;
  };
  indications_and_usage?: string | null;
  dosage_and_administration?: string | null;
  warnings?: string | null;
  contraindications?: string | null;
  adverse_reactions?: string | null;
  // Legacy optional fields
  product_ndc?: string;
  strength?: string;
  description?: string;
}
