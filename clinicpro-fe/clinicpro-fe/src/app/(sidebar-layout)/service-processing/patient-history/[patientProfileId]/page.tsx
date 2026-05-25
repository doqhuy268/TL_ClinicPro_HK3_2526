'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter, usePathname, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  User, 
  FileText, 
  History, 
  Stethoscope,
  Eye,
  ExternalLink,
  Loader2,
  Search,
  Filter,
  X,
  ChevronLeft,
  Link2,
  QrCode,
  CameraOff,
  Image as ImageIcon,
  File,
  Plus
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import api from '@/lib/config';
import { Html5Qrcode } from 'html5-qrcode';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PatientProfileCard } from '@/components/patient/PatientProfileCard';
import { medicalRecordService } from '@/lib/services/medical-record.service';
import { patientProfileService } from '@/lib/services/patient-profile.service';
import { MedicalRecord, Template } from '@/lib/types/medical-record';
import { PatientProfile } from '@/lib/api';
import { toast } from 'sonner';
import { useMemo } from 'react';
import { FilePreviewDialog } from '@/components/common/FilePreviewDialog';

// Service History Types
interface Specialty {
  id: string;
  name: string;
}

interface ServiceWithSpecialty {
  id: string;
  serviceCode: string;
  name: string;
  price: number;
  description: string;
  timePerPatient: number;
  specialty?: Specialty;
}

interface DoctorInfo {
  id: string;
  auth?: {
    name: string;
  };
}

interface TechnicianInfo {
  id: string;
  auth?: {
    name: string;
  };
}

interface PrescriptionInfo {
  id: string;
  prescriptionCode: string;
}

interface ServiceHistoryItem {
  id: string;
  service?: ServiceWithSpecialty;
  startedAt?: string | null;
  completedAt?: string | null;
  note?: string | null;
  results?: string[];
  doctor?: DoctorInfo;
  technician?: TechnicianInfo;
  prescription?: PrescriptionInfo;
}

// Filter option types (extracted from service history)
interface FilterOption {
  id: string;
  name: string;
}

