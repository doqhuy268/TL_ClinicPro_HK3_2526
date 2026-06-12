'use client';

import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  User, 
  Mail, 
  Edit, 
  Save, 
  X,
  LogOut,
  Camera,
  Upload
} from 'lucide-react';
import { useAuth } from '@/lib/hooks/useAuth';
import { useAvatarUpload } from '@/lib/hooks/useAvatarUpload';

export function UserProfile() {
  const { user, logout, isLoading } = useAuth();
  const { uploadAvatar, isUploading, error: uploadError, clearError } = useAvatarUpload();
  const [isEditing, setIsEditing] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!user) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-gray-500">Vui lòng đăng nhập để xem thông tin profile</p>
        </CardContent>
      </Card>
    );
  }

  const handleEdit = () => {
    setFormData({
      name: user.name || '',
      email: user.email || '',
    });
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setFormData({
      name: user.name || '',
      email: user.email || '',
    });
  };

  const handleSave = async () => {
    try {
      // Note: Update profile functionality needs to be implemented in authApi
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      // Error is handled by the hook
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
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
      }
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

  return (
    <div className="space-y-6">
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

      {/* Profile Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Thông tin cá nhân
            </CardTitle>
            <div className="flex items-center gap-2">
              {!isEditing ? (
                <Button variant="outline" size="sm" onClick={handleEdit}>
                  <Edit className="h-4 w-4 mr-1" />
                  Chỉnh sửa
                </Button>
              ) : (
                <>
                  <Button variant="outline" size="sm" onClick={handleCancel}>
                    <X className="h-4 w-4 mr-1" />
                    Hủy
                  </Button>
                  <Button size="sm" onClick={handleSave} disabled={isLoading}>
                    <Save className="h-4 w-4 mr-1" />
                    Lưu
                  </Button>
                </>
              )}
              <Button variant="outline" size="sm" onClick={logout}>
                <LogOut className="h-4 w-4 mr-1" />
                Đăng xuất
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-start gap-6">
            <div className="space-y-3">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="relative group cursor-pointer">
                      <Avatar className="h-20 w-20">
                        <AvatarImage src={user.avatar || ''} alt={user.name} />
                        <AvatarFallback className="text-lg">
                          {user.name ? getInitials(user.name) : user.email.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      
                      {/* Avatar upload overlay */}
                      <div 
                        className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                        onClick={handleAvatarClick}
                      >
                        {isUploading ? (
                          <Upload className="h-6 w-6 text-white animate-spin" />
                        ) : (
                          <Camera className="h-6 w-6 text-white" />
                        )}
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
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Click để thay đổi avatar</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              
              {/* Upload Avatar Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={handleAvatarClick}
                disabled={isUploading}
                className="w-20 text-xs"
              >
                {isUploading ? (
                  <>
                    <Upload className="h-3 w-3 mr-1 animate-spin" />
                    Đang tải...
                  </>
                ) : (
                  <>
                    <Camera className="h-3 w-3 mr-1" />
                    Đổi ảnh
                  </>
                )}
              </Button>
            </div>
            
            <div className="flex-1 space-y-4">
              {isEditing ? (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Họ và tên</Label>
                    <Input
                      id="name"
                      value={formData.name || ''}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      placeholder="Nhập họ và tên"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email || ''}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      placeholder="Nhập email"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-xl font-semibold">{user.name || 'Chưa có tên'}</h3>
                    <p className="text-gray-600 flex items-center gap-1">
                      <Mail className="h-4 w-4" />
                      {user.email}
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    
                    {user.role && (
                      <Badge variant="secondary">{user.role}</Badge>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* User Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-500">ID</div>
              <div className="text-sm text-gray-600 font-mono">{user.id}</div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">Trạng thái</div>
              <div className="text-sm text-gray-600">
                {user.role ? 'Đã xác thực' : 'Chưa xác thực'}
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">Cập nhật</div>
              
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
