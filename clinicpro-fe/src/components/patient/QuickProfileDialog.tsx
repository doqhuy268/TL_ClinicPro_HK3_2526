'use client';

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

interface QuickProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData: any; // Data from ticket metadata
  onProfileCreated: (profileId: string, profileCode: string) => void;
}

export function QuickProfileDialog({
  open,
  onOpenChange,
  initialData,
  onProfileCreated,
}: QuickProfileDialogProps) {
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    dateOfBirth: '',
    gender: 'male',
    address: 'Tại quầy',
    healthInsurance: '',
  });

  useEffect(() => {
    if (open && initialData) {
      setFormData({
        name: initialData.patientName || '',
        phone: initialData.phone || '',
        dateOfBirth: initialData.birthYear ? `${initialData.birthYear}-01-01` : '',
        gender: initialData.gender || 'male',
        address: 'Tại quầy',
        healthInsurance: '',
      });
    }
  }, [open, initialData]);

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) {
      toast.error('Vui lòng nhập tên bệnh nhân');
      return;
    }

    setSubmitting(true);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
      
      const payload = {
        name: formData.name,
        phone: formData.phone,
        dateOfBirth: formData.dateOfBirth ? new Date(formData.dateOfBirth).toISOString() : new Date().toISOString(),
        gender: formData.gender,
        address: formData.address,
        relationship: 'self',
        emergencyContact: { name: '', phone: '', relationship: '' }
      };

      const res = await fetch(`${API_BASE_URL}/patient-profiles`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || 'Không thể tạo hồ sơ');
      }

      const result = await res.json();
      // Adjust according to standard NestJS response wrapping
      const profile = result.data || result;
      
      toast.success('Đã tạo hồ sơ bệnh nhân mới');
      onProfileCreated(profile.id, profile.profileCode);
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message || 'Có lỗi xảy ra khi tạo hồ sơ');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Tạo Hồ Sơ Nhanh</DialogTitle>
          <DialogDescription>
            Bệnh nhân này chưa có hồ sơ y tế. Vui lòng xác nhận thông tin để tạo hồ sơ tự động trước khi chỉ định dịch vụ.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Họ và tên</Label>
            <Input 
              id="name" 
              value={formData.name} 
              onChange={(e) => handleChange('name', e.target.value)} 
              required 
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Số điện thoại</Label>
              <Input 
                id="phone" 
                value={formData.phone} 
                onChange={(e) => handleChange('phone', e.target.value)} 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="gender">Giới tính</Label>
              <Select value={formData.gender} onValueChange={(v) => handleChange('gender', v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Chọn giới tính" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Nam</SelectItem>
                  <SelectItem value="female">Nữ</SelectItem>
                  <SelectItem value="other">Khác</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="dateOfBirth">Ngày/Năm sinh</Label>
              <Input 
                id="dateOfBirth" 
                type="date"
                value={formData.dateOfBirth} 
                onChange={(e) => handleChange('dateOfBirth', e.target.value)} 
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="healthInsurance">Mã BHYT (Tùy chọn)</Label>
              <Input 
                id="healthInsurance" 
                value={formData.healthInsurance} 
                onChange={(e) => handleChange('healthInsurance', e.target.value)} 
              />
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Hủy
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Đang tạo...' : 'Tạo hồ sơ'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
