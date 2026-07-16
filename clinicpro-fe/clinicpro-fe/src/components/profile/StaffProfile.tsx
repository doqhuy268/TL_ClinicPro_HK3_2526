'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import { authApi, userApi } from '@/lib/api';
import { toast } from 'sonner';
import { Admin, Cashier, Doctor, Patient, Receptionist } from '@/lib/types/user';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { useAvatarUpload } from '@/lib/hooks/useAvatarUpload';
import QRCode from 'react-qr-code';
import { 
  Edit, 
  Save, 
  X, 
  User, 
  Mail, 
  Phone, 
  IdCard, 
  Calendar, 
  MapPin,
  GraduationCap,
  Heart,
  Shield,
  Camera,
  Upload
} from 'lucide-react';
import { buildRoleQrInfo } from '@/lib/utils/roleQr';

interface UserProfileData {
  id: string;
  name: string;
  email: string;
  phone?: string;
  dateOfBirth?: string;
  gender?: string;
  address?: string;
  citizenId?: string;
  avatar?: string;
  role: string;
  patient?: Patient;
  doctor?: Doctor;
  admin?: Admin;
  receptionist?: Receptionist;
  cashier?: Cashier;
}

interface UpdateProfileForm {
  name: string;
  dateOfBirth: string;
  gender: string;
  address: string;
  citizenId: string;
  avatar: string;
  email: string;
  phone: string;
  password: string;
  // role-specific fields
  degrees?: string;
  yearsExperience: string;
  workHistory: string;
  description: string;
  loyaltyPoints: string;
  adminCode: string;
}

