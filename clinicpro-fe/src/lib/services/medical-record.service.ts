import { 
  MedicalRecord, 
  Template, 
  CreateMedicalRecordDto, 
  UpdateMedicalRecordDto 
} from '@/lib/types/medical-record';
import api from '../config';

// Some endpoints return an array directly, others wrap in { data, meta }
function unwrapArrayResponse<T>(payload: unknown): T[] {
  if (Array.isArray(payload)) return payload as T[];
  if (payload && typeof payload === 'object' && Array.isArray((payload as { data?: unknown }).data)) {
    return (payload as { data: T[] }).data;
  }
  return [] as T[];
}

function unwrapObjectResponse<T>(payload: unknown): T {
  if (payload && typeof payload === 'object' && (payload as { data?: T }).data !== undefined) {
    return (payload as { data: T }).data as T;
  }
  return payload as T;
}

class MedicalRecordService {
  // Get all medical records
  async getAll(): Promise<MedicalRecord[]> {
    const response = await api.get('/medical-records');
    return unwrapArrayResponse<MedicalRecord>(response.data);
  }

  // Get medical records by patient profile
  async getByPatientProfile(patientProfileId: string): Promise<MedicalRecord[]> {
    const response = await api.get(`/medical-records/patient-profile/${patientProfileId}`);
    return unwrapArrayResponse<MedicalRecord>(response.data);
  }


//   // Get medical records by doctor
//   async getByDoctor(doctorId: string): Promise<MedicalRecord[]> {
//     const response = await api.get(`/medical-records/doctor/${doctorId}/medical-records`);
//     return response.data;
//   }

  // Get single medical record
  async getById(id: string): Promise<MedicalRecord> {
    const response = await api.get(`/medical-records/${id}`);
    return unwrapObjectResponse<MedicalRecord>(response.data);
  }

  // Create new medical record
  async create(data: CreateMedicalRecordDto): Promise<MedicalRecord> {
    console.log('data', data);
    
    // Check if we have files to upload
    if (data.files && data.files.length > 0) {
      const formData = new FormData();
      
      // Add files
      data.files.forEach(file => {
        formData.append('files', file);
      });
      
      // Add other fields
      formData.append('patientProfileId', data.patientProfileId);
      formData.append('templateId', data.templateId);
      if (data.doctorId) formData.append('doctorId', data.doctorId);
      if (data.appointmentCode) formData.append('appointmentCode', data.appointmentCode);
      if (data.status) formData.append('status', data.status);
      formData.append('content', JSON.stringify(data.content));
      
      const response = await api.post('/medical-records', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return unwrapObjectResponse<MedicalRecord>(response.data);
    } else {
      // No files, send as JSON
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { files, ...jsonData } = data;
      const response = await api.post('/medical-records', jsonData);
      return unwrapObjectResponse<MedicalRecord>(response.data);
    }
  }

  // Update medical record
  async update(id: string, data: UpdateMedicalRecordDto): Promise<MedicalRecord> {
    // Check if we have files to upload
    if (data.files && data.files.length > 0) {
      const formData = new FormData();
      
      // Add files
      data.files.forEach(file => {
        formData.append('files', file);
      });
      
      // Add other fields
      if (data.content) formData.append('content', JSON.stringify(data.content));
      if (data.status) formData.append('status', data.status);
      if (data.appendFiles !== undefined) formData.append('appendFiles', data.appendFiles.toString());
      
      const response = await api.patch(`/medical-records/${id}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return unwrapObjectResponse<MedicalRecord>(response.data);
    } else {
      // No files, send as JSON
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { files, appendFiles, ...jsonData } = data;
      const response = await api.patch(`/medical-records/${id}`, jsonData);
      return unwrapObjectResponse<MedicalRecord>(response.data);
    }
  }

  // Delete medical record
  async delete(id: string): Promise<void> {
    await api.delete(`/medical-records/${id}`);
  }

  // Get all templates
  async getTemplates(): Promise<Template[]> {
    const response = await api.get('/medical-records/templates');
    return unwrapArrayResponse<Template>(response.data);
  }

  // Get template by ID
  async getTemplateById(templateId: string): Promise<Template> {
    const response = await api.get(`/medical-records/templates/${templateId}`);
    return unwrapObjectResponse<Template>(response.data);
  }

  // Get template by medical record
  async getTemplateByMedicalRecord(id: string): Promise<Template> {
    const response = await api.get(`/medical-records/${id}/template`);
    return unwrapObjectResponse<Template>(response.data);
  }

  // Get all templates (from templates endpoint) with pagination
  async getAllTemplates(limit: number = 10, offset: number = 0): Promise<{ data: Template[]; meta?: { page: number; limit: number; total: number; totalPages: number } }> {
    const response = await api.get('/templates', {
      params: {
        limit,
        offset,
      },
    });
    return response.data;
  }

  // Update template auto diagnosis setting
  async updateTemplateAutoDiagnosis(templateId: string, enableAutoDiagnosis: boolean): Promise<Template> {
    const response = await api.patch(`/templates/${templateId}/auto-diagnosis`, {
      enableAutoDiagnosis,
    });
    return unwrapObjectResponse<Template>(response.data);
  }
}

export const medicalRecordService = new MedicalRecordService();
