'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { PatientProfileForm } from '@/components/patient/PatientProfileForm';
import { patientProfileApi } from '@/lib/api';

export default function EditPatientProfilePage() {
  const params = useParams();
  const id = params?.id as string;
  const [loading, setLoading] = useState(true);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [initialValues, setInitialValues] = useState<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [rawProfile, setRawProfile] = useState<any>(null);

  const toDateInputValue = (dateString: string | undefined): string => {
    if (!dateString) return '';
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) return dateString;
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return '';
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      try {
        setLoading(true);
        const res = await patientProfileApi.getById(id);
        setRawProfile(res.data);
        setInitialValues({
          name: res.data?.name ?? '',
          dateOfBirth: toDateInputValue(res.data?.dateOfBirth),
          gender: (res.data?.gender || 'male').toLowerCase(),
          address: res.data?.address ?? '',
          occupation: res.data?.occupation ?? '',
          emergencyContact: {
            name: res.data?.emergencyContact?.name ?? '',
            phone: res.data?.emergencyContact?.phone ?? '',
            relationship: res.data?.emergencyContact?.relationship ?? '',
          },
          healthInsurance: res.data?.healthInsurance ?? '',
          relationship: res.data?.relationship ?? 'self',
        });
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-3xl mx-auto">
        <Card>
          <CardContent className="p-6">
            <h1 className="text-2xl font-bold mb-4">Chỉnh sửa hồ sơ bệnh nhân</h1>
            {rawProfile && (
              <div className="mb-6 p-3 rounded-md border border-gray-200 bg-gray-50 text-sm text-gray-700">
                <div className="flex flex-wrap gap-4">
                  <div><span className="font-medium">Tên:</span> {rawProfile.name}</div>
                  {rawProfile.profileCode && (
                    <div><span className="font-medium">Mã hồ sơ:</span> {rawProfile.profileCode}</div>
                  )}
                  {rawProfile.createdAt && (
                    <div><span className="font-medium">Tạo ngày:</span> {new Date(rawProfile.createdAt).toLocaleDateString('vi-VN')}</div>
                  )}
                </div>
              </div>
            )}
            {loading ? (
              <div>Đang tải...</div>
            ) : (
              <PatientProfileForm mode="edit" patientProfileId={id} initialValues={initialValues} />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