export default function StaffProfile() {
  const { user } = useAuth();
  const { uploadAvatar, isUploading, error: uploadError, clearError } = useAvatarUpload();
  const [profileData, setProfileData] = useState<UserProfileData | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [editForm, setEditForm] = useState<UpdateProfileForm>({
    name: '',
    dateOfBirth: '',
    gender: '',
    address: '',
    citizenId: '',
    avatar: '',
    email: '',
    phone: '',
    password: '',
    yearsExperience: '',
    workHistory: '',
    description: '',
    loyaltyPoints: '',
    adminCode: '',
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const qrInfo = useMemo(() => buildRoleQrInfo(profileData), [profileData]);
  const hasQr = Boolean(qrInfo.payload);

  const fetchProfileData = async () => {
    try {
      setIsLoading(true);
      const response = await authApi.getMe();
      setProfileData(response.data);
    } catch (error) {
      console.error('Error fetching profile data:', error);
      toast.error('Không thể tải thông tin cá nhân');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchProfileData();
    }
  }, [user]);

  const startEditing = () => {
    if (profileData) {
      setEditForm({
        name: profileData.name || '',
        dateOfBirth: profileData.dateOfBirth ? new Date(profileData.dateOfBirth).toISOString().split('T')[0] : '',
        gender: profileData.gender || '',
        address: profileData.address || '',
        citizenId: profileData.citizenId || '',
        avatar: profileData.avatar || '',
        email: profileData.email || '',
        phone: profileData.phone || '',
        password: '',
        degrees: profileData.doctor?.degrees ? 
          (Array.isArray(profileData.doctor.degrees) 
            ? profileData.doctor.degrees.join(', ') 
            : String(profileData.doctor.degrees)) : '',
        yearsExperience: profileData.doctor?.yearsExperience ? String(profileData.doctor.yearsExperience) : '',
        workHistory: profileData.doctor?.workHistory || '',
        description: profileData.doctor?.description || '',
        loyaltyPoints: profileData.patient?.loyaltyPoints ? String(profileData.patient.loyaltyPoints) : '',
        adminCode: profileData.admin?.adminCode || '',
      });
      setIsEditing(true);
    }
  };

  const cancelEditing = () => {
    setIsEditing(false);
    setEditForm({
      name: '',
      dateOfBirth: '',
      gender: '',
      address: '',
      citizenId: '',
      avatar: '',
      email: '',
      phone: '',
      password: '',
      degrees: '',
      yearsExperience: '',
      workHistory: '',
      description: '',
      loyaltyPoints: '',
      adminCode: '',
    });
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      clearError();
      setUploadSuccess(false);
      const success = await uploadAvatar(file);
      if (success) {
        // Reset file input
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        // Show success message
        setUploadSuccess(true);
        // Auto hide success message after 3 seconds
        setTimeout(() => setUploadSuccess(false), 3000);
        // Refresh profile data to get updated avatar
        fetchProfileData();
      }
    }
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const updateData: any = {
        name: editForm.name,
        dateOfBirth: editForm.dateOfBirth,
        gender: editForm.gender,
        address: editForm.address,
        citizenId: editForm.citizenId,
        avatar: editForm.avatar,
        email: editForm.email,
        phone: editForm.phone,
      };

      // Add password only if provided
      if (editForm.password) {
        updateData.password = editForm.password;
      }

      // Add role-specific fields
      if (profileData?.role === 'DOCTOR') {
        updateData.degrees = editForm.degrees ? editForm.degrees.split(',').map(d => d.trim()) : [];
        updateData.yearsExperience = editForm.yearsExperience ? parseInt(editForm.yearsExperience) : undefined;
        updateData.workHistory = editForm.workHistory;
        updateData.description = editForm.description;
      } else if (profileData?.role === 'PATIENT') {
        updateData.loyaltyPoints = editForm.loyaltyPoints ? parseInt(editForm.loyaltyPoints) : undefined;
      } else if (profileData?.role === 'ADMIN') {
        updateData.adminCode = editForm.adminCode;
      }

      await userApi.updateMe(updateData);
      
      toast.success('Cập nhật thông tin thành công');
      setIsEditing(false);
      fetchProfileData();
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Không thể cập nhật thông tin');
    } finally {
      setIsSaving(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'ADMIN': return 'Quản trị viên';
      case 'DOCTOR': return 'Bác sĩ';
      case 'RECEPTIONIST': return 'Lễ tân';
      case 'CASHIER': return 'Thu ngân';
      case 'PATIENT': return 'Bệnh nhân';
      case 'TECHNICIAN': return 'Kỹ thuật';
      default: return 'Người dùng';
    }
  };

  if (isLoading) {
    return (
      <div className="px-8 py-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-64 mb-6"></div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
              <div className="h-64 bg-gray-200 rounded-lg"></div>
            </div>
            <div className="lg:col-span-2">
              <div className="h-64 bg-gray-200 rounded-lg"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!profileData) {
    return (
      <div className="px-8 py-6 bg-white">
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <User className="h-8 w-8 text-gray-600" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Không thể tải thông tin</h3>
          <p className="text-gray-500 mb-6">Có lỗi xảy ra khi tải thông tin cá nhân. Vui lòng thử lại sau.</p>
          <Button 
            onClick={fetchProfileData}
            className="bg-primary hover:bg-primary/80 text-white border-0"
          >
            Thử lại
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="px-8 py-6 space-y-6 bg-white">
      {/* Upload Success Display */}
      {uploadSuccess && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-green-600">
              <Save className="h-4 w-4" />
              <span className="text-sm">Avatar đã được cập nhật thành công!</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setUploadSuccess(false)}
                className="ml-auto h-6 w-6 p-0"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Upload Error Display */}
      {uploadError && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-red-600">
              <X className="h-4 w-4" />
              <span className="text-sm">{uploadError}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearError}
                className="ml-auto h-6 w-6 p-0"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Hồ sơ nhân viên</h1>
          <p className="text-gray-500 text-sm">Quản lý thông tin cá nhân và cài đặt tài khoản</p>
        </div>
        {!isEditing ? (
          <Button 
            onClick={startEditing} 
            className="flex items-center gap-2 bg-primary hover:bg-primary/80 text-white border-0"
          >
            <Edit className="h-4 w-4" />
            Chỉnh sửa
          </Button>
        ) : (
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              onClick={cancelEditing}
              className="border-gray-300 hover:bg-gray-50"
            >
              <X className="h-4 w-4 mr-2" />
              Hủy
            </Button>
            <Button 
              onClick={handleSave} 
              disabled={isSaving}
              className="bg-primary hover:bg-primary/80 text-white border-0 disabled:opacity-50"
            >
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? 'Đang lưu...' : 'Lưu thay đổi'}
            </Button>
          </div>
        )}
      </div>

      {/* Profile Information */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Basic Info Card */}
        <Card className="lg:col-span-3 border border-gray-200 bg-white">
          <CardHeader className="border-b border-gray-100 flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-gray-900 text-lg">
              <User className="h-5 w-5 text-gray-600" />
              Thông tin cơ bản
            </CardTitle>
            {hasQr && (
              <div className="">
                <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-primary/30">
                  <div className="bg-white p-1 rounded-md border border-gray-200">
                    <QRCode value={qrInfo.payload} size={72} style={{ width: '72px', height: '72px' }} />
                  </div>
                </div>
              </div>
            )}
          </CardHeader>
          <CardContent className="p-4 space-y-4">
            <div className="flex flex-col items-center space-y-3">
              <div className="relative group cursor-pointer">
                <Avatar className="h-20 w-20 border-2 border-gray-200">
                  <AvatarImage src={profileData.avatar} alt={profileData.name} />
                  <AvatarFallback className="bg-gray-100 text-gray-600 text-base font-semibold">
                    {getInitials(profileData.name)}
                  </AvatarFallback>
                </Avatar>
                
                {/* Avatar upload overlay */}
                <div 
                  className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                  onClick={handleAvatarClick}
                >
                  {isUploading ? (
                    <Upload className="h-5 w-5 text-white animate-spin" />
                  ) : (
                    <Camera className="h-5 w-5 text-white" />
                  )}
                </div>
                
                <div className="absolute -bottom-1 -right-1 bg-primary w-4 h-4 rounded-full border-2 border-white flex items-center justify-center">
                  <div className="w-1 h-1 bg-white rounded-full"></div>
                </div>
                
                {/* Hidden file input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  className="hidden"
                  onChange={handleFileChange}
                  disabled={isUploading}
                />
              </div>
              
              <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-900 mb-1">{profileData.name}</h3>
                <Badge 
                  variant="outline" 
                  className="px-2 py-1 text-xs font-medium border-gray-300 text-gray-700"
                >
                  {getRoleLabel(profileData.role)}
                </Badge>
              </div>
            </div>

          

            <Separator className="my-3" />

            <div className="space-y-4">
              {/* Hàng 1: Email và Số điện thoại */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors duration-200">
                  <div className="p-2 bg-gray-100 rounded-lg">
                    <Mail className="h-4 w-4 text-gray-600" />
                  </div>
                  <div className="flex-1">
                    <span className="text-xs text-gray-500 uppercase tracking-wide font-medium">Email</span>
                    <p className="text-sm font-medium text-gray-900 mt-0.5">{profileData.email || 'Chưa cập nhật'}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors duration-200">
                  <div className="p-2 bg-gray-100 rounded-lg">
                    <Phone className="h-4 w-4 text-gray-600" />
                  </div>
                  <div className="flex-1">
                    <span className="text-xs text-gray-500 uppercase tracking-wide font-medium">Số điện thoại</span>
                    <p className="text-sm font-medium text-gray-900 mt-0.5">{profileData.phone || 'Chưa cập nhật'}</p>
                  </div>
                </div>
              </div>
              
              {/* Hàng 2: CCCD/CMND và Ngày sinh */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors duration-200">
                  <div className="p-2 bg-gray-100 rounded-lg">
                    <IdCard className="h-4 w-4 text-gray-600" />
                  </div>
                  <div className="flex-1">
                    <span className="text-xs text-gray-500 uppercase tracking-wide font-medium">CCCD/CMND</span>
                    <p className="text-sm font-medium text-gray-900 mt-0.5">{profileData.citizenId || 'Chưa cập nhật'}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors duration-200">
                  <div className="p-2 bg-gray-100 rounded-lg">
                    <Calendar className="h-4 w-4 text-gray-600" />
                  </div>
                  <div className="flex-1">
                    <span className="text-xs text-gray-500 uppercase tracking-wide font-medium">Ngày sinh</span>
                    <p className="text-sm font-medium text-gray-900 mt-0.5">
                      {profileData.dateOfBirth 
                        ? new Date(profileData.dateOfBirth).toLocaleDateString('vi-VN')
                        : 'Chưa cập nhật'
                      }
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Hàng 3: Giới tính và Địa chỉ */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors duration-200">
                  <div className="p-2 bg-gray-100 rounded-lg">
                    <User className="h-4 w-4 text-gray-600" />
                  </div>
                  <div className="flex-1">
                    <span className="text-xs text-gray-500 uppercase tracking-wide font-medium">Giới tính</span>
                    <p className="text-sm font-medium text-gray-900 mt-0.5">{profileData.gender || 'Chưa cập nhật'}</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors duration-200">
                  <div className="p-2 bg-gray-100 rounded-lg mt-0.5">
                    <MapPin className="h-4 w-4 text-gray-600" />
                  </div>
                  <div className="flex-1">
                    <span className="text-xs text-gray-500 uppercase tracking-wide font-medium">Địa chỉ</span>
                    <p className="text-sm font-medium text-gray-900 mt-0.5">{profileData.address || 'Chưa cập nhật'}</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Role-specific Information */}
        <Card className="lg:col-span-2 border border-gray-200 bg-white">
          <CardHeader className="border-b border-gray-100 pb-4">
            <CardTitle className="flex items-center gap-2 text-gray-900 text-lg">
              {profileData.role === 'DOCTOR' && <GraduationCap className="h-5 w-5 text-gray-600" />}
              {profileData.role === 'PATIENT' && <Heart className="h-5 w-5 text-gray-600" />}
              {profileData.role === 'ADMIN' && <Shield className="h-5 w-5 text-gray-600" />}
              {profileData.role === 'RECEPTIONIST' && <User className="h-5 w-5 text-gray-600" />}
              {profileData.role === 'CASHIER' && <User className="h-5 w-5 text-gray-600" />}
              Thông tin {getRoleLabel(profileData.role)}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            {profileData.role === 'DOCTOR' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors duration-200">
                    <div className="flex items-center gap-2 mb-2">
                      <GraduationCap className="h-4 w-4 text-gray-500" />
                      <h4 className="font-medium text-gray-900 text-sm">Bằng cấp</h4>
                    </div>
                    <p className="text-gray-700 text-sm leading-relaxed">
                      {profileData.doctor?.degrees ? 
                        (Array.isArray(profileData.doctor.degrees) 
                          ? profileData.doctor.degrees.join(', ')
                          : String(profileData.doctor.degrees))
                        : 'Chưa cập nhật'
                      }
                    </p>
                  </div>
                  
                  <div className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors duration-200">
                    <div className="flex items-center gap-2 mb-2">
                      <Calendar className="h-4 w-4 text-gray-500" />
                      <h4 className="font-medium text-gray-900 text-sm">Kinh nghiệm</h4>
                    </div>
                    <p className="text-gray-700 text-sm">
                      {profileData.doctor?.yearsExperience ? `${profileData.doctor.yearsExperience} năm` : 'Chưa cập nhật'}
                    </p>
                  </div>
                </div>
                
                <div className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors duration-200">
                  <div className="flex items-center gap-2 mb-2">
                    <User className="h-4 w-4 text-gray-500" />
                    <h4 className="font-medium text-gray-900 text-sm">Lịch sử công tác</h4>
                  </div>
                  <p className="text-gray-700 text-sm leading-relaxed line-clamp-3">
                    {profileData.doctor?.workHistory || 'Chưa cập nhật'}
                  </p>
                </div>
                
                <div className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors duration-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Heart className="h-4 w-4 text-gray-500" />
                    <h4 className="font-medium text-gray-900 text-sm">Mô tả chuyên môn</h4>
                  </div>
                  <p className="text-gray-700 text-sm leading-relaxed line-clamp-3">
                    {profileData.doctor?.description || 'Chưa cập nhật'}
                  </p>
                </div>
              </div>
            )}

            {profileData.role === 'ADMIN' && (
              <div className="flex justify-center">
                <div className="p-4 border border-gray-200 rounded-lg max-w-sm w-full">
                  <div className="text-center">
                    <div className="p-3 bg-gray-100 rounded-full w-12 h-12 mx-auto mb-3 flex items-center justify-center">
                      <Shield className="h-6 w-6 text-gray-600" />
                    </div>
                    <h4 className="text-base font-semibold text-gray-900 mb-2">Mã quản trị</h4>
                    <div className="text-lg font-mono font-semibold text-gray-900 bg-gray-100 px-3 py-2 rounded-lg">
                      {profileData.admin?.adminCode || 'Chưa cập nhật'}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {(profileData.role === 'RECEPTIONIST' || profileData.role === 'CASHIER') && (
              <div className="flex justify-center">
                <div className="p-4 border border-gray-200 rounded-lg max-w-sm w-full">
                  <div className="text-center">
                    <div className="p-3 bg-gray-100 rounded-full w-12 h-12 mx-auto mb-3 flex items-center justify-center">
                      <User className="h-6 w-6 text-gray-600" />
                    </div>
                    <h4 className="text-base font-semibold text-gray-900 mb-2">{getRoleLabel(profileData.role)}</h4>
                    <p className="text-gray-500 text-sm">
                      Không có thông tin bổ sung cho {getRoleLabel(profileData.role)}.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Edit Form */}
      {isEditing && (
        <Card className="border border-gray-200 bg-white">
          <CardHeader className="border-b border-gray-100 pb-4">
            <CardTitle className="flex items-center gap-2 text-gray-900 text-lg">
              <Edit className="h-5 w-5 text-gray-600" />
              Chỉnh sửa thông tin
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name" className="text-sm font-medium text-gray-700">Họ và tên <span className="text-red-500">*</span></Label>
                <Input
                  id="edit-name"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="border-gray-300 focus:border-primary focus:ring-primary"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-email" className="text-sm font-medium text-gray-700">Email <span className="text-red-500">*</span></Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  className="border-gray-300 focus:border-primary focus:ring-primary"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-phone" className="text-sm font-medium text-gray-700">Số điện thoại</Label>
                <Input
                  id="edit-phone"
                  value={editForm.phone}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  className="border-gray-300 focus:border-primary focus:ring-primary"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-dateOfBirth" className="text-sm font-medium text-gray-700">Ngày sinh</Label>
                <Input
                  id="edit-dateOfBirth"
                  type="date"
                  value={editForm.dateOfBirth}
                  onChange={(e) => setEditForm({ ...editForm, dateOfBirth: e.target.value })}
                  className="border-gray-300 focus:border-primary focus:ring-primary"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-gender" className="text-sm font-medium text-gray-700">Giới tính</Label>
                <Select value={editForm.gender} onValueChange={(value) => setEditForm({ ...editForm, gender: value })}>
                  <SelectTrigger className="border-gray-300 focus:border-primary focus:ring-primary">
                    <SelectValue placeholder="Chọn giới tính" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Nam</SelectItem>
                    <SelectItem value="female">Nữ</SelectItem>
                    <SelectItem value="other">Khác</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-citizenId" className="text-sm font-medium text-gray-700">CCCD/CMND</Label>
                <Input
                  id="edit-citizenId"
                  value={editForm.citizenId}
                  onChange={(e) => setEditForm({ ...editForm, citizenId: e.target.value })}
                  className="border-gray-300 focus:border-primary focus:ring-primary"
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="edit-address" className="text-sm font-medium text-gray-700">Địa chỉ</Label>
                <Textarea
                  id="edit-address"
                  value={editForm.address}
                  onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                  className="border-gray-300 focus:border-primary focus:ring-primary"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-avatar" className="text-sm font-medium text-gray-700">Avatar URL</Label>
                <Input
                  id="edit-avatar"
                  value={editForm.avatar}
                  onChange={(e) => setEditForm({ ...editForm, avatar: e.target.value })}
                  className="border-gray-300 focus:border-primary focus:ring-primary"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-password" className="text-sm font-medium text-gray-700">Mật khẩu mới</Label>
                <Input
                  id="edit-password"
                  type="password"
                  value={editForm.password}
                  onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                  placeholder="Để trống nếu không muốn đổi"
                  className="border-gray-300 focus:border-primary focus:ring-primary"
                />
              </div>

              {/* Role-specific fields */}
              {profileData.role === 'DOCTOR' && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="edit-degrees" className="text-sm font-medium text-gray-700">Bằng cấp (phân cách bằng dấu phẩy)</Label>
                    <Input
                      id="edit-degrees"
                      value={editForm.degrees}
                      onChange={(e) => setEditForm({ ...editForm, degrees: e.target.value })}
                      className="border-gray-300 focus:border-primary focus:ring-primary"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit-yearsExperience" className="text-sm font-medium text-gray-700">Số năm kinh nghiệm</Label>
                    <Input
                      id="edit-yearsExperience"
                      type="number"
                      value={editForm.yearsExperience}
                      onChange={(e) => setEditForm({ ...editForm, yearsExperience: e.target.value })}
                      className="border-gray-300 focus:border-primary focus:ring-primary"
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="edit-workHistory" className="text-sm font-medium text-gray-700">Lịch sử công tác</Label>
                    <Textarea
                      id="edit-workHistory"
                      value={editForm.workHistory}
                      onChange={(e) => setEditForm({ ...editForm, workHistory: e.target.value })}
                      className="border-gray-300 focus:border-primary focus:ring-primary"
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="edit-description" className="text-sm font-medium text-gray-700">Mô tả chuyên môn</Label>
                    <Textarea
                      id="edit-description"
                      value={editForm.description}
                      onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                      className="border-gray-300 focus:border-primary focus:ring-primary"
                      rows={3}
                    />
                  </div>
                </>
              )}

              {profileData.role === 'ADMIN' && (
                <div className="space-y-2">
                  <Label htmlFor="edit-adminCode" className="text-sm font-medium text-gray-700">Mã quản trị</Label>
                  <Input
                    id="edit-adminCode"
                    value={editForm.adminCode}
                    onChange={(e) => setEditForm({ ...editForm, adminCode: e.target.value })}
                    className="border-gray-300 focus:border-primary focus:ring-primary"
                  />
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
