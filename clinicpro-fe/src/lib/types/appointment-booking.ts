export interface Specialty {
  specialtyId: string;
  specialtyCode: string;
  name: string;
  description?: string;
}

export interface Doctor {
  doctorId: string;
  doctorCode: string;
  doctorName: string;
  specialtyId: string;
  specialtyName: string;
  rating: number;
  yearsExperience: number;
  description: string;
  workSessionStart?: string;
  workSessionEnd?: string;
  boothId?: string;
  boothName?: string;
  roomName?: string;
}

export interface Service {
  serviceId: string;
  serviceName: string;
  serviceCode: string;
  price: number;
  timePerPatient: number;
  description: string;
}

export interface TimeSlot {
  startTime: string;
  endTime: string;
  isAvailable: boolean;
}

export interface Appointment {
  appointmentId: string;
  appointmentCode: string;
  doctorId: string;
  doctorName: string;
  patientProfileId: string;
  patientName: string;
  serviceId: string;
  serviceName: string;
  date: string;
  startTime: string;
  endTime: string;
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';
  createdAt: string;
}

export type BookingFlow = 'BY_DATE' | 'BY_DOCTOR';

export interface AppointmentBookingState {
  currentStep: number;
  selectedSpecialty: Specialty | null;
  selectedDoctor: Doctor | null;
  selectedDate: string | null;
  selectedService: Service | null;
  selectedTimeSlot: TimeSlot | null;
  bookingFlow: BookingFlow;
  availableDoctors: Doctor[];
  availableServices: Service[];
  availableSlots: TimeSlot[];
  workingDays: string[];
  loading: boolean;
  error: string | null;
  success: string | null;
}

export interface BookingStep {
  id: number;
  name: string;
  description: string;
}

export const BOOKING_STEPS: BookingStep[] = [
  { id: 1, name: 'Chuyên khoa', description: 'Chọn chuyên khoa bạn muốn khám' },
  { id: 2, name: 'Chọn bác sĩ', description: 'Chọn bác sĩ phù hợp' },
  { id: 3, name: 'Chọn ngày', description: 'Chọn ngày khám' },
  { id: 4, name: 'Chọn dịch vụ', description: 'Chọn dịch vụ khám' },
  { id: 5, name: 'Chọn giờ', description: 'Chọn giờ khám' },
  { id: 6, name: 'Xác nhận', description: 'Xác nhận thông tin đặt lịch' },
];

// API Response Types
export interface SpecialtiesResponse {
  specialties: Specialty[];
}

export interface DoctorsBySpecialtyResponse {
  specialtyId: string;
  specialtyName: string;
  doctors: Doctor[];
}

export interface AvailableDoctorsResponse {
  specialtyId: string;
  specialtyName: string;
  date: string;
  doctors: Doctor[];
}

export interface DoctorServicesResponse {
  doctorId: string;
  doctorName: string;
  date: string;
  services: Service[];
}

export interface AvailableSlotsResponse {
  doctorId: string;
  doctorName: string;
  serviceId: string;
  serviceName: string;
  date: string;
  workSessionStart: string;
  workSessionEnd: string;
  slots: TimeSlot[];
}

export interface DoctorWorkingDaysResponse {
  doctorId: string;
  doctorName: string;
  month: string;
  workingDays: string[];
}

export interface PatientAppointmentsResponse {
  patientId: string;
  patientName: string;
  totalAppointments: number;
  appointments: Appointment[];
}

export interface BookAppointmentRequest {
  patientProfileId: string;
  doctorId: string;
  serviceId: string;
  date: string;
  startTime: string;
  endTime: string;
}

export interface BookAppointmentResponse {
  appointmentId: string;
  appointmentCode: string;
  doctorId: string;
  doctorName: string;
  patientProfileId: string;
  patientName: string;
  serviceId: string;
  serviceName: string;
  date: string;
  startTime: string;
  endTime: string;
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';
  createdAt: string;
}
