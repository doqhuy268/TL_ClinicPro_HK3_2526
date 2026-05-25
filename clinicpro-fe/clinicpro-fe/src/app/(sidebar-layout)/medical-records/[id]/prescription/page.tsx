'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { 
  ChevronLeft,
  Search,
  Plus,
  X,
  GripVertical,
  ClipboardList,
  User
} from 'lucide-react';
// import { useAuth } from '@/lib/hooks/useAuth';
import { medicalRecordService } from '@/lib/services/medical-record.service';
import { MedicalRecord } from '@/lib/types/medical-record';

interface Service {
  id: string;
  serviceCode: string;
  name: string;
  description: string;
}

interface PrescriptionService {
  serviceCode: string;
  order: number;
  note?: string;
}

interface PrescriptionServiceRequest {
  serviceCode: string;
  order: number;
  note?: string;
}

interface PrescriptionData {
  patientProfileId: string;
  medicalRecordId: string;
  services: PrescriptionServiceRequest[];
}

export default function CreatePrescriptionPage() {
  const router = useRouter();
  const params = useParams();
  const recordId = params.id as string;
  // const { user } = useAuth();

  const [medicalRecord, setMedicalRecord] = useState<MedicalRecord | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Service[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedServices, setSelectedServices] = useState<PrescriptionService[]>([]);
  const [isCreating, setIsCreating] = useState(false);

  // Load medical record data
  useEffect(() => {
    const loadMedicalRecord = async () => {
      if (!recordId) return;

      try {
        const record = await medicalRecordService.getById(recordId);
        setMedicalRecord(record);
      } catch (error) {
        console.error('Error loading medical record:', error);
        toast.error('Có lỗi xảy ra khi tải bệnh án');
        router.push('/medical-records');
      }
    };

    loadMedicalRecord();
  }, [recordId, router]);

  // Search services with debouncing
  useEffect(() => {
    const searchServices = async () => {
      if (!searchQuery.trim()) {
        setSearchResults([]);
        return;
      }

      setIsSearching(true);
      try {
        const response = await fetch(`/api/services/search?query=${encodeURIComponent(searchQuery)}&limit=20`);
        if (response.ok) {
          const data = await response.json();
          // Fix: Access data.data.services instead of data.data
          setSearchResults(data.data?.services || []);
        }
      } catch (error) {
        console.error('Error searching services:', error);
        toast.error('Có lỗi xảy ra khi tìm kiếm dịch vụ');
      } finally {
        setIsSearching(false);
      }
    };

    const timeoutId = setTimeout(searchServices, 300);
    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const addService = useCallback((service: Service) => {
    const existingService = selectedServices.find(s => s.serviceCode === service.serviceCode);
    if (existingService) {
      toast.error('Dịch vụ này đã được thêm vào phiếu chỉ định');
      return;
    }

    const newService: PrescriptionService = {
      serviceCode: service.serviceCode,
      order: selectedServices.length + 1
    };

    setSelectedServices(prev => [...prev, newService]);
    setSearchQuery('');
    setSearchResults([]);
  }, [selectedServices]);

  const removeService = useCallback((serviceCode: string) => {
    setSelectedServices(prev => {
      const filtered = prev.filter(s => s.serviceCode !== serviceCode);
      // Reorder remaining services
      return filtered.map((service, index) => ({
        ...service,
        order: index + 1
      }));
    });
  }, []);

  const updateServiceNote = useCallback((serviceCode: string, note: string) => {
    setSelectedServices(prev => prev.map(s => 
      s.serviceCode === serviceCode ? { ...s, note: note || undefined } : s
    ));
  }, []);

  const handleCreatePrescription = async () => {
    if (!medicalRecord) {
      toast.error('Thiếu thông tin cần thiết');
      return;
    }

    if (selectedServices.length === 0) {
      toast.error('Vui lòng chọn ít nhất một dịch vụ');
      return;
    }

    setIsCreating(true);
    try {
      // Format services with note (trim only when sending, not during typing)
      const formattedServices: PrescriptionServiceRequest[] = selectedServices.map(service => ({
        serviceCode: service.serviceCode,
        order: service.order,
        ...(service.note && service.note.trim().length > 0 && { note: service.note.trim() })
      }));

      const prescriptionData: PrescriptionData = {
        patientProfileId: medicalRecord.patientProfileId,
        medicalRecordId: recordId,
        services: formattedServices
      };

      const response = await fetch('/api/prescriptions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify(prescriptionData)
      });

      if (response.ok) {
        const result = await response.json();
        toast.success('Tạo phiếu chỉ định thành công');
        
        // Auto generate and download PDF
        if (result.prescriptionCode || result.data?.prescriptionCode) {
          const prescriptionCode = result.prescriptionCode || result.data?.prescriptionCode;
          try {
            // Fetch full prescription data for PDF
            const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';
            const presRes = await fetch(`${API_BASE_URL}/prescriptions/${encodeURIComponent(prescriptionCode)}`, {
              headers: {
                'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
              }
            });
            if (presRes.ok) {
              const fullPrescription = await presRes.json();
              const prescriptionData = fullPrescription.data || fullPrescription;
              const { generatePrescriptionPDF } = await import('@/lib/utils/prescription-pdf');
              await generatePrescriptionPDF(prescriptionData);
              toast.success('Đã tải PDF phiếu chỉ định');
            }
          } catch (pdfError) {
            console.error('Error generating PDF:', pdfError);
            toast.error('Tạo phiếu thành công nhưng không thể tạo PDF. Vui lòng in từ danh sách phiếu.');
          }
        }
        
        router.push(`/medical-records/${recordId}`);
      } else {
        const error = await response.json();
        toast.error(error.message || 'Có lỗi xảy ra khi tạo phiếu chỉ định');
      }
    } catch (error) {
      console.error('Error creating prescription:', error);
      toast.error('Có lỗi xảy ra khi tạo phiếu chỉ định');
    } finally {
      setIsCreating(false);
    }
  };

  const handleBack = () => {
    router.push(`/medical-records/${recordId}/edit`);
  };

  if (!medicalRecord) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2">Đang tải...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 px-8">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-3">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleBack}
            className="flex items-center gap-2 text-sm"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="h-5 w-px bg-gray-300" />
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900">Tạo phiếu chỉ định</h1>
            <p className="text-sm text-gray-600">
              Bệnh án: {medicalRecord.id}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Patient Info & Selected Services */}
        <div className="lg:col-span-2 space-y-6">
          {/* Patient Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <User className="h-5 w-5 text-blue-600" />
                Thông tin bệnh nhân
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <Label className="font-medium text-gray-700">Tên bệnh nhân</Label>
                  <p className="text-gray-900">{medicalRecord.patientProfile?.name || 'N/A'}</p>
                </div>
                <div>
                  <Label className="font-medium text-gray-700">Mã hồ sơ</Label>
                  <p className="text-gray-900">{medicalRecord.patientProfile?.profileCode || 'N/A'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Selected Services */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <ClipboardList className="h-5 w-5 text-green-600" />
                Dịch vụ đã chọn ({selectedServices.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {selectedServices.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <ClipboardList className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p>Chưa có dịch vụ nào được chọn</p>
                  <p className="text-sm">Sử dụng ô tìm kiếm bên phải để thêm dịch vụ</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {selectedServices.map((service, index) => (
                    <div
                      key={service.serviceCode}
                      className="p-4 bg-gray-50 rounded-lg border border-gray-200"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3 flex-1">
                          <GripVertical className="h-4 w-4 text-gray-400 cursor-move" />
                          <Badge variant="secondary" className="text-xs">
                            {service.order}
                          </Badge>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm text-gray-900">{service.serviceCode}</p>
                            <p className="text-xs text-gray-600">Dịch vụ #{index + 1}</p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeService(service.serviceCode)}
                          className="text-red-600 hover:text-red-700 h-8 w-8 p-0"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      {/* Note Input */}
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <Label className="text-xs font-medium text-gray-700 mb-2 block">
                          Ghi chú (tùy chọn)
                        </Label>
                        <Textarea
                          placeholder="Nhập ghi chú cho dịch vụ này..."
                          value={service.note || ''}
                          onChange={(e) => updateServiceNote(service.serviceCode, e.target.value)}
                          onKeyDown={(e) => e.stopPropagation()}
                          className="text-xs min-h-[60px] bg-white"
                          rows={2}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Service Search */}
        <div className="lg:col-span-1 space-y-6">
          {/* Service Search */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Search className="h-5 w-5 text-purple-600" />
                Tìm kiếm dịch vụ
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Tìm kiếm dịch vụ..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Search Results */}
              {isSearching && (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600 mx-auto"></div>
                  <p className="text-sm text-gray-500 mt-2">Đang tìm kiếm...</p>
                </div>
              )}

              {!isSearching && searchResults.length > 0 && (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {searchResults.map((service) => (
                    <div
                      key={service.id}
                      className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={() => addService(service)}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline" className="text-xs">
                          {service.serviceCode}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 ml-auto"
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                      <h4 className="font-medium text-sm mb-1">{service.name}</h4>
                      {service.description && (
                        <p className="text-xs text-gray-600 line-clamp-2">
                          {service.description}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {!isSearching && searchQuery && searchResults.length === 0 && (
                <div className="text-center py-4 text-gray-500">
                  <p className="text-sm">Không tìm thấy dịch vụ nào</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Create Button */}
          <Card>
            <CardContent className="pt-6">
              <Button
                onClick={handleCreatePrescription}
                disabled={isCreating || selectedServices.length === 0}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                {isCreating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Đang tạo...
                  </>
                ) : (
                  <>
                    <ClipboardList className="h-4 w-4 mr-2" />
                    Tạo phiếu chỉ định
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
