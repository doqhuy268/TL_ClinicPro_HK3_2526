import api from '../config';
import {
  ScanPrescriptionResponse,
  UpdateServiceStatusRequest,
  UpdateServiceStatusResponse,
  UpdateServiceResultsRequest,
  UpdateServiceResultsResponse,
  UploadResultFilesResponse,
  GetMyServicesResponse,
  GetWorkSessionResponse,
  ServiceStatus
} from '../types/service-processing';

class ServiceProcessingService {
  private baseUrl = '/services';

  // Note: Backend extracts userId from JWT token, no need to set it manually

  // 1. SCAN PRESCRIPTION
  async scanPrescription(prescriptionCode: string): Promise<ScanPrescriptionResponse> {
    const response = await api.post(`${this.baseUrl}/scan-prescription`, {
      prescriptionCode
    });
    return response.data;
  }

  // 2. UPDATE SERVICE STATUS - General status update with note
  async updateServiceStatus(data: UpdateServiceStatusRequest): Promise<UpdateServiceStatusResponse> {
    console.log('📝 Updating service status:', {
      prescriptionServiceId: data.prescriptionServiceId,
      status: data.status,
      note: data.note
    });
    console.log('🔐 JWT Token should be in Authorization header automatically');

    const response = await api.put(`/prescriptions/prescription-service/status`, data);
    console.log('🔄 Service status updated:', response.data);
    return response.data;
  }

  // 3. UPDATE SERVICE RESULTS
  async updateServiceResults(data: UpdateServiceResultsRequest): Promise<UpdateServiceResultsResponse> {
    console.log('📝 Updating service results:', {
      prescriptionServiceId: data.prescriptionServiceId,
      resultsCount: data.results.length,
      note: data.note,
      shouldReschedule: data.shouldReschedule
    });
    console.log('🔐 JWT Token should be in Authorization header automatically');

    const response = await api.put(`/prescriptions/prescription-service/results`, data);
    console.log('📋 Service results updated:', response.data);
    return response.data;
  }

  // 8. UPLOAD RESULT FILES
  async uploadResultFiles(files: File[]): Promise<UploadResultFilesResponse> {
    console.log('📤 Uploading result files:', files.length, 'files');
    console.log('🔐 JWT Token should be in Authorization header automatically');

    const formData = new FormData();
    files.forEach((file, index) => {
      console.log(`📎 File ${index + 1}:`, file.name, `(${file.size} bytes)`);
      formData.append('files', file);
    });

    const response = await api.post(`${this.baseUrl}/upload-results`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    console.log('✅ Files uploaded successfully:', response.data);
    return response.data;
  }

  // 4. GET MY SERVICES
  async getMyServices(params?: {
    status?: ServiceStatus;
    workSessionId?: string;
    limit?: number;
    offset?: number;
  }): Promise<GetMyServicesResponse> {
    const queryParams = new URLSearchParams();
    if (params?.status) queryParams.append('status', params.status);
    if (params?.workSessionId) queryParams.append('workSessionId', params.workSessionId);
    if (params?.limit !== undefined) queryParams.append('limit', params.limit.toString());
    if (params?.offset !== undefined) queryParams.append('offset', params.offset.toString());

    const queryString = queryParams.toString();
    const url = queryString ? `${this.baseUrl}/my-services?${queryString}` : `${this.baseUrl}/my-services`;

    console.log('🔍 Calling GET MY SERVICES:', url);
    console.log('🔐 JWT Token should be in Authorization header automatically');

    const response = await api.get(url);
    console.log('📋 My Services Response:', response.data);
    return response.data;
  }

  // 5. GET CURRENT WORK SESSION
  async getCurrentWorkSession(): Promise<GetWorkSessionResponse> {
    console.log('Calling GET WORK SESSION');
    console.log('JWT Token should be in Authorization header automatically');

    const response = await api.get(`${this.baseUrl}/work-session`);
    return response.data;
  }

  // 6. START SERVICE (SHORTCUT) - WAITING → SERVING
  async startService(prescriptionServiceId: string): Promise<UpdateServiceStatusResponse> {
    console.log('▶️ Starting service:', { prescriptionServiceId });
    console.log('🔐 JWT Token should be in Authorization header automatically');

    const response = await api.post(`${this.baseUrl}/prescription-service/start`, {
      prescriptionServiceId,
      status: 'SERVING',
      note: 'Bắt đầu thực hiện dịch vụ'
    });
    console.log('✅ Service started successfully:', response.data);
    return response.data;
  }

  // 7. COMPLETE SERVICE (SHORTCUT) - SERVING → WAITING_RESULT
  async completeService(prescriptionServiceId: string): Promise<UpdateServiceStatusResponse> {
    console.log('✅ Completing service:', { prescriptionServiceId });
    console.log('🔐 JWT Token should be in Authorization header automatically');

    const response = await api.post(`${this.baseUrl}/prescription-service/complete`, {
      prescriptionServiceId,
      status: 'WAITING_RESULT',
      note: 'Hoàn thành thực hiện dịch vụ'
    });
    console.log('🎯 Service completed successfully:', response.data);
    return response.data;
  }

  // 9. GET WAITING QUEUE
  async getWaitingQueue(): Promise<{
    patients: Array<{
      patientProfileId: string;
      patientName: string;
      prescriptionCode: string;
      services: Array<{ prescriptionId: string; serviceId: string; serviceName: string; order: number; status: string }>;
      overallStatus: 'SERVING' | 'PREPARING' | 'SKIPPED' | 'WAITING_RESULT' | 'RETURNING' | 'WAITING';
      queueOrder: number;
    }>;
    totalCount: number;
  }> {
    const response = await api.get(`/prescriptions/queue`);
    return response.data;
  }

  // 10. CALL NEXT PATIENT
  async callNextPatient(): Promise<{
    success: boolean;
    currentPatient?: { patientProfileId: string; patientName: string; prescriptionCode: string; status: string };
    nextPatient?: { patientProfileId: string; patientName: string; prescriptionCode: string; status: string };
    preparingPatient?: { patientProfileId: string; patientName: string; prescriptionCode: string; status: string };
    message: string;
  }> {
    console.log('📞 Calling next patient');
    console.log('🔐 JWT Token should be in Authorization header automatically');

    const response = await api.post(`/prescriptions/call-next-patient`);
    console.log('✅ Next patient called successfully:', response.data);
    return response.data;
  }

  // 11. SKIP PATIENT
  async skipPatient(prescriptionId: string, serviceId: string): Promise<unknown> {
    console.log('⏭️ Skipping patient:', { prescriptionId, serviceId });
    console.log('🔐 JWT Token should be in Authorization header automatically');

    const response = await api.put(`/prescriptions/prescription-service/skip`, {
      prescriptionId,
      serviceId
    });
    console.log('✅ Patient skipped successfully:', response.data);
    return response.data;
  }
}

// Test method to check if backend API is available
export const testBackendAPI = async (): Promise<boolean> => {
  try {
    console.log('Testing backend API availability');
    // Try to get work session to check if service processing API is working
    // const response = await api.get('/api/services/work-session');
    console.log('Service processing API is available');
    return true;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error('Service processing API test failed:', error.response?.status, error.response?.data || error.message);
    return false;
  }
};

export const serviceProcessingService = new ServiceProcessingService();
export default serviceProcessingService;
