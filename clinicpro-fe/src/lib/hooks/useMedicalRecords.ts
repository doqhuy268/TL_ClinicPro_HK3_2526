import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { 
  MedicalRecord, 
  Template, 
  CreateMedicalRecordDto, 
  UpdateMedicalRecordDto 
} from '@/lib/types/medical-record';
import { medicalRecordService } from '@/lib/services/medical-record.service';

interface UseMedicalRecordsProps {
  patientProfileId?: string;
  autoLoad?: boolean;
}

export function useMedicalRecords({ 
  patientProfileId, 
  autoLoad = true 
}: UseMedicalRecordsProps = {}) {
  const [medicalRecords, setMedicalRecords] = useState<MedicalRecord[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load medical records
  const loadMedicalRecords = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      let records: MedicalRecord[];
      if (patientProfileId) {
        records = await medicalRecordService.getByPatientProfile(patientProfileId);
      } else {
        records = await medicalRecordService.getAll();
      }
      
      setMedicalRecords(records);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Có lỗi xảy ra khi tải dữ liệu';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [patientProfileId]);

  // Load templates
  const loadTemplates = useCallback(async () => {
    try {
      const templatesData = await medicalRecordService.getTemplates();
      setTemplates(templatesData);
    } catch (err) {
      console.error('Error loading templates:', err);
      // Fallback to local templates if API fails
      const fallbackTemplates: Template[] = [];
      setTemplates(fallbackTemplates);
    }
  }, []);

  // Create medical record
  const createMedicalRecord = useCallback(async (data: CreateMedicalRecordDto): Promise<MedicalRecord> => {
    try {
      const newRecord = await medicalRecordService.create(data);
      setMedicalRecords(prev => [newRecord, ...prev]);
      toast.success('Tạo bệnh án thành công');
      return newRecord;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Có lỗi xảy ra khi tạo bệnh án';
      toast.error(errorMessage);
      throw err;
    }
  }, []);

  // Update medical record
  const updateMedicalRecord = useCallback(async (id: string, data: UpdateMedicalRecordDto): Promise<MedicalRecord> => {
    try {
      const updatedRecord = await medicalRecordService.update(id, data);
      setMedicalRecords(prev => 
        prev.map(record => record.id === id ? updatedRecord : record)
      );
      toast.success('Cập nhật bệnh án thành công');
      return updatedRecord;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Có lỗi xảy ra khi cập nhật bệnh án';
      toast.error(errorMessage);
      throw err;
    }
  }, []);

  // Delete medical record
  const deleteMedicalRecord = useCallback(async (id: string): Promise<void> => {
    try {
      await medicalRecordService.delete(id);
      setMedicalRecords(prev => prev.filter(record => record.id !== id));
      toast.success('Xóa bệnh án thành công');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Có lỗi xảy ra khi xóa bệnh án';
      toast.error(errorMessage);
      throw err;
    }
  }, []);

  // Get medical record by ID
  const getMedicalRecordById = useCallback(async (id: string): Promise<MedicalRecord> => {
    try {
      return await medicalRecordService.getById(id);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Có lỗi xảy ra khi tải bệnh án';
      toast.error(errorMessage);
      throw err;
    }
  }, []);

  // Get template by ID
  const getTemplateById = useCallback(async (templateId: string): Promise<Template> => {
    try {
      return await medicalRecordService.getTemplateById(templateId);
    } catch (err) {
      // Fallback to local template
      const localTemplate = templates.find(t => t.templateCode === templateId);
      if (localTemplate) {
        return localTemplate;
      }
      throw err;
    }
  }, [templates]);

  // Load data on mount
  useEffect(() => {
    if (autoLoad) {
      loadTemplates();
      loadMedicalRecords();
    }
  }, [autoLoad, loadTemplates, loadMedicalRecords]);

  return {
    // State
    medicalRecords,
    templates,
    isLoading,
    error,
    
    // Actions
    loadMedicalRecords,
    loadTemplates,
    createMedicalRecord,
    updateMedicalRecord,
    deleteMedicalRecord,
    getMedicalRecordById,
    getTemplateById,
    
    // Utilities
    refresh: loadMedicalRecords,
  };
}
