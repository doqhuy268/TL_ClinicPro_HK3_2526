'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import { FileText, Calendar, User, AlertCircle, Stethoscope, Download, Eye, Star, ChevronLeft } from 'lucide-react';

import { useMedicalRecords } from '@/lib/hooks/useMedicalRecords';
import { usePatientProfiles } from '@/lib/hooks/usePatientProfiles';
import { PatientProfileInfo } from '@/components/patient/PatientProfileInfo';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { doctorRatingService, type DoctorRating, type DoctorRatingStats } from '@/lib/services/doctor-rating.service';
import type { MedicalRecord } from '@/lib/types/medical-record';

type MedicalRecordWithDoctor = MedicalRecord & {
  doctor?: {
    id?: string;
    doctorId?: string;
    authId?: string;
    doctorCode?: string;
    description?: string;
  };
};

interface RatingDialogState {
  open: boolean;
  doctorId?: string;
  medicalRecordId?: string;
  existingRating?: DoctorRating | null;
}

const INITIAL_RATING_FORM = {
  rating: 5,
  comment: '',
};

export default function PatientProfileMedicalRecordsPage() {
  const params = useParams();
  const patientProfileId = params.id as string;
  
  const { patientProfiles } = usePatientProfiles();
  const { medicalRecords, isLoading, error, refresh } = useMedicalRecords({ 
    patientProfileId
  });
  
  // Ensure medicalRecords is always an array
  const safeMedicalRecords = useMemo<MedicalRecordWithDoctor[]>(() => {
    return Array.isArray(medicalRecords) ? (medicalRecords as MedicalRecordWithDoctor[]) : [];
  }, [medicalRecords]);
  
  const currentProfile = patientProfiles.find(p => p.id === patientProfileId);

  const [patientRatings, setPatientRatings] = useState<Record<string, DoctorRating>>({});
  const [doctorStats, setDoctorStats] = useState<Record<string, DoctorRatingStats>>({});
  const [isLoadingPatientRatings, setIsLoadingPatientRatings] = useState(false);
  const [ratingDialog, setRatingDialog] = useState<RatingDialogState>({ open: false });
  const [ratingForm, setRatingForm] = useState(INITIAL_RATING_FORM);
  const [isSavingRating, setIsSavingRating] = useState(false);

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
      case 'COMPLETED':
        return <Badge className="bg-green-100 text-green-800 border-green-200">Hoàn thành</Badge>;
      case 'IN_PROGRESS':
        return <Badge variant="secondary">Đang xử lý</Badge>;
      case 'PENDING':
        return <Badge variant="outline">Chờ xử lý</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getDoctorIdFromRecord = useCallback((record: MedicalRecordWithDoctor) => {
    return record.doctorId || record.doctor?.id || record.doctor?.doctorId || record.doctor?.authId || null;
  }, []);

  const loadPatientRatings = useCallback(async () => {
    try {
      setIsLoadingPatientRatings(true);
      const result = await doctorRatingService.getPatientRatings(1, 200);
      const ratingsArray: DoctorRating[] = Array.isArray(result)
        ? result
        : Array.isArray(result.data)
        ? result.data
        : [];
      const ratingsMap: Record<string, DoctorRating> = {};
      ratingsArray.forEach((rating) => {
        if (rating.medicalRecordId) {
          ratingsMap[rating.medicalRecordId] = rating;
        }
      });
      setPatientRatings(ratingsMap);
    } catch (err) {
      console.error('Error loading patient ratings:', err);
    } finally {
      setIsLoadingPatientRatings(false);
    }
  }, []);

  const loadDoctorStats = useCallback(async (doctorIds: string[]) => {
    const uniqueIds = Array.from(new Set(doctorIds.filter((id): id is string => Boolean(id))));
    if (uniqueIds.length === 0) return;
    try {
      const statsEntries = await Promise.all(
        uniqueIds.map(async (id) => {
          try {
            const stats = await doctorRatingService.getDoctorStats(id);
            return [id, stats] as const;
          } catch (err) {
            console.error('Error loading stats for doctor:', id, err);
            return null;
          }
        })
      );
      setDoctorStats((prev) => {
        const updated = { ...prev };
        statsEntries.forEach((entry) => {
          if (entry) {
            updated[entry[0]] = entry[1];
          }
        });
        return updated;
      });
    } catch (err) {
      console.error('Error loading doctor stats:', err);
    }
  }, []);

  useEffect(() => {
    loadPatientRatings();
  }, [loadPatientRatings]);

  useEffect(() => {
    const doctors = safeMedicalRecords
      .map((record) => getDoctorIdFromRecord(record))
      .filter((id): id is string => Boolean(id));
    if (doctors.length) {
      loadDoctorStats(doctors);
    }
  }, [safeMedicalRecords, getDoctorIdFromRecord, loadDoctorStats]);

  const openRatingDialog = (record: MedicalRecordWithDoctor) => {
    const doctorId = getDoctorIdFromRecord(record);
    if (!doctorId) {
      toast.error('Không tìm thấy thông tin bác sĩ để đánh giá');
      return;
    }
    const existingRating = patientRatings[record.id];
    setRatingDialog({
      open: true,
      doctorId,
      medicalRecordId: record.id,
      existingRating,
    });
    setRatingForm({
      rating: existingRating?.rating || 5,
      comment: existingRating?.comment || '',
    });
  };

  const closeRatingDialog = () => {
    setRatingDialog({ open: false });
    setRatingForm(INITIAL_RATING_FORM);
  };

  const refreshDoctorStats = useCallback(
    async (doctorId: string) => {
      await loadDoctorStats([doctorId]);
    },
    [loadDoctorStats]
  );

  const handleSubmitRating = async () => {
    if (!ratingDialog.doctorId || !ratingDialog.medicalRecordId) return;
    if (ratingForm.rating < 1) {
      toast.error('Vui lòng chọn số sao đánh giá');
      return;
    }
    setIsSavingRating(true);
    try {
      let updatedRating: DoctorRating;
      if (ratingDialog.existingRating) {
        updatedRating = await doctorRatingService.updateRating(ratingDialog.existingRating.id, {
          rating: ratingForm.rating,
          comment: ratingForm.comment,
        });
        toast.success('Cập nhật đánh giá thành công');
      } else {
        updatedRating = await doctorRatingService.createRating({
          doctorId: ratingDialog.doctorId,
          medicalRecordId: ratingDialog.medicalRecordId,
          rating: ratingForm.rating,
          comment: ratingForm.comment,
        });
        toast.success('Gửi đánh giá thành công');
      }
      setPatientRatings((prev) => ({
        ...prev,
        [ratingDialog.medicalRecordId as string]: updatedRating,
      }));
      await refreshDoctorStats(ratingDialog.doctorId);
      closeRatingDialog();
    } catch (err) {
      console.error('Error submitting rating:', err);
      const message = err instanceof Error ? err.message : 'Không thể gửi đánh giá. Vui lòng thử lại.';
      toast.error(message);
    } finally {
      setIsSavingRating(false);
    }
  };

  const RatingStars = ({
    value,
    onSelect,
    size = 18,
  }: {
    value: number;
    onSelect?: (value: number) => void;
    size?: number;
  }) => (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((starValue) => {
        const filled = value >= starValue;
        const interactive = Boolean(onSelect);
        return (
          <button
            key={starValue}
            type="button"
            className={`p-0.5 ${interactive ? 'hover:scale-105 transition-transform' : 'cursor-default'}`}
            onClick={() => onSelect?.(starValue)}
            disabled={!interactive}
          >
            <Star
              className={filled ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}
              style={{ width: size, height: size }}
            />
          </button>
        );
      })}
    </div>
  );

  const renderRatingSummary = (record: MedicalRecordWithDoctor) => {
    const doctorId = getDoctorIdFromRecord(record);
    if (!doctorId) {
      return null;
    }
    const stats = doctorStats[doctorId];
    const existingRating = patientRatings[record.id];

    return (
      <div className="mt-4 rounded-lg border border-gray-100 bg-gray-50 p-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-gray-900">Đánh giá bác sĩ</p>
            {stats ? (
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <RatingStars value={stats.averageRating || 0} />
                <span className="font-semibold">{(stats.averageRating ?? 0).toFixed(1)} / 5</span>
                <span className="text-xs text-gray-500">({stats.totalRatings || 0} đánh giá)</span>
              </div>
            ) : (
              <span className="text-xs text-gray-500">Chưa có đánh giá</span>
            )}
            {existingRating && (
              <p className="mt-1 text-xs text-gray-500">
                Bạn đã đánh giá: <strong>{existingRating.rating}/5</strong>
              </p>
            )}
          </div>
          <Button
            size="sm"
            variant={existingRating ? 'secondary' : 'default'}
            onClick={() => openRatingDialog(record)}
            disabled={isLoadingPatientRatings}
          >
            {existingRating ? 'Chỉnh sửa đánh giá' : 'Đánh giá bác sĩ'}
          </Button>
        </div>
      </div>
    );
  };

  if (isLoading) {
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
                onClick={refresh}
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
    <>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center space-x-4 mb-4">
            <Button asChild variant="outline" size="sm">
              <Link href="/my-patient-profiles">
                <ChevronLeft className="h-4 w-4" />
              </Link>
            </Button>
          </div>
          
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Bệnh án - {currentProfile?.name || 'Hồ sơ bệnh nhân'}
            </h1>
            <p className="text-gray-600">
              Lịch sử khám bệnh và điều trị của hồ sơ này
            </p>
          </div>
        </div>

        {/* Patient Profile Info */}
        {currentProfile && <PatientProfileInfo profile={currentProfile} />}

        {/* Content */}
        {safeMedicalRecords.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Stethoscope className="h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Chưa có bệnh án
              </h3>
              <p className="text-gray-600 text-center">
                Hồ sơ này chưa có bệnh án nào. Bệnh án sẽ xuất hiện sau khi khám bệnh.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {safeMedicalRecords.map((record) => (
              <Card key={record.id} className="hover:shadow-lg transition-shadow duration-200">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg flex items-center space-x-2">
                        <FileText className="h-5 w-5" />
                        <span>Bệnh án #{record.id.slice(-8)}</span>
                      </CardTitle>
                      <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                        <div className="flex items-center space-x-1">
                          <User className="h-4 w-4" />
                          <span>BS. {(record.doctor as unknown as { doctorCode?: string; description?: string })?.doctorCode || 'Chưa xác định'} - {(record.doctor as unknown as { doctorCode?: string; description?: string })?.description || ''}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Calendar className="h-4 w-4" />
                          <span>{formatDate(record.createdAt)}</span>
                        </div>
                      </div>
                    </div>
                    {getStatusBadge(record.status)}
                  </div>
                </CardHeader>

                <CardContent>
                  {/* Diagnosis */}
                  {record.diagnosis && (
                    <div className="mb-4 p-3 bg-red-50 rounded-lg">
                      <h4 className="font-medium text-red-900 mb-1">Chẩn đoán:</h4>
                      <p className="text-red-800">{record.diagnosis}</p>
                    </div>
                  )}

                  {/* Symptoms */}
                  {record.symptoms && (
                    <div className="mb-4 p-3 bg-yellow-50 rounded-lg">
                      <h4 className="font-medium text-yellow-900 mb-1">Triệu chứng:</h4>
                      <p className="text-yellow-800">{record.symptoms}</p>
                    </div>
                  )}

                  {/* Treatment */}
                  {record.treatment && (
                    <div className="mb-4 p-3 bg-green-50 rounded-lg">
                      <h4 className="font-medium text-green-900 mb-1">Điều trị:</h4>
                      <p className="text-green-800">{record.treatment}</p>
                    </div>
                  )}

                  {/* Notes */}
                  {record.notes && (
                    <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                      <h4 className="font-medium text-blue-900 mb-1">Ghi chú:</h4>
                      <p className="text-blue-800">{record.notes}</p>
                    </div>
                  )}

                  {/* Attachments */}
                  {record.attachments && record.attachments.length > 0 && (
                    <div className="mb-4">
                      <h4 className="font-medium text-gray-900 mb-2">Tệp đính kèm:</h4>
                      <div className="space-y-2">
                        {record.attachments.map((attachment, index) => (
                          <div key={index} className="flex items-center justify-between p-2 border border-gray-200 rounded-lg">
                            <div className="flex items-center space-x-2">
                              <FileText className="h-4 w-4 text-gray-500" />
                              <span className="text-sm text-gray-700">{(attachment as unknown as { name: string }).name}</span>
                            </div>
                            <Button variant="outline" size="sm">
                              <Download className="h-4 w-4 mr-2" />
                              Tải xuống
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Prescriptions Link */}
                  {Array.isArray(record.prescriptions) && record.prescriptions.length > 0 && (
                    <div className="mb-4">
                      <h4 className="font-medium text-gray-900 mb-2">Đơn thuốc:</h4>
                      <div className="space-y-2">
                        {record.prescriptions.map((prescription: { code: string; status: string }, index: number) => (
                          <div key={index} className="flex items-center justify-between p-2 border border-gray-200 rounded-lg">
                            <div className="flex items-center space-x-2">
                              <FileText className="h-4 w-4 text-gray-500" />
                              <span className="text-sm text-gray-700">
                                Đơn thuốc #{prescription.code}
                              </span>
                            </div>
                            <Badge variant="outline">{prescription.status}</Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex space-x-2 pt-4 border-t border-gray-100">
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/medical-records/${record.id}`}>
                        <Eye className="h-4 w-4 mr-2" />
                        Xem chi tiết
                      </Link>
                    </Button>
                  </div>

                {renderRatingSummary(record)}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
        </div>
      </div>

      <Dialog open={ratingDialog.open} onOpenChange={(open) => (!open ? closeRatingDialog() : null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Đánh giá bác sĩ</DialogTitle>
            <DialogDescription>Chia sẻ trải nghiệm của bạn để giúp chúng tôi cải thiện dịch vụ.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex flex-col items-center gap-2">
              <RatingStars value={ratingForm.rating} onSelect={(value) => setRatingForm((prev) => ({ ...prev, rating: value }))} size={28} />
              <span className="text-sm text-gray-600">{ratingForm.rating} / 5</span>
            </div>
            <div className="space-y-2">
              <Label htmlFor="ratingComment">Nhận xét</Label>
              <Textarea
                id="ratingComment"
                placeholder="Bạn có thể mô tả chi tiết trải nghiệm của mình..."
                value={ratingForm.comment}
                onChange={(e) => setRatingForm((prev) => ({ ...prev, comment: e.target.value }))}
                rows={4}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={closeRatingDialog}>
                Hủy
              </Button>
              <Button onClick={handleSubmitRating} disabled={isSavingRating || ratingForm.rating < 1}>
                {isSavingRating ? 'Đang gửi...' : ratingDialog.existingRating ? 'Cập nhật đánh giá' : 'Gửi đánh giá'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
