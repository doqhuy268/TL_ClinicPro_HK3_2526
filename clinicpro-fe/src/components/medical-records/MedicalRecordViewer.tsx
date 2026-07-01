/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React from 'react';
import { 
  MedicalRecord, 
  Template
} from '@/lib/types/medical-record';
import { MedicalRecordDocument } from './MedicalRecordDocument';

interface MedicalRecordViewerProps {
  medicalRecord: MedicalRecord;
  template: Template;
  patientProfile?: any;
  doctor?: any;
  onEdit?: () => void;
  onPrint?: () => void;
  onDownload?: () => void;
}

export function MedicalRecordViewer({
  medicalRecord,
  template,
  patientProfile,
  doctor,
  onEdit,
  onPrint,
  onDownload,
}: MedicalRecordViewerProps) {
  return (
    <div className="space-y-6">
      {/* Document View */}
      <MedicalRecordDocument
        medicalRecord={medicalRecord}
        template={template}
        patientProfile={patientProfile}
        doctor={doctor}
        onEdit={onEdit}
        onPrint={onPrint}
        onDownload={onDownload}
      />
    </div>
  );
}
