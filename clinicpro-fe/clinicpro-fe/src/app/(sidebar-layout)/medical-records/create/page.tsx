/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useState, useEffect, Suspense, useRef, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

import { 
  ChevronLeft, 
  FileText, 
  User, 
  Save,
  X,
  Pill,
  QrCode,
  Camera,
  CameraOff,
} from 'lucide-react';
import { Template, CreateMedicalRecordDto, MedicalRecordStatus } from '@/lib/types/medical-record';
import { medicalRecordService } from '@/lib/services/medical-record.service';
import { useAuth } from '@/lib/hooks/useAuth';
import { toast } from 'sonner';
import { PatientSearch } from '@/components/medical-records/PatientSearch';
import { DynamicMedicalRecordForm } from '@/components/medical-records/DynamicMedicalRecordForm';
import { PatientProfile } from '@/lib/types/user';
import { patientProfileService } from '@/lib/services/patient-profile.service';
import { CreatePrescriptionDialog } from '@/components/medication-prescriptions/CreatePrescriptionDialog';
import { medicationPrescriptionApi, appointmentBookingApi } from '@/lib/api';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Html5Qrcode } from 'html5-qrcode';

function CreateMedicalRecordPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const patientProfileId = searchParams.get('patientId');

  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState<Partial<CreateMedicalRecordDto>>({
    patientProfileId: patientProfileId || '',
    templateId: '',
    doctorId: user?.id ,
    appointmentCode: '',
    status: MedicalRecordStatus.DRAFT,
    content: {},
  });
  // const [attachments, setAttachments] = useState<File[]>([]);
  const [selectedPatientProfile, setSelectedPatientProfile] = useState<PatientProfile | null>(null);
  
  // Prescription creation states
  const [createPrescriptionAfter, setCreatePrescriptionAfter] = useState(false);
  const [showCreatePrescriptionDialog, setShowCreatePrescriptionDialog] = useState(false);
  const [createdMedicalRecordId, setCreatedMedicalRecordId] = useState<string | null>(null);

  // Appointment QR Scanner states
  const [isAppointmentQrScannerOpen, setIsAppointmentQrScannerOpen] = useState(false);
  const [scanningAppointment, setScanningAppointment] = useState(false);
  const [appointmentScanHint, setAppointmentScanHint] = useState<string>('Đang khởi động camera...');
  const [usingHtml5Qrcode, setUsingHtml5Qrcode] = useState(false);
  const appointmentVideoRef = useRef<HTMLVideoElement | null>(null);
  const appointmentMediaStreamRef = useRef<MediaStream | null>(null);
  const appointmentHtml5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const appointmentLastScanRef = useRef<string | null>(null);
  const appointmentLastScanTsRef = useRef<number>(0);
  const appointmentScanningRef = useRef(false);

  // Load templates
  useEffect(() => {
    const loadTemplates = async () => {
      try {
        setIsLoading(true);
        const templatesData = await medicalRecordService.getTemplates();
        setTemplates(templatesData);
      } catch (error) {
        console.error('Error loading templates:', error);
        toast.error('Có lỗi xảy ra khi tải templates');
      } finally {
        setIsLoading(false);
      }
    };

    loadTemplates();
  }, []);

  // Auto-load patient profile when patientId is provided in query params
  useEffect(() => {
    const loadPatientProfile = async () => {
      if (patientProfileId) {
        // Only load if no patient is selected or selected patient is different
        if (!selectedPatientProfile || selectedPatientProfile.id !== patientProfileId) {
          try {
            setIsLoading(true);
            const profile = await patientProfileService.getById(patientProfileId);
            handlePatientProfileSelect(profile as unknown as PatientProfile);
          } catch (error) {
            console.error('Error loading patient profile:', error);
            toast.error('Không thể tải thông tin bệnh nhân');
          } finally {
            setIsLoading(false);
          }
        }
      }
    };

    loadPatientProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patientProfileId]);

  // Update selected template when templateId changes
  useEffect(() => {
    if (formData.templateId) {
      const template = templates.find(t => t.id === formData.templateId);
      setSelectedTemplate(template || null);
    } else {
      setSelectedTemplate(null);
    }
  }, [formData.templateId, templates]);

  const handleTemplateSelect = (templateId: string) => {
    setFormData(prev => ({
      ...prev,
      templateId,
      doctorId: user?.id ,
      content: {}, // Reset content when template changes
    }));
  };

  const handlePatientProfileSelect = (patientProfile: PatientProfile | null) => {
    setSelectedPatientProfile(patientProfile);
    setFormData(prev => ({
      ...prev,
      patientProfileId: patientProfile ? patientProfile.id : '',
    }));
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  // Content is managed by DynamicMedicalRecordForm now

  // File upload is handled inside DynamicMedicalRecordForm

  // File removal is handled inside DynamicMedicalRecordForm

  const handleSubmit = async () => {
    if (!formData.templateId || !selectedPatientProfile) {
      toast.error('Vui lòng chọn template và bệnh nhân');
      return;
    }
    console.log('formData', formData);
    try {
      setIsCreating(true);

      const payload: any = { ...formData };
      if (!payload.appointmentCode || String(payload.appointmentCode).trim() === '') {
        delete payload.appointmentCode;
      }
      const createdRecord = await medicalRecordService.create(payload as CreateMedicalRecordDto);
      toast.success('Tạo bệnh án thành công');
      
      // If user wants to create prescription after, store the medical record ID and show dialog
      if (createPrescriptionAfter && selectedPatientProfile) {
        setCreatedMedicalRecordId(createdRecord.id);
        setShowCreatePrescriptionDialog(true);
      } else {
        router.push('/medical-records');
      }
    } catch (error) {
      console.error('Error creating medical record:', error);
      toast.error('Có lỗi xảy ra khi tạo bệnh án');
    } finally {
      setIsCreating(false);
    }
  };

  const handleCancel = () => {
    router.push('/medical-records');
  };

  const handleCreatePrescription = async (data: {
    patientProfileId: string;
    medicalRecordId?: string;
    note?: string;
    status?: 'DRAFT' | 'SIGNED' | 'CANCELLED';
    items: any[];
  }) => {
    try {
      await medicationPrescriptionApi.create(data);
      toast.success('Tạo đơn thuốc thành công');
      setShowCreatePrescriptionDialog(false);
      // Redirect to medical records after successful prescription creation
      router.push('/medical-records');
    } catch (error) {
      console.error('Error creating prescription:', error);
      toast.error('Có lỗi xảy ra khi tạo đơn thuốc');
      throw error;
    }
  };

  // Appointment QR Scanner handlers
  const stopAppointmentScanner = useCallback(async () => {
    setScanningAppointment(false);
    appointmentScanningRef.current = false;
    setUsingHtml5Qrcode(false);
    
    // Stop html5-qrcode if running
    if (appointmentHtml5QrCodeRef.current) {
      try {
        await appointmentHtml5QrCodeRef.current.stop();
        await appointmentHtml5QrCodeRef.current.clear();
      } catch (e) {
        console.warn('[Appointment QR] Error stopping html5-qrcode:', e);
      }
      appointmentHtml5QrCodeRef.current = null;
    }
    
    // Stop media stream
    const stream = appointmentMediaStreamRef.current;
    if (stream) {
      stream.getTracks().forEach(t => t.stop());
      appointmentMediaStreamRef.current = null;
    }
    if (appointmentVideoRef.current) {
      appointmentVideoRef.current.srcObject = null;
    }
  }, []);

  const handleAppointmentQrText = useCallback(async (text: string) => {
    const trimmed = (text || '').trim().toUpperCase();
    if (!trimmed) return;
    
    console.log('[Appointment QR] Raw:', text);
    console.log('[Appointment QR] Scanned code:', trimmed);
    
    // Check if QR code starts with "APT" (Appointment code)
    if (!trimmed.startsWith('APT')) {
      toast.error('Mã QR không phải mã lịch hẹn (APT...)');
      setAppointmentScanHint('Mã QR không đúng định dạng');
      return;
    }

    try {
      setAppointmentScanHint('Đang tra cứu lịch hẹn...');
      toast.info('Đang tra cứu thông tin lịch hẹn...');
      
      // Call API to get appointment by code
      const response = await appointmentBookingApi.getAppointmentByCode(trimmed);
      const appointmentData = response.data;
      
      console.log('[Appointment QR] Appointment data:', appointmentData);
      
      // Fill appointment code
      handleInputChange('appointmentCode', appointmentData.appointmentCode);
      
      // Search and select patient profile by code
      if (appointmentData.patientProfileCode) {
        try {
          const patientProfileService = (await import('@/lib/services/patient-profile.service')).patientProfileService;
          
          // Try direct code lookup first
          let profile: PatientProfile | null = null;
          try {
            profile = await patientProfileService.getPatientProfileByCode(appointmentData.patientProfileCode);
          } catch {
            // If direct lookup fails, try search
            const profileResponse = await patientProfileService.searchPatientProfiles(appointmentData.patientProfileCode);
            if (profileResponse.patientProfiles && profileResponse.patientProfiles.length > 0) {
              profile = profileResponse.patientProfiles[0];
            }
          }
          
          if (profile) {
            handlePatientProfileSelect(profile);
            toast.success('Đã tải thông tin lịch hẹn và bệnh nhân');
          } else {
            toast.warning(`Đã điền mã lịch hẹn, nhưng không tìm thấy hồ sơ bệnh nhân với mã: ${appointmentData.patientProfileCode}. Vui lòng tìm kiếm thủ công.`);
          }
        } catch (profileError) {
          console.error('[Appointment QR] Error loading patient profile:', profileError);
          toast.warning(`Đã điền mã lịch hẹn, nhưng không thể tải hồ sơ bệnh nhân. Mã hồ sơ: ${appointmentData.patientProfileCode}`);
        }
      }
      
      setAppointmentScanHint('Đã tải thông tin lịch hẹn');
      
      // Close scanner after successful scan
      setTimeout(() => {
        setIsAppointmentQrScannerOpen(false);
        stopAppointmentScanner();
      }, 500);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Không thể tra cứu lịch hẹn';
      console.error('[Appointment QR] Error:', error);
      toast.error(errorMessage);
      setAppointmentScanHint('Lỗi tra cứu lịch hẹn');
    }
  }, [stopAppointmentScanner]);

  const startAppointmentScanner = useCallback(async () => {
    setScanningAppointment(true);
    appointmentScanningRef.current = true;
    setAppointmentScanHint('Đang khởi động camera...');
    
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
      
      console.log('[Appointment QR] Got media stream:', !!stream);
      appointmentMediaStreamRef.current = stream;
      const video = appointmentVideoRef.current;
      if (!video) {
        console.warn('[Appointment QR] videoRef.current is null');
        return;
      }
      
      video.srcObject = stream;
      await video.play();

      // Wait until video metadata is ready
      if (video.readyState < 2) {
        await new Promise<void>((resolve) => {
          const onLoaded = () => { resolve(); };
          video.addEventListener('loadeddata', onLoaded, { once: true });
        });
      }
      
      console.log('[Appointment QR] Video ready');
      setAppointmentScanHint('Camera đã sẵn sàng. Đưa mã QR vào khung...');

      // Try BarcodeDetector first
      interface BarcodeDetectorInterface {
        detect(image: HTMLVideoElement): Promise<Array<{ rawValue?: string; rawValueText?: string; raw?: string }>>;
      }
      
      const BD = (window as { BarcodeDetector?: new (options?: { formats: string[] }) => BarcodeDetectorInterface }).BarcodeDetector;
      const isBarcodeDetectorSupported = typeof BD !== 'undefined';
      
      if (isBarcodeDetectorSupported) {
        console.log('[Appointment QR] Trying BarcodeDetector...');
        setUsingHtml5Qrcode(false);
        let detector: BarcodeDetectorInterface | null = null;
        try {
          detector = new BD({ formats: ['qr_code'] });
        } catch {
          try {
            detector = new BD();
          } catch (e) {
            console.log('[Appointment QR] BarcodeDetector init failed, will use fallback:', e);
          }
        }
        
        if (detector) {
          console.log('[Appointment QR] BarcodeDetector initialized');
          const tick = async () => {
            if (!appointmentScanningRef.current || !appointmentVideoRef.current) {
              return;
            }
            
            try {
              const detections = await detector!.detect(appointmentVideoRef.current);
              if (detections && detections.length > 0) {
                const raw = (detections[0]?.rawValue ?? detections[0]?.rawValueText ?? detections[0]?.raw ?? '').toString();
                if (raw) {
                  const norm = raw.trim();
                  const now = Date.now();
                  // Debounce
                  if (appointmentLastScanRef.current === norm && now - appointmentLastScanTsRef.current < 1500) {
                    // skip duplicate
                  } else {
                    appointmentLastScanRef.current = norm;
                    appointmentLastScanTsRef.current = now;
                    console.log('[Appointment QR] Found QR code:', norm);
                    await handleAppointmentQrText(norm);
                  }
                }
              }
            } catch (err) {
              console.warn('[Appointment QR] detect error:', err);
            }
            
            if (appointmentScanningRef.current) {
              requestAnimationFrame(tick);
            }
          };
          
          setAppointmentScanHint('Đưa mã QR vào trong khung...');
          requestAnimationFrame(tick);
          return;
        }
      }
      
      // Fallback to html5-qrcode
      console.log('[Appointment QR] Using html5-qrcode fallback...');
      try {
        setUsingHtml5Qrcode(true);
        setAppointmentScanHint('Đang khởi động bộ quét QR...');
        
        // Stop the current video stream
        if (appointmentMediaStreamRef.current) {
          appointmentMediaStreamRef.current.getTracks().forEach(t => t.stop());
          appointmentMediaStreamRef.current = null;
        }
        if (appointmentVideoRef.current) {
          appointmentVideoRef.current.srcObject = null;
        }
        
        const html5QrCode = new Html5Qrcode('appointment-qr-reader');
        appointmentHtml5QrCodeRef.current = html5QrCode;
        
        const qrCodeSuccessCallback = async (decodedText: string) => {
          const norm = decodedText.trim();
          const now = Date.now();
          
          // Debounce
          if (appointmentLastScanRef.current === norm && now - appointmentLastScanTsRef.current < 1500) {
            return;
          }
          
          appointmentLastScanRef.current = norm;
          appointmentLastScanTsRef.current = now;
          console.log('[Appointment QR] Found QR code (html5-qrcode):', norm);
          await handleAppointmentQrText(norm);
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
              console.error('[Appointment QR] All camera options failed:', finalError);
              throw finalError;
            }
          }
        }
        
        setAppointmentScanHint('Đưa mã QR vào trong khung...');
        console.log('[Appointment QR] html5-qrcode started successfully');
      } catch (html5Error) {
        console.error('[Appointment QR] html5-qrcode failed:', html5Error);
        const error = html5Error instanceof Error ? html5Error : new Error('Không thể khởi động bộ quét QR');
        toast.error(`Không thể khởi động quét QR: ${error.message}`);
        setAppointmentScanHint('Lỗi khởi động bộ quét QR');
      }
    } catch (e) {
      setScanningAppointment(false);
      appointmentScanningRef.current = false;
      const error = e instanceof Error ? e : new Error('Không thể truy cập camera');
      console.error('[Appointment QR] getUserMedia error:', error);
      toast.error(error.message || 'Không thể truy cập camera');
      setAppointmentScanHint('Lỗi khởi động camera');
    }
  }, [handleAppointmentQrText]);

  // Handle QR scanner dialog open/close
  useEffect(() => {
    if (isAppointmentQrScannerOpen) {
      setTimeout(() => {
        startAppointmentScanner();
      }, 100);
    } else {
      stopAppointmentScanner();
    }
    
    return () => {
      stopAppointmentScanner();
    };
  }, [isAppointmentQrScannerOpen, startAppointmentScanner, stopAppointmentScanner]);

  return (
    <div className="container bg-white mx-auto px-8 py-6 space-y-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleCancel}
            className="flex items-center gap-2"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="h-6 w-px bg-gray-300" />
          <h1 className="text-3xl font-bold text-gray-900">Tạo bệnh án mới</h1>
        </div>
        <p className="text-gray-600">
          Chọn template và điền thông tin để tạo bệnh án mới
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Column - Basic Info & Template Selection */}
        <div className="lg:col-span-1 space-y-4">
          {/* Basic Information */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <User className="h-5 w-5" />
                Thông tin cơ bản
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Bệnh nhân *</Label>
                <div className="relative">
                                  <PatientSearch 
                  onPatientProfileSelect={handlePatientProfileSelect}
                  selectedPatientProfile={selectedPatientProfile}
                  compact={true}
                />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="appointmentCode" className="text-sm font-medium">Mã lịch hẹn</Label>
                <div className="flex gap-2">
                  <Input
                    id="appointmentCode"
                    value={formData.appointmentCode}
                    onChange={(e) => handleInputChange('appointmentCode', e.target.value)}
                    placeholder="Nhập mã lịch hẹn (tùy chọn)"
                    className="text-sm flex-1"
                  />
                  <Button 
                    onClick={() => setIsAppointmentQrScannerOpen(true)}
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-1"
                    title="Quét QR code lịch hẹn"
                  >
                    <QrCode className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Prescription Creation Option */}
              <div className="space-y-2 pt-2 border-t border-gray-200">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="createPrescription" 
                    checked={createPrescriptionAfter}
                    onCheckedChange={(checked) => setCreatePrescriptionAfter(checked as boolean)}
                  />
                  <Label 
                    htmlFor="createPrescription" 
                    className="text-sm font-medium cursor-pointer flex items-center gap-2"
                  >
                    <Pill className="h-4 w-4 text-blue-500" />
                    Tạo đơn thuốc
                  </Label>
                </div>

              </div>
            </CardContent>
          </Card>

          {/* Template Selection */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <FileText className="h-5 w-5" />
                Chọn template
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500 mx-auto mb-2"></div>
                  <p className="text-xs text-gray-500">Đang tải mẫu bệnh án...</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <Select 
                    value={formData.templateId} 
                    onValueChange={handleTemplateSelect}
                  >
                    <SelectTrigger className="w-full text-sm">
                      <SelectValue placeholder="Chọn mẫu bệnh án" />
                    </SelectTrigger>
                    <SelectContent>
                      {templates.map((template) => (
                        <SelectItem key={template.id} value={template.id}>
                          <div className="flex items-center justify-between w-full">
                            <div className="flex flex-col">
                              <span className="font-medium text-sm">{template.name}</span>
                              <span className="text-xs text-gray-500">{template.specialtyName}</span>
                            </div>
                            <Badge variant="outline" className="text-xs ml-2">
                              {template.fields?.fields?.length || 0}
                            </Badge>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  {selectedTemplate && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <FileText className="h-4 w-4 text-blue-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-gray-900 text-sm truncate">{selectedTemplate.name}</h4>
                          <p className="text-xs text-gray-600">{selectedTemplate.specialtyName}</p>
                          <div className="flex items-center gap-1 mt-1">
                            <Badge variant="outline" className="text-xs">
                              {selectedTemplate.fields?.fields?.length || 0} trường
                            </Badge>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleTemplateSelect('')}
                          className="text-gray-400 hover:text-gray-600 p-1 h-6 w-6"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column - DynamicMedicalRecordForm for Create */}
        <div className="lg:col-span-3">
          {selectedTemplate ? (
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <FileText className="h-5 w-5" />
                  {selectedTemplate.name}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <DynamicMedicalRecordForm
                  template={selectedTemplate}
                  patientProfileId={selectedPatientProfile?.id || formData.patientProfileId || ''}
                  doctorId={user?.id}
                  appointmentCode={formData.appointmentCode}
                  onSubmit={async (data) => {
                    try {
                      setIsCreating(true);
                      // If child returns only content (should not in create), normalize
                      const payload = (data as any).content
                        ? data
                        : {
                            patientProfileId: selectedPatientProfile?.id || formData.patientProfileId || '',
                            templateId: selectedTemplate.templateCode,
                            doctorId: user?.id,
                            appointmentCode: formData.appointmentCode || undefined,
                            status: 'DRAFT',
                            content: data,
                          };
                      const createdRecord = await medicalRecordService.create(payload as any);
                      toast.success('Tạo bệnh án thành công');
                      
                      // If user wants to create prescription after, store the medical record ID and show dialog
                      if (createPrescriptionAfter && selectedPatientProfile) {
                        setCreatedMedicalRecordId(createdRecord.id);
                        setShowCreatePrescriptionDialog(true);
                      } else {
                        router.push('/medical-records');
                      }
                    } catch (error) {
                      console.error('Error creating medical record:', error);
                      toast.error('Có lỗi xảy ra khi tạo bệnh án');
                      throw error;
                    } finally {
                      setIsCreating(false);
                    }
                  }}
                  onCancel={() => router.push('/medical-records')}
                />
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <div className="max-w-md mx-auto">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FileText className="h-8 w-8 text-blue-500" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    Chọn mẫu bệnh án
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Vui lòng chọn một mẫu từ danh sách bên trái để bắt đầu tạo bệnh án
                  </p>
                  <div className="space-y-2 text-sm text-gray-500">
                    <p>• Mẫu bệnh án sẽ định nghĩa các trường cần điền</p>
                    <p>• Mỗi mẫu bệnh án phù hợp với loại bệnh án khác nhau</p>
                    <p>• Bạn có thể chọn mẫu bệnh án khác bất cứ lúc nào</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Footer Actions */}
      <div className="mt-6 pt-4 border-t bg-white rounded-lg p-4 shadow-sm">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={handleCancel} className="flex items-center gap-2 text-sm">
              <X className="h-4 w-4" />
              Hủy
            </Button>
            <p className="text-xs text-gray-500">
              {selectedTemplate ? `${selectedTemplate.fields?.fields?.length || 0} trường cần điền` : 'Chưa chọn mẫu'}
              {selectedPatientProfile && ` • ${selectedPatientProfile.name}`}
              {createPrescriptionAfter && ` • Sẽ tạo đơn thuốc sau khi lưu`}
            </p>
          </div>
          {/* When using DynamicMedicalRecordForm, use its internal submit button to ensure content is sent */}
          {!selectedTemplate ? (
            <Button 
              onClick={handleSubmit} 
              disabled={isCreating}
              className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-sm"
            >
              {isCreating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Đang tạo...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Tạo bệnh án
                </>
              )}
            </Button>
          ) : null}
        </div>
      </div>

      {/* Create Prescription Dialog */}
      <CreatePrescriptionDialog
        open={showCreatePrescriptionDialog}
        onOpenChange={setShowCreatePrescriptionDialog}
        onSave={handleCreatePrescription}
        preselectedPatientProfile={selectedPatientProfile}
        preselectedMedicalRecordId={createdMedicalRecordId || undefined}
      />

      {/* Appointment QR Scanner Dialog */}
      <Dialog open={isAppointmentQrScannerOpen} onOpenChange={setIsAppointmentQrScannerOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <QrCode className="h-5 w-5" />
              Quét mã QR lịch hẹn
            </DialogTitle>
            <DialogDescription>
              Đưa mã QR của lịch hẹn (APT...) vào khung hình để quét tự động
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="relative w-full bg-black rounded-lg overflow-hidden" style={{ aspectRatio: '1' }}>
              {/* Video element for BarcodeDetector */}
              <video
                ref={appointmentVideoRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-full object-cover ${usingHtml5Qrcode ? 'hidden' : ''}`}
                style={{ transform: 'scaleX(-1)' }}
              />
              
              {/* HTML5 QR Code reader container */}
              <div id="appointment-qr-reader" className="w-full h-full"></div>
              
              {/* Scanning overlay for BarcodeDetector mode */}
              {scanningAppointment && !usingHtml5Qrcode && (
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
              
              {!scanningAppointment && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                  <div className="text-center text-white">
                    <CameraOff className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Camera chưa sẵn sàng</p>
                  </div>
                </div>
              )}
            </div>
            
            <div className="text-center">
              <p className="text-sm text-gray-600">{appointmentScanHint}</p>
            </div>
            
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={async () => {
                  await stopAppointmentScanner();
                  setIsAppointmentQrScannerOpen(false);
                }}
              >
                Đóng
              </Button>
              {!scanningAppointment && (
                <Button
                  onClick={startAppointmentScanner}
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
    </div>
  );
}

export default function CreateMedicalRecordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-white flex items-center justify-center">
          <div className="flex items-center gap-2 text-gray-500">
            <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400"></span>
            Đang tải...
          </div>
        </div>
      }
    >
      <CreateMedicalRecordPageContent />
    </Suspense>
  );
}