export default function PatientHistoryPage() {
  const params = useParams();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const patientProfileId = params.patientProfileId as string;
  const prescriptionCodeFromQuery = searchParams.get('prescriptionCode');
  const fromServiceProcessing = searchParams.get('from') === 'service-processing';

  const [patientProfile, setPatientProfile] = useState<PatientProfile | null>(null);
  const [medicalRecords, setMedicalRecords] = useState<MedicalRecord[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [isLoadingRecords, setIsLoadingRecords] = useState(true);
  const [activeTab, setActiveTab] = useState('profile');
  
  // Filter states for medical records
  const [searchTerm, setSearchTerm] = useState('');
  const [specialtyFilter, setSpecialtyFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [timeFilter, setTimeFilter] = useState<string>('all');

  // Service history states
  const [serviceHistory, setServiceHistory] = useState<ServiceHistoryItem[]>([]);
  const [isLoadingServiceHistory, setIsLoadingServiceHistory] = useState(false);
  const [serviceHistoryFilters, setServiceHistoryFilters] = useState({
    specialtyId: '',
    doctorId: '',
    technicianId: '',
  });
  const [serviceHistoryPagination, setServiceHistoryPagination] = useState({
    total: 0,
    limit: 20,
    offset: 0,
    hasMore: false,
  });
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [doctors, setDoctors] = useState<FilterOption[]>([]);
  const [technicians, setTechnicians] = useState<FilterOption[]>([]);

  // File preview states
  const [previewFileUrl, setPreviewFileUrl] = useState<string | null>(null);
  const [previewFileName, setPreviewFileName] = useState<string>('');
  const [isPreviewDialogOpen, setIsPreviewDialogOpen] = useState(false);
  
  // Link prescription states
  const [selectedRecordForLink, setSelectedRecordForLink] = useState<string | null>(null);
  const [isLinkPrescriptionDialogOpen, setIsLinkPrescriptionDialogOpen] = useState(false);
  const [prescriptionCode, setPrescriptionCode] = useState('');
  const [prescriptionInfo, setPrescriptionInfo] = useState<{ medicalRecordId?: string | null } | null>(null);
  
  // Sync prescriptionCode from query params and fetch prescription info
  useEffect(() => {
    if (prescriptionCodeFromQuery) {
      setPrescriptionCode(prescriptionCodeFromQuery);
      // Fetch prescription info to check if already linked
      api.get(`/prescriptions/${prescriptionCodeFromQuery}`)
        .then((response) => {
          setPrescriptionInfo(response.data);
        })
        .catch((error) => {
          console.error('Error fetching prescription info:', error);
          setPrescriptionInfo(null);
        });
    } else {
      setPrescriptionInfo(null);
    }
  }, [prescriptionCodeFromQuery]);
  const [isLinking, setIsLinking] = useState(false);
  
  // QR scanner states for linking prescription
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

  useEffect(() => {
    if (patientProfileId) {
      loadPatientData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patientProfileId]);

  useEffect(() => {
    if (activeTab === 'service-history' && patientProfileId) {
      // Reset pagination when filters change
      setServiceHistoryPagination({
        total: 0,
        limit: 20,
        offset: 0,
        hasMore: false,
      });
      loadServiceHistory();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, patientProfileId, serviceHistoryFilters]);

  const loadPatientData = async () => {
    setIsLoadingProfile(true);
    setIsLoadingRecords(true);

    try {
      // Load patient profile
      const profile = await patientProfileService.getById(patientProfileId);
      setPatientProfile(profile as unknown as PatientProfile);
    } catch (error) {
      console.error('Error loading patient profile:', error);
      toast.error('Không thể tải thông tin bệnh nhân');
    } finally {
      setIsLoadingProfile(false);
    }

    try {
      // Load templates
      const templatesData = await medicalRecordService.getTemplates();
      setTemplates(templatesData);
      
      // Load medical records
      const records = await medicalRecordService.getByPatientProfile(patientProfileId);
      setMedicalRecords(records);
      
      // Reload prescription info if prescriptionCodeFromQuery exists
      if (prescriptionCodeFromQuery) {
        try {
          const prescriptionResponse = await api.get(`/prescriptions/${prescriptionCodeFromQuery}`);
          setPrescriptionInfo(prescriptionResponse.data);
        } catch (error) {
          console.error('Error reloading prescription info:', error);
        }
      }
    } catch (error) {
      console.error('Error loading medical records:', error);
      toast.error('Không thể tải lịch sử bệnh án');
    } finally {
      setIsLoadingRecords(false);
    }
  };

  const loadServiceHistory = async () => {
    setIsLoadingServiceHistory(true);
    try {
      const params = new URLSearchParams();
      if (serviceHistoryFilters.specialtyId) {
        params.append('specialtyId', serviceHistoryFilters.specialtyId);
      }
      if (serviceHistoryFilters.doctorId) {
        params.append('doctorId', serviceHistoryFilters.doctorId);
      }
      if (serviceHistoryFilters.technicianId) {
        params.append('technicianId', serviceHistoryFilters.technicianId);
      }
      const currentLimit = serviceHistoryPagination.limit || 20;
      const currentOffset = serviceHistoryPagination.offset || 0;
      params.append('limit', currentLimit.toString());
      params.append('offset', currentOffset.toString());

      const response = await api.get(
        `/services/patient-history/${patientProfileId}?${params.toString()}`
      );

      if (response.data?.success && response.data?.data) {
        setServiceHistory(response.data.data.services || []);
        setServiceHistoryPagination(response.data.data.pagination || {
          total: 0,
          limit: 20,
          offset: 0,
          hasMore: false,
        });

        // Extract unique specialties, doctors, technicians from the results
        const specialtySet = new Set<string>();
        const doctorSet = new Set<string>();
        const technicianSet = new Set<string>();

        response.data.data.services?.forEach((service: ServiceHistoryItem) => {
          if (service.service?.specialty) {
            specialtySet.add(JSON.stringify({
              id: service.service.specialty.id,
              name: service.service.specialty.name,
            }));
          }
          if (service.doctor) {
            doctorSet.add(JSON.stringify({
              id: service.doctor.id,
              name: service.doctor.auth?.name || '',
            }));
          }
          if (service.technician) {
            technicianSet.add(JSON.stringify({
              id: service.technician.id,
              name: service.technician.auth?.name || '',
            }));
          }
        });

        setSpecialties(Array.from(specialtySet).map(s => JSON.parse(s)));
        setDoctors(Array.from(doctorSet).map(d => JSON.parse(d)));
        setTechnicians(Array.from(technicianSet).map(t => JSON.parse(t)));
      }
    } catch (error) {
      console.error('Error loading service history:', error);
      toast.error('Không thể tải lịch sử khám bệnh');
    } finally {
      setIsLoadingServiceHistory(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-green-100 text-green-800';
      case 'DRAFT':
        return 'bg-yellow-100 text-yellow-800';
      case 'IN_PROGRESS':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'Hoàn thành';
      case 'DRAFT':
        return 'Nháp';
      case 'IN_PROGRESS':
        return 'Đang điều trị';
      default:
        return status;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getDiagnosis = (record: MedicalRecord): string | null => {
    // Chẩn đoán có thể ở trong content.diagnosis
    if (record.content && typeof record.content === 'object') {
      const diagnosis = record.content.diagnosis;
      if (diagnosis && typeof diagnosis === 'string' && diagnosis.trim()) {
        return diagnosis.trim();
      }
    }
    return null;
  };

  // Get unique specialties from templates (for medical records filter)
  const medicalRecordSpecialties = useMemo(() => {
    const specialtySet = new Set<string>();
    medicalRecords.forEach(record => {
      if (record.templateId) {
        const template = templates.find(t => t.id === record.templateId);
        // Get specialty name from specialty object or fallback to specialtyName
        const specialtyName = template?.specialty?.name || template?.specialtyName || '';
        if (specialtyName) {
          specialtySet.add(specialtyName);
        }
      }
    });
    return Array.from(specialtySet).sort();
  }, [medicalRecords, templates]);

  // Filter records based on search and filters
  const filteredRecords = useMemo(() => {
    return medicalRecords.filter(record => {
      // Search filter - search in diagnosis, template name, doctor name
      const diagnosis = getDiagnosis(record) || '';
      const template = templates.find(t => t.id === record.templateId);
      const templateName = template?.name || '';
      const doctorName = (record as unknown as { doctor?: { name?: string } }).doctor?.name || '';
      const recordCode = record.code || '';
      
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = searchTerm === '' || 
        diagnosis.toLowerCase().includes(searchLower) ||
        templateName.toLowerCase().includes(searchLower) ||
        doctorName.toLowerCase().includes(searchLower) ||
        recordCode.toLowerCase().includes(searchLower);

      // Status filter
      const matchesStatus = statusFilter === 'all' || record.status === statusFilter;

      // Specialty filter - get specialty name from specialty object or fallback to specialtyName
      const recordSpecialty = template?.specialty?.name || template?.specialtyName || '';
      const matchesSpecialty = specialtyFilter === 'all' || recordSpecialty === specialtyFilter;

      // Time filter
      let matchesTime = true;
      if (timeFilter !== 'all') {
        const recordDate = new Date(record.createdAt);
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        
        switch (timeFilter) {
          case 'today':
            matchesTime = recordDate >= today;
            break;
          case 'week':
            const weekAgo = new Date(today);
            weekAgo.setDate(weekAgo.getDate() - 7);
            matchesTime = recordDate >= weekAgo;
            break;
          case 'month':
            const monthAgo = new Date(today);
            monthAgo.setMonth(monthAgo.getMonth() - 1);
            matchesTime = recordDate >= monthAgo;
            break;
          case 'year':
            const yearAgo = new Date(today);
            yearAgo.setFullYear(yearAgo.getFullYear() - 1);
            matchesTime = recordDate >= yearAgo;
            break;
          default:
            matchesTime = true;
        }
      }

      return matchesSearch && matchesStatus && matchesSpecialty && matchesTime;
    });
  }, [medicalRecords, searchTerm, statusFilter, specialtyFilter, timeFilter, templates]);

  const clearFilters = () => {
    setSearchTerm('');
    setSpecialtyFilter('all');
    setStatusFilter('all');
    setTimeFilter('all');
  };

  const hasActiveFilters = searchTerm !== '' || specialtyFilter !== 'all' || statusFilter !== 'all' || timeFilter !== 'all';

  // Link prescription handler
  const performLinkPrescription = async (codeToLink: string, recordId: string) => {
    if (!codeToLink || !recordId) {
      toast.error('Vui lòng nhập mã phiếu chỉ định');
      return;
    }

    setIsLinking(true);
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const response = await api.patch<any>(`/medical-records/${recordId}/link-prescription`, {
        prescriptionCode: codeToLink,
      });

      if (response.data) {
        toast.success('Đã liên kết phiếu chỉ định thành công');
        setIsLinkPrescriptionDialogOpen(false);
        setPrescriptionCode('');
        setSelectedRecordForLink(null);
        // Update prescription info
        if (prescriptionCodeFromQuery) {
          const updatedPrescription = await api.get(`/prescriptions/${prescriptionCodeFromQuery}`);
          setPrescriptionInfo(updatedPrescription.data);
        }
        // Reload medical records first to get updated data
        await loadPatientData();
        // Remove prescriptionCode from URL after reload, but keep 'from' parameter
        const newSearchParams = new URLSearchParams(searchParams.toString());
        newSearchParams.delete('prescriptionCode');
        const newQueryString = newSearchParams.toString();
        router.replace(newQueryString ? `${pathname}?${newQueryString}` : pathname);
        // Clear prescription info after removing from URL
        if (!newSearchParams.has('prescriptionCode')) {
          setPrescriptionInfo(null);
        }
      }
    } catch (error: unknown) {
      console.error('Error linking prescription:', error);
      let errorMessage = 'Có lỗi xảy ra khi liên kết phiếu chỉ định';
      if (error && typeof error === 'object') {
        // Check for axios error structure
        if ('response' in error && error.response && typeof error.response === 'object' && 'data' in error.response) {
          const axiosError = error as { response: { data?: { message?: string } } };
          errorMessage = axiosError.response.data?.message || errorMessage;
        } else if ('message' in error && typeof error.message === 'string') {
          errorMessage = error.message;
        }
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }
      toast.error(errorMessage);
    } finally {
      setIsLinking(false);
    }
  };

  // Link prescription handler for dialog
  const handleLinkPrescription = async () => {
    const code = prescriptionCode.trim();
    const recordId = selectedRecordForLink;
    
    if (!code || !recordId) {
      toast.error('Vui lòng nhập mã phiếu chỉ định');
      return;
    }

    await performLinkPrescription(code, recordId);
  };

  // Handle link button click - auto-link if prescriptionCode is available
  const handleLinkButtonClick = (recordId: string) => {
    setSelectedRecordForLink(recordId);
    
    // If prescriptionCode is available from query params, auto-link
    if (prescriptionCodeFromQuery) {
      performLinkPrescription(prescriptionCodeFromQuery, recordId);
    } else {
      // Otherwise, open dialog for manual input
      setIsLinkPrescriptionDialogOpen(true);
    }
  };

  // QR Scanner logic for linking prescription
  const stopScanner = React.useCallback(async () => {
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
    
    // Clear video element srcObject
    const video = videoRef.current;
    if (video) {
      try {
        video.onerror = null;
        video.pause();
        video.srcObject = null;
        video.load();
      } catch (e: unknown) {
        const error = e as { name?: string; message?: string };
        if (error?.name !== 'AbortError' && !error?.message?.includes('aborted')) {
          console.warn('[QR] Error clearing video srcObject:', error);
        }
      }
    }
    console.log('[QR] Scanner stopped');
  }, []);

  const handleQrText = React.useCallback(async (text: string) => {
    const trimmed = (text || '').trim();
    const upper = trimmed.toUpperCase();
    if (!trimmed) return;
    console.log('[QR] Raw:', text);
    console.log('[QR] Normalized:', upper);
    setScanHint(`Đã phát hiện: ${upper.slice(0, 24)}${upper.length > 24 ? '...' : ''}`);
    
    // Handle PRESC (prescription code)
    if (upper.startsWith('PRESC')) {
      setPrescriptionCode(trimmed);
      setScanHint('Đã quét mã phiếu chỉ định');
      toast.success(`Đã quét mã phiếu chỉ định: ${trimmed}`);
      setTimeout(() => {
        setIsQrScannerOpen(false);
        stopScanner();
      }, 500);
    } else {
      toast.info(`Đã đọc QR: ${upper.slice(0, 64)}${upper.length > 64 ? '...' : ''} (không phải mã phiếu chỉ định)`);
      setScanHint('Đã đọc QR (không phải mã PRESC)');
    }
  }, [stopScanner]);

  const startScanner = React.useCallback(async () => {
    setScanning(true);
    scanningRef.current = true;
    setScanHint('Đang khởi động camera...');
    
    try {
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
      
      if (!scanningRef.current) {
        stream.getTracks().forEach(t => t.stop());
        return;
      }
      
      mediaStreamRef.current = stream;
      const video = videoRef.current;
      if (!video) {
        stream.getTracks().forEach(t => t.stop());
        mediaStreamRef.current = null;
        return;
      }
      
      if (!scanningRef.current) {
        stream.getTracks().forEach(t => t.stop());
        mediaStreamRef.current = null;
        return;
      }

      const handleVideoError = (e: Event) => {
        const error = e as ErrorEvent;
        if (error.error?.name === 'AbortError' || error.message?.includes('aborted')) {
          console.log('[QR] Video error (suppressed):', error.error?.name || error.message);
          return;
        }
        console.warn('[QR] Video error:', error);
      };
      video.addEventListener('error', handleVideoError, { once: true });

      try {
        video.srcObject = stream;
        
        if (!scanningRef.current) {
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
        } catch (playError: unknown) {
          const error = playError as { name?: string; message?: string };
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
        if (error.name !== 'AbortError' && error.name !== 'NotAllowedError') {
          throw playError;
        }
        return;
      }

      if (video.readyState < 2) {
        await new Promise<void>((resolve, reject) => {
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
                if (error?.name !== 'AbortError' && !error?.message?.includes('aborted')) {
                  console.warn('[QR] Error cleaning up video:', error);
                }
              }
            }
            return;
          }
          throw err;
        });
      }
      
      if (!scanningRef.current || !videoRef.current) {
        stream.getTracks().forEach(t => t.stop());
        mediaStreamRef.current = null;
        return;
      }
      
      setScanHint('Camera đã sẵn sàng. Đưa mã QR vào khung...');

      // Try BarcodeDetector first
      interface BarcodeDetectorInterface {
        detect(image: HTMLVideoElement): Promise<Array<{ rawValue?: string; rawValueText?: string; raw?: string }>>;
      }
      
      const BD = (window as { BarcodeDetector?: new (options?: { formats?: string[] }) => BarcodeDetectorInterface }).BarcodeDetector;
      if (BD) {
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
          const tick = async () => {
            if (!scanningRef.current || !videoRef.current) {
              return;
            }
            
            try {
              const detections = await detector!.detect(videoRef.current);
              if (detections && detections.length > 0) {
                const raw = (detections[0]?.rawValue ?? detections[0]?.rawValueText ?? detections[0]?.raw ?? '').toString();
                if (raw) {
                  const norm = raw.trim();
                  const now = Date.now();
                  if (lastScanRef.current === norm && now - lastScanTsRef.current < 1500) {
                    // skip duplicate
                  } else {
                    lastScanRef.current = norm;
                    lastScanTsRef.current = now;
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
      try {
        setScannerSupported(true);
        setUsingHtml5Qrcode(true);
        setScanHint('Đang khởi động bộ quét QR...');
        
        if (mediaStreamRef.current) {
          mediaStreamRef.current.getTracks().forEach(t => t.stop());
          mediaStreamRef.current = null;
        }
        if (videoRef.current) {
          videoRef.current.srcObject = null;
        }
        
        const html5QrCode = new Html5Qrcode('qr-reader-link-history');
        html5QrCodeRef.current = html5QrCode;
        
        const qrCodeSuccessCallback = async (decodedText: string) => {
          const norm = decodedText.trim();
          const now = Date.now();
          
          if (lastScanRef.current === norm && now - lastScanTsRef.current < 1500) {
            return;
          }
          
          lastScanRef.current = norm;
          lastScanTsRef.current = now;
          await handleQrText(norm);
        };
        
        const qrCodeErrorCallback = (errorMessage: string) => {
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
  React.useEffect(() => {
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const error = event.reason;
      if (error?.name === 'AbortError' || error?.message?.includes('aborted') || 
          error?.message?.includes('fetching process') || error?.message?.includes('media resource')) {
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

  return (
    <div className="container mx-auto px-8 py-6 space-y-6 bg-white">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              // If user came from service-processing page, go back to it
              // Otherwise use router.back()
              if (fromServiceProcessing) {
                router.push('/service-processing');
              } else {
                router.back();
              }
            }}
            className="flex items-center gap-2"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="h-5 w-px bg-gray-300" />
          <div className="flex items-center gap-2">
            <History className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-semibold">
              Lịch sử khám bệnh
              {patientProfile && (
                <span className="text-lg font-normal text-gray-600 ml-2">
                  - {patientProfile.name}
                </span>
              )}
            </h1>
          </div>
        </div>
      </div>

      {/* Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 max-w-2xl">
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Thông tin bệnh nhân
          </TabsTrigger>
          <TabsTrigger value="records" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Bệnh án
          </TabsTrigger>
          <TabsTrigger value="service-history" className="flex items-center gap-2">
            <History className="h-4 w-4" />
            Lịch sử khám bệnh 
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="mt-6 space-y-4">
          {isLoadingProfile ? (
            <Card>
              <CardContent className="py-12">
                <div className="flex items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <span className="ml-2 text-gray-600">Đang tải thông tin bệnh nhân...</span>
                </div>
              </CardContent>
            </Card>
          ) : patientProfile ? (
            <PatientProfileCard 
              patientProfileId={patientProfileId}
              showActions={false}
            />
          ) : (
            <Card>
              <CardContent className="py-12 text-center text-gray-500">
                Không tìm thấy thông tin bệnh nhân
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="records" className="mt-6 space-y-4">
          {/* Create Medical Record Button */}
          <div className="flex justify-end">
            <Button
              onClick={() => {
                router.push(`/medical-records/create?patientId=${patientProfileId}`);
              }}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Tạo bệnh án
            </Button>
          </div>

          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Filter className="h-5 w-5" />
                Tìm kiếm & Lọc
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
                {/* Search */}
                <div className="space-y-2 w-full">
                  <label className="text-sm font-medium block">Tìm kiếm</label>
                  <div className="relative w-full">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Tìm theo chẩn đoán, khoa, bác sĩ..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-9 w-full"
                    />
                  </div>
                </div>

                {/* Specialty Filter */}
                <div className="space-y-2 w-full">
                  <label className="text-sm font-medium block">Khoa</label>
                  <Select value={specialtyFilter} onValueChange={setSpecialtyFilter}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Tất cả khoa" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tất cả khoa</SelectItem>
                      {medicalRecordSpecialties.map((specialty) => (
                        <SelectItem key={specialty} value={specialty}>
                          {specialty}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Status Filter */}
                <div className="space-y-2 w-full">
                  <label className="text-sm font-medium block">Trạng thái</label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Tất cả trạng thái" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tất cả trạng thái</SelectItem>
                      <SelectItem value="DRAFT">Nháp</SelectItem>
                      <SelectItem value="IN_PROGRESS">Đang điều trị</SelectItem>
                      <SelectItem value="COMPLETED">Hoàn thành</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Time Filter */}
                <div className="space-y-2 w-full">
                  <label className="text-sm font-medium block">Thời gian</label>
                  <Select value={timeFilter} onValueChange={setTimeFilter}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Tất cả thời gian" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tất cả thời gian</SelectItem>
                      <SelectItem value="today">Hôm nay</SelectItem>
                      <SelectItem value="week">7 ngày qua</SelectItem>
                      <SelectItem value="month">30 ngày qua</SelectItem>
                      <SelectItem value="year">Năm nay</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Clear Filters Button */}
              {hasActiveFilters && (
                <div className="mt-4 flex justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={clearFilters}
                    className="flex items-center gap-2"
                  >
                    <X className="h-4 w-4" />
                    Xóa bộ lọc
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {isLoadingRecords ? (
            <Card>
              <CardContent className="py-12">
                <div className="flex items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <span className="ml-2 text-gray-600">Đang tải lịch sử bệnh án...</span>
                </div>
              </CardContent>
            </Card>
          ) : medicalRecords.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <FileText className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p className="text-gray-500">Chưa có bệnh án nào</p>
              </CardContent>
            </Card>
          ) : filteredRecords.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <FileText className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p className="text-gray-500">Không tìm thấy bệnh án phù hợp với bộ lọc</p>
                {hasActiveFilters && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={clearFilters}
                    className="mt-4 flex items-center gap-2 mx-auto"
                  >
                    <X className="h-4 w-4" />
                    Xóa bộ lọc
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredRecords.map((record) => (
                <Card 
                  key={record.id} 
                  className="hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => {
                    const returnToUrl = fromServiceProcessing 
                      ? `${pathname}?from=service-processing`
                      : pathname;
                    router.push(`/medical-records/${record.id}?returnTo=${encodeURIComponent(returnToUrl)}`);
                  }}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="flex items-center gap-2 text-lg">
                            Bệnh án:
                          <Stethoscope className="h-5 w-5 text-primary" />
                          {(() => {
                            const diagnosis = getDiagnosis(record);
                            if (diagnosis) {
                              return diagnosis;
                            }
                            return (
                              <span className="italic text-red-600">Chưa có chẩn đoán</span>
                            );
                          })()}
                        </CardTitle>
                        <div className="mt-2 flex items-center gap-2 flex-wrap">
                          <Badge className={getStatusColor(record.status)}>
                            {getStatusText(record.status)}
                          </Badge>
                          <span className="text-sm text-gray-500">
                            {formatDate(record.createdAt)}
                          </span>
                          {record.code && (
                            <span className="text-xs text-gray-400">
                              #{record.code}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {(() => {
                          // Check if prescription is already linked to another medical record
                          const isPrescriptionLinkedToOther = prescriptionInfo?.medicalRecordId && 
                            prescriptionInfo.medicalRecordId !== record.id;
                          // Check if prescription is already linked to this medical record
                          const isPrescriptionLinkedToThis = prescriptionInfo?.medicalRecordId === record.id;
                          
                          if (isPrescriptionLinkedToOther) {
                            // Prescription already linked to another record - don't show button
                            return null;
                          }
                          
                          if (isPrescriptionLinkedToThis) {
                            // Already linked to this record - show linked status
                            return (
                              <Badge variant="secondary" className="flex items-center gap-1">
                                <Link2 className="h-3 w-3" />
                                Đã liên kết
                              </Badge>
                            );
                          }
                          
                          // Show link button
                          return (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleLinkButtonClick(record.id);
                              }}
                              className="flex items-center gap-1"
                              disabled={isLinking && selectedRecordForLink === record.id}
                            >
                              {isLinking && selectedRecordForLink === record.id ? (
                                <>
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                  Đang liên kết...
                                </>
                              ) : (
                                <>
                                  <Link2 className="h-4 w-4" />
                                  Liên kết phiếu chỉ định
                                </>
                              )}
                            </Button>
                          );
                        })()}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            const returnToUrl = fromServiceProcessing 
                              ? `${pathname}?from=service-processing`
                              : pathname;
                            router.push(`/medical-records/${record.id}?returnTo=${encodeURIComponent(returnToUrl)}`);
                          }}
                          className="flex items-center gap-1"
                        >
                          <Eye className="h-4 w-4" />
                          Xem chi tiết
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            const returnToUrl = fromServiceProcessing 
                              ? `${pathname}?from=service-processing`
                              : pathname;
                            router.push(`/medical-records/${record.id}/edit?returnTo=${encodeURIComponent(returnToUrl)}`);
                          }}
                          className="flex items-center gap-1"
                        >
                          <ExternalLink className="h-4 w-4" />
                          Chỉnh sửa
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {(() => {
                      const template = templates.find(t => t.id === record.templateId);
                      const specialtyName = template?.specialty?.name || template?.specialtyName || '';
                      return (
                        <>
                          {specialtyName && (
                            <div className="text-sm text-gray-600 mb-2">
                              <span className="font-medium">Khoa:</span> {specialtyName}
                            </div>
                          )}
                          {template && (
                            <div className="text-sm text-gray-600 mb-2">
                              <span className="font-medium">Template:</span> {template.name}
                            </div>
                          )}
                        </>
                      );
                    })()}
                    {(record as unknown as { doctor?: { name?: string } }).doctor && (
                      <div className="text-sm text-gray-600">
                        <span className="font-medium">Bác sĩ:</span> {(record as unknown as { doctor: { name: string } }).doctor.name}
                      </div>
                    )}
                    {record.code && (
                      <div className="text-sm text-gray-600">
                        <span className="font-medium">Mã bệnh án:</span> {record.code}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="service-history" className="mt-6 space-y-4">
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Filter className="h-5 w-5" />
                Tìm kiếm & Lọc
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
                {/* Specialty Filter */}
                <div className="space-y-2 w-full">
                  <label className="text-sm font-medium block">Khoa</label>
                  <Select
                    value={serviceHistoryFilters.specialtyId || 'all'}
                    onValueChange={(value) =>
                      setServiceHistoryFilters({
                        ...serviceHistoryFilters,
                        specialtyId: value === 'all' ? '' : value,
                      })
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Tất cả khoa" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tất cả khoa</SelectItem>
                      {specialties.map((specialty) => (
                        <SelectItem key={specialty.id} value={specialty.id}>
                          {specialty.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Doctor Filter */}
                <div className="space-y-2 w-full">
                  <label className="text-sm font-medium block">Bác sĩ</label>
                  <Select
                    value={serviceHistoryFilters.doctorId || 'all'}
                    onValueChange={(value) =>
                      setServiceHistoryFilters({
                        ...serviceHistoryFilters,
                        doctorId: value === 'all' ? '' : value,
                      })
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Tất cả bác sĩ" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tất cả bác sĩ</SelectItem>
                      {doctors.map((doctor) => (
                        <SelectItem key={doctor.id} value={doctor.id}>
                          {doctor.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Technician Filter */}
                <div className="space-y-2 w-full">
                  <label className="text-sm font-medium block">Kỹ thuật viên</label>
                  <Select
                    value={serviceHistoryFilters.technicianId || 'all'}
                    onValueChange={(value) =>
                      setServiceHistoryFilters({
                        ...serviceHistoryFilters,
                        technicianId: value === 'all' ? '' : value,
                      })
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Tất cả kỹ thuật viên" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tất cả kỹ thuật viên</SelectItem>
                      {technicians.map((technician) => (
                        <SelectItem key={technician.id} value={technician.id}>
                          {technician.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Clear Filters Button */}
              {(serviceHistoryFilters.specialtyId ||
                serviceHistoryFilters.doctorId ||
                serviceHistoryFilters.technicianId) && (
                <div className="mt-4 flex justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setServiceHistoryFilters({
                        specialtyId: '',
                        doctorId: '',
                        technicianId: '',
                      })
                    }
                    className="flex items-center gap-2"
                  >
                    <X className="h-4 w-4" />
                    Xóa bộ lọc
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {isLoadingServiceHistory ? (
            <Card>
              <CardContent className="py-12">
                <div className="flex items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <span className="ml-2 text-gray-600">Đang tải lịch sử khám bệnh...</span>
                </div>
              </CardContent>
            </Card>
          ) : serviceHistory.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <History className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p className="text-gray-500">Chưa có lịch sử khám bệnh</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {serviceHistory.map((service) => (
                <Card key={service.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="flex items-center gap-2 text-lg">
                          <Stethoscope className="h-5 w-5 text-primary" />
                          {service.service?.name || 'Dịch vụ không xác định'}
                        </CardTitle>
                        <div className="mt-2 flex items-center gap-2 flex-wrap">
                          <Badge className="bg-green-100 text-green-800">
                            Hoàn thành
                          </Badge>
                          {service.startedAt && (
                            <span className="text-sm text-gray-500">
                              {formatDate(service.startedAt)}
                            </span>
                          )}
                          {service.completedAt && (
                            <span className="text-sm text-gray-500">
                              - {formatDate(service.completedAt)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {service.service?.specialty && (
                      <div className="text-sm text-gray-600 mb-2">
                        <span className="font-medium">Khoa:</span>{' '}
                        {service.service.specialty.name}
                      </div>
                    )}
                    {service.doctor && (
                      <div className="text-sm text-gray-600 mb-2">
                        <span className="font-medium">Bác sĩ:</span>{' '}
                        {service.doctor.auth?.name || 'Không xác định'}
                      </div>
                    )}
                    {service.technician && (
                      <div className="text-sm text-gray-600 mb-2">
                        <span className="font-medium">Kỹ thuật viên:</span>{' '}
                        {service.technician.auth?.name || 'Không xác định'}
                      </div>
                    )}
                    {service.prescription && (
                      <div className="text-sm text-gray-600 mb-2">
                        <span className="font-medium">Mã phiếu chỉ định:</span>{' '}
                        {service.prescription.prescriptionCode}
                      </div>
                    )}
                    {service.note && (
                      <div className="text-sm text-gray-600">
                        <span className="font-medium">Ghi chú:</span> {service.note}
                      </div>
                    )}
                    {service.results && service.results.length > 0 && (
                      <div className="mt-3">
                        <p className="text-sm font-medium text-gray-700 mb-2">Kết quả ({service.results.length}):</p>
                        <div className="flex flex-wrap gap-2">
                          {service.results.map((result: string, idx: number) => {
                            const fileName = result.split('/').pop() || `Kết quả ${idx + 1}`;
                            const extension = fileName.split('.').pop()?.toLowerCase() || '';
                            const getFileIcon = () => {
                              if (['pdf'].includes(extension)) {
                                return <FileText className="h-5 w-5 text-red-500" />;
                              }
                              if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg'].includes(extension)) {
                                return <ImageIcon className="h-5 w-5 text-green-500" />;
                              }
                              if (['doc', 'docx'].includes(extension)) {
                                return <FileText className="h-5 w-5 text-blue-500" />;
                              }
                              if (['xls', 'xlsx'].includes(extension)) {
                                return <FileText className="h-5 w-5 text-green-600" />;
                              }
                              return <File className="h-5 w-5 text-gray-500" />;
                            };
                            return (
                              <button
                                key={idx}
                                onClick={() => {
                                  setPreviewFileUrl(result);
                                  setPreviewFileName(fileName);
                                  setIsPreviewDialogOpen(true);
                                }}
                                className="flex items-center gap-2 px-3 py-2 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors"
                                title={fileName}
                              >
                                {getFileIcon()}
                                <span className="text-sm text-gray-700 truncate max-w-[150px]">
                                  {fileName}
                                </span>
                                <Eye className="h-4 w-4 text-gray-400" />
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Link Prescription Dialog */}
      <Dialog open={isLinkPrescriptionDialogOpen} onOpenChange={(open) => {
        setIsLinkPrescriptionDialogOpen(open);
        if (!open) {
          setPrescriptionCode('');
          setSelectedRecordForLink(null);
          setIsQrScannerOpen(false);
        }
      }}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Link2 className="h-5 w-5" />
              Liên kết phiếu chỉ định
            </DialogTitle>
            <DialogDescription>
              Nhập mã phiếu chỉ định hoặc quét QR code để liên kết với bệnh án này
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Mã phiếu chỉ định</label>
              <div className="flex gap-2">
                <Input
                  placeholder="Nhập mã phiếu chỉ định (VD: PRESC2512051239282014)"
                  value={prescriptionCode}
                  onChange={(e) => setPrescriptionCode(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleLinkPrescription()}
                  className="flex-1"
                />
                <Button
                  variant="outline"
                  onClick={() => setIsQrScannerOpen(true)}
                  className="flex items-center gap-2"
                >
                  <QrCode className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setIsLinkPrescriptionDialogOpen(false);
                  setPrescriptionCode('');
                  setSelectedRecordForLink(null);
                  setIsQrScannerOpen(false);
                }}
              >
                Hủy
              </Button>
              <Button
                onClick={handleLinkPrescription}
                disabled={!prescriptionCode.trim() || isLinking}
              >
                {isLinking ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Đang liên kết...
                  </>
                ) : (
                  <>
                    <Link2 className="h-4 w-4 mr-2" />
                    Liên kết
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* QR Scanner Dialog */}
      <Dialog open={isQrScannerOpen} onOpenChange={(open) => {
        setIsQrScannerOpen(open);
        if (!open) {
          stopScanner();
        }
      }}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <QrCode className="h-5 w-5" />
              Quét mã QR phiếu chỉ định
            </DialogTitle>
            <DialogDescription>
              Đưa mã QR của phiếu chỉ định vào khung camera để quét tự động
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="relative bg-black rounded-lg overflow-hidden" style={{ minHeight: '300px' }}>
              {!usingHtml5Qrcode && (
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                  style={{ minHeight: '300px' }}
                />
              )}
              <div id="qr-reader-link-history" className={usingHtml5Qrcode ? '' : 'hidden'} style={{ minHeight: '300px' }} />
              {scanning && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                  <div className="text-center text-white">
                    {scannerSupported === false ? (
                      <>
                        <CameraOff className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">Không hỗ trợ quét QR trên thiết bị này</p>
                      </>
                    ) : (
                      <>
                        <Loader2 className="h-8 w-8 mx-auto mb-2 animate-spin" />
                        <p className="text-sm">{scanHint}</p>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setIsQrScannerOpen(false);
                  stopScanner();
                }}
              >
                <CameraOff className="h-4 w-4 mr-2" />
                Đóng
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* File Preview Dialog */}
      {previewFileUrl && (
        <FilePreviewDialog
          open={isPreviewDialogOpen}
          onOpenChange={setIsPreviewDialogOpen}
          fileUrl={previewFileUrl}
          fileName={previewFileName}
        />
      )}
    </div>
  );
}

