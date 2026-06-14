import { useState, useEffect, useCallback } from 'react';
import { serviceApi } from '@/lib/api';
import { Service } from '@/lib/types/work-session';

// Extended Service type with location information
export interface ServiceWithLocation extends Service {
  boothIds?: string[];
  clinicRoomIds?: string[];
}

// Doctor information type
export interface DoctorInfo {
  id: string;
  doctorCode: string;
  name: string;
  isActive: boolean;
  specialty: {
    id: string;
    name: string;
    specialtyCode: string;
  };
  specialtyIds: string[];
}

interface ServicesApiResponse {
  success: boolean;
  message: string;
  data: {
    services: Service[];
    pagination: {
      total: number;
      limit: number;
      offset: number;
      hasMore: boolean;
    };
  };
}

interface DoctorServicesApiResponse {
  success: boolean;
  message: string;
  data: {
    doctor: DoctorInfo;
    services: ServiceWithLocation[];
    pagination: {
      total: number;
      limit: number;
      offset: number;
      hasMore: boolean;
    };
  };
}

interface LocationServicesApiResponse {
  success: boolean;
  message: string;
  data: {
    referenceServiceIds: string[];
    boothIds: string[];
    clinicRoomIds: string[];
    services: ServiceWithLocation[];
    pagination: {
      total: number;
      limit: number;
      offset: number;
      hasMore: boolean;
    };
  };
}

interface UseServicesReturn {
  services: Service[];
  allServices: Service[];
  loading: boolean;
  error: string | null;
  total: number;
  refetch: () => Promise<void>;
  searchServices: (query: string) => Promise<void>;
  getServicesByDoctorCode: (doctorCode: string) => Promise<{
    doctor: DoctorInfo;
    services: ServiceWithLocation[];
    total: number;
  }>;
  getServicesByLocation: (serviceIds: string[]) => Promise<{
    services: ServiceWithLocation[];
    boothIds: string[];
    clinicRoomIds: string[];
    referenceServiceIds: string[];
    total: number;
  }>;
}

export function useServices(): UseServicesReturn {
  const [allServices, setAllServices] = useState<Service[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);

  const fetchServices = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Respect API limit (max 100)
      const response = await serviceApi.getAll({ limit: 100, offset: 0 });
      
      // Extract services from API response with correct structure
      const responseData = response.data as ServicesApiResponse;
      const servicesData = responseData?.data?.services || [];
      const validServices = Array.isArray(servicesData) ? servicesData : [];
      const totalCount = responseData?.data?.pagination?.total || validServices.length;
      
      setAllServices(validServices);
      setServices(validServices); // Initially show all services
      setTotal(totalCount);
    } catch (err) {
      console.error('Error fetching services:', err);
      const error = err as { response?: { data?: { message?: string } }; message?: string };
      setError(error?.response?.data?.message || error?.message || 'Có lỗi xảy ra khi tải dịch vụ');
      setAllServices([]);
      setServices([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, []);

  const searchServices = useCallback(async (query: string) => {
    const trimmed = query.trim();
    // When query empty, restore initial list
    if (!trimmed) {
      setServices(allServices);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      // Respect API limit (max 100)
      const response = await serviceApi.search({ query: trimmed, limit: 100, offset: 0 });
      const responseData = response.data as ServicesApiResponse;
      const servicesData = responseData?.data?.services || [];
      const validServices = Array.isArray(servicesData) ? servicesData : [];
      const totalCount = responseData?.data?.pagination?.total || validServices.length;

      setServices(validServices);
      setTotal(totalCount);
    } catch (err) {
      console.error('Error searching services:', err);
      const error = err as { response?: { data?: { message?: string } }; message?: string };
      setError(error?.response?.data?.message || error?.message || 'Có lỗi xảy ra khi tìm kiếm dịch vụ');
      setServices([]);
    } finally {
      setLoading(false);
    }
  }, [allServices]);

  const refetch = async () => {
    await fetchServices();
  };

  const getServicesByDoctorCode = useCallback(async (doctorCode: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await serviceApi.getByDoctorCode(doctorCode, { limit: 100, offset: 0 });
      const responseData = response.data as DoctorServicesApiResponse;
      
      if (!responseData?.data?.doctor) {
        throw new Error('Không tìm thấy thông tin bác sĩ');
      }
      
      const doctor = responseData.data.doctor;
      const servicesData = responseData?.data?.services || [];
      const validServices = Array.isArray(servicesData) ? servicesData : [];
      const totalCount = responseData?.data?.pagination?.total || validServices.length;
      
      return {
        doctor,
        services: validServices,
        total: totalCount,
      };
    } catch (err) {
      console.error('Error fetching services by doctor code:', err);
      const error = err as { response?: { data?: { message?: string } }; message?: string };
      setError(error?.response?.data?.message || error?.message || 'Có lỗi xảy ra khi tải dịch vụ theo bác sĩ');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getServicesByLocation = useCallback(async (serviceIds: string[]) => {
    try {
      setLoading(true);
      setError(null);
      
      if (!serviceIds || serviceIds.length === 0) {
        throw new Error('Danh sách serviceIds không được để trống');
      }
      
      const response = await serviceApi.getByLocation({ serviceIds });
      const responseData = response.data as LocationServicesApiResponse;
      
      const servicesData = responseData?.data?.services || [];
      const validServices = Array.isArray(servicesData) ? servicesData : [];
      const boothIds = responseData?.data?.boothIds || [];
      const clinicRoomIds = responseData?.data?.clinicRoomIds || [];
      const referenceServiceIds = responseData?.data?.referenceServiceIds || [];
      const totalCount = responseData?.data?.pagination?.total || validServices.length;
      
      return {
        services: validServices,
        boothIds,
        clinicRoomIds,
        referenceServiceIds,
        total: totalCount,
      };
    } catch (err) {
      console.error('Error fetching services by location:', err);
      const error = err as { response?: { data?: { message?: string } }; message?: string };
      setError(error?.response?.data?.message || error?.message || 'Có lỗi xảy ra khi tải dịch vụ theo vị trí');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  return {
    services,
    allServices,
    loading,
    error,
    total,
    refetch,
    searchServices,
    getServicesByDoctorCode,
    getServicesByLocation,
  };
}
