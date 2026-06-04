'use client';

import { Card, CardContent } from '@/components/ui/card';
import { PatientProfileForm } from '@/components/patient/PatientProfileForm';

export default function CreatePatientProfilePage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-3xl mx-auto">
        <Card>
          <CardContent className="p-6">
            <h1 className="text-2xl font-bold mb-4">Tạo hồ sơ bệnh nhân</h1>
            <PatientProfileForm mode="create" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


