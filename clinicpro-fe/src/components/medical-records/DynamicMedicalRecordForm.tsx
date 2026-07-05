/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { 
  FieldDefinition, 
  Template, 
  CreateMedicalRecordDto, 
  MedicalRecordStatus,
  Attachment 
} from '@/lib/types/medical-record';
import { Stethoscope } from 'lucide-react';
import { formatDateForInput } from '@/lib/utils';
import { Switch } from '@/components/ui/switch';
import { useMedicalRecordFileUpload } from '@/lib/hooks/useMedicalRecordFileUpload';
import { MedicalRecordFileUpload } from './MedicalRecordFileUpload';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface DynamicMedicalRecordFormProps {
  template: Template;
  patientProfileId: string;
  doctorId?: string;
  appointmentId?: string; // Keep for backward compatibility, but will be mapped to appointmentCode
  appointmentCode?: string;
  onSubmit: (data: CreateMedicalRecordDto | Record<string, any>) => Promise<void>;
  onCancel: () => void;
  initialData?: Record<string, any>;
  isEditing?: boolean;
  existingAttachments?: Attachment[];
}

export function DynamicMedicalRecordForm({
  template,
  patientProfileId,
  doctorId,
  appointmentId,
  appointmentCode,
  onSubmit,
  onCancel,
  initialData = {},
  isEditing = false,
  existingAttachments = [],
}: DynamicMedicalRecordFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Check if template supports file uploads
  const supportsFileUpload = useMemo(() => {
    if (!template?.fields?.fields) return false;
    // Check if template has attachments field or if we're editing with existing attachments
    const hasAttachmentsField = template.fields.fields.some(field => field.name === 'attachments');
    const hasExistingAttachments = existingAttachments.length > 0;
    return hasAttachmentsField || hasExistingAttachments;
  }, [template, existingAttachments]);
  
  // File upload hook - only initialize if needed
  const {
    files,
    attachments,
    error: fileError,
    addFiles,
    removeFile,
    removeAttachment,
    clearError,
    setAttachments,
  } = useMedicalRecordFileUpload();

  // Set existing attachments when component mounts or when existingAttachments change
  useEffect(() => {
    if (supportsFileUpload && existingAttachments.length > 0) {
      setAttachments(existingAttachments);
    }
  }, [supportsFileUpload, existingAttachments, setAttachments]);

  // Presets and helper options for adapters
  const chiefComplaintOptions = useMemo(
    () => [
      'Đau đầu',
      'Sốt',
      'Ho',
      'Đau bụng',
      'Mệt mỏi',
      'Khó thở',
    ],
    []
  );

  const diagnosisOptions = useMemo(
    () => [
      'Cảm lạnh',
      'Viêm phổi',
      'Viêm họng',
      'Tăng huyết áp',
      'Đái tháo đường',
    ],
    []
  );

  const toothFDICodes = useMemo(() => {
    const codes: string[] = [];
    const addRange = (start: number, end: number) => {
      for (let i = start; i <= end; i++) codes.push(String(i));
    };
    addRange(11, 18);
    addRange(21, 28);
    addRange(31, 38);
    addRange(41, 48);
    return codes;
  }, []);

  // Local UI adapters for special composed fields
  const [bpUi, setBpUi] = useState<{ sys: string; dia: string }>({ sys: '', dia: '' });
  const [vaUi, setVaUi] = useState<{ od: string; os: string }>({ od: '', os: '' });
  const [tnmUi, setTnmUi] = useState<{ t: string; n: string; m: string }>({ t: '', n: '', m: '' });
  const [tumorSizeNumber, setTumorSizeNumber] = useState<string>('');

  // Use useMemo to create formData from initialData
  const initialFormData = useMemo(() => {
    console.log('Creating initialFormData from:', initialData);
    if (!initialData || Object.keys(initialData).length === 0) {
      return {};
    }
    
    // Format date fields to yyyy-mm-dd for HTML date inputs
    const formattedData = { ...initialData };
    const fieldDefs = Array.isArray(template?.fields?.fields) ? template.fields.fields : [];
    fieldDefs.forEach((field: { type: string; name: string | number; }) => {
      if (field.type === 'date' && formattedData[field.name]) {
        formattedData[field.name] = formatDateForInput(formattedData[field.name]);
      }
    });
    
    return formattedData;
  }, [initialData, template.fields]);

  const [formData, setFormData] = useState<Record<string, any>>(() => {
    console.log('Initializing formData with:', initialFormData);
    return initialFormData;
  });

  console.log('Component state - formData:', formData);

  // Update formData when initialData changes (for editing mode)
  useEffect(() => {
    console.log('useEffect triggered - initialData:', initialData);
    if (initialData && Object.keys(initialData).length > 0) {
      console.log('Updating formData with initialData:', initialData);
      setFormData(initialData);
    }
  }, [initialData]);

  // Reset form data when initialData changes
  const resetFormData = useCallback(() => {
    if (initialData && Object.keys(initialData).length > 0) {
      console.log('Resetting formData with:', initialData);
      setFormData(initialData);
    }
  }, [initialData]);

  // Force update formData when initialData changes (alternative approach)
  useEffect(() => {
    if (isEditing && initialData && Object.keys(initialData).length > 0) {
      console.log('Force updating formData for editing mode:', initialData);
      setFormData(initialData);
    }
  }, [isEditing, initialData]);

  // Call resetFormData when initialData changes
  useEffect(() => {
    resetFormData();
  }, [resetFormData]);

  // Initialize formData when component mounts
  useEffect(() => {
    if (isEditing && initialData && Object.keys(initialData).length > 0) {
      console.log('Initializing formData on mount:', initialData);
      setFormData(initialData);
    }
  }, [initialData, isEditing]); // Empty dependency array - only run once on mount

  // Sync UI adapters from initial values
  useEffect(() => {
    const bpString: string | undefined = (formData?.vital_signs as any)?.bp;
    if (typeof bpString === 'string' && bpString.includes('/')) {
      const [s, d] = bpString.split('/');
      setBpUi({ sys: s?.trim() || '', dia: d?.trim() || '' });
    }

    const vaString = formData?.visual_acuity as string | undefined;
    if (typeof vaString === 'string') {
      // naive parse: OD x, OS y
      const odMatch = vaString.match(/OD\s*([^,]+)/i);
      const osMatch = vaString.match(/OS\s*([^,]+)/i);
      setVaUi({ od: odMatch?.[1]?.trim() || '', os: osMatch?.[1]?.trim() || '' });
    }

    const tnmString = formData?.tnm_classification as string | undefined;
    if (typeof tnmString === 'string') {
      const t = tnmString.match(/T\w+/)?.[0] || '';
      const n = tnmString.match(/N\w+/)?.[0] || '';
      const m = tnmString.match(/M\w+/)?.[0] || '';
      setTnmUi({ t, n, m });
    }

    const tumorSizeStr = formData?.tumor_size as string | undefined;
    if (typeof tumorSizeStr === 'string') {
      const num = tumorSizeStr.replace(/[^0-9.,]/g, '').replace(',', '.');
      setTumorSizeNumber(num);
    }
  }, [formData]);

  const handleInputChange = (fieldName: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [fieldName]: value,
    }));
  };

  const handleObjectFieldChange = (fieldName: string, subField: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [fieldName]: {
        ...prev[fieldName],
        [subField]: value,
      },
    }));
  };

  // Determine if a field is required based on mode (create vs edit)
  const isFieldRequired = useCallback((field: FieldDefinition) => {
    if (field.name === 'diagnosis') {
      // Diagnosis is required only when editing; optional when creating
      return !!isEditing;
    }
    return !!field.required;
  }, [isEditing]);

  // Helper function to render field wrapper
  const renderFieldWrapper = (
    field: FieldDefinition,
    children: React.ReactNode,
    colSpan?: number
  ) => {
    const isRequired = isFieldRequired(field);
    return (
      <div 
        key={field.name} 
        className={`bg-white rounded-lg p-4 border border-gray-200 shadow-sm ${colSpan === 2 ? 'md:col-span-2' : ''}`}
      >
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-primary rounded-full"></div>
            <Label htmlFor={field.name} className="text-sm font-semibold text-gray-900 flex items-center gap-2">
              {field.label}
              {isRequired && <Badge variant="destructive" className="text-xs">Bắt buộc</Badge>}
            </Label>
          </div>
          {children}
        </div>
      </div>
    );
  };

  const renderField = (field: FieldDefinition) => {
    const value = formData[field.name];
    const isRequired = isFieldRequired(field);
    
    // Special handling for attachments field (handled by MedicalRecordFileUpload component)
    if (field.name === 'attachments' && field.type === 'array') {
      return null;
    }

    switch (field.type) {
      case 'string':
        {
          // Special case: diagnosis field uses Textarea
          if (field.name === 'diagnosis') {
            return renderFieldWrapper(
              field,
              <>
                <Textarea
                  id={field.name}
                  value={value !== undefined && value !== null ? value : ''}
                  onChange={(e) => handleInputChange(field.name, e.target.value)}
                  placeholder="Nhập chẩn đoán"
                  rows={6}
                  required={isRequired}
                  className="border-gray-300 focus:border-blue-500 focus:ring-blue-400 text-sm"
                />
                <datalist id="diagnosis-list">
                  {diagnosisOptions.map((opt) => (
                    <option key={opt} value={opt} />
                  ))}
                </datalist>
              </>,
              2
            );
          }

          // Special case: chief_complaint with datalist
          if (field.name === 'chief_complaint') {
            return renderFieldWrapper(
              field,
              <>
                <Input
                  id={field.name}
                  list="cc-list"
                  value={value !== undefined && value !== null ? value : ''}
                  onChange={(e) => handleInputChange(field.name, e.target.value)}
                  placeholder="Nhập hoặc chọn triệu chứng chính"
                  required={isRequired}
                  className="border-gray-300 focus:border-blue-500 focus:ring-blue-400 text-sm"
                />
                <datalist id="cc-list">
                  {chiefComplaintOptions.map((opt) => (
                    <option key={opt} value={opt} />
                  ))}
                </datalist>
              </>
            );
          }

          // Special case: tooth_number with FDI codes
          if (field.name === 'tooth_number') {
            return renderFieldWrapper(
              field,
              <Select
                value={(value as string) || ''}
                onValueChange={(v) => handleInputChange(field.name, v)}
              >
                <SelectTrigger className="text-sm">
                  <SelectValue placeholder="Chọn mã răng (FDI)" />
                </SelectTrigger>
                <SelectContent>
                  {toothFDICodes.map((code) => (
                    <SelectItem key={code} value={code}>{code}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            );
          }

          // Special case: tnm_classification with composed select
          if (field.name === 'tnm_classification') {
            const tOptions = ['Tis', 'T0', 'T1', 'T2', 'T3', 'T4'];
            const nOptions = ['N0', 'N1', 'N2', 'N3'];
            const mOptions = ['M0', 'M1'];
            const onChange = (key: 't' | 'n' | 'm', v: string) => {
              const next = { ...tnmUi, [key]: v };
              setTnmUi(next);
              const composed = `${next.t}${next.n}${next.m}`.trim();
              handleInputChange(field.name, composed);
            };
            return renderFieldWrapper(
              field,
              <div className="grid grid-cols-3 gap-2">
                <Select value={tnmUi.t} onValueChange={(v) => onChange('t', v)}>
                  <SelectTrigger className="text-sm"><SelectValue placeholder="T" /></SelectTrigger>
                  <SelectContent>
                    {tOptions.map((opt) => (<SelectItem key={opt} value={opt}>{opt}</SelectItem>))}
                  </SelectContent>
                </Select>
                <Select value={tnmUi.n} onValueChange={(v) => onChange('n', v)}>
                  <SelectTrigger className="text-sm"><SelectValue placeholder="N" /></SelectTrigger>
                  <SelectContent>
                    {nOptions.map((opt) => (<SelectItem key={opt} value={opt}>{opt}</SelectItem>))}
                  </SelectContent>
                </Select>
                <Select value={tnmUi.m} onValueChange={(v) => onChange('m', v)}>
                  <SelectTrigger className="text-sm"><SelectValue placeholder="M" /></SelectTrigger>
                  <SelectContent>
                    {mOptions.map((opt) => (<SelectItem key={opt} value={opt}>{opt}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
            );
          }

          // Special case: tumor_size with unit
          if (field.name === 'tumor_size') {
            const onNumChange = (v: string) => {
              setTumorSizeNumber(v);
              const composed = v ? `${v} cm` : '';
              handleInputChange(field.name, composed);
            };
            return renderFieldWrapper(
              field,
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min={0}
                  step="0.1"
                  value={tumorSizeNumber}
                  onChange={(e) => onNumChange(e.target.value)}
                  className="text-sm border-gray-300 focus:border-primary focus:ring-primary"
                  placeholder="0"
                />
                <span className="text-sm text-gray-600">cm</span>
              </div>
            );
          }

          // Special case: visual_acuity with OD/OS
          if (field.name === 'visual_acuity') {
            const onChange = (key: 'od' | 'os', v: string) => {
              const next = { ...vaUi, [key]: v };
              setVaUi(next);
              const composed = [next.od ? `OD ${next.od}` : '', next.os ? `OS ${next.os}` : '']
                .filter(Boolean)
                .join(', ');
              handleInputChange(field.name, composed);
            };
            return renderFieldWrapper(
              field,
              <div className="grid grid-cols-2 gap-2">
                <Input placeholder="OD" value={vaUi.od} onChange={(e) => onChange('od', e.target.value)} className="text-sm" />
                <Input placeholder="OS" value={vaUi.os} onChange={(e) => onChange('os', e.target.value)} className="text-sm" />
              </div>
            );
          }

          // Default string field
          return renderFieldWrapper(
            field,
            <Input
              id={field.name}
              value={value !== undefined && value !== null ? value : ''}
              onChange={(e) => handleInputChange(field.name, e.target.value)}
              placeholder={field.placeholder || `Nhập ${field.label.toLowerCase()}`}
              required={isRequired}
              className="border-gray-300 focus:border-blue-500 focus:ring-blue-400 text-sm"
            />
          );
        }

      case 'text':
        return renderFieldWrapper(
          field,
          <Textarea
            id={field.name}
            value={value !== undefined && value !== null ? value : ''}
            onChange={(e) => handleInputChange(field.name, e.target.value)}
            placeholder={field.placeholder || `Nhập ${field.label.toLowerCase()}`}
            rows={4}
            required={isRequired}
            className="border-gray-300 focus:border-primary focus:ring-primary text-sm"
          />,
          2
        );

      case 'number':
        return renderFieldWrapper(
          field,
          <Input
            id={field.name}
            type="number"
            min={field.validation?.min}
            max={field.validation?.max}
            step={field.name === 'temp' || field.name?.includes('temp') ? 0.1 : 1}
            value={value !== undefined && value !== null ? value : ''}
            onChange={(e) => handleInputChange(field.name, e.target.value === '' ? '' : parseFloat(e.target.value))}
            placeholder={field.placeholder || `Nhập ${field.label.toLowerCase()}`}
            required={isRequired}
            className="border-gray-300 focus:border-primary focus:ring-primary text-sm"
          />
        );

      case 'boolean':
        // Use Switch for certain fields, Checkbox for others
        const useSwitch = field.name === 'isolation_required' || field.name === 'itching';
        return renderFieldWrapper(
          field,
          useSwitch ? (
            <div className="flex items-center justify-between">
              <Switch 
                id={field.name} 
                checked={value === true} 
                onCheckedChange={(checked) => handleInputChange(field.name, !!checked)} 
              />
            </div>
          ) : (
            <div className="flex items-center space-x-3">
              <Checkbox
                id={field.name}
                checked={value === true}
                onCheckedChange={(checked) => handleInputChange(field.name, checked)}
              />
            </div>
          )
        );

      case 'date':
      case 'datetime':
        return renderFieldWrapper(
          field,
          <Input
            id={field.name}
            type={field.type === 'datetime' ? 'datetime-local' : 'date'}
            value={value !== undefined && value !== null ? value : ''}
            onChange={(e) => handleInputChange(field.name, e.target.value)}
            required={isRequired}
            className="border-gray-300 focus:border-primary focus:ring-primary text-sm"
          />
        );

      case 'select':
        if (!field.options || field.options.length === 0) {
          return renderFieldWrapper(
            field,
            <div className="text-sm text-muted-foreground">Chưa có tùy chọn</div>
          );
        }
        return renderFieldWrapper(
          field,
          <Select value={(value as string) || ''} onValueChange={(v) => handleInputChange(field.name, v)}>
            <SelectTrigger className="text-sm">
              <SelectValue placeholder={field.placeholder || 'Chọn'} />
            </SelectTrigger>
            <SelectContent>
              {field.options.map((opt) => (
                <SelectItem key={opt} value={opt}>{opt}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case 'multiselect':
        if (!field.options || field.options.length === 0) {
          return renderFieldWrapper(
            field,
            <div className="text-sm text-muted-foreground">Chưa có tùy chọn</div>
          );
        }
        const selectedValues = Array.isArray(value) ? value : [];
        return renderFieldWrapper(
          field,
          <div className="space-y-2">
            {field.options.map((opt) => (
              <div key={opt} className="flex items-center space-x-2">
                <Checkbox
                  id={`${field.name}_${opt}`}
                  checked={selectedValues.includes(opt)}
                  onCheckedChange={(checked) => {
                    const newValues = checked
                      ? [...selectedValues, opt]
                      : selectedValues.filter(v => v !== opt);
                    handleInputChange(field.name, newValues);
                  }}
                />
                <Label htmlFor={`${field.name}_${opt}`} className="text-sm cursor-pointer">
                  {opt}
                </Label>
              </div>
            ))}
          </div>
        );

      case 'object':
        if (!field.properties) {
          return null;
        }
        
        // Special handling for vital_signs with bp field
        if (field.name === 'vital_signs') {
          return renderFieldWrapper(
            field,
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {Object.entries(field.properties).map(([key, prop]: [string, any]) => (
                <div key={key} className="space-y-2">
                  <Label htmlFor={`${field.name}_${key}`} className="text-xs font-medium">
                    {key === 'temp' ? 'Nhiệt độ (°C)' :
                     key === 'bp' ? 'Huyết áp' :
                     key === 'hr' ? 'Nhịp tim (lần/phút)' :
                     key === 'rr' ? 'Nhịp thở (lần/phút)' :
                     key === 'o2_sat' ? 'SpO2 (%)' :
                     key === 'pain_score' ? 'Điểm đau (0-10)' :
                     key === 'weight' ? 'Cân nặng (kg)' :
                     key === 'height' ? 'Chiều cao (cm)' : key}
                  </Label>
                  {key === 'bp' ? (
                    <div className="flex items-center gap-2">
                      <Input
                        id={`${field.name}_${key}_sys`}
                        type="number"
                        min={50}
                        max={300}
                        placeholder="SYS"
                        value={bpUi.sys}
                        onChange={(e) => {
                          const next = { sys: e.target.value, dia: bpUi.dia };
                          setBpUi(next);
                          const bpStr = next.sys && next.dia ? `${next.sys}/${next.dia}` : '';
                          handleObjectFieldChange(field.name, 'bp', bpStr);
                        }}
                        className="text-sm border-gray-300 focus:border-primary focus:ring-primary"
                      />
                      <span className="text-xs text-gray-600">/</span>
                      <Input
                        id={`${field.name}_${key}_dia`}
                        type="number"
                        min={30}
                        max={200}
                        placeholder="DIA"
                        value={bpUi.dia}
                        onChange={(e) => {
                          const next = { sys: bpUi.sys, dia: e.target.value };
                          setBpUi(next);
                          const bpStr = next.sys && next.dia ? `${next.sys}/${next.dia}` : '';
                          handleObjectFieldChange(field.name, 'bp', bpStr);
                        }}
                        className="text-sm border-gray-300 focus:border-primary focus:ring-primary"
                      />
                    </div>
                  ) : (
                    <Input
                      id={`${field.name}_${key}`}
                      type={prop.type === 'number' ? 'number' : 'text'}
                      min={prop.type === 'number' ? (key === 'temp' ? 30 : key === 'o2_sat' ? 0 : key === 'hr' || key === 'rr' ? 0 : key === 'pain_score' ? 0 : undefined) : undefined}
                      max={prop.type === 'number' ? (key === 'temp' ? 43 : key === 'o2_sat' ? 100 : key === 'pain_score' ? 10 : undefined) : undefined}
                      step={prop.type === 'number' ? (key === 'temp' ? 0.1 : 1) : undefined}
                      value={value?.[key] !== undefined && value?.[key] !== null ? value[key] : ''}
                      onChange={(e) => handleObjectFieldChange(
                        field.name, 
                        key, 
                        prop.type === 'number' ? (e.target.value === '' ? '' : parseFloat(e.target.value)) : e.target.value
                      )}
                      placeholder={prop.type === 'number' ? '0' : ''}
                      className="text-sm border-gray-300 focus:border-primary focus:ring-primary"
                    />
                  )}
                </div>
              ))}
            </div>,
            2
          );
        }

        // Generic object field renderer
        return renderFieldWrapper(
          field,
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {Object.entries(field.properties).map(([key, prop]: [string, any]) => (
              <div key={key} className="space-y-2">
                <Label htmlFor={`${field.name}_${key}`} className="text-xs font-medium">
                  {key}
                </Label>
                <Input
                  id={`${field.name}_${key}`}
                  type={prop.type === 'number' ? 'number' : 'text'}
                  value={value?.[key] !== undefined && value?.[key] !== null ? value[key] : ''}
                  onChange={(e) => handleObjectFieldChange(
                    field.name, 
                    key, 
                    prop.type === 'number' ? (e.target.value === '' ? '' : parseFloat(e.target.value)) : e.target.value
                  )}
                  placeholder={prop.type === 'number' ? '0' : ''}
                  className="text-sm border-gray-300 focus:border-primary focus:ring-primary"
                />
              </div>
            ))}
          </div>,
          2
        );

      case 'array':
        if (!field.items) {
          return null;
        }

        // Array of strings/numbers/booleans
        if (field.items.type !== 'object') {
          const arrayValue = Array.isArray(value) ? value : [];
          return renderFieldWrapper(
            field,
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Danh sách {field.label.toLowerCase()}</span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const defaultValue = field.items?.type === 'number' ? 0 : field.items?.type === 'boolean' ? false : '';
                    handleInputChange(field.name, [...arrayValue, defaultValue]);
                  }}
                >
                  + Thêm
                </Button>
              </div>
              {arrayValue.map((item, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Input
                    type={field.items?.type === 'number' ? 'number' : 'text'}
                    value={item}
                    onChange={(e) => {
                      const newArray = [...arrayValue];
                      newArray[index] = field.items?.type === 'number' 
                        ? (e.target.value === '' ? '' : parseFloat(e.target.value))
                        : e.target.value;
                      handleInputChange(field.name, newArray);
                    }}
                    className="text-sm flex-1"
                    placeholder={`Nhập ${field.label.toLowerCase()}`}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      const newArray = arrayValue.filter((_, i) => i !== index);
                      handleInputChange(field.name, newArray);
                    }}
                  >
                    ×
                  </Button>
                </div>
              ))}
            </div>
          );
        }

        // Array of objects
        const arrayOfObjects = Array.isArray(value) ? value : [];
        return renderFieldWrapper(
          field,
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Danh sách {field.label.toLowerCase()}</span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  const newObj: Record<string, any> = {};
                  if (field.items?.properties) {
                    Object.keys(field.items.properties).forEach(key => {
                      const propType = field.items?.properties?.[key]?.type;
                      newObj[key] = propType === 'number' ? 0 : propType === 'boolean' ? false : '';
                    });
                  }
                  handleInputChange(field.name, [...arrayOfObjects, newObj]);
                }}
              >
                + Thêm
              </Button>
            </div>
            {arrayOfObjects.map((obj, objIndex) => (
              <div key={objIndex} className="border rounded-lg p-3 space-y-2">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium">Mục {objIndex + 1}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      const newArray = arrayOfObjects.filter((_, i) => i !== objIndex);
                      handleInputChange(field.name, newArray);
                    }}
                  >
                    × Xóa
                  </Button>
                </div>
                {field.items?.properties && Object.entries(field.items.properties).map(([key, prop]: [string, any]) => (
                  <div key={key} className="space-y-1">
                    <Label htmlFor={`${field.name}_${objIndex}_${key}`} className="text-xs">
                      {key}
                    </Label>
                    <Input
                      id={`${field.name}_${objIndex}_${key}`}
                      type={prop.type === 'number' ? 'number' : prop.type === 'boolean' ? 'checkbox' : 'text'}
                      value={prop.type === 'boolean' ? undefined : (obj?.[key] !== undefined && obj?.[key] !== null ? obj[key] : '')}
                      checked={prop.type === 'boolean' ? obj?.[key] === true : undefined}
                      onChange={(e) => {
                        const newArray = [...arrayOfObjects];
                        if (!newArray[objIndex]) {
                          newArray[objIndex] = {};
                        }
                        newArray[objIndex][key] = prop.type === 'number' 
                          ? (e.target.value === '' ? '' : parseFloat(e.target.value))
                          : prop.type === 'boolean'
                          ? e.target.checked
                          : e.target.value;
                        handleInputChange(field.name, newArray);
                      }}
                      className="text-sm"
                      placeholder={prop.type === 'number' ? '0' : ''}
                    />
                  </div>
                ))}
              </div>
            ))}
          </div>,
          2
        );

      default:
        return null;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    const requiredFields = template.fields.fields.filter((field) => {
      if (field.name === 'diagnosis') {
        // Force required when editing, optional when creating
        return !!isEditing;
      }
      return !!field.required;
    });
    const missingFields = requiredFields.filter(field => !formData[field.name]);

    const validationErrors: string[] = [];
    if (missingFields.length > 0) {
      validationErrors.push(`Thiếu: ${missingFields.map(f => f.label).join(', ')}`);
    }

    // Number range validations (non-exhaustive, based on known field names)
    const vs = (formData as any)?.vital_signs || {};
    const numericChecks: Array<{ label: string; value: any; min?: number; max?: number; }> = [
      { label: 'Nhiệt độ', value: vs.temp, min: 30, max: 43 },
      { label: 'SpO2', value: vs.o2_sat, min: 0, max: 100 },
      { label: 'Điểm đau', value: vs.pain_score, min: 0, max: 10 },
      { label: 'Nhịp tim', value: vs.hr, min: 0 },
      { label: 'Nhịp thở', value: vs.rr, min: 0 },
      { label: 'Phần trăm bỏng', value: (formData as any)?.burn_area_percent, min: 0, max: 100 },
      { label: 'IOP', value: (formData as any)?.intraocular_pressure, min: 0, max: 60 },
      { label: 'Tuổi thai (tuần)', value: (formData as any)?.gestational_age, min: 0 },
    ];
    numericChecks.forEach((c) => {
      if (c.value === '' || c.value === undefined || c.value === null) return;
      const num = typeof c.value === 'number' ? c.value : parseFloat(String(c.value));
      if (Number.isNaN(num)) return;
      if (c.min !== undefined && num < c.min) validationErrors.push(`${c.label} < ${c.min}`);
      if (c.max !== undefined && num > c.max) validationErrors.push(`${c.label} > ${c.max}`);
    });

    // Date validations: onset_date, burn_date should not be in the future
    const dateFieldNames = ['onset_date', 'burn_date', 'procedure_date'];
    const now = new Date();
    dateFieldNames.forEach((name) => {
      const v = (formData as any)[name];
      if (!v) return;
      const d = new Date(v);
      if (name !== 'procedure_date' && d.getTime() > now.getTime()) {
        validationErrors.push(`${name} không được ở tương lai`);
      }
    });

    if (validationErrors.length > 0) {
      toast.error(`Vui lòng kiểm tra: ${validationErrors.join('; ')}`);
      return;
    }
    setIsSubmitting(true);
    try {
      if (isEditing) {
        // For editing, pass content and files (only if file upload is supported)
        const updateData = {
          content: formData,
          files: supportsFileUpload && files.length > 0 ? files : undefined,
          appendFiles: true, // Add files to existing ones, don't replace
        };
        await onSubmit(updateData);
      } else {
        // For creating, pass the full CreateMedicalRecordDto with files (only if file upload is supported)
        const submitData: CreateMedicalRecordDto = {
          patientProfileId,
          templateId: template.id,
          doctorId,
          appointmentCode: appointmentCode || appointmentId, // Use appointmentCode if provided, fallback to appointmentId for backward compatibility
          status: MedicalRecordStatus.DRAFT,
          content: formData,
          files: supportsFileUpload && files.length > 0 ? files : undefined,
        };
        await onSubmit(submitData);
      }
      
      toast.success(isEditing ? 'Cập nhật bệnh án thành công' : 'Tạo bệnh án thành công');
    } catch (error) {
      toast.error('Có lỗi xảy ra. Vui lòng thử lại.');
      console.error('Submit error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center justify-between text-lg">
            <span className="flex items-center gap-2">
              <Stethoscope className="h-5 w-5 text-blue-500" />
              {isEditing ? 'Chỉnh sửa' : 'Tạo'} bệnh án - {template.name}
            </span>
            <Badge variant="secondary" className="text-xs">{template.specialtyName}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className={`${isEditing ? 'grid grid-cols-1 md:grid-cols-2' : 'grid grid-cols-1'} gap-4`}>
            {template.fields.fields.map((field) => renderField(field))}
          </div>
        </CardContent>
      </Card>

      {/* File Upload Section - only show if template supports file uploads */}
      {supportsFileUpload && (
        <>
          <MedicalRecordFileUpload
            files={files}
            attachments={attachments}
            onFilesChange={addFiles}
            onRemoveFile={removeFile}
            onRemoveAttachment={removeAttachment}
            error={fileError}
            disabled={isSubmitting}
          />

          {/* Error Display for File Upload */}
          {fileError && (
            <Card className="border-red-200 bg-red-50">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-red-600">
                  <span className="text-sm">{fileError}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearError}
                    className="ml-auto h-6 w-6 p-0"
                  >
                    ×
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      <div className="sticky bottom-0 z-10 bg-white/80 backdrop-blur supports-backdrop-filter:bg-white/60 border-t pt-4 pb-4 flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={onCancel} className="text-sm">
          Hủy
        </Button>
        <Button type="submit" disabled={isSubmitting} className="text-sm">
          {isSubmitting ? 'Đang xử lý...' : (isEditing ? 'Cập nhật' : 'Tạo bệnh án')}
        </Button>
      </div>
    </form>
  );
}
