import { useState, useCallback } from 'react';
import { 
  Specialty, 
  Doctor, 
  Service, 
  TimeSlot, 
  AppointmentBookingState, 
  BookingFlow, 
  
  DoctorsBySpecialtyResponse,
  AvailableDoctorsResponse,
  DoctorServicesResponse,
  AvailableSlotsResponse,
  DoctorWorkingDaysResponse,
  PatientAppointmentsResponse,
  BookAppointmentResponse
} from '@/lib/types/appointment-booking';
import { appointmentBookingApi } from '@/lib/api';
 

const initialState: AppointmentBookingState = {
  currentStep: 1,
  selectedSpecialty: null,
  selectedDoctor: null,
  selectedDate: null,
  selectedService: null,
  selectedTimeSlot: null,
  bookingFlow: 'BY_DATE', // Default flow
  availableDoctors: [],
  availableServices: [],
  availableSlots: [],
  workingDays: [],
  loading: false,
  error: null,
  success: null,
};

export const useAppointmentBooking = () => {
  const [state, setState] = useState<AppointmentBookingState>(initialState);
  const [bookingFlow, setBookingFlow] = useState<BookingFlow>('BY_DATE');

  // Step navigation
  const goToStep = useCallback((step: number) => {
    setState(prev => ({ ...prev, currentStep: step }));
  }, []);

  const nextStep = useCallback(() => {
    setState(prev => {
      const newStep = Math.min(prev.currentStep + 1, 6);
      console.log('nextStep: current step', prev.currentStep, '-> new step', newStep);
      return { 
        ...prev, 
        currentStep: newStep
      };
    });
  }, []);

  const prevStep = useCallback(() => {
    setState(prev => ({ 
      ...prev, 
      currentStep: Math.max(prev.currentStep - 1, 1) 
    }));
  }, []);

  // Set booking flow
  const setBookingFlowType = useCallback((flow: BookingFlow) => {
    setBookingFlow(flow);
    setState(initialState);
  }, []);

  // Loading and error states
  const setLoading = useCallback((isLoading: boolean) => {
    setState(prev => ({ ...prev, loading: isLoading }));
  }, []);

  const setError = useCallback((message: string | null) => {
    setState(prev => ({ ...prev, error: message, loading: false }));
  }, []);

  const setSuccess = useCallback((message: string | null) => {
    setState(prev => ({ ...prev, success: message, loading: false }));
  }, []);

  // Load specialties
  const loadSpecialties = useCallback(async () => {
    try {
      setLoading(true);
      const response = await appointmentBookingApi.getSpecialties();
      const data = response.data as unknown;
      // Normalize to array regardless of backend shape
      const specialties: Specialty[] = Array.isArray(data)
        ? (data as Specialty[])
        : (data as { specialties?: Specialty[] })?.specialties ?? [];
      console.log('[API] getSpecialties →', specialties);
      setLoading(false);
      return specialties;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Không thể tải danh sách chuyên khoa';
      setError(errorMessage);
      return [];
    }
  }, [setLoading, setError]);

  // Select specialty
  const selectSpecialty = useCallback((specialty: Specialty) => {
    console.log('selectSpecialty called with:', specialty);
    setState(prev => {
      console.log('Current step before update:', prev.currentStep);
      const newStep = Math.min(prev.currentStep + 1, 6);
      console.log('Calculating new step:', prev.currentStep, '->', newStep);
      const newState = { 
        ...prev, 
        selectedSpecialty: specialty,
        selectedDoctor: null,
        selectedDate: null,
        selectedService: null,
        selectedTimeSlot: null,
        availableDoctors: [],
        availableServices: [],
        availableSlots: [],
        workingDays: [],
        currentStep: newStep
      };
      console.log('New state with updated step:', newState);
      return newState;
    });
  }, []);

  // Load available doctors by specialty and date (for BY_DATE flow)
  const loadAvailableDoctors = useCallback(async (specialtyId: string, date: string) => {
    try {
      setLoading(true);
      const response = await appointmentBookingApi.getAvailableDoctors({ specialtyId, date });
      setState(prev => ({ 
        ...prev, 
        availableDoctors: (response.data as AvailableDoctorsResponse).doctors,
        loading: false
      }));
      console.log('[API] getAvailableDoctors', { specialtyId, date }, '→', (response.data as AvailableDoctorsResponse));
      return (response.data as AvailableDoctorsResponse).doctors;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Không thể tải danh sách bác sĩ';
      setError(errorMessage);
      return [];
    }
  }, [setLoading, setError]);

  // Load doctors by specialty (for BY_DOCTOR flow)
  const loadDoctorsBySpecialty = useCallback(async (specialtyId: string) => {
    try {
      setLoading(true);
      const response = await appointmentBookingApi.getDoctorsBySpecialty(specialtyId);
      setState(prev => ({ 
        ...prev, 
        availableDoctors: (response.data as DoctorsBySpecialtyResponse).doctors,
        loading: false
      }));
      console.log('[API] getDoctorsBySpecialty', { specialtyId }, '→', (response.data as DoctorsBySpecialtyResponse));
      return (response.data as DoctorsBySpecialtyResponse).doctors;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Không thể tải danh sách bác sĩ';
      setError(errorMessage);
      return [];
    }
  }, [setLoading, setError]);

  // Select doctor
  const selectDoctor = useCallback((doctor: Doctor) => {
    setState(prev => ({ 
      ...prev, 
      selectedDoctor: doctor,
      // Only clear date for BY_DOCTOR flow; keep user's date for BY_DATE flow
      selectedDate: bookingFlow === 'BY_DOCTOR' ? null : prev.selectedDate,
      selectedService: null,
      selectedTimeSlot: null,
      availableServices: [],
      availableSlots: [],
      workingDays: []
    }));
    console.log('[STEP] selectDoctor', { doctor, bookingFlow });
    nextStep();
  }, [nextStep, bookingFlow]);

  // Load doctor working days for a month
  const loadDoctorWorkingDays = useCallback(async (doctorId: string, month: string) => {
    try {
      setLoading(true);
      const response = await appointmentBookingApi.getDoctorWorkingDays(doctorId, { month });
      setState(prev => ({ 
        ...prev, 
        workingDays: (response.data as DoctorWorkingDaysResponse).workingDays,
        loading: false
      }));
      console.log('[API] getDoctorWorkingDays', { doctorId, month }, '→', (response.data as DoctorWorkingDaysResponse));
      return (response.data as DoctorWorkingDaysResponse).workingDays;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Không thể tải lịch làm việc của bác sĩ';
      setError(errorMessage);
      return [];
    }
  }, [setLoading, setError]);

  // Select date
  const selectDate = useCallback((date: string) => {
    setState(prev => ({ 
      ...prev, 
      selectedDate: date,
      selectedService: null,
      selectedTimeSlot: null,
      availableServices: [],
      availableSlots: []
    }));
    nextStep();
  }, [nextStep]);

  // Load doctor services for specific date
  const loadDoctorServices = useCallback(async (doctorId: string, date: string) => {
    try {
      setLoading(true);
      const response = await appointmentBookingApi.getDoctorServices(doctorId, { date });
      const data = response.data as unknown;
      const services: Service[] = Array.isArray(data)
        ? (data as Service[])
        : (data as DoctorServicesResponse).services ?? [];
      setState(prev => ({ 
        ...prev, 
        availableServices: services,
        loading: false
      }));
      console.log('[API] getDoctorServices', { doctorId, date }, '→', data);
      return services;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Không thể tải danh sách dịch vụ';
      setError(errorMessage);
      return [];
    }
  }, [setLoading, setError]);

  // Select service
  const selectService = useCallback((service: Service) => {
    setState(prev => ({ 
      ...prev, 
      selectedService: service,
      selectedTimeSlot: null,
      availableSlots: []
    }));
    nextStep();
  }, [nextStep]);

  // Load available time slots for doctor, service and date
  const loadAvailableSlots = useCallback(async (doctorId: string, serviceId: string, date: string) => {
    try {
      setLoading(true);
      const response = await appointmentBookingApi.getAvailableSlots(doctorId, { serviceId, date });
      setState(prev => ({ 
        ...prev, 
        availableSlots: (response.data as AvailableSlotsResponse).slots,
        loading: false
      }));
      console.log('[API] getAvailableSlots', { doctorId, serviceId, date }, '→', (response.data as AvailableSlotsResponse));
      return (response.data as AvailableSlotsResponse).slots;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Không thể tải danh sách giờ khám';
      setError(errorMessage);
      return [];
    }
  }, [setLoading, setError]);

  // Select time slot
  const selectTimeSlot = useCallback((timeSlot: TimeSlot) => {
    setState(prev => ({ ...prev, selectedTimeSlot: timeSlot }));
    nextStep();
  }, [nextStep]);

  // Book an appointment
  const bookAppointment = useCallback(async (patientProfileId: string) => {
    if (!state.selectedDoctor || !state.selectedService || !state.selectedDate || !state.selectedTimeSlot) {
      setError('Vui lòng chọn đầy đủ thông tin đặt lịch.');
      return null;
    }

    try {
      setLoading(true);
      const data = {
        patientProfileId,
        doctorId: state.selectedDoctor.doctorId,
        serviceId: state.selectedService.serviceId,
        date: state.selectedDate,
        startTime: state.selectedTimeSlot.startTime,
        endTime: state.selectedTimeSlot.endTime,
      };
      const response = await appointmentBookingApi.bookAppointment(data);
      setSuccess('Đặt lịch khám thành công!');

      // Reset state after successful booking
      setState(initialState);
     
      return response.data as BookAppointmentResponse;
    } catch (error: unknown) {
      // Không setError tại đây để tránh toasts chung chung; để UI hiển thị thông điệp chi tiết từ API
      throw error;
    }
  }, [state.selectedDoctor, state.selectedService, state.selectedDate, state.selectedTimeSlot, setLoading, setError, setSuccess]);

  // Load patient appointments
  const loadPatientAppointments = useCallback(async () => {
    try {
      setLoading(true);
      const response = await appointmentBookingApi.getPatientAppointments();
      setState(prev => ({ ...prev, loading: false }));
      console.log('[API] getPatientAppointments →', response.data as PatientAppointmentsResponse);
      return (response.data as PatientAppointmentsResponse).appointments;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Không thể tải danh sách lịch khám';
      setError(errorMessage);
      return [];
    }
  }, [setLoading, setError]);

  // Reset booking state
  const resetBooking = useCallback(() => {
    setState(initialState);
    setBookingFlow('BY_DATE'); // Reset to default flow
  }, []);

  return {
    ...state,
    bookingFlow,
    nextStep,
    prevStep,
    goToStep,
    setBookingFlowType,
    loadSpecialties,
    selectSpecialty,
    loadAvailableDoctors,
    loadDoctorsBySpecialty,
    selectDoctor,
    loadDoctorWorkingDays,
    selectDate,
    loadDoctorServices,
    selectService,
    loadAvailableSlots,
    selectTimeSlot,
    bookAppointment,
    loadPatientAppointments,
    resetBooking,
    setError,
    setSuccess,
  };
};
