import { useState, useEffect } from 'react';
import { patientProfileApi, PatientProfile } from '@/lib/api';
import { useAuth } from './useAuth';

export const usePatientProfiles = () => {
  const [patientProfiles, setPatientProfiles] = useState<PatientProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchPatientProfiles = async () => {
    if (!user?.id) {
      setError('User ID not found');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await patientProfileApi.getByPatientId(user.id);
      setPatientProfiles(response.data || []);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch patient profiles');
      console.error('Error fetching patient profiles:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatientProfiles();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  return {
    patientProfiles,
    loading,
    error,
    refetch: fetchPatientProfiles,
  };
};
