/* eslint-disable react-hooks/exhaustive-deps */
'use client';

import React, { useEffect, useState, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  Search,
  Plus,
  X,
  GripVertical,
  ClipboardList,
  User,
  Loader2,
  List,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  QrCode,
  Camera,
  CameraOff,
  Edit,
  Save,
  Stethoscope,
  Wrench
} from 'lucide-react';
import { PatientSearch } from '@/components/medical-records/PatientSearch';
import { PatientProfile } from '@/lib/types/user';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { MedicalRecord } from '@/lib/types/medical-record';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Html5Qrcode } from 'html5-qrcode';

interface Service {
  id: string;
  serviceCode: string;
  name: string;
  description: string;
}

interface DoctorOption {
  type: 'doctor' | 'technician';
  doctorId?: string;
  doctorCode?: string;
  doctorName?: string;
  technicianId?: string;
  technicianCode?: string;
  name: string;
  boothId: string | null;
  boothCode: string | null;
  boothName: string | null;
  clinicRoomId: string | null;
  clinicRoomCode: string | null;
  clinicRoomName: string | null;
  workSessionId: string | null;
  workSessionStartTime: Date | null;
  workSessionEndTime: Date | null;
}

interface PrescriptionService {
  serviceCode: string;
  serviceId?: string;
  serviceName?: string;
  order: number;
  doctorId?: string;
  note?: string;
}

interface PrescriptionServiceRequest {
  order: number;
  serviceCode?: string
  serviceId?: string;
  doctorId?: string;
  note?: string;
}

interface PrescriptionData {
  patientProfileId: string;
  services: PrescriptionServiceRequest[];
}

// List types for prescriptions
interface PrescriptionListItem {
  id: string;
  medicalRecord?: MedicalRecord;
  createdAt?: string;
  status?: string;
  patientProfile?: { id: string; profileCode?: string; name?: string } | null;
  doctor?: { id: string; auth?: { name?: string } } | null;
  services?: Array<{ order: number; service?: { serviceCode?: string; name?: string } }> | null;
}

interface PrescriptionsListResponse {
  data: PrescriptionListItem[];
  meta: { page: number; limit: number; total: number; totalPages: number };
}

// Appointment endpoints types
interface AppointmentServiceItem {
  serviceId: string;
  service?: { id: string; serviceCode: string; name: string } | null;
}

interface AppointmentLookup {
  id: string;
  appointmentCode: string;
  status: string;
  date: string;
  startTime: string;
  endTime: string;
  patientProfile: { id: string; name: string; dateOfBirth?: string; gender?: string };
  specialty?: { id: string; name: string } | null;
  doctor?: { id: string; doctorCode: string; auth?: { name?: string } } | null;
  service?: { id: string; serviceCode: string; name: string } | null;
  workSession?: { id: string; startTime: string; endTime: string; status: string; doctorId?: string; technicianId?: string } | null;
  appointmentServices?: AppointmentServiceItem[] | null;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000/api'

function ReceptionCreatePrescriptionPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<'create' | 'prescriptions'>('create');

