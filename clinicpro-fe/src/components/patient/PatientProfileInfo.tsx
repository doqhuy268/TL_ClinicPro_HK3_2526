'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PatientProfile } from '@/lib/api';
import { User, Calendar, MapPin, Phone, CreditCard, Briefcase } from 'lucide-react';

interface PatientProfileInfoProps {
  profile: PatientProfile;
}

export function PatientProfileInfo({ profile }: PatientProfileInfoProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  const getAge = (dateOfBirth: string) => {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <User className="h-5 w-5" />
          <span>Thông tin hồ sơ</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Basic Info */}
          <div className="space-y-3">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {profile.name}
              </h3>
              <div className="flex items-center space-x-2">
                <Badge variant="outline">
                  {profile.gender === 'MALE' ? 'Nam' : 'Nữ'}
                </Badge>
                <span className="text-sm text-gray-600">
                  {getAge(profile.dateOfBirth)} tuổi
                </span>
                <Badge variant="secondary" className="text-xs">
                  {profile.relationship}
                </Badge>
              </div>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex items-center space-x-2 text-gray-600">
                <Calendar className="h-4 w-4" />
                <span>Sinh ngày: {formatDate(profile.dateOfBirth)}</span>
              </div>
              
              <div className="flex items-start space-x-2 text-gray-600">
                <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span>{profile.address}</span>
              </div>
              
              <div className="flex items-center space-x-2 text-gray-600">
                <Briefcase className="h-4 w-4" />
                <span>Nghề nghiệp: {profile.occupation}</span>
              </div>
            </div>
          </div>

          {/* Contact & Insurance Info */}
          <div className="space-y-3">
            {profile.emergencyContact && (
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Liên hệ khẩn cấp</h4>
                <div className="space-y-1 text-sm text-gray-600">
                  <div className="flex items-center space-x-2">
                    <User className="h-4 w-4" />
                    <span>{profile.emergencyContact.name}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Phone className="h-4 w-4" />
                    <span>{profile.emergencyContact.phone}</span>
                  </div>
                  <div className="text-gray-500">
                    Quan hệ: {profile.emergencyContact.relationship}
                  </div>
                </div>
              </div>
            )}

            {profile.healthInsurance && (
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Bảo hiểm y tế</h4>
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <CreditCard className="h-4 w-4" />
                  <span>{profile.healthInsurance}</span>
                </div>
              </div>
            )}

            <div className="text-xs text-gray-400 pt-2 border-t border-gray-100">
              Tạo ngày: {formatDate(profile.createdAt)}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
