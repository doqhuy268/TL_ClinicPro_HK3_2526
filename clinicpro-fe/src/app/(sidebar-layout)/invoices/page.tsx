/* eslint-disable @next/next/no-img-element */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/exhaustive-deps */
'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import * as QRCode from 'qrcode';
import { io, Socket } from 'socket.io-client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { cashierApi } from '@/lib/api';
import { useAuth } from '@/lib/hooks/useAuth';
import { Separator } from '@/components/ui/separator';
import { CheckCircle2, Clipboard, Copy, CreditCard, ExternalLink, FileSearch, Printer, QrCode, RefreshCcw, Scan, Camera, CameraOff, Landmark, HandCoins } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Html5Qrcode } from 'html5-qrcode';

enum PrescriptionStatus {
  NOT_STARTED = 'NOT_STARTED',
  PENDING = 'PENDING',
  WAITING = 'WAITING',
  SERVING = 'SERVING',
  WAITING_RESULT = 'WAITING_RESULT',
  COMPLETED = 'COMPLETED',
  DELAYED = 'DELAYED',
  CANCELLED = 'CANCELLED'
}

type Service = {
  serviceId: string;
  serviceCode: string;
  name: string;
  price: number; // Giá sau khi giảm
  originalPrice?: number; // Giá gốc
  discountAmount?: number; // Số tiền giảm
  discountPercent?: number; // Phần trăm giảm
  description?: string | null;
  status: PrescriptionStatus;
  order?: number;
  prescriptionServiceId?: string;
};

type LoadedPrescription = {
  id: string;
  prescriptionCode: string;
  status: string;
  services: Array<{
    prescriptionId: string;
    serviceId: string;
    status: PrescriptionStatus;
    results: unknown[];
    order: number;
    note?: string | null;
    service: {
      id: string;
      serviceCode: string;
      name: string;
      price: number;
      description?: string | null;
      timePerPatient: number;
    }
  }>;
  patientProfile: { name: string };
  doctor?: { id: string; doctorCode: string };
};

type PreviewResponse = {
  totalAmount: number; // Tổng sau khi giảm
  originalTotalAmount?: number; // Tổng giá gốc trước khi giảm
  totalDiscountAmount?: number; // Tổng số tiền được giảm
  selectedServices: Service[];
  patientName: string;
  prescriptionDetails: LoadedPrescription;
  loyaltyInfo?: {
    totalPoints: number;
    tierInfo?: {
      tier: string;
      name: string;
      discountPercent: number;
      minPoints: number;
      nextTierPoints?: number;
    };
  };
};

type PaymentMethodType = 'CASH' | 'TRANSFER';

type RoutingAssignment = {
  roomId: string;
  roomCode: string;
  roomName: string;
  boothId: string | null;
  boothCode: string | null;
  boothName: string | null;
  doctorId: string | null;
  doctorCode: string | null;
  doctorName: string | null;
  technicianId?: string | null;
  technicianCode?: string | null;
  technicianName?: string | null;
};

type InvoiceDetail = {
  serviceId?: string;
  serviceCode: string;
  serviceName: string;
  price: number;
};

type PaymentTransaction = {
  id: string;
  status: string;
  amount: number;
  currency: string;
  paymentUrl: string;
  qrCode?: string | null;
  providerTransactionId?: string | null;
  orderCode: string;
  expiredAt?: string | null;
  paidAt?: string | null;
  isVerified?: boolean;
};

type InvoicePaymentSummary = {
  invoiceCode: string;
  totalAmount: number;
  paymentStatus: string;
  paymentMethod?: PaymentMethodType | 'WALLET';
  invoiceDetails?: InvoiceDetail[];
  patientInfo?: { name?: string; dateOfBirth?: string; gender?: string } | null;
  routingAssignments?: RoutingAssignment[];
  prescriptionInfo?: { prescriptionCode: string; status: string; doctorName?: string };
  transaction?: PaymentTransaction | null;
};


