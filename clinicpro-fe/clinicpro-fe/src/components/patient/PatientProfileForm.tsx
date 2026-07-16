'use client';

import { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { patientProfileApi } from '@/lib/api';
import { useAuth } from '@/lib/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

type EmergencyContact = { name: string; phone: string; relationship: string };

type FormValues = {
  name: string;
  dateOfBirth: string;
  gender: 'male' | 'female';
  address: string;
  occupation: string;
  emergencyContact: EmergencyContact;
  healthInsurance: string;
  relationship: string;
};

export function PatientProfileForm({
  mode,
  initialValues,
  patientProfileId,
  onSuccess,
}: {
  mode: 'create' | 'edit';
  initialValues?: Partial<FormValues>;
  patientProfileId?: string;
  onSuccess?: () => void;
}) {
  const router = useRouter();
  const { user } = useAuth();
  const todayStr = new Date().toISOString().slice(0, 10);
  const [submitting, setSubmitting] = useState(false);
  const [values, setValues] = useState<FormValues>({
    name: initialValues?.name || '',
    dateOfBirth: initialValues?.dateOfBirth || '',
    gender: (initialValues?.gender as 'male' | 'female') || 'male',
    address: initialValues?.address || '',
    occupation: initialValues?.occupation || '',
    emergencyContact: initialValues?.emergencyContact || { name: '', phone: '', relationship: '' },
    healthInsurance: initialValues?.healthInsurance || '',
    relationship: initialValues?.relationship || 'self',
  });

  useEffect(() => {
    if (initialValues) {
      setValues((prev) => ({
        ...prev,
        ...initialValues,
        gender: ((initialValues.gender as 'male' | 'female') || prev.gender),
        emergencyContact: initialValues.emergencyContact || prev.emergencyContact,
      }));
    }
  }, [initialValues]);

  // Normalize date string for date input (yyyy-MM-dd)
  const toDateInputValue = (dateString: string | undefined): string => {
    if (!dateString) return '';
    // If already yyyy-MM-dd, return as is
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) return dateString;
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return '';
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const handleChange = (field: keyof FormValues, value: string) => {
    setValues((prev) => ({ ...prev, [field]: value } as FormValues));
  };

  const handleEmergencyChange = (field: keyof EmergencyContact, value: string) => {
    setValues((prev) => ({ ...prev, emergencyContact: { ...prev.emergencyContact, [field]: value } }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) {
      toast.error('Không tìm thấy ID bệnh nhân. Vui lòng đăng nhập lại.');
      return;
    }
    if (values.dateOfBirth && new Date(values.dateOfBirth) > new Date(todayStr)) {
      toast.error('Ngày sinh không được ở tương lai');
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        name: values.name,
        dateOfBirth: values.dateOfBirth ? toDateInputValue(values.dateOfBirth) : '',
        gender: values.gender,
        address: values.address,
        occupation: values.occupation,
        emergencyContact: values.emergencyContact,
        healthInsurance: values.healthInsurance,
        relationship: values.relationship,
      };
      if (mode === 'create') {
        await patientProfileApi.create({
          patientId: user.id,
          ...payload,
        });
        toast.success('Tạo hồ sơ thành công');
      } else if (mode === 'edit' && patientProfileId) {
        await patientProfileApi.update(patientProfileId, payload);
        toast.success('Cập nhật hồ sơ thành công');
      } else {
        toast.error('Thiếu ID hồ sơ để cập nhật');
        return;
      }
      if (onSuccess) onSuccess();
      router.push('/my-patient-profiles');
    } catch (err) {
      console.error('Error submitting patient profile:', err);
      toast.error('Không thể lưu hồ sơ. Vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 p-6">
          <div>
            <Label htmlFor="name" className='pb-2'>Họ và tên</Label>
            <Input id="name" value={values.name ?? ''} onChange={(e) => handleChange('name', e.target.value)} required />
          </div>
          <div>
            <Label htmlFor="dateOfBirth" className='pb-2'>Ngày sinh</Label>
            <Input
              id="dateOfBirth"
              type="date"
              max={todayStr}
              value={toDateInputValue(values.dateOfBirth) ?? ''}
              onChange={(e) => handleChange('dateOfBirth', e.target.value)}
              required
            />
          </div>
          <div>
            <Label htmlFor="gender" className='pb-2'>Giới tính</Label>
            <Select value={values.gender} onValueChange={(v) => handleChange('gender', v)}>
              <SelectTrigger>
                <SelectValue placeholder="Chọn giới tính" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="male">Nam</SelectItem>
                <SelectItem value="female">Nữ</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="address" className='pb-2'>Địa chỉ</Label>
            <Input id="address" value={values.address ?? ''} onChange={(e) => handleChange('address', e.target.value)} required />
          </div>
          <div>
            <Label htmlFor="occupation" className='pb-2'>Nghề nghiệp</Label>
            <Input id="occupation" value={values.occupation ?? ''} onChange={(e) => handleChange('occupation', e.target.value)} />
          </div>
          <div>
            <Label htmlFor="relationship" className='pb-2'>Quan hệ</Label>
            <Select value={values.relationship} onValueChange={(v) => handleChange('relationship', v)}>
              <SelectTrigger>
                <SelectValue placeholder="Chọn quan hệ" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Chính chủ">Chính chủ</SelectItem>
                <SelectItem value="Vợ/Chồng">Vợ/Chồng</SelectItem>
                <SelectItem value="Con">Con</SelectItem>
                <SelectItem value="Cha/Mẹ">Cha/Mẹ</SelectItem>
                <SelectItem value="Khác">Khác</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="healthInsurance" className='pb-2'>Bảo hiểm</Label>
            <Input id="healthInsurance" value={values.healthInsurance ?? ''} onChange={(e) => handleChange('healthInsurance', e.target.value)} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4 p-6">
          <div>
            <Label htmlFor="emgName" className='pb-2'>Liên hệ khẩn cấp - Tên</Label>
            <Input id="emgName" value={values.emergencyContact?.name ?? ''} onChange={(e) => handleEmergencyChange('name', e.target.value)} />
          </div>
          <div>
            <Label htmlFor="emgPhone" className='pb-2'>SĐT</Label>
            <Input id="emgPhone" value={values.emergencyContact?.phone ?? ''} onChange={(e) => handleEmergencyChange('phone', e.target.value)} />
          </div>
          <div>
            <Label htmlFor="emgRel" className='pb-2'>Quan hệ</Label>
            <Input id="emgRel" value={values.emergencyContact?.relationship ?? ''} onChange={(e) => handleEmergencyChange('relationship', e.target.value)} />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button type="submit" disabled={submitting}>
          {submitting ? 'Đang lưu...' : mode === 'create' ? 'Tạo hồ sơ' : 'Cập nhật'}
        </Button>
      </div>
    </form>
  );
}


