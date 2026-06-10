// Start Services Confirmation View

import React, { useEffect, useRef, useState } from 'react';
import { BrowserQRCodeReader } from '@zxing/browser';
import { apiService } from '../services/api';
import { PendingServicesResponse, StartServiceRequestItem, StartServicesResponse } from '../types';
import csvcImg from '../assets/csvc.jpg';

interface StartServicesProps {
  onBack: () => void;
}

const StartServices: React.FC<StartServicesProps> = ({ onBack }) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const codeReaderRef = useRef<any>(null);
  const scannerControlsRef = useRef<any>(null);
  const [scannerStatus, setScannerStatus] = useState<string>('');
  const [scannerError, setScannerError] = useState<string | null>(null);
  const scanningActiveRef = useRef<boolean>(false);
  const lastCodeRef = useRef<string | null>(null);
  const lastScanTimeRef = useRef<number>(0);
  const isProcessingRef = useRef<boolean>(false);
  const hasDetectedRef = useRef<boolean>(false);
  const didInitRef = useRef<boolean>(false);

  const [scannedCode, setScannedCode] = useState<string | null>(null);
  const [manualCode, setManualCode] = useState<string>('');
  const [pending, setPending] = useState<PendingServicesResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [startResult, setStartResult] = useState<StartServicesResponse | null>(null);
  const [showPendingModal, setShowPendingModal] = useState<boolean>(false);
  const [showResultModal, setShowResultModal] = useState<boolean>(false);
  const [showErrorModal, setShowErrorModal] = useState<string | null>(null);

  const startScanner = async () => {
    try {
      if (scanningActiveRef.current) return;
      setScannerError(null);
      setScannerStatus('Đang mở camera...');
      if (!codeReaderRef.current) {
        codeReaderRef.current = new BrowserQRCodeReader();
      }
      const videoElem = videoRef.current;
      if (!videoElem) return;

      // 1) Request permission and warm up camera stream
      let chosenDeviceId: string | undefined = undefined;
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        // @ts-ignore
        videoElem.srcObject = stream;
        await videoElem.play().catch(() => {});
        // 2) Enumerate devices after permission granted and pick first videoinput
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videos = devices.filter(d => d.kind === 'videoinput');
        if (videos.length > 0) {
          chosenDeviceId = videos[0].deviceId;
        }
      } catch (permErr: any) {
        // If permission prompts fail here, zxing may still prompt via decodeFromVideoDevice
      }

      setScannerStatus('Camera đã bật. Đang quét mã phiếu chỉ định...');
      scanningActiveRef.current = true;
      hasDetectedRef.current = false;

      await codeReaderRef.current.decodeFromVideoDevice(chosenDeviceId, videoElem, async (result: any, err: any, controls: any) => {
        if (controls && !scannerControlsRef.current) {
          scannerControlsRef.current = controls;
        }
        if (result?.getText) {
          const text = (result.getText() || '').toString().trim();
          const now = Date.now();
          if (!text) {
            return;
          }
          if (hasDetectedRef.current) return;
          if (isProcessingRef.current) return;
          if (text === lastCodeRef.current && now - lastScanTimeRef.current < 3000) {
            return;
          }
          lastCodeRef.current = text;
          lastScanTimeRef.current = now;
          isProcessingRef.current = true;
          hasDetectedRef.current = true;
          try {
            setScannerStatus('Đã quét mã: ' + text);
            await handleCodeDetected(text);
          } finally {
            isProcessingRef.current = false;
          }
        }
        if (err && (err as any).name === 'NotFoundException') {
          // ignore continuous not found
        }
      });
    } catch (e: any) {
      setScannerError(e?.message || 'Không thể khởi tạo camera.');
      setShowErrorModal(e?.message || 'Không thể khởi tạo camera.');
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

  const handleCodeDetected = async (code: string) => {
    setScannedCode(code);
    setPending(null);
    setStartResult(null);
    setError(null);
    setLoading(true);
    try {
      const res = await apiService.getPendingServicesByCode(code);
      setPending(res);
      setShowPendingModal(true);
    } catch (e: any) {
      const msg = e?.message || 'Không thể tải dịch vụ chờ.';
      setError(msg);
      setShowErrorModal(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmStart = async () => {
    if (!pending) return;
    setLoading(true);
    setError(null);
    setStartResult(null);
    try {
      const items: StartServiceRequestItem[] = pending.services.map(s => ({
        prescriptionId: pending.prescriptionId,
        serviceId: s.serviceId,
      }));
      const res = await apiService.startServices(items);
      setStartResult(res);
      setShowPendingModal(false);
      setShowResultModal(true);
    } catch (e: any) {
      const msg = e?.message || 'Không thể bắt đầu dịch vụ.';
      setError(msg);
      setShowErrorModal(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!didInitRef.current) {
      didInitRef.current = true;
      startScanner();
    }
    return () => {
      stopScanner();
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
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
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 px-6 py-4 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-1">Xác nhận bắt đầu dịch vụ</h1>
              <p className="text-base text-gray-600">Quét mã phiếu chỉ định để khởi động dịch vụ</p>
            </div>
            <button 
              className="px-5 py-2 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-all shadow-sm" 
              onClick={onBack}
            >
              ← Quay lại
            </button>
          </div>
        </div>

        {/* Loading overlay */}
        {loading && (
          <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl p-6">
              <div className="flex items-center gap-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                <span className="text-lg font-semibold text-gray-900">Đang xử lý...</span>
              </div>
            </div>
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-6">
          {/* Left: Camera preview with centered dashed-corner red frame and outside dim */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Quét mã QR</h2>
            <div className="relative aspect-video bg-black rounded-lg overflow-hidden border-2 border-gray-300">
              <video ref={videoRef} className="absolute inset-0 w-full h-full object-cover" muted playsInline autoPlay />
              {/* Overlay */}
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center py-8">
                {/* Center square with big shadow to dim outside */}
                <div className="relative w-64 h-64 shadow-[0_0_0_200vmax_rgba(0,0,0,0.5)]">
                  {/* Four red corner brackets with spacing */}
                  <div className="absolute top-0 left-0 w-14 h-14 border-t-4 border-l-4 border-red-500" />
                  <div className="absolute top-0 right-0 w-14 h-14 border-t-4 border-r-4 border-red-500" />
                  <div className="absolute bottom-0 left-0 w-14 h-14 border-b-4 border-l-4 border-red-500" />
                  <div className="absolute bottom-0 right-0 w-14 h-14 border-b-4 border-r-4 border-red-500" />
                  {/* Scanning line animation - only inside the red frame */}
                  <div className="absolute inset-0 pointer-events-none overflow-hidden">
                    <div 
                      className="absolute left-0 right-0 h-1 bg-gradient-to-b from-transparent via-red-500 to-transparent shadow-[0_0_15px_rgba(239,68,68,1)]"
                      style={{
                        animation: 'scanLine 2s ease-in-out infinite',
                        top: '-2px',
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
            {scannerStatus && (
              <div className="mt-3 bg-blue-50 border-l-4 border-blue-500 text-blue-700 p-2 rounded text-sm">
                {scannerStatus}
              </div>
            )}
            {scannerError && (
              <div className="mt-3 bg-red-50 border-l-4 border-red-500 text-red-700 p-2 rounded text-sm">
                {scannerError}
              </div>
            )}
          </div>

          <div className="flex flex-col gap-6">
            {/* Right Top: Manual Input */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Nhập mã chỉ định</h2>
              <div className="flex flex-col gap-3">
                <input 
                  type="text" 
                  value={manualCode} 
                  onChange={e => setManualCode(e.target.value)} 
                  placeholder="Nhập mã phiếu (VD: PRES-12345)" 
                  className="w-full border-2 border-gray-300 rounded-lg px-4 py-3 text-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all shadow-inner"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && manualCode) {
                      handleCodeDetected(manualCode);
                    }
                  }}
                />
                <button 
                  onClick={() => {
                    if (manualCode) handleCodeDetected(manualCode);
                  }}
                  disabled={!manualCode || loading}
                  className="w-full bg-gradient-to-r from-sky-600 to-blue-700 text-white font-bold px-6 py-4 rounded-xl hover:from-sky-700 hover:to-blue-800 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg active:scale-[0.98]"
                >
                  Kiểm tra mã chỉ định
                </button>
              </div>
            </div>

            {/* Right Bottom: Static facility image */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 flex-1 flex items-center justify-center">
              <img 
                src={csvcImg as unknown as string} 
                alt="Cơ sở vật chất" 
                className="max-w-full max-h-[40vh] object-contain rounded-lg" 
              />
            </div>
          </div>
        </div>
      </div>

      {showPendingModal && pending && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl border border-gray-200 p-6 w-[600px] max-w-[90vw]">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Xác nhận bắt đầu dịch vụ</h3>
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <div className="text-sm text-gray-600 mb-1">Mã phiếu chỉ định</div>
              <div className="text-lg font-mono font-semibold text-gray-900">{pending.prescriptionCode}</div>
            </div>
            <div className="mb-4">
              <div className="text-base text-gray-700 mb-3">
                Tổng số dịch vụ chờ: <span className="font-bold text-lg text-gray-900">{pending.totalCount}</span>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-h-64 overflow-auto">
                <div className="text-sm font-semibold text-blue-900 mb-2">Danh sách dịch vụ:</div>
                <ul className="space-y-2">
                  {pending.services.map((s, idx) => (
                    <li key={s.serviceId} className="flex items-start gap-2 text-sm text-gray-700">
                      <span className="text-blue-600 font-semibold mt-0.5">{idx + 1}.</span>
                      <span>{s.serviceName}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
              <button 
                className="px-6 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-all" 
                onClick={() => { setShowPendingModal(false); hasDetectedRef.current = false; setPending(null); setScannedCode(null); setScannerStatus('Đang quét...'); }}
              >
                Hủy
              </button>
              <button 
                className="px-6 py-3 bg-gray-900 text-white font-bold rounded-lg hover:bg-gray-800 transition-all shadow-lg" 
                onClick={handleConfirmStart}
              >
                Xác nhận khởi động
              </button>
            </div>
          </div>
        </div>
      )}

      {showResultModal && startResult && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl border border-gray-200 p-6 w-[600px] max-w-[90vw]">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Kết quả khởi động dịch vụ</h3>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="text-sm text-green-700 mb-1">Thành công</div>
                <div className="text-3xl font-bold text-green-900">{startResult.totalStarted}</div>
              </div>
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="text-sm text-red-700 mb-1">Thất bại</div>
                <div className="text-3xl font-bold text-red-900">{startResult.totalFailed}</div>
              </div>
            </div>
            {startResult.failedServices.length > 0 && (
              <div className="mb-4">
                <div className="text-sm font-semibold text-red-700 mb-2">Chi tiết lỗi:</div>
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 max-h-48 overflow-auto">
                  <ul className="space-y-2">
                    {startResult.failedServices.map(f => (
                      <li key={`${f.serviceId}`} className="text-sm text-red-700">
                        <span className="font-semibold">ID: {f.serviceId}</span> - {f.reason}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
            <div className="flex justify-end pt-4 border-t border-gray-200">
              <button 
                className="px-6 py-3 bg-gray-900 text-white font-bold rounded-lg hover:bg-gray-800 transition-all shadow-lg" 
                onClick={() => { setShowResultModal(false); setPending(null); setScannedCode(null); setStartResult(null); hasDetectedRef.current = false; setScannerStatus('Đang quét...'); }}
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {showErrorModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl border border-gray-200 p-6 w-[500px] max-w-[90vw]">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900">Thông báo lỗi</h3>
            </div>
            <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded mb-4">
              {showErrorModal}
            </div>
            <div className="flex justify-end">
              <button 
                className="px-6 py-3 bg-gray-900 text-white font-semibold rounded-lg hover:bg-gray-800 transition-all shadow-lg" 
                onClick={() => setShowErrorModal(null)}
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StartServices;


