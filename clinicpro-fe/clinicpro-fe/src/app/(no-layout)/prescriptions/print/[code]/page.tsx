'use client';

import { useEffect, useMemo, useState } from 'react';
import QRCode from 'react-qr-code';
import { useParams, useSearchParams } from 'next/navigation';
import { cashierApi } from '@/lib/api';

interface ServiceInfo {
  id: string;
  serviceCode: string;
  name: string;
  description?: string;
}

interface PrescriptionService {
  prescriptionId: string;
  serviceId: string;
  status: string;
  results: unknown[];
  order: number;
  note: string | null;
  service: ServiceInfo;
}

interface Prescription {
  id: string;
  prescriptionCode: string;
  note?: string | null;
  status: string;
  createdAt: string;
  services: PrescriptionService[];
  patientProfile?: { name?: string; profileCode?: string; phone?: string; address?: string };
}

export default function ServicePrescriptionPrintPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const codeFromPath = params.code as string | undefined;
  const codeFromQuery = searchParams?.get('code') ?? undefined;
  const prescriptionCode = codeFromPath || codeFromQuery || '';

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [prescription, setPrescription] = useState<Prescription | null>(null);

  useEffect(() => {
    const load = async () => {
      if (!prescriptionCode) {
        setError('Thiếu mã phiếu chỉ định');
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const res = await cashierApi.getPrescriptionByCode(prescriptionCode);
        const body: unknown = res.data;
        let parsed: Prescription | null = null;
        if (body && typeof body === 'object' && 'data' in (body as Record<string, unknown>)) {
          const withData = body as { data?: Prescription };
          parsed = withData.data ?? null;
        } else {
          parsed = body as Prescription;
        }
        if (parsed) {
          setPrescription(parsed);
        } else {
          setError('Không tìm thấy phiếu chỉ định');
        }
      } catch {
        setError('Không thể tải phiếu chỉ định');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [prescriptionCode]);

  const qrValue = useMemo(() => (prescriptionCode ? String(prescriptionCode) : ''), [prescriptionCode]);

  const statusText = (s: string) => {
    switch (s) {
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
        return String(s);
    }
  };

  // Table cell styles for compact layout
  const th: React.CSSProperties = {
    textAlign: 'left',
    borderBottom: '1px solid #e5e7eb',
    padding: '8px 6px',
    fontWeight: 600,
    fontSize: 12,
    background: '#f9fafb'
  };
  const tdLeft: React.CSSProperties = {
    borderBottom: '1px solid #f3f4f6',
    padding: '8px 6px',
    verticalAlign: 'top'
  };
  const tdCenter: React.CSSProperties = {
    ...tdLeft,
    textAlign: 'center'
  };

  if (loading) {
    return <div style={{ fontFamily: 'Arial, sans-serif', padding: 24 }}>Đang tải...</div>;
  }
  if (error || !prescription) {
    return <div style={{ fontFamily: 'Arial, sans-serif', padding: 24 }}>{error || 'Không tìm thấy phiếu chỉ định'}</div>;
  }

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', padding: 16, background: '#f3f4f6', height: '100%' }}>
      <div
        style={{
          height: '100%',
          maxWidth: 700,
          margin: '0 auto',
          background: '#fff',
          border: '1px solid #e5e7eb',
          borderRadius: 8,
          padding: 20
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e5e7eb', paddingBottom: 12, marginBottom: 12 }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 700 }}>Phiếu chỉ định dịch vụ</div>
            <div style={{ marginTop: 4, fontSize: 13 }}>Mã: <strong>{prescription.prescriptionCode}</strong></div>
            <div style={{ marginTop: 2, fontSize: 13 }}>Trạng thái: <strong>{statusText(prescription.status)}</strong></div>
            <div style={{ marginTop: 2, fontSize: 12, color: '#6b7280' }}>Ngày tạo: {new Date(prescription.createdAt).toLocaleString('vi-VN')}</div>
          </div>
          {qrValue && (
            <div style={{ textAlign: 'center' }}>
              <div style={{ background: '#fff', padding: 4, border: '1px solid #e5e7eb', borderRadius: 6, display: 'inline-block' }}>
                <QRCode value={qrValue} size={120} level="M" />
              </div>
              <div style={{ fontSize: 11, color: '#6b7280', marginTop: 4 }}>Quét mã để tra cứu</div>
            </div>
          )}
        </div>

        {/* Patient */}
        {prescription.patientProfile && (
          <div style={{ border: '1px solid #e5e7eb', borderRadius: 6, padding: 12, marginBottom: 12 }}>
            <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 8 }}>Thông tin bệnh nhân</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 13 }}>
              <div>Tên: <strong>{prescription.patientProfile.name || '—'}</strong></div>
              <div>Mã hồ sơ: <strong>{prescription.patientProfile.profileCode || '—'}</strong></div>
              <div>SĐT: {prescription.patientProfile.phone || '—'}</div>
              <div>Địa chỉ: {prescription.patientProfile.address || '—'}</div>
            </div>
          </div>
        )}

        {/* Note */}
        {prescription.note && (
          <div style={{ border: '1px solid #e5e7eb', borderRadius: 6, padding: 10, marginBottom: 12, fontSize: 13 }}>
            <div style={{ fontWeight: 600, marginBottom: 4 }}>Ghi chú</div>
            <div>{prescription.note}</div>
          </div>
        )}

        {/* Services table */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <div style={{ fontWeight: 600, fontSize: 14 }}>Danh sách dịch vụ</div>
            <div style={{ fontSize: 12, color: '#6b7280' }}>{prescription.services?.length || 0} dịch vụ</div>
          </div>
          {prescription.services?.length ? (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr>
                  <th style={th}>#</th>
                  <th style={th}>Mã DV</th>
                  <th style={th}>Tên dịch vụ</th>
                  <th style={th}>Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {prescription.services.map((s) => (
                  <tr key={s.serviceId}>
                    <td style={tdCenter}>{s.order}</td>
                    <td style={tdLeft}>{s.service.serviceCode}</td>
                    <td style={tdLeft}>{s.service.name}</td>
                    <td style={tdLeft}>{statusText(s.status)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div style={{ fontSize: 13, color: '#6b7280', fontStyle: 'italic' }}>Phiếu chưa có dịch vụ</div>
          )}
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 24, fontSize: 12, color: '#6b7280' }}>
          <div>
            <div>In từ hệ thống ClinicPro</div>
            <div>Ngày in: {new Date().toLocaleString('vi-VN')}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ marginBottom: 40 }}>Chữ ký bác sĩ</div>
            <div style={{ borderTop: '1px dashed #9ca3af', width: 180, marginLeft: 'auto' }}></div>
          </div>
        </div>

        {/* Controls (hidden when printing) */}
        <div style={{ display: 'flex', gap: 8, marginTop: 16 }} className="no-print">
          <button
            onClick={() => window.print()}
            style={{ padding: '8px 12px', border: '1px solid #e5e7eb', borderRadius: 6, background: '#f9fafb', cursor: 'pointer' }}
          >
            In
          </button>
          <button
            onClick={() => window.close()}
            style={{ padding: '8px 12px', border: '1px solid #e5e7eb', borderRadius: 6, background: '#fff', cursor: 'pointer' }}
          >
            Đóng
          </button>
        </div>
      </div>

      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          @page { size: A4; margin: 12mm; }
          table thead th { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      `}</style>
    </div>
  );
}


