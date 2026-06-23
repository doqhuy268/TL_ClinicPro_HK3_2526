'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import {
  Calendar,
  Clock,
  MapPin,
  User,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  AlertCircle,
  Stethoscope,
} from 'lucide-react';
import { WorkSession, WorkSessionStatusColors } from '@/lib/types/work-session';

interface WorkSessionDetailsProps {
  isOpen: boolean;
  onClose: () => void;
  workSession: WorkSession | null;
  onEdit?: (session: WorkSession) => void;
  onDelete?: (sessionId: string) => void;
  onStatusUpdate?: (sessionId: string, status: string) => void;
  loading?: boolean;
  canEdit?: boolean;
  canDelete?: boolean;
  canChangeStatus?: boolean;
  isAdmin?: boolean;
  isDoctor?: boolean;
}

export function WorkSessionDetails({
  isOpen,
  onClose,
  workSession,
  onEdit,
  onStatusUpdate,
  loading = false,
  canEdit = true,
  canDelete = true,
  canChangeStatus = false,
  isAdmin = false,
  isDoctor = false,
}: WorkSessionDetailsProps) {
  // Local state to ensure component updates when workSession prop changes
  const [currentSession, setCurrentSession] = useState(workSession);

  // Parse ISO string (UTC) → Date. Giữ Z để parse đúng UTC, rồi format sang giờ VN.
  const parseSessionDate = (value: string | Date) => {
    if (value instanceof Date) return value;
    return new Date(value);
  };

  // Update local state when workSession prop changes
  useEffect(() => {
    if (workSession) {
      setCurrentSession(workSession);
    }
  }, [workSession]);

  if (!currentSession) return null;

  const startTime = parseSessionDate(currentSession.startTime);
  const endTime = parseSessionDate(currentSession.endTime);
  const duration = (endTime.getTime() - startTime.getTime()) / (1000 * 60);
  const hours = Math.floor(duration / 60);
  const minutes = duration % 60;

  const statusColors = WorkSessionStatusColors[currentSession.status];
  const statusIcon = {
    PENDING: <AlertCircle className="h-4 w-4" />,
    APPROVED: <CheckCircle className="h-4 w-4" />,
    IN_PROGRESS: <Clock className="h-4 w-4" />,
    CANCELED: <XCircle className="h-4 w-4" />,
    COMPLETED: <CheckCircle className="h-4 w-4" />,
  };

  const formatDateTime = (date: Date) => {
    return date.toLocaleString('vi-VN', {
      timeZone: 'Asia/Ho_Chi_Minh',
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('vi-VN', {
      timeZone: 'Asia/Ho_Chi_Minh',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusText = (status: string) => {
    const statusMap = {
      PENDING: 'Chờ duyệt',
      APPROVED: 'Đã duyệt',
      IN_PROGRESS: 'Đang tiến hành',
      CANCELED: 'Đã hủy',
      COMPLETED: 'Hoàn thành',
    };
    return statusMap[status as keyof typeof statusMap] || status;
  };

  const canCancelSession =
    canDelete &&
    currentSession.status !== 'COMPLETED' &&
    currentSession.status !== 'CANCELED' &&
    (isAdmin || (isDoctor && currentSession.status === 'PENDING'));

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[45vw] max-h-[95vh] overflow-y-auto border-0 shadow-2xl bg-white">
        <DialogHeader className="pb-2.5 border-b bg-linear-to-r from-blue-50 to-purple-50 -m-6 p-4 mb-4">
          <DialogTitle className="flex items-center gap-3 text-xl">
            <div className="p-2 rounded-full bg-linear-to-r bg-primary text-white">
              <Calendar className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-bold text-gray-900">Chi tiết lịch làm việc</h2>
              <DialogDescription className="text-gray-600 mt-1">
                Thông tin chi tiết về ca làm việc đã đăng ký
              </DialogDescription>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Status */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {statusIcon[currentSession.status]}
              <span className="font-medium">Trạng thái:</span>
            </div>
            <Badge
              variant="outline"
              style={{
                backgroundColor: statusColors.backgroundColor,
                borderColor: statusColors.borderColor,
                color: statusColors.textColor,
              }}
            >
              {getStatusText(currentSession.status)}
            </Badge>
          </div>

          <Separator />

          {/* Date and Time Information */}
          <Card>
            <CardHeader className="pb-0.5">
              <CardTitle className="text-lg flex items-center gap-4">
                <Clock className="h-5 w-5" />
                Thời gian
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Bắt đầu
                  </p>
                  <p className="font-medium">{formatDateTime(startTime)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Kết thúc
                  </p>
                  <p className="font-medium">{formatDateTime(endTime)}</p>
                </div>
              </div>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="flex items-center gap-2 text-blue-700">
                  <Clock className="h-4 w-4" />
                  <span className="font-medium">Thời lượng:</span>
                  <span>{hours}h {minutes}m</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Booth Information */}
          {currentSession.booth && (
            <Card>
              <CardHeader className="pb-0.5">
                <CardTitle className="text-lg flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Vị trí làm việc
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div>
                    <p className="font-medium">{currentSession.booth.name}</p>
                    <p className="text-sm text-muted-foreground">
                      Mã phòng: {currentSession.booth.boothCode}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">
                      Phòng: {currentSession.booth.room.roomName}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Chuyên khoa: {currentSession.booth.room.specialty.name}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Staff Information */}
          <Card>
            <CardHeader className="pb-0.5">
              <CardTitle className="text-lg flex items-center gap-2">
                <User className="h-5 w-5" />
                Nhân viên
              </CardTitle>
            </CardHeader>
            <CardContent>
              {currentSession.doctor && (
                <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                  <Stethoscope className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="font-medium">{currentSession.doctor.auth.name}</p>
                    <p className="text-sm text-muted-foreground">
                      Bác sĩ • Mã: {currentSession.doctor.doctorCode}
                    </p>
                  </div>
                </div>
              )}
              
              {currentSession.technician && (
                <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                  <User className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="font-medium">{currentSession.technician.auth.name}</p>
                    <p className="text-sm text-muted-foreground">
                      Kỹ thuật viên • Mã: {currentSession.technician.technicianCode}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Services */}
          <Card>
            <CardHeader className="pb-0.5">
              <CardTitle className="text-lg">
                Dịch vụ thực hiện ({currentSession.services.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {currentSession.services.map((serviceItem, index) => (
                  <div
                    key={serviceItem.service?.id || `service-${index}`}
                    className="p-3 border rounded-lg hover:bg-muted/50"
                  >
                    <p className="font-medium">{serviceItem.service?.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {serviceItem.service?.serviceCode}
                    </p>
                    {serviceItem.service?.description && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {serviceItem.service?.description}
                      </p>
                    )}
                    {serviceItem.service?.timePerPatient && (
                      <Badge variant="outline" className="text-xs mt-2">
                        {serviceItem.service?.timePerPatient} phút/bệnh nhân
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Timestamps */}
          <div className="text-xs text-muted-foreground space-y-1">
            <p>
              Tạo lúc: {new Date(currentSession.createdAt).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })}
            </p>
            <p>
              Cập nhật: {new Date(currentSession.updatedAt).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })}
            </p>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          {/* Status Change Buttons (for admin) */}
          {canChangeStatus && currentSession.status === 'PENDING' && (
            <div className="flex gap-2 w-full sm:w-auto">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onStatusUpdate?.(currentSession.id, 'APPROVED')}
                disabled={loading}
                className="flex-1 sm:flex-none"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Duyệt
              </Button>
              {/* <Button
                variant="outline"
                size="sm"
                onClick={() => onStatusUpdate?.(currentSession.id, 'CANCELED')}
                disabled={loading}
                className="flex-1 sm:flex-none"
              >
                <XCircle className="h-4 w-4 mr-2" />
                Hủy
              </Button> */}
            </div>
          )}

          <div className="flex gap-2 w-full sm:w-auto">
            {canEdit && (
              <Button
                variant="outline"
                onClick={() => onEdit?.(currentSession)}
                disabled={loading}
                className="flex-1 sm:flex-none"
              >
                <Edit className="h-4 w-4 mr-2" />
                Sửa
              </Button>
            )}
            
            {canCancelSession && (
              <Button
                variant="destructive"
                onClick={() => onStatusUpdate?.(currentSession.id, 'CANCELED')}
                disabled={loading}
                className="flex-1 sm:flex-none disabled:opacity-60"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Hủy lịch
              </Button>
            )}
            
            <Button onClick={onClose} className="flex-1 sm:flex-none">
              Đóng
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
