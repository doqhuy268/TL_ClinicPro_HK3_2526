'use client';

import { Card, CardContent } from '@/components/ui/card';
import { DrugSearch } from '@/components/medication-prescriptions/DrugSearch';

export default function PatientDrugSearchPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Tìm kiếm thuốc</h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Tra cứu thông tin chi tiết về thuốc từ cơ sở dữ liệu OpenFDA
            </p>
          </div>

          {/* Main Content */}
          <Card className="border border-gray-200 shadow-sm">
            <CardContent className="p-6">
              <DrugSearch />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}


