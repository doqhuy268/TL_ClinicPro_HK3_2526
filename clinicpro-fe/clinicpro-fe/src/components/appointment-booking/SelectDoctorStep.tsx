"use client";

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useAppointmentBookingContext } from '@/lib/contexts/AppointmentBookingContext';
import { User, Star, Clock, MapPin, ChevronLeft, ChevronRight } from 'lucide-react';
import { Doctor } from '@/lib/types/appointment-booking';

export function SelectDoctorStep() {
  const {
    availableDoctors,
    selectedSpecialty,
    selectedDate,
    loading,
    selectDoctor,
    bookingFlow,
    loadAvailableDoctors,
    loadDoctorsBySpecialty,
  } = useAppointmentBookingContext();

  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 4; // 2 rows x 2 columns

  useEffect(() => {
    const fetchDoctors = async () => {
      if (bookingFlow === 'BY_DATE' && selectedSpecialty && selectedDate) {
        console.log('[STEP] SelectDoctorStep → BY_DATE branch', { selectedSpecialty, selectedDate });
        await loadAvailableDoctors(selectedSpecialty.specialtyId, selectedDate);
      } else if (bookingFlow === 'BY_DOCTOR' && selectedSpecialty) {
        console.log('[STEP] SelectDoctorStep → BY_DOCTOR branch', { selectedSpecialty });
        await loadDoctorsBySpecialty(selectedSpecialty.specialtyId);
      } else {
        console.log('[STEP] SelectDoctorStep → waiting conditions', { bookingFlow, hasSpecialty: !!selectedSpecialty, hasDate: !!selectedDate });
      }
    };
    fetchDoctors();
  }, [bookingFlow, selectedSpecialty, selectedDate, loadAvailableDoctors, loadDoctorsBySpecialty]);

  const filteredDoctors = useMemo(() => 
    availableDoctors.filter(doctor =>
      doctor.doctorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doctor.specialtyName.toLowerCase().includes(searchTerm.toLowerCase())
    ), [availableDoctors, searchTerm]
  );

  // Pagination logic
  const totalPages = Math.ceil(filteredDoctors.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentDoctors = filteredDoctors.slice(startIndex, endIndex);

  // Reset to first page when search term changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const handleSelectDoctor = (doctor: Doctor) => {
    selectDoctor(doctor);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center space-x-2 mb-4">
          <Skeleton className="h-10 w-full" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Card key={index}>
              <CardHeader>
                <Skeleton className="h-6 w-6 rounded-full" />
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-full" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-4 w-1/3 mt-2" />
              </CardContent>
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
        <input
          type="text"
          placeholder="Tìm kiếm bác sĩ..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
        />
      </div>

      {/* Results Info */}
      {filteredDoctors.length > 0 && (
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>
            Hiển thị {startIndex + 1}-{Math.min(endIndex, filteredDoctors.length)} trong {filteredDoctors.length} bác sĩ
          </span>
          {totalPages > 1 && (
            <span>
              Trang {currentPage} / {totalPages}
            </span>
          )}
        </div>
      )}

      {/* Doctors Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {currentDoctors.map((doctor) => (
          <Card
            key={doctor.doctorId}
            className="cursor-pointer hover:shadow-md transition-all duration-200 border-2 hover:border-primary/50 hover:scale-105"
            onClick={() => handleSelectDoctor(doctor)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                  <User className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1">
                  <CardTitle className="text-lg">{doctor.doctorName}</CardTitle>
                  <CardDescription className="text-sm">
                    {doctor.specialtyName}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Star className="w-4 h-4 text-yellow-500" />
                  <span className="text-sm font-medium">{doctor.rating}</span>
                  <Badge variant="secondary" className="text-xs">
                    {doctor.yearsExperience} năm kinh nghiệm
                  </Badge>
                </div>
                
                {doctor.workSessionStart && doctor.workSessionEnd && (
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <Clock className="w-4 h-4" />
                    <span>
                      {new Date(doctor.workSessionStart).toLocaleTimeString('vi-VN', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })} - {new Date(doctor.workSessionEnd).toLocaleTimeString('vi-VN', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </span>
                  </div>
                )}

                {doctor.roomName && (
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <MapPin className="w-4 h-4" />
                    <span>{doctor.roomName}</span>
                  </div>
                )}

                <p className="text-sm text-gray-600 mt-2 line-clamp-2">{doctor.description}</p>
              </div>

              <div className="mt-4 flex justify-end">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSelectDoctor(doctor);
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

      {filteredDoctors.length === 0 && (
        <div className="text-center py-12">
          <User className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {searchTerm ? 'Không tìm thấy bác sĩ phù hợp' : 'Không có bác sĩ nào'}
          </h3>
          <p className="text-gray-500">
            {searchTerm ? 'Thử tìm kiếm với từ khóa khác' : 'Vui lòng thử lại sau'}
          </p>
        </div>
      )}
    </div>
  );
}
