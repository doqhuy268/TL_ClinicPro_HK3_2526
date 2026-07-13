// Kiosk Screen Component

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { apiService } from '../services/api';
import { TakeNumberRequest, TakeNumberResponse } from '../types';
import { BrowserQRCodeReader } from '@zxing/browser';

interface KioskScreenProps {
  onBack: () => void;
}

const KioskScreen: React.FC<KioskScreenProps> = ({ onBack }) => {
  const [formData, setFormData] = useState<TakeNumberRequest>({
    isPregnant: false,
    isDisabled: false,
    isElderly: false,
    isVIP: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<TakeNumberResponse | null>(null);
  const currentYear = useMemo(() => new Date().getFullYear(), []);
  const [birthYear, setBirthYear] = useState<number | undefined>(currentYear - 18);

  // QR Scanner
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const codeReaderRef = useRef<any>(null);
  const scannerControlsRef = useRef<any>(null);
  const [scannerError, setScannerError] = useState<string | null>(null);
  const [scannerStatus, setScannerStatus] = useState<string>('');
  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | undefined>(undefined);
  const hasSubmittedRef = useRef<boolean>(false);
  const lastCodeRef = useRef<string | null>(null);
  const lastScanTimeRef = useRef<number>(0);
  const scanningActiveRef = useRef<boolean>(false);
  const isSubmittingRef = useRef<boolean>(false);

  // Dialog chọn loại khám sau khi quét QR patient profile (PP)
  const [showServiceTypeDialog, setShowServiceTypeDialog] = useState<boolean>(false);
  // Dialog xác nhận lấy số từ appointment QR
  const [showAppointmentConfirmDialog, setShowAppointmentConfirmDialog] = useState<boolean>(false);
  // Thông tin appointment đã quét QR
  const [scannedAppointmentInfo, setScannedAppointmentInfo] = useState<{
    appointmentCode: string;
    appointmentDate?: string;
    startTime?: string;
    endTime?: string;
    doctorName?: string;
    specialtyName?: string;
    isTooEarly: boolean; // Sớm hơn 15 phút
  } | null>(null);
  // Thông tin bệnh nhân đã quét QR
  const [scannedPatientInfo, setScannedPatientInfo] = useState<{
    name: string;
    age: number;
    gender: 'MALE' | 'FEMALE' | 'OTHER' | 'UNKNOWN';
    profileCode: string;
  } | null>(null);
  const [searchingPatientByPhone, setSearchingPatientByPhone] = useState(false);


  // Password modal for going back
  const [showPasswordModal, setShowPasswordModal] = useState<boolean>(false);
  const [passwordInput, setPasswordInput] = useState<string>('');
  const [passwordError, setPasswordError] = useState<string | null>(null);
  
  // Get password from env
  const ADMIN_PASSWORD = (process.env.PASSWORD as string) || '123456789';

  // AI Triage
  const [showAITriage, setShowAITriage] = useState<boolean>(false);
  const [triageSymptoms, setTriageSymptoms] = useState<string>('');
  const [triageResult, setTriageResult] = useState<{ suggestedSpecialty: string; reasoning: string } | null>(null);
  const [triageLoading, setTriageLoading] = useState<boolean>(false);
  const [triageError, setTriageError] = useState<string | null>(null);

  const updateField = (field: keyof TakeNumberRequest, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleAITriage = async () => {
    if (!triageSymptoms.trim()) return;
    setTriageLoading(true);
    setTriageError(null);
    setTriageResult(null);
    try {
      const result = await apiService.triageSymptoms(triageSymptoms.trim());
      setTriageResult(result);
    } catch (err: any) {
      setTriageError(err?.message || 'Không thể kết nối dịch vụ AI. Vui lòng thử lại.');
    } finally {
      setTriageLoading(false);
    }
  };

  const applyAITriage = () => {
    if (!triageResult) return;
    const suggestion = `[AI gợi ý] Chuyên khoa: ${triageResult.suggestedSpecialty}. Lý do: ${triageResult.reasoning}`;
    updateField('notes', suggestion);
    setShowAITriage(false);
    setTriageSymptoms('');
    setTriageResult(null);
    setTriageError(null);
  };

  // Tự động tìm PatientProfile khi nhập số điện thoại
  useEffect(() => {
    const phone = formData.patientPhone?.trim();
    
    // Chỉ tìm kiếm nếu:
    // - Có số điện thoại (ít nhất 10 ký tự)
    // - Chưa có patientProfileCode hoặc appointmentCode (để tránh ghi đè khi đã quét QR)
    // - Chưa có tên bệnh nhân (để tránh ghi đè khi đã nhập thủ công)
    if (phone && phone.length >= 10 && !formData.patientProfileCode && !formData.appointmentCode && !formData.patientName) {
      const timeoutId = setTimeout(async () => {
        setSearchingPatientByPhone(true);
        try {
          const patientInfo = await apiService.getPatientProfileByPhone(phone);
          if (patientInfo) {
            // Tự động điền thông tin
            updateField('patientName', patientInfo.name);
            updateField('patientAge', patientInfo.age);
            updateField('patientGender', patientInfo.gender);
            updateField('patientProfileCode', patientInfo.profileCode);
            if (patientInfo.isPregnant !== undefined) {
              updateField('isPregnant', patientInfo.isPregnant);
            }
            if (patientInfo.isDisabled !== undefined) {
              updateField('isDisabled', patientInfo.isDisabled);
            }
            
            // Cập nhật birthYear
            if (patientInfo.dateOfBirth) {
              const birthDate = new Date(patientInfo.dateOfBirth);
              setBirthYear(birthDate.getFullYear());
            } else if (patientInfo.age) {
              const calculatedBirthYear = currentYear - patientInfo.age;
              setBirthYear(calculatedBirthYear);
            }
            
            // Tự động set isElderly nếu tuổi >= 75
            if (patientInfo.age >= 75) {
              updateField('isElderly', true);
            }
          }
        } catch (error) {
          console.error('Error searching patient by phone:', error);
        } finally {
          setSearchingPatientByPhone(false);
        }
      }, 500); // Debounce 500ms
      
      return () => clearTimeout(timeoutId);
    }
  }, [formData.patientPhone, formData.patientProfileCode, formData.appointmentCode, formData.patientName, currentYear]);

  const handleBackClick = () => {
    setShowPasswordModal(true);
    setPasswordInput('');
    setPasswordError(null);
  };

  const handlePasswordSubmit = () => {
    if (passwordInput === ADMIN_PASSWORD) {
      setShowPasswordModal(false);
      setPasswordInput('');
      setPasswordError(null);
      onBack();
    } else {
      setPasswordError('Mật khẩu không đúng. Vui lòng thử lại.');
      setPasswordInput('');
    }
  };

  const handlePasswordCancel = () => {
    setShowPasswordModal(false);
    setPasswordInput('');
    setPasswordError(null);
  };

  const setGender = (gender: 'MALE' | 'FEMALE' | 'OTHER' | undefined) => {
    // Đảm bảo gửi đúng giá trị, không phải undefined
    if (gender === undefined) {
      updateField('patientGender', undefined);
    } else {
      updateField('patientGender', gender);
    }
    // Nếu chọn Nam thì bỏ chọn mang thai
    if (gender === 'MALE') {
      updateField('isPregnant', false);
    }
  };

  const handlePregnantChange = (checked: boolean) => {
    // Nếu đang là "Khác" mà chọn mang thai thì tự động đổi thành Nữ
    if (checked && formData.patientGender === 'OTHER') {
      setGender('FEMALE');
    }
    updateField('isPregnant', checked);
  };

  const handleBirthYearChange = (year: number | undefined) => {
    setBirthYear(year);
    if (year) {
      const age = Math.max(0, currentYear - year);
      updateField('patientAge', age);
      // Tự động set isElderly = true nếu tuổi >= 75
      if (age >= 75) {
        updateField('isElderly', true);
      } else {
        updateField('isElderly', false);
      }
    } else {
      updateField('patientAge', undefined);
      updateField('isElderly', false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);
      // Tự động set isElderly dựa trên tuổi trước khi submit
      const finalFormData = { ...formData };
      if (finalFormData.patientAge !== undefined) {
        finalFormData.isElderly = finalFormData.patientAge >= 75;
      }
      
      // Đảm bảo gửi đúng dữ liệu, loại bỏ các trường undefined
      const payload: TakeNumberRequest = {
        ...finalFormData,
        // Đảm bảo giới tính được gửi đúng (không phải undefined nếu đã chọn)
        patientGender: finalFormData.patientGender || undefined,
      };
      console.log('[KioskScreen] Submitting form data:', payload);
      const res = await apiService.takeNumber(payload);
      
      // Khi submit thủ công, không cập nhật lại form với dữ liệu từ API
      // (chỉ cập nhật khi quét QR để hiển thị thông tin từ database)
      // Chỉ cập nhật birthYear dựa trên tuổi từ API nếu có
      if (res?.patientInfo?.age) {
        const age = res.patientInfo.age;
        const calculatedBirthYear = currentYear - age;
        setBirthYear(calculatedBirthYear);
      }
      
      setResult(res);
    } catch (err: any) {
      // Extract detailed error message
      let errorMsg = 'Không thể bốc số. Vui lòng thử lại.';
      if (err?.message) {
        errorMsg = err.message;
      } else if (err?.status) {
        errorMsg = `Lỗi ${err.status}: ${err.statusText || 'Không thể kết nối đến server'}`;
      } else if (typeof err === 'string') {
        errorMsg = err;
      }
      setError(errorMsg);
      console.error('Take number error:', err);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({ 
      isPregnant: false, 
      isDisabled: false, 
      isElderly: false, 
      isVIP: false,
      patientName: undefined,
      patientAge: undefined,
      patientGender: undefined,
      patientPhone: undefined,
      notes: undefined,
      patientProfileCode: undefined,
      appointmentCode: undefined,
    });
    setResult(null);
    setError(null);
    setBirthYear(currentYear - 18);
  };

  // Lấy thông tin bệnh nhân từ mã QR và hiển thị dialog chọn loại khám
  const handleQRScanned = async (codeText: string) => {
    if (!codeText) return;
    const text = codeText.toString().trim();

    // Parse QR code: có thể có format "PP_01|PAT001" hoặc "APT-xxx|..." hoặc chỉ "PP_01" hoặc "APT-xxx"
    // Lấy phần đầu tiên trước dấu | nếu có
    let parsedCode = text;
    if (text.includes('|')) {
      const parts = text.split('|');
      parsedCode = parts[0]?.trim() || text;
    }

    // Xử lý mã appointment (APT-)
    if (parsedCode.startsWith('APT-')) {
      console.log('📅 [APPOINTMENT QR] Processing appointment code:', parsedCode);
      
      // Double check để đảm bảo không có duplicate request
      if (hasSubmittedRef.current || isSubmittingRef.current) {
        console.log('⚠️ [APPOINTMENT QR] Already submitting, skipping');
        return;
      }
      
      // Set flag ngay lập tức để block các request khác
      isSubmittingRef.current = true;
      console.log('🔒 [APPOINTMENT QR] Lock set, proceeding with API call...');

      try {
        setLoading(true);
        setError(null);
        stopScanner();
        
        console.log('🌐 [APPOINTMENT QR] Calling API to get appointment info...');
        // Lấy thông tin appointment từ API
        const appointmentInfo = await apiService.getAppointmentByCode(parsedCode);
        console.log('✅ [APPOINTMENT QR] Received appointment info:', appointmentInfo);
        
        if (!appointmentInfo || !appointmentInfo.patientProfile) {
          setError('Không tìm thấy thông tin lịch hẹn.');
          isSubmittingRef.current = false;
          startScanner();
          return;
        }

        const patientProfile = appointmentInfo.patientProfile;
        
        // Normalize gender từ database format sang enum format
        const normalizeGender = (gender: string | null | undefined): 'MALE' | 'FEMALE' | 'OTHER' | 'UNKNOWN' => {
          if (!gender) return 'UNKNOWN';
          const genderLower = String(gender).toLowerCase();
          if (genderLower === 'male' || genderLower === 'm' || genderLower === 'nam') {
            return 'MALE';
          } else if (genderLower === 'female' || genderLower === 'f' || genderLower === 'nữ') {
            return 'FEMALE';
          } else if (genderLower === 'other' || genderLower === 'o' || genderLower === 'khác') {
            return 'OTHER';
          }
          return 'UNKNOWN';
        };
        
        const normalizedGender: 'MALE' | 'FEMALE' | 'OTHER' | 'UNKNOWN' = normalizeGender(patientProfile.gender);
        
        console.log('📋 [APPOINTMENT QR] Patient profile:', patientProfile);
        console.log('📋 [APPOINTMENT QR] Normalized gender:', normalizedGender);
        
        // Lưu thông tin bệnh nhân
        const scannedInfo = {
          name: patientProfile.name,
          age: patientProfile.age || 0,
          gender: normalizedGender,
          profileCode: patientProfile.profileCode,
        };
        setScannedPatientInfo(scannedInfo);
        
        // Cập nhật form với thông tin từ API
        updateField('patientName', patientProfile.name);
        updateField('patientAge', patientProfile.age || undefined);
        updateField('patientGender', normalizedGender);
        updateField('patientProfileCode', patientProfile.profileCode);
        updateField('appointmentCode', parsedCode); // Điền mã appointment
        if (patientProfile.isPregnant !== undefined) {
          updateField('isPregnant', patientProfile.isPregnant);
        }
        if (patientProfile.isDisabled !== undefined) {
          updateField('isDisabled', patientProfile.isDisabled);
        }
        
        // Cập nhật birthYear dựa trên tuổi từ API
        if (patientProfile.age) {
          const calculatedBirthYear = currentYear - patientProfile.age;
          setBirthYear(calculatedBirthYear);
          // Tự động set isElderly = true nếu tuổi >= 75
          updateField('isElderly', patientProfile.age >= 75);
        }
        
        // Kiểm tra thời gian: nếu đến sớm hơn 15 phút so với lịch hẹn
        let isTooEarly = false;
        if (appointmentInfo.appointmentDate && appointmentInfo.startTime) {
          try {
            // appointmentDate format: "YYYY-MM-DD", startTime format: "HH:mm" hoặc "HH:mm:ss"
            const dateStr = appointmentInfo.appointmentDate;
            const timeStr = appointmentInfo.startTime.split(':').slice(0, 2).join(':'); // Chỉ lấy HH:mm
            const appointmentDateTime = new Date(`${dateStr}T${timeStr}:00`);
            const now = new Date();
            
            // Kiểm tra nếu appointmentDateTime hợp lệ
            if (!isNaN(appointmentDateTime.getTime())) {
              const diffMinutes = (appointmentDateTime.getTime() - now.getTime()) / (1000 * 60);
              
              if (diffMinutes > 15) {
                isTooEarly = true;
                console.log(`⚠️ [APPOINTMENT QR] Patient arrived too early: ${diffMinutes.toFixed(1)} minutes before appointment`);
                console.log(`📅 [APPOINTMENT QR] Appointment time: ${appointmentDateTime.toLocaleString('vi-VN')}`);
                console.log(`🕐 [APPOINTMENT QR] Current time: ${now.toLocaleString('vi-VN')}`);
              } else {
                console.log(`✅ [APPOINTMENT QR] Patient arrived on time or late: ${diffMinutes.toFixed(1)} minutes difference`);
              }
            } else {
              console.warn('⚠️ [APPOINTMENT QR] Invalid appointment date/time format');
            }
          } catch (err) {
            console.error('❌ [APPOINTMENT QR] Error calculating time difference:', err);
          }
        }
        
        // Lưu thông tin appointment để hiển thị dialog xác nhận
        setScannedAppointmentInfo({
          appointmentCode: parsedCode,
          appointmentDate: appointmentInfo.appointmentDate,
          startTime: appointmentInfo.startTime,
          endTime: appointmentInfo.endTime,
          doctorName: appointmentInfo.doctor?.name,
          specialtyName: appointmentInfo.specialty?.name,
          isTooEarly: isTooEarly,
        });
        
        // Hiển thị dialog xác nhận thay vì tự động submit
        console.log('✅ [APPOINTMENT QR] Successfully processed, showing confirmation dialog');
        // Reset flag để cho phép user click xác nhận
        isSubmittingRef.current = false;
        setShowAppointmentConfirmDialog(true);
      } catch (err: any) {
        // Extract detailed error message
        let errorMsg = 'Không thể lấy thông tin lịch hẹn từ QR.';
        if (err?.message) {
          errorMsg = err.message;
        } else if (err?.status) {
          errorMsg = `Lỗi ${err.status}: ${err.statusText || 'Không thể kết nối đến server'}`;
        } else if (typeof err === 'string') {
          errorMsg = err;
        }
        setError(errorMsg);
        console.error('Get appointment from QR error:', err);
        // Reset flag để có thể scan lại
        isSubmittingRef.current = false;
        // Tiếp tục quét lại
        startScanner();
      } finally {
        setLoading(false);
      }
      return;
    }

    // Xử lý mã patient profile (PP)
    if (!parsedCode.startsWith('PP')) {
      setError('Mã QR không hợp lệ. Vui lòng quét mã bệnh nhân (PP...) hoặc mã lịch hẹn (APT-...)');
      // Reset flag nếu không phải mã hợp lệ (chỉ reset nếu đã được set từ scanner callback)
      if (isSubmittingRef.current) {
        isSubmittingRef.current = false;
      }
      return;
    }

    // Double check để đảm bảo không có duplicate request
    if (hasSubmittedRef.current || isSubmittingRef.current) {
      console.log('⚠️ [PATIENT PROFILE QR] Already submitting, skipping');
      return;
    }
    
    // Set flag ngay lập tức để block các request khác
    isSubmittingRef.current = true;
    console.log('🔒 [PATIENT PROFILE QR] Lock set, proceeding with API call...');

    try {
      setLoading(true);
      setError(null);
      stopScanner();
      
      // Lấy thông tin bệnh nhân từ mã profile (chỉ lấy phần mã profile, không lấy phần sau dấu |)
      const patientInfo = await apiService.getPatientProfileByCode(parsedCode);
      
      // Lưu thông tin bệnh nhân
      const scannedInfo = {
        name: patientInfo.name,
        age: patientInfo.age,
        gender: patientInfo.gender,
        profileCode: patientInfo.profileCode,
      };
      setScannedPatientInfo(scannedInfo);
      
      // Cập nhật form với thông tin từ API
      updateField('patientName', patientInfo.name);
      updateField('patientAge', patientInfo.age);
      updateField('patientGender', patientInfo.gender);
      updateField('patientProfileCode', patientInfo.profileCode);
      if (patientInfo.isPregnant !== undefined) {
        updateField('isPregnant', patientInfo.isPregnant);
      }
      if (patientInfo.isDisabled !== undefined) {
        updateField('isDisabled', patientInfo.isDisabled);
      }
      
      // Cập nhật birthYear dựa trên tuổi từ API
      if (patientInfo.age) {
        const calculatedBirthYear = currentYear - patientInfo.age;
        setBirthYear(calculatedBirthYear);
        // Tự động set isElderly = true nếu tuổi >= 75
        updateField('isElderly', patientInfo.age >= 75);
      }
      
      // Hiển thị dialog chọn loại khám (chỉ cho patient profile QR)
      setShowServiceTypeDialog(true);
      // KHÔNG reset isSubmittingRef ở đây - giữ nó để block các scan tiếp theo cho đến khi dialog đóng
      console.log('✅ [PATIENT PROFILE QR] Successfully processed, showing service type dialog');
    } catch (err: any) {
      // Extract detailed error message
      let errorMsg = 'Không thể lấy thông tin bệnh nhân từ QR.';
      if (err?.message) {
        errorMsg = err.message;
      } else if (err?.status) {
        errorMsg = `Lỗi ${err.status}: ${err.statusText || 'Không thể kết nối đến server'}`;
      } else if (typeof err === 'string') {
        errorMsg = err;
      }
      setError(errorMsg);
      console.error('Get patient profile from QR error:', err);
      // Reset flag để có thể scan lại
      isSubmittingRef.current = false;
      // Tiếp tục quét lại
      startScanner();
    } finally {
      setLoading(false);
    }
  };

  // Submit từ appointment confirmation (luôn isVIP = false)
  const submitAppointmentConfirm = async () => {
    console.log('🔵 [APPOINTMENT CONFIRM] Function called');
    console.log('🔵 [APPOINTMENT CONFIRM] scannedPatientInfo:', scannedPatientInfo);
    console.log('🔵 [APPOINTMENT CONFIRM] scannedAppointmentInfo:', scannedAppointmentInfo);
    console.log('🔵 [APPOINTMENT CONFIRM] isSubmittingRef:', isSubmittingRef.current);
    console.log('🔵 [APPOINTMENT CONFIRM] hasSubmittedRef:', hasSubmittedRef.current);
    
    if (!scannedPatientInfo) {
      console.error('❌ [APPOINTMENT CONFIRM] No scanned patient info');
      setError('Không có thông tin bệnh nhân. Vui lòng quét lại QR.');
      return;
    }

    if (!scannedAppointmentInfo) {
      console.error('❌ [APPOINTMENT CONFIRM] No scanned appointment info');
      setError('Không có thông tin lịch hẹn. Vui lòng quét lại QR.');
      return;
    }

    if (hasSubmittedRef.current || isSubmittingRef.current) {
      console.log('⚠️ [APPOINTMENT CONFIRM] Already submitting, skipping');
      return;
    }
    
    isSubmittingRef.current = true;
    hasSubmittedRef.current = true;

    try {
      setLoading(true);
      setError(null);
      setShowAppointmentConfirmDialog(false);
      
      const payload: TakeNumberRequest = {
        ...formData,
        patientProfileCode: scannedPatientInfo.profileCode,
        isVIP: false, // Appointment luôn là khám thường
        appointmentCode: scannedAppointmentInfo.appointmentCode,
        // Đảm bảo gửi đúng thông tin đã có
        patientName: scannedPatientInfo.name,
        patientAge: scannedPatientInfo.age,
        patientGender: scannedPatientInfo.gender,
      };
      
      console.log('🚀 [APPOINTMENT CONFIRM] Submitting take number request:', JSON.stringify(payload, null, 2));
      const res = await apiService.takeNumber(payload);
      console.log('✅ [APPOINTMENT CONFIRM] Successfully got number:', res);
      
      // QUAN TRỌNG: Clear tất cả state liên quan để tránh dialog tự động hiển thị lại
      setScannedAppointmentInfo(null);
      setScannedPatientInfo(null);
      setShowAppointmentConfirmDialog(false);
      
      // Reset flags và QR scan tracking
      isSubmittingRef.current = false;
      // QUAN TRỌNG: Giữ hasSubmittedRef = true để tránh submit lại cho đến khi form được reset
      // hasSubmittedRef sẽ được reset trong useEffect khi result = null
      lastCodeRef.current = null;
      lastScanTimeRef.current = 0;
      
      setResult(res);
    } catch (err: any) {
      // Extract detailed error message
      let errorMsg = 'Không thể bốc số từ QR.';
      if (err?.message) {
        errorMsg = err.message;
      } else if (err?.status) {
        errorMsg = `Lỗi ${err.status}: ${err.statusText || 'Không thể kết nối đến server'}`;
      } else if (typeof err === 'string') {
        errorMsg = err;
      }
      setError(errorMsg);
      console.error('❌ [APPOINTMENT CONFIRM] Take number from appointment QR error:', err);
      // Mở lại dialog để thử lại
      setShowAppointmentConfirmDialog(true);
      // Reset flags để có thể thử lại
      isSubmittingRef.current = false;
      hasSubmittedRef.current = false;
    } finally {
      setLoading(false);
    }
  };

  // Submit với thông tin đã có và lựa chọn loại khám (cho patient profile QR)
  const submitWithScannedInfo = async (isVIP: boolean) => {
    if (!scannedPatientInfo) {
      console.error('❌ [SUBMIT] No scanned patient info');
      return;
    }

    if (hasSubmittedRef.current || isSubmittingRef.current) {
      console.log('⚠️ [SUBMIT] Already submitting, skipping');
      return;
    }
    
    isSubmittingRef.current = true;
    hasSubmittedRef.current = true;

    try {
      setLoading(true);
      setError(null);
      setShowServiceTypeDialog(false);
      
      const payload: TakeNumberRequest = {
        ...formData,
        patientProfileCode: scannedPatientInfo.profileCode,
        isVIP: isVIP,
        // Đảm bảo gửi đúng thông tin đã có
        patientName: scannedPatientInfo.name,
        patientAge: scannedPatientInfo.age,
        patientGender: scannedPatientInfo.gender,
      };
      
      console.log('🚀 [SUBMIT] Submitting take number request:', payload);
      const res = await apiService.takeNumber(payload);
      console.log('✅ [SUBMIT] Successfully got number:', res);
      
      // QUAN TRỌNG: Clear tất cả state liên quan để tránh dialog tự động hiển thị lại
      setScannedPatientInfo(null);
      setShowServiceTypeDialog(false);
      
      // Reset flags và QR scan tracking
      isSubmittingRef.current = false;
      // QUAN TRỌNG: Giữ hasSubmittedRef = true để tránh submit lại cho đến khi form được reset
      // hasSubmittedRef sẽ được reset trong useEffect khi result = null
      lastCodeRef.current = null;
      lastScanTimeRef.current = 0;
      
      setResult(res);
    } catch (err: any) {
      // Extract detailed error message
      let errorMsg = 'Không thể bốc số từ QR.';
      if (err?.message) {
        errorMsg = err.message;
      } else if (err?.status) {
        errorMsg = `Lỗi ${err.status}: ${err.statusText || 'Không thể kết nối đến server'}`;
      } else if (typeof err === 'string') {
        errorMsg = err;
      }
      setError(errorMsg);
      console.error('Take number from QR error:', err);
      // Mở lại dialog để thử lại (chỉ cho patient profile QR)
      if (scannedPatientInfo) {
        setShowServiceTypeDialog(true);
      }
    } finally {
      isSubmittingRef.current = false;
      setLoading(false);
    }
  };


  const startScanner = async () => {
    try {
      if (scanningActiveRef.current) return; // prevent parallel decoders
      // ensure no dangling sessions
      stopScanner();
      setScannerError(null);
      setScannerStatus('Đang khởi tạo camera...');
      if (!codeReaderRef.current) {
        codeReaderRef.current = new BrowserQRCodeReader();
      }
      const devices = await navigator.mediaDevices.enumerateDevices();
      const cams = devices.filter(d => d.kind === 'videoinput');
      setVideoDevices(cams);
      const deviceId = selectedDeviceId || cams[0]?.deviceId;
      if (!cams || cams.length === 0 || !deviceId) {
        setScannerError('Không tìm thấy camera.');
        setScannerStatus('');
        return;
      }
      const videoElem = videoRef.current;
      if (!videoElem) return;
      setScannerStatus('Camera đã bật. Đang quét...');
      scanningActiveRef.current = true;
      await codeReaderRef.current.decodeFromVideoDevice(deviceId, videoElem, (result: any, err: any, controls: any) => {
        if (controls && !scannerControlsRef.current) {
          scannerControlsRef.current = controls;
        }
        if (result?.getText) {
          const text = (result.getText() || '').toString().trim();
          const now = Date.now();
          
          console.log('🔍 [QR SCANNER] Raw QR text:', text);
          console.log('🔍 [QR SCANNER] hasSubmittedRef:', hasSubmittedRef.current);
          console.log('🔍 [QR SCANNER] isSubmittingRef:', isSubmittingRef.current);
          console.log('🔍 [QR SCANNER] lastCodeRef:', lastCodeRef.current);
          console.log('🔍 [QR SCANNER] Time since last scan:', now - lastScanTimeRef.current);
          
          // Kiểm tra duplicate và đang xử lý TRƯỚC KHI parse
          if (hasSubmittedRef.current || isSubmittingRef.current) {
            console.log('⚠️ [QR SCANNER] Already processing, ignoring');
            return;
          }
          
          // Check duplicate scan (tăng thời gian debounce lên 5 giây)
          if (text === lastCodeRef.current && now - lastScanTimeRef.current < 5000) {
            console.log('🔍 [QR SCANNER] Duplicate scan, ignoring');
            return;
          }
          
          // Parse QR code để lấy mã profile hoặc appointment
          let parsedCode = text;
          
          // Nếu có dấu |, lấy phần đầu tiên
          if (text.includes('|')) {
            const parts = text.split('|');
            parsedCode = parts[0]?.trim() || text;
            console.log('🔍 [QR SCANNER] Parsed code (before |):', parsedCode);
          }
          
          console.log('🔍 [QR SCANNER] Final parsed code:', parsedCode);
          console.log('🔍 [QR SCANNER] Starts with PP?', parsedCode.startsWith('PP'));
          console.log('🔍 [QR SCANNER] Starts with APT-?', parsedCode.startsWith('APT-'));
          
          // Xử lý cả mã PP (patient profile) và APT- (appointment)
          if (parsedCode.startsWith('PP') || parsedCode.startsWith('APT-')) {
            console.log('✅ [QR SCANNER] Valid QR code detected:', parsedCode);
            
            // QUAN TRỌNG: Set flags TRƯỚC KHI xử lý để tránh duplicate requests
            lastCodeRef.current = text;
            lastScanTimeRef.current = now;
            // KHÔNG set isSubmittingRef ở đây - để handleQRScanned tự set sau khi check
            
            // Dừng scanner ngay lập tức
            try { 
              scannerControlsRef.current?.stop?.(); 
              console.log('🛑 [QR SCANNER] Scanner stopped');
            } catch (e) {
              console.error('Error stopping scanner:', e);
            }
            scanningActiveRef.current = false;
            
            console.log('🚀 [QR SCANNER] Calling handleQRScanned with:', parsedCode);
            // Gọi handleQRScanned - nó sẽ tự set isSubmittingRef sau khi check
            handleQRScanned(parsedCode).catch((err) => {
              console.error('❌ [QR SCANNER] Error in handleQRScanned:', err);
              // Reset flags nếu có lỗi để có thể scan lại
              isSubmittingRef.current = false;
              lastCodeRef.current = null;
              lastScanTimeRef.current = 0;
            });
          } else {
            console.log('❌ [QR SCANNER] QR code does not match expected format (PP or APT-), ignoring');
          }
        }
        if (err && (err as any).name === 'NotFoundException') {
          // ignore
        }
      });
    } catch (e: any) {
      setScannerError(e?.message || 'Không thể khởi tạo camera.');
      setScannerStatus('');
    }
  };

  const stopScanner = () => {
    try {
      scannerControlsRef.current?.stop?.();
      (codeReaderRef.current as any)?.reset?.();
      const stream = (videoRef.current?.srcObject as any) as MediaStream | null;
      if (stream) {
        stream.getTracks().forEach((t: MediaStreamTrack) => {
          try { t.stop(); } catch {}
        });
      }
      if (videoRef.current) {
        // @ts-ignore
        videoRef.current.srcObject = null;
      }
      setScannerStatus('Đã tắt camera');
      scanningActiveRef.current = false;
    } catch {}
  };

  useEffect(() => {
    if (!result) {
      hasSubmittedRef.current = false;
      lastCodeRef.current = null;
      lastScanTimeRef.current = 0;
      isSubmittingRef.current = false;
      // Tự động bật scanner khi component mount
      startScanner();
    }
    return () => {
      stopScanner();
    };
  }, [result, selectedDeviceId]);

  // Tự động bật scanner khi component mount lần đầu
  useEffect(() => {
    if (!result && !scanningActiveRef.current) {
      startScanner();
    }
  }, []);

  // Tính tuổi từ birthYear chỉ khi không có patientProfileCode hoặc appointmentCode
  // (tránh ghi đè dữ liệu từ API khi quét QR)
  useEffect(() => {
    if (birthYear && !formData.patientAge && !formData.patientProfileCode && !formData.appointmentCode) {
      const age = Math.max(0, currentYear - birthYear);
      updateField('patientAge', age);
    }
  }, [birthYear, currentYear, formData.patientProfileCode, formData.appointmentCode]);

  // Tự động set isElderly dựa trên patientAge
  useEffect(() => {
    if (formData.patientAge !== undefined) {
      const shouldBeElderly = formData.patientAge >= 75;
      setFormData(prev => {
        // Chỉ cập nhật nếu giá trị khác với giá trị hiện tại để tránh vòng lặp
        if (prev.isElderly !== shouldBeElderly) {
          return { ...prev, isElderly: shouldBeElderly };
        }
        return prev;
      });
    } else {
      setFormData(prev => {
        // Nếu không có tuổi thì set về false
        if (prev.isElderly) {
          return { ...prev, isElderly: false };
        }
        return prev;
      });
    }
  }, [formData.patientAge]);

  if (loading) {
    return (
      <div className="h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center overflow-hidden">
        <div className="text-center">
          <div className="animate-spin rounded-full h-14 w-14 border-4 border-teal-200 border-t-teal-600 mx-auto mb-5"></div>
          <h2 className="text-xl font-bold text-slate-800 mb-2">Đang xử lý...</h2>
          <p className="text-slate-500">Vui lòng chờ trong giây lát</p>
        </div>
      </div>
    );
  }

  if (result) {
    const t = result.ticket;
    // Auto print or save PDF, then do not keep this screen around
    (async () => {
      try {
        const html = `<!doctype html><html><head><meta charset="utf-8"/><style>
          body{font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;padding:24px}
          .title{font-size:24px;font-weight:800;margin-bottom:12px}
          .code{font-size:40px;font-weight:900;margin-bottom:4px}
          .label{color:#555}
          .row{display:flex;gap:24px;flex-wrap:wrap}
          .cell{min-width:220px;margin:6px 0}
        </style></head><body>
        <div class="title">PHIẾU KHÁM BỆNH</div>
        <div class="code">${t.queueNumber}</div>
        <div class="row">
          <div class="cell"><span class="label">Tên:</span> ${t.patientName}</div>
          <div class="cell"><span class="label">Quầy:</span> ${t.counterCode} - ${t.counterName}</div>
          <div class="cell"><span class="label">Ưu tiên:</span> ${t.priorityLevel || 'Không có'}</div>
          <div class="cell"><span class="label">Giờ nhận:</span> ${new Date(t.assignedAt).toLocaleTimeString()}</div>
        </div>
        </body></html>`;
        await window.kiosk?.printOrSaveTicket?.(html);
        // Auto reset to kiosk form for next patient
        setTimeout(() => {
          try { resetForm(); } catch {}
        }, 200);
      } catch {}
    })();
    return (
      <div className="h-screen bg-gradient-to-br from-slate-50 to-slate-100 overflow-hidden p-5">
        <div className="h-full w-full flex flex-col">
          <div className="flex items-center justify-between pb-4 border-b border-slate-200">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Kiosk Bốc Số</h1>
              <p className="text-base text-emerald-600 font-medium">✓ Bốc số thành công</p>
            </div>
            <button onClick={handleBackClick} className="border border-slate-200 px-4 py-2 text-slate-600 hover:bg-white rounded-xl transition-all">← Trang chính</button>
          </div>

          <div className="flex-1 flex items-stretch gap-4 pt-4">
            <div className="flex-1 bg-white border border-slate-200 rounded-2xl p-8 flex flex-col justify-center shadow-sm">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-teal-600 to-emerald-600 mb-4 shadow-lg shadow-teal-600/20">
                  <span className="text-3xl font-black text-white">{t.queueNumber}</span>
                </div>
                <div className="text-base text-slate-500 mb-6 font-medium">Số thứ tự của bạn</div>
                <div className="grid grid-cols-2 gap-x-8 gap-y-3 text-slate-700 text-base">
                  <div><span className="font-semibold text-slate-900">Tên:</span> {t.patientName}</div>
                  <div><span className="font-semibold text-slate-900">Quầy:</span> {t.counterCode} - {t.counterName}</div>
                  <div><span className="font-semibold text-slate-900">Ưu tiên:</span> {t.priorityLevel || 'Không có'}</div>
                  <div><span className="font-semibold text-slate-900">Giờ nhận:</span> {new Date(t.assignedAt).toLocaleTimeString()}</div>
                </div>
                <div className="mt-8 flex justify-center gap-3">
                  <button onClick={() => { resetForm(); }} className="bg-gradient-to-r from-teal-600 to-emerald-600 text-white px-6 py-2.5 font-semibold rounded-xl hover:from-teal-700 hover:to-emerald-700 transition-all shadow-md">Bốc số khác</button>
                  <button onClick={handleBackClick} className="border border-slate-200 px-6 py-2.5 text-slate-600 rounded-xl hover:bg-slate-50 transition-all">Về trang chính</button>
                </div>
              </div>
            </div>

            <div className="w-80 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
              <h3 className="text-lg font-semibold text-slate-900 mb-3">📋 Lưu ý</h3>
              <ul className="text-sm text-slate-600 space-y-2.5">
                <li className="flex items-start gap-2"><span className="text-teal-500 mt-0.5">•</span> Vui lòng chờ tại khu vực {t.counterCode}</li>
                <li className="flex items-start gap-2"><span className="text-teal-500 mt-0.5">•</span> Khi tới lượt sẽ có màn hình gọi</li>
                <li className="flex items-start gap-2"><span className="text-teal-500 mt-0.5">•</span> Giữ gìn trật tự và nghe hướng dẫn</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col overflow-hidden">
      <style>{`
        @keyframes scanLine {
          0% {
            top: -2px;
            opacity: 0;
          }
          10% {
            opacity: 1;
          }
          90% {
            opacity: 1;
          }
          100% {
            top: calc(100% + 2px);
            opacity: 0;
          }
        }
      `}</style>
      <div className="flex-1 flex flex-col p-6 gap-4 overflow-hidden">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 px-6 py-4 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-600 to-emerald-600 flex items-center justify-center shadow-md shadow-teal-600/20">
                <span className="text-xl">🎫</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">Kiosk Bốc Số</h1>
                <p className="text-sm text-slate-500">Bệnh nhân tự thao tác để lấy số</p>
              </div>
            </div>
            <button 
              onClick={handleBackClick} 
              className="px-4 py-2 border border-slate-200 text-slate-600 font-medium rounded-xl hover:bg-white hover:border-slate-300 transition-all text-sm"
            >
              ← Trang chính
            </button>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-3 rounded-lg shadow-sm flex-shrink-0">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3 flex-1">
                <p className="text-sm font-medium">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Main Content - Grid layout */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-4 overflow-hidden">
          {/* Left: Form panel */}
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-200 p-5 overflow-y-auto">
            <form onSubmit={handleSubmit} className="space-y-3">
              {/* Thông tin cơ bản */}
              <div>
                <h2 className="text-xl font-bold text-slate-900 mb-3 pb-2 border-b border-slate-200">Thông tin bệnh nhân</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-gray-700 mb-2 text-sm font-medium">Tên bệnh nhân *</label>
                    <input 
                      className="w-full border-2 border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all" 
                      value={formData.patientName || ''} 
                      onChange={e => updateField('patientName', e.target.value)} 
                      placeholder="VD: Nguyễn Văn A" 
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 mb-2 text-sm font-medium">
                      Số điện thoại
                      {searchingPatientByPhone && (
                        <span className="ml-2 text-xs text-blue-600">(Đang tìm kiếm...)</span>
                      )}
                    </label>
                    <input 
                      className="w-full border-2 border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all" 
                      value={formData.patientPhone || ''} 
                      onChange={e => updateField('patientPhone', e.target.value)} 
                      placeholder="VD: 0123456789 (Tự động tìm thông tin nếu có)" 
                    />
                    {formData.patientProfileCode && (
                      <p className="mt-1 text-xs text-green-600">
                        ✓ Đã tìm thấy hồ sơ: {formData.patientProfileCode}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-gray-700 mb-2 text-sm font-medium">Năm sinh</label>
                    <div className="flex items-center">
                      <button 
                        type="button"
                        onClick={() => handleBirthYearChange(Math.max(currentYear - 100, (birthYear ?? currentYear - 18) - 1))}
                        className="w-14 h-12 flex items-center justify-center bg-gray-100 hover:bg-gray-200 border-2 border-gray-300 rounded-l-lg text-xl font-bold text-gray-700 transition-colors cursor-pointer"
                      >
                        -
                      </button>
                      <input 
                        type="number" 
                        min={currentYear - 100} 
                        max={currentYear} 
                        value={birthYear || ''} 
                        onChange={e => {
                          const val = e.target.value ? parseInt(e.target.value, 10) : undefined;
                          handleBirthYearChange(val);
                        }} 
                        className="flex-1 w-full h-12 border-y-2 border-gray-300 px-4 text-center text-lg font-bold focus:outline-none focus:ring-inset focus:ring-2 focus:ring-sky-500"
                        placeholder="VD: 1990"
                      />
                      <button 
                        type="button"
                        onClick={() => handleBirthYearChange(Math.min(currentYear, (birthYear ?? currentYear - 18) + 1))}
                        className="w-14 h-12 flex items-center justify-center bg-gray-100 hover:bg-gray-200 border-2 border-gray-300 rounded-r-lg text-xl font-bold text-gray-700 transition-colors cursor-pointer"
                      >
                        +
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-gray-700 mb-2 text-sm font-medium">Giới tính</label>
                    <div className="grid grid-cols-3 gap-3">
                      <button 
                        type="button"
                        onClick={() => setGender('MALE')}
                        className={`flex items-center justify-center py-3 border-2 rounded-lg font-semibold transition-all ${formData.patientGender === 'MALE' ? 'border-sky-500 bg-sky-50 text-sky-700 scale-[1.02] shadow-sm' : 'border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'}`}
                      >
                        Nam
                      </button>
                      <button 
                        type="button"
                        onClick={() => setGender('FEMALE')}
                        className={`flex items-center justify-center py-3 border-2 rounded-lg font-semibold transition-all ${formData.patientGender === 'FEMALE' ? 'border-pink-500 bg-pink-50 text-pink-700 scale-[1.02] shadow-sm' : 'border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'}`}
                      >
                        Nữ
                      </button>
                      <button 
                        type="button"
                        onClick={() => setGender('OTHER')}
                        className={`flex items-center justify-center py-3 border-2 rounded-lg font-semibold transition-all ${formData.patientGender === 'OTHER' ? 'border-amber-500 bg-amber-50 text-amber-700 scale-[1.02] shadow-sm' : 'border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'}`}
                      >
                        Khác
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Ưu tiên */}
              <div className="pt-3 border-t border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Tùy chọn ưu tiên</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => handlePregnantChange(!formData.isPregnant)}
                    disabled={formData.patientGender === 'MALE'}
                    className={`flex flex-col items-center justify-center p-4 border-2 rounded-xl cursor-pointer transition-all ${formData.isPregnant ? 'border-pink-400 bg-pink-100 text-pink-800 shadow-md scale-[1.02]' : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50'} disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    <span className="text-3xl mb-2">🤰</span>
                    <span className="font-semibold">Mang thai</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => updateField('isDisabled', !formData.isDisabled)}
                    className={`flex flex-col items-center justify-center p-4 border-2 rounded-xl cursor-pointer transition-all ${formData.isDisabled ? 'border-blue-400 bg-blue-100 text-blue-800 shadow-md scale-[1.02]' : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50'}`}
                  >
                    <span className="text-3xl mb-2">🦽</span>
                    <span className="font-semibold">Khuyết tật</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => updateField('isVIP', !formData.isVIP)}
                    className={`flex flex-col items-center justify-center p-4 border-2 rounded-xl cursor-pointer transition-all ${formData.isVIP ? 'border-purple-400 bg-purple-100 text-purple-800 shadow-md scale-[1.02]' : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50'}`}
                  >
                    <span className="text-3xl mb-2">⭐</span>
                    <span className="font-semibold">Khám dịch vụ</span>
                  </button>
                </div>
                {formData.patientGender === 'MALE' && (
                  <p className="text-xs text-red-500 mt-2 font-medium">* Không thể chọn thiết lập "Mang thai" khi giới tính là Nam</p>
                )}
              </div>

              {/* Ghi chú */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-gray-700 text-sm font-medium">Ghi chú</label>
                  <button
                    type="button"
                    onClick={() => { setShowAITriage(true); setTriageResult(null); setTriageError(null); setTriageSymptoms(''); }}
                    className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg text-white text-xs font-bold shadow-sm hover:shadow hover:scale-105 transition-all focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-purple-500"
                  >
                    <span className="text-sm">🤖</span> AI Tư vấn Dịch vụ
                  </button>
                </div>
                <textarea 
                  className="w-full border-2 border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all resize-none" 
                  rows={3} 
                  value={formData.notes || ''} 
                  onChange={e => updateField('notes', e.target.value)} 
                  placeholder="VD: Khám tim mạch, tái khám..." 
                />
              </div>

              {/* Tùy chọn khác */}
              <div className="pt-3 border-t border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Thông tin bổ sung</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-gray-700 mb-2 text-sm font-medium">Mã hồ sơ</label>
                    <input 
                      className="w-full border-2 border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-transparent transition-all font-mono text-sm" 
                      value={formData.patientProfileCode || ''} 
                      onChange={e => updateField('patientProfileCode', e.target.value)} 
                      placeholder="VD: PR-12345" 
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 mb-2 text-sm font-medium">Mã lịch khám</label>
                    <input 
                      className="w-full border-2 border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all font-mono text-sm" 
                      value={formData.appointmentCode || ''} 
                      onChange={e => updateField('appointmentCode', e.target.value)} 
                      placeholder="VD: APT-67890" 
                    />
                  </div>
                </div>
              </div>

              {/* Submit buttons */}
              <div className="pt-5 border-t border-gray-200 flex gap-4">
                <button 
                  type="submit" 
                  className="flex-1 bg-gradient-to-r from-sky-600 to-blue-700 text-white px-5 py-4 font-bold text-lg rounded-xl hover:from-sky-700 hover:to-blue-800 transition-all shadow-md hover:shadow-lg active:scale-[0.98]"
                >
                  XÁC NHẬN BỐC SỐ
                </button>
                <button 
                  type="button" 
                  onClick={resetForm} 
                  className="px-6 py-4 border-2 border-gray-300 text-gray-700 font-bold rounded-xl hover:bg-gray-100 hover:border-gray-400 transition-all active:scale-[0.98]"
                >
                  LÀM MỚI
                </button>
              </div>
            </form>
          </div>

          {/* Right: Camera Scanner panel */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 flex flex-col overflow-hidden">
            <div className="flex-1 relative bg-black rounded-lg overflow-hidden min-h-0">
              <video ref={videoRef} className="absolute inset-0 w-full h-full object-cover" muted playsInline autoPlay />
              {/* Overlay with red frame */}
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center py-8">
                {/* Center square with big shadow to dim outside */}
                <div className="relative w-64 h-64 shadow-[0_0_0_200vmax_rgba(0,0,0,0.5)]">
                  {/* Four red corner brackets */}
                  <div className="absolute top-0 left-0 w-14 h-14 border-t-4 border-l-4 border-teal-500" />
                  <div className="absolute top-0 right-0 w-14 h-14 border-t-4 border-r-4 border-teal-500" />
                  <div className="absolute bottom-0 left-0 w-14 h-14 border-b-4 border-l-4 border-teal-500" />
                  <div className="absolute bottom-0 right-0 w-14 h-14 border-b-4 border-r-4 border-teal-500" />
                  {/* Scanning line animation - only inside the red frame */}
                  <div className="absolute inset-0 pointer-events-none overflow-hidden">
                    <div 
                      className="absolute left-0 right-0 h-1 bg-gradient-to-b from-transparent via-teal-500 to-transparent shadow-[0_0_15px_rgba(20,184,166,1)]"
                      style={{
                        animation: 'scanLine 2s ease-in-out infinite',
                        top: '-2px',
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Dialog chọn loại khám sau khi quét QR patient profile (PP) */}
        {showServiceTypeDialog && scannedPatientInfo && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 w-[560px]">
              <h3 className="text-2xl font-bold text-slate-900 mb-2">Chọn loại khám</h3>
              <div className="mb-4 p-4 bg-slate-50 rounded-xl">
                <p className="text-sm text-gray-600 mb-2">Thông tin bệnh nhân:</p>
                <div className="space-y-1 text-sm">
                  <p><span className="font-semibold">Tên:</span> {scannedPatientInfo.name}</p>
                  <p><span className="font-semibold">Tuổi:</span> {scannedPatientInfo.age} tuổi</p>
                  <p><span className="font-semibold">Giới tính:</span> {
                    scannedPatientInfo.gender === 'MALE' ? 'Nam' : 
                    scannedPatientInfo.gender === 'FEMALE' ? 'Nữ' : 
                    scannedPatientInfo.gender === 'OTHER' ? 'Khác' : 'Không xác định'
                  }</p>
                  <p><span className="font-semibold">Mã hồ sơ:</span> {scannedPatientInfo.profileCode}</p>
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-6">Vui lòng chọn loại khám:</p>
              <div className="space-y-3 mb-6">
                <button
                  onClick={() => submitWithScannedInfo(false)}
                  className="w-full p-4 border-2 border-gray-300 rounded-lg hover:border-gray-400 hover:bg-gray-50 transition-all text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 border-2 border-gray-400 rounded-full flex items-center justify-center">
                      <div className="w-3 h-3 bg-gray-900 rounded-full"></div>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">Khám thường</p>
                      <p className="text-sm text-gray-600">Khám theo quy trình tiêu chuẩn</p>
                    </div>
                  </div>
                </button>
                <button
                  onClick={() => submitWithScannedInfo(true)}
                  className="w-full p-4 border-2 border-purple-300 bg-purple-50 rounded-lg hover:border-purple-400 hover:bg-purple-100 transition-all text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 border-2 border-purple-600 rounded-full flex items-center justify-center">
                      <div className="w-3 h-3 bg-purple-600 rounded-full"></div>
                    </div>
                    <div>
                      <p className="font-semibold text-purple-900">Khám dịch vụ</p>
                      <p className="text-sm text-purple-700">Khám theo dịch vụ VIP</p>
                    </div>
                  </div>
                </button>
              </div>
              <div className="flex justify-end gap-3">
                <button 
                  className="px-6 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-all" 
                  onClick={() => { 
                    setShowServiceTypeDialog(false); 
                    setScannedPatientInfo(null);
                    setScannerStatus('Đang quét...');
                    // Reset flags để có thể scan lại
                    isSubmittingRef.current = false;
                    lastCodeRef.current = null;
                    lastScanTimeRef.current = 0;
                    startScanner(); 
                  }}
                >
                  Hủy
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Dialog xác nhận lấy số từ appointment QR */}
        {showAppointmentConfirmDialog && scannedAppointmentInfo && scannedPatientInfo && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 w-[560px]">
              <h3 className="text-2xl font-bold text-slate-900 mb-2">Xác nhận lấy số dựa vào lịch!</h3>
              
              <div className="mb-4 p-4 bg-slate-50 rounded-xl">
                <p className="text-sm text-gray-600 mb-2">Thông tin lịch hẹn:</p>
                <div className="space-y-1 text-sm">
                  <p><span className="font-semibold">Mã lịch hẹn:</span> {scannedAppointmentInfo.appointmentCode}</p>
                  {scannedAppointmentInfo.appointmentDate && (
                    <p><span className="font-semibold">Ngày:</span> {new Date(scannedAppointmentInfo.appointmentDate).toLocaleDateString('vi-VN')}</p>
                  )}
                  {scannedAppointmentInfo.startTime && (
                    <p><span className="font-semibold">Giờ hẹn:</span> {scannedAppointmentInfo.startTime}</p>
                  )}
                  {scannedAppointmentInfo.doctorName && (
                    <p><span className="font-semibold">Bác sĩ:</span> {scannedAppointmentInfo.doctorName}</p>
                  )}
                  {scannedAppointmentInfo.specialtyName && (
                    <p><span className="font-semibold">Chuyên khoa:</span> {scannedAppointmentInfo.specialtyName}</p>
                  )}
                </div>
              </div>

              <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-2">Thông tin bệnh nhân:</p>
                <div className="space-y-1 text-sm">
                  <p><span className="font-semibold">Tên:</span> {scannedPatientInfo.name}</p>
                  <p><span className="font-semibold">Tuổi:</span> {scannedPatientInfo.age} tuổi</p>
                  <p><span className="font-semibold">Mã hồ sơ:</span> {scannedPatientInfo.profileCode}</p>
                </div>
              </div>

              {scannedAppointmentInfo.isTooEarly && (
                <div className="mb-6 p-4 bg-yellow-50 border-2 border-yellow-300 rounded-lg">
                  <div className="flex items-start gap-3">
                    <div className="text-yellow-600 text-xl">⚠️</div>
                    <div>
                      <p className="font-semibold text-yellow-900 mb-1">Lưu ý</p>
                      <p className="text-sm text-yellow-800">
                        Bạn đến quá sớm so với lịch nên sẽ không được ưu tiên nhé, bạn có muốn xác nhận không?
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3">
                <button 
                  className="px-6 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-all" 
                  onClick={() => { 
                    setShowAppointmentConfirmDialog(false); 
                    setScannedAppointmentInfo(null);
                    setScannedPatientInfo(null);
                    setScannerStatus('Đang quét...');
                    // Reset flags để có thể scan lại
                    isSubmittingRef.current = false;
                    lastCodeRef.current = null;
                    lastScanTimeRef.current = 0;
                    startScanner(); 
                  }}
                >
                  Hủy
                </button>
                <button 
                  className="px-6 py-3 bg-gradient-to-r from-teal-600 to-emerald-600 text-white font-semibold rounded-xl hover:from-teal-700 hover:to-emerald-700 transition-all shadow-md disabled:bg-slate-400 disabled:cursor-not-allowed disabled:from-slate-400 disabled:to-slate-400" 
                  onClick={() => {
                    console.log('🟢 [BUTTON] Xác nhận button clicked');
                    submitAppointmentConfirm();
                  }}
                  disabled={isSubmittingRef.current || loading}
                >
                  {loading ? 'Đang xử lý...' : 'Xác nhận'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Password modal for going back */}
        {showPasswordModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 w-[400px]">
              <h3 className="text-2xl font-bold text-slate-900 mb-2">Xác nhận mật khẩu</h3>
              <p className="text-sm text-slate-500 mb-4">Vui lòng nhập mật khẩu để quay về trang chính:</p>
              <div className="mb-4">
                <input
                  type="password"
                  value={passwordInput}
                  onChange={(e) => {
                    setPasswordInput(e.target.value);
                    setPasswordError(null);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handlePasswordSubmit();
                    }
                  }}
                  className="w-full border-2 border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all"
                  placeholder="Nhập mật khẩu"
                  autoFocus
                />
                {passwordError && (
                  <p className="text-red-600 text-sm mt-2">{passwordError}</p>
                )}
              </div>
              <div className="flex justify-end gap-3">
                <button
                  className="px-6 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-all"
                  onClick={handlePasswordCancel}
                >
                  Hủy
                </button>
                <button
                  className="px-6 py-3 bg-gradient-to-r from-teal-600 to-emerald-600 text-white font-bold rounded-xl hover:from-teal-700 hover:to-emerald-700 transition-all shadow-md"
                  onClick={handlePasswordSubmit}
                >
                  Xác nhận
                </button>
              </div>
            </div>
          </div>
        )}

        {/* AI Triage Modal */}
        {showAITriage && (
          <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl border border-indigo-100 overflow-hidden w-[500px] flex flex-col">
              <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-5 flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    <span className="text-2xl">🤖</span> AI Phân Luồng Tư Vấn
                  </h3>
                  <p className="text-indigo-100 text-sm mt-1">Mô tả triệu chứng để AI gợi ý chuyên khoa phù hợp nhất</p>
                </div>
                <button
                  onClick={() => setShowAITriage(false)}
                  className="text-white hover:bg-white/20 p-2 rounded-full transition-colors"
                >
                  ✕
                </button>
              </div>

              <div className="p-6 flex flex-col gap-5">
                {!triageResult ? (
                  <>
                    <div className="flex flex-col gap-2">
                      <label className="text-sm font-semibold text-gray-700">Triệu chứng hiện tại là gì?</label>
                      <textarea
                        className="w-full border-2 border-indigo-100 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all resize-none bg-gray-50 text-gray-800"
                        rows={4}
                        placeholder="VD: Bị ho nhiều, sốt cao từ tối qua, kèm sổ mũi và khò khè..."
                        value={triageSymptoms}
                        onChange={(e) => setTriageSymptoms(e.target.value)}
                      />
                    </div>
                    {triageError && (
                      <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg border border-red-100">{triageError}</div>
                    )}
                  </>
                ) : (
                  <div className="flex flex-col gap-4">
                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-xl p-5">
                      <div className="text-sm text-green-800 mb-1 font-medium">Chuyên khoa được đề xuất:</div>
                      <div className="text-2xl font-black text-green-700 mb-3">{triageResult.suggestedSpecialty}</div>
                      <div className="text-sm text-green-900 leading-relaxed bg-white/60 p-3 rounded-lg">
                        <span className="font-bold">Lý do:</span> {triageResult.reasoning}
                      </div>
                    </div>
                    <div className="text-xs text-gray-500 italic text-center px-4">
                      *Ghi chú: Đây là gợi ý tự động của AI, chỉ mang tính tham khảo, không thay thế chẩn đoán bác sĩ.
                    </div>
                  </div>
                )}
              </div>

              <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3 border-t border-gray-100">
                <button
                  type="button"
                  className="px-5 py-2.5 text-gray-600 hover:bg-gray-200 font-semibold rounded-xl transition-all"
                  onClick={() => setShowAITriage(false)}
                >
                  Đóng
                </button>
                {!triageResult ? (
                  <button
                    type="button"
                    onClick={handleAITriage}
                    disabled={triageLoading || !triageSymptoms.trim()}
                    className="px-6 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold rounded-xl hover:from-indigo-600 hover:to-purple-700 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {triageLoading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Đang phân tích...
                      </>
                    ) : 'Phân tích ngay ✨'}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={applyAITriage}
                    className="px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold rounded-xl hover:from-emerald-600 hover:to-teal-700 transition-all shadow-md flex items-center gap-2"
                  >
                    Áp dụng vào Ghi chú ✓
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default KioskScreen;


