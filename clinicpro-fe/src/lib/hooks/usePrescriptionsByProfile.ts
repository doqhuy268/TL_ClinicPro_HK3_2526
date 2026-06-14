/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from 'react';
import { medicationPrescriptionApi } from '@/lib/api';

export interface MedicationPrescription {
  id: string;
  code: string;
  patientProfileId: string;
  medicalRecordId?: string | null;
  doctorId: string;
  doctor: {
    id: string;
    doctorCode: string;
    authId: string;
    degrees: string[];
    yearsExperience: number;
    rating: number;
    workHistory: string;
    description: string;
  };
  patientProfile?: {
    id: string;
    profileCode: string;
    patientId: string;
    name: string;
    phone?: string | null;
    dateOfBirth: string;
    gender: string;
    address: string;
    occupation: string;
    emergencyContact: {
      name: string;
      phone: string;
    };
    healthInsurance?: string | null;
    relationship: string;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
  };
  medicalRecord?: {
    id: string;
    medicalRecordCode: string;
    templateId: string;
    patientProfileId: string;
    doctorId: string;
    appointmentId?: string | null;
    content: {
      diagnosis?: string;
      treatment_plan?: string;
      chief_complaint?: string;
    };
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
    status: string;
  } | null;
  note?: string | null;
  status: 'DRAFT' | 'SIGNED' | 'CANCELLED';
  // Feedback fields
  feedbackMessage?: string | null;
  feedbackIsUrgent?: boolean | null;
  feedbackById?: string | null;
  feedbackByRole?: 'PATIENT' | 'DOCTOR' | 'ADMIN' | null;
  feedbackAt?: string | null;
  feedbackResponseNote?: string | null;
  feedbackResponseAt?: string | null;
  feedbackProcessed?: boolean;
  items: {
    id: string;
    prescriptionId: string;
    drugId?: string | null;
    name: string;
    ndc?: string | null;
    strength?: string | null;
    dosageForm?: string | null;
    route?: string | null;
    dose?: number | null;
    doseUnit?: string | null;
    frequency?: string | null;
    durationDays?: number | null;
    quantity?: number | null;
    quantityUnit?: string | null;
    instructions?: string | null;
    createdAt: string;
    updatedAt: string;
    drug?: any | null;
  }[];
  createdAt: string;
  updatedAt: string;
}

export const usePrescriptionsByProfile = (patientProfileId: string, params?: { page?: number; limit?: number }) => {
  const [prescriptions, setPrescriptions] = useState<MedicationPrescription[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);

  const fetchPrescriptions = async () => {
    if (!patientProfileId) return;

    try {
      setLoading(true);
      setError(null);
      const response = await medicationPrescriptionApi.getPrescriptionsByPatientProfile(patientProfileId, params);
      
      // Debug log to see actual response structure
      console.log('Prescriptions API response:', response);
      
      // Handle different response structures
      let prescriptionsData = [];
      let totalCount = 0;
      
      if (response.data && Array.isArray(response.data.results)) {
        // New API structure: { results: [...], total: 2, skip: 0, limit: 10 }
        prescriptionsData = response.data.results;
        totalCount = response.data.total || response.data.results.length;
      } else if (Array.isArray(response.data)) {
        prescriptionsData = response.data;
        totalCount = response.data.length;
      } else if (response.data && Array.isArray(response.data.data)) {
        prescriptionsData = response.data.data;
        totalCount = response.data.meta?.total || response.data.data.length;
      } else if (response.data && Array.isArray(response.data.prescriptions)) {
        prescriptionsData = response.data.prescriptions;
        totalCount = response.data.meta?.total || response.data.prescriptions.length;
      } else {
        console.warn('Unexpected response structure:', response.data);
        prescriptionsData = [];
      }
      
      setPrescriptions(prescriptionsData);
      setTotal(totalCount);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch prescriptions');
      console.error('Error fetching prescriptions:', err);
      setPrescriptions([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrescriptions();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patientProfileId, params?.page, params?.limit]);

  return {
    prescriptions,
    loading,
    error,
    total,
    refetch: fetchPrescriptions,
  };
};
