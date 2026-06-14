'use client';

import { useEffect, useMemo, useState } from 'react';
import QRCode from 'react-qr-code';
import { useParams, useSearchParams } from 'next/navigation';
import { medicationPrescriptionApi } from '@/lib/api';
import { MedicationPrescription, MedicationPrescriptionStatus } from '@/lib/types/medication-prescription';

export default function PrescriptionPrintPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const codeFromPath = params.code as string | undefined;
  const codeFromQuery = searchParams?.get('code') ?? undefined;
  const prescriptionCode = codeFromPath || codeFromQuery || '';

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [prescription, setPrescription] = useState<MedicationPrescription | null>(null);

  useEffect(() => {
    const load = async () => {
      if (!prescriptionCode) {
        setError('Thiếu mã đơn thuốc');
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const res = await medicationPrescriptionApi.getByCode(prescriptionCode);
        const body: unknown = res.data;
        let parsed: MedicationPrescription | null = null;
        if (body && typeof body === 'object' && 'data' in (body as Record<string, unknown>)) {
          const withData = body as { data?: MedicationPrescription };
          parsed = withData.data ?? null;
        } else {
          parsed = body as MedicationPrescription;
        }
        if (parsed) {
          setPrescription(parsed);
        } else {
          setError('Không tìm thấy đơn thuốc');
        }
      } catch {
        setError('Không thể tải đơn thuốc');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [prescriptionCode]);

  const qrValue = useMemo(() => (prescriptionCode ? String(prescriptionCode) : ''), [prescriptionCode]);

  if (loading) {
    return (
      <div style={{ fontFamily: 'Arial, sans-serif', padding: 24 }}>Đang tải...</div>
    );
  }

  if (error || !prescription) {
    return (
      <div style={{ fontFamily: 'Arial, sans-serif', padding: 24 }}>
        {error || 'Không tìm thấy đơn thuốc'}
      </div>
    );
  }

  const statusText = (s: MedicationPrescriptionStatus) => {
    switch (s) {
      case MedicationPrescriptionStatus.DRAFT:
        return 'Nháp';
      case MedicationPrescriptionStatus.SIGNED:
        return 'Đã ký';
      case MedicationPrescriptionStatus.CANCELLED:
        return 'Đã hủy';
      default:
        return String(s);
    }
  };

  // Table cell styles for compact receipt layout
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
  const tdSub: React.CSSProperties = {
    padding: '6px 6px',
    background: '#fafafa',
    borderBottom: '1px solid #f3f4f6'
  };

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
            <div style={{ fontSize: 18, fontWeight: 700 }}>Phiếu đơn thuốc</div>
            <div style={{ marginTop: 4, fontSize: 13 }}>Mã: <strong>{prescription.code}</strong></div>
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
              <div>Tên: <strong>{prescription.patientProfile.name}</strong></div>
              <div>Mã hồ sơ: <strong>{prescription.patientProfile.profileCode}</strong></div>
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

        {/* Items table */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <div style={{ fontWeight: 600, fontSize: 14 }}>Danh sách thuốc</div>
            <div style={{ fontSize: 12, color: '#6b7280' }}>{prescription.items?.length || 0} thuốc</div>
          </div>
          {prescription.items?.length ? (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr>
                  <th style={th}>#</th>
                  <th style={th}>Thuốc</th>
                  <th style={th}>Liều</th>
                  <th style={th}>Dạng</th>
                  <th style={th}>Đường</th>
                  <th style={th}>Liều dùng</th>
                  <th style={th}>Tần suất</th>
                  <th style={th}>Thời gian</th>
                  <th style={th}>Số lượng</th>
                </tr>
              </thead>
              <tbody>
                {prescription.items.map((item, idx) => [
                  (
                    <tr key={`row-${idx}`}>
                      <td style={tdCenter}>{idx + 1}</td>
                      <td style={tdLeft}>
                        <div style={{ fontWeight: 600 }}>{item.name}</div>
                        {item.ndc && <div style={{ color: '#6b7280' }}>NDC: {item.ndc}</div>}
                      </td>
                      <td style={tdLeft}>{item.strength || '—'}</td>
                      <td style={tdLeft}>{item.dosageForm || '—'}</td>
                      <td style={tdLeft}>{item.route || '—'}</td>
                      <td style={tdLeft}>{item.dose !== undefined && item.doseUnit ? `${item.dose} ${item.doseUnit}` : '—'}</td>
                      <td style={tdLeft}>{item.frequency || '—'}</td>
                      <td style={tdLeft}>{item.durationDays !== undefined ? `${item.durationDays} ngày` : '—'}</td>
                      <td style={tdLeft}>{item.quantity} {item.quantityUnit || ''}</td>
                    </tr>
                  ),
                  item.instructions
                    ? (
                        <tr key={`ins-${idx}`}>
                          <td style={tdSub} colSpan={9}>
                            <div style={{ fontWeight: 600, marginRight: 6, display: 'inline' }}>Hướng dẫn:</div>
                            <span>{item.instructions}</span>
                          </td>
                        </tr>
                      )
                    : null,
                ])}
              </tbody>
            </table>
          ) : (
            <div style={{ fontSize: 13, color: '#6b7280', fontStyle: 'italic' }}>Đơn thuốc chưa có thuốc nào</div>
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


