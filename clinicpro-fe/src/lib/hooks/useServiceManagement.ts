import { useState, useCallback } from 'react';
import { serviceApi } from '@/lib/api';
import {
  SearchServiceDto,
  GetAllServicesDto,
  ScanPrescriptionDto,
  UpdateServiceStatusDto,
  UpdateServiceResultsDto,
  GetServicesDto,
  ScanPrescriptionResponse,
  UpdateServiceStatusResponse,
  UpdateServiceResultsResponse,
  GetMyServicesResponse,
  GetWorkSessionResponse,
} from '@/lib/types/service-processing';

export const useServiceManagement = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => setError(null), []);

  // Search services
  const searchServices = useCallback(async (params: SearchServiceDto) => {
    setLoading(true);
    setError(null);
    try {
      const response = await serviceApi.search(params);
      return response.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Có lỗi xảy ra khi tìm kiếm dịch vụ';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Get all services
  const getAllServices = useCallback(async (params?: GetAllServicesDto) => {
    setLoading(true);
    setError(null);
    try {
      const response = await serviceApi.getAll(params);
      return response.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Có lỗi xảy ra khi lấy danh sách dịch vụ';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Get service by ID
  const getServiceById = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await serviceApi.getById(id);
      return response.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Có lỗi xảy ra khi lấy thông tin dịch vụ';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Scan prescription
  const scanPrescription = useCallback(async (data: ScanPrescriptionDto): Promise<ScanPrescriptionResponse> => {
    setLoading(true);
    setError(null);
    try {
      const response = await serviceApi.scanPrescription(data);
      return response.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Có lỗi xảy ra khi quét phiếu chỉ định';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Update service status
  const updateServiceStatus = useCallback(async (data: UpdateServiceStatusDto): Promise<UpdateServiceStatusResponse> => {
    setLoading(true);
    setError(null);
    try {
      const response = await serviceApi.updateStatus({
        prescriptionServiceId: data.prescriptionServiceId,
        status: data.status as "PENDING" | "WAITING" | "SERVING" | "WAITING_RESULT" | "COMPLETED" | "DELAYED" | "CANCELLED",
        note: data.note
      });
      return response.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Có lỗi xảy ra khi cập nhật trạng thái dịch vụ';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Update service results
  const updateServiceResults = useCallback(async (data: UpdateServiceResultsDto): Promise<UpdateServiceResultsResponse> => {
    setLoading(true);
    setError(null);
    try {
      const response = await serviceApi.updateResults(data);
      return response.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Có lỗi xảy ra khi cập nhật kết quả dịch vụ';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Get my services
  const getMyServices = useCallback(async (params?: GetServicesDto): Promise<GetMyServicesResponse> => {
    setLoading(true);
    setError(null);
    try {
      const response = await serviceApi.getMyServices({
        status: params?.status as "PENDING" | "WAITING" | "SERVING" | "WAITING_RESULT" | "COMPLETED" | "DELAYED" | "CANCELLED",
        workSessionId: params?.workSessionId,
        limit: params?.limit,
        offset: params?.offset
      });
      return response.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Có lỗi xảy ra khi lấy danh sách dịch vụ của tôi';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Get current work session
  const getCurrentWorkSession = useCallback(async (): Promise<GetWorkSessionResponse> => {
    setLoading(true);
    setError(null);
    try {
      const response = await serviceApi.getCurrentWorkSession();
      return response.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Có lỗi xảy ra khi lấy thông tin work session';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Start service
  const startService = useCallback(async (prescriptionServiceId: string): Promise<UpdateServiceStatusResponse> => {
    setLoading(true);
    setError(null);
    try {
      const response = await serviceApi.startService(prescriptionServiceId);
      return response.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Có lỗi xảy ra khi bắt đầu dịch vụ';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Complete service
  const completeService = useCallback(async (prescriptionServiceId: string): Promise<UpdateServiceStatusResponse> => {
    setLoading(true);
    setError(null);
    try {
      const response = await serviceApi.completeService(prescriptionServiceId);
      return response.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Có lỗi xảy ra khi hoàn thành dịch vụ';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    clearError,
    searchServices,
    getAllServices,
    getServiceById,
    scanPrescription,
    updateServiceStatus,
    updateServiceResults,
    getMyServices,
    getCurrentWorkSession,
    startService,
    completeService,
  };
};
