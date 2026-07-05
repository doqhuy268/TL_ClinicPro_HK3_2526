'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  ChevronLeft, 
  FileText,
  Stethoscope,
  ClipboardList,
  Brain,
  Image as ImageIcon,
  File,
} from 'lucide-react';
import { MedicalRecord, Template, MedicalRecordStatus, CreateMedicalRecordDto } from '@/lib/types/medical-record';
import { medicalRecordService } from '@/lib/services/medical-record.service';
import { toast } from 'sonner';
import { DynamicMedicalRecordForm } from '@/components/medical-records/DynamicMedicalRecordForm';
import api from '@/lib/config';
import { MedicalRecordPrescriptions } from '@/components/medical-records/MedicalRecordPrescriptions';
import { CreatePrescriptionDialog } from '@/components/service-processing/CreatePrescriptionDialog';
import { PrescriptionService as ServiceProcessingPrescriptionService } from '@/lib/types/service-processing';
import { Eye, Clock, CheckCircle, XCircle, AlertCircle, Link2, QrCode, Loader2, Camera, CameraOff } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Html5Qrcode } from 'html5-qrcode';
import { FilePreviewDialog } from '@/components/common/FilePreviewDialog';

export default function EditMedicalRecordPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const recordId = params.id as string;

  const [medicalRecord, setMedicalRecord] = useState<MedicalRecord | null>(null);
  const [template, setTemplate] = useState<Template | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [, setIsSaving] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<MedicalRecordStatus>(MedicalRecordStatus.DRAFT);
  const [isPredicting, setIsPredicting] = useState(false);
  const [predictions, setPredictions] = useState<Array<{ icd_code: string; probability: number; disease_name_en: string; disease_name_vi: string }>>([]);
  
  // Service Prescriptions states
  interface ServicePrescriptionService {
    id?: string;
    prescriptionId: string;
    serviceId: string;
    status: string;
    results: string[];
    order: number;
    note: string | null;
    service: {
      id: string;
      serviceCode: string;
      name: string;
      description: string;
    };
    // Danh sách các phiếu chỉ định con (issuedPrescriptions)
    issuedPrescriptions?: Array<{
      id: string;
      prescriptionCode: string;
      status: string;
      note: string | null;
      services: Array<{
        id?: string;
        prescriptionId: string;
        serviceId: string;
        status: string;
        results: string[];
        order: number;
        note: string | null;
        service: {
          id: string;
          serviceCode: string;
          name: string;
          description: string;
        };
      }>;
      patientProfile?: {
        id: string;
        name: string;
        dateOfBirth?: string;
        gender?: string;
      };
      doctor?: {
        id: string;
        name?: string;
      };
    }>;
  }

  interface ServicePrescription {
    id: string;
    prescriptionCode: string;
    doctorId: string;
    patientProfileId: string;
    note: string;
    status: string;
    medicalRecordId: string;
    services: ServicePrescriptionService[];
    patientProfile?: {
      id: string;
      name: string;
      dateOfBirth?: string;
      gender?: string;
    };
    doctor?: {
      id: string;
      name?: string;
    };
  }

  const [servicePrescriptions, setServicePrescriptions] = useState<ServicePrescription[]>([]);
  const [isLoadingServicePrescriptions, setIsLoadingServicePrescriptions] = useState(false);
  const [isPrescriptionDialogOpen, setIsPrescriptionDialogOpen] = useState(false);
  const [selectedPrescription, setSelectedPrescription] = useState<ServicePrescription | null>(null);
  const [createPrescriptionDialogOpen, setCreatePrescriptionDialogOpen] = useState(false);
  type ServiceWithPrescription = ServiceProcessingPrescriptionService & { 
    prescription?: { 
      id: string; 
      prescriptionCode: string; 
      status: string; 
      patientProfile: { 
        id: string; 
        name: string; 
        dateOfBirth: string; 
        gender: string 
      } 
    } 
  };
  const [selectedServiceForPrescription, setSelectedServiceForPrescription] = useState<ServiceWithPrescription | null>(null);
  
  // File preview states
  const [previewFileUrl, setPreviewFileUrl] = useState<string | null>(null);
  const [previewFileName, setPreviewFileName] = useState<string | null>(null);
  const [isPreviewDialogOpen, setIsPreviewDialogOpen] = useState(false);
  
  // Link prescription states
  const [isLinkPrescriptionDialogOpen, setIsLinkPrescriptionDialogOpen] = useState(false);
  const [prescriptionCode, setPrescriptionCode] = useState('');
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

  // Load service prescriptions
  const loadServicePrescriptions = React.useCallback(async () => {
    if (!recordId) return;
    setIsLoadingServicePrescriptions(true);
    try {
      const response = await fetch(`/api/prescriptions/medical-record/${recordId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setServicePrescriptions(Array.isArray(data) ? data : []);
      } else {
        const errorData = await response.json();
        console.error('Failed to load service prescriptions:', response.status, errorData);
        toast.error('Có lỗi xảy ra khi tải phiếu chỉ định dịch vụ');
      }
    } catch (error) {
      console.error('Error loading service prescriptions:', error);
      toast.error('Có lỗi xảy ra khi tải phiếu chỉ định dịch vụ');
    } finally {
      setIsLoadingServicePrescriptions(false);
    }
  }, [recordId]);

  // Load medical record and template
  useEffect(() => {
    const loadData = async () => {
      if (!recordId) return;

      try {
        setIsLoading(true);
        
        // Load medical record
        const record = await medicalRecordService.getById(recordId);
        setMedicalRecord(record);
        setSelectedStatus(record.status);

        // Load template
        const templateData = await medicalRecordService.getTemplateByMedicalRecord(recordId);
        setTemplate(templateData);
      } catch (error) {
        console.error('Error loading medical record:', error);
        toast.error('Có lỗi xảy ra khi tải bệnh án');
        router.push('/medical-records');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
    loadServicePrescriptions();
  }, [recordId, router, loadServicePrescriptions]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleSave = async (data: Record<string, any> | CreateMedicalRecordDto) => {
    if (!medicalRecord) return;

    try {
      setIsSaving(true);
      
      let updateData;
      if ('content' in data) {
        // This is a CreateMedicalRecordDto from create form
        updateData = {
          content: data.content,
          status: data.status || selectedStatus,
        };
      } else {
        // This is just content from edit form
        updateData = {
          content: data,
          status: selectedStatus,
        };
      }
      
      const updatedRecord = await medicalRecordService.update(medicalRecord.id, updateData);

      setMedicalRecord(updatedRecord);
      toast.success('Cập nhật bệnh án thành công');
      router.push(`/medical-records/${recordId}`);
    } catch (error) {
      console.error('Error updating medical record:', error);
      toast.error('Có lỗi xảy ra khi cập nhật bệnh án');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    // Check if there's a returnTo query param
    const returnTo = searchParams.get('returnTo');
    if (returnTo) {
      router.push(returnTo);
    } else {
      router.push(`/medical-records/${recordId}`);
    }
  };

  const handleBack = () => {
    // Check if there's a returnTo query param
    const returnTo = searchParams.get('returnTo');
    if (returnTo) {
      router.push(returnTo);
    } else {
      // Try to go back in history, fallback to /medical-records
      if (window.history.length > 1) {
        router.back();
      } else {
        router.push('/medical-records');
      }
    }
  };

  const getStatusColor = (status: MedicalRecordStatus) => {
    switch (status) {
      case MedicalRecordStatus.COMPLETED:
        return 'bg-green-100 text-green-800';
      case MedicalRecordStatus.DRAFT:
        return 'bg-yellow-100 text-yellow-800';
      case MedicalRecordStatus.IN_PROGRESS:
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  const getStatusText = (status: MedicalRecordStatus) => {
    switch (status) {
      case MedicalRecordStatus.COMPLETED:
        return 'Hoàn thành';
      case MedicalRecordStatus.DRAFT:
        return 'Nháp';
      case MedicalRecordStatus.IN_PROGRESS:
        return 'Đang điều trị';
      default:
        return status;
    }
  };

  const getServiceStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'WAITING':
        return 'bg-orange-100 text-orange-800';
      case 'SERVING':
        return 'bg-purple-100 text-purple-800';
      case 'WAITING_RESULT':
        return 'bg-cyan-100 text-cyan-800';
      case 'COMPLETED':
        return 'bg-green-100 text-green-800';
      case 'DELAYED':
        return 'bg-red-100 text-red-800';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800';
      case 'NOT_STARTED':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getServiceStatusText = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'Chờ thực hiện';
      case 'WAITING':
        return 'Đang chờ phục vụ';
      case 'SERVING':
        return 'Đang thực hiện';
      case 'WAITING_RESULT':
        return 'Chờ kết quả';
      case 'COMPLETED':
        return 'Hoàn thành';
      case 'DELAYED':
        return 'Trì hoãn';
      case 'CANCELLED':
        return 'Đã hủy';
      case 'NOT_STARTED':
        return 'Chưa bắt đầu';
      default:
        return status;
    }
  };

  const getServiceStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING':
      case 'WAITING':
      case 'WAITING_RESULT':
      case 'NOT_STARTED':
        return <Clock className="h-4 w-4" />;
      case 'SERVING':
        return <AlertCircle className="h-4 w-4" />;
      case 'COMPLETED':
        return <CheckCircle className="h-4 w-4" />;
      case 'DELAYED':
      case 'CANCELLED':
        return <XCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const handlePredict = async () => {
    if (!recordId) return;
    try {
      setIsPredicting(true);
      // Use GET as requested
      const response = await api.get(`/medical-records/${recordId}/predict`);
      const payload = response?.data ?? {};
      const list = (payload?.data?.predictions ?? payload?.predictions) as Array<{ icd_code: string; probability: number; disease_name_en: string; disease_name_vi: string }>;
      if (Array.isArray(list)) {
        setPredictions(list);
        if (!list.length) toast.info('Không có gợi ý bệnh phù hợp');
      } else {
        setPredictions([]);
        toast.error('Dữ liệu dự đoán không hợp lệ');
      }
    } catch (error) {
      console.error('Error predicting diseases:', error);
      toast.error('Có lỗi xảy ra khi chuẩn đoán tự động');
    } finally {
      setIsPredicting(false);
    }
  };

  // Link prescription handler
  const handleLinkPrescription = async () => {
    if (!prescriptionCode.trim() || !recordId) {
      toast.error('Vui lòng nhập mã phiếu chỉ định');
      return;
    }

    setIsLinking(true);
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const response = await api.patch<any>(`/medical-records/${recordId}/link-prescription`, {
        prescriptionCode: prescriptionCode.trim(),
      });

      if (response.data) {
        toast.success('Đã liên kết phiếu chỉ định thành công');
        setIsLinkPrescriptionDialogOpen(false);
        setPrescriptionCode('');
        // Reload service prescriptions
        loadServicePrescriptions();
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
        
        const html5QrCode = new Html5Qrcode('qr-reader-link');
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

  if (isLoading) {
    return (
      <div className="container mx-auto px-8 py-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <span className="ml-2">Đang tải bệnh án...</span>
        </div>
      </div>
    );
  }

  if (!medicalRecord || !template) {
    return (
      <div className="container mx-auto px-8 py-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-red-500" />
              Không tìm thấy bệnh án
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">
              Bệnh án bạn đang tìm kiếm không tồn tại hoặc đã bị xóa.
            </p>
            <Button onClick={handleBack} className="flex items-center gap-2">
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }


  return (
    <div className="container mx-auto px-8 py-6 bg-white">
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
            <h1 className="text-2xl font-bold text-gray-900">Chỉnh sửa bệnh án</h1>
            <p className="text-sm text-gray-600">
              {template.name} • ID: {medicalRecord.id}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={`${getStatusColor(medicalRecord.status)} text-xs`}>
              {getStatusText(medicalRecord.status)}
            </Badge>
            {template.enableAutoDiagnosis && (
              <Button
                onClick={handlePredict}
                variant="secondary"
                className="flex items-center gap-2 text-sm"
                disabled={isPredicting}
              >
                <Brain className="h-4 w-4" />
                {isPredicting ? 'Đang chuẩn đoán...' : 'Chuẩn đoán tự động'}
              </Button>
            )}
            <Button
              onClick={() => router.push(`/medical-records/${recordId}/prescription`)}
              className="flex items-center gap-2 text-sm bg-green-600 hover:bg-green-700"
            >
              <ClipboardList className="h-4 w-4" />
              Tạo phiếu chỉ định
            </Button>
            <Button
              onClick={() => setIsLinkPrescriptionDialogOpen(true)}
              variant="outline"
              className="flex items-center gap-2 text-sm"
            >
              <Link2 className="h-4 w-4" />
              Liên kết phiếu chỉ định
            </Button>
          </div>
        </div>
      </div>

      {predictions.length > 0 && (
        <Card className="mb-6">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Brain className="h-5 w-5 text-purple-600" />
              Kết quả chuẩn đoán tự động
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {predictions.map((p, idx) => (
                <li key={`${p.icd_code}-${idx}`} className="flex items-center justify-between rounded-md border p-3 text-sm">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{p.disease_name_vi}</p>
                    <p className="text-xs text-gray-500">ICD: {p.icd_code}</p>
                  </div>
                  <div className="ml-4 text-right">
                    <span className="text-xs text-gray-600">Xác suất</span>
                    <div className="font-semibold">{(p.probability * 100).toFixed(1)}%</div>
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Column - Status & Info */}
        <div className="lg:col-span-1 space-y-4">
          {/* Status Selection */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Stethoscope className="h-5 w-5 text-blue-500" />
                Trạng thái
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Trạng thái bệnh án</Label>
                <Select value={selectedStatus} onValueChange={(v) => setSelectedStatus(v as MedicalRecordStatus)}>
                  <SelectTrigger className="w-full text-sm">
                    <SelectValue placeholder="Chọn trạng thái" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={MedicalRecordStatus.DRAFT}>Nháp</SelectItem>
                    <SelectItem value={MedicalRecordStatus.IN_PROGRESS}>Đang điều trị</SelectItem>
                    <SelectItem value={MedicalRecordStatus.COMPLETED}>Hoàn thành</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Record Info */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                    <FileText className="h-3 w-3 text-blue-500" />
                  </div>
                  <h4 className="font-medium text-blue-900 text-sm">Thông tin bệnh án</h4>
                </div>
                <div className="space-y-1 text-xs text-blue-800">
                  <p><span className="font-medium">Template:</span> {template.name}</p>
                  <p><span className="font-medium">Chuyên khoa:</span> {template.specialtyName}</p>
                  <p><span className="font-medium">ID:</span> {medicalRecord.id}</p>
                  <p><span className="font-medium">Ngày tạo:</span> {new Date(medicalRecord.createdAt).toLocaleDateString('vi-VN')}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Prescriptions List */}
          <MedicalRecordPrescriptions
            medicalRecordId={medicalRecord.id}
            patientProfileId={medicalRecord.patientProfileId}
          />
        </div>

        {/* Right Column - Edit Form */}
        <div className="lg:col-span-3">
          {medicalRecord.content && Object.keys(medicalRecord.content).length > 0 ? (
            <DynamicMedicalRecordForm
              key={`${medicalRecord.id}-${JSON.stringify(medicalRecord.content)}`}
              template={template}
              patientProfileId={medicalRecord.patientProfileId}
              doctorId={medicalRecord.doctorId}
              appointmentId={medicalRecord.appointmentId}
              onSubmit={handleSave}
              onCancel={handleCancel}
              initialData={medicalRecord.content}
              isEditing={true}
              existingAttachments={medicalRecord.attachments || []}
            />
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <div className="max-w-md mx-auto">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FileText className="h-8 w-8 text-gray-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    Không có dữ liệu
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Bệnh án này không có dữ liệu để chỉnh sửa
                  </p>
                  <Button onClick={handleBack} variant="outline" className="flex items-center gap-2">
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Service Prescriptions List - Full Width Below Medical Record Form */}
      <div className="mt-6">
        <Card className="border-l-4 border-l-orange-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg text-orange-700">
              <ClipboardList className="h-5 w-5 text-orange-600" />
              Phiếu chỉ định dịch vụ ({servicePrescriptions.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingServicePrescriptions ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-600 mx-auto"></div>
                <p className="text-sm text-gray-500 mt-2">Đang tải...</p>
              </div>
            ) : servicePrescriptions.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <ClipboardList className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p className="text-sm">Chưa có phiếu chỉ định nào</p>
              </div>
            ) : (
              <div className="space-y-4">
                {servicePrescriptions.map((prescription) => (
                  <div
                    key={prescription.id}
                    className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                  >
                    {/* Prescription Header */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        {getServiceStatusIcon(prescription.status)}
                      </div>
                      <div className="flex items-center gap-2">
                        <p className="text-xs text-gray-500 mr-2">
                          {prescription.prescriptionCode}
                        </p>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs"
                          onClick={() => {
                            setSelectedPrescription(prescription);
                            setIsPrescriptionDialogOpen(true);
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Services List */}
                    <div className="space-y-2">
                      <h4 className="font-medium text-sm text-gray-900">
                        Dịch vụ ({prescription.services.length})
                      </h4>
                      {prescription.services.map((service) => (
                        <div
                          key={service.serviceId}
                          className="space-y-2"
                        >
                          <div className="flex items-center gap-3 p-2 bg-gray-50 rounded border">
                            <Badge variant="outline" className="text-xs">
                              {service.order}
                            </Badge>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {service.service.name}
                              </p>
                              <p className="text-xs text-gray-600">
                                {service.service.serviceCode}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge
                                className={`${getServiceStatusColor(service.status)} text-xs`}
                              >
                                {getServiceStatusText(service.status)}
                              </Badge>
                              {/* Button to create new prescription for this service */}
                              {(service.status === 'NOT_STARTED' || service.status === 'WAITING' || service.status === 'SERVING' || service.status === 'PENDING') && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="text-xs border-blue-300 text-blue-700 hover:bg-blue-50 h-6 px-2"
                                  onClick={() => {
                                    // Convert to ServiceProcessingPrescriptionService format
                                    const serviceForDialog = {
                                      id: undefined,
                                      prescriptionId: service.prescriptionId,
                                      serviceId: service.serviceId,
                                      service: {
                                        id: service.service.id,
                                        serviceCode: service.service.serviceCode,
                                        name: service.service.name,
                                        price: 0,
                                        description: service.service.description || '',
                                        timePerPatient: 0
                                      },
                                      status: service.status as ServiceProcessingPrescriptionService['status'],
                                      order: service.order,
                                      note: service.note,
                                      startedAt: null,
                                      completedAt: null,
                                      results: service.results || [],
                                      prescription: {
                                        id: prescription.id,
                                        prescriptionCode: prescription.prescriptionCode,
                                        status: prescription.status,
                                        patientProfile: prescription.patientProfile || {
                                          id: prescription.patientProfileId,
                                          name: 'N/A',
                                          dateOfBirth: '',
                                          gender: 'OTHER'
                                        }
                                      }
                                    } as ServiceWithPrescription;
                                    setSelectedServiceForPrescription(serviceForDialog as ServiceWithPrescription);
                                    setCreatePrescriptionDialogOpen(true);
                                  }}
                                >
                                  <FileText className="h-3 w-3" />
                                </Button>
                              )}
                            </div>
                          </div>
                          
                          {/* Hiển thị kết quả và note nếu service đã Complete */}
                          {service.status === 'COMPLETED' && (service.results.length > 0 || service.note) && (
                            <div className="ml-8 p-3 bg-green-50 border border-green-200 rounded-lg">
                              {service.note && (
                                <div className="mb-2">
                                  <p className="text-xs font-medium text-green-900 mb-1">Ghi chú:</p>
                                  <p className="text-xs text-green-800">{service.note}</p>
                                </div>
                              )}
                              {service.results.length > 0 && (
                                <div>
                                  <p className="text-xs font-medium text-green-900 mb-2">Kết quả ({service.results.length}):</p>
                                  <div className="flex flex-wrap gap-3">
                                    {service.results.map((result, idx) => {
                                      const fileName = result.split('/').pop() || `Kết quả ${idx + 1}`;
                                      const extension = fileName.split('.').pop()?.toLowerCase() || '';
                                      const getFileIcon = () => {
                                        if (['pdf'].includes(extension)) {
                                          return <FileText className="h-6 w-6 text-red-500" />;
                                        }
                                        if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg'].includes(extension)) {
                                          return <ImageIcon className="h-6 w-6 text-green-500" />;
                                        }
                                        if (['doc', 'docx'].includes(extension)) {
                                          return <FileText className="h-6 w-6 text-blue-500" />;
                                        }
                                        if (['xls', 'xlsx'].includes(extension)) {
                                          return <FileText className="h-6 w-6 text-green-600" />;
                                        }
                                        return <File className="h-6 w-6 text-gray-500" />;
                                      };
                                      return (
                                        <button
                                          key={idx}
                                          onClick={() => {
                                            setPreviewFileUrl(result);
                                            setPreviewFileName(fileName);
                                            setIsPreviewDialogOpen(true);
                                          }}
                                          className="relative group/icon p-2 hover:bg-blue-50 rounded-lg transition-colors"
                                          title={fileName}
                                        >
                                          {getFileIcon()}
                                          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover/icon:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                                            {fileName}
                                          </div>
                                        </button>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Hiển thị danh sách phiếu con (issuedPrescriptions) */}
                          {service.issuedPrescriptions && service.issuedPrescriptions.length > 0 && (
                            <div className="ml-8 space-y-2">
                              <p className="text-xs font-medium text-gray-700 mb-1">
                                Phiếu chỉ định con ({service.issuedPrescriptions.length}):
                              </p>
                              {service.issuedPrescriptions.map((issuedPrescription) => (
                                <div
                                  key={issuedPrescription.id}
                                  className="p-3 bg-blue-50 border border-blue-200 rounded-lg"
                                >
                                  <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                      <Badge variant="outline" className="text-xs">
                                        {issuedPrescription.prescriptionCode}
                                      </Badge>
                                      <Badge className={`${getServiceStatusColor(issuedPrescription.status)} text-xs`}>
                                        {getServiceStatusText(issuedPrescription.status)}
                                      </Badge>
                                    </div>
                                  </div>
                                  
                                  {/* Danh sách dịch vụ trong phiếu con */}
                                  {issuedPrescription.services.length > 0 && (
                                    <div className="mb-2">
                                      <p className="text-xs font-medium text-blue-900 mb-1">Dịch vụ:</p>
                                      <div className="space-y-1">
                                        {issuedPrescription.services.map((subService) => (
                                          <div key={subService.serviceId} className="text-xs text-blue-800">
                                            <span className="font-medium">#{subService.order}</span> {subService.service.name} ({subService.service.serviceCode})
                                            <Badge className={`ml-2 ${getServiceStatusColor(subService.status)} text-xs`}>
                                              {getServiceStatusText(subService.status)}
                                            </Badge>
                                            
                                            {/* Kết quả và note của dịch vụ con nếu đã Complete */}
                                            {subService.status === 'COMPLETED' && (subService.results.length > 0 || subService.note) && (
                                              <div className="ml-4 mt-1 p-2 bg-white border border-blue-300 rounded">
                                                {subService.note && (
                                                  <p className="text-xs text-gray-700 mb-1">
                                                    <span className="font-medium">Ghi chú:</span> {subService.note}
                                                  </p>
                                                )}
                                                {subService.results.length > 0 && (
                                                  <div>
                                                    <p className="text-xs font-medium text-gray-700 mb-2">Kết quả:</p>
                                                    <div className="flex flex-wrap gap-2">
                                                      {subService.results.map((result, idx) => {
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
                                                            className="relative group/icon p-1.5 hover:bg-blue-50 rounded transition-colors"
                                                            title={fileName}
                                                          >
                                                            {getFileIcon()}
                                                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover/icon:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                                                              {fileName}
                                                            </div>
                                                          </button>
                                                        );
                                                      })}
                                                    </div>
                                                  </div>
                                                )}
                                              </div>
                                            )}
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                  
                                  {/* Note của phiếu con */}
                                  {issuedPrescription.note && (
                                    <div className="mt-2 pt-2 border-t border-blue-300">
                                      <p className="text-xs text-blue-800">
                                        <span className="font-medium">Ghi chú phiếu:</span> {issuedPrescription.note}
                                      </p>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Note */}
                    {prescription.note && (
                      <div className="mt-3 pt-3 border-t border-gray-100">
                        <p className="text-xs text-gray-600">
                          <span className="font-medium">Ghi chú:</span> {prescription.note}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Prescription Detail Dialog */}
      <Dialog open={isPrescriptionDialogOpen} onOpenChange={setIsPrescriptionDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5" />
              Chi tiết phiếu chỉ định {selectedPrescription ? `#${selectedPrescription.prescriptionCode}` : ''}
            </DialogTitle>
          </DialogHeader>
          {selectedPrescription ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge className={`${getServiceStatusColor(selectedPrescription.status)} text-xs`}>
                    {getServiceStatusText(selectedPrescription.status)}
                  </Badge>
    </div>
                {selectedPrescription.note && (
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Ghi chú:</span> {selectedPrescription.note}
                  </p>
                )}
              </div>

              <div>
                <h4 className="font-medium text-sm text-gray-900 mb-2">Dịch vụ ({selectedPrescription.services.length})</h4>
                <div className="space-y-2">
                  {selectedPrescription.services.map((service: ServicePrescriptionService) => (
                    <div key={service.serviceId} className="space-y-2">
                      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded border">
                        <Badge variant="outline" className="text-xs">{service.order}</Badge>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{service.service.name}</p>
                          <p className="text-xs text-gray-600">{service.service.serviceCode}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={`${getServiceStatusColor(service.status)} text-xs`}>
                            {getServiceStatusText(service.status)}
                          </Badge>
                          {/* Button to create new prescription for this service */}
                          {(service.status === 'NOT_STARTED' || service.status === 'WAITING' || service.status === 'SERVING' || service.status === 'PENDING') && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-xs border-blue-300 text-blue-700 hover:bg-blue-50 h-6 px-2"
                              onClick={() => {
                                const serviceForDialog = {
                                  id: undefined,
                                  prescriptionId: service.prescriptionId,
                                  serviceId: service.serviceId,
                                  service: {
                                    id: service.service.id,
                                    serviceCode: service.service.serviceCode,
                                    name: service.service.name,
                                    price: 0,
                                    description: service.service.description || '',
                                    timePerPatient: 0
                                  },
                                  status: service.status as ServiceProcessingPrescriptionService['status'],
                                  order: service.order,
                                  note: service.note,
                                  startedAt: null,
                                  completedAt: null,
                                  results: service.results || [],
                                  prescription: {
                                    id: selectedPrescription.id,
                                    prescriptionCode: selectedPrescription.prescriptionCode,
                                    status: selectedPrescription.status,
                                    patientProfile: selectedPrescription.patientProfile || {
                                      id: selectedPrescription.patientProfileId,
                                      name: 'N/A',
                                      dateOfBirth: '',
                                      gender: 'OTHER'
                                    }
                                  }
                                } as ServiceWithPrescription;
                                setSelectedServiceForPrescription(serviceForDialog as ServiceWithPrescription);
                                setCreatePrescriptionDialogOpen(true);
                              }}
                            >
                              <FileText className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      </div>
                      
                      {/* Hiển thị kết quả và note nếu service đã Complete */}
                      {service.status === 'COMPLETED' && (service.results.length > 0 || service.note) && (
                        <div className="ml-8 p-3 bg-green-50 border border-green-200 rounded-lg">
                          {service.note && (
                            <div className="mb-2">
                              <p className="text-xs font-medium text-green-900 mb-1">Ghi chú:</p>
                              <p className="text-xs text-green-800">{service.note}</p>
                            </div>
                          )}
                          {service.results.length > 0 && (
                            <div>
                              <p className="text-xs font-medium text-green-900 mb-2">Kết quả ({service.results.length}):</p>
                              <div className="flex flex-wrap gap-3">
                                {service.results.map((result, idx) => {
                                  const fileName = result.split('/').pop() || `Kết quả ${idx + 1}`;
                                  const extension = fileName.split('.').pop()?.toLowerCase() || '';
                                  const getFileIcon = () => {
                                    if (['pdf'].includes(extension)) {
                                      return <FileText className="h-6 w-6 text-red-500" />;
                                    }
                                    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg'].includes(extension)) {
                                      return <ImageIcon className="h-6 w-6 text-green-500" />;
                                    }
                                    if (['doc', 'docx'].includes(extension)) {
                                      return <FileText className="h-6 w-6 text-blue-500" />;
                                    }
                                    if (['xls', 'xlsx'].includes(extension)) {
                                      return <FileText className="h-6 w-6 text-green-600" />;
                                    }
                                    return <File className="h-6 w-6 text-gray-500" />;
                                  };
                                  return (
                                    <button
                                      key={idx}
                                      onClick={() => {
                                        setPreviewFileUrl(result);
                                        setPreviewFileName(fileName);
                                        setIsPreviewDialogOpen(true);
                                      }}
                                      className="relative group/icon p-2 hover:bg-blue-50 rounded-lg transition-colors"
                                      title={fileName}
                                    >
                                      {getFileIcon()}
                                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover/icon:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                                        {fileName}
                                      </div>
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Hiển thị danh sách phiếu con (issuedPrescriptions) */}
                      {service.issuedPrescriptions && service.issuedPrescriptions.length > 0 && (
                        <div className="ml-8 space-y-2">
                          <p className="text-xs font-medium text-gray-700 mb-1">
                            Phiếu chỉ định con ({service.issuedPrescriptions.length}):
                          </p>
                          {service.issuedPrescriptions.map((issuedPrescription) => (
                            <div
                              key={issuedPrescription.id}
                              className="p-3 bg-blue-50 border border-blue-200 rounded-lg"
                            >
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline" className="text-xs">
                                    {issuedPrescription.prescriptionCode}
                                  </Badge>
                                  <Badge className={`${getServiceStatusColor(issuedPrescription.status)} text-xs`}>
                                    {getServiceStatusText(issuedPrescription.status)}
                                  </Badge>
                                </div>
                              </div>
                              
                              {/* Danh sách dịch vụ trong phiếu con */}
                              {issuedPrescription.services.length > 0 && (
                                <div className="mb-2">
                                  <p className="text-xs font-medium text-blue-900 mb-1">Dịch vụ:</p>
                                  <div className="space-y-1">
                                    {issuedPrescription.services.map((subService) => (
                                      <div key={subService.serviceId} className="text-xs text-blue-800">
                                        <span className="font-medium">#{subService.order}</span> {subService.service.name} ({subService.service.serviceCode})
                                        <Badge className={`ml-2 ${getServiceStatusColor(subService.status)} text-xs`}>
                                          {getServiceStatusText(subService.status)}
                                        </Badge>
                                        
                                        {/* Kết quả và note của dịch vụ con nếu đã Complete */}
                                        {subService.status === 'COMPLETED' && (subService.results.length > 0 || subService.note) && (
                                          <div className="ml-4 mt-1 p-2 bg-white border border-blue-300 rounded">
                                            {subService.note && (
                                              <p className="text-xs text-gray-700 mb-1">
                                                <span className="font-medium">Ghi chú:</span> {subService.note}
                                              </p>
                                            )}
                                            {subService.results.length > 0 && (
                                              <div>
                                                <p className="text-xs font-medium text-gray-700 mb-2">Kết quả:</p>
                                                <div className="flex flex-wrap gap-2">
                                                  {subService.results.map((result, idx) => {
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
                                                        className="relative group/icon p-1.5 hover:bg-blue-50 rounded transition-colors"
                                                        title={fileName}
                                                      >
                                                        {getFileIcon()}
                                                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover/icon:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                                                          {fileName}
                                                        </div>
                                                      </button>
                                                    );
                                                  })}
                                                </div>
                                              </div>
                                            )}
                                          </div>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                              
                              {/* Note của phiếu con */}
                              {issuedPrescription.note && (
                                <div className="mt-2 pt-2 border-t border-blue-300">
                                  <p className="text-xs text-blue-800">
                                    <span className="font-medium">Ghi chú phiếu:</span> {issuedPrescription.note}
                                  </p>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-6 text-gray-500">Không có dữ liệu phiếu chỉ định</div>
          )}
        </DialogContent>
      </Dialog>

      {/* Create Prescription Dialog */}
      {selectedServiceForPrescription && (
        <CreatePrescriptionDialog
          open={createPrescriptionDialogOpen}
          onOpenChange={(open) => {
            setCreatePrescriptionDialogOpen(open);
            if (!open) {
              setSelectedServiceForPrescription(null);
            }
          }}
          service={selectedServiceForPrescription}
          patientProfileId={selectedServiceForPrescription?.prescription?.patientProfile?.id ||
                           medicalRecord?.patientProfileId || ''}
          onSuccess={() => {
            // Reload service prescriptions after creating new one
            loadServicePrescriptions();
          }}
        />
      )}

      {/* Link Prescription Dialog */}
      <Dialog open={isLinkPrescriptionDialogOpen} onOpenChange={setIsLinkPrescriptionDialogOpen}>
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
      <Dialog open={isQrScannerOpen} onOpenChange={setIsQrScannerOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <QrCode className="h-5 w-5" />
              Quét mã QR phiếu chỉ định
            </DialogTitle>
            <DialogDescription>
              Đưa mã QR của phiếu chỉ định (PRESC...) vào khung hình để quét tự động
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
              <div id="qr-reader-link" className="w-full h-full"></div>
              
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

      {/* File Preview Dialog */}
      {previewFileUrl && (
        <FilePreviewDialog
          open={isPreviewDialogOpen}
          onOpenChange={(open) => {
            setIsPreviewDialogOpen(open);
            if (!open) {
              setPreviewFileUrl(null);
              setPreviewFileName(null);
            }
          }}
          fileUrl={previewFileUrl}
          fileName={previewFileName || undefined}
        />
      )}
    </div>
  );
}
