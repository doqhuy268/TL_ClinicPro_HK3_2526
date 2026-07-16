'use client';

import { useParams } from 'next/navigation';
import { usePrescriptionsByProfile } from '@/lib/hooks/usePrescriptionsByProfile';
import { usePatientProfiles } from '@/lib/hooks/usePatientProfiles';
import { PatientProfileInfo } from '@/components/patient/PatientProfileInfo';
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  ChevronLeft, 
  FileText, 
  Calendar, 
  User, 
  AlertCircle,
  Pill,
  Clock,
  CheckCircle,
  XCircle
} from 'lucide-react';
import Link from 'next/link';
import { medicationPrescriptionApi } from '@/lib/api';
import { toast } from 'sonner';
import { MedicationPrescription } from '@/lib/hooks/usePrescriptionsByProfile';

export default function PatientProfilePrescriptionsPage() {
  const params = useParams();
  const patientProfileId = params.id as string;
  
  const { patientProfiles } = usePatientProfiles();
  const { prescriptions, loading, error, refetch } = usePrescriptionsByProfile(patientProfileId);
  const [feedbackOpenId, setFeedbackOpenId] = useState<string | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [feedbackUrgent, setFeedbackUrgent] = useState(false);
  const [submittingFeedback, setSubmittingFeedback] = useState(false);
  
  // Ensure prescriptions is always an array
  const safePrescriptions = Array.isArray(prescriptions) ? prescriptions : [];
  
  const currentProfile = patientProfiles.find(p => p.id === patientProfileId);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'SIGNED':
        return <Badge className="bg-green-100 text-green-800 border-green-200"><CheckCircle className="h-3 w-3 mr-1" />Đã ký</Badge>;
      case 'DRAFT':
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Nháp</Badge>;
      case 'CANCELLED':
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Đã hủy</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const handleOpenFeedback = (id: string, existingMessage?: string | null, existingUrgent?: boolean | null) => {
    setFeedbackOpenId(id);
    setFeedbackMessage(existingMessage || '');
    setFeedbackUrgent(Boolean(existingUrgent));
  };

  const handleSubmitFeedback = async () => {
    if (!feedbackOpenId) return;
    if (!feedbackMessage.trim()) {
      toast.error('Vui lòng nhập nội dung phản hồi');
      return;
    }
    try {
      setSubmittingFeedback(true);
      await medicationPrescriptionApi.sendFeedback(feedbackOpenId, {
        message: feedbackMessage.trim(),
        isUrgent: feedbackUrgent,
      });
      toast.success('Đã gửi phản hồi');
      setFeedbackOpenId(null);
      setFeedbackMessage('');
      setFeedbackUrgent(false);
      refetch?.();
    } catch (err) {
      console.error('Error sending feedback', err);
      toast.error('Không thể gửi phản hồi');
    } finally {
      setSubmittingFeedback(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-64" />
          </div>
          
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <Skeleton className="h-6 w-32" />
                    <Skeleton className="h-6 w-16" />
                  </div>
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {error}
              <Button 
                variant="outline" 
                size="sm" 
                className="ml-2"
                onClick={refetch}
              >
                Thử lại
              </Button>
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center space-x-4 mb-4">
            <Button asChild variant="outline" size="sm">
              <Link href="/my-patient-profiles">
                <ChevronLeft className="h-4 w-4 " />
              </Link>
            </Button>
          </div>
          
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Đơn thuốc - {currentProfile?.name || 'Hồ sơ bệnh nhân'}
            </h1>
            <p className="text-gray-600">
              Danh sách các đơn thuốc đã được kê cho hồ sơ này
            </p>
          </div>
        </div>

        {/* Patient Profile Info */}
        {currentProfile && <PatientProfileInfo profile={currentProfile} />}

        {/* Content */}
        {safePrescriptions.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Pill className="h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Chưa có đơn thuốc
              </h3>
              <p className="text-gray-600 text-center">
                Hồ sơ này chưa có đơn thuốc nào. Đơn thuốc sẽ xuất hiện sau khi bác sĩ kê thuốc.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {safePrescriptions.map((prescription) => (
              <Card key={prescription.id} className="hover:shadow-lg transition-shadow duration-200">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg flex items-center space-x-2">
                        <FileText className="h-5 w-5" />
                        <span>Đơn thuốc #{prescription.code}</span>
                      </CardTitle>
                      <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                        <div className="flex items-center space-x-1">
                          <User className="h-4 w-4 mr-2" />
                          <span>BS. {prescription.doctor.doctorCode} - {prescription.doctor.description}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Calendar className="h-4 w-4 mr-2" />
                          <span>{formatDate(prescription.createdAt)}</span>
                        </div>
                      </div>
                    </div>
                    {getStatusBadge(prescription.status)}
                  </div>
                </CardHeader>

                <CardContent>
                  {prescription.note && (
                    <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                      <p className="text-sm text-blue-800">
                        <strong>Ghi chú:</strong> {prescription.note}
                      </p>
                    </div>
                  )}

                  {/* Prescription Items */}
                  <div className="space-y-3">
                    <h4 className="font-medium text-gray-900">Danh sách thuốc:</h4>
                    <div className="space-y-2">
                      {prescription.items.map((item, index) => (
                        <div key={item.id || index} className="border border-gray-200 rounded-lg p-3">
                          <div className="flex justify-between items-start mb-2">
                            <h5 className="font-medium text-gray-900">{item.name}</h5>
                            {item.ndc && (
                              <Badge variant="outline" className="text-xs">
                                NDC: {item.ndc}
                              </Badge>
                            )}
                          </div>
                          
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm text-gray-600">
                            {item.strength && (
                              <div>
                                <span className="font-medium">Nồng độ:</span> {item.strength}
                              </div>
                            )}
                            {item.dosageForm && (
                              <div>
                                <span className="font-medium">Dạng:</span> {item.dosageForm}
                              </div>
                            )}
                            {item.dose && item.doseUnit && (
                              <div>
                                <span className="font-medium">Liều:</span> {item.dose} {item.doseUnit}
                              </div>
                            )}
                            {item.frequency && (
                              <div>
                                <span className="font-medium">Tần suất:</span> {item.frequency}
                              </div>
                            )}
                            {item.durationDays && (
                              <div>
                                <span className="font-medium">Thời gian:</span> {item.durationDays} ngày
                              </div>
                            )}
                            {item.quantity && item.quantityUnit && (
                              <div>
                                <span className="font-medium">Số lượng:</span> {item.quantity} {item.quantityUnit}
                              </div>
                            )}
                            {item.route && (
                              <div>
                                <span className="font-medium">Đường dùng:</span> {item.route}
                              </div>
                            )}
                          </div>
                          
                          {item.instructions && (
                            <div className="mt-2 p-2 bg-yellow-50 rounded text-sm">
                              <span className="font-medium text-yellow-800">Hướng dẫn:</span>
                              <p className="text-yellow-700 mt-1">{item.instructions}</p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Feedback action */}
                  <div className="mt-4 flex justify-end">
                    <Dialog open={feedbackOpenId === prescription.id} onOpenChange={(open) => {
                      if (!open) {
                        setFeedbackOpenId(null);
                        return;
                      }
                      const p = prescription as MedicationPrescription & { feedbackMessage?: string | null; feedbackIsUrgent?: boolean | null };
                      handleOpenFeedback(p.id, p.feedbackMessage, p.feedbackIsUrgent ?? undefined);
                    }}>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          Phản hồi đơn thuốc
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-md">
                        <DialogHeader>
                          <DialogTitle>Phản hồi đơn thuốc #{prescription.code}</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          {/* Hiển thị feedback đã gửi (nếu có) */}
                          {prescription.feedbackMessage && (
                            <div className="bg-gray-50 p-3 rounded-lg border">
                              <div className="flex items-center justify-between mb-2">
                                <div className="text-sm font-medium text-gray-900">Phản hồi của bạn:</div>
                                {prescription.feedbackIsUrgent && (
                                  <Badge variant="destructive" className="text-xs">Khẩn cấp</Badge>
                                )}
                              </div>
                              <div className="text-sm text-gray-700 leading-relaxed">{prescription.feedbackMessage}</div>
                              {prescription.feedbackAt && (
                                <div className="text-xs text-gray-500 mt-2">
                                  {formatDate(prescription.feedbackAt)}
                                </div>
                              )}
                            </div>
                          )}

                          {/* Hiển thị phản hồi của bác sĩ (nếu có) */}
                          {prescription.feedbackResponseNote && (
                            <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                              <div className="text-sm font-medium text-blue-900 mb-1">Phản hồi từ bác sĩ:</div>
                              <div className="text-sm text-blue-800 leading-relaxed">{prescription.feedbackResponseNote}</div>
                              {prescription.feedbackResponseAt && (
                                <div className="text-xs text-blue-600 mt-2">
                                  {formatDate(prescription.feedbackResponseAt)}
                                </div>
                              )}
                              {prescription.feedbackProcessed && (
                                <Badge variant="outline" className="mt-2 text-xs bg-green-50 text-green-700 border-green-200">
                                  Đã xử lý
                                </Badge>
                              )}
                            </div>
                          )}

                          {/* Form gửi feedback mới hoặc chỉnh sửa (nếu chưa có feedback hoặc chưa được xử lý) */}
                          {(!prescription.feedbackMessage || !prescription.feedbackProcessed) && (
                            <>
                              <div className="space-y-2">
                                <label className="text-sm font-medium">Nội dung</label>
                                <Textarea
                                  className="mt-2 min-h-[100px]"
                                  value={feedbackMessage}
                                  onChange={(e) => setFeedbackMessage(e.target.value)}
                                  rows={4}
                                  placeholder="Nhập phản hồi cho bác sĩ..."
                                  disabled={!!prescription.feedbackMessage && prescription.feedbackProcessed}
                                />
                              </div>
                              <label className="flex items-center gap-2 text-sm">
                                <Checkbox
                                  checked={feedbackUrgent}
                                  onCheckedChange={(checked) => setFeedbackUrgent(Boolean(checked))}
                                  disabled={!!prescription.feedbackMessage && prescription.feedbackProcessed}
                                />
                                <span>Đánh dấu khẩn cấp</span>
                              </label>
                            </>
                          )}

                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              onClick={() => setFeedbackOpenId(null)}
                              disabled={submittingFeedback}
                            >
                              Đóng
                            </Button>
                            {(!prescription.feedbackMessage || !prescription.feedbackProcessed) && (
                              <Button onClick={handleSubmitFeedback} disabled={submittingFeedback}>
                                {submittingFeedback ? 'Đang gửi...' : prescription.feedbackMessage ? 'Cập nhật phản hồi' : 'Gửi phản hồi'}
                              </Button>
                            )}
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
