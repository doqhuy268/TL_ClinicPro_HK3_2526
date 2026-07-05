'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
// import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DrugSearch } from './DrugSearch';
import { DrugSearchResult } from '@/lib/types/medication-prescription';
import { Plus, Trash2 } from 'lucide-react';

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

interface MedicationPrescriptionFormProps {
  patientProfileId: string;
  medicalRecordId?: string;
  onSave: (data: {
    patientProfileId: string;
    medicalRecordId?: string;
    note?: string;
    status?: 'DRAFT' | 'SIGNED' | 'CANCELLED';
    items: MedicationPrescriptionItem[];
  }) => Promise<void>;
  onCancel: () => void;
  initialData?: {
    note?: string;
    status?: 'DRAFT' | 'SIGNED' | 'CANCELLED';
    items?: MedicationPrescriptionItem[];
  };
}

export function MedicationPrescriptionForm({
  patientProfileId,
  medicalRecordId,
  onSave,
  onCancel,
  initialData
}: MedicationPrescriptionFormProps) {
  const [note, setNote] = useState(initialData?.note || '');
  const [status, setStatus] = useState<'DRAFT' | 'SIGNED' | 'CANCELLED'>(initialData?.status || 'DRAFT');
  const [items, setItems] = useState<MedicationPrescriptionItem[]>(
    initialData?.items || [{ name: '', dose: 1, doseUnit: 'viên', frequency: '', durationDays: 1, quantity: 1, quantityUnit: 'viên' }]
  );
  const [saving, setSaving] = useState(false);

  const addItem = () => {
    setItems([...items, { 
      name: '', 
      dose: 1, 
      doseUnit: 'viên', 
      frequency: '', 
      durationDays: 1, 
      quantity: 1, 
      quantityUnit: 'viên' 
    }]);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updateItem = (index: number, field: keyof MedicationPrescriptionItem, value: any) => {
    const updatedItems = [...items];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    setItems(updatedItems);
  };

  const handleDrugSelect = (index: number, drug: DrugSearchResult) => {
    const genericName = drug.openfda?.generic_name || drug.openfda?.brand_name || '';
    updateItem(index, 'name', genericName);
    if (drug.product_ndc) updateItem(index, 'ndc', drug.product_ndc);
    if (drug.strength) updateItem(index, 'strength', drug.strength);
    if (drug.openfda?.dosage_form) updateItem(index, 'dosageForm', drug.openfda.dosage_form);
    if (drug.openfda?.route) updateItem(index, 'route', drug.openfda.route);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await onSave({
        patientProfileId,
        medicalRecordId,
        note: note.trim() || undefined,
        status,
        items: items.filter(item => item.name.trim())
      });
    } catch (error) {
      console.error('Error saving prescription:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle>Thông tin đơn thuốc</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="note">Ghi chú</Label>
            <Textarea
              id="note"
              placeholder="Nhập ghi chú cho đơn thuốc..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
            />
          </div>
          
          <div>
            <Label htmlFor="status">Trạng thái</Label>
            <Select value={status} onValueChange={(value: 'DRAFT' | 'SIGNED' | 'CANCELLED') => setStatus(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="DRAFT">Nháp</SelectItem>
                <SelectItem value="SIGNED">Đã ký</SelectItem>
                <SelectItem value="CANCELLED">Đã hủy</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Medication Items */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Danh sách thuốc</CardTitle>
            <Button onClick={addItem} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Thêm thuốc
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {items.map((item, index) => (
            <Card key={index} className="border-l-4 border-l-blue-500">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-medium">Thuốc {index + 1}</h4>
                  {items.length > 1 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeItem(index)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Drug Search */}
                  <div className="md:col-span-2">
                    <Label>Tìm kiếm thuốc</Label>
                    <DrugSearch
                      onSelectDrug={(drug) => handleDrugSelect(index, drug)}
                      showSelectButton={true}
                    />
                  </div>

                  {/* Drug Name */}
                  <div>
                    <Label htmlFor={`name-${index}`}>Tên thuốc *</Label>
                    <Input
                      id={`name-${index}`}
                      value={item.name}
                      onChange={(e) => updateItem(index, 'name', e.target.value)}
                      placeholder="Nhập tên thuốc"
                      required
                    />
                  </div>

                  {/* NDC */}
                  <div>
                    <Label htmlFor={`ndc-${index}`}>NDC</Label>
                    <Input
                      id={`ndc-${index}`}
                      value={item.ndc || ''}
                      onChange={(e) => updateItem(index, 'ndc', e.target.value)}
                      placeholder="Mã NDC"
                    />
                  </div>

                  {/* Strength */}
                  <div>
                    <Label htmlFor={`strength-${index}`}>Liều lượng</Label>
                    <Input
                      id={`strength-${index}`}
                      value={item.strength || ''}
                      onChange={(e) => updateItem(index, 'strength', e.target.value)}
                      placeholder="Ví dụ: 500mg"
                    />
                  </div>

                  {/* Dosage Form */}
                  <div>
                    <Label htmlFor={`dosageForm-${index}`}>Dạng bào chế</Label>
                    <Input
                      id={`dosageForm-${index}`}
                      value={item.dosageForm || ''}
                      onChange={(e) => updateItem(index, 'dosageForm', e.target.value)}
                      placeholder="Ví dụ: viên nén"
                    />
                  </div>

                  {/* Route */}
                  <div>
                    <Label htmlFor={`route-${index}`}>Đường dùng</Label>
                    <Input
                      id={`route-${index}`}
                      value={item.route || ''}
                      onChange={(e) => updateItem(index, 'route', e.target.value)}
                      placeholder="Ví dụ: uống"
                    />
                  </div>

                  {/* Dose */}
                  <div>
                    <Label htmlFor={`dose-${index}`}>Liều dùng</Label>
                    <div className="flex gap-2">
                      <Input
                        id={`dose-${index}`}
                        type="number"
                        value={item.dose || ''}
                        onChange={(e) => updateItem(index, 'dose', Number(e.target.value))}
                        placeholder="1"
                        className="flex-1"
                      />
                      <Input
                        value={item.doseUnit || ''}
                        onChange={(e) => updateItem(index, 'doseUnit', e.target.value)}
                        placeholder="viên"
                        className="w-20"
                      />
                    </div>
                  </div>

                  {/* Frequency */}
                  <div>
                    <Label htmlFor={`frequency-${index}`}>Tần suất</Label>
                    <Input
                      id={`frequency-${index}`}
                      value={item.frequency || ''}
                      onChange={(e) => updateItem(index, 'frequency', e.target.value)}
                      placeholder="Ví dụ: 2 lần/ngày"
                    />
                  </div>

                  {/* Duration */}
                  <div>
                    <Label htmlFor={`duration-${index}`}>Thời gian (ngày)</Label>
                    <Input
                      id={`duration-${index}`}
                      type="number"
                      value={item.durationDays || ''}
                      onChange={(e) => updateItem(index, 'durationDays', Number(e.target.value))}
                      placeholder="7"
                    />
                  </div>

                  {/* Quantity */}
                  <div>
                    <Label htmlFor={`quantity-${index}`}>Số lượng</Label>
                    <div className="flex gap-2">
                      <Input
                        id={`quantity-${index}`}
                        type="number"
                        value={item.quantity || ''}
                        onChange={(e) => updateItem(index, 'quantity', Number(e.target.value))}
                        placeholder="10"
                        className="flex-1"
                      />
                      <Input
                        value={item.quantityUnit || ''}
                        onChange={(e) => updateItem(index, 'quantityUnit', e.target.value)}
                        placeholder="viên"
                        className="w-20"
                      />
                    </div>
                  </div>

                  {/* Instructions */}
                  <div className="md:col-span-2">
                    <Label htmlFor={`instructions-${index}`}>Hướng dẫn sử dụng</Label>
                    <Textarea
                      id={`instructions-${index}`}
                      value={item.instructions || ''}
                      onChange={(e) => updateItem(index, 'instructions', e.target.value)}
                      placeholder="Ví dụ: Uống sau khi ăn, không uống khi đói..."
                      rows={2}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={onCancel}>
          Hủy
        </Button>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? 'Đang lưu...' : 'Lưu đơn thuốc'}
        </Button>
      </div>
    </div>
  );
}
