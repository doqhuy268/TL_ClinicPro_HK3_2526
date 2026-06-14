import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { patientProfileService } from '@/lib/services/patient-profile.service';
import { PatientProfile } from '@/lib/types/user';
import { CreatePatientProfileDto } from '@/lib/services/patient-profile.service';

interface UsePatientProfileProps {
  patientId?: string;
  patientProfileId?: string;
  autoLoad?: boolean;
}

export function usePatientProfile({ 
  patientId, 
  patientProfileId, 
  autoLoad = true 
}: UsePatientProfileProps = {}) {
  const [patientProfile, setPatientProfile] = useState<PatientProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load patient profile
  const loadPatientProfile = useCallback(async () => {
    if (!patientId && !patientProfileId) {
      setError('Cần cung cấp patientId hoặc patientProfileId');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      let profile;
      if (patientProfileId) {
        profile = await patientProfileService.getPatientProfileById(patientProfileId);
      } else if (patientId) {
        // For patientId, get all patient profiles and use the first one
        const profiles = await patientProfileService.getPatientProfilesByPatientId(patientId);
        profile = profiles && profiles.length > 0 ? profiles[0] : null;
      }
      
      if (profile) {
        setPatientProfile(profile);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Có lỗi xảy ra khi tải thông tin bệnh nhân';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [patientId, patientProfileId]);

  // Create patient profile
  const createPatientProfile = useCallback(async (data: CreatePatientProfileDto): Promise<PatientProfile> => {
    try {
      const newProfile = await patientProfileService.create(data);
      setPatientProfile(newProfile);
      toast.success('Tạo hồ sơ bệnh nhân thành công');
      return newProfile;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Có lỗi xảy ra khi tạo hồ sơ bệnh nhân';
      toast.error(errorMessage);
      throw err;
    }
  }, []);

  // Update patient profile
  const updatePatientProfile = useCallback(async (data: Partial<CreatePatientProfileDto>): Promise<PatientProfile> => {
    if (!patientProfile?.id) {
      throw new Error('Không tìm thấy ID hồ sơ bệnh nhân');
    }

    try {
      const updatedProfile = await patientProfileService.update(patientProfile.id, data);
      setPatientProfile(updatedProfile);
      toast.success('Cập nhật hồ sơ bệnh nhân thành công');
      return updatedProfile;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Có lỗi xảy ra khi cập nhật hồ sơ bệnh nhân';
      toast.error(errorMessage);
      throw err;
    }
  }, [patientProfile?.id]);

  // Delete patient profile - not available in new service
  const deletePatientProfile = useCallback(async (): Promise<void> => {
    throw new Error('Delete functionality not available in new PatientProfile service');
  }, []);

  // Load data on mount
  useEffect(() => {
    if (autoLoad) {
      loadPatientProfile();
    }
  }, [autoLoad, loadPatientProfile]);

  return {
    // State
    patientProfile,
    isLoading,
    error,
    
    // Actions
    loadPatientProfile,
    createPatientProfile,
    updatePatientProfile,
    deletePatientProfile,
    
    // Utilities
    refresh: loadPatientProfile,
  };
}
