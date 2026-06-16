/* eslint-disable @typescript-eslint/no-unused-vars */
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Search,
  Users,
  X,
  UserPlus,
  Award,
  FileText,
  Eye,
  Upload,
  Image as ImageIcon,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { toast } from 'sonner';
import { 
  staffService,
  type Role,
  type CertificateType,
  type Certificate,
  type CreateStaffDto,
  type UpdateStaffDto,
  type StaffMember,
} from '@/lib/services/staff.service';
import { specialtiesService } from '@/lib/services/services.service';
import { fileStorageService } from '@/lib/services/file-storage.service';

interface Specialty {
  id: string;
  name: string;
  description?: string;
}

export default function StaffManagementPage() {
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [roleFilter, setRoleFilter] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const limit = 20; // Fixed limit
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  // Dialog states
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null);

  // File upload states
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string>('');
  const [editAvatarFile, setEditAvatarFile] = useState<File | null>(null);
  const [editAvatarPreview, setEditAvatarPreview] = useState<string>('');
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  // Form states
  const todayStr = new Date().toISOString().split('T')[0];
  const [createForm, setCreateForm] = useState<CreateStaffDto>({
    name: '',
    dateOfBirth: '',
    gender: '',
    address: '',
    role: 'RECEPTIONIST',
    phone: '',
    email: '',
    avatar: '',
    citizenId: '',
    doctorInfo: undefined,
    adminInfo: undefined,
    technicianInfo: undefined,
    receptionistInfo: undefined,
    cashierInfo: undefined,
    certificates: undefined,
  });

  const [editForm, setEditForm] = useState<UpdateStaffDto>({});

  const [certificates, setCertificates] = useState<Omit<Certificate, 'id'>[]>([]);
  const [editCertificates, setEditCertificates] = useState<Omit<Certificate, 'id'>[]>([]);
  const [certificateFiles, setCertificateFiles] = useState<{ [index: number]: File | null }>({});
  const [editCertificateFiles, setEditCertificateFiles] = useState<{ [index: number]: File | null }>({});

  // Load specialties on mount
  useEffect(() => {
    const loadSpecialties = async () => {
      try {
        const response = await specialtiesService.listSpecialties(1, 100);
        setSpecialties(response.data || []);
      } catch (error) {
        console.error('Error loading specialties:', error);
        toast.error('Không thể tải danh sách chuyên khoa');
      }
    };
    loadSpecialties();
  }, []);

  // Fetch staff list
  const fetchStaffList = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await staffService.getAll({
        role: roleFilter as Role | undefined,
        page,
        limit,
      });
      const { data, meta } = response.data;
      
      setStaffList(data || []);
      setTotal(meta?.total || 0);
      setTotalPages(meta?.totalPages || 0);
    } catch (error) {
      console.error('Error fetching staff:', error);
      toast.error('Không thể tải danh sách nhân viên');
    } finally {
      setIsLoading(false);
    }
  }, [page, roleFilter]);

  useEffect(() => {
    fetchStaffList();
  }, [fetchStaffList]);

  // Filter staff by search term (client-side)
  const filteredStaff = staffList.filter(staff => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      staff.name?.toLowerCase().includes(search) ||
      staff.email?.toLowerCase().includes(search) ||
      staff.phone?.includes(search) ||
      staff.citizenId?.includes(search)
    );
  });

  // Email regex validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const phoneRegex = /^[0-9]{10,11}$/;

  // Handle avatar file change
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>, isEdit = false) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error('Vui lòng chọn file ảnh');
        return;
      }
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error('Kích thước file không được vượt quá 10MB');
        return;
      }

      if (isEdit) {
        setEditAvatarFile(file);
        setEditAvatarPreview(URL.createObjectURL(file));
      } else {
        setAvatarFile(file);
        setAvatarPreview(URL.createObjectURL(file));
      }
    }
  };

  // Handle certificate file change
  const handleCertificateFileChange = (e: React.ChangeEvent<HTMLInputElement>, index: number, isEdit = false) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error('Kích thước file không được vượt quá 10MB');
        return;
      }

      if (isEdit) {
        setEditCertificateFiles({ ...editCertificateFiles, [index]: file });
      } else {
        setCertificateFiles({ ...certificateFiles, [index]: file });
      }
    }
  };

  // Validate form
  const validateCreateForm = (): boolean => {
    if (!createForm.name.trim()) {
      toast.error('Vui lòng nhập họ và tên');
      return false;
    }
    if (!createForm.dateOfBirth) {
      toast.error('Vui lòng chọn ngày sinh');
      return false;
    }
    if (new Date(createForm.dateOfBirth) > new Date(todayStr)) {
      toast.error('Ngày sinh không được ở tương lai');
      return false;
    }
    if (!createForm.gender) {
      toast.error('Vui lòng chọn giới tính');
      return false;
    }
    if (!createForm.address.trim()) {
      toast.error('Vui lòng nhập địa chỉ');
      return false;
    }
    if (createForm.email && !emailRegex.test(createForm.email)) {
      toast.error('Email không hợp lệ');
      return false;
    }
    if (createForm.phone && !phoneRegex.test(createForm.phone)) {
      toast.error('Số điện thoại phải có 10-11 chữ số');
      return false;
    }
    if (!createForm.citizenId?.trim()) {
      toast.error('Vui lòng nhập CCCD/CMND');
      return false;
    }

    // Validate role-specific fields
    if (createForm.role === 'DOCTOR') {
      if (!createForm.doctorInfo?.specialtyId) {
        toast.error('Vui lòng chọn chuyên khoa cho bác sĩ');
        return false;
      }
    }

    // Validate certificates
    for (const cert of certificates) {
      if (!cert.title.trim()) {
        toast.error('Vui lòng nhập tên chứng chỉ');
        return false;
      }
      if (!cert.type) {
        toast.error('Vui lòng chọn loại chứng chỉ');
        return false;
      }
      if (!cert.issuedBy?.trim()) {
        toast.error('Vui lòng nhập tổ chức cấp chứng chỉ');
        return false;
      }
      if (!cert.issuedAt) {
        toast.error('Vui lòng chọn ngày cấp chứng chỉ');
        return false;
      }
    }

    return true;
  };

  // Handle create staff
  const handleCreateStaff = async () => {
    if (!validateCreateForm()) return;

    try {
      setIsLoading(true);

      // Upload avatar if exists
      let avatarUrl = createForm.avatar;
      if (avatarFile) {
        setIsUploadingAvatar(true);
        const uploadResult = await fileStorageService.uploadFile(
          avatarFile,
          'profiles',
          'avatars/'
        );
        avatarUrl = uploadResult.url || '';
        setIsUploadingAvatar(false);
      }

      // Upload certificate files if exist
      const uploadedCertificates = await Promise.all(
        certificates.map(async (cert, index) => {
          let fileUrl = cert.file || '';
          if (certificateFiles[index]) {
            const uploadResult = await fileStorageService.uploadFile(
              certificateFiles[index]!,
              'certificates',
              'appendices/'
            );
            fileUrl = uploadResult.url || '';
          }
          return { 
            type: cert.type,
            title: cert.title,
            code: cert.code && cert.code.trim() !== '' ? cert.code : undefined,
            issuedBy: cert.issuedBy,
            issuedAt: cert.issuedAt,
            expiryAt: cert.expiryAt && cert.expiryAt.trim() !== '' ? cert.expiryAt : undefined,
            file: fileUrl && fileUrl.trim() !== '' ? fileUrl : undefined,
            description: cert.description && cert.description.trim() !== '' ? cert.description : undefined,
          };
        })
      );

      const payload: CreateStaffDto = {
        ...createForm,
        avatar: avatarUrl,
        certificates: uploadedCertificates.length > 0 ? uploadedCertificates : undefined,
      };

      // Add role-specific info
      if (createForm.role === 'DOCTOR' && createForm.doctorInfo) {
        payload.doctorInfo = {
          ...createForm.doctorInfo,
          rating: 0, // Default rating as per requirement
        };
      } else if (createForm.role === 'ADMIN') {
        payload.adminInfo = createForm.adminInfo || {};
      } else if (createForm.role === 'TECHNICIAN') {
        payload.technicianInfo = {};
      } else if (createForm.role === 'RECEPTIONIST') {
        payload.receptionistInfo = {};
      } else if (createForm.role === 'CASHIER') {
        payload.cashierInfo = {};
      }

      await staffService.create(payload);
      toast.success('Tạo nhân viên thành công');
      setIsCreateDialogOpen(false);
      resetCreateForm();
      fetchStaffList();
    } catch (error: unknown) {
      console.error('Error creating staff:', error);
      const errorMessage = error instanceof Error ? error.message : 'Không thể tạo nhân viên';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
      setIsUploadingAvatar(false);
    }
  };

  // Handle update staff
  const handleUpdateStaff = async () => {
    if (!selectedStaff) return;

    try {
      if (editForm.dateOfBirth && new Date(editForm.dateOfBirth) > new Date(todayStr)) {
        toast.error('Ngày sinh không được ở tương lai');
        return;
      }
      setIsLoading(true);

      // Upload avatar if changed
      let avatarUrl = editForm.avatar;
      if (editAvatarFile) {
        setIsUploadingAvatar(true);
        const uploadResult = await fileStorageService.uploadFile(
          editAvatarFile,
          'profiles',
          'avatars/'
        );
        avatarUrl = uploadResult.url || '';
        setIsUploadingAvatar(false);
      }

      // Upload certificate files if exist
      const uploadedCertificates = await Promise.all(
        editCertificates.map(async (cert, index) => {
          let fileUrl = cert.file || '';
          if (editCertificateFiles[index]) {
            const uploadResult = await fileStorageService.uploadFile(
              editCertificateFiles[index]!,
              'certificates',
              'appendices/'
            );
            fileUrl = uploadResult.url || '';
          }
          return { 
            type: cert.type,
            title: cert.title,
            code: cert.code && cert.code.trim() !== '' ? cert.code : undefined,
            issuedBy: cert.issuedBy,
            issuedAt: cert.issuedAt,
            expiryAt: cert.expiryAt && cert.expiryAt.trim() !== '' ? cert.expiryAt : undefined,
            file: fileUrl && fileUrl.trim() !== '' ? fileUrl : undefined,
            description: cert.description && cert.description.trim() !== '' ? cert.description : undefined,
          };
        })
      );

      const payload: UpdateStaffDto = {
        ...editForm,
        avatar: avatarUrl,
        certificates: uploadedCertificates.length > 0 ? uploadedCertificates : undefined,
        replaceAllCertificates: false,
      };

      await staffService.update(selectedStaff.id, payload);
      toast.success('Cập nhật nhân viên thành công');
      setIsEditDialogOpen(false);
      setSelectedStaff(null);
      fetchStaffList();
    } catch (error: unknown) {
      console.error('Error updating staff:', error);
      const errorMessage = error instanceof Error ? error.message : 'Không thể cập nhật nhân viên';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
      setIsUploadingAvatar(false);
    }
  };

  // Handle delete (deactivate) staff
  const handleDeleteStaff = async () => {
    if (!selectedStaff) return;

    try {
      setIsLoading(true);
      await staffService.delete(selectedStaff.id);
      toast.success('Vô hiệu hóa nhân viên thành công');
      setIsDeleteDialogOpen(false);
      setSelectedStaff(null);
      fetchStaffList();
    } catch (error: unknown) {
      console.error('Error deleting staff:', error);
      const errorMessage = error instanceof Error ? error.message : 'Không thể vô hiệu hóa nhân viên';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Reset create form
  const resetCreateForm = () => {
    setCreateForm({
      name: '',
      dateOfBirth: todayStr,
      gender: '',
      address: '',
      role: 'RECEPTIONIST',
      phone: '',
      email: '',
      avatar: '',
      citizenId: '',
      doctorInfo: undefined,
      adminInfo: undefined,
      technicianInfo: undefined,
      receptionistInfo: undefined,
      cashierInfo: undefined,
      certificates: undefined,
    });
    setCertificates([]);
    setAvatarFile(null);
    setAvatarPreview('');
    setCertificateFiles({});
  };

  // Open edit dialog
  const openEditDialog = (staff: StaffMember) => {
    setSelectedStaff(staff);
    
    const currentCerts = (staff.doctor?.certificates || staff.technician?.certificates || [])
      .map(cert => ({
        code: cert.code || '',
        title: cert.title || '',
        type: cert.type || 'DEGREE',
        issuedBy: cert.issuedBy || '',
        issuedAt: cert.issuedAt ? cert.issuedAt.split('T')[0] : '',
        expiryAt: cert.expiryAt ? cert.expiryAt.split('T')[0] : '',
        file: cert.file || '',
        description: cert.description || '',
      }));

    setEditForm({
      name: staff.name,
      dateOfBirth: staff.dateOfBirth?.split('T')[0],
      gender: staff.gender,
      address: staff.address,
      phone: staff.phone,
      email: staff.email,
      avatar: staff.avatar,
      citizenId: staff.citizenId,
      doctorInfo: staff.doctor ? {
        specialtyId: staff.doctor.specialtyId,
        yearsExperience: staff.doctor.yearsExperience,
        workHistory: staff.doctor.workHistory,
        description: staff.doctor.description,
        position: staff.doctor.position,
        isActive: staff.doctor.isActive,
      } : undefined,
      adminInfo: staff.admin ? {
        position: staff.admin.position,
        isActive: staff.admin.isActive,
      } : undefined,
      technicianInfo: staff.technician ? {
        isActive: staff.technician.isActive,
      } : undefined,
      receptionistInfo: staff.receptionist ? {
        isActive: staff.receptionist.isActive,
      } : undefined,
      cashierInfo: staff.cashier ? {
        isActive: staff.cashier.isActive,
      } : undefined,
    });
    setEditCertificates(currentCerts);
    setEditAvatarFile(null);
    setEditAvatarPreview(staff.avatar || '');
    setEditCertificateFiles({});
    setIsEditDialogOpen(true);
  };

  // Open detail dialog
  const openDetailDialog = (staff: StaffMember) => {
    setSelectedStaff(staff);
    setIsDetailDialogOpen(true);
  };

  // Add certificate
  const addCertificate = (isEdit = false) => {
    const newCert: Omit<Certificate, 'id'> = {
      code: '',
      title: '',
      type: 'DEGREE',
      issuedBy: '',
      issuedAt: '',
      expiryAt: '',
      file: '',
      description: '',
    };
    if (isEdit) {
      setEditCertificates([...editCertificates, newCert]);
    } else {
      setCertificates([...certificates, newCert]);
    }
  };

  // Remove certificate
  const removeCertificate = (index: number, isEdit = false) => {
    if (isEdit) {
      setEditCertificates(editCertificates.filter((_, i) => i !== index));
      const { [index]: _removed, ...rest } = editCertificateFiles;
      setEditCertificateFiles(rest);
    } else {
      setCertificates(certificates.filter((_, i) => i !== index));
      const { [index]: _removed, ...rest } = certificateFiles;
      setCertificateFiles(rest);
    }
  };

  // Update certificate
  const updateCertificate = (index: number, field: keyof Certificate, value: string, isEdit = false) => {
    if (isEdit) {
      const updated = [...editCertificates];
      updated[index] = { ...updated[index], [field]: value };
      setEditCertificates(updated);
    } else {
      const updated = [...certificates];
      updated[index] = { ...updated[index], [field]: value };
      setCertificates(updated);
    }
  };

  // Get role badge variant
  const getRoleBadgeVariant = (role: Role) => {
    switch (role) {
      case 'ADMIN': return 'destructive';
      case 'DOCTOR': return 'default';
      case 'TECHNICIAN': return 'secondary';
      case 'RECEPTIONIST': return 'secondary';
      case 'CASHIER': return 'secondary';
      default: return 'outline';
    }
  };

  // Get role label
  const getRoleLabel = (role: Role) => {
    switch (role) {
      case 'ADMIN': return 'Quản trị viên';
      case 'DOCTOR': return 'Bác sĩ';
      case 'TECHNICIAN': return 'Kỹ thuật viên';
      case 'RECEPTIONIST': return 'Lễ tân';
      case 'CASHIER': return 'Thu ngân';
      default: return role;
    }
  };

  // Get certificate type label
  const getCertificateTypeLabel = (type: CertificateType) => {
    switch (type) {
      case 'LICENSE': return 'Chứng chỉ hành nghề';
      case 'DEGREE': return 'Văn bằng';
      case 'TRAINING': return 'Đào tạo';
      case 'OTHER': return 'Khác';
      default: return type;
    }
  };

  return (
    <div className="space-y-6 py-6 px-8 ">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">Quản lý nhân viên</h2>
          
        </div>
        <Button onClick={() => {
          resetCreateForm();
          setIsCreateDialogOpen(true);
        }} className="flex items-center gap-2">
          <UserPlus className="h-4 w-4" />
          Thêm nhân viên
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Label htmlFor="search" className="mb-2 block">Tìm kiếm</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  id="search"
                  placeholder="Tìm theo tên, email, SĐT, CCCD..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="w-full sm:w-48">
              <Label htmlFor="role-filter" className="mb-2 block">Vai trò</Label>
              <Select value={roleFilter} onValueChange={(value) => {
                setRoleFilter(value === 'ALL' ? '' : value);
                setPage(1);
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Tất cả" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Tất cả</SelectItem>
                  <SelectItem value="DOCTOR">Bác sĩ</SelectItem>
                  <SelectItem value="TECHNICIAN">Kỹ thuật viên</SelectItem>
                  <SelectItem value="RECEPTIONIST">Lễ tân</SelectItem>
                  <SelectItem value="CASHIER">Thu ngân</SelectItem>
                  <SelectItem value="ADMIN">Quản trị viên</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Staff Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Danh sách nhân viên ({total})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 p-4 border rounded-lg">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                  <Skeleton className="h-8 w-24" />
                  <Skeleton className="h-8 w-20" />
                </div>
              ))}
            </div>
          ) : filteredStaff.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Users className="h-12 w-12 mx-auto mb-3 text-gray-400" />
              <p className="font-medium">Không tìm thấy nhân viên</p>
              <p className="text-sm">Thử thay đổi bộ lọc hoặc thêm nhân viên mới.</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Mã</TableHead>
                      <TableHead>Nhân viên</TableHead>
                      <TableHead>Số điện thoại</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Vai trò</TableHead>
                      <TableHead>Trạng thái</TableHead>
                      <TableHead className="text-right">Thao tác</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredStaff.map((staff) => {
                      const roleInfo = staff.doctor || staff.technician || staff.receptionist || staff.cashier || staff.admin;
                      const isActive = roleInfo && 'isActive' in roleInfo ? roleInfo.isActive : true;
                      const staffCode = staff.doctor?.doctorCode || staff.technician?.technicianCode || staff.receptionist?.receptionistCode || staff.cashier?.cashierCode || staff.admin?.adminCode || '-';

                      return (
                        <TableRow key={staff.id}>
                          <TableCell className="font-medium">{staffCode}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar>
                                <AvatarImage src={staff.avatar} alt={staff.name} />
                                <AvatarFallback className="bg-blue-100 text-blue-600">
                                  {staff.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="font-medium">{staff.name}</div>
                                <div className="text-sm text-gray-500">{staff.citizenId}</div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>{staff.phone || '-'}</TableCell>
                          <TableCell>{staff.email || '-'}</TableCell>
                          <TableCell>
                            <Badge variant={getRoleBadgeVariant(staff.role)}>
                              {getRoleLabel(staff.role)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={isActive ? 'default' : 'secondary'}>
                              {isActive ? 'Hoạt động' : 'Vô hiệu hóa'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <TooltipProvider>
                              <div className="flex items-center justify-end gap-2">
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => openDetailDialog(staff)}
                                    >
                                      <Eye className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>Xem chi tiết</TooltipContent>
                                </Tooltip>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => openEditDialog(staff)}
                                    >
                                      <Edit className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>Chỉnh sửa</TooltipContent>
                                </Tooltip>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => {
                                        setSelectedStaff(staff);
                                        setIsDeleteDialogOpen(true);
                                      }}
                                      className="text-red-600 hover:text-red-700"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>Vô hiệu hóa</TooltipContent>
                                </Tooltip>
                              </div>
                            </TooltipProvider>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-center gap-2 mt-6 pt-4 border-t">
                <Button 
                  variant="outline" 
                  size="sm" 
                  disabled={page <= 1} 
                  onClick={() => setPage(p => p - 1)}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="px-4 text-sm text-gray-600">
                  Trang {page} / {totalPages} (Tổng: {total})
                </span>
                <Button 
                  variant="outline" 
                  size="sm" 
                  disabled={page >= totalPages} 
                  onClick={() => setPage(p => p + 1)}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Create Staff Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="w-[70vw] max-w-[70vw] sm:max-w-[70vw] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              Thêm nhân viên mới
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Thông tin cơ bản</h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="create-name">Họ và tên <span className="text-red-500">*</span></Label>
                  <Input
                    id="create-name"
                    value={createForm.name}
                    onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                    placeholder="Nguyễn Văn A"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="create-dateOfBirth">Ngày sinh <span className="text-red-500">*</span></Label>
                  <Input
                    id="create-dateOfBirth"
                    type="date"
                    value={createForm.dateOfBirth}
                    max={todayStr}
                    onChange={(e) => setCreateForm({ ...createForm, dateOfBirth: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="create-gender">Giới tính <span className="text-red-500">*</span></Label>
                  <Select value={createForm.gender} onValueChange={(value) => setCreateForm({ ...createForm, gender: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn giới tính" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Nam">Nam</SelectItem>
                      <SelectItem value="Nữ">Nữ</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="create-citizenId">CCCD/CMND <span className="text-red-500">*</span></Label>
                  <Input
                    id="create-citizenId"
                    value={createForm.citizenId || ''}
                    onChange={(e) => setCreateForm({ ...createForm, citizenId: e.target.value })}
                    placeholder="001234567890"
                    required
                  />
                </div>
                <div className="space-y-2 col-span-3">
                  <Label htmlFor="create-address">Địa chỉ <span className="text-red-500">*</span></Label>
                  <Input
                    id="create-address"
                    value={createForm.address}
                    onChange={(e) => setCreateForm({ ...createForm, address: e.target.value })}
                    placeholder="123 Đường ABC, Quận 1, TP.HCM"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Thông tin liên hệ</h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="create-role">Vai trò <span className="text-red-500">*</span></Label>
                  <Select value={createForm.role} onValueChange={(value: Role) => {
                    setCreateForm({ 
                      ...createForm, 
                      role: value,
                      doctorInfo: value === 'DOCTOR' ? { specialtyId: '', yearsExperience: 0 } : undefined,
                      adminInfo: value === 'ADMIN' ? { position: '' } : undefined,
                    });
                    setCertificates([]);
                  }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn vai trò" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DOCTOR">Bác sĩ</SelectItem>
                      <SelectItem value="TECHNICIAN">Kỹ thuật viên</SelectItem>
                      <SelectItem value="RECEPTIONIST">Lễ tân</SelectItem>
                      <SelectItem value="CASHIER">Thu ngân</SelectItem>
                      <SelectItem value="ADMIN">Quản trị viên</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="create-phone">Số điện thoại <span className="text-red-500">*</span></Label>
                  <Input
                    id="create-phone"
                    value={createForm.phone || ''}
                    onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })}
                    placeholder="0901234567"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="create-email">Email <span className="text-red-500">*</span></Label>
                  <Input
                    id="create-email"
                    type="email"
                    value={createForm.email || ''}
                    onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                    placeholder="email@example.com"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Avatar Upload */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Ảnh đại diện</h3>
              <div className="space-y-2">
                <div className="flex items-center gap-4">
                  {avatarPreview && (
                    <Avatar className="h-20 w-20">
                      <AvatarImage src={avatarPreview} alt="Preview" />
                    </Avatar>
                  )}
                  <div className="flex-1">
                    <Label htmlFor="create-avatar" className="cursor-pointer">
                      <div className="flex items-center gap-2 px-4 py-2 border-2 border-dashed rounded-lg hover:border-primary transition-colors">
                        <ImageIcon className="h-5 w-5" />
                        <span>{avatarFile ? avatarFile.name : 'Chọn ảnh'}</span>
                      </div>
                    </Label>
                    <Input
                      id="create-avatar"
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleAvatarChange(e, false)}
                      className="hidden"
                    />
                    <p className="text-xs text-gray-500 mt-1">Chấp nhận: JPG, PNG, GIF (Tối đa 10MB)</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Doctor-specific fields */}
            {createForm.role === 'DOCTOR' && (
              <div className="space-y-4">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <Award className="h-5 w-5" />
                  Thông tin bác sĩ
                </h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="create-specialtyId">Chuyên khoa <span className="text-red-500">*</span></Label>
                    <Select 
                      value={createForm.doctorInfo?.specialtyId} 
                      onValueChange={(value) => setCreateForm({ 
                        ...createForm, 
                        doctorInfo: { ...createForm.doctorInfo, specialtyId: value } 
                      })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn chuyên khoa" />
                      </SelectTrigger>
                      <SelectContent>
                        {specialties.map((specialty) => (
                          <SelectItem key={specialty.id} value={specialty.id}>
                            {specialty.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="create-yearsExperience">Số năm kinh nghiệm <span className="text-red-500">*</span></Label>
                    <Input
                      id="create-yearsExperience"
                      type="number"
                      min="0"
                      value={createForm.doctorInfo?.yearsExperience || ''}
                      onChange={(e) => setCreateForm({ 
                        ...createForm, 
                        doctorInfo: { ...createForm.doctorInfo, yearsExperience: Number(e.target.value) } 
                      })}
                      placeholder="10"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="create-position">Chức danh</Label>
                    <Input
                      id="create-position"
                      value={createForm.doctorInfo?.position || ''}
                      onChange={(e) => setCreateForm({ 
                        ...createForm, 
                        doctorInfo: { ...createForm.doctorInfo, position: e.target.value } 
                      })}
                      placeholder="Trưởng khoa"
                    />
                  </div>
                  <div className="space-y-2 col-span-3">
                    <Label htmlFor="create-workHistory">Lịch sử công tác <span className="text-red-500">*</span></Label>
                    <Textarea
                      id="create-workHistory"
                      value={createForm.doctorInfo?.workHistory || ''}
                      onChange={(e) => setCreateForm({ 
                        ...createForm, 
                        doctorInfo: { ...createForm.doctorInfo, workHistory: e.target.value } 
                      })}
                      placeholder="Bệnh viện A (2010-2020), Phòng khám B (2020-nay)"
                      required
                    />
                  </div>
                  <div className="space-y-2 col-span-3">
                    <Label htmlFor="create-description">Mô tả <span className="text-red-500">*</span></Label>
                    <Textarea
                      id="create-description"
                      value={createForm.doctorInfo?.description || ''}
                      onChange={(e) => setCreateForm({ 
                        ...createForm, 
                        doctorInfo: { ...createForm.doctorInfo, description: e.target.value } 
                      })}
                      placeholder="Chuyên gia điều trị bệnh tim mạch"
                      required
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Admin-specific fields */}
            {createForm.role === 'ADMIN' && (
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Thông tin quản trị</h3>
                <div className="space-y-2">
                  <Label htmlFor="create-admin-position">Vị trí/Chức danh</Label>
                  <Input
                    id="create-admin-position"
                    value={createForm.adminInfo?.position || ''}
                    onChange={(e) => setCreateForm({ 
                      ...createForm, 
                      adminInfo: { ...createForm.adminInfo, position: e.target.value } 
                    })}
                    placeholder="Quản lý hệ thống"
                  />
                </div>
              </div>
            )}

            {/* Certificates (for DOCTOR and TECHNICIAN) */}
            {(createForm.role === 'DOCTOR' || createForm.role === 'TECHNICIAN') && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-lg flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Chứng chỉ
                  </h3>
                  <Button type="button" variant="outline" size="sm" onClick={() => addCertificate(false)}>
                    <Plus className="h-4 w-4 mr-1" />
                    Thêm chứng chỉ
                  </Button>
                </div>
                {certificates.map((cert, index) => (
                  <Card key={index} className="p-4">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">Chứng chỉ {index + 1}</h4>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeCertificate(index, false)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label>Tên chứng chỉ <span className="text-red-500">*</span></Label>
                          <Input
                            value={cert.title || ''}
                            onChange={(e) => updateCertificate(index, 'title', e.target.value, false)}
                            placeholder="Bằng Tiến sĩ Y khoa"
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Loại chứng chỉ <span className="text-red-500">*</span></Label>
                          <Select 
                            value={cert.type || 'DEGREE'} 
                            onValueChange={(value) => updateCertificate(index, 'type', value, false)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="LICENSE">Chứng chỉ hành nghề</SelectItem>
                              <SelectItem value="DEGREE">Văn bằng</SelectItem>
                              <SelectItem value="TRAINING">Đào tạo</SelectItem>
                              <SelectItem value="OTHER">Khác</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Mã chứng chỉ</Label>
                          <Input
                            value={cert.code || ''}
                            onChange={(e) => updateCertificate(index, 'code', e.target.value, false)}
                            placeholder="CERT-001"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Tổ chức cấp <span className="text-red-500">*</span></Label>
                          <Input
                            value={cert.issuedBy || ''}
                            onChange={(e) => updateCertificate(index, 'issuedBy', e.target.value, false)}
                            placeholder="Đại học Y Hà Nội"
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Ngày cấp <span className="text-red-500">*</span></Label>
                          <Input
                            type="date"
                            value={cert.issuedAt || ''}
                            onChange={(e) => updateCertificate(index, 'issuedAt', e.target.value, false)}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Ngày hết hạn</Label>
                          <Input
                            type="date"
                            value={cert.expiryAt || ''}
                            onChange={(e) => updateCertificate(index, 'expiryAt', e.target.value, false)}
                          />
                        </div>
                        <div className="space-y-2 col-span-3">
                          <Label>File chứng chỉ</Label>
                          <div className="flex items-center gap-2">
                            <Label htmlFor={`cert-file-${index}`} className="cursor-pointer flex-1">
                              <div className="flex items-center gap-2 px-4 py-2 border-2 border-dashed rounded-lg hover:border-primary transition-colors">
                                <Upload className="h-4 w-4" />
                                <span className="text-sm">
                                  {certificateFiles[index] ? certificateFiles[index]!.name : 'Chọn file chứng chỉ'}
                                </span>
                              </div>
                            </Label>
                            <Input
                              id={`cert-file-${index}`}
                              type="file"
                              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                              onChange={(e) => handleCertificateFileChange(e, index, false)}
                              className="hidden"
                            />
                          </div>
                          <p className="text-xs text-gray-500">Chấp nhận: PDF, DOC, DOCX, JPG, PNG (Tối đa 10MB)</p>
                        </div>
                        <div className="space-y-2 col-span-3">
                          <Label>Mô tả</Label>
                          <Textarea
                            value={cert.description || ''}
                            onChange={(e) => updateCertificate(index, 'description', e.target.value, false)}
                            placeholder="Mô tả về chứng chỉ"
                          />
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Hủy
            </Button>
            <Button onClick={handleCreateStaff} disabled={isLoading || isUploadingAvatar}>
              {isLoading ? 'Đang tạo...' : isUploadingAvatar ? 'Đang tải file...' : 'Tạo nhân viên'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Staff Dialog - Similar structure to Create but with edit data */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="w-[70vw] max-w-[70vw] sm:max-w-[70vw] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5" />
              Cập nhật thông tin nhân viên
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Thông tin cơ bản</h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Họ và tên</Label>
                  <Input
                    value={editForm.name || ''}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    placeholder="Nguyễn Văn A"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Ngày sinh</Label>
                  <Input
                    type="date"
                    value={editForm.dateOfBirth || ''}
                    max={todayStr}
                    onChange={(e) => setEditForm({ ...editForm, dateOfBirth: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Giới tính</Label>
                  <Select value={editForm.gender || ''} onValueChange={(value) => setEditForm({ ...editForm, gender: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn giới tính" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Nam">Nam</SelectItem>
                      <SelectItem value="Nữ">Nữ</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>CCCD/CMND</Label>
                  <Input
                    value={editForm.citizenId || ''}
                    onChange={(e) => setEditForm({ ...editForm, citizenId: e.target.value })}
                  />
                </div>
                <div className="space-y-2 col-span-3">
                  <Label>Địa chỉ</Label>
                  <Input
                    value={editForm.address || ''}
                    onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                  />
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Thông tin liên hệ</h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Số điện thoại</Label>
                  <Input
                    value={editForm.phone || ''}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={editForm.email || ''}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  />
                </div>
              </div>
            </div>

            {/* Avatar Upload */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Ảnh đại diện</h3>
              <div className="space-y-2">
                <div className="flex items-center gap-4">
                  {editAvatarPreview && (
                    <Avatar className="h-20 w-20">
                      <AvatarImage src={editAvatarPreview} alt="Preview" />
                    </Avatar>
                  )}
                  <div className="flex-1">
                    <Label htmlFor="edit-avatar" className="cursor-pointer">
                      <div className="flex items-center gap-2 px-4 py-2 border-2 border-dashed rounded-lg hover:border-primary transition-colors">
                        <ImageIcon className="h-5 w-5" />
                        <span>{editAvatarFile ? editAvatarFile.name : 'Chọn ảnh'}</span>
                      </div>
                    </Label>
                    <Input
                      id="edit-avatar"
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleAvatarChange(e, true)}
                      className="hidden"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Doctor-specific fields */}
            {selectedStaff?.role === 'DOCTOR' && editForm.doctorInfo && (
              <div className="space-y-4">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <Award className="h-5 w-5" />
                  Thông tin bác sĩ
                </h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Chuyên khoa</Label>
                    <Select 
                      value={editForm.doctorInfo?.specialtyId || ''} 
                      onValueChange={(value) => setEditForm({ 
                        ...editForm, 
                        doctorInfo: { ...editForm.doctorInfo, specialtyId: value } 
                      })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {specialties.map((specialty) => (
                          <SelectItem key={specialty.id} value={specialty.id}>
                            {specialty.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Số năm kinh nghiệm</Label>
                    <Input
                      type="number"
                      min="0"
                      value={editForm.doctorInfo?.yearsExperience || ''}
                      onChange={(e) => setEditForm({ 
                        ...editForm, 
                        doctorInfo: { ...editForm.doctorInfo, yearsExperience: Number(e.target.value) } 
                      })}
                    />
                  </div>
                  <div className="space-y-2 col-span-3">
                    <Label>Lịch sử công tác</Label>
                    <Textarea
                      value={editForm.doctorInfo?.workHistory || ''}
                      onChange={(e) => setEditForm({ 
                        ...editForm, 
                        doctorInfo: { ...editForm.doctorInfo, workHistory: e.target.value } 
                      })}
                    />
                  </div>
                  <div className="space-y-2 col-span-3">
                    <Label>Mô tả</Label>
                    <Textarea
                      value={editForm.doctorInfo?.description || ''}
                      onChange={(e) => setEditForm({ 
                        ...editForm, 
                        doctorInfo: { ...editForm.doctorInfo, description: e.target.value } 
                      })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Trạng thái</Label>
                    <Select 
                      value={editForm.doctorInfo?.isActive ? 'true' : 'false'} 
                      onValueChange={(value) => setEditForm({ 
                        ...editForm, 
                        doctorInfo: { ...editForm.doctorInfo, isActive: value === 'true' } 
                      })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="true">Hoạt động</SelectItem>
                        <SelectItem value="false">Vô hiệu hóa</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            )}

            {/* Status for other roles */}
            {selectedStaff?.role === 'TECHNICIAN' && editForm.technicianInfo && (
              <div className="space-y-2">
                <Label>Trạng thái</Label>
                <Select 
                  value={editForm.technicianInfo?.isActive ? 'true' : 'false'} 
                  onValueChange={(value) => setEditForm({ 
                    ...editForm, 
                    technicianInfo: { isActive: value === 'true' } 
                  })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">Hoạt động</SelectItem>
                    <SelectItem value="false">Vô hiệu hóa</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {selectedStaff?.role === 'RECEPTIONIST' && editForm.receptionistInfo && (
              <div className="space-y-2">
                <Label>Trạng thái</Label>
                <Select 
                  value={editForm.receptionistInfo?.isActive ? 'true' : 'false'} 
                  onValueChange={(value) => setEditForm({ 
                    ...editForm, 
                    receptionistInfo: { isActive: value === 'true' } 
                  })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">Hoạt động</SelectItem>
                    <SelectItem value="false">Vô hiệu hóa</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {selectedStaff?.role === 'CASHIER' && editForm.cashierInfo && (
              <div className="space-y-2">
                <Label>Trạng thái</Label>
                <Select 
                  value={editForm.cashierInfo?.isActive ? 'true' : 'false'} 
                  onValueChange={(value) => setEditForm({ 
                    ...editForm, 
                    cashierInfo: { isActive: value === 'true' } 
                  })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">Hoạt động</SelectItem>
                    <SelectItem value="false">Vô hiệu hóa</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {selectedStaff?.role === 'ADMIN' && editForm.adminInfo && (
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Thông tin quản trị</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Vị trí/Chức danh</Label>
                    <Input
                      value={editForm.adminInfo?.position || ''}
                      onChange={(e) => setEditForm({ 
                        ...editForm, 
                        adminInfo: { ...editForm.adminInfo, position: e.target.value } 
                      })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Trạng thái</Label>
                    <Select 
                      value={editForm.adminInfo?.isActive ? 'true' : 'false'} 
                      onValueChange={(value) => setEditForm({ 
                        ...editForm, 
                        adminInfo: { ...editForm.adminInfo, isActive: value === 'true' } 
                      })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="true">Hoạt động</SelectItem>
                        <SelectItem value="false">Vô hiệu hóa</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            )}

            {/* Certificates */}
            {(selectedStaff?.role === 'DOCTOR' || selectedStaff?.role === 'TECHNICIAN') && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-lg flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Chứng chỉ
                  </h3>
                  <Button type="button" variant="outline" size="sm" onClick={() => addCertificate(true)}>
                    <Plus className="h-4 w-4 mr-1" />
                    Thêm chứng chỉ
                  </Button>
                </div>
                {editCertificates.map((cert, index) => (
                  <Card key={index} className="p-4">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">Chứng chỉ {index + 1}</h4>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeCertificate(index, true)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label>Tên chứng chỉ</Label>
                          <Input
                            value={cert.title || ''}
                            onChange={(e) => updateCertificate(index, 'title', e.target.value, true)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Loại chứng chỉ</Label>
                          <Select 
                            value={cert.type || 'DEGREE'} 
                            onValueChange={(value) => updateCertificate(index, 'type', value, true)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="LICENSE">Chứng chỉ hành nghề</SelectItem>
                              <SelectItem value="DEGREE">Văn bằng</SelectItem>
                              <SelectItem value="TRAINING">Đào tạo</SelectItem>
                              <SelectItem value="OTHER">Khác</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Tổ chức cấp</Label>
                          <Input
                            value={cert.issuedBy || ''}
                            onChange={(e) => updateCertificate(index, 'issuedBy', e.target.value, true)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Ngày cấp</Label>
                          <Input
                            type="date"
                            value={cert.issuedAt || ''}
                            onChange={(e) => updateCertificate(index, 'issuedAt', e.target.value, true)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Ngày hết hạn</Label>
                          <Input
                            type="date"
                            value={cert.expiryAt || ''}
                            onChange={(e) => updateCertificate(index, 'expiryAt', e.target.value, true)}
                          />
                        </div>
                        <div className="space-y-2 col-span-3">
                          <Label>File chứng chỉ</Label>
                          <div className="flex items-center gap-2">
                            <Label htmlFor={`edit-cert-file-${index}`} className="cursor-pointer flex-1">
                              <div className="flex items-center gap-2 px-4 py-2 border-2 border-dashed rounded-lg hover:border-primary transition-colors">
                                <Upload className="h-4 w-4" />
                                <span className="text-sm truncate">
                                  {editCertificateFiles[index] ? editCertificateFiles[index]!.name : (cert.file ? 'File đã có' : 'Chọn file')}
                                </span>
                              </div>
                            </Label>
                            <Input
                              id={`edit-cert-file-${index}`}
                              type="file"
                              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                              onChange={(e) => handleCertificateFileChange(e, index, true)}
                              className="hidden"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Hủy
            </Button>
            <Button onClick={handleUpdateStaff} disabled={isLoading || isUploadingAvatar}>
              {isLoading ? 'Đang cập nhật...' : isUploadingAvatar ? 'Đang tải file...' : 'Cập nhật'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail Staff Dialog */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="w-[70vw] max-w-[70vw] sm:max-w-[70vw] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Chi tiết nhân viên
            </DialogTitle>
          </DialogHeader>

          {selectedStaff && (
            <div className="space-y-6">
              {/* Avatar & Basic Info */}
              <div className="flex items-start gap-6">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={selectedStaff.avatar} alt={selectedStaff.name} />
                  <AvatarFallback className="bg-blue-100 text-blue-600 text-2xl">
                    {selectedStaff.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold">{selectedStaff.name}</h3>
                  <div className="flex items-center gap-3 mt-2">
                    <Badge variant={getRoleBadgeVariant(selectedStaff.role)}>
                      {getRoleLabel(selectedStaff.role)}
                    </Badge>
                    {(() => {
                      const roleInfo = selectedStaff.doctor || selectedStaff.technician || selectedStaff.receptionist || selectedStaff.cashier || selectedStaff.admin;
                      const isActive = roleInfo && 'isActive' in roleInfo ? roleInfo.isActive : true;
                      return (
                        <Badge variant={isActive ? 'default' : 'secondary'}>
                          {isActive ? 'Hoạt động' : 'Vô hiệu hóa'}
                        </Badge>
                      );
                    })()}
                  </div>
                </div>
              </div>

              {/* Info Grid */}
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <Label className="text-gray-600">CCCD/CMND</Label>
                  <p className="font-medium">{selectedStaff.citizenId}</p>
                </div>
                <div>
                  <Label className="text-gray-600">Ngày sinh</Label>
                  <p className="font-medium">{new Date(selectedStaff.dateOfBirth).toLocaleDateString('vi-VN')}</p>
                </div>
                <div>
                  <Label className="text-gray-600">Giới tính</Label>
                  <p className="font-medium">{selectedStaff.gender}</p>
                </div>
                <div>
                  <Label className="text-gray-600">Số điện thoại</Label>
                  <p className="font-medium">{selectedStaff.phone || '-'}</p>
                </div>
                <div>
                  <Label className="text-gray-600">Email</Label>
                  <p className="font-medium">{selectedStaff.email || '-'}</p>
                </div>
                <div className="col-span-2">
                  <Label className="text-gray-600">Địa chỉ</Label>
                  <p className="font-medium">{selectedStaff.address}</p>
                </div>
              </div>

              {/* Doctor Info */}
              {selectedStaff.doctor && (
                <div className="space-y-4">
                  <h4 className="font-semibold text-lg border-b pb-2">Thông tin bác sĩ</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-gray-600">Mã bác sĩ</Label>
                      <p className="font-medium">{selectedStaff.doctor.doctorCode}</p>
                    </div>
                    <div>
                      <Label className="text-gray-600">Chuyên khoa</Label>
                      <p className="font-medium">
                        {specialties.find(s => s.id === selectedStaff.doctor?.specialtyId)?.name || selectedStaff.doctor.specialtyId}
                      </p>
                    </div>
                    <div>
                      <Label className="text-gray-600">Số năm kinh nghiệm</Label>
                      <p className="font-medium">{selectedStaff.doctor.yearsExperience} năm</p>
                    </div>
                    <div>
                      <Label className="text-gray-600">Đánh giá</Label>
                      <p className="font-medium">{selectedStaff.doctor.rating}/5</p>
                    </div>
                    {selectedStaff.doctor.position && (
                      <div>
                        <Label className="text-gray-600">Chức danh</Label>
                        <p className="font-medium">{selectedStaff.doctor.position}</p>
                      </div>
                    )}
                    {selectedStaff.doctor.workHistory && (
                      <div className="col-span-2">
                        <Label className="text-gray-600">Lịch sử công tác</Label>
                        <p className="font-medium">{selectedStaff.doctor.workHistory}</p>
                      </div>
                    )}
                    {selectedStaff.doctor.description && (
                      <div className="col-span-2">
                        <Label className="text-gray-600">Mô tả</Label>
                        <p className="font-medium">{selectedStaff.doctor.description}</p>
                      </div>
                    )}
                  </div>
                  
                  {/* Certificates */}
                  {selectedStaff.doctor.certificates && selectedStaff.doctor.certificates.length > 0 && (
                    <div className="space-y-3">
                      <Label className="text-gray-600 font-semibold">Chứng chỉ</Label>
                      {selectedStaff.doctor.certificates.map((cert, idx) => (
                        <Card key={idx} className="p-4">
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <Label className="text-gray-600 text-xs">Tên chứng chỉ</Label>
                              <p className="font-medium">{cert.title}</p>
                            </div>
                            <div>
                              <Label className="text-gray-600 text-xs">Loại</Label>
                              <p className="font-medium">{getCertificateTypeLabel(cert.type)}</p>
                            </div>
                            <div>
                              <Label className="text-gray-600 text-xs">Tổ chức cấp</Label>
                              <p className="font-medium">{cert.issuedBy}</p>
                            </div>
                            <div>
                              <Label className="text-gray-600 text-xs">Ngày cấp</Label>
                              <p className="font-medium">
                                {cert.issuedAt ? new Date(cert.issuedAt).toLocaleDateString('vi-VN') : '-'}
                              </p>
                            </div>
                            {cert.file && (
                              <div className="col-span-2">
                                <Label className="text-gray-600 text-xs">File</Label>
                                <a href={cert.file} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                                  Xem file chứng chỉ
                                </a>
                              </div>
                            )}
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Technician Info */}
              {selectedStaff.technician && (
                <div className="space-y-4">
                  <h4 className="font-semibold text-lg border-b pb-2">Thông tin kỹ thuật viên</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-gray-600">Mã kỹ thuật viên</Label>
                      <p className="font-medium">{selectedStaff.technician.technicianCode}</p>
                    </div>
                    <div>
                      <Label className="text-gray-600">Trạng thái</Label>
                      <Badge variant={selectedStaff.technician.isActive ? 'default' : 'secondary'}>
                        {selectedStaff.technician.isActive ? 'Hoạt động' : 'Vô hiệu hóa'}
                      </Badge>
                    </div>
                  </div>

                  {/* Technician Certificates */}
                  {selectedStaff.technician.certificates && selectedStaff.technician.certificates.length > 0 && (
                    <div className="space-y-3">
                      <Label className="text-gray-600 font-semibold">Chứng chỉ</Label>
                      {selectedStaff.technician.certificates.map((cert, idx) => (
                        <Card key={idx} className="p-4">
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <Label className="text-gray-600 text-xs">Tên chứng chỉ</Label>
                              <p className="font-medium">{cert.title}</p>
                            </div>
                            <div>
                              <Label className="text-gray-600 text-xs">Loại</Label>
                              <p className="font-medium">{getCertificateTypeLabel(cert.type)}</p>
                            </div>
                            <div>
                              <Label className="text-gray-600 text-xs">Tổ chức cấp</Label>
                              <p className="font-medium">{cert.issuedBy}</p>
                            </div>
                            <div>
                              <Label className="text-gray-600 text-xs">Ngày cấp</Label>
                              <p className="font-medium">
                                {cert.issuedAt ? new Date(cert.issuedAt).toLocaleDateString('vi-VN') : '-'}
                              </p>
                            </div>
                            {cert.file && (
                              <div className="col-span-2">
                                <Label className="text-gray-600 text-xs">File</Label>
                                <a href={cert.file} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                                  Xem file chứng chỉ
                                </a>
                              </div>
                            )}
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Receptionist Info */}
              {selectedStaff.receptionist && (
                <div className="space-y-4">
                  <h4 className="font-semibold text-lg border-b pb-2">Thông tin lễ tân</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-gray-600">Mã lễ tân</Label>
                      <p className="font-medium">{selectedStaff.receptionist.receptionistCode}</p>
                    </div>
                    <div>
                      <Label className="text-gray-600">Trạng thái</Label>
                      <Badge variant={selectedStaff.receptionist.isActive ? 'default' : 'secondary'}>
                        {selectedStaff.receptionist.isActive ? 'Hoạt động' : 'Vô hiệu hóa'}
                      </Badge>
                    </div>
                  </div>
                </div>
              )}

              {/* Cashier Info */}
              {selectedStaff.cashier && (
                <div className="space-y-4">
                  <h4 className="font-semibold text-lg border-b pb-2">Thông tin thu ngân</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-gray-600">Mã thu ngân</Label>
                      <p className="font-medium">{selectedStaff.cashier.cashierCode}</p>
                    </div>
                    <div>
                      <Label className="text-gray-600">Trạng thái</Label>
                      <Badge variant={selectedStaff.cashier.isActive ? 'default' : 'secondary'}>
                        {selectedStaff.cashier.isActive ? 'Hoạt động' : 'Vô hiệu hóa'}
                      </Badge>
                    </div>
                  </div>
                </div>
              )}

              {/* Admin Info */}
              {selectedStaff.admin && (
                <div className="space-y-4">
                  <h4 className="font-semibold text-lg border-b pb-2">Thông tin quản trị viên</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-gray-600">Mã quản trị viên</Label>
                      <p className="font-medium">{selectedStaff.admin.adminCode}</p>
                    </div>
                    <div>
                      <Label className="text-gray-600">Trạng thái</Label>
                      <Badge variant={selectedStaff.admin.isActive ? 'default' : 'secondary'}>
                        {selectedStaff.admin.isActive ? 'Hoạt động' : 'Vô hiệu hóa'}
                      </Badge>
                    </div>
                    {selectedStaff.admin.position && (
                      <div>
                        <Label className="text-gray-600">Chức vụ</Label>
                        <p className="font-medium">{selectedStaff.admin.position}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDetailDialogOpen(false)}>
              Đóng
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Staff Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xác nhận vô hiệu hóa nhân viên</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-gray-600">
              Bạn có chắc chắn muốn vô hiệu hóa nhân viên <strong>{selectedStaff?.name}</strong>?
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Nhân viên sẽ không bị xóa khỏi hệ thống và có thể kích hoạt lại sau này.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Hủy
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteStaff} 
              disabled={isLoading}
            >
              {isLoading ? 'Đang vô hiệu hóa...' : 'Vô hiệu hóa'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