export default function InvoicesPage() {
  const { user } = useAuth();
  const [prescriptionCode, setPrescriptionCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [prescription, setPrescription] = useState<LoadedPrescription | null>(null);
  const [selectedCodes, setSelectedCodes] = useState<string[]>([]);
  const [preview, setPreview] = useState<PreviewResponse | null>(null);
  const [creating, setCreating] = useState(false);
  const [createdInvoice, setCreatedInvoice] = useState<InvoicePaymentSummary | null>(null);
  const [confirmResult, setConfirmResult] = useState<InvoicePaymentSummary | null>(null);
  const [createdInvoiceQrImage, setCreatedInvoiceQrImage] = useState<string | null>(null);
  const [confirmedInvoiceQrImage, setConfirmedInvoiceQrImage] = useState<string | null>(null);
  const [printMode, setPrintMode] = useState<'none' | 'invoice' | 'routing' | 'payment'>('none');
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [paymentModalInvoiceCode, setPaymentModalInvoiceCode] = useState<string | null>(null);
  const [customerMoney, setCustomerMoney] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodType>('CASH');
  const [transactionHistory, setTransactionHistory] = useState<Array<{
    invoiceCode: string;
    amount: number;
    time: Date;
    patientName: string;
  }>>([]);
  const [refreshingTransaction, setRefreshingTransaction] = useState(false);
  const [manualConfirming, setManualConfirming] = useState(false);
  const previewTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [socketLog, setSocketLog] = useState<string[]>([]);
  
  // QR Scanner states
  const [isQrScannerOpen, setIsQrScannerOpen] = useState(false);
  const [qrScanning, setQrScanning] = useState(false);
  const [scannerSupported, setScannerSupported] = useState<boolean | null>(null);
  const [scanHint, setScanHint] = useState<string>('Đang khởi động camera...');
  const [usingHtml5Qrcode, setUsingHtml5Qrcode] = useState(false);
  const qrVideoRef = useRef<HTMLVideoElement | null>(null);
  const qrMediaStreamRef = useRef<MediaStream | null>(null);
  const qrHtml5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const qrLastScanRef = useRef<string | null>(null);
  const qrLastScanTsRef = useRef<number>(0);
  const qrScanningRef = useRef(false);

  // Update current time every second to avoid hydration mismatch

  useEffect(() => {
    let canceled = false;
    const rawQrValue = createdInvoice?.transaction?.qrCode;
    const qrValue = typeof rawQrValue === 'string'
      ? rawQrValue.replace(/\s+/g, '').replace(/[^\x20-\x7E]/g, '').trim()
      : rawQrValue;

    if (!qrValue) {
      setCreatedInvoiceQrImage(null);
      return;
    }

    (async () => {
      try {
        const text = typeof qrValue === 'string' ? qrValue : String(qrValue);
        let dataUrl: string | null = null;
        try {
          dataUrl = await QRCode.toDataURL(text, { type: 'image/png', margin: 0, errorCorrectionLevel: 'M', width: 256 });
        } catch (err1) {
          // Fallback: use canvas API if available
          try {
            if (typeof document !== 'undefined') {
              const canvas = document.createElement('canvas');
              await new Promise<void>((resolve, reject) => {
                QRCode.toCanvas(canvas, text, { errorCorrectionLevel: 'M', margin: 0, width: 256 }, (e: any) => (e ? reject(e) : resolve()));
              });
              dataUrl = canvas.toDataURL('image/png');
            } else {
              throw err1;
            }
          } catch (err2) {
            console.error('[QR] Failed to generate createdInvoice QR', {
              errorPrimary: (err1 as Error)?.message,
              errorFallback: (err2 as Error)?.message,
              length: text?.length,
              preview: typeof text === 'string' ? `${text.slice(0, 20)}...${text.slice(-20)}` : 'n/a'
            });
            throw err2;
          }
        }
        if (!canceled) {
          setCreatedInvoiceQrImage(dataUrl);
        }
      } catch (error) {
        console.error('Failed to generate QR image:', error);
        if (!canceled) {
          setCreatedInvoiceQrImage(null);
        }
      }
    })();

    return () => {
      canceled = true;
    };
  }, [createdInvoice?.transaction?.qrCode]);

  useEffect(() => {
    let canceled = false;
    const rawQrValue = confirmResult?.transaction?.qrCode;
    const qrValue = typeof rawQrValue === 'string'
      ? rawQrValue.replace(/\s+/g, '').replace(/[^\x20-\x7E]/g, '').trim()
      : rawQrValue;

    if (!qrValue) {
      setConfirmedInvoiceQrImage(null);
      return;
    }

    (async () => {
      try {
        const text = typeof qrValue === 'string' ? qrValue : String(qrValue);
        let dataUrl: string | null = null;
        try {
          dataUrl = await QRCode.toDataURL(text, { type: 'image/png', margin: 0, errorCorrectionLevel: 'M', width: 256 });
        } catch (err1) {
          // Fallback: use canvas API if available
          try {
            if (typeof document !== 'undefined') {
              const canvas = document.createElement('canvas');
              await new Promise<void>((resolve, reject) => {
                QRCode.toCanvas(canvas, text, { errorCorrectionLevel: 'M', margin: 0, width: 256 }, (e: any) => (e ? reject(e) : resolve()));
              });
              dataUrl = canvas.toDataURL('image/png');
            } else {
              throw err1;
            }
          } catch (err2) {
            console.error('[QR] Failed to generate confirmedInvoice QR', {
              errorPrimary: (err1 as Error)?.message,
              errorFallback: (err2 as Error)?.message,
              length: text?.length,
              preview: typeof text === 'string' ? `${text.slice(0, 20)}...${text.slice(-20)}` : 'n/a'
            });
            throw err2;
          }
        }
        if (!canceled) {
          setConfirmedInvoiceQrImage(dataUrl);
        }
      } catch (error) {
        console.error('Failed to generate QR image for confirmed invoice:', error);
        if (!canceled) {
          setConfirmedInvoiceQrImage(null);
        }
      }
    })();

    return () => {
      canceled = true;
    };
  }, [confirmResult?.transaction?.qrCode]);

  const exportSectionAsPdf = useCallback(async (type: 'invoice' | 'routing', data?: any, customCustomerMoney?: number) => {
    const pdfData = data || confirmResult;
    if (!pdfData) return;
    
    // Use custom customer money if provided, otherwise use global state
    const customerMoneyValue = customCustomerMoney !== undefined ? customCustomerMoney : parseInt(customerMoney) || 0;

    const formatCurrency = (value?: number | null) => {
      if (typeof value !== 'number') return '';
      return value.toLocaleString('vi-VN');
    };

    // Helper function to get practitioner display info
    const getPractitionerDisplay = (assignment: { doctorId?: string; doctorName?: string; doctorCode?: string; technicianId?: string; technicianName?: string; technicianCode?: string }) => {
      if (assignment.doctorId && assignment.doctorName !== 'N/A') {
        return {
          label: 'Bác sĩ',
          name: assignment.doctorName,
          code: assignment.doctorCode
        };
      } else if (assignment.technicianId && assignment.technicianName !== 'N/A') {
        return {
          label: 'Kỹ thuật viên',
          name: assignment.technicianName,
          code: assignment.technicianCode
        };
      }
      return {
        label: 'Người thực hiện',
        name: 'N/A',
        code: 'N/A'
      };
    };

    try {
      const { default: pdfMake } = await import('pdfmake/build/pdfmake');
      const { default: pdfFonts } = await import('pdfmake/build/vfs_fonts');

      // Initialize pdfMake with default fonts
      pdfMake.vfs = pdfFonts.vfs;

      if (type === 'invoice') {
        // Create invoice content using pdfMake
        const invoiceContent = [
          // Header
          {
            text: 'HÓA ĐƠN THANH TOÁN',
            fontSize: 18,
            bold: true,
            alignment: 'center',
            margin: [0, 0, 0, 10]
          },
          {
            text: `Mã hóa đơn: ${pdfData.invoiceCode}`,
            fontSize: 10,
            alignment: 'center',
            margin: [0, 0, 0, 20]
          },

          // Patient Info
          {
            text: 'Thông tin bệnh nhân:',
            fontSize: 12,
            bold: true,
            margin: [0, 0, 0, 10]
          },
          {
            text: `Tên: ${pdfData.patientInfo?.name || preview?.patientName || ''}`,
            fontSize: 11,
            margin: [0, 0, 0, 5]
          },
          {
            text: `Ngày thanh toán: ${new Date().toLocaleDateString('vi-VN')}`,
            fontSize: 11,
            margin: [0, 0, 0, 5]
          },
          {
            text: `Trạng thái: ${pdfData.paymentStatus}`,
            fontSize: 11,
            margin: [0, 0, 0, 5]
          },
          {
            text: `Phương thức thanh toán: ${
              paymentMethod === 'CASH' ? 'Tiền mặt' : 'Chuyển khoản'
            }`,
            fontSize: 11,
            margin: [0, 0, 0, 20]
          },

          // Services Table
          {
            table: {
              headerRows: 1,
              widths: ['*', 'auto'],
              body: [
                [
                  { text: 'Dịch vụ', style: 'tableHeader' },
                  { text: 'Giá', style: 'tableHeader', alignment: 'right' }
                ],
                ...pdfData.invoiceDetails?.map((item: { serviceName: string; price: number }) => [
                  { text: item.serviceName, fontSize: 10 },
                  { text: `${item.price.toLocaleString()} đ`, fontSize: 10, alignment: 'right' }
                ]) || [],
                [
                  { text: 'TỔNG CỘNG:', bold: true, fontSize: 12 },
                  { text: `${pdfData.totalAmount.toLocaleString()} đ`, bold: true, fontSize: 12, alignment: 'right' }
                ]
              ]
            },
            margin: [0, 0, 0, 10]
          },

          // Payment Details
          {
            table: {
              widths: ['*', 'auto'],
              body: [
                [
                  { text: 'Tiền khách đưa:', fontSize: 11 },
                  { text: `${customerMoneyValue.toLocaleString()} đ`, fontSize: 11, alignment: 'right' }
                ],
                [
                  { text: 'Tiền thối lại:', fontSize: 11 },
                  { text: `${(customerMoneyValue - pdfData.totalAmount).toLocaleString()} đ`, fontSize: 11, alignment: 'right' }
                ]
              ]
            },
            margin: [0, 0, 0, 20]
          },

          // Transfer Payment QR
          ...(pdfData.transaction?.qrCode
            ? [
                {
                  text: 'Thông tin thanh toán chuyển khoản',
                  fontSize: 12,
                  bold: true,
                  margin: [0, 10, 0, 8]
                },
                {
                  columns: [
                    {
                      width: '*',
                      stack: [
                        {
                          text: 'Quý khách vui lòng quét mã QR hoặc chuyển khoản theo thông tin bên dưới:',
                          fontSize: 10,
                          margin: [0, 0, 0, 6]
                        },
                        {
                          text: `Số tiền: ${formatCurrency(pdfData.transaction?.amount ?? pdfData.totalAmount)} đ`,
                          fontSize: 10,
                          bold: true
                        },
                        ...(pdfData.transaction?.orderCode
                          ? [
                              {
                                text: `Mã đơn PayOS: ${pdfData.transaction.orderCode}`,
                                fontSize: 10,
                                margin: [0, 4, 0, 0]
                              }
                            ]
                          : []),
                        ...(pdfData.transaction?.providerTransactionId
                          ? [
                              {
                                text: `Mã giao dịch PayOS: ${pdfData.transaction.providerTransactionId}`,
                                fontSize: 10,
                                margin: [0, 4, 0, 0]
                              }
                            ]
                          : []),
                        ...(pdfData.transaction?.paymentUrl
                          ? [
                              {
                                text: pdfData.transaction.paymentUrl,
                                fontSize: 10,
                                color: '#1d4ed8',
                                link: pdfData.transaction.paymentUrl,
                                margin: [0, 6, 0, 0]
                              }
                            ]
                          : []),
                      ]
                    },
                    {
                      width: 'auto',
                      qr: pdfData.transaction.qrCode,
                      fit: 140,
                      alignment: 'center'
                    }
                  ],
                  columnGap: 12,
                  margin: [0, 0, 0, 15]
                }
              ]
            : []),

          // Footer
          {
            text: `Nhân viên thu ngân: ${user?.name || 'N/A'}`,
            alignment: 'left',
            fontSize: 9,
            margin: [0, 0, 0, 5]
          },
          {
            text: `Thời gian thanh toán: ${new Date().toLocaleString('vi-VN')}`,
            alignment: 'left',
            fontSize: 9,
            margin: [0, 0, 0, 15]
          },
          {
            text: 'Cảm ơn quý khách đã sử dụng dịch vụ!',
            alignment: 'center',
            fontSize: 10,
            margin: [0, 0, 0, 5]
          },
          {
            text: 'Hẹn gặp lại quý khách lần sau.',
            alignment: 'center',
            fontSize: 10
          }
        ];

        // Create PDF document
        const docDefinition = {
          content: invoiceContent,
          styles: {
            tableHeader: {
              bold: true,
              fontSize: 11,
              alignment: 'left'
            }
          }
        };

        const pdfDoc = pdfMake.createPdf(docDefinition as any);
        pdfDoc.download(`Hoa-don-${pdfData.invoiceCode}.pdf`);

      } else if (type === 'routing') {
        // Create routing guide content using pdfMake
        const routingContent = [
          // Header
          {
            text: 'PHIẾU HƯỚNG DẪN',
            fontSize: 18,
            bold: true,
            alignment: 'center',
            margin: [0, 0, 0, 10]
          },
          {
            text: `Mã phiếu: ${pdfData.prescriptionInfo?.prescriptionCode || prescription?.prescriptionCode}`,
            fontSize: 10,
            alignment: 'center',
            margin: [0, 0, 0, 20]
          },

          // Patient Info
          {
            text: 'Thông tin bệnh nhân:',
            fontSize: 12,
            bold: true,
            margin: [0, 0, 0, 10]
          },
          {
            text: `Tên: ${pdfData.patientInfo?.name || preview?.patientName || ''}`,
            fontSize: 11,
            margin: [0, 0, 0, 5]
          },
          {
            text: `Ngày lập: ${new Date().toLocaleDateString('vi-VN')}`,
            fontSize: 11,
            margin: [0, 0, 0, 5]
          },
          ...(pdfData.prescriptionInfo?.doctorName ? [{
            text: `Bác sĩ: ${pdfData.prescriptionInfo.doctorName}`,
            fontSize: 11,
            margin: [0, 0, 0, 20]
          }] : []),

          // Routing Assignments
          {
            text: 'HƯỚNG DẪN ĐẾN PHÒNG KHÁM',
            fontSize: 14,
            bold: true,
            margin: [0, 0, 0, 15]
          },

          // Room assignments - Sort by service order before mapping
          ...(pdfData.routingAssignments?.length ? (() => {
            // Debug logging
            console.log('PDF Export - Invoice Details:', pdfData.invoiceDetails);
            console.log('PDF Export - Routing Assignments:', pdfData.routingAssignments);

            return pdfData.routingAssignments.sort((a: { roomId: string; roomCode: string; roomName: string; boothId: string; boothCode: string; boothName: string; doctorId: string; doctorCode: string; doctorName: string }, b: { roomId: string; roomCode: string; roomName: string; boothId: string; boothCode: string; boothName: string; doctorId: string; doctorCode: string; doctorName: string }) => {
              // Create mapping of service codes to order  
              const serviceOrderMap: { [key: string]: number } = {};

              // Get order from invoice details (most reliable source)
              if (pdfData.invoiceDetails) {
                pdfData.invoiceDetails.forEach((detail: { serviceCode: string }, index: number) => {
                  serviceOrderMap[detail.serviceCode] = index + 1;
                  console.log(`Service ${detail.serviceCode} -> Order ${index + 1}`);
                });
              }

              // Function to get service order for an assignment
              const getServiceOrder = (assignment: { roomCode?: string; roomName?: string; serviceCode?: string }) => {
                const roomPrefix = assignment.roomCode?.split('-')[0]; // e.g., "HUY" from "HUY-1403"
                console.log(`Assignment ${assignment.roomName} (${assignment.roomCode}) -> Room Prefix: ${roomPrefix}`);

                // Direct mapping based on service codes and room types
                if (roomPrefix === 'CHU' && serviceOrderMap['XRAY_CHEST']) {
                  console.log(`Matched CHU room with XRAY_CHEST, order: ${serviceOrderMap['XRAY_CHEST']}`);
                  return serviceOrderMap['XRAY_CHEST'];
                }
                if (roomPrefix === 'HUY' && serviceOrderMap['CBC_TEST']) {
                  console.log(`Matched HUY room with CBC_TEST, order: ${serviceOrderMap['CBC_TEST']}`);
                  return serviceOrderMap['CBC_TEST'];
                }

                // Fallback: Try to find any service that matches room type
                for (const [serviceCode, order] of Object.entries(serviceOrderMap)) {
                  if (roomPrefix === 'CHU' && (serviceCode.includes('XRAY') || serviceCode.includes('CT') || serviceCode.includes('MRI'))) {
                    console.log(`Pattern matched ${serviceCode} with CHU room, order: ${order}`);
                    return order as number;
                  }
                  if (roomPrefix === 'HUY' && (serviceCode.includes('CBC') || serviceCode.includes('BLOOD'))) {
                    console.log(`Pattern matched ${serviceCode} with HUY room, order: ${order}`);
                    return order as number;
                  }
                }

                console.log(`No match found for ${assignment.roomName}, using default order 999`);
                return 999; // Default high order
              };

              const orderA = getServiceOrder(a);
              const orderB = getServiceOrder(b);

              console.log(`Comparing ${a.roomName} (order: ${orderA}) vs ${b.roomName} (order: ${orderB})`);
              return orderA - orderB;
            });
          })()
            .map((assignment: any, index: number) => {
            const practitioner = getPractitionerDisplay(assignment);
            return {
              stack: [
                {
                  text: `Phòng ${index + 1}: ${assignment.roomName} (${assignment.roomCode})`,
                  fontSize: 12,
                  bold: true,
                  margin: [0, 0, 0, 8]
                },
                {
                  text: `Buồng: ${assignment.boothName} (${assignment.boothCode})`,
                  fontSize: 11,
                  margin: [20, 0, 0, 5]
                },
                {
                  text: `${practitioner.label}: ${practitioner.name} (${practitioner.code})`,
                  fontSize: 11,
                  margin: [20, 0, 0, 15]
                }
              ]
            };
          }) : [{
            text: 'Không có hướng dẫn phòng khám nào.',
            fontSize: 11,
            italics: true
          }]),

          // Important Notes
          {
            text: 'Lưu ý quan trọng:',
            fontSize: 12,
            bold: true,
            margin: [0, 20, 0, 10]
          },
          {
            ul: [
              'Vui lòng đến phòng theo thứ tự được chỉ định',
              'Mang theo phiếu hướng dẫn này',
              'Tuân thủ hướng dẫn của nhân viên y tế'
            ],
            fontSize: 10,
            margin: [10, 0, 0, 20]
          },

          // Footer
          {
            text: 'Chúc quý khách mau chóng bình phục!',
            alignment: 'center',
            fontSize: 10
          }
        ];

        // Create PDF document
        const docDefinition = {
          content: routingContent
        };

        const pdfDoc = pdfMake.createPdf(docDefinition as any);
        pdfDoc.download(`Phieu-huong-dan-${pdfData.prescriptionInfo?.prescriptionCode || prescription?.prescriptionCode}.pdf`);
      }

      toast.success(`Đã xuất ${type === 'invoice' ? 'hóa đơn' : 'phiếu hướng dẫn'} thành công!`);
    } catch (error) {
      console.error('PDF export failed:', error);
      toast.error(`Xuất PDF thất bại: ${error instanceof Error ? error.message : 'Lỗi không xác định'}`);
      // Fallback: suggest using print function
      toast.info('Bạn có thể dùng nút "In" để lưu PDF thay thế');
    }
  }, [confirmResult, paymentMethod, preview, user, prescription, customerMoney]);

  const availableServices: Service[] = useMemo(() => {
    if (!prescription) return [];
    return prescription.services.map((s) => ({
      serviceId: s.service.id,
      serviceCode: s.service.serviceCode,
      name: s.service.name,
      price: s.service.price,
      description: s.service.description ?? undefined,
      status: s.status,
      order: s.order,
    })).sort((a, b) => (a.order || 0) - (b.order || 0)); // Sort by order
  }, [prescription]);

  const getStatusDisplay = (status: PrescriptionStatus) => {
    switch (status) {
      case PrescriptionStatus.NOT_STARTED:
        return { text: 'Chưa bắt đầu', color: 'text-blue-600 bg-blue-50' };
      case PrescriptionStatus.PENDING:
        return { text: 'Chờ xử lý', color: 'text-yellow-600 bg-yellow-50' };
      case PrescriptionStatus.WAITING:
        return { text: 'Đang chờ', color: 'text-orange-600 bg-orange-50' };
      case PrescriptionStatus.SERVING:
        return { text: 'Đang thực hiện', color: 'text-purple-600 bg-purple-50' };
      case PrescriptionStatus.WAITING_RESULT:
        return { text: 'Chờ kết quả', color: 'text-cyan-600 bg-cyan-50' };
      case PrescriptionStatus.COMPLETED:
        return { text: 'Hoàn thành', color: 'text-green-600 bg-green-50' };
      case PrescriptionStatus.DELAYED:
        return { text: 'Trì hoãn', color: 'text-red-600 bg-red-50' };
      case PrescriptionStatus.CANCELLED:
        return { text: 'Đã hủy', color: 'text-gray-600 bg-gray-50' };
      default:
        return { text: 'Không xác định', color: 'text-gray-600 bg-gray-50' };
    }
  };

  const canSelectService = (status: PrescriptionStatus) => {
    return status === PrescriptionStatus.NOT_STARTED;
  };

  const totalSelected = useMemo(() => {
    if (!preview) return 0;
    return preview.totalAmount;
  }, [preview]);

  // Tính toán giá gốc và giá khấu trừ
  const originalAmount = useMemo(() => {
    if (!preview) return 0;
    // Ưu tiên dùng originalTotalAmount từ BE
    if (preview.originalTotalAmount !== undefined) {
      return preview.originalTotalAmount;
    }
    // Fallback: tính từ originalPrice hoặc price của từng service
    return preview.selectedServices.reduce((sum, s) => {
      return sum + (s.originalPrice ?? s.price ?? 0);
    }, 0);
  }, [preview]);

  const discountAmount = useMemo(() => {
    if (!preview) return 0;
    // Ưu tiên dùng totalDiscountAmount từ BE
    if (preview.totalDiscountAmount !== undefined) {
      return preview.totalDiscountAmount;
    }
    // Fallback: tính từ chênh lệch
    const calculated = originalAmount - preview.totalAmount;
    return calculated > 0 ? calculated : 0;
  }, [preview, originalAmount]);

  const hasDiscount = discountAmount > 0;

  const isTransferPayment = paymentMethod === 'TRANSFER';
  const isCreatedInvoicePaid = createdInvoice ? ['PAID', 'SUCCEEDED'].includes(createdInvoice.paymentStatus ?? '') : false;
  const isCreatedInvoiceTransferPending = createdInvoice?.paymentMethod === 'TRANSFER' && !isCreatedInvoicePaid;

  const onLookup = async (code?: string) => {
    const codeToLookup = code || prescriptionCode.trim();
    if (!codeToLookup) {
      toast.error('Vui lòng nhập mã phiếu chỉ định');
      return;
    }
    setLoading(true);
    try {
      const { data } = await cashierApi.getPrescriptionByCode(codeToLookup);
      setPrescription(data);
      setSelectedCodes([]);
      setPreview(null);
      setCreatedInvoice(null);
      setConfirmResult(null);
      setCustomerMoney('');
      setPaymentMethod('CASH');
      setManualConfirming(false);
      setRefreshingTransaction(false);
      toast.success('Đã tải phiếu chỉ định');
    } catch (err: any) {
      toast.error(err.message || 'Không tìm thấy phiếu chỉ định');
      setPrescription(null);
    } finally {
      setLoading(false);
    }
  };

  // QR Scanner handlers
  const stopQrScanner = useCallback(async () => {
    setQrScanning(false);
    qrScanningRef.current = false;
    setUsingHtml5Qrcode(false);
    
    // Stop html5-qrcode if running
    if (qrHtml5QrCodeRef.current) {
      try {
        await qrHtml5QrCodeRef.current.stop();
        await qrHtml5QrCodeRef.current.clear();
      } catch (e) {
        console.warn('[QR] Error stopping html5-qrcode:', e);
      }
      qrHtml5QrCodeRef.current = null;
    }
    
    // Stop media stream
    const stream = qrMediaStreamRef.current;
    if (stream) {
      stream.getTracks().forEach(t => t.stop());
      qrMediaStreamRef.current = null;
    }
    if (qrVideoRef.current) {
      qrVideoRef.current.srcObject = null;
    }
  }, []);

  const handleQrText = useCallback(async (text: string) => {
    const trimmed = (text || '').trim();
    if (!trimmed) return;
    
    console.log('[QR] Raw:', text);
    const upper = trimmed.toUpperCase();
    
    // Parse mã prescription code từ format: PRE:PRE-xxx|... hoặc PRE-xxx|... hoặc PR-xxx|...
    let prescriptionCodeParsed = trimmed;
    
    // Kiểm tra nếu có format PRE:PRE-xxx hoặc PRE:PR-xxx
    if (trimmed.includes(':')) {
      const parts = trimmed.split('|');
      // Lấy phần đầu tiên (PRE:PRE-xxx)
      const firstPart = parts[0] || '';
      if (firstPart.includes(':')) {
        // Tách theo dấu : để lấy mã prescription code
        const codeParts = firstPart.split(':');
        if (codeParts.length >= 2) {
          prescriptionCodeParsed = codeParts[1].trim();
        }
      }
    } else {
      // Nếu không có format đặc biệt, lấy phần đầu trước dấu |
      const codeParts = trimmed.split('|');
      prescriptionCodeParsed = codeParts[0]?.trim() || trimmed;
    }
    
    console.log('[QR] Parsed prescription code:', prescriptionCodeParsed);
    setScanHint(`Đã quét mã: ${prescriptionCodeParsed.slice(0, 24)}${prescriptionCodeParsed.length > 24 ? '...' : ''}`);
    
    // Kiểm tra nếu mã bắt đầu bằng PRE hoặc PR
    if (!upper.startsWith('PRE') && !upper.startsWith('PR-')) {
      toast.error('Mã QR không phải mã phiếu chỉ định (PRE... hoặc PR-...)');
      setScanHint('Mã QR không đúng định dạng');
      return;
    }
    
    // Điền mã vào input
    setPrescriptionCode(prescriptionCodeParsed);
    toast.success(`Đã quét mã: ${prescriptionCodeParsed}`);
    
    // Đóng scanner sau khi quét thành công
    setTimeout(() => {
      setIsQrScannerOpen(false);
      stopQrScanner();
      
      // Tự động tra cứu sau khi đóng scanner
      setTimeout(async () => {
        await onLookup(prescriptionCodeParsed);
      }, 200); // Small delay to ensure scanner is fully closed
    }, 500);
  }, [stopQrScanner]);

  const startQrScanner = useCallback(async () => {
    setQrScanning(true);
    qrScanningRef.current = true;
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
      
      console.log('[QR] Got media stream:', !!stream);
      qrMediaStreamRef.current = stream;
      const video = qrVideoRef.current;
      if (!video) {
        console.warn('[QR] videoRef.current is null');
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
      
      console.log('[QR] Video ready');
      setScanHint('Camera đã sẵn sàng. Đưa mã QR vào khung...');

      // Try BarcodeDetector first
      interface BarcodeDetectorInterface {
        detect(image: HTMLVideoElement): Promise<Array<{ rawValue?: string; rawValueText?: string; raw?: string }>>;
      }
      
      const BD = (window as { BarcodeDetector?: new (options?: { formats: string[] }) => BarcodeDetectorInterface }).BarcodeDetector;
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
          }
        }
        
        if (detector) {
          console.log('[QR] BarcodeDetector initialized');
          const tick = async () => {
            if (!qrScanningRef.current || !qrVideoRef.current) {
              return;
            }
            
            try {
              const detections = await detector!.detect(qrVideoRef.current);
              if (detections && detections.length > 0) {
                const raw = (detections[0]?.rawValue ?? detections[0]?.rawValueText ?? detections[0]?.raw ?? '').toString();
                if (raw) {
                  const norm = raw.trim();
                  const now = Date.now();
                  // Debounce
                  if (qrLastScanRef.current === norm && now - qrLastScanTsRef.current < 1500) {
                    // skip duplicate
                  } else {
                    qrLastScanRef.current = norm;
                    qrLastScanTsRef.current = now;
                    console.log('[QR] Found QR code:', norm);
                    await handleQrText(norm);
                  }
                }
              }
            } catch (err) {
              console.warn('[QR] detect error:', err);
            }
            
            if (qrScanningRef.current) {
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
        if (qrMediaStreamRef.current) {
          qrMediaStreamRef.current.getTracks().forEach(t => t.stop());
          qrMediaStreamRef.current = null;
        }
        if (qrVideoRef.current) {
          qrVideoRef.current.srcObject = null;
        }
        
        const html5QrCode = new Html5Qrcode('invoice-qr-reader');
        qrHtml5QrCodeRef.current = html5QrCode;
        
        const qrCodeSuccessCallback = async (decodedText: string) => {
          const norm = decodedText.trim();
          const now = Date.now();
          
          // Debounce
          if (qrLastScanRef.current === norm && now - qrLastScanTsRef.current < 1500) {
            return;
          }
          
          qrLastScanRef.current = norm;
          qrLastScanTsRef.current = now;
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
      setQrScanning(false);
      qrScanningRef.current = false;
      const error = e instanceof Error ? e : new Error('Không thể truy cập camera');
      console.error('[QR] getUserMedia error:', error);
      toast.error(error.message || 'Không thể truy cập camera');
      setScanHint('Lỗi khởi động camera');
    }
  }, [handleQrText]);

  // Handle QR scanner dialog open/close
  useEffect(() => {
    if (isQrScannerOpen) {
      setTimeout(() => {
        startQrScanner();
      }, 100);
    } else {
      stopQrScanner();
    }
    
    return () => {
      stopQrScanner();
    };
  }, [isQrScannerOpen, startQrScanner, stopQrScanner]);

  const toggleSelect = useCallback((serviceCode: string) => {
    setSelectedCodes((prev) =>
      prev.includes(serviceCode) ? prev.filter((c) => c !== serviceCode) : [...prev, serviceCode]
    );
  }, []);

  // Auto preview whenever selected services change
  useEffect(() => {
    if (!prescription) {
      setPreview(null);
      return;
    }
    if (previewTimerRef.current) clearTimeout(previewTimerRef.current);
    // Small debounce to avoid flooding while clicking fast
    previewTimerRef.current = setTimeout(async () => {
      if (selectedCodes.length === 0) {
        setPreview(null);
        return;
      }
      try {
        setPreviewLoading(true);
        const { data } = await cashierApi.previewInvoice({
          prescriptionCode: prescription.prescriptionCode,
          paymentMethod,
          selectedServiceCodes: selectedCodes,
        });
        setPreview(data);
      } catch (err: any) {
        toast.error(err.message || 'Không thể xem trước hoá đơn');
      } finally {
        setPreviewLoading(false);
      }
    }, 250);

    return () => {
      if (previewTimerRef.current) clearTimeout(previewTimerRef.current);
    };
  }, [paymentMethod, prescription, selectedCodes]);

  // Remove onPreview function as it's now automatic
  // const onPreview = async () => {}; // Keep for compatibility but do nothing

  const getPayosUrls = useCallback(() => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    return {
      returnUrl:
        process.env.NEXT_PUBLIC_PAYOS_RETURN_URL?.trim() ||
        (origin ? `${origin}/payments/transfer-success` : undefined),
      cancelUrl:
        process.env.NEXT_PUBLIC_PAYOS_CANCEL_URL?.trim() ||
        (origin ? `${origin}/payments/transfer-cancel` : undefined),
    };
  }, []);


  const finalizePaidInvoice = useCallback((invoice: InvoicePaymentSummary) => {
    setCreatedInvoice(invoice);
    setConfirmResult(invoice);

    setTransactionHistory((prev) => [
      {
        invoiceCode: invoice.invoiceCode,
        amount: invoice.totalAmount,
        time: new Date(),
        patientName: invoice.patientInfo?.name || preview?.patientName || ''
      },
      ...prev.slice(0, 9)
    ]);

    const successMessage = invoice.routingAssignments?.length
      ? 'Thanh toán thành công! Đã xuất hóa đơn và phiếu hướng dẫn.'
      : 'Thanh toán thành công! Đã xuất hóa đơn.';

    toast.success(successMessage);

    setTimeout(() => {
      exportSectionAsPdf('invoice', invoice);
      if (invoice.routingAssignments?.length) {
        toast.info('Đang xuất phiếu hướng dẫn... Nếu không thấy tệp tải xuống, hãy bấm "Tải PDF phiếu hướng dẫn".');
        setTimeout(() => {
          exportSectionAsPdf('routing', invoice);
        }, 1500);
      }
    }, 200);

    setTimeout(() => {
      window.location.reload();
    }, 4000);
  }, [exportSectionAsPdf, preview]);

  const copyToClipboard = useCallback(async (content: string, successMessage: string) => {
    try {
      await navigator.clipboard.writeText(content);
      toast.success(successMessage);
    } catch (error) {
      console.error('Clipboard error:', error);
      toast.error('Không thể sao chép. Vui lòng thử lại.');
    }
  }, []);

  const onPayment = useCallback(async () => {
    if (!prescription || !user) {
      toast.error('Vui lòng tra cứu phiếu chỉ định trước khi thanh toán');
      return;
    }

    if (selectedCodes.length === 0) {
      toast.error('Vui lòng chọn ít nhất một dịch vụ để thanh toán');
      return;
    }

    if (paymentMethod !== 'TRANSFER') {
      if (!customerMoney) {
        toast.error('Vui lòng nhập số tiền khách đưa');
        return;
      }
      const customerValue = parseInt(customerMoney, 10);
      if (Number.isNaN(customerValue) || customerValue < totalSelected) {
        toast.error('Số tiền khách đưa chưa đủ để thanh toán');
        return;
      }
    }

    setCreating(true);
    try {
      const basePayload = {
        prescriptionCode: prescription.prescriptionCode,
        paymentMethod,
        cashierId: user.id,
        selectedServiceCodes: selectedCodes,
      } as const;

      if (paymentMethod === 'TRANSFER') {
        const { returnUrl, cancelUrl } = getPayosUrls();

        const { data } = await cashierApi.createInvoiceDraft({
          ...basePayload,
          returnUrl,
          cancelUrl,
        });

        if (data.paymentStatus && ['PAID', 'SUCCEEDED'].includes(data.paymentStatus)) {
          finalizePaidInvoice(data);
          return;
        }

        setConfirmResult(null);
        setManualConfirming(false);
        setRefreshingTransaction(false);
        setCreatedInvoice(data);
        setPaymentModalOpen(true);
        setPaymentModalInvoiceCode(data.invoiceCode);

        if (!data.transaction?.paymentUrl) {
          toast.warning('Không nhận được liên kết thanh toán từ PayOS. Vui lòng thử lại hoặc chọn phương thức khác.');
        } else {
          toast.info('Đã tạo yêu cầu thanh toán chuyển khoản. Vui lòng hướng dẫn khách hàng quét QR hoặc mở liên kết thanh toán.');
        }

        return;
      }

      const { data: draftData } = await cashierApi.createInvoiceDraft(basePayload);
      const { data: confirmData } = await cashierApi.confirmPayment({
        invoiceCode: draftData.invoiceCode,
        cashierId: user.id,
      });
      finalizePaidInvoice(confirmData);
    } catch (err: any) {
      console.error('Payment error:', err);
      toast.error(err?.message || 'Thanh toán thất bại');
    } finally {
      setCreating(false);
    }
  }, [
    customerMoney,
    finalizePaidInvoice,
    paymentMethod,
    prescription,
    selectedCodes,
    totalSelected,
    user,
  ]);

  const handleRefreshTransaction = useCallback(async () => {
    if (!createdInvoice || createdInvoice.paymentMethod !== 'TRANSFER') return;

    setRefreshingTransaction(true);
    try {
      const { returnUrl, cancelUrl } = getPayosUrls();
      const { data } = await cashierApi.refreshTransferTransaction(createdInvoice.invoiceCode, {
        returnUrl,
        cancelUrl,
      });
      if (data.paymentStatus && ['PAID', 'SUCCEEDED'].includes(data.paymentStatus)) {
        finalizePaidInvoice(data);
      } else {
        setCreatedInvoice(data);
        setPaymentModalOpen(true);
        setPaymentModalInvoiceCode(data.invoiceCode);
        toast.success('Đã làm mới liên kết thanh toán PayOS');
      }
    } catch (err: any) {
      console.error('Refresh transaction error:', err);
      toast.error(err?.message || 'Không thể làm mới liên kết thanh toán');
    } finally {
      setRefreshingTransaction(false);
    }
  }, [createdInvoice, finalizePaidInvoice, getPayosUrls]);

  const handleManualConfirm = useCallback(async () => {
    if (!createdInvoice || createdInvoice.paymentMethod !== 'TRANSFER' || !user) return;

    const transactionId = createdInvoice.transaction?.id || createdInvoice.transaction?.providerTransactionId;
    if (!transactionId) {
      toast.error('Không tìm thấy mã giao dịch để xác nhận thủ công');
      return;
    }

    setManualConfirming(true);
    try {
      const { data } = await cashierApi.confirmPayment({
        invoiceCode: createdInvoice.invoiceCode,
        cashierId: user.id,
        transactionId,
      });

      if (data.paymentStatus && ['PAID', 'SUCCEEDED'].includes(data.paymentStatus)) {
        finalizePaidInvoice(data);
        return;
      }

      setCreatedInvoice(data);
      setConfirmResult(null);
      toast.warning('PayOS vẫn chưa xác nhận giao dịch. Vui lòng thử lại sau hoặc chờ webhook.');
    } catch (err: any) {
      console.error('Manual confirm error:', err);
      toast.error(err?.message || 'Không thể xác nhận thanh toán chuyển khoản');
    } finally {
      setManualConfirming(false);
    }
  }, [createdInvoice, finalizePaidInvoice, user]);

  const handlePrint = (mode: 'invoice' | 'routing' | 'payment') => {
    setPrintMode(mode);
    setTimeout(() => {
      window.print();
      setPrintMode('none');
    }, 50);
  };

  // Realtime: listen for PayOS webhook result via socket and auto finalize
  useEffect(() => {
    if (!user?.id) {
      if (socketRef.current) {
        try {
          socketRef.current.emit('leave_cashier');
          socketRef.current.disconnect();
        } catch {
          // noop
        }
        socketRef.current = null;
      }
      return;
    }

    const envUrl = typeof process !== 'undefined' ? process.env.NEXT_PUBLIC_QUEUE_SOCKET_URL?.trim() : undefined;
    const baseUrl = envUrl || (typeof window !== 'undefined' ? `${window.location.origin}/counters` : '');
    if (!baseUrl) return;

    const socket = io(baseUrl, {
      transports: ['websocket'],
      withCredentials: true,
    });
    socketRef.current = socket;

    const cashierId = user.id;
    setSocketLog(prev => [`socket url: ${baseUrl}${!envUrl ? ' (fallback)' : ''}`, ...prev].slice(0, 10));
    const handleConnect = () => {
      setSocketLog(prev => [`emit: join_cashier { cashierId: ${cashierId} }`, ...prev].slice(0, 10));
      socket.emit('join_cashier', { cashierId });
    };

    socket.on('connect', handleConnect);
    socket.on('joined_cashier', () => {
      // joined cashier room
      setSocketLog(prev => [`on: joined_cashier`, ...prev].slice(0, 10));
    });
    socket.on('disconnect', (reason: string) => {
      setSocketLog(prev => [`socket disconnected: ${reason}`, ...prev].slice(0, 10));
    });
    socket.on('connect_error', (err: any) => {
      setSocketLog(prev => [`connect_error: ${err?.message || 'unknown'}`, ...prev].slice(0, 10));
    });

    // When payment succeeded (webhook processed), get invoice details and download PDF
    // NOTE: Only handle TRANSFER payments here. CASH payments are handled in finalizePaidInvoice
    socket.on('invoice_payment_success', async (payload: any) => {
      try {
        const invoiceId = payload?.data?.invoiceId || payload?.invoiceId;
        const invoiceCode = payload?.data?.invoiceCode || payload?.invoiceCode;
        const targetCashier = payload?.data?.cashierId || payload?.cashierId;
        const paymentMethod = payload?.data?.paymentMethod || payload?.paymentMethod;
        
        if (!invoiceId) {
          console.log('No invoiceId in payload, trying invoiceCode:', invoiceCode);
          return;
        }
        if (targetCashier && targetCashier !== cashierId) return;
        
        // Chỉ xử lý socket event cho TRANSFER payments (webhook từ PayOS)
        // CASH payments đã được xử lý trong finalizePaidInvoice và không cần export PDF lại
        if (paymentMethod !== 'TRANSFER') {
          console.log('[SOCKET] Ignoring invoice_payment_success for non-TRANSFER payment:', paymentMethod);
          return;
        }

        // Kiểm tra xem modal PayOS có đang mở cho invoice này không
        const isModalOpenForThisInvoice = paymentModalOpen && paymentModalInvoiceCode === invoiceCode;

        // Call new API to get invoice details using cashierApi
        try {
          const { data: invoiceResponse } = await cashierApi.getInvoiceById(invoiceId);
          console.log('Invoice details received:', invoiceResponse);

          if (invoiceResponse?.success && invoiceResponse?.data) {
            const invoiceData = invoiceResponse.data;
            
            // Transform the data to match expected format
            const transformedData = {
              invoiceCode: invoiceData.invoiceCode,
              totalAmount: invoiceData.totalAmount,
              paymentStatus: invoiceData.paymentStatus,
              paymentMethod: invoiceData.paymentMethod,
              patientInfo: {
                name: invoiceData.patientProfile?.name,
                dateOfBirth: invoiceData.patientProfile?.dateOfBirth,
                gender: invoiceData.patientProfile?.gender,
              },
              prescriptionInfo: {
                prescriptionCode: invoiceData.invoiceDetails?.[0]?.prescription?.prescriptionCode,
                status: invoiceData.invoiceDetails?.[0]?.prescription?.status,
                doctorName: invoiceData.invoiceDetails?.[0]?.prescription?.doctor?.auth?.name,
              },
              invoiceDetails: invoiceData.invoiceDetails?.map((detail: any) => ({
                serviceCode: detail.service?.serviceCode,
                serviceName: detail.service?.name,
                price: detail.service?.price,
              })) || [],
              routingAssignments: [], // This might need to be populated from another API
              transaction: invoiceData.paymentTransactions?.[0] || null,
            };

            // Chỉ export PDF nếu chưa được export (kiểm tra xem confirmResult đã có chưa)
            // Nếu confirmResult đã có invoiceCode này thì không export lại
            if (!confirmResult || confirmResult.invoiceCode !== invoiceData.invoiceCode) {
              // Auto download PDF immediately with correct payment data
              setTimeout(() => {
                exportSectionAsPdf('invoice', transformedData, invoiceData.amountPaid || invoiceData.totalAmount);
              }, 500);

              // Show success message
              toast.success('Thanh toán thành công! Đang tải xuống hóa đơn...');
              
              // Cập nhật state để tránh export lại
              setConfirmResult(transformedData as InvoicePaymentSummary);
            } else {
              console.log('[SOCKET] Invoice already finalized, skipping PDF export');
            }

            // Nếu modal đang mở cho invoice này, đóng modal và refresh trang
            if (isModalOpenForThisInvoice) {
              setPaymentModalOpen(false);
              setPaymentModalInvoiceCode(null);
              // Refresh trang sau 1 giây để đảm bảo PDF đã được tải xuống
              setTimeout(() => {
                window.location.reload();
              }, 1000);
            }
          }
        } catch (error) {
          console.error('Error fetching invoice details:', error);
          // Don't show error toast as this is a background operation
        }
      } catch (error) {
        console.error('Error processing payment success:', error);
        toast.error('Có lỗi xảy ra khi xử lý thanh toán thành công');
      }
    });

    socket.on('error', () => {});
    socket.on('disconnect', () => {});

    handleConnect();

    return () => {
      try {
        socket.emit('leave_cashier');
        setSocketLog(prev => [`emit: leave_cashier`, ...prev].slice(0, 10));
      } finally {
        socket.removeAllListeners();
        socket.disconnect();
      }
      socketRef.current = null;
    };
  }, [user?.id, finalizePaidInvoice, confirmResult, exportSectionAsPdf]);

  return (
    <div className="container mx-auto py-6 px-8 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <CreditCard className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-semibold">Thanh toán dịch vụ</h1>
        </div>

          <div className="flex items-center gap-4">


          {transactionHistory.length > 0 && (
            <div className="bg-green-50 px-4 py-2 rounded-lg border border-green-200">
              <div className="text-sm text-green-800">
                <span className="font-medium">Doanh thu hôm nay:</span>
                <span className="font-semibold ml-2 text-green-600">
                  {transactionHistory.reduce((sum, t) => sum + t.amount, 0).toLocaleString()} đ
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Scan className="h-5 w-5 text-primary" />
            Tra cứu phiếu chỉ định
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-3">
            <div className="flex-1">
              <Label htmlFor="prescriptionCode" className="pb-2.5">Mã phiếu chỉ định</Label>
              <Input
                id="prescriptionCode"
                placeholder="VD: PR-1756431212787-AIGAQI hoặc PRE-..."
                value={prescriptionCode}
                onChange={(e) => {
                  setPrescriptionCode(e.target.value);
                  // Clear prescription when input is cleared
                  if (!e.target.value.trim()) {
                    setPrescription(null);
                  }
                }}
                onKeyDown={(e) => e.key === 'Enter' && onLookup()}
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => onLookup()} disabled={loading}>
                <FileSearch className="h-4 w-4 mr-2" /> Tra cứu
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setIsQrScannerOpen(true)}
              title=""
              >
                <QrCode className="h-4 w-4 mr-2" /> 
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Thông tin phiếu chỉ định</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {prescription ? (
                <>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline">Mã: {prescription.prescriptionCode}</Badge>
                  </div>
                  <div>Bác sĩ: {prescription.doctor?.doctorCode || 'N/A'}</div>
                </>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Clipboard className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p>Chưa tra cứu phiếu chỉ định</p>
                  <p className="text-sm">Vui lòng nhập mã phiếu và tra cứu</p>
                </div>
              )}
            </CardContent>
          </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Chọn dịch vụ thanh toán</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {availableServices.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Clipboard className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                    <p>Chưa có dịch vụ nào</p>
                    <p className="text-sm">Vui lòng tra cứu phiếu chỉ định trước</p>
                  </div>
                ) : (
                  availableServices.map((s) => {
                    const checked = selectedCodes.includes(s.serviceCode);
                    const statusInfo = getStatusDisplay(s.status);
                    const canSelect = canSelectService(s.status);

                    return (
                      <div key={s.serviceCode} className="flex items-center justify-between border rounded-md p-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <div className="font-medium text-sm">{s.name}</div>
                            <Badge variant="secondary" className={`text-xs ${statusInfo.color}`}>
                              {statusInfo.text}
                            </Badge>
                          </div>
                          <div className="text-xs text-muted-foreground">{s.serviceCode}</div>
                          {s.order && (
                            <div className="text-xs text-muted-foreground">Thứ tự: {s.order}</div>
                          )}
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            {s.originalPrice && s.originalPrice > s.price ? (
                              <div className="space-y-0.5">
                                <div className="text-xs text-gray-400 line-through">
                                  {s.originalPrice.toLocaleString()} đ
                                </div>
                                <div className="text-sm font-semibold text-primary">
                                  {s.price?.toLocaleString()} đ
                                </div>
                                {s.discountPercent && (
                                  <div className="text-xs text-green-600">
                                    -{s.discountPercent}%
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="text-sm font-semibold">{s.price?.toLocaleString()} đ</div>
                            )}
                          </div>
                          {canSelect ? (
                            <Button
                              variant={checked ? 'default' : 'outline'}
                              size="sm"
                              onClick={() => toggleSelect(s.serviceCode)}
                            >
                              {checked ? 'Bỏ chọn' : 'Chọn'}
                            </Button>
                          ) : (
                            <Button variant="secondary" size="sm" disabled>
                              {statusInfo.text}
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Thanh toán</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-sm">Số dịch vụ đã chọn: {selectedCodes.length}</div>
                <Separator />
                
                {/* Hiển thị giá gốc, giá khấu trừ và tổng thanh toán */}
                {previewLoading ? (
                  <div className="text-sm flex items-center justify-between">
                    <span>Tổng tiền:</span>
                    <span className="font-semibold text-lg">...</span>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {hasDiscount && (
                      <>
                        <div className="text-sm flex items-center justify-between text-gray-600">
                          <span>Tổng giá gốc:</span>
                          <span>{originalAmount.toLocaleString()} đ</span>
                        </div>
                        <div className="text-sm flex items-center justify-between text-green-600">
                          <span className="flex items-center gap-2">
                            <span>Giảm giá</span>
                            <span>:</span>
                          </span>
                          <span className="font-medium">-{discountAmount.toLocaleString()} đ</span>
                        </div>
                        <Separator />
                      </>
                    )}
                    <div className="text-sm flex items-center justify-between">
                      <span className="font-medium">Tổng thanh toán:</span>
                      <span className="font-semibold text-lg text-primary">
                        {totalSelected.toLocaleString()} đ
                      </span>
                    </div>
                  </div>
                )}

              {selectedCodes.length === 0 ? (
                <div className="text-center py-6 text-gray-500">
                  <div className="text-sm">Chưa chọn dịch vụ nào</div>
                </div>
              ) : (
                  <>
                    <Separator />
                    {!isTransferPayment && (
                      <div className="space-y-3">
                        <Label htmlFor="customer-money">Tiền khách đưa</Label>
                        <div className="flex gap-2">
                          <Input
                            id="customer-money"
                            type="number"
                            placeholder="Nhập số tiền khách đưa..."
                            value={customerMoney}
                            onChange={(e) => setCustomerMoney(e.target.value)}
                            className="text-lg flex-1"
                          />
                          <Button
                            variant="outline"
                            onClick={() => setCustomerMoney(totalSelected.toString())}
                            className="px-3"
                          >
                            Đủ
                          </Button>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          {[1000, 2000, 5000, 10000, 20000, 50000, 100000, 200000, 500000].map(amount => (
                            <Button
                              key={amount}
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                const current = parseInt(customerMoney) || 0;
                                setCustomerMoney((current + amount).toString());
                              }}
                            >
                              +{amount.toLocaleString()}
                            </Button>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label>Phương thức thanh toán</Label>
                      <div className="flex gap-2">
                        {[
                          { value: 'CASH', label: 'Tiền mặt', icon: HandCoins, color: 'bg-green-100 text-green-800' },
                          { value: 'TRANSFER', label: 'Chuyển khoản', icon: Landmark, color: 'bg-purple-100 text-purple-800' }
                        ].map(method => {
                          const IconComponent = method.icon;
                          return (
                            <Button
                              key={method.value}
                              variant={paymentMethod === method.value ? 'default' : 'outline'}
                              size="sm"
                              onClick={() => setPaymentMethod(method.value as any)}
                              className={paymentMethod === method.value ? method.color : ''}
                            >
                              <IconComponent className="h-4 w-4 mr-1" />
                              {method.label}
                            </Button>
                          );
                        })}
                      </div>
                    </div>

                    {!isTransferPayment && customerMoney && parseInt(customerMoney) >= totalSelected && (
                      <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                        <div className="text-sm flex items-center justify-between">
                          <span>Tiền thối lại:</span>
                          <span className="font-semibold text-green-600 text-lg">
                            {(parseInt(customerMoney) - totalSelected).toLocaleString()} đ
                          </span>
                        </div>
                      </div>
                    )}

                    {!isTransferPayment && customerMoney && parseInt(customerMoney) < totalSelected && (
                      <div className="bg-red-50 p-3 rounded-lg border border-red-200">
                        <div className="text-sm text-red-600">
                          Thiếu {(totalSelected - parseInt(customerMoney)).toLocaleString()} đ
                        </div>
                      </div>
                    )}

                    <Button
                      className="w-full bg-green-600 hover:bg-green-700"
                      onClick={onPayment}
                      disabled={
                        creating ||
                        selectedCodes.length === 0 ||
                        (!isTransferPayment && (!customerMoney || parseInt(customerMoney) < totalSelected))
                      }
                    >
                      {creating
                        ? 'Đang xử lý...'
                        : isTransferPayment
                          ? 'Tạo yêu cầu chuyển khoản'
                          : 'Thanh toán'}
                    </Button>
                    {isTransferPayment && !creating && (
                      <p className="text-xs text-muted-foreground text-center">
                        Hệ thống sẽ cung cấp QR và liên kết PayOS sau khi tạo yêu cầu.
                      </p>
                    )}
                  </>
                )}

              </CardContent>
            </Card>

            {preview && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Chi tiết xem trước</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  {preview?.selectedServices.map((s) => (
                    <div key={s.serviceCode} className="flex items-center justify-between">
                      <div className="flex-1">
                        <span>{s.name}</span>
                        {s.discountPercent && (
                          <Badge variant="secondary" className="ml-2 text-xs bg-green-100 text-green-700">
                            -{s.discountPercent}%
                          </Badge>
                        )}
                      </div>
                      <div className="text-right">
                        {s.originalPrice && s.originalPrice > s.price ? (
                          <div className="space-y-0.5">
                            <div className="text-xs text-gray-400 line-through">
                              {s.originalPrice.toLocaleString()} đ
                            </div>
                            <div className="font-medium text-primary">
                              {s.price.toLocaleString()} đ
                            </div>
                          </div>
                        ) : (
                          <span>{s.price.toLocaleString()} đ</span>
                        )}
                      </div>
                    </div>
                  ))}
                  <Separator />
                  
                  {/* Hiển thị giá gốc, giá khấu trừ và tổng thanh toán */}
                  {hasDiscount && (
                    <>
                      <div className="flex items-center justify-between text-gray-600">
                        <span>Tổng giá gốc:</span>
                        <span>{originalAmount.toLocaleString()} đ</span>
                      </div>
                      <div className="flex items-center justify-between text-green-600">
                        <span className="flex items-center gap-2">
                          <span>Giảm giá</span>
                          
                          <span>:</span>
                        </span>
                        <span className="font-medium">-{discountAmount.toLocaleString()} đ</span>
                      </div>
                      <Separator />
                    </>
                  )}
                  
                  <div className="flex items-center justify-between font-semibold">
                    <span>Tổng thanh toán:</span>
                    <span className="text-primary">{preview?.totalAmount.toLocaleString()} đ</span>
                  </div>
                </CardContent>
              </Card>
            )}

            {createdInvoice && isCreatedInvoiceTransferPending && (
              <Card>
                <CardContent className="space-y-4 text-sm pt-6">
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" variant="outline" onClick={() => {
                      setPaymentModalOpen(true);
                      setPaymentModalInvoiceCode(createdInvoice?.invoiceCode || null);
                    }}>
                      <QrCode className="h-4 w-4 mr-1" /> Xem thông tin thanh toán
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleRefreshTransaction}
                      disabled={refreshingTransaction}
                    >
                      <RefreshCcw className="h-4 w-4 mr-1" />
                      {refreshingTransaction ? 'Đang làm mới...' : 'Làm mới liên kết'}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleManualConfirm}
                      disabled={manualConfirming}
                    >
                      <CheckCircle2 className="h-4 w-4 mr-1" />
                      {manualConfirming ? 'Đang xác nhận...' : 'Xác nhận thủ công'}
                    </Button>
                  </div>

                  {/* Payment info modal */}
                  <Dialog open={paymentModalOpen} onOpenChange={(open) => {
                    setPaymentModalOpen(open);
                    if (!open) {
                      setPaymentModalInvoiceCode(null);
                    }
                  }}>
                    <DialogContent className="sm:max-w-md">
                      <DialogHeader>
                        <DialogTitle>Thông tin thanh toán PayOS</DialogTitle>
                      </DialogHeader>

                      {createdInvoice?.transaction && (
                        <div className="space-y-3">
                          <div className="text-sm">Số tiền: <span className="font-semibold">{createdInvoice.totalAmount.toLocaleString()} đ</span></div>

                          {createdInvoice.transaction.qrCode && (
                            <div className="flex flex-col items-center gap-2">
                              {createdInvoiceQrImage ? (
                                <img src={createdInvoiceQrImage} alt="QR PayOS" className="w-56 h-56 object-contain rounded bg-white p-2" />
                              ) : (
                                <div className="rounded bg-white/80 px-3 py-2 text-center text-xs text-purple-700">
                                  Không thể hiển thị mã QR tự động, hãy sử dụng chuỗi dữ liệu bên dưới.
                                </div>
                              )}
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  const qr = createdInvoice.transaction && createdInvoice.transaction.qrCode;
                                  if (qr) copyToClipboard(qr, 'Đã sao chép nội dung QR chuyển khoản');
                                }}
                              >
                                <Clipboard className="h-4 w-4 mr-1" /> Sao chép nội dung QR
                              </Button>
                              <div className="w-full rounded bg-white/70 p-2 text-[11px] text-purple-700 break-all">
                                {createdInvoice.transaction.qrCode}
                              </div>
                            </div>
                          )}

                          {createdInvoice.transaction.paymentUrl && (
                            <div className="space-y-1 text-xs">
                              <div className="break-all">Liên kết: {createdInvoice.transaction.paymentUrl}</div>
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    const url = createdInvoice.transaction && createdInvoice.transaction.paymentUrl;
                                    if (url) window.open(url, '_blank', 'noopener');
                                  }}
                                >
                                  <ExternalLink className="h-4 w-4 mr-1" /> Mở PayOS
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    const url = createdInvoice.transaction && createdInvoice.transaction.paymentUrl;
                                    if (url) copyToClipboard(url, 'Đã sao chép liên kết PayOS');
                                  }}
                                >
                                  <Copy className="h-4 w-4 mr-1" /> Sao chép liên kết
                                </Button>
                              </div>
                            </div>
                          )}

                          <div className="flex justify-end gap-2 pt-2">
                            <Button variant="outline" onClick={() => handlePrint('payment')}>
                              <Printer className="h-4 w-4 mr-1" /> In phiếu thanh toán
                            </Button>
                          </div>
                        </div>
                      )}
                    </DialogContent>
                  </Dialog>
                </CardContent>
              </Card>
            )}

          <div className="grid grid-cols-1 gap-2">
            <Button className="w-full" variant="outline" disabled={!confirmResult} onClick={() => handlePrint('invoice')}>
              <Printer className="h-4 w-4 mr-2" /> In hoá đơn
            </Button>
            <Button className="w-full" variant="outline" disabled={!confirmResult?.routingAssignments?.length} onClick={() => handlePrint('routing')}>
              <Printer className="h-4 w-4 mr-2" /> In phiếu hướng dẫn
            </Button>
            <Button
              className="w-full"
              variant="outline"
              disabled={!confirmResult}
              onClick={() => exportSectionAsPdf('invoice')}
            >
              Tải PDF hoá đơn
            </Button>
            <Button
              className="w-full"
              variant="outline"
              disabled={!confirmResult?.routingAssignments?.length}
              onClick={() => exportSectionAsPdf('routing')}
            >
              Tải PDF phiếu hướng dẫn
            </Button>
          </div>
        </div>
      </div>

      {/* Printable sections */}
      {confirmResult && (
        <div className={printMode === 'invoice' ? '' : 'hidden print:block'}>
          <div id="print-invoice" data-print-scope className={printMode === 'invoice' ? 'block' : 'hidden'}>
            <h2 className="text-xl font-semibold mb-2">Hóa đơn thanh toán</h2>
            <div className="text-sm mb-2">Mã hoá đơn: {confirmResult?.invoiceCode}</div>
            <div className="text-sm mb-2">Trạng thái: {confirmResult?.paymentStatus}</div>
            <div className="text-sm mb-2">Bệnh nhân: {confirmResult?.patientInfo?.name || preview?.patientName || ''}</div>
            <Separator className="my-2" />
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className="text-left">Dịch vụ</th>
                  <th className="text-right">Giá</th>
                </tr>
              </thead>
              <tbody>
                {confirmResult?.invoiceDetails?.map((d) => (
                  <tr key={d.serviceCode}>
                    <td>{d.serviceName}</td>
                    <td className="text-right">{d.price.toLocaleString()} đ</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <Separator className="my-2" />
            <div className="text-right font-semibold">Tổng: {confirmResult?.totalAmount?.toLocaleString()} đ</div>
            {confirmResult?.transaction?.qrCode && (
              <div className="mt-4 flex flex-col items-center gap-2">
                <span className="text-sm font-semibold">QR chuyển khoản PayOS</span>
                {confirmedInvoiceQrImage ? (
                  <img
                    src={confirmedInvoiceQrImage}
                    alt="QR PayOS"
                    className="h-40 w-40 object-contain"
                  />
                ) : (
                  <span className="text-xs text-gray-600 text-center">
                    Không thể hiển thị mã QR, vui lòng sử dụng liên kết thanh toán: {confirmResult.transaction.paymentUrl}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {confirmResult?.routingAssignments && confirmResult.routingAssignments.length > 0 && (
        <div className={printMode === 'routing' ? '' : 'hidden print:block'}>
          <div id="print-routing" data-print-scope className={printMode === 'routing' ? 'block' : 'hidden'}>
            <h2 className="text-xl font-semibold mb-2">Phiếu hướng dẫn</h2>
            <div className="text-sm mb-2">Bệnh nhân: {confirmResult?.patientInfo?.name || preview?.patientName || ''}</div>
            <div className="text-sm mb-2">Phiếu: {confirmResult?.prescriptionInfo?.prescriptionCode || prescription?.prescriptionCode}</div>
            <Separator className="my-2" />
            <div className="space-y-2 text-sm">
              {confirmResult?.routingAssignments?.map((r) => {
                const getPractitionerInfo = (assignment: any) => {
                  if (assignment.doctorId && assignment.doctorName !== 'N/A') {
                    return { label: 'Bác sĩ', name: assignment.doctorName, code: assignment.doctorCode };
                  } else if (assignment.technicianId && assignment.technicianName !== 'N/A') {
                    return { label: 'Kỹ thuật viên', name: assignment.technicianName, code: assignment.technicianCode };
                  }
                  return { label: 'Người thực hiện', name: 'N/A', code: 'N/A' };
                };

                const practitioner = getPractitionerInfo(r);

                return (
                  <div key={r.boothId} className="border p-2 rounded">
                    <div><span className="font-medium">Phòng:</span> {r.roomName} ({r.roomCode})</div>
                    <div><span className="font-medium">Buồng:</span> {r.boothName} ({r.boothCode})</div>
                    <div><span className="font-medium">{practitioner.label}:</span> {practitioner.name} ({practitioner.code})</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Transaction History */}
      {transactionHistory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <span>📋 Lịch sử giao dịch hôm nay</span>
              <Badge variant="secondary">{transactionHistory.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {transactionHistory.map((transaction, index) => (
                <div
                  key={transaction.invoiceCode}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-sm font-semibold">
                      {index + 1}
                    </div>
                    <div>
                      <div className="font-medium text-sm">{transaction.patientName}</div>
                      <div className="text-xs text-gray-500">
                        {transaction.invoiceCode} • {transaction.time.toLocaleTimeString('vi-VN')}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-green-600">
                      {transaction.amount.toLocaleString()} đ
                    </div>
                    <div className="text-xs text-gray-500">
                      {transaction.time.toLocaleDateString('vi-VN')}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <Separator className="my-4" />

            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">Tổng doanh thu hôm nay:</span>
              <span className="font-semibold text-green-600 text-lg">
                {transactionHistory.reduce((sum, t) => sum + t.amount, 0).toLocaleString()} đ
              </span>
            </div>

            <Button
              variant="outline"
              className="w-full mt-3"
              onClick={() => setTransactionHistory([])}
            >
              Xóa lịch sử
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Payment slip for QR (print-friendly) */}
      {createdInvoice?.transaction && (
        <div className={printMode === 'payment' ? '' : 'hidden print:block'}>
          <div id="print-payment" data-print-scope className={printMode === 'payment' ? 'block' : 'hidden'}>
            <h2 className="text-xl font-semibold mb-2">Phiếu thanh toán chuyển khoản</h2>
            <div className="text-sm mb-2">Mã hoá đơn: {createdInvoice?.invoiceCode}</div>
            <div className="text-sm mb-2">Số tiền: {createdInvoice?.totalAmount?.toLocaleString()} đ</div>
            <Separator className="my-2" />
            {createdInvoice.transaction.qrCode && (
              <div className="mt-2 flex flex-col items-center gap-2">
                {createdInvoiceQrImage ? (
                  <img
                    src={createdInvoiceQrImage}
                    alt="QR PayOS"
                    className="h-48 w-48 object-contain bg-white p-2 rounded"
                  />
                ) : (
                  <span className="text-xs text-gray-600 text-center">
                    Không thể hiển thị mã QR, vui lòng dùng liên kết: {createdInvoice.transaction.paymentUrl}
                  </span>
                )}
              </div>
            )}
            {createdInvoice.transaction.orderCode && (
              <div className="text-sm mt-2">Mã đơn PayOS: {createdInvoice.transaction.orderCode}</div>
            )}
            {createdInvoice.transaction.paymentUrl && (
              <div className="text-xs mt-1 break-all">Liên kết thanh toán: {createdInvoice.transaction.paymentUrl}</div>
            )}
          </div>
        </div>
      )}

      {/* QR Scanner Dialog */}
      <Dialog open={isQrScannerOpen} onOpenChange={setIsQrScannerOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <QrCode className="h-5 w-5" />
              Quét mã QR phiếu chỉ định
            </DialogTitle>
            <DialogDescription>
              Đưa mã QR của phiếu chỉ định (PRE... hoặc PR-...) vào khung hình để quét tự động
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="relative w-full bg-black rounded-lg overflow-hidden" style={{ aspectRatio: '1' }}>
              {/* Video element for BarcodeDetector */}
              <video
                ref={qrVideoRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-full object-cover ${usingHtml5Qrcode ? 'hidden' : ''}`}
                style={{ transform: 'scaleX(-1)' }}
              />
              
              {/* HTML5 QR Code reader container */}
              <div id="invoice-qr-reader" className="w-full h-full"></div>
              
              {/* Scanning overlay for BarcodeDetector mode */}
              {qrScanning && !usingHtml5Qrcode && (
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
              
              {!qrScanning && (
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
                  await stopQrScanner();
                  setIsQrScannerOpen(false);
                }}
              >
                Đóng
              </Button>
              {!qrScanning && (
                <Button
                  onClick={startQrScanner}
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
