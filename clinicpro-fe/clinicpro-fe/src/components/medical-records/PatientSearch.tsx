'use client';

import React, {  useRef, useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { 
  Search, 
  User, 
  Phone, 
  Calendar,
  MapPin,
  Check,
  Loader2,
  X,
  QrCode,
  Camera,
  CameraOff,
} from 'lucide-react';
import { patientProfileService } from '@/lib/services/patient-profile.service';
import { userService } from '@/lib/services/user.service';
import { PatientProfile, User as UserType } from '@/lib/types/user';
import { toast } from 'sonner';
import { Html5Qrcode } from 'html5-qrcode';

interface PatientSearchProps {
  onPatientProfileSelect: (patientProfile: PatientProfile | null) => void;
  selectedPatientProfile?: PatientProfile | null;
  compact?: boolean;
  onPatientSelect?: (patient: UserType | null) => void;
  selectedPatient?: UserType | null;
}

export function PatientSearch({ 
  onPatientProfileSelect, 
  selectedPatientProfile,
  compact = false,
  onPatientSelect,
  selectedPatient,
}: PatientSearchProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<PatientProfile[]>([]);
  const [patientResults, setPatientResults] = useState<UserType[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchMode, setSearchMode] = useState<'profiles' | 'patients'>('profiles');
  
  // QR Scanner states
  const [isQrScannerOpen, setIsQrScannerOpen] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [scannerSupported, setScannerSupported] = useState<boolean | null>(null);
  const [scanHint, setScanHint] = useState<string>('Đang khởi động camera...');
  const [usingHtml5Qrcode, setUsingHtml5Qrcode] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const lastScanRef = useRef<string | null>(null);
  const lastScanTsRef = useRef<number>(0);
  const scanningRef = useRef(false);
  
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      toast.error('Vui lòng nhập thông tin tìm kiếm');
      return;
    }

    try {
      setIsSearching(true);
      
      if (searchMode === 'profiles') {
        // Search PatientProfiles
        try {
          await patientProfileService.testConnection();
        } catch (testError) {
          console.error('Test connection failed:', testError);
          toast.error('Không thể kết nối đến API. Vui lòng kiểm tra kết nối mạng.');
          return;
        }
        
        const response = await patientProfileService.searchPatientProfiles(searchQuery.trim());
        console.log('Search response:', response); // Debug log
        
        setSearchResults(response.patientProfiles);
        setPatientResults([]); // Clear patient results
        
        if (response.patientProfiles.length === 0) {
          toast.info('Không tìm thấy hồ sơ bệnh nhân nào');
        }
      } else {
        // Search Patients (Users with role 'PATIENT')
        const response = await userService.searchUsers(searchQuery.trim());
        const patients = response.users.filter((user: UserType) => user.role === 'PATIENT');
        
        setPatientResults(patients);
        setSearchResults([]); // Clear profile results
        
        if (patients.length === 0) {
          toast.info('Không tìm thấy bệnh nhân nào');
        }
      }
    } catch (error) {
      console.error('Error searching:', error);
      toast.error('Có lỗi xảy ra khi tìm kiếm');
    } finally {
      setIsSearching(false);
    }
  };

  const handleProfileSelect = useCallback((profile: PatientProfile) => {
    onPatientProfileSelect(profile);
  }, [onPatientProfileSelect]);

  const handlePatientSelect = useCallback((patient: UserType) => {
    if (onPatientSelect) {
      onPatientSelect(patient);
    }
  }, [onPatientSelect]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  const formatGender = (gender: string) => {
    return gender === 'male' ? 'Nam' : gender === 'female' ? 'Nữ' : 'Khác';
  };

  const clearSelection = () => {
    // Reset all selections
    setSearchResults([]);
    setPatientResults([]);
    setSearchQuery('');
    // Notify parent to clear selected profile and patient
    onPatientProfileSelect(null);
    if (onPatientSelect) onPatientSelect(null);
  };

  // QR Scanner handlers
  const stopScanner = useCallback(async () => {
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
    
    // Stop media stream
    const stream = mediaStreamRef.current;
    if (stream) {
      stream.getTracks().forEach(t => t.stop());
      mediaStreamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  const handleQrText = useCallback(async (text: string) => {
    const trimmed = (text || '').trim();
    if (!trimmed) return;
    
    console.log('[QR] Raw:', text);
    
    // Parse mã profile code từ format: PAT:PAT-xxx|... hoặc PAT-xxx|...
    let profileCode = trimmed;
    
    // Kiểm tra nếu có format PAT:PAT-xxx hoặc PAT:PP-xxx
    if (trimmed.includes(':')) {
      const parts = trimmed.split('|');
      // Lấy phần đầu tiên (PAT:PAT-xxx)
      const firstPart = parts[0] || '';
      if (firstPart.includes(':')) {
        // Tách theo dấu : để lấy mã profile code
        const codeParts = firstPart.split(':');
        if (codeParts.length >= 2) {
          profileCode = codeParts[1].trim();
        }
      }
    } else {
      // Nếu không có format đặc biệt, lấy phần đầu trước dấu |
      const codeParts = trimmed.split('|');
      profileCode = codeParts[0]?.trim() || trimmed;
    }
    
    console.log('[QR] Parsed profile code:', profileCode);
    setScanHint(`Đã quét mã: ${profileCode.slice(0, 24)}${profileCode.length > 24 ? '...' : ''}`);
    
    // Điền mã QR vào ô input tìm kiếm
    setSearchQuery(profileCode);
    toast.success(`Đã quét mã: ${profileCode}`);
    
    // Đóng scanner sau khi quét thành công
    setTimeout(() => {
      setIsQrScannerOpen(false);
      stopScanner();
      
      // Tự động thực hiện tìm kiếm sau khi đóng scanner
      setTimeout(async () => {
        if (profileCode.trim()) {
          try {
            setIsSearching(true);
            
            if (searchMode === 'profiles') {
              // Search PatientProfiles
              try {
                await patientProfileService.testConnection();
              } catch (testError) {
                console.error('Test connection failed:', testError);
                toast.error('Không thể kết nối đến API. Vui lòng kiểm tra kết nối mạng.');
                return;
              }
              
              const response = await patientProfileService.searchPatientProfiles(profileCode.trim());
              console.log('Search response:', response);
              
              setSearchResults(response.patientProfiles);
              setPatientResults([]);
              
              if (response.patientProfiles.length === 0) {
                toast.info('Không tìm thấy hồ sơ bệnh nhân nào');
              } else {
                // Tự động chọn kết quả đầu tiên
                const firstResult = response.patientProfiles[0];
                if (firstResult) {
                  handleProfileSelect(firstResult);
                  if (response.patientProfiles.length === 1) {
                    toast.success('Đã chọn hồ sơ bệnh nhân từ QR');
                  } else {
                    toast.warning(`Tìm thấy ${response.patientProfiles.length} hồ sơ, đã chọn hồ sơ đầu tiên`);
                  }
                }
              }
            } else {
              // Search Patients (Users with role 'PATIENT')
              const response = await userService.searchUsers(profileCode.trim());
              const patients = response.users.filter((user: UserType) => user.role === 'PATIENT');
              
              setPatientResults(patients);
              setSearchResults([]);
              
              if (patients.length === 0) {
                toast.info('Không tìm thấy bệnh nhân nào');
              } else {
                // Tự động chọn kết quả đầu tiên
                const firstResult = patients[0];
                if (firstResult && onPatientSelect) {
                  handlePatientSelect(firstResult);
                  if (patients.length === 1) {
                    toast.success('Đã chọn bệnh nhân từ QR');
                  } else {
                    toast.warning(`Tìm thấy ${patients.length} bệnh nhân, đã chọn bệnh nhân đầu tiên`);
                  }
                }
              }
            }
          } catch (error) {
            console.error('Error searching:', error);
            toast.error('Có lỗi xảy ra khi tìm kiếm');
          } finally {
            setIsSearching(false);
          }
        }
      }, 200); // Small delay to ensure scanner is fully closed
    }, 500);
  }, [stopScanner, searchMode, handleProfileSelect, handlePatientSelect, onPatientSelect]);

  const startScanner = useCallback(async () => {
    setScanning(true);
    scanningRef.current = true;
    setScanHint('Đang khởi động camera...');
    
    try {
      // Prefer front camera; fallback to any camera
      let stream: MediaStream | null = null;
      try {
        stream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: { ideal: 'environment' } } // Use back camera for QR scanning
        });
      } catch {
        try {
          stream = await navigator.mediaDevices.getUserMedia({ video: true });
        } catch {
          throw new Error('Không thể truy cập camera. Vui lòng kiểm tra quyền truy cập.');
        }
      }
      
      console.log('[QR] Got media stream:', !!stream);
      mediaStreamRef.current = stream;
      const video = videoRef.current;
      if (!video) {
        console.warn('[QR] videoRef.current is null');
        return;
      }
      
      video.srcObject = stream;
      await video.play();
      console.log('[QR] Video playing, readyState:', video.readyState);

      // Wait until video metadata is ready
      if (video.readyState < 2) {
        await new Promise<void>((resolve) => {
          const onLoaded = () => { resolve(); };
          video.addEventListener('loadeddata', onLoaded, { once: true });
        });
      }
      
      console.log('[QR] Video ready, dimensions:', video.videoWidth, 'x', video.videoHeight);
      setScanHint('Camera đã sẵn sàng. Đưa mã QR vào khung...');

      // Try BarcodeDetector first (native browser API)
      interface BarcodeDetectorInterface {
        detect(image: HTMLVideoElement): Promise<Array<{ rawValue?: string; rawValueText?: string; raw?: string }>>;
      }
      
      // Check if BarcodeDetector is available and supported
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const BD = (window as any).BarcodeDetector;
      const isBarcodeDetectorSupported = typeof BD !== 'undefined';
      
      if (isBarcodeDetectorSupported) {
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
            setScannerSupported(null); // Will try fallback
          }
        }
        
        if (detector) {
          console.log('[QR] BarcodeDetector initialized, starting detection...');
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
                  // Debounce to avoid spam
                  if (lastScanRef.current === norm && now - lastScanTsRef.current < 1500) {
                    // skip duplicate within 1.5s
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
          return; // Successfully started with BarcodeDetector
        }
      }
      
      // Fallback to html5-qrcode library
      console.log('[QR] BarcodeDetector not available, using html5-qrcode fallback...');
      try {
        setScannerSupported(true);
        setUsingHtml5Qrcode(true);
        setScanHint('Đang khởi động bộ quét QR...');
        
        // Stop the current video stream as html5-qrcode will manage its own
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
          
          // Debounce to avoid spam
          if (lastScanRef.current === norm && now - lastScanTsRef.current < 1500) {
            return; // skip duplicate within 1.5s
          }
          
          lastScanRef.current = norm;
          lastScanTsRef.current = now;
          console.log('[QR] Found QR code (html5-qrcode):', norm);
          await handleQrText(norm);
        };
        
        const qrCodeErrorCallback = (errorMessage: string) => {
          // Ignore errors, just keep scanning
          // Only log if it's not a common "not found" error
          if (!errorMessage.includes('No QR code found') && !errorMessage.includes('NotFoundException')) {
            // console.debug('[QR] Scanning...', errorMessage);
          }
        };
        
        // Start scanning
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
          // If environment camera fails, try user-facing camera
          try {
            await html5QrCode.start(
              { facingMode: 'user' },
              config,
              qrCodeSuccessCallback,
              qrCodeErrorCallback
            );
          } catch {
            // Last resort: try default camera
            try {
              const cameraId = await Html5Qrcode.getCameras().then(cameras => cameras[0]?.id);
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
    if (isQrScannerOpen) {
      // Small delay to ensure dialog is rendered
      setTimeout(() => {
        startScanner();
      }, 100);
    } else {
      stopScanner();
    }
    
    return () => {
      stopScanner();
    };
  }, [isQrScannerOpen, startScanner, stopScanner]);

  // Compact version for create page
  if (compact) {
    return (
      <div className="relative" ref={dropdownRef}>
        {/* Selected Patient/Profile Display */}
        {(selectedPatientProfile || selectedPatient) ? (
          <div className="border border-green-200 rounded-lg p-3 bg-green-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <User className="h-4 w-4 text-green-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-green-900 text-sm truncate">
                    {selectedPatientProfile?.name || selectedPatient?.name}
                  </p>
                  <p className="text-xs text-green-700 truncate">
                    {selectedPatientProfile?.profileCode || selectedPatient?.patient?.patientCode} • 
                    {selectedPatientProfile?.dateOfBirth ? formatDate(selectedPatientProfile.dateOfBirth) : 
                     selectedPatient?.dateOfBirth ? formatDate(selectedPatient.dateOfBirth) : ''}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={()=>{ clearSelection()}}
                className="text-green-600 hover:text-green-800 p-1 h-6 w-6"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </div>
        ) : (
          /* Search Input */
          <div className="relative">
            <div className="flex gap-2 items-center">
              <Input
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  // Ẩn result khi input trống
                  if (!e.target.value.trim()) {
                    setSearchResults([]);
                    setPatientResults([]);
                  }
                }}
                placeholder="Tìm kiếm bệnh nhân..."
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="text-sm h-10"
              />
              <Button 
                onClick={handleSearch} 
                disabled={isSearching}
                size="sm"
                className="flex items-center gap-1"
              >
                {isSearching ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Search className="h-3 w-3" />
                )}
                Tìm
              </Button>
              <Button 
                onClick={() => setIsQrScannerOpen(true)}
                variant="outline"
                size="sm"
                className="flex items-center gap-1"
                title="Quét QR code"
              >
                <QrCode className="h-3 w-3" />
              </Button>
            </div>

            {/* Dropdown Results */}
            {(searchResults.length > 0 || patientResults.length > 0) && searchQuery.trim() && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
                <div className="p-3">
                  {/* Patient Profile Results */}
                  {searchResults.map((profile: PatientProfile) => {
                    const isSelected = selectedPatientProfile ? (selectedPatientProfile as PatientProfile).id === profile.id : false;
                    return (
                    <div 
                      key={profile.id} 
                      className={`p-2 rounded cursor-pointer transition-colors text-sm mb-2 last:mb-0 ${
                        isSelected 
                          ? 'bg-green-50 border border-green-200' 
                          : 'hover:bg-gray-50'
                      }`}
                      onClick={() => handleProfileSelect(profile)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                            <User className="h-3 w-3 text-blue-500" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">{profile.name}</p>
                            <p className="text-xs text-gray-500 truncate">
                              {profile.profileCode} • {formatDate(profile.dateOfBirth)}
                              {profile.phone && ` • ${profile.phone}`}
                            </p>
                          </div>
                        </div>
                        {isSelected && (
                          <Check className="h-4 w-4 text-green-600" />
                        )}
                      </div>
                    </div>
                    );
                  })}
                  
                  {/* Patient Results */}
                  {patientResults.map((patient: UserType) => {
                    const isSelected = selectedPatient ? (selectedPatient as UserType).id === patient.id : false;
                    return (
                    <div 
                      key={patient.id} 
                      className={`p-2 rounded cursor-pointer transition-colors text-sm mb-2 last:mb-0 ${
                        isSelected 
                          ? 'bg-green-50 border border-green-200' 
                          : 'hover:bg-gray-50'
                      }`}
                      onClick={() => handlePatientSelect(patient)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center">
                            <User className="h-3 w-3 text-purple-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">{patient.name}</p>
                            <p className="text-xs text-gray-500 truncate">
                              {patient.patient?.patientCode} • {patient.phone}
                            </p>
                          </div>
                        </div>
                        {isSelected && (
                          <Check className="h-4 w-4 text-green-600" />
                        )}
                      </div>
                    </div>
                    );
                  })}
                </div>
              </div>
            )}
                  </div>
      )}

      {/* QR Scanner Dialog */}
      <Dialog open={isQrScannerOpen} onOpenChange={setIsQrScannerOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <QrCode className="h-5 w-5" />
              Quét mã QR hồ sơ bệnh nhân
            </DialogTitle>
            <DialogDescription>
              Đưa mã QR của hồ sơ bệnh nhân (PP...) vào khung hình để quét tự động
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
                style={{ transform: 'scaleX(-1)' }} // Mirror the video
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
    </div>
  );
}

  // Full version (original)
  return (
    <div className="space-y-6">
      {/* Search Section */}
      <div className="border rounded-lg p-4">
        <div className="space-y-4">
          <div className="space-y-2">
            
            {/* Search Mode Toggle */}
            <div className="flex gap-2 my-3">
              <Button
                variant={searchMode === 'profiles' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSearchMode('profiles')}
                className="text-xs"
              >
                Hồ sơ bệnh nhân
              </Button>
              <Button
                variant={searchMode === 'patients' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSearchMode('patients')}
                className="text-xs"
              >
                Tài khoản bệnh nhân
              </Button>
            </div>
            
            <div className="flex gap-2">
              <Input
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  // Ẩn result khi input trống
                  if (!e.target.value.trim()) {
                    setSearchResults([]);
                    setPatientResults([]);
                  }
                }}
                placeholder={searchMode === 'profiles' ? 
                  "Nhập tên, số điện thoại hoặc mã hồ sơ..." : 
                  "Nhập tên, số điện thoại hoặc mã bệnh nhân..."}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="text-sm"
              />
              <Button 
                onClick={handleSearch} 
                disabled={isSearching}
                className="flex items-center gap-2"
              >
                {isSearching ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
                Tìm kiếm
              </Button>
              <Button 
                onClick={() => setIsQrScannerOpen(true)}
                variant="outline"
                className="flex items-center gap-2"
                title="Quét QR code"
              >
                <QrCode className="h-4 w-4" />
                QR
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Search Results */}
      {(searchResults.length > 0 || patientResults.length > 0) && searchQuery.trim() && (
        <div className="border rounded-lg p-4">
          <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
            <User className="h-4 w-4" />
            Kết quả tìm kiếm ({searchResults.length + patientResults.length})
          </h4>
          <div className="space-y-4">
            {/* Patient Profile Results */}
            {searchResults.map((profile: PatientProfile) => (
              <div 
                key={profile.id} 
                className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                  selectedPatientProfile?.id === profile.id 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
                onClick={() => handleProfileSelect(profile)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <User className="h-4 w-4 text-blue-500" />
                    </div>
                    <div>
                      <h5 className="font-medium text-gray-900 text-sm">{profile.name}</h5>
                      <div className="flex items-center gap-3 text-xs text-gray-600">
                        <span className="flex items-center gap-1">
                          <Badge variant="outline" className="text-xs">
                            {profile.profileCode}
                          </Badge>
                        </span>
                        {profile.phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {profile.phone}
                          </span>
                        )}
                        {profile.isActive && (
                          <Badge variant="default" className="text-xs bg-green-100 text-green-800">
                            Hoạt động
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {selectedPatientProfile?.id === profile.id && (
                      <Check className="h-4 w-4 text-blue-500" />
                    )}
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 mt-2">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {formatDate(profile.dateOfBirth)}
                  </span>
                  <span className="flex items-center gap-1">
                    <User className="h-3 w-3" />
                    {formatGender(profile.gender)}
                  </span>
                  <span className="flex items-center gap-1 col-span-2">
                    <MapPin className="h-3 w-3" />
                    {profile.address}
                  </span>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {profile.occupation} • {profile.relationship}
                </div>
              </div>
            ))}
            
            {/* Patient Results */}
            {patientResults.map((patient: UserType) => (
              <div 
                key={patient.id} 
                className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                  selectedPatient && (selectedPatient as UserType).id === patient.id 
                    ? 'border-purple-500 bg-purple-50' 
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
                onClick={() => handlePatientSelect(patient)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                      <User className="h-4 w-4 text-purple-600" />
                    </div>
                    <div>
                      <h5 className="font-medium text-gray-900 text-sm">{patient.name}</h5>
                      <div className="flex items-center gap-3 text-xs text-gray-600">
                        <span className="flex items-center gap-1">
                          <Badge variant="outline" className="text-xs">
                            {patient.patient?.patientCode}
                          </Badge>
                        </span>
                        <span className="flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {patient.phone}
                        </span>
                        <Badge variant="secondary" className="text-xs">
                          Tài khoản
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {selectedPatient && (selectedPatient as UserType).id === patient.id && (
                      <Check className="h-4 w-4 text-purple-600" />
                    )}
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 mt-2">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {formatDate(patient.dateOfBirth)}
                  </span>
                  <span className="flex items-center gap-1">
                    <User className="h-3 w-3" />
                    {formatGender(patient.gender)}
                  </span>
                  <span className="flex items-center gap-1 col-span-2">
                    <MapPin className="h-3 w-3" />
                    {patient.address}
                  </span>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Email: {patient.email}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

     

      {/* Selected Profile/Patient Summary */}
      {(selectedPatientProfile || selectedPatient) && (
        <div className="border-green-200 bg-green-50 rounded-lg p-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <User className="h-5 w-5 text-green-600" />
            </div>
            <div className="flex-1">
              <h4 className="font-medium text-green-900 text-sm">
                {selectedPatientProfile?.name || selectedPatient?.name}
              </h4>
              <p className="text-xs text-green-700">
                {selectedPatientProfile?.profileCode || selectedPatient?.patient?.patientCode} • 
                {selectedPatientProfile?.dateOfBirth ? formatDate(selectedPatientProfile.dateOfBirth) : 
                 selectedPatient?.dateOfBirth ? formatDate(selectedPatient.dateOfBirth) : ''}
                {selectedPatientProfile?.phone && ` • ${selectedPatientProfile.phone}`}
                {selectedPatient?.phone && ` • ${selectedPatient.phone}`}
              </p>
              <p className="text-xs text-green-600 truncate">
                {selectedPatientProfile?.address || selectedPatient?.address}
              </p>
            </div>
            <div className="flex flex-col gap-1">
              <Badge variant="outline" className="text-green-700 border-green-300 text-xs">
                ID: {selectedPatientProfile?.id || selectedPatient?.id}
              </Badge>
              {selectedPatientProfile && (
                <Badge variant="default" className="text-xs bg-blue-100 text-blue-800">
                  Hồ sơ
                </Badge>
              )}
              {selectedPatient && (
                <Badge variant="default" className="text-xs bg-purple-100 text-purple-800">
                  Tài khoản
                </Badge>
              )}
            </div>
          </div>
        </div>
      )}

      {/* QR Scanner Dialog */}
      <Dialog open={isQrScannerOpen} onOpenChange={setIsQrScannerOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <QrCode className="h-5 w-5" />
              Quét mã QR hồ sơ bệnh nhân
            </DialogTitle>
            <DialogDescription>
              Đưa mã QR của hồ sơ bệnh nhân (PP...) vào khung hình để quét tự động
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
                style={{ transform: 'scaleX(-1)' }} // Mirror the video
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
    </div>
  );
}
