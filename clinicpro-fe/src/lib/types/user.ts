export interface PatientProfile {
  id: string;
  profileCode: string;
  name: string;
  phone?: string; // New field for phone number
  dateOfBirth: string;
  gender: 'male' | 'female' | 'other';
  address: string;
  emergencyContact: {
    name: string;
    phone: string;
    relationship: string;
  };
  occupation: string;
  healthInsurance: string;
  relationship: string;
  isActive: boolean;
  patientId?: string | null; // Optional - can be null for independent profiles
}

export interface Patient {
  id: string;
  patientCode: string;
  loyaltyPoints: number;
  patientProfiles: PatientProfile[];
}

export interface Doctor {
  id: string;
  doctorCode: string;
  degrees?: string[];
  yearsExperience?: number;
  rating?: number;
  workHistory?: string;
  description?: string;
}

export interface Receptionist {
  id: string;
  receptionistCode: string;
  department: string;
}

export interface Admin {
  id: string;
  adminCode: string;
  permissions: string[];
}

export interface Cashier {
  id: string;
  cashierCode: string;
  permissions: string[];
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatar: string | null;
  role: 'PATIENT' | 'DOCTOR' | 'RECEPTIONIST' | 'ADMIN';
  dateOfBirth: string;
  gender: 'male' | 'female' | 'other';
  address: string;
  citizenId: string;
  patient: Patient | null;
  doctor: Doctor | null;
  receptionist: Receptionist | null;
  admin: Admin | null;
}

export interface UserSearchResponse {
  query: string;
  total: number;
  users: User[];
}

export interface PatientProfileSearchResponse {
  query: string;
  total: number;
  patientProfiles: PatientProfile[];
}
