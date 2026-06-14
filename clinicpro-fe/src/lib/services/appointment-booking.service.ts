import api from '../config';

export interface PatientAppointmentService {
  serviceId: string;
  serviceName: string;
  serviceCode: string;
  price: number | null;
  timePerPatient: number;
}

export interface PatientAppointment {
  appointmentId: string;
  appointmentCode: string;
  patientProfileCode: string;
  patientProfile?: {
    id: string;
    profileCode: string;
    name: string;
    age?: number;
    gender?: string;
    dateOfBirth?: string;
    phone?: string;
    isPregnant?: boolean;
    isDisabled?: boolean;
  };
  doctorId: string;
  doctorName: string;
  specialtyId: string;
  specialtyName: string;
  date: string;
  startTime: string;
  endTime: string;
  status: string;
  services: PatientAppointmentService[];
  createdAt: string;
}

export interface DoctorAppointmentsResponse {
  doctorId: string;
  doctorName: string;
  totalAppointments: number;
  appointments: PatientAppointment[];
  meta: {
    total: number;
    limit: number;
    offset: number;
    totalPages: number;
  };
}

export interface AppointmentFilters {
  patientName?: string;
  patientPhone?: string;
  dateFrom?: string;
  dateTo?: string;
  serviceId?: string;
  status?: string;
}

class AppointmentBookingService {
  // Get doctor's appointments with pagination and filters
  async getDoctorMyAppointments(
    limit: number = 10,
    offset: number = 0,
    filters?: AppointmentFilters,
  ): Promise<DoctorAppointmentsResponse> {
    const params: Record<string, string | number> = {
      limit,
      offset,
    };

    if (filters) {
      if (filters.patientName) params.patientName = filters.patientName;
      if (filters.patientPhone) params.patientPhone = filters.patientPhone;
      if (filters.dateFrom) params.dateFrom = filters.dateFrom;
      if (filters.dateTo) params.dateTo = filters.dateTo;
      if (filters.serviceId) params.serviceId = filters.serviceId;
      if (filters.status) params.status = filters.status;
    }

    const response = await api.get('/appointment-booking/doctor/my-appointments', {
      params,
    });
    return response.data;
  }
}

export const appointmentBookingService = new AppointmentBookingService();
