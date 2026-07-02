'use client';

import { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PatientSearch } from '@/components/medical-records/PatientSearch';
import { DrugInput } from './DrugInput';
import { Plus, Save, X, Loader2 } from 'lucide-react';
import { PatientProfile } from '@/lib/types/user';
import { MedicalRecord } from '@/lib/types/medical-record';
import { medicalRecordService } from '@/lib/services/medical-record.service';
import { toast } from 'sonner';

interface MedicationPrescriptionItem {
  name: string;
  ndc?: string;
  strength?: string;
  dosageForm?: string;
  route?: string;
  dose?: number;
  doseUnit?: string;
  frequency?: string;
  durationDays?: number;
  quantity?: number;
  quantityUnit?: string;
  instructions?: string;
}

interface CreatePrescriptionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: {
    patientProfileId: string;
    medicalRecordId?: string;
    note?: string;
    status?: 'DRAFT' | 'SIGNED' | 'CANCELLED';
    items: MedicationPrescriptionItem[];
  }) => Promise<void>;
  preselectedPatientProfile?: PatientProfile | null;
  preselectedMedicalRecordId?: string;
}

export function CreatePrescriptionDialog({ 
  open, 
  onOpenChange, 
  onSave, 
  preselectedPatientProfile,
  preselectedMedicalRecordId 
}: CreatePrescriptionDialogProps) {
  const [selectedPatientProfile, setSelectedPatientProfile] = useState<PatientProfile | null>(null);
  const [selectedMedicalRecordId, setSelectedMedicalRecordId] = useState<string>('');
  const [note, setNote] = useState('');
  const [status, setStatus] = useState<'DRAFT' | 'SIGNED' | 'CANCELLED'>('DRAFT');
  const [items, setItems] = useState<MedicationPrescriptionItem[]>([
    {
      name: '',
      dose: 1,
      doseUnit: 'viên',
      frequency: '',
      durationDays: 7,
      quantity: 1,
      quantityUnit: 'viên'
    }
  ]);
  const [saving, setSaving] = useState(false);
  const [medicalRecords, setMedicalRecords] = useState<MedicalRecord[]>([]);
  const [loadingRecords, setLoadingRecords] = useState(false);

  // Set preselected values when dialog opens
  useEffect(() => {
    if (open && preselectedPatientProfile) {
      setSelectedPatientProfile(preselectedPatientProfile);
    }
    if (open && preselectedMedicalRecordId) {
      setSelectedMedicalRecordId(preselectedMedicalRecordId);
    }
  }, [open, preselectedPatientProfile, preselectedMedicalRecordId]);

  // Load medical records when patient is selected
  useEffect(() => {
    const loadMedicalRecords = async () => {
      if (!selectedPatientProfile?.id) {
        setMedicalRecords([]);
        setSelectedMedicalRecordId('');
        return;
      }

      try {
        setLoadingRecords(true);
        console.log('Loading medical records for patient:', selectedPatientProfile.id);
        
        const records = await medicalRecordService.getByPatientProfile(
          selectedPatientProfile.id
        );
        
        console.log('Medical records from service:', records);
        
        setMedicalRecords(records);
        setSelectedMedicalRecordId(''); // Reset selection when patient changes
        
        if (records.length > 0) {
          toast.success(`Đã tải ${records.length} bệnh án`);
        } else {
          toast.info('Bệnh nhân chưa có bệnh án nào');
        }
      } catch (error: unknown) {
        console.error('Error loading medical records:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        const errorDetails = (error as { response?: { data?: { message?: string } } })?.response?.data;
        console.error('Error details:', errorDetails);
        setMedicalRecords([]);
        toast.error(`Không thể tải danh sách bệnh án: ${errorDetails?.message || errorMessage}`);
      } finally {
        setLoadingRecords(false);
      }
    };

    loadMedicalRecords();
  }, [selectedPatientProfile]);

  const resetForm = () => {
    setSelectedPatientProfile(null);
    setSelectedMedicalRecordId('');
    setNote('');
    setStatus('DRAFT');
    setMedicalRecords([]);
    setItems([{
      name: '',
      dose: 1,
      doseUnit: 'viên',
      frequency: '',
      durationDays: 7,
      quantity: 1,
      quantityUnit: 'viên'
    }]);
  };

  const handleClose = () => {
    resetForm();
    onOpenChange(false);
  };

  const addDrug = () => {
    setItems([...items, {
      name: '',
      dose: 1,
      doseUnit: 'viên',
      frequency: '',
      durationDays: 7,
      quantity: 1,
      quantityUnit: 'viên'
    }]);
  };

  const removeDrug = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const updateDrug = (index: number, value: MedicationPrescriptionItem) => {
    const updatedItems = [...items];
    updatedItems[index] = value;
    setItems(updatedItems);
  };

  const handleSave = async () => {
    if (!selectedPatientProfile?.id) {
      toast.error('Vui lòng chọn hồ sơ bệnh nhân');
      return;
    }

    const validItems = items.filter(item => item.name.trim());
    if (validItems.length === 0) {
      toast.error('Vui lòng nhập ít nhất một thuốc');
      return;
    }

    try {
      setSaving(true);
      // Sanitize items: ensure durationDays is integer >= 1 if provided
      const sanitizedItems = validItems.map((it) => ({
        ...it,
        durationDays:
          typeof it.durationDays === 'number'
            ? Math.max(1, Math.floor(it.durationDays))
            : it.durationDays !== undefined
            ? Math.max(1, parseInt(String(it.durationDays).match(/\d+/)?.[0] || '0', 10))
            : undefined,
      }));

      // Validate again after sanitization
      for (let i = 0; i < sanitizedItems.length; i++) {
        const d = sanitizedItems[i].durationDays;
        if (d !== undefined && (!Number.isInteger(d) || d < 1)) {
          throw new Error(`Thời gian dùng (ngày) của thuốc #${i + 1} phải là số nguyên >= 1`);
        }
      }

      await onSave({
        patientProfileId: selectedPatientProfile.id,
        medicalRecordId: selectedMedicalRecordId || undefined,
        note: note.trim() || undefined,
        status,
        items: sanitizedItems
      });
      toast.success('Tạo đơn thuốc thành công');
      handleClose();
      // Reload current page to refresh lists after successful creation
      if (typeof window !== 'undefined') {
        window.location.reload();
      }
    } catch (error) {
      console.error('Error creating prescription:', error);
      toast.error('Có lỗi xảy ra khi tạo đơn thuốc');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent 
        side="right" 
        className="bg-white w-[92vw] md:w-[85vw] lg:w-[80vw] xl:w-[75vw] 2xl:w-[75vw] max-w-none sm:max-w-none p-0"
      >
        <SheetHeader className="pb-4 border-b flex-shrink-0">
          <SheetTitle className="flex items-center gap-3 text-2xl font-bold text-gray-900">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Plus className="h-6 w-6 text-blue-500" />
            </div>
            Tạo đơn thuốc mới
          </SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6">
          <div className="space-y-8">
          {/* Patient Information Section */}
          <div className="rounded-xl p-6 border my-2 ">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              Thông tin bệnh nhân
            </h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-3">
                <Label className="text-sm font-medium text-gray-700">Chọn hồ sơ bệnh nhân *</Label>
                <PatientSearch
                  compact
                  selectedPatientProfile={selectedPatientProfile}
                  onPatientProfileSelect={(profile) => setSelectedPatientProfile(profile)}
                />
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium text-gray-700">Liên kết với bệnh án (tùy chọn)</Label>
                 
                </div>
                <Select
                  value={selectedMedicalRecordId || 'none'}
                  onValueChange={(v) => setSelectedMedicalRecordId(v === 'none' ? '' : v)}
                  disabled={!selectedPatientProfile || loadingRecords}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={
                      !selectedPatientProfile 
                        ? 'Chọn hồ sơ bệnh nhân trước' 
                        : loadingRecords 
                        ? 'Đang tải bệnh án...'
                        : 'Chọn bệnh án (có thể để trống)'
                    } />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Không liên kết</SelectItem>
                    {medicalRecords.map((record) => (
                      <SelectItem key={record.id} value={record.id}>
                        <div className="flex flex-col">
                          <span className="font-medium">
                            {record.content?.diagnosis || record.content?.mainDiagnosis || 'Bệnh án'}
                          </span>
                          <span className="text-xs text-gray-500">
                            {new Date(record.createdAt).toLocaleDateString('vi-VN')} - 
                            ID: {record.id.slice(0, 8)}...
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                    {medicalRecords.length === 0 && selectedPatientProfile && !loadingRecords && (
                      <SelectItem value="no-records" disabled>
                        Bệnh nhân chưa có bệnh án nào
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
                {loadingRecords && (
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Đang tải danh sách bệnh án...
                  </div>
                )}
                {medicalRecords.length > 0 && (
                  <div className="text-xs text-gray-500">
                    Tìm thấy {medicalRecords.length} bệnh án của bệnh nhân này
                  </div>
                )}
                {selectedPatientProfile && (
                  <div className="text-xs text-gray-400">
                    Patient ID: {selectedPatientProfile.id}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Prescription Details Section */}
          <div className=" rounded-xl p-6 border my-2 ">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <div className="w-2 h-2 bg-green-600 rounded-full"></div>
              Chi tiết đơn thuốc
            </h3>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="space-y-3">
                <Label className="text-sm font-medium text-gray-700">Trạng thái</Label>
                <Select value={status} onValueChange={(value: 'DRAFT' | 'SIGNED' | 'CANCELLED') => setStatus(value)}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DRAFT">Nháp</SelectItem>
                    <SelectItem value="SIGNED">Đã ký</SelectItem>
                    <SelectItem value="CANCELLED">Đã hủy</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="lg:col-span-2 space-y-3">
                <Label className="text-sm font-medium text-gray-700">Ghi chú</Label>
                <Textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Nhập ghi chú cho đơn thuốc..."
                  rows={3}
                  className="resize-none"
                />
              </div>
            </div>
          </div>

          {/* Drugs List Section */}
          <div className="rounded-xl p-6 border my-2">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <div className="w-2 h-2  rounded-full"></div>
                Danh sách thuốc
              </h3>
              <Button onClick={addDrug} size="sm" variant="outline" className="bg-white">
                <Plus className="h-4 w-4 mr-2" />
                Thêm thuốc
              </Button>
            </div>
            
            <div className="space-y-4">
              {items.map((item, index) => (
                <div key={index} className="relative">
                  <DrugInput
                    value={item}
                    onChange={(value) => updateDrug(index, value)}
                    onRemove={items.length > 1 ? () => removeDrug(index) : undefined}
                    showRemove={items.length > 1}
                  />
                </div>
              ))}
            </div>
          </div>

          </div>
        </div>

        {/* Actions - Fixed at bottom */}
        <div className="flex-shrink-0 border-t border-gray-200 bg-white px-6 py-4">
          <div className="flex justify-end gap-4">
            <Button variant="outline" onClick={handleClose} disabled={saving} className="px-6 py-2">
              <X className="h-4 w-4 mr-2" />
              Hủy
            </Button>
            <Button onClick={handleSave} disabled={saving || !selectedPatientProfile} className="px-6 py-2 bg-blue-500 hover:bg-blue-600">
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Đang lưu...' : 'Lưu đơn thuốc'}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
