'use client';

import { MedicationPrescriptionList } from '@/components/medication-prescriptions/MedicationPrescriptionList';
import { DrugSearch } from '@/components/medication-prescriptions/DrugSearch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, Search } from 'lucide-react';

export default function MedicationPrescriptionsPage() {
  return (
    <div className="container mx-auto px-6 py-8">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Đơn thuốc của tôi</h1>
          <p className="text-gray-600 mt-2">
            Xem và quản lý các đơn thuốc của bạn
          </p>
        </div>

        <Tabs defaultValue="prescriptions" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="prescriptions" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Đơn thuốc của tôi
            </TabsTrigger>
            <TabsTrigger value="search" className="flex items-center gap-2">
              <Search className="h-4 w-4" />
              Tìm kiếm thuốc
            </TabsTrigger>
          </TabsList>

          <TabsContent value="prescriptions">
            <MedicationPrescriptionList isDoctor={false} />
          </TabsContent>

          <TabsContent value="search">
            <Card>
              <CardHeader>
                <CardTitle>Tìm kiếm thông tin thuốc</CardTitle>
                <p className="text-sm text-gray-600">
                  Tìm kiếm thông tin chi tiết về các loại thuốc từ cơ sở dữ liệu OpenFDA
                </p>
              </CardHeader>
              <CardContent>
                <DrugSearch />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}


