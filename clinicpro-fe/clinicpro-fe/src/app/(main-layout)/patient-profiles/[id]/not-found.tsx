import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { FileText, ChevronLeft } from 'lucide-react';

export default function PatientProfileNotFound() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-16 w-16 text-gray-400 mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Không tìm thấy hồ sơ bệnh nhân
            </h1>
            <p className="text-gray-600 text-center mb-6">
              Hồ sơ bệnh nhân bạn đang tìm kiếm không tồn tại hoặc bạn không có quyền truy cập.
            </p>
            <Button asChild>
              <Link href="/my-patient-profiles">
                <ChevronLeft className="h-4 w-4 mr-2" />
                Quay về danh sách hồ sơ
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
