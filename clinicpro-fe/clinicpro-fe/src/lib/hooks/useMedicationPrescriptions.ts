'use client';

import { useState, useEffect } from 'react';
import { medicationPrescriptionApi } from '@/lib/api';
import { MedicationPrescription } from '@/lib/types/medication-prescription';

export function useMedicationPrescriptions(isDoctor: boolean = false) {
  const [prescriptions, setPrescriptions] = useState<MedicationPrescription[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPrescriptions = async () => {
    try {
      setLoading(true);
      setError(null);
      
      let response;
      if (isDoctor) {
        response = await medicationPrescriptionApi.getDoctorPrescriptions();
      } else {
        response = await medicationPrescriptionApi.getPatientPrescriptions();
      }
      
      setPrescriptions(response.data);
    } catch (err) {
      console.error('Error fetching prescriptions:', err);
      setError('Không thể tải danh sách đơn thuốc');
    } finally {
      setLoading(false);
    }
  };

  const createPrescription = async (data: {
    patientProfileId: string;
    medicalRecordId?: string;
    note?: string;
    status?: 'DRAFT' | 'SIGNED' | 'CANCELLED';
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    items: any[];
  }) => {
    try {
      const response = await medicationPrescriptionApi.create(data);
      setPrescriptions(prev => [response.data, ...prev]);
      return response.data;
    } catch (err) {
      console.error('Error creating prescription:', err);
      throw err;
    }
  };

  const updatePrescription = async (id: string, data: {
    note?: string;
    status?: 'DRAFT' | 'SIGNED' | 'CANCELLED';
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    items?: any[];
  }) => {
    try {
      const response = await medicationPrescriptionApi.update(id, data);
      setPrescriptions(prev => 
        prev.map(prescription => 
          prescription.id === id ? response.data : prescription
        )
      );
      return response.data;
    } catch (err) {
      console.error('Error updating prescription:', err);
      throw err;
    }
  };

  const deletePrescription = async (id: string) => {
    try {
      await medicationPrescriptionApi.delete(id);
      setPrescriptions(prev => prev.filter(prescription => prescription.id !== id));
    } catch (err) {
      console.error('Error deleting prescription:', err);
      throw err;
    }
  };

  useEffect(() => {
    fetchPrescriptions();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    prescriptions,
    loading,
    error,
    fetchPrescriptions,
    createPrescription,
    updatePrescription,
    deletePrescription,
  };
}
