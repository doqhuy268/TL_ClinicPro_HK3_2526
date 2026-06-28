"use client";

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useAppointmentBookingContext } from '@/lib/contexts/AppointmentBookingContext';
import { Specialty } from '@/lib/types/appointment-booking';
import { Stethoscope, Search, ChevronLeft, ChevronRight } from 'lucide-react';

export function SelectSpecialtyStep() {
  const { selectSpecialty, loadSpecialties, loading } = useAppointmentBookingContext();
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6; // 2 rows x 3 columns

  useEffect(() => {
    const loadSpecialtiesData = async () => {
      const data = await loadSpecialties();
      setSpecialties(data);
    };

    loadSpecialtiesData();
  }, [loadSpecialties]);

  const filteredSpecialties = useMemo(() => 
    specialties.filter(specialty =>
      specialty.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      specialty.specialtyCode.toLowerCase().includes(searchTerm.toLowerCase())
    ), [specialties, searchTerm]
  );

  // Pagination logic
  const totalPages = Math.ceil(filteredSpecialties.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentSpecialties = filteredSpecialties.slice(startIndex, endIndex);

  // Reset to first page when search term changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const handleSelectSpecialty = (specialty: Specialty) => {
    console.log('Selecting specialty:', specialty);
    selectSpecialty(specialty);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center space-x-2 mb-4">
          <Search className="w-5 h-5 text-gray-400" />
          <Skeleton className="h-10 w-full" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, index) => (
            <Card key={index} className="cursor-pointer">
              <CardHeader>
                <Skeleton className="h-6 w-6 rounded-full" />
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-full" />
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search */}
      <div className="flex items-center space-x-2">
        <Search className="w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Tìm kiếm chuyên khoa..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
        />
      </div>

      {/* Results Info */}
      {filteredSpecialties.length > 0 && (
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>
            Hiển thị {startIndex + 1}-{Math.min(endIndex, filteredSpecialties.length)} trong {filteredSpecialties.length} chuyên khoa
          </span>
          {totalPages > 1 && (
            <span>
              Trang {currentPage} / {totalPages}
            </span>
          )}
        </div>
      )}

      {/* Specialties Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {currentSpecialties.map((specialty) => (
          <Card
            key={specialty.specialtyId}
            className="cursor-pointer hover:shadow-md transition-all duration-200 border-2 hover:border-primary/50 hover:scale-105"
            onClick={() => handleSelectSpecialty(specialty)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                  <Stethoscope className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1">
                  <CardTitle className="text-lg">{specialty.name}</CardTitle>
                  <CardDescription className="text-sm">
                    {specialty.specialtyCode}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="mt-3 flex justify-end">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSelectSpecialty(specialty);
                  }}
                >
                  Chọn
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            className="flex items-center space-x-1"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Trước</span>
          </Button>
          
          <div className="flex items-center space-x-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <Button
                key={page}
                variant={page === currentPage ? "default" : "outline"}
                size="sm"
                onClick={() => setCurrentPage(page)}
                className="w-8 h-8 p-0"
              >
                {page}
              </Button>
            ))}
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
            className="flex items-center space-x-1"
          >
            <span>Sau</span>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      )}

      {filteredSpecialties.length === 0 && (
        <div className="text-center py-12">
          <Stethoscope className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {searchTerm ? 'Không tìm thấy chuyên khoa phù hợp' : 'Không có chuyên khoa nào'}
          </h3>
          <p className="text-gray-500">
            {searchTerm ? 'Thử tìm kiếm với từ khóa khác' : 'Vui lòng thử lại sau'}
          </p>
        </div>
      )}
    </div>
  );
}
