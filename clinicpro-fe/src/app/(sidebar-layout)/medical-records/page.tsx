'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  User, 
  Stethoscope, 
  Search,
  Plus,
  Shield,
  Pill,
  FileText
} from 'lucide-react';
import { MedicalRecordManager } from '@/components/medical-records/MedicalRecordManager';
import { PatientProfileCard } from '@/components/patient/PatientProfileCard';
import { PatientSearch } from '@/components/medical-records/PatientSearch';
import { MedicationPrescriptionList } from '@/components/medication-prescriptions/MedicationPrescriptionList';
import { CreatePrescriptionDialog } from '@/components/medication-prescriptions/CreatePrescriptionDialog';
import { DrugSearch } from '@/components/medication-prescriptions/DrugSearch';
import { medicationPrescriptionApi } from '@/lib/api';

import { useAuth } from '@/lib/hooks/useAuth';
import { PatientProfile, User as UserType } from '@/lib/types/user';
import Link from 'next/link';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { patientProfileService } from '@/lib/services/patient-profile.service';
import { formatDateForInput } from '@/lib/utils';

export default function MedicalRecordsPage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [selectedPatientProfile, setSelectedPatientProfile] = useState<PatientProfile | null>(null);
  const todayStr = new Date().toISOString().split('T')[0];
  const [selectedPatient, setSelectedPatient] = useState<UserType | null>(null);
  const [availablePatientProfiles, setAvailablePatientProfiles] = useState<PatientProfile[]>([]);
  const [showProfileSelection, setShowProfileSelection] = useState(false);
  const [activeTab, setActiveTab] = useState('medical-records');
  const [showCreatePrescriptionDialog, setShowCreatePrescriptionDialog] = useState(false);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [isCreateProfileOpen, setIsCreateProfileOpen] = useState(false);
  type GenderOption = 'male' | 'female' | 'other';
  type PatientProfileForm = {
    name: string;
    dateOfBirth: string;
    gender: GenderOption | '';
    address: string;
    occupation: string;
    healthInsurance: string;
    relationship: string;
    emergencyContact: { name: string; phone: string; relationship: string };
  };
  const [editForm, setEditForm] = useState<PatientProfileForm>({
    name: '',
    dateOfBirth: '',
    gender: '',
    address: '',
    occupation: '',
    healthInsurance: '',
    relationship: '',
    emergencyContact: { name: '', phone: '', relationship: '' },
  });
  const [createForm, setCreateForm] = useState({
    name: '',
    dateOfBirth: '',
    gender: '',
    address: '',
    occupation: '',
    healthInsurance: '',
    relationship: '',
    emergencyContact: { name: '', phone: '', relationship: '' },
  });
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);
  const [isSubmittingCreate, setIsSubmittingCreate] = useState(false);
  const [currentPatientId, setCurrentPatientId] = useState<string | null>(null);
  const [searchResetKey, setSearchResetKey] = useState(0);

  const handleCreatePrescription = async (data: {
    patientProfileId: string;
    medicalRecordId?: string;
    note?: string;
    status?: 'DRAFT' | 'SIGNED' | 'CANCELLED';
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    items: any[];
  }) => {
    try {
      await medicationPrescriptionApi.create(data);
      toast.success('Tạo đơn thuốc thành công');
      setShowCreatePrescriptionDialog(false);
    } catch (error) {
      console.error('Error creating prescription:', error);
      toast.error('Có lỗi xảy ra khi tạo đơn thuốc');
      throw error;
    }
  };

  const handlePatientProfileSelect = (patientProfile: PatientProfile | null) => {
    setSelectedPatientProfile(patientProfile);
    setActiveTab('patient-search');
    // Seed edit form when a profile is selected
    if (patientProfile) {
      setEditForm({
        name: patientProfile.name || '',
        dateOfBirth: formatDateForInput(patientProfile.dateOfBirth),
        gender: (patientProfile.gender as GenderOption) || '',
        address: patientProfile.address || '',
        occupation: patientProfile.occupation || '',
        healthInsurance: patientProfile.healthInsurance || '',
        relationship: patientProfile.relationship || '',
        emergencyContact: {
          name: patientProfile.emergencyContact?.name || '',
          phone: patientProfile.emergencyContact?.phone || '',
          relationship: patientProfile.emergencyContact?.relationship || '',
        },
      });
    } else {
      setCurrentPatientId(null);
    }
  };

  const handlePatientSelect = async (patient: UserType | null) => {
    setSelectedPatient(patient);
    setActiveTab('patient-search');
    // Clear profile selection when patient is selected
    setSelectedPatientProfile(null);
    setAvailablePatientProfiles([]);
    setShowProfileSelection(false);
    
    if (patient) {
      try {
        // Load patient profiles for the selected patient
        const profiles = await patientProfileService.getPatientProfilesByPatientId(patient.id);
        if (profiles && profiles.length > 0) {
          // Show profile selection if multiple profiles exist
          if (profiles.length > 1) {
            setAvailablePatientProfiles(profiles);
            setShowProfileSelection(true);
            setCurrentPatientId(patient.id); // Set patient ID for creating new profiles
          } else {
            // If only one profile, select it automatically
            setSelectedPatientProfile(profiles[0]);
            setCurrentPatientId(profiles[0].id);
          }
        } else {
          // If no profiles exist, set the patient ID for creating new profiles
          setCurrentPatientId(patient.id);
        }
      } catch (error) {
        console.error('Error loading patient profiles:', error);
        toast.error('Không thể tải hồ sơ bệnh nhân');
        setCurrentPatientId(patient.id);
      }
    } else {
      setCurrentPatientId(null);
    }
  };

  const handleProfileSelectFromList = (profile: PatientProfile) => {
    setSelectedPatientProfile(profile);
    setCurrentPatientId(profile.id);
    setShowProfileSelection(false);
    setAvailablePatientProfiles([]);
  };

  const handleCreateNewProfile = () => {
    
    // Pre-fill form with patient data if available
    let initialForm = {
      name: '', 
      dateOfBirth: todayStr, 
      gender: '', 
      address: '', 
      occupation: '', 
      healthInsurance: '', 
      relationship: '',
      emergencyContact: { name: '', phone: '', relationship: '' },
    };

    // If patient is selected, pre-fill with patient data
    if (selectedPatient) {
      initialForm = {
        name: selectedPatient.name || '', 
        dateOfBirth: selectedPatient.dateOfBirth ? formatDateForInput(selectedPatient.dateOfBirth) : todayStr, 
        gender: selectedPatient.gender || '', 
        address: selectedPatient.address || '', 
        occupation: '', 
        healthInsurance: '', 
        relationship: 'Chính chủ',
        emergencyContact: { name: '', phone: '', relationship: '' },
      };
    }

    setCreateForm(initialForm);
    setIsCreateProfileOpen(true);
  };

  // Update currentPatientId when selectedPatientProfile or selectedPatient changes
  useEffect(() => {
    if (selectedPatientProfile) {
      setCurrentPatientId(selectedPatientProfile.id);
    } else if (selectedPatient) {
      // If only patient is selected (no profile), use patient ID for creating new profiles
      setCurrentPatientId(selectedPatient.id);
    } else {
      setCurrentPatientId(null);
    }
  }, [selectedPatientProfile, selectedPatient]);

  // Kiểm tra quyền bác sĩ
  const isDoctor = user?.role === 'DOCTOR' || user?.role === 'ADMIN';

  if (isLoading) {
    return (
      <div className="container mx-auto px-8 py-6 space-y-6 bg-white">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <span className="ml-2">Đang tải...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto px-8 py-6 space-y-6 bg-white">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-red-500" />
              Yêu cầu đăng nhập
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">
              Vui lòng đăng nhập để truy cập hệ thống quản lý bệnh án.
            </p>
            <Button asChild>
              <a href="/login">Đăng nhập</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isDoctor) {
    return (
      <div className="container mx-auto px-8 py-6 space-y-6 bg-white">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-red-500" />
              Không có quyền truy cập
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">
              Chỉ bác sĩ mới có quyền truy cập hệ thống quản lý bệnh án.
            </p>
            <p className="text-sm text-gray-500">
              Vai trò hiện tại: {user?.role || 'Không xác định'}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-8  py-6 space-y-6 bg-white">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900 ">
              Quản lý bệnh án & Đơn thuốc
            </h2>
           
          </div>
          <div className="flex items-center gap-2">
            
            <Badge variant="secondary" className="flex items-center gap-1">
              <Stethoscope className="h-3 w-3" />
              Bác sĩ
            </Badge>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6 bg-white">
        <TabsList className="flex items-center gap-2  bg-muted p-1 rounded-lg">
          <TabsTrigger
            value="medical-records"
            className="flex items-center min-w-40 gap-2 rounded-md transition
            data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:text-foreground
            data-[state=inactive]:text-muted-foreground"
          >
            <Stethoscope className="h-4 w-4" />
            Bệnh án 
          </TabsTrigger>
          <TabsTrigger
            value="prescriptions"
            className="flex items-center min-w-40 gap-2 rounded-md transition
            data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:text-foreground
            data-[state=inactive]:text-muted-foreground"
          >
            <Pill className="h-4 w-4" />
            Đơn thuốc
          </TabsTrigger>
          <TabsTrigger
            value="patient-search"
            className="flex items-center min-w-40 gap-2 rounded-md transition
            data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:text-foreground
            data-[state=inactive]:text-muted-foreground"
          >
            <Search className="h-4 w-4" />
            Tìm kiếm bệnh nhân
          </TabsTrigger>
         
        </TabsList>

        <TabsContent value="medical-records" className="space-y-6 bg-white">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Stethoscope className="h-5 w-5" />
                  Bệnh án 
                </span>
                <Link href="/medical-records/create">
                  <Button className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    Tạo bệnh án mới
                  </Button>
                </Link>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <MedicalRecordManager 
                doctorId={user?.id}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="patient-search" className="space-y-6 bg-white">
          <Card>
            <CardHeader className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                Tìm kiếm & chọn bệnh nhân
              </CardTitle>
              <div className="flex items-center justify-between ">
                <div className="flex items-center gap-2"></div>
                <div className="flex items-center gap-2">
                  <Button size="sm" onClick={handleCreateNewProfile}>
                    {selectedPatient ? 'Tạo hồ sơ cho bệnh nhân này' : 'Tạo hồ sơ'}
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => {
                    setSelectedPatientProfile(null);
                    setSelectedPatient(null);
                    setAvailablePatientProfiles([]);
                    setShowProfileSelection(false);
                    setCurrentPatientId(null);
                    setSearchResetKey((k) => k + 1);
                  }}>Xoá trắng</Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              

              <PatientSearch
                key={searchResetKey}
                onPatientProfileSelect={handlePatientProfileSelect} 
                selectedPatientProfile={selectedPatientProfile}
                onPatientSelect={handlePatientSelect}
                selectedPatient={selectedPatient}
              />
            </CardContent>
          </Card>

          {/* Patient Profile Selection */}
          {showProfileSelection && selectedPatient && availablePatientProfiles.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Chọn hồ sơ bệnh nhân
                </CardTitle>
                <p className="text-sm text-gray-600">
                  Bệnh nhân {selectedPatient.name} có {availablePatientProfiles.length} hồ sơ. Vui lòng chọn hồ sơ để tiếp tục.
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {availablePatientProfiles.map((profile) => (
                    <div 
                      key={profile.id}
                      className="border rounded-lg p-4 cursor-pointer transition-colors hover:border-blue-300 hover:bg-blue-50"
                      onClick={() => handleProfileSelectFromList(profile)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <User className="h-5 w-5 text-blue-500" />
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-900">{profile.name}</h4>
                            <div className="flex items-center gap-3 text-sm text-gray-600">
                              <Badge variant="outline" className="text-xs">
                                {profile.profileCode}
                              </Badge>
                              <span>{formatDateForInput(profile.dateOfBirth)}</span>
                              <span>{profile.gender === 'male' ? 'Nam' : profile.gender === 'female' ? 'Nữ' : 'Khác'}</span>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">{profile.address}</p>
                          </div>
                        </div>
                        <Button variant="outline" size="sm">
                          Chọn hồ sơ này
                        </Button>
                      </div>
                    </div>
                  ))}
                  
                  <div className="border-t pt-3">
                    <Button 
                      variant="outline" 
                      onClick={handleCreateNewProfile}
                      className="w-full"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Tạo hồ sơ mới cho bệnh nhân này
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {selectedPatientProfile && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">Thông tin bệnh nhân</h2>
                      <p className="text-gray-600">
                        {selectedPatientProfile.name} • {selectedPatientProfile.profileCode}
                      </p>
                    </div>
                    <Badge variant="outline" className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      Bệnh nhân
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2" />
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" onClick={() =>{ setIsEditProfileOpen(true)}}>
                        Chỉnh sửa hồ sơ
                      </Button>
                      <Button size="sm" onClick={() => setShowCreatePrescriptionDialog(true)} className="flex items-center gap-1">
                        <Plus className="h-4 w-4" />
                        Tạo đơn thuốc
                      </Button>
                    </div>
                  </div>

                  <PatientProfileCard 
                    patientProfileId={selectedPatientProfile.id}
                    showActions={false}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">Bệnh án </h2>
                      <p className="text-gray-600">{selectedPatientProfile.name}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Link href={`/medical-records/create?patientId=${selectedPatientProfile.id}`}>
                        <Button variant="outline" className="flex items-center gap-2">
                          <Plus className="h-4 w-4" />
                          Tạo bệnh án cho bệnh nhân này
                        </Button>
                      </Link>
                      <Button onClick={() => setShowCreatePrescriptionDialog(true)} className="flex items-center gap-2">
                        <Pill className="h-4 w-4" />
                        Tạo đơn thuốc
                      </Button>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <MedicalRecordManager 
                    patientProfileId={selectedPatientProfile.id}
                    doctorId={user?.id}
                  />
                </CardContent>
              </Card>
            </>
          )}

          {!selectedPatientProfile && !selectedPatient && !showProfileSelection && (
            <Card>
              <CardContent className="p-12 text-center">
                <div className="max-w-md mx-auto">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Search className="h-8 w-8 text-blue-500" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    Tìm kiếm bệnh nhân
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Sử dụng công cụ tìm kiếm ở trên để tìm và chọn bệnh nhân
                  </p>
                  <div className="space-y-2 text-sm text-gray-500">
                    <p>• Tìm kiếm theo tên, số điện thoại, email hoặc code</p>
                    <p>• Xem thông tin cá nhân bệnh nhân</p>
                    <p>• Tạo và quản lý hồ sơ bệnh án</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="prescriptions" className="space-y-6 bg-white">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Pill className="h-5 w-5" />
                  Quản lý đơn thuốc
                </span>
                <Button onClick={() => setShowCreatePrescriptionDialog(true)} className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Tạo đơn thuốc mới
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="list" className="space-y-4">
                <TabsList className="flex items-center gap-2">
                  <TabsTrigger value="list" className="flex items-center gap-2 min-w-52">
                    <FileText className="h-4 w-4" />
                    Đơn thuốc của tôi
                  </TabsTrigger>
                  <TabsTrigger value="search" className="flex items-center gap-2 min-w-52">
                    <Search className="h-4 w-4" />
                    Tìm kiếm thuốc
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="list">
                  <MedicationPrescriptionList isDoctor={true} />
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
            </CardContent>
          </Card>
        </TabsContent>

      </Tabs>

      {/* Edit Profile Dialog */}
      <Dialog open={isEditProfileOpen} onOpenChange={setIsEditProfileOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Chỉnh sửa hồ sơ bệnh nhân</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className='pb-1.5'>Họ và tên <span className="text-red-500">*</span></Label>
                <Input 
                  value={editForm.name} 
                  onChange={(e)=>setEditForm({...editForm, name: e.target.value})} 
                  required
                />
              </div>
              <div className="space-y-1">
                <Label className='pb-1.5'>Ngày sinh <span className="text-red-500">*</span></Label>
                <Input 
                  type="date" 
                  value={editForm.dateOfBirth} 
                  max={todayStr}
                  onChange={(e)=>setEditForm({...editForm, dateOfBirth: e.target.value})} 
                  required
                />
              </div>
              <div className="space-y-1">
                <Label className='pb-1.5'>Giới tính <span className="text-red-500">*</span></Label>
                <Select value={editForm.gender} onValueChange={(v)=>setEditForm({...editForm, gender: v as GenderOption})}>
                  <SelectTrigger><SelectValue placeholder="Chọn giới tính" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Nam</SelectItem>
                    <SelectItem value="female">Nữ</SelectItem>
                    <SelectItem value="other">Khác</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className='pb-1.5'>Nghề nghiệp</Label>
                <Input value={editForm.occupation} onChange={(e)=>setEditForm({...editForm, occupation: e.target.value})} />
              </div>
            </div>
            <div className="space-y-1">
              <Label>Địa chỉ <span className="text-red-500">*</span></Label>
              <Input 
                value={editForm.address} 
                onChange={(e)=>setEditForm({...editForm, address: e.target.value})} 
                required
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label className='pb-1.5'>LH khẩn cấp - Họ tên</Label>
                <Input value={editForm.emergencyContact.name} onChange={(e)=>setEditForm({...editForm, emergencyContact: {...editForm.emergencyContact, name: e.target.value}})} />
              </div>
              <div className="space-y-1">
                <Label className='pb-1.5'>LH khẩn cấp - SĐT</Label>
                <Input value={editForm.emergencyContact.phone} onChange={(e)=>setEditForm({...editForm, emergencyContact: {...editForm.emergencyContact, phone: e.target.value}})} />
              </div>
              <div className="space-y-1">
                <Label className='pb-1.5'>LHKC - Quan hệ</Label>
                <Input value={editForm.emergencyContact.relationship} onChange={(e)=>setEditForm({...editForm, emergencyContact: {...editForm.emergencyContact, relationship: e.target.value}})} />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className='pb-1.5'>Số BHYT</Label>
                <Input value={editForm.healthInsurance} onChange={(e)=>setEditForm({...editForm, healthInsurance: e.target.value})} />
              </div>
              <div className="space-y-1">
                <Label className='pb-1.5'>Quan hệ với chủ thẻ</Label>
                <Select value={editForm.relationship} onValueChange={(v)=>setEditForm({...editForm, relationship: v})}>
                  <SelectTrigger><SelectValue placeholder="Chọn quan hệ" /></SelectTrigger>
                  <SelectContent >
                    <SelectItem value="Chính chủ">Chính chủ</SelectItem>
                    <SelectItem value="Vợ/Chồng">Vợ/Chồng</SelectItem>
                    <SelectItem value="Con">Con</SelectItem>
                    <SelectItem value="Cha/Mẹ">Cha/Mẹ</SelectItem>
                    <SelectItem value="Khác">Khác</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={()=>setIsEditProfileOpen(false)}>Đóng</Button>
            <Button
              onClick={async()=>{
                if (!selectedPatientProfile) return;
                if (isSubmittingEdit) return;
                
                // Validation
                if (!editForm.name.trim()) {
                  toast.error('Vui lòng nhập họ và tên');
                  return;
                }
                if (!editForm.dateOfBirth) {
                  toast.error('Vui lòng chọn ngày sinh');
                  return;
                }
                if (new Date(editForm.dateOfBirth) > new Date(todayStr)) {
                  toast.error('Ngày sinh không được ở tương lai');
                  return;
                }
                if (!editForm.gender) {
                  toast.error('Vui lòng chọn giới tính');
                  return;
                }
                if (!editForm.address.trim()) {
                  toast.error('Vui lòng nhập địa chỉ');
                  return;
                }
                
                try {
                  setIsSubmittingEdit(true);
                  
                  // Convert dateOfBirth to ISO 8601 format
                  // const dateOfBirthISO = new Date(editForm.dateOfBirth + 'T00:00:00.000Z').toISOString();
                  
                  const updatePayload = {
                    name: editForm.name.trim(),
                    address: editForm.address.trim(),
                    occupation: editForm.occupation.trim(),
                    healthInsurance: editForm.healthInsurance.trim(),
                    relationship: editForm.relationship,
                    emergencyContact: {
                      name: editForm.emergencyContact.name.trim(),
                      phone: editForm.emergencyContact.phone.trim(),
                      relationship: editForm.emergencyContact.relationship.trim(),
                    },
                  } as { name: string; address: string; occupation: string; healthInsurance: string; relationship: string; emergencyContact: { name: string; phone: string; relationship: string } };
                  await patientProfileService.update(selectedPatientProfile.id, updatePayload);
                  toast.success('Cập nhật hồ sơ thành công');
                  setIsEditProfileOpen(false);
                } catch (error) {
                  console.error('Error updating profile:', error);
                  toast.error('Không thể cập nhật hồ sơ');
                } finally {
                  setIsSubmittingEdit(false);
                }
              }}
              disabled={isSubmittingEdit}
            >
              {isSubmittingEdit ? 'Đang lưu...' : 'Lưu thay đổi'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Profile Dialog */}
      <Dialog open={isCreateProfileOpen} onOpenChange={setIsCreateProfileOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedPatient ? `Tạo hồ sơ cho bệnh nhân ${selectedPatient.name}` : 'Tạo hồ sơ bệnh nhân độc lập'}
            </DialogTitle>
            {selectedPatient && (
              <p className="text-sm text-blue-500 bg-blue-50 p-2 rounded">
                📋 Hồ sơ này sẽ được liên kết với tài khoản bệnh nhân {selectedPatient.name}
              </p>
            )}
            {!selectedPatient && (
              <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                📋 Hồ sơ độc lập - không liên kết với tài khoản bệnh nhân nào
              </p>
            )}
          </DialogHeader>
          <div className="space-y-3">
            {/* Patient Info Display */}
            {selectedPatient && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">Thông tin bệnh nhân</h4>
                <div className="grid grid-cols-2 gap-2 text-sm text-blue-800">
                  <div><span className="font-medium">Tên:</span> {selectedPatient.name}</div>
                  <div><span className="font-medium">Email:</span> {selectedPatient.email}</div>
                  <div><span className="font-medium">SĐT:</span> {selectedPatient.phone}</div>
                  <div><span className="font-medium">Mã bệnh nhân:</span> {selectedPatient.patient?.patientCode}</div>
                </div>
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Họ và tên <span className="text-red-500">*</span></Label>
                <Input 
                  value={createForm.name} 
                  onChange={(e)=>setCreateForm({...createForm, name: e.target.value})} 
                  required
                />
              </div>
              <div className="space-y-1">
                <Label>Ngày sinh <span className="text-red-500">*</span></Label>
                <Input 
                  type="date" 
                  value={createForm.dateOfBirth} 
                  max={todayStr}
                  onChange={(e)=>setCreateForm({...createForm, dateOfBirth: e.target.value})} 
                  required
                />
              </div>
              <div className="space-y-1">
                <Label>Giới tính <span className="text-red-500">*</span></Label>
                <Select value={createForm.gender} onValueChange={(v)=>setCreateForm({...createForm, gender: v})}>
                  <SelectTrigger><SelectValue placeholder="Chọn giới tính" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Nam</SelectItem>
                    <SelectItem value="female">Nữ</SelectItem>
                    <SelectItem value="other">Khác</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Nghề nghiệp</Label>
                <Input value={createForm.occupation} onChange={(e)=>setCreateForm({...createForm, occupation: e.target.value})} />
              </div>
            </div>
            <div className="space-y-1">
              <Label>Địa chỉ <span className="text-red-500">*</span></Label>
              <Input 
                value={createForm.address} 
                onChange={(e)=>setCreateForm({...createForm, address: e.target.value})} 
                required
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label>LH khẩn cấp - Họ tên</Label>
                <Input value={createForm.emergencyContact.name} onChange={(e)=>setCreateForm({...createForm, emergencyContact: {...createForm.emergencyContact, name: e.target.value}})} />
              </div>
              <div className="space-y-1">
                <Label>LH khẩn cấp - SĐT</Label>
                <Input value={createForm.emergencyContact.phone} onChange={(e)=>setCreateForm({...createForm, emergencyContact: {...createForm.emergencyContact, phone: e.target.value}})} />
              </div>
              <div className="space-y-1">
                <Label>LHKC - Quan hệ</Label>
                <Input value={createForm.emergencyContact.relationship} onChange={(e)=>setCreateForm({...createForm, emergencyContact: {...createForm.emergencyContact, relationship: e.target.value}})} />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Số BHYT</Label>
                <Input value={createForm.healthInsurance} onChange={(e)=>setCreateForm({...createForm, healthInsurance: e.target.value})} />
              </div>
              <div className="space-y-1">
                <Label>Quan hệ với chủ thẻ</Label>
                <Select value={createForm.relationship} onValueChange={(v)=>setCreateForm({...createForm, relationship: v})}>
                  <SelectTrigger><SelectValue placeholder="Chọn quan hệ" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Chính chủ">Chính chủ</SelectItem>
                    <SelectItem value="Vợ/Chồng">Vợ/Chồng</SelectItem>
                    <SelectItem value="Con">Con</SelectItem>
                    <SelectItem value="Cha/Mẹ">Cha/Mẹ</SelectItem>
                    <SelectItem value="Khác">Khác</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={()=>setIsCreateProfileOpen(false)}>Đóng</Button>
            <Button
              onClick={async()=>{
                if (!currentPatientId) return;
                if (isSubmittingCreate) return;
                
                // Validation
                if (!createForm.name.trim()) {
                  toast.error('Vui lòng nhập họ và tên');
                  return;
                }
                if (!createForm.dateOfBirth) {
                  toast.error('Vui lòng chọn ngày sinh');
                  return;
                }
                if (new Date(createForm.dateOfBirth) > new Date(todayStr)) {
                  toast.error('Ngày sinh không được ở tương lai');
                  return;
                }
                if (!createForm.gender) {
                  toast.error('Vui lòng chọn giới tính');
                  return;
                }
                if (!createForm.address.trim()) {
                  toast.error('Vui lòng nhập địa chỉ');
                  return;
                }
                
                try {
                  setIsSubmittingCreate(true);
                  
                  // Convert dateOfBirth to ISO 8601 format
                  const dateOfBirthISO = new Date(createForm.dateOfBirth + 'T00:00:00.000Z').toISOString();
                  
                  // Determine if this should be a linked or independent profile
                  const patientId = selectedPatient?.id || null;
                  
                  await patientProfileService.create({
                    name: createForm.name.trim(),
                    dateOfBirth: dateOfBirthISO,
                    gender: createForm.gender as 'male' | 'female' | 'other',
                    address: createForm.address.trim(),
                    occupation: createForm.occupation.trim(),
                    emergencyContact: {
                      name: createForm.emergencyContact.name.trim(),
                      phone: createForm.emergencyContact.phone.trim(),
                      relationship: createForm.emergencyContact.relationship.trim(),
                    },
                    healthInsurance: createForm.healthInsurance.trim(),
                    relationship: createForm.relationship,
                    patientId: patientId, // null for independent, patientId for linked
                  });
                  toast.success(
                    patientId 
                      ? `Tạo hồ sơ liên kết với bệnh nhân ${selectedPatient?.name} thành công`
                      : 'Tạo hồ sơ thành công'
                  );
                  setIsCreateProfileOpen(false);
                  
                  // Refresh patient profiles if we have a selected patient
                  if (selectedPatient) {
                    try {
                      const profiles = await patientProfileService.getPatientProfilesByPatientId(selectedPatient.id);
                      if (profiles && profiles.length > 0) {
                        if (profiles.length > 1) {
                          setAvailablePatientProfiles(profiles);
                          setShowProfileSelection(true);
                        } else {
                          setSelectedPatientProfile(profiles[0]);
                          setCurrentPatientId(profiles[0].id);
                        }
                      }
                    } catch (error) {
                      console.error('Error refreshing patient profiles:', error);
                    }
                  }
                } catch (error) {
                  console.error('Error creating profile:', error);
                  toast.error('Không thể tạo hồ sơ');
                } finally {
                  setIsSubmittingCreate(false);
                }
              }}
              disabled={isSubmittingCreate}
            >
              {isSubmittingCreate ? 'Đang lưu...' : (selectedPatient ? 'Tạo hồ sơ liên kết' : 'Tạo hồ sơ')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Prescription Dialog */}
      <CreatePrescriptionDialog
        open={showCreatePrescriptionDialog}
        onOpenChange={setShowCreatePrescriptionDialog}
        onSave={handleCreatePrescription}
        preselectedPatientProfile={selectedPatientProfile}
        preselectedMedicalRecordId={undefined}
      />
    </div>
  );
}
