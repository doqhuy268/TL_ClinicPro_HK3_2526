'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Search, Plus, X, GripVertical, ClipboardList, Loader2 } from 'lucide-react';
import { PrescriptionService } from '@/lib/types/service-processing';

interface Service {
  id: string;
  serviceCode: string;
  name: string;
  description: string;
}

interface PrescriptionServiceItem {
  serviceCode: string;
  serviceId?: string;
  serviceName?: string;
  order: number;
  doctorId?: string;
  note?: string;
}

interface PrescriptionServiceRequest {
  order: number;
  serviceCode?: string;
  serviceId?: string;
  doctorId?: string;
  note?: string;
}

// Extended type for PrescriptionService with optional prescription info
type ServiceWithPrescription = PrescriptionService & {
  prescription?: {
    id: string;
    prescriptionCode: string;
    status: string;
    patientProfile: {
      id: string;
      name: string;
      dateOfBirth: string;
      gender: string;
    };
  };
};

interface CreatePrescriptionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  service: ServiceWithPrescription;
  patientProfileId: string;
  onSuccess?: () => void;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000/api';

export function CreatePrescriptionDialog({
  open,
  onOpenChange,
  service,
  patientProfileId,
  onSuccess
}: CreatePrescriptionDialogProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Service[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedServices, setSelectedServices] = useState<PrescriptionServiceItem[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [loadingDoctors, setLoadingDoctors] = useState<Record<string, boolean>>({});
  const [doctorsByService, setDoctorsByService] = useState<Record<string, Array<{
    doctorId: string;
    doctorCode: string;
    doctorName: string;
    boothId: string | null;
    boothCode: string | null;
    boothName: string | null;
    clinicRoomId: string | null;
    clinicRoomCode: string | null;
    clinicRoomName: string | null;
  }>>>({});

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (!open) {
      setSearchQuery('');
      setSearchResults([]);
      setSelectedServices([]);
      setLoadingDoctors({});
      setDoctorsByService({});
    }
  }, [open]);

  // Search services with debouncing
  useEffect(() => {
    const searchServices = async () => {
      if (!searchQuery.trim()) {
        setSearchResults([]);
        return;
      }

      setIsSearching(true);
      try {
        const response = await fetch(`${API_BASE_URL}/services/search?query=${encodeURIComponent(searchQuery)}&limit=20`);
        if (response.ok) {
          const data = await response.json();
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

  // Load doctors for a service
  const loadDoctorsForService = useCallback(async (serviceId: string) => {
    setLoadingDoctors(prev => ({ ...prev, [serviceId]: true }));
    try {
      const response = await fetch(`${API_BASE_URL}/prescriptions/doctors/by-service?serviceId=${encodeURIComponent(serviceId)}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
      });
      if (response.ok) {
        const doctors = await response.json();
        setDoctorsByService(prev => ({ ...prev, [serviceId]: doctors }));
      } else {
        setDoctorsByService(prev => ({ ...prev, [serviceId]: [] }));
        toast.error('Không thể tải danh sách bác sĩ cho dịch vụ này');
      }
    } catch (error) {
      console.error('Error loading doctors:', error);
      setDoctorsByService(prev => ({ ...prev, [serviceId]: [] }));
      toast.error('Có lỗi xảy ra khi tải danh sách bác sĩ');
    } finally {
      setLoadingDoctors(prev => ({ ...prev, [serviceId]: false }));
    }
  }, []);

  const addService = useCallback((serviceToAdd: Service) => {
    const existingService = selectedServices.find(s => s.serviceCode === serviceToAdd.serviceCode);
    if (existingService) {
      toast.error('Dịch vụ này đã được thêm vào phiếu chỉ định');
      return;
    }

    const newService: PrescriptionServiceItem = {
      serviceCode: serviceToAdd.serviceCode,
      serviceId: serviceToAdd.id,
      serviceName: serviceToAdd.name,
      order: selectedServices.length + 1
    };

    setSelectedServices(prev => [...prev, newService]);
    setSearchQuery('');
    setSearchResults([]);

    // Load doctors for this service
    if (serviceToAdd.id) {
      loadDoctorsForService(serviceToAdd.id);
    }
  }, [selectedServices, loadDoctorsForService]);

  const removeService = useCallback((serviceCode: string) => {
    setSelectedServices(prev => {
      const filtered = prev.filter(s => s.serviceCode !== serviceCode);
      return filtered.map((s, index) => ({
        ...s,
        order: index + 1
      }));
    });
  }, []);

  const updateServiceDoctor = useCallback((serviceCode: string, doctorId: string | undefined) => {
    setSelectedServices(prev => prev.map(s => 
      s.serviceCode === serviceCode ? { ...s, doctorId } : s
    ));
  }, []);

  const updateServiceNote = useCallback((serviceCode: string, note: string) => {
    setSelectedServices(prev => prev.map(s => 
      s.serviceCode === serviceCode ? { ...s, note: note || undefined } : s
    ));
  }, []);

  const handleCreatePrescription = async () => {
    if (!patientProfileId) {
      toast.error('Không tìm thấy thông tin bệnh nhân. Vui lòng làm mới trang.');
      return;
    }
    
    if (selectedServices.length === 0) {
      toast.error('Vui lòng chọn ít nhất một dịch vụ');
      return;
    }
    
    if (!service.id) {
      toast.error('Không tìm thấy ID dịch vụ gốc. Vui lòng làm mới trang.');
      return;
    }

    // Validate and format services for API
    const formattedServices: PrescriptionServiceRequest[] = selectedServices.map(s => {
      const serviceId = s.serviceId ? String(s.serviceId).trim() : undefined;
      const serviceCode = s.serviceCode ? String(s.serviceCode).trim() : undefined;
      
      if ((!serviceId || serviceId.length === 0) && (!serviceCode || serviceCode.length === 0)) {
        console.error('Service missing both serviceId and serviceCode:', s);
        return null;
      }

      const serviceData: PrescriptionServiceRequest = {
        order: s.order
      };
      
      if (serviceId && serviceId.length > 0) {
        serviceData.serviceId = serviceId;
      }
      
      if (serviceCode && serviceCode.length > 0) {
        serviceData.serviceCode = serviceCode;
      }
      
      if (s.doctorId && s.doctorId.trim().length > 0) {
        serviceData.doctorId = String(s.doctorId).trim();
      }
      
      if (s.note && s.note.trim().length > 0) {
        serviceData.note = s.note.trim();
      }
      
      return serviceData;
    }).filter((s): s is PrescriptionServiceRequest => s !== null);

    const invalidServices = formattedServices.filter(s => {
      const hasServiceId = s.serviceId && s.serviceId.length > 0;
      const hasServiceCode = s.serviceCode && s.serviceCode.length > 0;
      return !hasServiceId && !hasServiceCode;
    });
    
    if (invalidServices.length > 0 || formattedServices.length !== selectedServices.length) {
      console.error('Invalid services:', invalidServices);
      toast.error('Một số dịch vụ không có mã dịch vụ hợp lệ. Vui lòng thử lại.');
      return;
    }

    setIsCreating(true);
    try {
      const prescriptionData = {
        patientProfileId,
        belongsToServiceId: service.id, // Link to the original service
        services: formattedServices
      };

      console.log('Sending prescription data:', JSON.stringify(prescriptionData, null, 2));

      const response = await fetch(`${API_BASE_URL}/prescriptions`, {
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
              
              // Small delay to ensure PDF download is initiated
              await new Promise(resolve => setTimeout(resolve, 500));
            }
          } catch (pdfError) {
            console.error('Error generating PDF:', pdfError);
            toast.error('Tạo phiếu thành công nhưng không thể tạo PDF. Vui lòng in từ danh sách phiếu.');
          }
        }
        
        // Reset form
        setSelectedServices([]);
        setSearchQuery('');
        setSearchResults([]);
        setDoctorsByService({});
        
        // Call success callback
        if (onSuccess) {
          onSuccess();
        }
        
        // Close dialog
        onOpenChange(false);
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[70vw] max-w-[70vw] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5" />
            Tạo phiếu chỉ định mới
          </DialogTitle>
          <DialogDescription>
            Tạo phiếu chỉ định bổ sung cho dịch vụ: <strong>{service.service.name}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Patient Info Display */}
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="text-sm font-medium text-blue-900 mb-2">Bệnh nhân</div>
            <div className="text-sm text-blue-700">
              {service.prescription?.patientProfile?.name || 'N/A'}
            </div>
            <div className="text-xs text-blue-600 mt-1">
              Dịch vụ gốc: {service.service.name} {service.service.serviceCode ? `(${service.service.serviceCode})` : ''}
            </div>
            {!patientProfileId && (
              <div className="text-xs text-red-600 mt-1">
                ⚠️ Không tìm thấy thông tin bệnh nhân. Vui lòng làm mới trang.
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Selected Services */}
            <div className="lg:col-span-2 space-y-4">
              <div>
                <Label className="text-sm font-medium mb-2 block">Dịch vụ đã chọn ({selectedServices.length})</Label>
                {selectedServices.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 border border-dashed rounded-lg">
                    <ClipboardList className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                    <p className="text-sm">Chưa có dịch vụ nào được chọn</p>
                    <p className="text-xs">Sử dụng ô tìm kiếm bên phải để thêm dịch vụ</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {selectedServices.map((s) => {
                      const doctors = s.serviceId ? doctorsByService[s.serviceId] || [] : [];
                      const isLoadingDoctor = s.serviceId ? loadingDoctors[s.serviceId] : false;
                      
                      return (
                        <div
                          key={s.serviceCode}
                          className="p-4 bg-gray-50 rounded-lg border border-gray-200"
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-3 flex-1">
                              <GripVertical className="h-4 w-4 text-gray-400 cursor-move" />
                              <Badge variant="secondary" className="text-xs">
                                {s.order}
                              </Badge>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-sm text-gray-900">
                                  {s.serviceName || s.serviceCode}
                                </p>
                                <p className="text-xs text-gray-600">{s.serviceCode}</p>
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeService(s.serviceCode)}
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
                              value={s.note || ''}
                              onChange={(e) => updateServiceNote(s.serviceCode, e.target.value)}
                              onKeyDown={(e) => e.stopPropagation()}
                              className="text-xs min-h-[60px] bg-white"
                              rows={2}
                            />
                          </div>

                          {/* Doctor Selection */}
                          {s.serviceId && (
                            <div className="mt-3 pt-3 border-t border-gray-200">
                              <Label className="text-xs font-medium text-gray-700 mb-2 block">
                                Bác sĩ phụ trách (tùy chọn)
                              </Label>
                              {isLoadingDoctor ? (
                                <div className="flex items-center gap-2 text-xs text-gray-500">
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                  Đang tải danh sách bác sĩ...
                                </div>
                              ) : doctors.length > 0 ? (
                                <Select
                                  value={s.doctorId || '__none__'}
                                  onValueChange={(val) => {
                                    const doctorId = val === '__none__' ? undefined : val;
                                    updateServiceDoctor(s.serviceCode, doctorId);
                                  }}
                                >
                                  <SelectTrigger className="h-8 text-xs">
                                    <SelectValue placeholder="Chọn bác sĩ (tùy chọn)" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="__none__">Không chọn</SelectItem>
                                    {doctors.map((doctor) => (
                                      <SelectItem key={doctor.doctorId} value={doctor.doctorId}>
                                        <div className="flex flex-col">
                                          <span className="font-medium">{doctor.doctorName}</span>
                                          <span className="text-xs text-gray-500">
                                            {doctor.doctorCode}
                                            {doctor.clinicRoomName && ` • ${doctor.clinicRoomName}`}
                                            {doctor.boothName && ` • ${doctor.boothName}`}
                                          </span>
                                        </div>
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              ) : (
                                <p className="text-xs text-gray-500">Không có bác sĩ khả dụng cho dịch vụ này</p>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Right Column - Service Search */}
            <div className="lg:col-span-1 space-y-4">
              <div>
                <Label className="text-sm font-medium mb-2 block">Tìm kiếm dịch vụ</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Tìm kiếm dịch vụ..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {isSearching && (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600 mx-auto"></div>
                  <p className="text-sm text-gray-500 mt-2">Đang tìm kiếm...</p>
                </div>
              )}

              {!isSearching && searchResults.length > 0 && (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {searchResults.map((serviceItem) => (
                    <div
                      key={serviceItem.id}
                      className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={() => addService(serviceItem)}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline" className="text-xs">
                          {serviceItem.serviceCode}
                        </Badge>
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0 ml-auto">
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                      <h4 className="font-medium text-sm mb-1">{serviceItem.name}</h4>
                      {serviceItem.description && (
                        <p className="text-xs text-gray-600 line-clamp-2">{serviceItem.description}</p>
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
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isCreating}
          >
            Hủy
          </Button>
          <Button
            onClick={handleCreatePrescription}
            disabled={isCreating || selectedServices.length === 0 || !patientProfileId || !service.id}
            className="bg-green-600 hover:bg-green-700"
          >
            {isCreating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Đang tạo...
              </>
            ) : (
              <>
                <ClipboardList className="h-4 w-4 mr-2" />
                Tạo phiếu chỉ định
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

