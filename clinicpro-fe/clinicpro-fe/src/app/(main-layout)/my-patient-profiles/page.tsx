'use client';

import { useState, useMemo } from 'react';
import { usePatientProfiles } from '@/lib/hooks/usePatientProfiles';
import { PatientProfileCard } from '@/components/patient/PatientProfileCard';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Plus, FileText, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';

export default function MyPatientProfilesPage() {
  const { patientProfiles, loading, error, refetch } = usePatientProfiles();
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6; // 2 rows x 3 columns

  // Pagination logic
  const totalPages = Math.ceil((patientProfiles?.length || 0) / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentProfiles = useMemo(() => {
    if (!patientProfiles) return [];
    return patientProfiles.slice(startIndex, endIndex);
  }, [patientProfiles, startIndex, endIndex]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-4 w-96" />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[...Array(4)].map((_, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <div className="flex items-start space-x-3 mb-4">
                    <Skeleton className="w-12 h-12 rounded-full" />
                    <div className="flex-1">
                      <Skeleton className="h-5 w-32 mb-2" />
                      <Skeleton className="h-4 w-20" />
                    </div>
                  </div>
                  <div className="space-y-2 mb-4">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                  <div className="flex space-x-2">
                    <Skeleton className="h-8 flex-1" />
                    <Skeleton className="h-8 flex-1" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {error}
              <Button 
                variant="outline" 
                size="sm" 
                className="ml-2"
                onClick={refetch}
              >
                Thử lại
              </Button>
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                  Hồ sơ bệnh nhân
                </h1>
                <p className="text-gray-600">
                  Quản lý và xem thông tin các hồ sơ bệnh nhân của bạn
                </p>
              </div>
              <Button asChild className="w-full sm:w-auto">
                <Link href="/patient-profiles/create">
                  <Plus className="h-4 w-4 mr-2" />
                  Tạo hồ sơ mới
                </Link>
              </Button>
            </div>
          </div>

        {/* Content */}
        {!patientProfiles || patientProfiles.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FileText className="h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Chưa có hồ sơ bệnh nhân
              </h3>
              <p className="text-gray-600 text-center mb-6 max-w-md">
                Bạn chưa có hồ sơ bệnh nhân nào. Tạo hồ sơ đầu tiên để bắt đầu sử dụng dịch vụ y tế.
              </p>
              <Button asChild size="lg">
                <Link href="/patient-profiles/create">
                  <Plus className="h-4 w-4 mr-2" />
                  Tạo hồ sơ đầu tiên
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Stats and Results Info */}
            <div className="mb-6">
              <div className="bg-primary/5 rounded-lg p-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div className="flex items-center space-x-2">
                    <FileText className="h-5 w-5 text-primary" />
                    <span className="text-sm font-medium text-gray-700">
                      Tổng số hồ sơ: <span className="font-semibold">{patientProfiles.length}</span>
                    </span>
                  </div>
                  {totalPages > 1 && (
                    <div className="text-sm text-gray-600">
                      Hiển thị {startIndex + 1}-{Math.min(endIndex, patientProfiles.length)} trong {patientProfiles.length} hồ sơ
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Patient Profiles Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-2 gap-4 sm:gap-6 mb-6">
              {currentProfiles.map((profile) => (
                <PatientProfileCard key={profile.id} profile={profile} />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="flex items-center space-x-1"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                
                <div className="flex items-center space-x-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <Button
                      key={page}
                      variant={page === currentPage ? "default" : "outline"}
                      size="sm"
                      onClick={() => handlePageChange(page)}
                      className="w-8 h-8 p-0"
                    >
                      {page}
                    </Button>
                  ))}
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="flex items-center space-x-1"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            )}
          </>
        )}
        </div>
      </div>
    </div>
  );
}
