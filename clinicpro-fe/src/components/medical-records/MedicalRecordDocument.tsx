/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useCallback, useRef } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  MedicalRecord, 
  Template, 
  MedicalRecordStatus,
  Attachment 
} from '@/lib/types/medical-record';
import { 
  FileText, 
  Printer,
} from 'lucide-react';
import QRCode from 'react-qr-code';

interface MedicalRecordDocumentProps {
  medicalRecord: MedicalRecord;
  template: Template;
  patientProfile?: any;
  doctor?: any;
  onEdit?: () => void;
  onPrint?: () => void;
  onDownload?: () => void;
}

export function MedicalRecordDocument({
  medicalRecord,
  template,
  patientProfile,
  doctor,
  // onEdit,
  // onPrint,
  // onDownload,
}: MedicalRecordDocumentProps) {
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
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

  const renderFieldValue = (field: any, value: any) => {
    if (!value) return <span className="text-gray-400 italic">................</span>;

    switch (field.type) {
      case 'string':
      case 'text':
        return <span className="text-gray-900">{value}</span>;

      case 'number':
        return <span className="font-medium text-gray-900">{value}</span>;

      case 'boolean':
        return <span className="font-medium text-gray-900">{value ? 'Có' : 'Không'}</span>;

      case 'date':
        return <span className="text-gray-900">{formatDate(value)}</span>;

      case 'object':
        if (field.name === 'vital_signs') {
          return (
            <div className="mt-2">
              {Object.entries(value).map(([key, val]: [string, any]) => (
                <div key={key} className="inline-block mr-4 mb-1">
                  <span className="text-sm text-gray-600">
                    {key === 'temp' ? 'Nhiệt độ: ' :
                     key === 'bp' ? 'Huyết áp: ' :
                     key === 'hr' ? 'Nhịp tim: ' :
                     key === 'rr' ? 'Nhịp thở: ' :
                     key === 'o2_sat' ? 'SpO2: ' :
                     key === 'pain_score' ? 'Điểm đau: ' :
                     key === 'weight' ? 'Cân nặng: ' :
                     key === 'height' ? 'Chiều cao: ' : key + ': '}
                  </span>
                  <span className="font-medium text-gray-900">{val || 'N/A'}</span>
                </div>
              ))}
            </div>
          );
        }
        return <span className="text-gray-900">{JSON.stringify(value)}</span>;

      case 'array':
        if (field.name === 'attachments') {
          return (
            <div className="mt-2 space-y-1">
              {value.map((attachment: Attachment, index: number) => (
                <div key={index} className="text-sm text-gray-900">
                  <FileText className="inline h-3 w-3 mr-1" />
                  {attachment.filename}
                </div>
              ))}
            </div>
          );
        }
        return (
          <div className="mt-1">
            {value.map((item: any, index: number) => (
              <div key={index} className="text-gray-900">
                {typeof item === 'object' ? JSON.stringify(item) : item}
              </div>
            ))}
          </div>
        );

      default:
        return <span className="text-gray-900">{String(value)}</span>;
    }
  };

  const documentRef = useRef<HTMLDivElement | null>(null);

  const handlePrintDocument = useCallback(() => {
    if (!documentRef.current) return;
    const docHtml = documentRef.current.outerHTML;
    const headContent = document?.head?.innerHTML || '';
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.open();
    printWindow.document.write(`<!doctype html><html><head><title>In bệnh án</title>${headContent}
      <style>
        @page { size: A4; margin: 12mm; }
        html, body { background: #fff; }
      </style>
    </head><body>${docHtml}</body></html>`);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 300);
  }, []);

  

  return (
    <div ref={documentRef} className="bg-white border border-gray-300 shadow-lg">
      {/* Document Header */}
      <div className="border-b-2 border-gray-800 px-8 py-6 bg-gray-50">
        <div className="flex items-center justify-between">
          <div className="flex-1 text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              BỆNH ÁN
            </h1>
            <div className="flex items-center justify-center gap-4 text-sm text-gray-700">
              <span>Mẫu: <strong>{template.name}</strong></span>
              <span>•</span>
              <span>Chuyên khoa: <strong>{template.specialtyName}</strong></span>
              <span>•</span>
              <span>ID: <strong>{medicalRecord.id.slice(0, 8)}</strong></span>
            </div>
          </div>
          {(() => {
            const codeObj = medicalRecord as unknown as { code?: string; medicalRecordCode?: string };
            const recordCode = codeObj.code || codeObj.medicalRecordCode || medicalRecord.id;
            return (
              <div className="ml-4 bg-white p-2 rounded border border-gray-200">
                <QRCode value={String(recordCode)} size={84} style={{ width: '84px', height: '84px' }} />
              </div>
            );
          })()}
        </div>
      </div>

      {/* Document Actions */}
      <div className="border-b border-gray-200 px-8 py-3 bg-gray-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge className={`${getStatusColor(medicalRecord.status)} text-sm`}>
              {getStatusText(medicalRecord.status)}
            </Badge>
            <span className="text-sm text-gray-600">
              {new Date(medicalRecord.createdAt).toLocaleDateString('vi-VN')}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handlePrintDocument} className="text-sm">
              <Printer className="h-4 w-4 mr-1" />
              In
            </Button>
          </div>
        </div>
      </div>

      {/* Document Content */}
      <div className="px-8 py-6">
        {/* Patient Information Section */}
        <div className="mb-8">
          <h2 className="text-lg font-bold text-gray-900 mb-4 border-b border-gray-300 pb-2">
            THÔNG TIN BỆNH NHÂN
          </h2>
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <div className="flex">
                <span className="w-32 text-sm font-medium text-gray-700">Họ và tên:</span>
                <span className="text-sm text-gray-900 font-medium border-b border-gray-300 border-dotted flex-1 ml-2">
                  {patientProfile?.name || '........................'}
                </span>
              </div>
              <div className="flex">
                <span className="w-32 text-sm font-medium text-gray-700">Mã bệnh nhân:</span>
                <span className="text-sm text-gray-900 border-b border-gray-300 border-dotted flex-1 ml-2">
                  {patientProfile?.profileCode || '........................'}
                </span>
              </div>
              <div className="flex">
                <span className="w-32 text-sm font-medium text-gray-700">Địa chỉ:</span>
                <span className="text-sm text-gray-900 border-b border-gray-300 border-dotted flex-1 ml-2">
                  {patientProfile?.address || '........................'}
                </span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex">
                <span className="w-32 text-sm font-medium text-gray-700">Số điện thoại:</span>
                <span className="text-sm text-gray-900 border-b border-gray-300 border-dotted flex-1 ml-2">
                  {patientProfile?.patient?.user?.phone || '........................'}
                </span>
              </div>
              <div className="flex">
                <span className="w-32 text-sm font-medium text-gray-700">Ngày khám:</span>
                <span className="text-sm text-gray-900 border-b border-gray-300 border-dotted flex-1 ml-2">
                  {formatDate(medicalRecord.createdAt)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Doctor Information Section */}
        {doctor && (
          <div className="mb-8">
            <h2 className="text-lg font-bold text-gray-900 mb-4 border-b border-gray-300 pb-2">
              THÔNG TIN BÁC SĨ
            </h2>
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <div className="flex">
                  <span className="w-32 text-sm font-medium text-gray-700">Bác sĩ khám:</span>
                  <span className="text-sm text-gray-900 font-medium border-b border-gray-300 border-dotted flex-1 ml-2">
                    {doctor.name || '........................'}
                  </span>
                </div>
                <div className="flex">
                  <span className="w-32 text-sm font-medium text-gray-700">Mã bác sĩ:</span>
                  <span className="text-sm text-gray-900 border-b border-gray-300 border-dotted flex-1 ml-2">
                    {doctor.doctor?.doctorCode || '........................'}
                  </span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex">
                  <span className="w-32 text-sm font-medium text-gray-700">Chuyên khoa:</span>
                  <span className="text-sm text-gray-900 border-b border-gray-300 border-dotted flex-1 ml-2">
                    {doctor.doctor?.specialty || '........................'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Medical Record Content */}
        <div className="mb-8">
          <h2 className="text-lg font-bold text-gray-900 mb-4 border-b border-gray-300 pb-2">
            NỘI DUNG BỆNH ÁN
          </h2>
          <div className="space-y-6">
            {template.fields.fields.map((field) => {
              const value = medicalRecord.content[field.name];
              return (
                <div key={field.name} className="border-b border-gray-200 pb-4">
                  <div className="flex items-start gap-4">
                    <div className="w-48 flex-shrink-0">
                      <span className="text-sm font-medium text-gray-700">
                        {field.label}
                        {field.required && <span className="text-red-500 ml-1">*</span>}:
                      </span>
                    </div>
                    <div className="flex-1">
                      {renderFieldValue(field, value)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Signature Section */}
        <div className="mt-12">
          <div className="grid grid-cols-2 gap-8">
            <div className="text-center">
              <div className="border-t border-gray-400 pt-2">
                <p className="text-sm font-medium text-gray-700">Bác sĩ khám</p>
                <p className="text-sm text-gray-600 mt-2">{doctor?.name || '........................'}</p>
              </div>
            </div>
            <div className="text-center">
              <div className="border-t border-gray-400 pt-2">
                <p className="text-sm font-medium text-gray-700">Ngày ký</p>
                <p className="text-sm text-gray-600 mt-2">{new Date(medicalRecord.updatedAt).toLocaleDateString('vi-VN')}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Document Footer */}
      <div className="border-t border-gray-300 px-8 py-4 bg-gray-50">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <div>
            <p>Bệnh án được tạo tự động bởi hệ thống ClinicPro</p>
            <p>Tạo lúc: {formatDate(medicalRecord.createdAt)}</p>
          </div>
          <div className="text-right">
            <p>ID: {medicalRecord.id}</p>
            <p>Trạng thái: {getStatusText(medicalRecord.status)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

