'use client';

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  User, 
  FileText, 
  History, 
  Stethoscope,
  Eye,
  ExternalLink,
  Loader2
} from 'lucide-react';
import { PatientProfileCard } from '@/components/patient/PatientProfileCard';
import { medicalRecordService } from '@/lib/services/medical-record.service';
import { patientProfileService } from '@/lib/services/patient-profile.service';
import { MedicalRecord } from '@/lib/types/medical-record';
import { PatientProfile } from '@/lib/api';
import { toast } from 'sonner';

interface PatientHistoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patientProfileId: string;
  patientName?: string;
}

export function PatientHistoryDialog({
  open,
  onOpenChange,
  patientProfileId,
  patientName
}: PatientHistoryDialogProps) {
  const [patientProfile, setPatientProfile] = useState<PatientProfile | null>(null);
  const [medicalRecords, setMedicalRecords] = useState<MedicalRecord[]>([]);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [isLoadingRecords, setIsLoadingRecords] = useState(true);
  const [activeTab, setActiveTab] = useState('profile');

  useEffect(() => {
    if (open && patientProfileId) {
      loadPatientData();
    } else {
      // Reset state when dialog closes
      setPatientProfile(null);
      setMedicalRecords([]);
      setActiveTab('profile');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, patientProfileId]);

  const loadPatientData = async () => {
    setIsLoadingProfile(true);
    setIsLoadingRecords(true);

    try {
      // Load patient profile
      const profile = await patientProfileService.getById(patientProfileId);
      setPatientProfile(profile as unknown as PatientProfile);
    } catch (error) {
      console.error('Error loading patient profile:', error);
      toast.error('Không thể tải thông tin bệnh nhân');
    } finally {
      setIsLoadingProfile(false);
    }

    try {
      // Load medical records
      const records = await medicalRecordService.getByPatientProfile(patientProfileId);
      setMedicalRecords(records);
    } catch (error) {
      console.error('Error loading medical records:', error);
      toast.error('Không thể tải lịch sử bệnh án');
    } finally {
      setIsLoadingRecords(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-green-100 text-green-800';
      case 'DRAFT':
        return 'bg-yellow-100 text-yellow-800';
      case 'IN_PROGRESS':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'Hoàn thành';
      case 'DRAFT':
        return 'Nháp';
      case 'IN_PROGRESS':
        return 'Đang điều trị';
      default:
        return status;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <History className="h-5 w-5" />
            Lịch sử khám bệnh
            {patientName && (
              <span className="text-lg font-normal text-gray-600">
                - {patientName}
              </span>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="profile" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Thông tin bệnh nhân
              </TabsTrigger>
              <TabsTrigger value="records" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Bệnh án ({medicalRecords.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="profile" className="mt-4 space-y-4">
              {isLoadingProfile ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <span className="ml-2 text-gray-600">Đang tải thông tin bệnh nhân...</span>
                </div>
              ) : patientProfile ? (
                <PatientProfileCard 
                  patientProfileId={patientProfileId}
                  showActions={false}
                />
              ) : (
                <Card>
                  <CardContent className="py-12 text-center text-gray-500">
                    Không tìm thấy thông tin bệnh nhân
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="records" className="mt-4 space-y-4">
              {isLoadingRecords ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <span className="ml-2 text-gray-600">Đang tải lịch sử bệnh án...</span>
                </div>
              ) : medicalRecords.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <FileText className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                    <p className="text-gray-500">Chưa có bệnh án nào</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {medicalRecords.map((record) => (
                    <Card 
                      key={record.id} 
                      className="hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => {
                        window.open(`/medical-records/${record.id}`, '_blank');
                      }}
                    >
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="flex items-center gap-2 text-lg">
                              <Stethoscope className="h-5 w-5 text-primary" />
                              Bệnh án #{record.code || record.id.slice(0, 8)}
                            </CardTitle>
                            <div className="mt-2 flex items-center gap-2 flex-wrap">
                              <Badge className={getStatusColor(record.status)}>
                                {getStatusText(record.status)}
                              </Badge>
                              <span className="text-sm text-gray-500">
                                {formatDate(record.createdAt)}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                window.open(`/medical-records/${record.id}`, '_blank');
                              }}
                              className="flex items-center gap-1"
                            >
                              <Eye className="h-4 w-4" />
                              Xem chi tiết
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                window.open(`/medical-records/${record.id}/edit`, '_blank');
                              }}
                              className="flex items-center gap-1"
                            >
                              <ExternalLink className="h-4 w-4" />
                              Chỉnh sửa
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        {(record as unknown as { template?: { name?: string } }).template && (
                          <div className="text-sm text-gray-600 mb-2">
                            <span className="font-medium">Template:</span> {(record as unknown as { template: { name: string } }).template.name}
                          </div>
                        )}
                        {(record as unknown as { doctor?: { name?: string } }).doctor && (
                          <div className="text-sm text-gray-600">
                            <span className="font-medium">Bác sĩ:</span> {(record as unknown as { doctor: { name: string } }).doctor.name}
                          </div>
                        )}
                        {record.code && (
                          <div className="text-sm text-gray-600">
                            <span className="font-medium">Mã bệnh án:</span> {record.code}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Đóng
          </Button>
          {patientProfileId && (
            <Button
              onClick={() => {
                window.open(`/medical-records?patientProfileId=${patientProfileId}`, '_blank');
              }}
              className="flex items-center gap-2"
            >
              <ExternalLink className="h-4 w-4" />
              Xem đầy đủ
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

