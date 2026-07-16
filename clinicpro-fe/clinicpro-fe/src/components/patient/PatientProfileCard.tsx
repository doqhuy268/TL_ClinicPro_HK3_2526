'use client';

import { useEffect, useState } from 'react';
import QRCode from 'react-qr-code';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { patientProfileApi, PatientProfile } from '@/lib/api';
import { Calendar, FileText, User, MapPin, Phone, CreditCard, Pencil } from 'lucide-react';
import Link from 'next/link';

interface PatientProfileCardProps {
  profile?: PatientProfile;
  patientProfileId?: string;
  showActions?: boolean;
}

export function PatientProfileCard({ profile: profileProp, patientProfileId, showActions = true }: PatientProfileCardProps) {
  const [profile, setProfile] = useState<PatientProfile | undefined>(profileProp);

  useEffect(() => {
    setProfile(profileProp);
  }, [profileProp]);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!patientProfileId) return;
      try {
        const res = await patientProfileApi.getById(patientProfileId);
        setProfile(res.data);
      } catch {
        // silently fail; UI will show fallbacks
      }
    };
    if (!profileProp && patientProfileId) {
      fetchProfile();
    }
  }, [patientProfileId, profileProp]);
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

  if (!profile) {
    return null;
  }

  const safeName = profile.name ?? '—';
  const safeGender = (profile.gender || '').toString().toLowerCase();
  const isMale = safeGender === 'male' || safeGender === 'nam' || safeGender === 'm';
  const dob = profile.dateOfBirth ? formatDate(profile.dateOfBirth) : '—';
  const ageText = profile.dateOfBirth ? `${getAge(profile.dateOfBirth)} tuổi` : '—';
  const address = profile.address ?? '—';
  const occupation = profile.occupation ?? '—';
  const relationship = profile.relationship ?? '—';
  const emergency = profile.emergencyContact;
  const healthInsurance = profile.healthInsurance;
  const codeDescriptors = [
    { label: 'Mã hồ sơ', value: profile.profileCode },
    { label: 'Mã bệnh nhân', value: profile.patient?.patientCode || profile.patientCode },
  ].filter((item): item is { label: string; value: string } => Boolean(item.value && item.value.trim()));
  const qrValue = codeDescriptors.map((item) => item.value.trim()).join('|');
  const hasQr = Boolean(qrValue);

  return (
    <Card className="w-full hover:shadow-lg transition-shadow duration-200 h-full flex flex-col">
      <CardHeader className="pb-3 flex-shrink-0">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center space-x-3 min-w-0 flex-1">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
              <User className="h-6 w-6 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <CardTitle className="text-lg font-semibold text-gray-900 truncate">
                {safeName}
              </CardTitle>
              <div className="flex items-center space-x-2 mt-1">
                <Badge variant="outline" className="text-xs flex-shrink-0">
                  {isMale ? 'Nam' : 'Nữ'}
                </Badge>
                <span className="text-sm text-gray-500 truncate">
                  {ageText}
                </span>
              </div>
            </div>
          </div>
          <Badge variant="secondary" className="text-xs flex-shrink-0">
            {relationship}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-3 flex-1 flex flex-col">
        {hasQr && (
          <div className="flex items-center justify-between gap-3 p-3 border border-dashed border-primary/30 rounded-lg bg-primary/5">
            <div className="min-w-0 space-y-1">
              <p className="text-[11px] uppercase tracking-wide text-gray-500 font-medium">Định danh hồ sơ</p>
              {codeDescriptors.map(({ label, value }) => (
                <p key={`${label}-${value}`} className="text-sm font-semibold text-gray-900 truncate">
                  <span className="text-xs font-medium text-gray-600 uppercase tracking-wide mr-1">{label}:</span>
                  {value}
                </p>
              ))}
            </div>
            <div className="bg-white p-2 rounded-md border border-gray-200 flex-shrink-0">
              <QRCode value={qrValue} size={64} style={{ width: '64px', height: '64px' }} />
            </div>
          </div>
        )}

        {/* Basic Info */}
        <div className="space-y-2 flex-1">
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Calendar className="h-4 w-4 flex-shrink-0" />
            <span className="truncate">Sinh ngày: {dob}</span>
          </div>
          
          <div className="flex items-start space-x-2 text-sm text-gray-600">
            <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <span className="line-clamp-2">{address}</span>
          </div>
          
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <User className="h-4 w-4 flex-shrink-0" />
            <span className="truncate">Nghề nghiệp: {occupation}</span>
          </div>
          
          {emergency && (
            <div className="flex items-start space-x-2 text-sm text-gray-600">
              <Phone className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span className="line-clamp-2">
                Liên hệ khẩn cấp: {emergency.name || '—'} 
                ({emergency.relationship || '—'}) - {emergency.phone || '—'}
              </span>
            </div>
          )}
          
          {healthInsurance && (
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <CreditCard className="h-4 w-4 flex-shrink-0" />
              <span className="truncate">BHYT: {healthInsurance}</span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        {showActions && (
          <div className="pt-3 border-t border-gray-100 flex-shrink-0">
            {/* Desktop: 3 buttons in a row */}
            <div className="hidden sm:flex space-x-2">
              <Button asChild variant="outline" size="sm" className="flex-1 min-w-0">
                <Link href={`/patient-profiles/${profile.id}/medical-records`}>
                  <FileText className="h-4 w-4 mr-1 sm:mr-2" />
                  <span className=" xs:inline">Bệnh án</span>
                </Link>
              </Button>
              <Button asChild size="sm" className="flex-1 min-w-0">
                <Link href={`/patient-profiles/${profile.id}/prescriptions`}>
                  <FileText className="h-4 w-4 mr-1 sm:mr-2" />
                  <span className="xs:inline ">Đơn thuốc</span>
                </Link>
              </Button>
              <Button asChild variant="secondary" size="sm" className="flex-1 min-w-0">
                <Link href={`/patient-profiles/${profile.id}/edit`}>
                  <Pencil className="h-4 w-4 mr-1 sm:mr-2" />
                  <span className=" xs:inline">Sửa hồ sơ</span>
                </Link>
              </Button>
            </div>
            
            {/* Mobile: Stacked buttons */}
            <div className="flex flex-col space-y-2 sm:hidden">
              <Button asChild variant="outline" size="sm" className="w-full">
                <Link href={`/patient-profiles/${profile.id}/medical-records`}>
                  <FileText className="h-4 w-4 mr-2" />
                  Bệnh án
                </Link>
              </Button>
              <Button asChild size="sm" className="w-full">
                <Link href={`/patient-profiles/${profile.id}/prescriptions`}>
                  <FileText className="h-4 w-4 mr-2" />
                  Đơn thuốc
                </Link>
              </Button>
              <Button asChild variant="secondary" size="sm" className="w-full">
                <Link href={`/patient-profiles/${profile.id}/edit`}>
                  <Pencil className="h-4 w-4 mr-2" />
                  Sửa hồ sơ
                </Link>
              </Button>
            </div>
          </div>
        )}

        {/* Created Date */}
        <div className="text-xs text-gray-400 pt-2 border-t border-gray-50 flex-shrink-0">
          Tạo ngày: {profile.createdAt ? formatDate(profile.createdAt) : '—'}
        </div>
      </CardContent>
    </Card>
  );
}