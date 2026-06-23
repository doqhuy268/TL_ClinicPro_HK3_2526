'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Calendar, Clock, Save, X, AlertTriangle, CheckCircle, Search, Loader2 } from 'lucide-react';
import { WorkSessionFormData, WorkSession, Service } from '@/lib/types/work-session';
import { useServices, ServiceWithLocation } from '@/lib/hooks/useServices';
import { useAuth } from '@/lib/hooks/useAuth';
import { colors } from '@/lib/colors';

interface WorkSessionFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: WorkSessionFormData) => Promise<void>;
  editingSession?: WorkSession | null;
  selectedDate?: Date;
  loading?: boolean;
}

export function WorkSessionForm({
  isOpen,
  onClose,
  onSubmit,
  editingSession,
  selectedDate,
  loading = false,
}: WorkSessionFormProps) {
  const [formData, setFormData] = useState<WorkSessionFormData>({
    date: '',
    startTime: '',
    endTime: '',
    serviceIds: [],
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<Service[]>([]);
  const [hasBackendResults, setHasBackendResults] = useState(false);
  
  // Get user role and doctor code
  const { user, isLoading: authLoading } = useAuth();
  const isDoctor = user?.role === 'DOCTOR';
  const isAdmin = user?.role === 'ADMIN';
  const doctorCode = user?.doctor?.doctorCode;
  
  // State for doctor services and location-filtered services
  const [doctorServices, setDoctorServices] = useState<ServiceWithLocation[]>([]);
  const [locationFilteredServices, setLocationFilteredServices] = useState<ServiceWithLocation[]>([]);
  const [isLoadingDoctorServices, setIsLoadingDoctorServices] = useState(false);
  const [isLoadingLocationServices, setIsLoadingLocationServices] = useState(false);
  const [locationFilterActive, setLocationFilterActive] = useState(false);
  
  // Use services hook to fetch services from API
  const { 
    services, 
    allServices,
    loading: servicesLoading, 
    error: servicesError, 
    searchServices,
    getServicesByDoctorCode,
    getServicesByLocation
  } = useServices();

  const getVNDateTimeParts = (date: Date) => {
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Ho_Chi_Minh',
      hour12: false,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
      .formatToParts(date)
      .reduce<Record<string, string>>((acc, part) => {
        if (part.type !== 'literal') acc[part.type] = part.value;
        return acc;
      }, {});

    return {
      year: Number(parts.year),
      month: Number(parts.month),
      day: Number(parts.day),
      hours: Number(parts.hour),
      minutes: Number(parts.minute),
    };
  };

  // Fetch doctor services when form opens and user is a doctor
  useEffect(() => {
    // Wait for auth to finish loading before fetching doctor services
    if (authLoading) {
      return;
    }

    if (isOpen && isDoctor) {
      if (!doctorCode) {
        console.error('Doctor code not found for doctor user. User data may not be fully loaded yet.');
        setDoctorServices([]);
        return;
      }
      const fetchDoctorServices = async () => {
        try {
          setIsLoadingDoctorServices(true);
          const result = await getServicesByDoctorCode(doctorCode);
          setDoctorServices(result.services);
          // Reset location filter when fetching new doctor services
          setLocationFilteredServices([]);
          setLocationFilterActive(false);
        } catch (err) {
          console.error('Error fetching doctor services:', err);
          setDoctorServices([]);
        } finally {
          setIsLoadingDoctorServices(false);
        }
      };
      fetchDoctorServices();
    } else if (isOpen && isAdmin) {
      // Reset doctor services for admin
      setDoctorServices([]);
      setLocationFilteredServices([]);
      setLocationFilterActive(false);
    }
  }, [isOpen, isDoctor, isAdmin, doctorCode, authLoading, getServicesByDoctorCode]);

  // Initialize form data and apply location filter for editing sessions (doctors)
  useEffect(() => {
    if (editingSession) {
      const start = new Date(editingSession.startTime);
      const end = new Date(editingSession.endTime);

      // Convert to Vietnam time for displaying in the form
      const startVN = getVNDateTimeParts(start);
      const endVN = getVNDateTimeParts(end);

      const sessionServiceIds = editingSession.services.map(s => s.id);
      setFormData({
        date: `${startVN.year}-${String(startVN.month).padStart(2, '0')}-${String(startVN.day).padStart(2, '0')}`,
        startTime: `${String(startVN.hours).padStart(2, '0')}:${String(startVN.minutes).padStart(2, '0')}`,
        endTime: `${String(endVN.hours).padStart(2, '0')}:${String(endVN.minutes).padStart(2, '0')}`,
        serviceIds: sessionServiceIds,
      });

    } else if (selectedDate) {
      // For new sessions, extract Vietnam date components from the selected date
      const vnDate = getVNDateTimeParts(selectedDate);
      setFormData({
        date: `${vnDate.year}-${String(vnDate.month).padStart(2, '0')}-${String(vnDate.day).padStart(2, '0')}`,
        startTime: '08:00',
        endTime: '12:00',
        serviceIds: [],
      });
    }
  }, [editingSession, selectedDate, isOpen]);

  // Apply location filter when editing session and doctor services are loaded
  useEffect(() => {
    if (editingSession && isDoctor && formData.serviceIds.length > 0 && doctorServices.length > 0 && !locationFilterActive) {
      const applyLocationFilter = async () => {
        try {
          setIsLoadingLocationServices(true);
          const result = await getServicesByLocation(formData.serviceIds);
          // Filter to only include services that belong to this doctor
          const doctorServiceIds = new Set(doctorServices.map(s => s.id));
          const filteredServices = result.services.filter(s => doctorServiceIds.has(s.id));
          setLocationFilteredServices(filteredServices);
          setLocationFilterActive(true);
        } catch (err) {
          console.error('Error applying location filter for editing session:', err);
          setLocationFilterActive(false);
        } finally {
          setIsLoadingLocationServices(false);
        }
      };
      applyLocationFilter();
    }
  }, [editingSession, isDoctor, formData.serviceIds, doctorServices, locationFilterActive, getServicesByLocation]);

  // Reset form when dialog closes
  useEffect(() => {
    if (!isOpen) {
      setFormData({
        date: '',
        startTime: '',
        endTime: '',
        serviceIds: [],
      });
      setErrors({});
      setSearchQuery('');
      setSearchResults([]);
      setHasBackendResults(false);
      // Reset doctor services and location filter
      setDoctorServices([]);
      setLocationFilteredServices([]);
      setLocationFilterActive(false);
    }
  }, [isOpen]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.date) {
      newErrors.date = 'Vui lòng chọn ngày';
    }

    if (!formData.startTime) {
      newErrors.startTime = 'Vui lòng chọn thời gian bắt đầu';
    }

    if (!formData.endTime) {
      newErrors.endTime = 'Vui lòng chọn thời gian kết thúc';
    }

    if (formData.date && formData.startTime && formData.endTime) {
      const [y, m, d] = formData.date.split('-').map(Number);
      const [sh, sm] = formData.startTime.split(':').map(Number);
      const [eh, em] = formData.endTime.split(':').map(Number);
      const start = new Date(y, m - 1, d, sh, sm, 0);
      const end = new Date(y, m - 1, d, eh, em, 0);

      if (end <= start) {
        newErrors.endTime = 'Thời gian kết thúc phải sau thời gian bắt đầu';
      } else {
        const durationMin = (end.getTime() - start.getTime()) / (1000 * 60);
        if (durationMin < 30) {
          newErrors.endTime = 'Ca làm việc tối thiểu 30 phút';
        }
      }
    }

    if (formData.serviceIds.length === 0) {
      newErrors.serviceIds = 'Vui lòng chọn ít nhất một dịch vụ';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Validate end time in real-time (giờ địa phương)
  const validateEndTime = (endTime: string, startTime: string, date: string): string | null => {
    if (!endTime || !startTime || !date) return null;

    const [y, m, d] = date.split('-').map(Number);
    const [sh, sm] = startTime.split(':').map(Number);
    const [eh, em] = endTime.split(':').map(Number);
    const start = new Date(y, m - 1, d, sh, sm, 0);
    const end = new Date(y, m - 1, d, eh, em, 0);

    if (end <= start) return 'Thời gian kết thúc phải sau thời gian bắt đầu';
    const durationMin = (end.getTime() - start.getTime()) / (1000 * 60);
    if (durationMin < 30) return 'Ca làm việc tối thiểu 30 phút';
    return null;
  };

  // Calculate minimum end time (start time + 30 minutes, giờ địa phương)
  const getMinEndTime = (): string | undefined => {
    if (!formData.startTime || !formData.date) return undefined;

    const [y, m, d] = formData.date.split('-').map(Number);
    const [sh, sm] = formData.startTime.split(':').map(Number);
    const start = new Date(y, m - 1, d, sh, sm, 0);
    const minEnd = new Date(start.getTime() + 30 * 60 * 1000);

    const hours = String(minEnd.getHours()).padStart(2, '0');
    const minutes = String(minEnd.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  const handleEndTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newEndTime = e.target.value;
    setFormData(prev => ({ ...prev, endTime: newEndTime }));

    // Validate in real-time
    if (newEndTime && formData.startTime && formData.date) {
      const error = validateEndTime(newEndTime, formData.startTime, formData.date);
      if (error) {
        setErrors(prev => ({ ...prev, endTime: error }));
      } else {
        setErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors.endTime;
          return newErrors;
        });
      }
    } else {
      // Clear error if fields are empty
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.endTime;
        return newErrors;
      });
    }
  };

  const handleStartTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newStartTime = e.target.value;
    setFormData(prev => ({ ...prev, startTime: newStartTime }));

    // Re-validate end time if it exists
    if (formData.endTime && newStartTime && formData.date) {
      const error = validateEndTime(formData.endTime, newStartTime, formData.date);
      if (error) {
        setErrors(prev => ({ ...prev, endTime: error }));
      } else {
        setErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors.endTime;
          return newErrors;
        });
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      await onSubmit(formData);
      onClose();
    } catch (err) {
      console.error('Form submission error:', err);
      throw err; // Re-throw để page hiển thị toast.error
    }
  };

  const handleServiceToggle = async (serviceId: string, checked: boolean) => {
    const newServiceIds = checked
      ? [...formData.serviceIds, serviceId]
      : formData.serviceIds.filter(id => id !== serviceId);

    setFormData(prev => ({
      ...prev,
      serviceIds: newServiceIds,
    }));

    // For doctors: Apply location filtering when a service is selected
    if (isDoctor && checked && doctorServices.length > 0) {
      try {
        setIsLoadingLocationServices(true);
        // Use all selected services (including the newly selected one) to filter by location
        const result = await getServicesByLocation(newServiceIds);
        // Filter to only include services that belong to this doctor
        const doctorServiceIds = new Set(doctorServices.map(s => s.id));
        const filteredServices = result.services.filter(s => doctorServiceIds.has(s.id));
        setLocationFilteredServices(filteredServices);
        setLocationFilterActive(true);
      } catch (err) {
        console.error('Error fetching services by location:', err);
        // On error, don't apply location filter
        setLocationFilterActive(false);
      } finally {
        setIsLoadingLocationServices(false);
      }
    } else if (isDoctor && newServiceIds.length === 0) {
      // When all services are deselected, reset location filter
      setLocationFilteredServices([]);
      setLocationFilterActive(false);
    } else if (isDoctor && newServiceIds.length > 0 && locationFilterActive && !checked) {
      // When a service is deselected and location filter is active,
      // re-apply location filter with remaining selected services
      try {
        setIsLoadingLocationServices(true);
        const result = await getServicesByLocation(newServiceIds);
        // Filter to only include services that belong to this doctor
        const doctorServiceIds = new Set(doctorServices.map(s => s.id));
        const filteredServices = result.services.filter(s => doctorServiceIds.has(s.id));
        setLocationFilteredServices(filteredServices);
        // If no services match after filtering, disable location filter
        if (filteredServices.length === 0) {
          setLocationFilterActive(false);
        }
      } catch (err) {
        console.error('Error updating services by location:', err);
        setLocationFilterActive(false);
      } finally {
        setIsLoadingLocationServices(false);
      }
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
  };

  // Search services with debouncing (similar to reception prescription page)
  useEffect(() => {
    const trimmed = searchQuery.trim();
    
    if (!trimmed) {
      // No search query - reset and show all services
      setSearchResults([]);
      setHasBackendResults(false);
      return;
    }

    // Reset backend results flag when query changes
    setHasBackendResults(false);

    // Determine base services list based on role
    const baseServices = isDoctor && doctorServices.length > 0 
      ? doctorServices 
      : (isAdmin ? allServices : []);

    // Show instant client-side results first (for immediate feedback, no lag)
    const clientFiltered = (baseServices || []).filter(service => {
      const lowerQuery = trimmed.toLowerCase();
      const nameMatch = service.name.toLowerCase().includes(lowerQuery);
      const codeMatch = service.serviceCode?.toLowerCase().includes(lowerQuery);
      const descMatch = service.description?.toLowerCase().includes(lowerQuery);
      return nameMatch || codeMatch || descMatch;
    });
    setSearchResults(clientFiltered);

    // For admin: perform backend search for comprehensive results
    // For doctor: only search within doctor services (client-side only)
    if (isAdmin) {
      const timeoutId = setTimeout(async () => {
        setIsSearching(true);
        try {
          await searchServices(searchQuery);
          // Backend search updates the main 'services' list with complete results
          setHasBackendResults(true);
          // Clear client-side results to force using backend results
          setSearchResults([]);
        } catch (err) {
          console.error('Backend search error:', err);
          setHasBackendResults(false);
          // Keep client-side results on error
        } finally {
          setIsSearching(false);
        }
      }, 300); // Same debounce as reception page
      
      return () => clearTimeout(timeoutId);
    }
  }, [searchQuery, allServices, doctorServices, isDoctor, isAdmin, searchServices]);

  // Determine which services to display based on role and location filtering
  let displayServices: Service[] = [];
  
  if (isDoctor) {
    // For doctors: Use doctor services as base
    if (searchQuery.trim()) {
      // When searching: Use search results (which are already filtered from doctorServices)
      displayServices = searchResults.length > 0 ? searchResults : doctorServices;
    } else {
      // When not searching: Use doctor services
      displayServices = doctorServices;
    }
    
    // Apply location filter if active and services are selected
    // This filter applies to both search results and non-search results
    if (locationFilterActive && locationFilteredServices.length > 0 && formData.serviceIds.length > 0) {
      // Only show services that are in locationFilteredServices
      // locationFilteredServices already contains only services that belong to the doctor
      const locationFilteredIds = new Set(locationFilteredServices.map(s => s.id));
      displayServices = displayServices.filter(s => locationFilteredIds.has(s.id));
    }
  } else if (isAdmin) {
    // For admins: Use all services (original behavior)
    if (searchQuery.trim()) {
      displayServices = hasBackendResults ? services : searchResults.length > 0 ? searchResults : services;
    } else {
      displayServices = allServices.length > 0 ? allServices : services;
    }
  } else {
    // Fallback: Use all services
    displayServices = allServices.length > 0 ? allServices : services;
  }

  const selectedServices = displayServices.filter(s => formData.serviceIds.includes(s.id));
  const availableServices = displayServices.filter(s => !formData.serviceIds.includes(s.id));

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[50vw] max-h-[90vh] flex flex-col border-0 shadow-2xl bg-white">
        <DialogHeader className="pb-4 border-b  -m-6 p-6 mb-0 shrink-0">
          <DialogTitle className="flex items-center gap-3 text-xl">
            <div className="p-2 rounded-full bg-linear-to-r bg-primary text-white">
              <Calendar className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-bold text-gray-900">
                {editingSession ? 'Cập nhật lịch làm việc' : 'Tạo lịch làm việc mới'}
              </h2>
              <DialogDescription className="text-gray-600 mt-1">
                {editingSession 
                  ? 'Chỉnh sửa thông tin lịch làm việc hiện tại'
                  : 'Tạo lịch làm việc mới cho bác sĩ'
                }
              </DialogDescription>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1  p-6 pt-4 overflow-y-auto">
          <form onSubmit={handleSubmit} className="h-full flex flex-col ">
            {/* Date and Time */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 shrink-0">
            <div className="space-y-2">
              <Label htmlFor="date">Ngày làm việc</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                className={errors.date ? 'border-red-500' : ''}
              />
              {errors.date && (
                <p className="text-sm text-red-500 flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  {errors.date}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="startTime">Giờ bắt đầu</Label>
              <Input
                id="startTime"
                type="time"
                value={formData.startTime}
                onChange={handleStartTimeChange}
                className={errors.startTime ? 'border-red-500' : ''}
              />
              {errors.startTime && (
                <p className="text-sm text-red-500 flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  {errors.startTime}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="endTime">Giờ kết thúc</Label>
              <Input
                id="endTime"
                type="time"
                value={formData.endTime}
                onChange={handleEndTimeChange}
                min={getMinEndTime()}
                className={errors.endTime ? 'border-red-500' : ''}
              />
              {errors.endTime && (
                <p className="text-[9px] text-red-500 flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  {errors.endTime}
                </p>
              )}
            </div>
            </div>

            {/* Session Duration Info - dùng giờ địa phương để tính thời lượng */}
            {formData.date && formData.startTime && formData.endTime && !errors.endTime && (
              <div className=" border border-primary rounded-lg p-3 mb-4 shrink-0">
                <div className="flex items-center gap-2 text-gray">
                  <Clock className="h-4 w-4" color={colors.primary.hex}/>
                  <span className="text-sm">Thời lượng ca làm việc:</span>
                  <span className="text-primary text-sm">
                    {(() => {
                      const [y, m, d] = formData.date.split('-').map(Number);
                      const [sh, sm] = formData.startTime.split(':').map(Number);
                      const [eh, em] = formData.endTime.split(':').map(Number);
                      const start = new Date(y, m - 1, d, sh, sm, 0);
                      const end = new Date(y, m - 1, d, eh, em, 0);
                      const durationMin = (end.getTime() - start.getTime()) / (1000 * 60);
                      if (durationMin < 0 || isNaN(durationMin)) return '—';
                      const hours = Math.floor(durationMin / 60);
                      const minutes = Math.round(durationMin % 60);
                      return `${hours}h ${minutes}m`;
                    })()}
                  </span>
                </div>
              </div>
            )}

            {/* Service Selection */}
            <div className="flex-1 flex flex-col min-h-0">
              <div className="mb-4 shrink-0">
                <Label className="text-base font-medium">Dịch vụ thực hiện</Label>
                <p className="text-sm text-muted-foreground">
                  Chọn các dịch vụ sẽ thực hiện trong ca làm việc này
                </p>
                {errors.serviceIds && (
                  <p className="text-sm text-red-500 flex items-center gap-1 mt-1">
                    <AlertTriangle className="h-3 w-3" />
                    {errors.serviceIds}
                  </p>
                )}
                {servicesError && (
                  <p className="text-sm text-red-500 flex items-center gap-1 mt-1">
                    <AlertTriangle className="h-3 w-3" />
                    {servicesError}
                  </p>
                )}
              </div>

              {/* Search Services */}
              <div className="relative mb-4 shrink-0">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-gray-400" />
                </div>
                  <Input
                  type="text"
                  placeholder="Tìm kiếm dịch vụ..."
                  value={searchQuery}
                  onChange={handleSearchChange}
                  className="pl-10"
                  disabled={(servicesLoading || isLoadingDoctorServices) && !searchQuery.trim()}
                />
              </div>

              {/* Location Filter Indicator (for doctors) */}
              {isDoctor && locationFilterActive && formData.serviceIds.length > 0 && (
                <div className="mb-4 shrink-0">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-blue-600" />
                      <span className="text-sm text-blue-700">
                        Chỉ hiển thị các dịch vụ có cùng vị trí làm việc với dịch vụ đã chọn
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Selected Services - Compact Display */}
              {selectedServices.length > 0 && (
                <div className="mb-4 shrink-0">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-medium text-green-700">
                        Đã chọn {selectedServices.length} dịch vụ
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {selectedServices.map((service) => (
                        <div
                          key={service.id}
                          className="inline-flex items-center gap-1 bg-white border border-green-300 rounded-md px-2 py-1 text-xs"
                        >
                          <span className="font-medium">{service.name}</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleServiceToggle(service.id, false)}
                            className="h-4 w-4 p-0 hover:bg-red-100 rounded-full"
                          >
                            <X className="h-3 w-3 text-gray-500 hover:text-red-500" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Available Services - Scrollable List */}
              <div className="flex-1 h-52">
                <div className="h-full border border-gray-200 rounded-lg flex flex-col">
                  <div className="shrink-0 bg-white">
                    <div className="flex items-center justify-between">
                    
                      {isSearching && (
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <Loader2 className="h-3 w-3 animate-spin" />
                          <span>Đang tìm kiếm...</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto">
                    {(servicesLoading || isLoadingDoctorServices || isLoadingLocationServices) && !searchQuery.trim() ? (
                      <div className="flex items-center justify-center py-8">
                        <div className="flex items-center gap-2 text-gray-500">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span className="text-sm">
                            {isLoadingDoctorServices 
                              ? 'Đang tải dịch vụ theo bác sĩ...' 
                              : isLoadingLocationServices
                              ? 'Đang lọc dịch vụ theo vị trí...'
                              : 'Đang tải dịch vụ...'}
                          </span>
                        </div>
                      </div>
                    ) : servicesError ? (
                      <div className="text-center py-8">
                        <div className="flex items-center justify-center gap-2 text-red-500 mb-2">
                          <AlertTriangle className="h-4 w-4" />
                          <span className="text-sm">Không thể tải danh sách dịch vụ</span>
                        </div>
                      </div>
                    ) : isDoctor && !doctorCode ? (
                      <div className="text-center py-8 text-amber-600">
                        <AlertTriangle className="h-8 w-8 mx-auto mb-2" />
                        <span className="text-sm">Thông tin bác sĩ chưa đủ. Vui lòng đăng nhập lại.</span>
                      </div>
                    ) : isDoctor && doctorServices.length === 0 && !isLoadingDoctorServices ? (
                      <div className="text-center py-8 text-amber-600">
                        <AlertTriangle className="h-8 w-8 mx-auto mb-2" />
                        <span className="text-sm">Bạn chưa được gán dịch vụ nào. Vui lòng liên hệ quản trị viên.</span>
                      </div>
                    ) : availableServices.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <div className="flex flex-col items-center gap-2">
                          <Search className="h-8 w-8 text-gray-300" />
                          <span className="text-sm">
                            {searchQuery 
                              ? 'Không tìm thấy dịch vụ phù hợp' 
                              : isDoctor && locationFilterActive
                              ? 'Không có dịch vụ nào có cùng vị trí làm việc'
                              : isDoctor && doctorServices.length === 0
                              ? 'Không có dịch vụ nào cho bác sĩ này'
                              : 'Không có dịch vụ nào'}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="p-2">
                        <div className="space-y-1">
                          {availableServices.map((service) => (
                            <div
                              key={service.id}
                              className="flex items-center space-x-3 p-2 border rounded-md hover:bg-blue-50 hover:border-blue-300 transition-colors"
                            >
                              <Checkbox
                                id={service.id}
                                checked={formData.serviceIds.includes(service.id)}
                                onCheckedChange={(checked) => 
                                  handleServiceToggle(service.id, checked as boolean)
                                }
                              />
                              <div className="flex-1 min-w-0">
                                <Label
                                  htmlFor={service.id}
                                  className="font-medium cursor-pointer text-sm block truncate"
                                >
                                  {service.name}
                                </Label>
                                <p className="text-xs text-muted-foreground truncate">
                                  {service.serviceCode}
                                  {service.description && ` • ${service.description}`}
                                </p>
                                {service.timePerPatient && (
                                  <Badge variant="outline" className="text-xs mt-1">
                                    {service.timePerPatient} phút/bệnh nhân
                                  </Badge>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t mt-4 shrink-0">
              <Button type="button" variant="outline" onClick={onClose}>
                Hủy
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Đang xử lý...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Save className="h-4 w-4" />
                    {editingSession ? 'Cập nhật' : 'Tạo lịch'}
                  </div>
                )}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