  // Patient selection
  const [selectedPatientProfile, setSelectedPatientProfile] = useState<PatientProfile | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Service[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedServices, setSelectedServices] = useState<PrescriptionService[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [loadingDoctors, setLoadingDoctors] = useState<Record<string, boolean>>({});
  const [doctorsByService, setDoctorsByService] = useState<Record<string, DoctorOption[]>>({});

  // Prescriptions list states
  const [prescriptions, setPrescriptions] = useState<PrescriptionListItem[]>([]);
  const [prescriptionsTotal, setPrescriptionsTotal] = useState(0);
  const [prescriptionsPage, setPrescriptionsPage] = useState(1);
  const [prescriptionsLimit] = useState(20);
  const [loadingPrescriptions, setLoadingPrescriptions] = useState(false);
  
  // Filter states
  const [filterPatientName, setFilterPatientName] = useState('');
  const [filterPatientPhone, setFilterPatientPhone] = useState('');
  const [filterDoctorId, setFilterDoctorId] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const [availableDoctorsForFilter, setAvailableDoctorsForFilter] = useState<Array<{ id: string; name: string; doctorCode?: string }>>([]);
  const [loadingDoctorsForFilter, setLoadingDoctorsForFilter] = useState(false);
  const [doctorSearchQuery, setDoctorSearchQuery] = useState('');
  const [doctorDropdownOpen, setDoctorDropdownOpen] = useState(false);
  
  // Update prescription dialog states
  const [updateDialogOpen, setUpdateDialogOpen] = useState(false);
  const [selectedPrescriptionForUpdate, setSelectedPrescriptionForUpdate] = useState<PrescriptionListItem | null>(null);
  const [loadingPrescriptionDetails, setLoadingPrescriptionDetails] = useState(false);
  const [updatingPrescription, setUpdatingPrescription] = useState(false);
  const [availableDoctorsForUpdate, setAvailableDoctorsForUpdate] = useState<Record<string, DoctorOption[]>>({});
  const [loadingDoctorsForUpdate, setLoadingDoctorsForUpdate] = useState<Record<string, boolean>>({});

  // Appointment lookup states
  const [appointmentCode, setAppointmentCode] = useState('');
  const [appointmentLoading, setAppointmentLoading] = useState(false);
  const [appointment, setAppointment] = useState<AppointmentLookup | null>(null);

  // QR scanner states (dialog)
  const [isQrScannerOpen, setIsQrScannerOpen] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [scannerSupported, setScannerSupported] = useState<boolean | null>(null);
  const [usingHtml5Qrcode, setUsingHtml5Qrcode] = useState(false);
  const videoRef = React.useRef<HTMLVideoElement | null>(null);
  const mediaStreamRef = React.useRef<MediaStream | null>(null);
  const html5QrCodeRef = React.useRef<Html5Qrcode | null>(null);
  const lastScanRef = React.useRef<string | null>(null);
  const lastScanTsRef = React.useRef<number>(0);
  const [scanHint, setScanHint] = useState<string>('Đang khởi động camera...');
  const scanningRef = React.useRef(false);

  // Load patient profile from query parameter
  useEffect(() => {
    const patientProfileId = searchParams?.get('patientProfileId');
    const appointmentCodeFromQuery = searchParams?.get('appointmentCode');
    
    // Load patient profile if patientProfileId is in query and not already loaded
    if (patientProfileId) {
      // Only load if not already selected or if the ID is different
      if (!selectedPatientProfile || selectedPatientProfile.id !== patientProfileId) {
        const loadPatientProfile = async () => {
          try {
            const response = await fetch(`${API_BASE_URL}/patient-profiles/${encodeURIComponent(patientProfileId)}`, {
              headers: {
                'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
              },
            });
            
            if (response.ok) {
              const profile = await response.json();
              setSelectedPatientProfile({
                id: profile.id,
                name: profile.name,
                profileCode: profile.profileCode || '',
                dateOfBirth: profile.dateOfBirth,
                gender: profile.gender,
                phone: profile.phone || '',
                address: profile.address || '',
                emergencyContact: profile.emergencyContact || { name: '', phone: '', relationship: '' },
                occupation: profile.occupation || '',
                healthInsurance: profile.healthInsurance || '',
                relationship: profile.relationship || '',
                isActive: profile.isActive !== undefined ? profile.isActive : true,
                patientId: profile.patientId || null,
              } as PatientProfile);
              toast.success('Đã tải thông tin bệnh nhân');
              
              // Switch to create tab to show the form
              setActiveTab('create');
              
              // Clear query parameter after loading
              const newSearchParams = new URLSearchParams(searchParams?.toString());
              newSearchParams.delete('patientProfileId');
              const newUrl = newSearchParams.toString() 
                ? `/reception/prescription?${newSearchParams.toString()}`
                : '/reception/prescription';
              router.replace(newUrl);
            } else {
              const err = await response.json().catch(() => ({}));
              toast.error(err?.message || 'Không tìm thấy hồ sơ bệnh nhân');
            }
          } catch (error) {
            console.error('Error loading patient profile:', error);
            toast.error('Có lỗi xảy ra khi tải thông tin bệnh nhân');
          }
        };
        
        loadPatientProfile();
      }
    }
    
    // Load appointment if appointmentCode is in query
    if (appointmentCodeFromQuery && !appointmentCode) {
      setAppointmentCode(appointmentCodeFromQuery);
      // The existing useEffect for appointmentCode will handle loading
    }
  }, [searchParams, selectedPatientProfile, appointmentCode, appointment, router]);

  // Search services with debouncing
  useEffect(() => {
    const searchServices = async () => {
      if (!searchQuery.trim()) {
        setSearchResults([]);
        return;
      }

      setIsSearching(true);
      try {
        const response = await fetch(`${API_BASE_URL}/services/search?query=${encodeURIComponent(searchQuery)}&limit=20`);
        if (response.ok) {
          const data = await response.json();
          setSearchResults(data.data?.services || []);
        }
      } catch (error) {
        console.error('Error searching services:', error);
        toast.error('Có lỗi xảy ra khi tìm kiếm dịch vụ');
      } finally {
        setIsSearching(false);
      }
    };

    const timeoutId = setTimeout(searchServices, 300);
    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  // Load doctors for a service (always fetch fresh data)
  const loadDoctorsForService = useCallback(async (serviceId: string) => {
    setLoadingDoctors(prev => ({ ...prev, [serviceId]: true }));
    try {
      const response = await fetch(`${API_BASE_URL}/prescriptions/doctors/by-service?serviceId=${encodeURIComponent(serviceId)}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
      });
      if (response.ok) {
        const doctors = await response.json();
        setDoctorsByService(prev => ({ ...prev, [serviceId]: doctors }));
      } else {
        setDoctorsByService(prev => ({ ...prev, [serviceId]: [] }));
        toast.error('Không thể tải danh sách bác sĩ cho dịch vụ này');
      }
    } catch (error) {
      console.error('Error loading doctors:', error);
      setDoctorsByService(prev => ({ ...prev, [serviceId]: [] }));
      toast.error('Có lỗi xảy ra khi tải danh sách bác sĩ');
    } finally {
      setLoadingDoctors(prev => ({ ...prev, [serviceId]: false }));
    }
  }, []);

  const addService = useCallback((service: Service) => {
    const existingService = selectedServices.find(s => s.serviceCode === service.serviceCode);
    if (existingService) {
      toast.error('Dịch vụ này đã được thêm vào phiếu chỉ định');
      return;
    }

    const newService: PrescriptionService = {
      serviceCode: service.serviceCode,
      serviceId: service.id,
      serviceName: service.name,
      order: selectedServices.length + 1
    };

    setSelectedServices(prev => [...prev, newService]);
    setSearchQuery('');
    setSearchResults([]);

    // Load doctors for this service
    if (service.id) {
      loadDoctorsForService(service.id);
    }
  }, [selectedServices, loadDoctorsForService]);

  const removeService = useCallback((serviceCode: string) => {
    setSelectedServices(prev => {
      const filtered = prev.filter(s => s.serviceCode !== serviceCode);
      return filtered.map((service, index) => ({
        ...service,
        order: index + 1
      }));
    });
  }, []);

  const updateServiceDoctor = useCallback((serviceCode: string, doctorId: string | undefined) => {
    setSelectedServices(prev => prev.map(s => 
      s.serviceCode === serviceCode ? { ...s, doctorId } : s
    ));
  }, []);

  const updateServiceNote = useCallback((serviceCode: string, note: string) => {
    setSelectedServices(prev => prev.map(s => 
      s.serviceCode === serviceCode ? { ...s, note: note || undefined } : s
    ));
  }, []);

  // Lookup appointment by code
  const onLookupAppointment = useCallback(async () => {
    if (!appointmentCode.trim()) {
      toast.error('Vui lòng nhập mã lịch hẹn');
      return;
    }
    setAppointmentLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/prescriptions/appointment/${encodeURIComponent(appointmentCode.trim())}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.message || 'Không tìm thấy lịch hẹn');
      }
      const data: AppointmentLookup = await res.json();
      setAppointment(data);
      // Prefill patient profile and services for convenience
      if (data.patientProfile) {
        setSelectedPatientProfile((prev) => prev && prev.id === data.patientProfile.id ? prev : {
          id: data.patientProfile.id,
          name: data.patientProfile.name,
          profileCode: ''
        } as unknown as PatientProfile);
      }
    } catch (e: unknown) {
      setAppointment(null);
      const error = e as { message?: string };
      toast.error(error?.message || 'Không thể tra cứu lịch hẹn');
    } finally {
      setAppointmentLoading(false);
    }
  }, [appointmentCode]);

  // Create prescription from appointment
  const onCreateFromAppointment = useCallback(async () => {
    if (!appointment) {
      toast.error('Chưa có dữ liệu lịch hẹn');
      return;
    }
    try {
      const res = await fetch(`${API_BASE_URL}/prescriptions/appointment/${encodeURIComponent(appointment.appointmentCode)}/create-prescription`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'Content-Type': 'application/json'
        }
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.message || 'Không thể tạo phiếu từ lịch hẹn');
      }
      const result = await res.json();
      toast.success('Đã tạo phiếu chỉ định từ lịch hẹn');
      
      // Auto generate and download PDF
      const prescriptionData = result.data || result;
      const prescriptionCode = prescriptionData.prescriptionCode || result.prescriptionCode;
      
      if (prescriptionCode) {
        try {
          // Check if response already has full prescription data (with services, patientProfile, doctor)
          const hasFullData = prescriptionData.services && 
                              Array.isArray(prescriptionData.services) && 
                              prescriptionData.patientProfile && 
                              prescriptionData.doctor;
          
          let fullPrescriptionData = prescriptionData;
          
          // If response doesn't have full data, fetch it
          if (!hasFullData) {
            const presRes = await fetch(`${API_BASE_URL}/prescriptions/${encodeURIComponent(prescriptionCode)}`, {
              headers: {
                'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
              }
            });
            if (presRes.ok) {
              const fullPrescription = await presRes.json();
              fullPrescriptionData = fullPrescription.data || fullPrescription;
            }
          }
          
          // Generate and download PDF
          const { generatePrescriptionPDF } = await import('@/lib/utils/prescription-pdf');
          await generatePrescriptionPDF(fullPrescriptionData);
          toast.success('Đã tải PDF phiếu chỉ định');
          
          // Small delay to ensure PDF download is initiated
          await new Promise(resolve => setTimeout(resolve, 500));
          
          // Reset form and reload view after PDF is downloaded
          setSelectedPatientProfile(null);
          setSelectedServices([]);
          setSearchQuery('');
          setSearchResults([]);
          setAppointmentCode('');
          setAppointment(null);
          setDoctorsByService({});
          
          // Switch to prescriptions tab to show the new prescription
          // fetchPrescriptions will be called by useEffect when tab changes
          setActiveTab('prescriptions');
        } catch (pdfError) {
          console.error('Error generating PDF:', pdfError);
          toast.error('Tạo phiếu thành công nhưng không thể tạo PDF. Vui lòng in từ danh sách phiếu.');
          
          // Still reset form even if PDF generation failed
          setSelectedPatientProfile(null);
          setSelectedServices([]);
          setSearchQuery('');
          setSearchResults([]);
          setAppointmentCode('');
          setAppointment(null);
          setDoctorsByService({});
          
          setActiveTab('prescriptions');
        }
      } else {
        // Reset form even if no prescriptionCode
        setSelectedPatientProfile(null);
        setSelectedServices([]);
        setSearchQuery('');
        setSearchResults([]);
        setAppointmentCode('');
        setAppointment(null);
        setDoctorsByService({});
        
        setActiveTab('prescriptions');
      }
    } catch (e: unknown) {
      const error = e as { message?: string };
      toast.error(error?.message || 'Không thể tạo phiếu từ lịch hẹn');
    }
  }, [appointment, activeTab]);

  // QR Scanner logic
  const stopScanner = useCallback(async () => {
    console.log('[QR] Stopping scanner...');
    setScanning(false);
    scanningRef.current = false;
    setUsingHtml5Qrcode(false);
    
    // Stop html5-qrcode if running
    if (html5QrCodeRef.current) {
      try {
        await html5QrCodeRef.current.stop();
        await html5QrCodeRef.current.clear();
      } catch (e) {
        console.warn('[QR] Error stopping html5-qrcode:', e);
      }
      html5QrCodeRef.current = null;
    }
    
    // Stop all tracks first
    const stream = mediaStreamRef.current;
    if (stream) {
      stream.getTracks().forEach(t => {
        try {
          t.stop();
        } catch (e) {
          console.warn('[QR] Error stopping track:', e);
        }
      });
      mediaStreamRef.current = null;
    }
    
    // Clear video element srcObject to prevent lingering references
    const video = videoRef.current;
    if (video) {
      try {
        // Remove any error listeners first
        video.onerror = null;
        // Pause first to stop any ongoing play() promise
        video.pause();
        // Clear srcObject
        video.srcObject = null;
        // Load empty to ensure cleanup
        video.load();
      } catch (e: unknown) {
        const error = e as { name?: string; message?: string };
        // Suppress AbortError and other expected errors
        if (error?.name !== 'AbortError' && !error?.message?.includes('aborted')) {
          console.warn('[QR] Error clearing video srcObject:', error);
        }
      }
    }
    console.log('[QR] Scanner stopped');
  }, []);

  const handleQrText = useCallback(async (text: string) => {
    const trimmed = (text || '').trim();
    const upper = trimmed.toUpperCase();
    if (!trimmed) return;
    console.log('[QR] Raw:', text);
    console.log('[QR] Normalized:', upper);
    setScanHint(`Đã phát hiện: ${upper.slice(0, 24)}${upper.length > 24 ? '...' : ''}`);
    // PAT -> patient profile; APT -> appointment
    try {
      if (upper.startsWith('PAT')) {
        // Hành vi giống gõ vào ô "Chọn hồ sơ bệnh nhân" rồi nhấn Tìm
        try {
          const enc = encodeURIComponent(upper);
          const url = `${API_BASE_URL}/patient-profiles/search?name=${enc}&phone=${enc}&code=${enc}`;
          console.log('[QR] PAT branch, will search via:', url);
          toast.info('Đang tra cứu hồ sơ từ QR...');
          const response = await fetch(url, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` }
          });
          if (!response.ok) {
            const err = await response.json().catch(() => ({}));
            throw new Error(err?.message || `Search failed ${response.status}`);
          }
          const data = await response.json();
          // API có thể trả về mảng trực tiếp hoặc object có property
          const results = Array.isArray(data) 
            ? data 
            : (data?.patientProfiles || data?.data || data?.profiles || []);
          console.log('[QR] Search results length:', Array.isArray(results) ? results.length : 'N/A');
          
          if (!Array.isArray(results) || results.length === 0) {
            toast.error('Không tìm thấy hồ sơ bệnh nhân phù hợp');
            setScanHint('Không tìm thấy hồ sơ');
            return;
          }
          
          // Nếu quét QR trả về đúng 1 phần tử → tự động chọn hồ sơ đó
          if (results.length === 1) {
            setSelectedPatientProfile(results[0] as unknown as PatientProfile);
            toast.success('Đã chọn hồ sơ bệnh nhân từ QR');
            setScanHint('Đã chọn hồ sơ bệnh nhân');
            // Close scanner after successful scan
            setTimeout(() => {
              setIsQrScannerOpen(false);
            }, 500);
          } else {
            // Nếu có nhiều hơn 1 kết quả → chọn phần tử đầu tiên và báo có nhiều kết quả
            setSelectedPatientProfile(results[0] as unknown as PatientProfile);
            toast.warning(`Tìm thấy ${results.length} hồ sơ khớp, đã chọn hồ sơ đầu tiên. Vui lòng kiểm tra lại.`);
            setScanHint(`Đã chọn hồ sơ đầu tiên (${results.length} kết quả)`);
            // Close scanner after successful scan
            setTimeout(() => {
              setIsQrScannerOpen(false);
            }, 500);
          }
        } catch (e: unknown) {
          const error = e as { message?: string };
          console.error('[QR] Search profiles error:', error);
          toast.error(error?.message || 'Không thể tra cứu hồ sơ bệnh nhân');
          setScanHint('Lỗi tra cứu hồ sơ');
        }
      } else if (upper.startsWith('APT') || upper.startsWith('APPT')) {
        // Parse mã appointment code từ format: APT:APT-1762571870169|DOC:...|DATE:...|TIME:...
        let appointmentCode = trimmed;
        
        // Kiểm tra nếu có format APT:APT-xxx hoặc APPT:APPT-xxx
        if (trimmed.includes(':')) {
          const parts = trimmed.split('|');
          // Lấy phần đầu tiên (APT:APT-xxx)
          const firstPart = parts[0] || '';
          if (firstPart.includes(':')) {
            // Tách theo dấu : để lấy mã appointment code
            const codeParts = firstPart.split(':');
            if (codeParts.length >= 2) {
              appointmentCode = codeParts[1].trim();
            }
          }
        } else {
          // Nếu không có format đặc biệt, lấy phần đầu trước dấu |
          const codeParts = trimmed.split('|');
          appointmentCode = codeParts[0]?.trim() || trimmed;
        }
        
        console.log('[QR] Parsed appointment code:', appointmentCode);
        
        // Điền mã vào input và tự động tra cứu
        setAppointmentCode(appointmentCode);
        setScanHint('Đã quét mã lịch hẹn, đang tra cứu...');
        toast.success(`Đã quét mã lịch hẹn: ${appointmentCode}`);
        
        // Đóng scanner sau khi quét thành công
        setTimeout(() => {
          setIsQrScannerOpen(false);
          stopScanner();
          
          // Tự động tra cứu sau khi đóng scanner
          setTimeout(async () => {
            try {
              setAppointmentLoading(true);
              const res = await fetch(`${API_BASE_URL}/prescriptions/appointment/${encodeURIComponent(appointmentCode)}`, {
                headers: {
                  'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
                }
              });
              if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err?.message || 'Không tìm thấy lịch hẹn');
              }
              const data: AppointmentLookup = await res.json();
              setAppointment(data);
              // Prefill patient profile and services for convenience
              if (data.patientProfile) {
                setSelectedPatientProfile((prev) => prev && prev.id === data.patientProfile.id ? prev : {
                  id: data.patientProfile.id,
                  name: data.patientProfile.name,
                  profileCode: ''
                } as unknown as PatientProfile);
              }
              toast.success('Đã tải thông tin lịch hẹn');
            } catch (e: unknown) {
              setAppointment(null);
              const error = e as { message?: string };
              toast.error(error?.message || 'Không thể tra cứu lịch hẹn');
            } finally {
              setAppointmentLoading(false);
            }
          }, 200); // Small delay to ensure scanner is fully closed
        }, 500);
      } else {
        // Không đúng định dạng kỳ vọng, vẫn hiển thị ra cho bạn xem
        toast.info(`Đã đọc QR: ${upper.slice(0, 64)}${upper.length > 64 ? '...' : ''}`);
        setScanHint('Đã đọc QR (không theo định dạng PAT/APT)');
      }
    } catch (e) {
      console.error('[QR] Error:', e);
    }
  }, [stopScanner]);

  const startScanner = useCallback(async () => {
    setScanning(true);
    scanningRef.current = true;
    setScanHint('Đang khởi động camera...');
    
    try {
      // Prefer back camera; fallback to any camera
      let stream: MediaStream | null = null;
      try {
        stream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: { ideal: 'environment' } }
        });
      } catch {
        try {
          stream = await navigator.mediaDevices.getUserMedia({ video: true });
        } catch {
          throw new Error('Không thể truy cập camera. Vui lòng kiểm tra quyền truy cập.');
        }
      }
      
      // Check if scanning was stopped while getting the stream
      if (!scanningRef.current) {
        console.log('[QR] Scanning stopped while getting stream, cleaning up');
        stream.getTracks().forEach(t => t.stop());
        return;
      }
      
      console.log('[QR] Got media stream:', !!stream);
      mediaStreamRef.current = stream;
      const video = videoRef.current;
      if (!video) {
        console.warn('[QR] videoRef.current is null');
        stream.getTracks().forEach(t => t.stop());
        mediaStreamRef.current = null;
        return;
      }
      
      // Check again before assigning stream
      if (!scanningRef.current) {
        console.log('[QR] Scanning stopped before assigning stream, cleaning up');
        stream.getTracks().forEach(t => t.stop());
        mediaStreamRef.current = null;
        return;
      }

      // Add error handler to suppress AbortError
      const handleVideoError = (e: Event) => {
        const error = e as ErrorEvent;
        if (error.error?.name === 'AbortError' || error.message?.includes('aborted')) {
          // Suppress AbortError - this is expected when stopping scanner
          console.log('[QR] Video error (suppressed):', error.error?.name || error.message);
          return;
        }
        console.warn('[QR] Video error:', error);
      };
      video.addEventListener('error', handleVideoError, { once: true });

      try {
        video.srcObject = stream;
        
        if (!scanningRef.current) {
          console.log('[QR] Scanning stopped after setting srcObject, cleaning up');
          stream.getTracks().forEach(t => t.stop());
          mediaStreamRef.current = null;
          video.removeEventListener('error', handleVideoError);
          try {
            video.srcObject = null;
            video.pause();
          } catch {
            // Ignore cleanup errors
          }
          return;
        }

        try {
          await video.play();
          console.log('[QR] Video playing, readyState:', video.readyState);
        } catch (playError: unknown) {
          const error = playError as { name?: string; message?: string };
          // Suppress AbortError - this is expected when stopping scanner
          if (error.name === 'AbortError' || error.message?.includes('aborted')) {
            console.log('[QR] Video play aborted (suppressed)');
            if (!scanningRef.current) {
              return;
            }
          }
          throw playError;
        }
      } catch (playError: unknown) {
        const error = playError as { name?: string; message?: string };
        console.error('[QR] Error playing video:', error);
        video.removeEventListener('error', handleVideoError);
        // Clean up stream if video play fails
        stream.getTracks().forEach(t => t.stop());
        mediaStreamRef.current = null;
        const videoEl = videoRef.current;
        if (videoEl) {
          try {
            videoEl.srcObject = null;
            videoEl.pause();
          } catch {
            // Ignore cleanup errors
          }
        }
        // Don't throw AbortError or NotAllowedError - these are expected
        if (error.name !== 'AbortError' && error.name !== 'NotAllowedError') {
          throw playError;
        }
        return;
      }

      // Wait until video metadata is ready
      if (video.readyState < 2) {
        await new Promise<void>((resolve, reject) => {
          // Check if scanning was stopped while waiting
          if (!scanningRef.current) {
            reject(new Error('Scanning stopped'));
            return;
          }
          const onLoaded = () => {
            if (!scanningRef.current) {
              reject(new Error('Scanning stopped'));
              return;
            }
            resolve();
          };
          const onError = () => { reject(new Error('Video load error')); };
          video.addEventListener('loadeddata', onLoaded, { once: true });
          video.addEventListener('error', onError, { once: true });
        }).catch((err) => {
          console.log('[QR] Error waiting for video metadata:', err);
          // Clean up if scanning was stopped
          if (!scanningRef.current) {
            const stream = mediaStreamRef.current;
            if (stream) {
              stream.getTracks().forEach(t => t.stop());
              mediaStreamRef.current = null;
            }
            const video = videoRef.current;
            if (video) {
              try {
                video.onerror = null;
                video.srcObject = null;
                video.pause();
              } catch (cleanupError: unknown) {
                const error = cleanupError as { name?: string; message?: string };
                // Suppress AbortError and other expected errors
                if (error?.name !== 'AbortError' && !error?.message?.includes('aborted')) {
                  console.warn('[QR] Error cleaning up video:', error);
                }
              }
            }
            return;
          }
          // Only throw if scanning is still active
          throw err;
        });
      }
      
      // Final check before proceeding
      if (!scanningRef.current || !videoRef.current) {
        console.log('[QR] Scanning stopped after video ready, cleaning up');
        stream.getTracks().forEach(t => t.stop());
        mediaStreamRef.current = null;
        return;
      }
      
      console.log('[QR] Video ready, dimensions:', video.videoWidth, 'x', video.videoHeight);
      setScanHint('Camera đã sẵn sàng. Đưa mã QR vào khung...');

      // Try BarcodeDetector first
      interface BarcodeDetectorInterface {
        detect(image: HTMLVideoElement): Promise<Array<{ rawValue?: string; rawValueText?: string; raw?: string }>>;
      }
      
      const BD = (window as { BarcodeDetector?: new (options?: { formats?: string[] }) => BarcodeDetectorInterface }).BarcodeDetector;
      if (BD) {
        console.log('[QR] Trying BarcodeDetector...');
        setScannerSupported(true);
        setUsingHtml5Qrcode(false);
        let detector: BarcodeDetectorInterface | null = null;
        try {
          detector = new BD({ formats: ['qr_code'] });
        } catch {
          try {
            detector = new BD();
          } catch (e) {
            console.log('[QR] BarcodeDetector init failed, will use fallback:', e);
            setScannerSupported(null);
          }
        }
        
        if (detector) {
          console.log('[QR] BarcodeDetector initialized');
          const tick = async () => {
            if (!scanningRef.current || !videoRef.current) {
              return;
            }
            
            try {
              const detections = await detector!.detect(videoRef.current);
              if (detections && detections.length > 0) {
                console.log('[QR] detections:', detections.length, detections);
                const raw = (detections[0]?.rawValue ?? detections[0]?.rawValueText ?? detections[0]?.raw ?? '').toString();
                if (raw) {
                  const norm = raw.trim();
                  const now = Date.now();
                  // Debounce
                  if (lastScanRef.current === norm && now - lastScanTsRef.current < 1500) {
                    // skip duplicate
                  } else {
                    lastScanRef.current = norm;
                    lastScanTsRef.current = now;
                    console.log('[QR] Found QR code:', norm);
                    await handleQrText(norm);
                  }
                }
              }
            } catch (err) {
              console.warn('[QR] detect error:', err);
            }
            
            if (scanningRef.current) {
              requestAnimationFrame(tick);
            }
          };
          
          setScanHint('Đưa mã QR vào trong khung...');
          requestAnimationFrame(tick);
          return;
        }
      }
      
      // Fallback to html5-qrcode
      console.log('[QR] Using html5-qrcode fallback...');
      try {
        setScannerSupported(true);
        setUsingHtml5Qrcode(true);
        setScanHint('Đang khởi động bộ quét QR...');
        
        // Stop the current video stream
        if (mediaStreamRef.current) {
          mediaStreamRef.current.getTracks().forEach(t => t.stop());
          mediaStreamRef.current = null;
        }
        if (videoRef.current) {
          videoRef.current.srcObject = null;
        }
        
        const html5QrCode = new Html5Qrcode('qr-reader');
        html5QrCodeRef.current = html5QrCode;
        
        const qrCodeSuccessCallback = async (decodedText: string) => {
          const norm = decodedText.trim();
          const now = Date.now();
          
          // Debounce
          if (lastScanRef.current === norm && now - lastScanTsRef.current < 1500) {
            return;
          }
          
          lastScanRef.current = norm;
          lastScanTsRef.current = now;
          console.log('[QR] Found QR code (html5-qrcode):', norm);
          await handleQrText(norm);
        };
        
        const qrCodeErrorCallback = (errorMessage: string) => {
          // Ignore common "not found" errors
          if (!errorMessage.includes('No QR code found') && !errorMessage.includes('NotFoundException')) {
            // Keep scanning
          }
        };
        
        const config = {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
          disableFlip: false,
        };
        
        try {
          await html5QrCode.start(
            { facingMode: 'environment' },
            config,
            qrCodeSuccessCallback,
            qrCodeErrorCallback
          );
        } catch {
          try {
            await html5QrCode.start(
              { facingMode: 'user' },
              config,
              qrCodeSuccessCallback,
              qrCodeErrorCallback
            );
          } catch {
            try {
              const cameras = await Html5Qrcode.getCameras();
              const cameraId = cameras[0]?.id;
              if (cameraId) {
                await html5QrCode.start(
                  cameraId,
                  config,
                  qrCodeSuccessCallback,
                  qrCodeErrorCallback
                );
              } else {
                throw new Error('Không tìm thấy camera');
              }
            } catch (finalError) {
              console.error('[QR] All camera options failed:', finalError);
              throw finalError;
            }
          }
        }
        
        setScanHint('Đưa mã QR vào trong khung...');
        console.log('[QR] html5-qrcode started successfully');
      } catch (html5Error) {
        console.error('[QR] html5-qrcode failed:', html5Error);
        setScannerSupported(false);
        const error = html5Error instanceof Error ? html5Error : new Error('Không thể khởi động bộ quét QR');
        toast.error(`Không thể khởi động quét QR: ${error.message}`);
        setScanHint('Lỗi khởi động bộ quét QR');
      }
    } catch (e) {
      setScanning(false);
      scanningRef.current = false;
      const error = e instanceof Error ? e : new Error('Không thể truy cập camera');
      console.error('[QR] getUserMedia error:', error);
      toast.error(error.message || 'Không thể truy cập camera');
      setScanHint('Lỗi khởi động camera');
    }
  }, [handleQrText]);

  // Handle QR scanner dialog open/close
  useEffect(() => {
    // Suppress unhandled AbortError from video elements
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const error = event.reason;
      if (error?.name === 'AbortError' || error?.message?.includes('aborted') || 
          error?.message?.includes('fetching process') || error?.message?.includes('media resource')) {
        // Suppress AbortError from video/media operations - this is expected
        event.preventDefault();
        console.log('[QR] Suppressed unhandled AbortError:', error?.message || error?.name);
        return;
      }
    };
    
    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    
    if (isQrScannerOpen) {
      setTimeout(() => {
        startScanner();
      }, 100);
    } else {
      stopScanner();
    }
    
    return () => {
      stopScanner();
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, [isQrScannerOpen, startScanner, stopScanner]);

  const handleCreatePrescription = async () => {
    if (!selectedPatientProfile) {
      toast.error('Vui lòng chọn hồ sơ bệnh nhân');
      return;
    }
    if (selectedServices.length === 0) {
      toast.error('Vui lòng chọn ít nhất một dịch vụ');
      return;
    }

    // Validate and format services for API
    const formattedServices: PrescriptionServiceRequest[] = selectedServices.map(service => {
      const serviceId = service.serviceId ? String(service.serviceId).trim() : undefined;
      const serviceCode = service.serviceCode ? String(service.serviceCode).trim() : undefined;
      
      // Ensure we have at least one valid identifier (non-empty)
      if ((!serviceId || serviceId.length === 0) && (!serviceCode || serviceCode.length === 0)) {
        console.error('Service missing both serviceId and serviceCode:', service);
        return null;
      }

      const serviceData: PrescriptionServiceRequest = {
        order: service.order
      };
      
      // Prefer serviceId if available, otherwise use serviceCode
      // Include both if both are available (backend might need both)
      if (serviceId && serviceId.length > 0) {
        serviceData.serviceId = serviceId;
      }
      
      if (serviceCode && serviceCode.length > 0) {
        serviceData.serviceCode = serviceCode;
      }
      
      // Include doctorId if selected
      if (service.doctorId && service.doctorId.trim().length > 0) {
        serviceData.doctorId = String(service.doctorId).trim();
      }
      
      // Include note if provided (trim only when sending, not during typing)
      if (service.note && service.note.trim().length > 0) {
        serviceData.note = service.note.trim();
      }
      
      return serviceData;
    }).filter((s): s is PrescriptionServiceRequest => s !== null);

    // Final validation - each service must have at least serviceId or serviceCode
    const invalidServices = formattedServices.filter(s => {
      const hasServiceId = s.serviceId && s.serviceId.length > 0;
      const hasServiceCode = s.serviceCode && s.serviceCode.length > 0;
      return !hasServiceId && !hasServiceCode;
    });
    
    if (invalidServices.length > 0 || formattedServices.length !== selectedServices.length) {
      console.error('Invalid services:', invalidServices);
      console.error('All selected services:', selectedServices);
      console.error('All formatted services:', formattedServices);
      toast.error('Một số dịch vụ không có mã dịch vụ hợp lệ. Vui lòng thử lại.');
      return;
    }

    setIsCreating(true);
    try {
      const prescriptionData: PrescriptionData = {
        patientProfileId: selectedPatientProfile.id,
        services: formattedServices
      };

      console.log('Sending prescription data:', JSON.stringify(prescriptionData, null, 2));

      const response = await fetch(`${API_BASE_URL}/prescriptions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify(prescriptionData)
      });

      if (response.ok) {
        const result = await response.json();
        toast.success('Tạo phiếu chỉ định thành công');
        
        // Auto generate and download PDF
        if (result.prescriptionCode || result.data?.prescriptionCode) {
          const prescriptionCode = result.prescriptionCode || result.data?.prescriptionCode;
          try {
            // Fetch full prescription data for PDF
            const presRes = await fetch(`${API_BASE_URL}/prescriptions/${encodeURIComponent(prescriptionCode)}`, {
              headers: {
                'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
              }
            });
            if (presRes.ok) {
              const fullPrescription = await presRes.json();
              const prescriptionData = fullPrescription.data || fullPrescription;
              const { generatePrescriptionPDF } = await import('@/lib/utils/prescription-pdf');
              await generatePrescriptionPDF(prescriptionData);
              toast.success('Đã tải PDF phiếu chỉ định');
              
              // Small delay to ensure PDF download is initiated
              await new Promise(resolve => setTimeout(resolve, 500));
              
              // Reset form and reload view after PDF is downloaded
              setSelectedPatientProfile(null);
              setSelectedServices([]);
              setSearchQuery('');
              setSearchResults([]);
              setAppointmentCode('');
              setAppointment(null);
              setDoctorsByService({});
              
              // Refresh prescriptions list if on prescriptions tab
              if (activeTab === 'prescriptions') {
                fetchPrescriptions();
              } else {
                // Switch to prescriptions tab to show the new prescription
                setActiveTab('prescriptions');
                // fetchPrescriptions will be called by useEffect when tab changes
              }
            }
          } catch (pdfError) {
            console.error('Error generating PDF:', pdfError);
            toast.error('Tạo phiếu thành công nhưng không thể tạo PDF. Vui lòng in từ danh sách phiếu.');
            
            // Still reset form even if PDF generation failed
            setSelectedPatientProfile(null);
            setSelectedServices([]);
            setSearchQuery('');
            setSearchResults([]);
            setAppointmentCode('');
            setAppointment(null);
            setDoctorsByService({});
            
            if (activeTab === 'prescriptions') {
              fetchPrescriptions();
            } else {
              setActiveTab('prescriptions');
            }
          }
        } else {
          // Reset form even if no prescriptionCode
          setSelectedPatientProfile(null);
          setSelectedServices([]);
          setSearchQuery('');
          setSearchResults([]);
          setAppointmentCode('');
          setAppointment(null);
          setDoctorsByService({});
          
          if (activeTab === 'prescriptions') {
            fetchPrescriptions();
          } else {
            setActiveTab('prescriptions');
          }
        }
      } else {
        const error = await response.json();
        toast.error(error.message || 'Có lỗi xảy ra khi tạo phiếu chỉ định');
      }
    } catch (error) {
      console.error('Error creating prescription:', error);
      toast.error('Có lỗi xảy ra khi tạo phiếu chỉ định');
    } finally {
      setIsCreating(false);
    }
  };

  // Fetch prescriptions list
  const fetchPrescriptions = useCallback(async () => {
    setLoadingPrescriptions(true);
    try {
      const params = new URLSearchParams({
        page: String(prescriptionsPage),
        limit: String(prescriptionsLimit)
      });
      
      // Add filter params
      if (filterPatientName) params.set('patientName', filterPatientName);
      if (filterPatientPhone) params.set('patientPhone', filterPatientPhone);
      if (filterDoctorId) params.set('doctorId', filterDoctorId);
      if (filterStatus) params.set('status', filterStatus);
      if (filterDateFrom) params.set('dateFrom', filterDateFrom);
      if (filterDateTo) params.set('dateTo', filterDateTo);
      
      const res = await fetch(`${API_BASE_URL}/prescriptions?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });
      if (res.ok) {
        const json: PrescriptionsListResponse = await res.json();
        setPrescriptions(json.data || []);
        setPrescriptionsTotal(json.meta?.total || 0);
      } else {
        const err = await res.json();
        toast.error(err.message || 'Không thể tải danh sách phiếu chỉ định');
        setPrescriptions([]);
        setPrescriptionsTotal(0);
      }
    } catch (e) {
      console.error('Fetch prescriptions error', e);
      toast.error('Có lỗi xảy ra khi tải danh sách phiếu chỉ định');
      setPrescriptions([]);
      setPrescriptionsTotal(0);
    } finally {
      setLoadingPrescriptions(false);
    }
  }, [prescriptionsPage, prescriptionsLimit, filterPatientName, filterPatientPhone, filterDoctorId, filterStatus, filterDateFrom, filterDateTo]);
  
  // Load available doctors for filter
  const loadAvailableDoctorsForFilter = useCallback(async (search?: string) => {
    setLoadingDoctorsForFilter(true);
    try {
      // Use the /users/doctors/all endpoint with search parameter
      const url = search 
        ? `${API_BASE_URL}/users/doctors/all?search=${encodeURIComponent(search)}`
        : `${API_BASE_URL}/users/doctors/all`;
      
      const res = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });
      
      if (res.ok) {
        const data = await res.json();
        // Transform data to simple format
        const doctorsList: Array<{ id: string; name: string; doctorCode?: string }> = [];
        if (Array.isArray(data)) {
          data.forEach((item: { id?: string; name?: string; doctor?: { id?: string; doctorCode?: string } }) => {
            if (item.id && item.name && item.doctor?.id) {
              doctorsList.push({ 
                id: item.doctor.id, 
                name: item.name,
                doctorCode: item.doctor.doctorCode 
              });
            }
          });
        }
        setAvailableDoctorsForFilter(doctorsList);
      } else {
        console.error('Failed to load doctors:', res.status);
      }
    } catch (error) {
      console.error('Error loading doctors:', error);
    } finally {
      setLoadingDoctorsForFilter(false);
    }
  }, []);
  
  // Debounced search for doctors
  useEffect(() => {
    if (!doctorDropdownOpen) {
      return;
    }
    
    const timeoutId = setTimeout(() => {
      loadAvailableDoctorsForFilter(doctorSearchQuery);
    }, 300);
    
    return () => clearTimeout(timeoutId);
  }, [doctorSearchQuery, doctorDropdownOpen, loadAvailableDoctorsForFilter]);
  
  // Load doctors when dropdown opens for the first time
  useEffect(() => {
    if (doctorDropdownOpen && availableDoctorsForFilter.length === 0 && !doctorSearchQuery) {
      loadAvailableDoctorsForFilter();
    }
  }, [doctorDropdownOpen, availableDoctorsForFilter.length, doctorSearchQuery, loadAvailableDoctorsForFilter]);
  
  // Reset filters
  const resetFilters = useCallback(() => {
    setFilterPatientName('');
    setFilterPatientPhone('');
    setFilterDoctorId('');
    setFilterStatus('');
    setFilterDateFrom('');
    setFilterDateTo('');
    setPrescriptionsPage(1);
  }, []);
  
  // Apply filters (reset to page 1)
  const applyFilters = useCallback(() => {
    setPrescriptionsPage(1);
  }, []);

  // Load prescription details for update
  const loadPrescriptionDetails = useCallback(async (prescriptionId: string) => {
    setLoadingPrescriptionDetails(true);
    try {
      const res = await fetch(`${API_BASE_URL}/prescriptions/by-id/${prescriptionId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setSelectedPrescriptionForUpdate(data);
      } else {
        const err = await res.json();
        toast.error(err.message || 'Không thể tải chi tiết phiếu chỉ định');
      }
    } catch (error) {
      console.error('Error loading prescription details:', error);
      toast.error('Không thể tải chi tiết phiếu chỉ định');
    } finally {
      setLoadingPrescriptionDetails(false);
    }
  }, []);

  // Load available doctors for a service
  const loadAvailableDoctors = useCallback(async (prescriptionId: string, serviceId: string, prescriptionServiceId: string) => {
    setLoadingDoctorsForUpdate(prev => ({ ...prev, [prescriptionServiceId]: true }));
    try {
      const res = await fetch(`${API_BASE_URL}/prescriptions/${prescriptionId}/available-doctors/${serviceId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });
      if (res.ok) {
        const doctors = await res.json();
        setAvailableDoctorsForUpdate(prev => ({ ...prev, [prescriptionServiceId]: doctors || [] }));
      } else {
        const err = await res.json();
        toast.error(err.message || 'Không thể tải danh sách bác sĩ');
        setAvailableDoctorsForUpdate(prev => ({ ...prev, [prescriptionServiceId]: [] }));
      }
    } catch (error) {
      console.error('Error loading available doctors:', error);
      toast.error('Không thể tải danh sách bác sĩ');
      setAvailableDoctorsForUpdate(prev => ({ ...prev, [prescriptionServiceId]: [] }));
    } finally {
      setLoadingDoctorsForUpdate(prev => ({ ...prev, [prescriptionServiceId]: false }));
    }
  }, []);

  // Handle open update dialog
  const handleOpenUpdateDialog = useCallback(async (prescription: PrescriptionListItem) => {
    setUpdateDialogOpen(true);
    setSelectedPrescriptionForUpdate(null);
    setAvailableDoctorsForUpdate({});
    await loadPrescriptionDetails(prescription.id);
  }, [loadPrescriptionDetails]);

  // Handle update prescription
  const handleUpdatePrescription = useCallback(async (updateData: {
    prescriptionStatus?: string;
    services?: Array<{
      prescriptionServiceId: string;
      status?: string;
      doctorId?: string;
      technicianId?: string;
    }>;
  }) => {
    if (!selectedPrescriptionForUpdate?.id) return;
    
    setUpdatingPrescription(true);
    try {
      const res = await fetch(`${API_BASE_URL}/prescriptions/${selectedPrescriptionForUpdate.id}/update-services`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
      });
      
      if (res.ok) {
        toast.success('Cập nhật phiếu chỉ định thành công');
        setUpdateDialogOpen(false);
        setSelectedPrescriptionForUpdate(null);
        setAvailableDoctorsForUpdate({});
        await fetchPrescriptions();
      } else {
        const err = await res.json();
        toast.error(err.message || 'Không thể cập nhật phiếu chỉ định');
      }
    } catch (error) {
      console.error('Error updating prescription:', error);
      toast.error('Không thể cập nhật phiếu chỉ định');
    } finally {
      setUpdatingPrescription(false);
    }
  }, [selectedPrescriptionForUpdate, fetchPrescriptions]);

  // When switching to prescriptions tab or page changes
  useEffect(() => {
    if (activeTab === 'prescriptions') {
      fetchPrescriptions();
      // Load doctors when tab opens, but not on every render
      if (availableDoctorsForFilter.length === 0) {
        loadAvailableDoctorsForFilter();
      }
    }
  }, [activeTab, fetchPrescriptions]);
  
  // Update doctor search query when filterDoctorId changes
  useEffect(() => {
    if (filterDoctorId && !doctorSearchQuery) {
      const selectedDoctor = availableDoctorsForFilter.find(d => d.id === filterDoctorId);
      if (selectedDoctor) {
        setDoctorSearchQuery(selectedDoctor.name);
      }
    } else if (!filterDoctorId) {
      setDoctorSearchQuery('');
    }
  }, [filterDoctorId, availableDoctorsForFilter]);

  const handleBack = () => {
    router.push('/medical-records');
  };

  const prescriptionsTotalPages = Math.max(1, Math.ceil(prescriptionsTotal / prescriptionsLimit));

  return (
    <div className="container mx-auto py-6 px-8">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-3">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleBack}
            className="flex items-center gap-2 text-sm"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="h-5 w-px bg-gray-300" />
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900">Phiếu chỉ định</h1>
            
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={(val) => setActiveTab(val as 'create' | 'prescriptions')}>
        <TabsList className="mb-6">
          <TabsTrigger value="create" className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Tạo phiếu chỉ định
          </TabsTrigger>
          <TabsTrigger value="prescriptions" className="flex items-center gap-2">
            <List className="h-4 w-4" />
            Danh sách phiếu chỉ định
          </TabsTrigger>
        </TabsList>

        <TabsContent value="create" className="space-y-6">

      {/* Appointment Lookup */}
      <Card className="mb-2">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between text-lg">
            <span className="flex items-center gap-2">
              <Search className="h-5 w-5 text-purple-600" />
              Tạo phiếu chỉ định từ lịch hẹn
            </span>
            <div className="hidden md:flex gap-2">
              <Button variant="outline" size="sm" onClick={onLookupAppointment} disabled={appointmentLoading}>
                {appointmentLoading ? <Loader2 className="h-3 w-3 mr-2 animate-spin" /> : <Search className="h-3 w-3 mr-2" />}
                Tra cứu
              </Button>
              <Button size="sm" onClick={onCreateFromAppointment} disabled={!appointment}>
                <ClipboardList className="h-4 w-4 mr-2" /> Tạo phiếu
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="md:col-span-3">
              
              <div className="relative mt-1 flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="appointmentCode"
                    placeholder="Nhập mã lịch hẹn (VD: APPT-20251103-ABC123)"
                    value={appointmentCode}
                    onChange={(e) => {
                      setAppointmentCode(e.target.value);
                      // Ẩn appointment khi input trống
                      if (!e.target.value.trim()) {
                        setAppointment(null);
                      }
                    }}
                    onKeyDown={(e) => e.key === 'Enter' && onLookupAppointment()}
                    className="pl-9"
                  />
                </div>
                <Button 
                  onClick={() => setIsQrScannerOpen(true)}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-1"
                  title=""
                >
                  <QrCode className="h-4 w-4" />
                </Button>
              </div>
              
            </div>
            <div className="flex md:hidden gap-2 items-end">
              <Button variant="outline" className="flex-1" onClick={onLookupAppointment} disabled={appointmentLoading}>
                {appointmentLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Search className="h-4 w-4 mr-2" />}
                Tra cứu
              </Button>
              <Button className="flex-1" onClick={onCreateFromAppointment} disabled={!appointment}>
                <ClipboardList className="h-4 w-4 mr-2" /> Tạo phiếu
              </Button>
            </div>
          </div>

            {appointment && (
              <div className="rounded-lg border overflow-hidden">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
                  <div className="p-3 bg-gray-50 border-b md:border-b-0 md:border-r">
                    <div className="text-[11px] uppercase tracking-wide text-gray-500">Mã lịch hẹn</div>
                    <div className="font-medium text-sm">{appointment.appointmentCode}</div>
                  </div>
                  <div className="p-3 bg-gray-50">
                    <div className="text-[11px] uppercase tracking-wide text-gray-500">Trạng thái</div>
                    <div className="mt-1"><Badge variant="secondary" className="text-xs">{appointment.status}</Badge></div>
                  </div>

                  <div className="p-3 border-t md:border-t md:border-r">
                    <div className="text-[11px] uppercase tracking-wide text-gray-500">Bệnh nhân</div>
                    <div className="font-medium text-sm">{appointment.patientProfile?.name}</div>
                  </div>
                  <div className="p-3 border-t">
                    <div className="text-[11px] uppercase tracking-wide text-gray-500">Bác sĩ</div>
                    <div className="font-medium text-sm">{appointment.doctor?.auth?.name || appointment.doctor?.doctorCode || '—'}</div>
                  </div>

                  <div className="p-3 border-t md:border-r">
                    <div className="text-[11px] uppercase tracking-wide text-gray-500">Chuyên khoa</div>
                    <div className="font-medium text-sm">{appointment.specialty?.name || '—'}</div>
                  </div>
                  <div className="p-3 border-t">
                    <div className="text-[11px] uppercase tracking-wide text-gray-500">Thời gian</div>
                    <div className="font-medium text-sm">{appointment.date ? new Date(appointment.date).toLocaleDateString('vi-VN') : '—'} {appointment.startTime ? `• ${appointment.startTime}` : ''}</div>
                  </div>
                </div>

                {appointment.appointmentServices && appointment.appointmentServices.length > 0 && (
                  <div className="p-3 border-t bg-white">
                    <div className="text-[11px] uppercase tracking-wide text-gray-500 mb-2">Dịch vụ lịch hẹn ({appointment.appointmentServices.length})</div>
                    <div className="flex flex-wrap gap-2">
                      {appointment.appointmentServices.map((s, idx) => (
                        <Badge key={`${s.serviceId}-${idx}`} variant="outline" className="text-xs">
                          {s.service?.serviceCode || s.serviceId}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

      

      {/* Patient Selection */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Search className="h-5 w-5 text-blue-600" />
            Chọn hồ sơ bệnh nhân
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            
            <PatientSearch
              compact
              selectedPatientProfile={selectedPatientProfile}
              onPatientProfileSelect={(profile) => setSelectedPatientProfile(profile)}
            />
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Patient Info & Selected Services */}
        <div className="lg:col-span-2 space-y-6">
          {/* Patient Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <User className="h-5 w-5 text-blue-600" />
                Thông tin bệnh nhân
              </CardTitle>
            </CardHeader>
            <CardContent>
              {selectedPatientProfile ? (
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <Label className="font-medium text-gray-700">Tên bệnh nhân</Label>
                    <p className="text-gray-900">{selectedPatientProfile.name || 'N/A'}</p>
                  </div>
                  <div>
                    <Label className="font-medium text-gray-700">Mã hồ sơ</Label>
                    <p className="text-gray-900">{selectedPatientProfile.profileCode || 'N/A'}</p>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-500">Chưa có dữ liệu. Vui lòng chọn hồ sơ bệnh nhân.</p>
              )}
            </CardContent>
          </Card>

          {/* Selected Services */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <ClipboardList className="h-5 w-5 text-green-600" />
                Dịch vụ đã chọn ({selectedServices.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {selectedServices.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <ClipboardList className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p>Chưa có dịch vụ nào được chọn</p>
                  <p className="text-sm">Sử dụng ô tìm kiếm bên phải để thêm dịch vụ</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {selectedServices.map((service) => {
                    const doctors = service.serviceId ? doctorsByService[service.serviceId] || [] : [];
                    const isLoadingDoctor = service.serviceId ? loadingDoctors[service.serviceId] : false;
                    
                    return (
                      <div
                        key={service.serviceCode}
                        className="p-4 bg-gray-50 rounded-lg border border-gray-200"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3 flex-1">
                            <GripVertical className="h-4 w-4 text-gray-400 cursor-move" />
                            <Badge variant="secondary" className="text-xs">
                              {service.order}
                            </Badge>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm text-gray-900">
                                {service.serviceName || service.serviceCode}
                              </p>
                              <p className="text-xs text-gray-600">{service.serviceCode}</p>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeService(service.serviceCode)}
                            className="text-red-600 hover:text-red-700 h-8 w-8 p-0"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                        
                        {/* Note Input */}
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <Label className="text-xs font-medium text-gray-700 mb-2 block">
                            Ghi chú (tùy chọn)
                          </Label>
                          <Textarea
                            placeholder="Nhập ghi chú cho dịch vụ này..."
                            value={service.note || ''}
                            onChange={(e) => updateServiceNote(service.serviceCode, e.target.value)}
                            onKeyDown={(e) => e.stopPropagation()}
                            className="text-xs min-h-[60px] bg-white"
                            rows={2}
                          />
                        </div>

                        {/* Doctor Selection */}
                        {service.serviceId && (
                          <div className="mt-3 pt-3 border-t border-gray-200">
                            <Label className="text-xs font-medium text-gray-700 mb-2 block">
                              Bác sĩ phụ trách (tùy chọn)
                            </Label>
                            {isLoadingDoctor ? (
                              <div className="flex items-center gap-2 text-xs text-gray-500">
                                <Loader2 className="h-3 w-3 animate-spin" />
                                Đang tải danh sách bác sĩ...
                              </div>
                            ) : doctors.length > 0 ? (
                              <Select
                                value={service.doctorId || '__none__'}
                                onValueChange={(val) => {
                                  // Convert special value to undefined
                                  const doctorId = val === '__none__' ? undefined : val;
                                  updateServiceDoctor(service.serviceCode, doctorId);
                                }}
                              >
                                <SelectTrigger className="h-8 text-xs">
                                  <SelectValue placeholder="Chọn bác sĩ (tùy chọn)" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="__none__">Không chọn</SelectItem>
                                  {doctors
                                    .filter((doctor) => doctor.type === 'doctor' && doctor.doctorId)
                                    .map((doctor) => {
                                      const doctorId = doctor.doctorId!;
                                      const doctorName = doctor.doctorName || doctor.name;
                                      const doctorCode = doctor.doctorCode || '';
                                      return (
                                        <SelectItem key={doctorId} value={doctorId}>
                                          <div className="flex flex-col">
                                            <span className="font-medium">{doctorName}</span>
                                            <span className="text-xs text-gray-500">
                                              {doctorCode}
                                              {doctor.clinicRoomName && ` • ${doctor.clinicRoomName}`}
                                              {doctor.boothName && ` • ${doctor.boothName}`}
                                            </span>
                                          </div>
                                        </SelectItem>
                                      );
                                    })}
                                </SelectContent>
                              </Select>
                            ) : (
                              <p className="text-xs text-gray-500">Không có bác sĩ khả dụng cho dịch vụ này</p>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Service Search */}
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Search className="h-5 w-5 text-purple-600" />
                Tìm kiếm dịch vụ
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Tìm kiếm dịch vụ..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              {isSearching && (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600 mx-auto"></div>
                  <p className="text-sm text-gray-500 mt-2">Đang tìm kiếm...</p>
                </div>
              )}

              {!isSearching && searchResults.length > 0 && (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {searchResults.map((service) => (
                    <div
                      key={service.id}
                      className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={() => addService(service)}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline" className="text-xs">
                          {service.serviceCode}
                        </Badge>
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0 ml-auto">
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                      <h4 className="font-medium text-sm mb-1">{service.name}</h4>
                      {service.description && (
                        <p className="text-xs text-gray-600 line-clamp-2">{service.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {!isSearching && searchQuery && searchResults.length === 0 && (
                <div className="text-center py-4 text-gray-500">
                  <p className="text-sm">Không tìm thấy dịch vụ nào</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <Button
                onClick={handleCreatePrescription}
                disabled={isCreating || !selectedPatientProfile || selectedServices.length === 0}
                className="w-full bg_GREEN-600 hover:bg-green-700"
              >
                {isCreating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Đang tạo...
                  </>
                ) : (
                  <>
                    <ClipboardList className="h-4 w-4 mr-2" />
                    Tạo phiếu chỉ định
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
        </TabsContent>

        <TabsContent value="prescriptions" className="space-y-6">
          {/* Filter Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Search className="h-5 w-5 text-blue-600" />
                Bộ lọc
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Patient Name Filter */}
                <div className="space-y-2">
                  <Label htmlFor="filter-patient-name">Tên bệnh nhân</Label>
                  <Input
                    id="filter-patient-name"
                    placeholder="Nhập tên bệnh nhân"
                    value={filterPatientName}
                    onChange={(e) => setFilterPatientName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
                  />
                </div>

                {/* Patient Phone Filter */}
                <div className="space-y-2">
                  <Label htmlFor="filter-patient-phone">Số điện thoại</Label>
                  <Input
                    id="filter-patient-phone"
                    placeholder="Nhập số điện thoại"
                    value={filterPatientPhone}
                    onChange={(e) => setFilterPatientPhone(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
                  />
                </div>

                {/* Doctor Filter */}
                <div className="space-y-2">
                  <Label htmlFor="filter-doctor">Bác sĩ thực hiện</Label>
                  <div className="relative">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="filter-doctor"
                        placeholder="Tìm kiếm bác sĩ..."
                        value={doctorSearchQuery}
                        onChange={(e) => setDoctorSearchQuery(e.target.value)}
                        onFocus={() => setDoctorDropdownOpen(true)}
                        onBlur={() => setTimeout(() => setDoctorDropdownOpen(false), 200)}
                        className="pl-9"
                      />
                    </div>
                    {doctorDropdownOpen && (
                      <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto">
                        {loadingDoctorsForFilter ? (
                          <div className="p-4 text-center text-sm text-gray-500">
                            <Loader2 className="h-4 w-4 animate-spin mx-auto mb-2" />
                            Đang tải...
                          </div>
                        ) : availableDoctorsForFilter.length === 0 ? (
                          <div className="p-4 text-center text-sm text-gray-500">
                            Không tìm thấy bác sĩ
                          </div>
                        ) : (
                          <>
                            {availableDoctorsForFilter
                              .filter((doctor) => 
                                doctor.name.toLowerCase().includes(doctorSearchQuery.toLowerCase()) ||
                                doctor.doctorCode?.toLowerCase().includes(doctorSearchQuery.toLowerCase())
                              )
                              .map((doctor) => (
                                <div
                                  key={doctor.id}
                                  className={`px-4 py-2 cursor-pointer hover:bg-gray-100 ${
                                    filterDoctorId === doctor.id ? 'bg-blue-50' : ''
                                  }`}
                                  onClick={() => {
                                    setFilterDoctorId(doctor.id);
                                    setDoctorSearchQuery(doctor.name);
                                    setDoctorDropdownOpen(false);
                                  }}
                                >
                                  <div className="flex items-center gap-2">
                                    <Stethoscope className="h-4 w-4 text-blue-600" />
                                    <div>
                                      <div className="text-sm font-medium">{doctor.name}</div>
                                      {doctor.doctorCode && (
                                        <div className="text-xs text-gray-500">{doctor.doctorCode}</div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            {filterDoctorId && (
                              <div className="border-t border-gray-200">
                                <div
                                  className="px-4 py-2 cursor-pointer hover:bg-gray-100 text-sm text-gray-600"
                                  onClick={() => {
                                    setFilterDoctorId('');
                                    setDoctorSearchQuery('');
                                    setDoctorDropdownOpen(false);
                                  }}
                                >
                                  <X className="h-4 w-4 inline mr-2" />
                                  Xóa lọc bác sĩ
                                </div>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    )}
                  </div>
                  {filterDoctorId && (
                    <div className="mt-1">
                      <Badge variant="secondary" className="flex items-center gap-1 w-fit">
                        {availableDoctorsForFilter.find((d: { id: string; name: string }) => d.id === filterDoctorId)?.name || filterDoctorId}
                        <X
                          className="h-3 w-3 cursor-pointer"
                          onClick={() => {
                            setFilterDoctorId('');
                            setDoctorSearchQuery('');
                          }}
                        />
                      </Badge>
                    </div>
                  )}
                </div>

                {/* Status Filter */}
                <div className="space-y-2">
                  <Label htmlFor="filter-status">Trạng thái</Label>
                  <Select 
                    value={filterStatus || undefined} 
                    onValueChange={(value) => setFilterStatus(value || '')}
                  >
                    <SelectTrigger id="filter-status">
                      <SelectValue placeholder="Tất cả trạng thái" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="NOT_STARTED">Chưa thanh toán</SelectItem>
                      <SelectItem value="PENDING">Đã thanh toán</SelectItem>
                      <SelectItem value="WAITING">Chờ phục vụ</SelectItem>
                      <SelectItem value="PREPARING">Chuẩn bị</SelectItem>
                      <SelectItem value="SERVING">Đang phục vụ</SelectItem>
                      <SelectItem value="WAITING_RESULT">Chờ kết quả</SelectItem>
                      <SelectItem value="RETURNING">Đã quay lại</SelectItem>
                      <SelectItem value="SKIPPED">Bị bỏ qua</SelectItem>
                      <SelectItem value="RESCHEDULED">Hẹn tiếp tục</SelectItem>
                      <SelectItem value="COMPLETED">Hoàn thành</SelectItem>
                      <SelectItem value="CANCELLED">Đã hủy</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Date From Filter */}
                <div className="space-y-2">
                  <Label htmlFor="filter-date-from">Từ ngày</Label>
                  <Input
                    id="filter-date-from"
                    type="date"
                    value={filterDateFrom}
                    onChange={(e) => setFilterDateFrom(e.target.value)}
                  />
                </div>

                {/* Date To Filter */}
                <div className="space-y-2">
                  <Label htmlFor="filter-date-to">Đến ngày</Label>
                  <Input
                    id="filter-date-to"
                    type="date"
                    value={filterDateTo}
                    onChange={(e) => setFilterDateTo(e.target.value)}
                  />
                </div>
              </div>

              {/* Active Filters & Actions */}
              <div className="mt-4 flex items-center justify-between flex-wrap gap-2">
                <div className="flex flex-wrap gap-2">
                  {(filterPatientName || filterPatientPhone || filterDoctorId || filterStatus || filterDateFrom || filterDateTo) && (
                    <>
                      {filterPatientName && (
                        <Badge variant="secondary" className="flex items-center gap-1">
                          Tên: {filterPatientName}
                          <X
                            className="h-3 w-3 cursor-pointer"
                            onClick={() => {
                              setFilterPatientName('');
                              applyFilters();
                            }}
                          />
                        </Badge>
                      )}
                      {filterPatientPhone && (
                        <Badge variant="secondary" className="flex items-center gap-1">
                          SĐT: {filterPatientPhone}
                          <X
                            className="h-3 w-3 cursor-pointer"
                            onClick={() => {
                              setFilterPatientPhone('');
                              applyFilters();
                            }}
                          />
                        </Badge>
                      )}
                      {filterDoctorId && (
                        <Badge variant="secondary" className="flex items-center gap-1">
                          BS: {availableDoctorsForFilter.find((d: { id: string; name: string }) => d.id === filterDoctorId)?.name || filterDoctorId}
                          <X
                            className="h-3 w-3 cursor-pointer"
                            onClick={() => {
                              setFilterDoctorId('');
                              applyFilters();
                            }}
                          />
                        </Badge>
                      )}
                      {filterStatus && (
                        <Badge variant="secondary" className="flex items-center gap-1">
                          Trạng thái: {filterStatus}
                          <X
                            className="h-3 w-3 cursor-pointer"
                            onClick={() => {
                              setFilterStatus('');
                              applyFilters();
                            }}
                          />
                        </Badge>
                      )}
                      {(filterDateFrom || filterDateTo) && (
                        <Badge variant="secondary" className="flex items-center gap-1">
                          {filterDateFrom && filterDateTo
                            ? `${filterDateFrom} - ${filterDateTo}`
                            : filterDateFrom
                            ? `Từ: ${filterDateFrom}`
                            : `Đến: ${filterDateTo}`}
                          <X
                            className="h-3 w-3 cursor-pointer"
                            onClick={() => {
                              setFilterDateFrom('');
                              setFilterDateTo('');
                              applyFilters();
                            }}
                          />
                        </Badge>
                      )}
                    </>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={resetFilters}
                    disabled={loadingPrescriptions}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Xóa bộ lọc
                  </Button>
                  <Button
                    size="sm"
                    onClick={applyFilters}
                    disabled={loadingPrescriptions}
                  >
                    <Search className="h-4 w-4 mr-2" />
                    Áp dụng
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <List className="h-5 w-5 text-blue-600" />
                  Danh sách phiếu chỉ định
                </CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fetchPrescriptions()}
                  disabled={loadingPrescriptions}
                  className="flex items-center gap-2"
                >
                  <RefreshCw className={`h-4 w-4 ${loadingPrescriptions ? 'animate-spin' : ''}`} />
                  Làm mới
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loadingPrescriptions ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                  <span className="ml-2 text-gray-600">Đang tải...</span>
                </div>
              ) : prescriptions.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <ClipboardList className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p>Không có phiếu chỉ định nào</p>
                </div>
              ) : (
                <>
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[120px]">Mã</TableHead>
                          <TableHead>Bệnh nhân</TableHead>
                          <TableHead className="w-[180px]">Bác sĩ</TableHead>
                          <TableHead className="w-[220px]">Dịch vụ</TableHead>
                          <TableHead className="w-[160px]">Mã bệnh án</TableHead>
                          <TableHead className="w-[120px]">Trạng thái</TableHead>
                          <TableHead className="w-[100px]">Thao tác</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {prescriptions.map((p) => {
                          const displayCode = p.id?.slice(0, 8);
                          const patientName = p.patientProfile?.name || '-';
                          const doctorName = p.doctor?.auth?.name || '-';
                          const created = p.medicalRecord?.medicalRecordCode  || '-';
                          const servicesText = (p.services || [])
                            .map(s => s.service?.serviceCode || s.service?.name)
                            .filter(Boolean)
                            .join(', ');
                          return (
                            <TableRow key={p.id}>
                              <TableCell className="font-mono text-xs">{displayCode}</TableCell>
                              <TableCell>
                                <div className="text-sm">
                                  <div className="font-medium">{patientName}</div>
                                  <div className="text-xs text-gray-500">{p.patientProfile?.profileCode}</div>
                                </div>
                              </TableCell>
                              <TableCell className="text-sm">{doctorName}</TableCell>
                              <TableCell>
                                <div className="text-xs text-gray-700 line-clamp-2">{servicesText || '-'}</div>
                              </TableCell>
                              <TableCell className="text-sm">{created}</TableCell>
                              <TableCell>
                                <Badge variant="outline" className="text-xs">
                                  {p.status || 'N/A'}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleOpenUpdateDialog(p)}
                                  className="flex items-center gap-1"
                                >
                                  <Edit className="h-3 w-3" />
                                  Cập nhật
                                </Button>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>

                  <div className="flex items-center justify-between mt-6">
                    <div className="text-sm text-gray-600">
                      Hiển thị {(prescriptionsPage - 1) * prescriptionsLimit + 1} - {Math.min(prescriptionsPage * prescriptionsLimit, prescriptionsTotal)} / {prescriptionsTotal}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPrescriptionsPage(prev => Math.max(1, prev - 1))}
                        disabled={prescriptionsPage <= 1 || loadingPrescriptions}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <div className="text-sm text-gray-600">
                        Trang {prescriptionsPage} / {prescriptionsTotalPages}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPrescriptionsPage(prev => Math.min(prescriptionsTotalPages, prev + 1))}
                        disabled={prescriptionsPage >= prescriptionsTotalPages || loadingPrescriptions}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* QR Scanner Dialog */}
      <Dialog open={isQrScannerOpen} onOpenChange={setIsQrScannerOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <QrCode className="h-5 w-5" />
              Quét mã QR (PAT/APT)
            </DialogTitle>
            <DialogDescription>
              Đưa mã QR của hồ sơ bệnh nhân (PAT...) hoặc lịch hẹn (APT...) vào khung hình để quét tự động
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="relative w-full bg-black rounded-lg overflow-hidden" style={{ aspectRatio: '1' }}>
              {/* Video element for BarcodeDetector */}
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-full object-cover ${usingHtml5Qrcode ? 'hidden' : ''}`}
                style={{ transform: 'scaleX(-1)' }}
              />
              
              {/* HTML5 QR Code reader container */}
              <div id="qr-reader" className="w-full h-full"></div>
              
              {/* Scanning overlay for BarcodeDetector mode */}
              {scanning && !usingHtml5Qrcode && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="border-2 border-white rounded-lg w-[80%] h-[80%] relative">
                    {/* Corner indicators */}
                    <div className="absolute -top-1 -left-1 w-8 h-8 border-t-4 border-l-4 border-white rounded-tl-lg" />
                    <div className="absolute -top-1 -right-1 w-8 h-8 border-t-4 border-r-4 border-white rounded-tr-lg" />
                    <div className="absolute -bottom-1 -left-1 w-8 h-8 border-b-4 border-l-4 border-white rounded-bl-lg" />
                    <div className="absolute -bottom-1 -right-1 w-8 h-8 border-b-4 border-r-4 border-white rounded-br-lg" />
                  </div>
                </div>
              )}
              
              {!scanning && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                  <div className="text-center text-white">
                    <CameraOff className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Camera chưa sẵn sàng</p>
                  </div>
                </div>
              )}
            </div>
            
            <div className="text-center">
              <p className="text-sm text-gray-600">{scanHint}</p>
              {scannerSupported === false && (
                <p className="text-xs text-red-600 mt-2">
                  Trình duyệt không hỗ trợ quét QR. Vui lòng sử dụng trình duyệt hiện đại hơn.
                </p>
              )}
            </div>
            
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={async () => {
                  await stopScanner();
                  setIsQrScannerOpen(false);
                }}
              >
                Đóng
              </Button>
              {!scanning && (
                <Button
                  onClick={startScanner}
                  className="flex items-center gap-2"
                >
                  <Camera className="h-4 w-4" />
                  Khởi động lại
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Update Prescription Dialog */}
      <Dialog open={updateDialogOpen} onOpenChange={setUpdateDialogOpen}>
        <DialogContent className="sm:max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Cập nhật phiếu chỉ định</DialogTitle>
            <DialogDescription>
              Cập nhật trạng thái phiếu chỉ định và các dịch vụ
            </DialogDescription>
          </DialogHeader>

          {loadingPrescriptionDetails ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              <span className="ml-2 text-gray-600">Đang tải...</span>
            </div>
          ) : selectedPrescriptionForUpdate ? (
            <UpdatePrescriptionForm
              prescription={selectedPrescriptionForUpdate as unknown as PrescriptionListItem & { 
                services?: Array<{ 
                  id: string; 
                  status?: string; 
                  doctorId?: string | null; 
                  technicianId?: string | null; 
                  serviceId?: string; 
                  serviceName?: string; 
                  order?: number;
                  service?: { serviceCode?: string; name?: string } | null;
                  doctor?: { id: string; auth?: { name?: string } } | null;
                  technician?: { id: string; auth?: { name?: string } } | null;
                }> | null;
              }}
              availableDoctors={availableDoctorsForUpdate}
              loadingDoctors={loadingDoctorsForUpdate}
              onLoadDoctors={loadAvailableDoctors}
              onUpdate={handleUpdatePrescription}
              updating={updatingPrescription}
            />
          ) : (
            <div className="text-center py-12 text-gray-500">
              Không có dữ liệu
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Update Prescription Form Component
function UpdatePrescriptionForm({
  prescription,
  availableDoctors,
  loadingDoctors,
  onLoadDoctors,
  onUpdate,
  updating,
}: {
  prescription: PrescriptionListItem & { 
    services?: Array<{ 
      id: string; 
      status?: string; 
      doctorId?: string | null; 
      technicianId?: string | null; 
      serviceId?: string; 
      serviceName?: string; 
      order?: number;
      service?: { serviceCode?: string; name?: string } | null;
      doctor?: { id: string; auth?: { name?: string } } | null;
      technician?: { id: string; auth?: { name?: string } } | null;
    }> | null;
  };
  availableDoctors: Record<string, DoctorOption[]>;
  loadingDoctors: Record<string, boolean>;
  onLoadDoctors: (prescriptionId: string, serviceId: string, prescriptionServiceId: string) => void;
  onUpdate: (data: {
    prescriptionStatus?: string;
    services?: Array<{
      prescriptionServiceId: string;
      status?: string;
      doctorId?: string;
      technicianId?: string;
    }>;
  }) => void;
  updating: boolean;
}) {
  const [prescriptionStatus, setPrescriptionStatus] = React.useState<string>(prescription.status || 'NOT_STARTED');
  const [serviceUpdates, setServiceUpdates] = React.useState<Record<string, {
    status?: string;
    doctorId?: string;
    technicianId?: string;
  }>>({});

  React.useEffect(() => {
    // Initialize service updates
    const updates: Record<string, { status?: string; doctorId?: string; technicianId?: string }> = {};
    if (prescription.services) {
      prescription.services?.forEach((ps: { id: string; status?: string; doctorId?: string | null; technicianId?: string | null }) => {
        updates[ps.id] = {
          status: ps.status,
          doctorId: ps.doctorId || undefined,
          technicianId: ps.technicianId || undefined,
        };
      });
    }
    setServiceUpdates(updates);
  }, [prescription]);

  const handleServiceStatusChange = (prescriptionServiceId: string, status: string) => {
    setServiceUpdates(prev => ({
      ...prev,
      [prescriptionServiceId]: {
        ...prev[prescriptionServiceId],
        status,
      },
    }));
  };

  const handleServiceDoctorChange = (prescriptionServiceId: string, doctorId: string) => {
    setServiceUpdates(prev => ({
      ...prev,
      [prescriptionServiceId]: {
        ...prev[prescriptionServiceId],
        doctorId: doctorId || undefined,
        technicianId: undefined, // Clear technician when selecting doctor
      },
    }));
  };

  const handleServiceTechnicianChange = (prescriptionServiceId: string, technicianId: string) => {
    setServiceUpdates(prev => ({
      ...prev,
      [prescriptionServiceId]: {
        ...prev[prescriptionServiceId],
        technicianId: technicianId || undefined,
        doctorId: undefined, // Clear doctor when selecting technician
      },
    }));
  };

  const handleLoadDoctors = (serviceId: string, prescriptionServiceId: string) => {
    if (!availableDoctors[prescriptionServiceId] && !loadingDoctors[prescriptionServiceId]) {
      onLoadDoctors(prescription.id, serviceId, prescriptionServiceId);
    }
  };

  const handleSubmit = () => {
    const updateData: {
      prescriptionStatus?: string;
      services?: Array<{
        prescriptionServiceId: string;
        status?: string;
        doctorId?: string;
        technicianId?: string;
      }>;
    } = {};

    // Add prescription status if changed
    if (prescriptionStatus !== prescription.status) {
      updateData.prescriptionStatus = prescriptionStatus;
    }

    // Add service updates
    const serviceUpdatesArray: Array<{
      prescriptionServiceId: string;
      status?: string;
      doctorId?: string;
      technicianId?: string;
    }> = [];

    Object.entries(serviceUpdates).forEach(([prescriptionServiceId, updates]) => {
      const originalService = prescription.services?.find((ps: { id: string; status?: string; doctorId?: string | null; technicianId?: string | null }) => ps.id === prescriptionServiceId);
      if (!originalService) return;

      const hasChanges = 
        updates.status !== originalService.status ||
        updates.doctorId !== (originalService.doctorId || undefined) ||
        updates.technicianId !== (originalService.technicianId || undefined);

      if (hasChanges) {
        const updateItem: {
          prescriptionServiceId: string;
          status?: string;
          doctorId?: string;
          technicianId?: string;
        } = {
          prescriptionServiceId,
          status: updates.status,
        };
        
        if (updates.doctorId) {
          updateItem.doctorId = updates.doctorId;
        }
        if (updates.technicianId) {
          updateItem.technicianId = updates.technicianId;
        }
        
        serviceUpdatesArray.push(updateItem);
      }
    });

    if (serviceUpdatesArray.length > 0) {
      updateData.services = serviceUpdatesArray;
    }

    if (updateData.prescriptionStatus || updateData.services) {
      onUpdate(updateData);
    } else {
      toast.info('Không có thay đổi nào');
    }
  };

  const prescriptionStatusOptions = [
    { value: 'NOT_STARTED', label: 'Chưa bắt đầu' },
    { value: 'PENDING', label: 'Đang chờ' },
    { value: 'WAITING', label: 'Chờ phục vụ' },
    { value: 'PREPARING', label: 'Chuẩn bị' },
    { value: 'SERVING', label: 'Đang phục vụ' },
    { value: 'WAITING_RESULT', label: 'Chờ kết quả' },
    { value: 'RETURNING', label: 'Đang trả lại' },
    { value: 'COMPLETED', label: 'Hoàn thành' },
    { value: 'CANCELLED', label: 'Đã hủy' },
  ];

  const serviceStatusOptions = [
    { value: 'NOT_STARTED', label: 'Chưa thanh toán' },
    { value: 'PENDING', label: 'Đã thanh toán' },
    { value: 'WAITING', label: 'Chờ phục vụ' },
    { value: 'PREPARING', label: 'Chuẩn bị' },
    { value: 'SERVING', label: 'Đang phục vụ' },
    { value: 'WAITING_RESULT', label: 'Chờ kết quả' },
    { value: 'RETURNING', label: 'Đã quay lại' },
    { value: 'SKIPPED', label: 'Bị bỏ qua' },
    { value: 'RESCHEDULED', label: 'Hẹn tiếp tục' },
    { value: 'COMPLETED', label: 'Hoàn thành' },
    { value: 'CANCELLED', label: 'Đã hủy' },
  ];

  return (
    <div className="space-y-6">
      {/* Prescription Status */}
      <div className="space-y-2">
        <Label>Trạng thái phiếu chỉ định</Label>
        <Select value={prescriptionStatus} onValueChange={setPrescriptionStatus}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {prescriptionStatusOptions.map(option => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Services List */}
      <div className="space-y-4">
        <Label>Danh sách dịch vụ</Label>
        {prescription.services && prescription.services.length > 0 ? (
          <div className="space-y-3">
            {prescription.services?.map((ps: { id: string; status?: string; doctorId?: string | null; technicianId?: string | null; serviceId?: string; serviceName?: string; order?: number; service?: { serviceCode?: string; name?: string } | null; doctor?: { id: string; auth?: { name?: string } } | null; technician?: { id: string; auth?: { name?: string } } | null }) => {
              const isCompleted = ps.status === 'COMPLETED';
              const currentUpdate = serviceUpdates[ps.id] || {};
              const doctors = availableDoctors[ps.id] || [];
              const isLoadingDoctors = loadingDoctors[ps.id] || false;

              return (
                <Card key={ps.id} className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">{ps.service?.name || ps.service?.serviceCode}</div>
                        <div className="text-xs text-gray-500">Thứ tự: {ps.order}</div>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {ps.status}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      {/* Service Status */}
                      <div className="space-y-2">
                        <Label className="text-xs">Trạng thái dịch vụ</Label>
                        <Select
                          value={currentUpdate.status || ps.status}
                          onValueChange={(value) => handleServiceStatusChange(ps.id, value)}
                        >
                          <SelectTrigger className="h-9">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {serviceStatusOptions.map(option => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Doctor/Technician Selection */}
                      <div className="space-y-2">
                        <Label className="text-xs">Người thực hiện</Label>
                        <div className="flex gap-2">
                          <Select
                            value={
                              currentUpdate.doctorId 
                                ? `doctor-${currentUpdate.doctorId}` 
                                : currentUpdate.technicianId 
                                  ? `technician-${currentUpdate.technicianId}` 
                                  : ps.doctorId 
                                    ? `doctor-${ps.doctorId}` 
                                    : ps.technicianId 
                                      ? `technician-${ps.technicianId}` 
                                      : ''
                            }
                            onValueChange={(value) => {
                              if (value.startsWith('doctor-')) {
                                handleServiceDoctorChange(ps.id, value.replace('doctor-', ''));
                              } else if (value.startsWith('technician-')) {
                                handleServiceTechnicianChange(ps.id, value.replace('technician-', ''));
                              }
                            }}
                            disabled={isCompleted}
                            onOpenChange={(open) => {
                              if (open && !isCompleted && doctors.length === 0 && !isLoadingDoctors && ps.serviceId) {
                                handleLoadDoctors(ps.serviceId, ps.id);
                              }
                            }}
                          >
                            <SelectTrigger className="h-9 flex-1">
                              <SelectValue placeholder={isCompleted ? "Không thể thay đổi" : "Chọn người thực hiện"} />
                            </SelectTrigger>
                            <SelectContent>
                              {isLoadingDoctors ? (
                                <SelectItem value="loading" disabled>
                                  <Loader2 className="h-4 w-4 animate-spin mr-2 inline" />
                                  Đang tải...
                                </SelectItem>
                              ) : (
                                <>
                                  {/* Current assigned person - Luôn hiển thị nếu có */}
                                  {ps.doctorId && (
                                    <SelectItem value={`doctor-${ps.doctorId}`}>
                                      <Stethoscope className="h-4 w-4 inline mr-2" /> {ps.doctor?.auth?.name || 'Bác sĩ hiện tại'}
                                    </SelectItem>
                                  )}
                                  {ps.technicianId && (
                                    <SelectItem value={`technician-${ps.technicianId}`}>
                                      <Wrench className="h-4 w-4 inline mr-2" /> {ps.technician?.auth?.name || 'Kỹ thuật viên hiện tại'}
                                    </SelectItem>
                                  )}
                                  
                                  {/* Available doctors */}
                                  {doctors.filter(d => d.type === 'doctor').map(doctor => {
                                    // Tránh trùng với người đang thực hiện
                                    if (ps.doctorId === doctor.doctorId) return null;
                                    return (
                                      <SelectItem key={`doctor-${doctor.doctorId}`} value={`doctor-${doctor.doctorId}`}>
                                        👨‍⚕️ {doctor.name} {doctor.boothCode && `(${doctor.boothCode})`}
                                      </SelectItem>
                                    );
                                  })}
                                  
                                  {/* Available technicians */}
                                  {doctors.filter(d => d.type === 'technician').map(technician => {
                                    // Tránh trùng với người đang thực hiện
                                    if (ps.technicianId === technician.technicianId) return null;
                                    return (
                                      <SelectItem key={`technician-${technician.technicianId}`} value={`technician-${technician.technicianId}`}>
                                        🔧 {technician.name} {technician.boothCode && `(${technician.boothCode})`}
                                      </SelectItem>
                                    );
                                  })}
                                  
                                  {/* Hiển thị thông báo nếu không có available doctors và không có người đang thực hiện */}
                                  {doctors.length === 0 && !ps.doctorId && !ps.technicianId && (
                                    <SelectItem value="none" disabled>
                                      Không có người thực hiện khả dụng
                                    </SelectItem>
                                  )}
                                </>
                              )}
                            </SelectContent>
                          </Select>
                          {!isCompleted && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                if (ps.serviceId) {
                                  handleLoadDoctors(ps.serviceId, ps.id);
                                }
                              }}
                              disabled={isLoadingDoctors}
                            >
                              <RefreshCw className={`h-4 w-4 ${isLoadingDoctors ? 'animate-spin' : ''}`} />
                            </Button>
                          )}
                        </div>
                        {isCompleted && (
                          <p className="text-xs text-gray-500">Dịch vụ đã hoàn thành, không thể thay đổi người thực hiện</p>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-gray-500">Không có dịch vụ nào</p>
        )}
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-2 pt-4 border-t">
        <Button
          variant="outline"
          onClick={() => {
            setPrescriptionStatus(prescription.status || 'NOT_STARTED');
            const updates: Record<string, { status?: string; doctorId?: string }> = {};
            prescription.services?.forEach((ps: { id: string; status?: string; doctorId?: string | null; technicianId?: string | null }) => {
              updates[ps.id] = {
                status: ps.status,
                doctorId: ps.doctorId || undefined,
              };
            });
            setServiceUpdates(updates);
          }}
          disabled={updating}
        >
          Đặt lại
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={updating}
        >
          {updating ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Đang cập nhật...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Lưu thay đổi
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

export default function ReceptionCreatePrescriptionPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải...</p>
        </div>
      </div>
    }>
      <ReceptionCreatePrescriptionPageContent />
    </Suspense>
  );
}
