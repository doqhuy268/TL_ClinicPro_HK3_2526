'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { medicationPrescriptionApi } from '@/lib/api';
import { MedicationPrescription, MedicationPrescriptionStatus } from '@/lib/types/medication-prescription';
import { CalendarDays, FileText, Search, Eye, RefreshCw, Edit, Trash2, Printer, MessageSquare } from 'lucide-react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { toast } from 'sonner';

interface MedicationPrescriptionListProps {
  isDoctor?: boolean;
  patientProfileId?: string;
}

export function MedicationPrescriptionList({ isDoctor = false }: MedicationPrescriptionListProps) {
  const [prescriptions, setPrescriptions] = useState<MedicationPrescription[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [feedbackOpenId, setFeedbackOpenId] = useState<string | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [feedbackUrgent, setFeedbackUrgent] = useState(false);
  const [submittingFeedback, setSubmittingFeedback] = useState(false);
  // Doctor: view and respond to feedback
  const [viewFeedbackOpenId, setViewFeedbackOpenId] = useState<string | null>(null);
  const [responseNote, setResponseNote] = useState('');
  const [submittingResponse, setSubmittingResponse] = useState(false);

  useEffect(() => {
    fetchPrescriptions();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchPrescriptions = async () => {
    try {
      setLoading(true);
      let response;
      
      if (isDoctor) {
        response = await medicationPrescriptionApi.getDoctorPrescriptions();
      } else {
        response = await medicationPrescriptionApi.getPatientPrescriptions();
      }

      const payload = response.data;
      // Handle the paged response structure: { results: [...], total: number, skip: number, limit: number }
      const items = Array.isArray(payload?.results) ? payload.results : Array.isArray(payload) ? payload : [];
      setPrescriptions(items);
    } catch (error) {
      console.error('Error fetching prescriptions:', error);
    } finally {
      setLoading(false);
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
      const res = await medicationPrescriptionApi.sendFeedback(feedbackOpenId, {
        message: feedbackMessage.trim(),
        isUrgent: feedbackUrgent,
      });
      const updated = res.data;
      setPrescriptions(prev =>
        prev.map(p => (p.id === feedbackOpenId ? { ...p, ...updated } : p))
      );
      toast.success('Đã gửi phản hồi');
      setFeedbackOpenId(null);
      setFeedbackMessage('');
      setFeedbackUrgent(false);
    } catch (error) {
      console.error('Error sending feedback:', error);
      toast.error('Không thể gửi phản hồi');
    } finally {
      setSubmittingFeedback(false);
    }
  };

  const handleUpdateStatus = async (prescriptionId: string, newStatus: MedicationPrescriptionStatus) => {
    try {
      setUpdatingId(prescriptionId);
      await medicationPrescriptionApi.update(prescriptionId, { status: newStatus });
      
      // Update local state
      setPrescriptions(prev => prev.map(p => 
        p.id === prescriptionId ? { ...p, status: newStatus } : p
      ));
      
      toast.success(`Đã cập nhật trạng thái đơn thuốc thành ${getStatusText(newStatus)}`);
    } catch (error) {
      console.error('Error updating prescription:', error);
      toast.error('Không thể cập nhật đơn thuốc');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleViewFeedback = (prescription: MedicationPrescription) => {
    setViewFeedbackOpenId(prescription.id);
    setResponseNote('');
  };

  const handleSubmitResponse = async () => {
    if (!viewFeedbackOpenId || !responseNote.trim()) {
      toast.error('Vui lòng nhập nội dung phản hồi');
      return;
    }
    try {
      setSubmittingResponse(true);
      const res = await medicationPrescriptionApi.respondFeedback(viewFeedbackOpenId, {
        responseNote: responseNote.trim(),
      });
      const updated = res.data?.data || res.data;
      
      // Update local state
      setPrescriptions(prev =>
        prev.map(p => (p.id === viewFeedbackOpenId ? { ...p, ...updated } : p))
      );
      
      toast.success('Đã gửi phản hồi thành công');
      setViewFeedbackOpenId(null);
      setResponseNote('');
    } catch (error: unknown) {
      console.error('Error responding to feedback:', error);
      const errorMessage = (error as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Không thể gửi phản hồi';
      toast.error(errorMessage);
    } finally {
      setSubmittingResponse(false);
    }
  };

  

  const getStatusColor = (status: MedicationPrescriptionStatus) => {
    switch (status) {
      case MedicationPrescriptionStatus.DRAFT:
        return 'bg-yellow-100 text-yellow-800';
      case MedicationPrescriptionStatus.SIGNED:
        return 'bg-green-100 text-green-800';
      case MedicationPrescriptionStatus.CANCELLED:
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: MedicationPrescriptionStatus) => {
    switch (status) {
      case MedicationPrescriptionStatus.DRAFT:
        return 'Nháp';
      case MedicationPrescriptionStatus.SIGNED:
        return 'Đã ký';
      case MedicationPrescriptionStatus.CANCELLED:
        return 'Đã hủy';
      default:
        return status;
    }
  };

  const filteredPrescriptions = prescriptions.filter(prescription => {
    const matchesSearch = searchTerm === '' || 
      prescription.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      prescription.note?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      prescription.patientProfile?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || prescription.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 bg-gray-200 rounded animate-pulse" />
        <div className="h-32 bg-gray-200 rounded animate-pulse" />
        <div className="h-32 bg-gray-200 rounded animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Tìm kiếm theo mã đơn thuốc, tên bệnh nhân hoặc ghi chú..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Trạng thái" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả</SelectItem>
            <SelectItem value={MedicationPrescriptionStatus.DRAFT}>Nháp</SelectItem>
            <SelectItem value={MedicationPrescriptionStatus.SIGNED}>Đã ký</SelectItem>
            <SelectItem value={MedicationPrescriptionStatus.CANCELLED}>Đã hủy</SelectItem>
          </SelectContent>
        </Select>
        <Button 
          variant="outline" 
          onClick={fetchPrescriptions} 
          disabled={loading}
          className="w-full sm:w-auto"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Làm mới
        </Button>
      </div>

      {/* Prescriptions List */}
      <div className="space-y-4">
        {filteredPrescriptions.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FileText className="h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchTerm || statusFilter !== 'all' ? 'Không tìm thấy đơn thuốc' : 'Không có đơn thuốc'}
              </h3>
              <p className="text-gray-500 text-center">
                {searchTerm || statusFilter !== 'all' 
                  ? 'Thử thay đổi từ khóa tìm kiếm hoặc bộ lọc.'
                  : isDoctor ? 'Bạn chưa tạo đơn thuốc nào.' : 'Bạn chưa có đơn thuốc nào.'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600">
                Hiển thị {filteredPrescriptions.length} đơn thuốc
                {searchTerm && ` cho "${searchTerm}"`}
              </p>
            </div>
            {filteredPrescriptions.map((prescription) => (
            <Card key={prescription.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-semibold">
                    Đơn thuốc #{prescription.code}
                  </CardTitle>
                  <Badge className={getStatusColor(prescription.status)}>
                    {getStatusText(prescription.status)}
                  </Badge>
                </div>
                <div className="flex items-center text-sm text-gray-500">
                  <CalendarDays className="h-4 w-4 mr-2" />
                  {format(new Date(prescription.createdAt), 'dd/MM/yyyy HH:mm', { locale: vi })}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {/* Patient Information */}
                  {prescription.patientProfile && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <span className="font-medium">Bệnh nhân:</span>
                      <span>{prescription.patientProfile.name}</span>
                      <span className="text-gray-400">•</span>
                      <span>{prescription.patientProfile.profileCode}</span>
                    </div>
                  )}
                  
                  {prescription.note && (
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Ghi chú:</span> {prescription.note}
                    </p>
                  )}
                  
                  <div className="space-y-3">
                    <h4 className="font-medium text-sm">Danh sách thuốc ({prescription.items.length}):</h4>
                    {prescription.items.length > 0 ? (
                      <div className="space-y-2">
                        {prescription.items.map((item, index) => (
                          <div key={index} className="bg-linear-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-3">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <h5 className="font-semibold text-gray-900">{item.name}</h5>
                                  {item.ndc && (
                                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                                      NDC: {item.ndc}
                                    </span>
                                  )}
                                </div>
                                
                                <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                                  {item.strength && (
                                    <div className="flex items-center gap-1">
                                      <span className="font-medium">Liều:</span>
                                      <span>{item.strength}</span>
                                    </div>
                                  )}
                                  {item.dosageForm && (
                                    <div className="flex items-center gap-1">
                                      <span className="font-medium">Dạng:</span>
                                      <span>{item.dosageForm}</span>
                                    </div>
                                  )}
                                  {item.route && (
                                    <div className="flex items-center gap-1">
                                      <span className="font-medium">Đường dùng:</span>
                                      <span>{item.route}</span>
                                    </div>
                                  )}
                                  {item.frequency && (
                                    <div className="flex items-center gap-1">
                                      <span className="font-medium">Tần suất:</span>
                                      <span>{item.frequency}</span>
                                    </div>
                                  )}
                                  {item.durationDays && (
                                    <div className="flex items-center gap-1">
                                      <span className="font-medium">Thời gian:</span>
                                      <span>{item.durationDays} ngày</span>
                                    </div>
                                  )}
                                  <div className="flex items-center gap-1">
                                    <span className="font-medium">Số lượng:</span>
                                    <span className="font-semibold text-blue-700">
                                      {item.quantity} {item.quantityUnit}
                                    </span>
                                  </div>
                                </div>
                                
                                {item.instructions && (
                                  <div className="mt-2 p-2 bg-white rounded border-l-4 border-blue-400">
                                    <span className="text-xs font-medium text-gray-700">Hướng dẫn:</span>
                                    <p className="text-xs text-gray-600 mt-1">{item.instructions}</p>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-6 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                        <div className="text-gray-400 mb-2">
                          <svg className="w-8 h-8 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                          </svg>
                        </div>
                        <p className="text-sm text-gray-500 italic">Chưa có thuốc nào trong đơn</p>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-between items-center">
                    {/* Status Update Actions */}
                    <div className="flex gap-2">
                      {prescription.status === 'DRAFT' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleUpdateStatus(prescription.id, MedicationPrescriptionStatus.SIGNED)}
                          disabled={updatingId === prescription.id}
                          className="text-xs"
                        >
                          {updatingId === prescription.id ? (
                            <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                          ) : (
                            <Edit className="h-3 w-3 mr-1" />
                          )}
                          Ký đơn
                        </Button>
                      )}
                      
                      {prescription.status === 'SIGNED' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleUpdateStatus(prescription.id, MedicationPrescriptionStatus.CANCELLED)}
                          disabled={updatingId === prescription.id}
                          className="text-xs text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                        >
                          {updatingId === prescription.id ? (
                            <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                          ) : (
                            <Trash2 className="h-3 w-3 mr-1" />
                          )}
                          Hủy đơn
                        </Button>
                      )}
                    </div>

                    {/* View / Print / Delete Actions */}
                    <div className="flex gap-2">
                      {isDoctor && prescription.feedbackMessage && (
                        <Dialog open={viewFeedbackOpenId === prescription.id} onOpenChange={(open) => {
                          if (!open) {
                            setViewFeedbackOpenId(null);
                            setResponseNote('');
                            return;
                          }
                          handleViewFeedback(prescription);
                        }}>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm" className={prescription.feedbackIsUrgent ? 'border-red-300 text-red-700 hover:bg-red-50 hover:text-red-700' : ''}>
                              <MessageSquare className="h-4 w-4 mr-2" />
                              {prescription.feedbackIsUrgent ? 'Phản hồi khẩn' : 'Xem phản hồi'}
                              {prescription.feedbackProcessed && (
                                <Badge variant="outline" className="ml-2 text-xs bg-green-50 text-green-700 border-green-200">Đã xử lý</Badge>
                              )}
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-md">
                            <DialogHeader>
                              <DialogTitle>Phản hồi đơn thuốc #{prescription.code}</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div className="bg-gray-50 p-3 rounded border">
                                <div className="flex items-center justify-between mb-2">
                                  <div className="text-sm font-medium">Phản hồi từ bệnh nhân:</div>
                                  {prescription.feedbackIsUrgent && (
                                    <Badge variant="destructive" className="text-xs">Khẩn cấp</Badge>
                                  )}
                                </div>
                                <div className="text-sm text-gray-700 leading-relaxed">{prescription.feedbackMessage}</div>
                                {prescription.feedbackAt && (
                                  <div className="text-xs text-gray-500 mt-2">
                                    {format(new Date(prescription.feedbackAt), 'dd/MM/yyyy HH:mm', { locale: vi })}
                                  </div>
                                )}
                              </div>
                              
                              {prescription.feedbackResponseNote ? (
                                <div className="bg-blue-50 p-3 rounded border border-blue-200">
                                  <div className="text-sm font-medium text-blue-900 mb-1">Phản hồi của bạn:</div>
                                  <div className="text-sm text-blue-800">{prescription.feedbackResponseNote}</div>
                                  {prescription.feedbackResponseAt && (
                                    <div className="text-xs text-blue-600 mt-2">
                                      {format(new Date(prescription.feedbackResponseAt), 'dd/MM/yyyy HH:mm', { locale: vi })}
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <div className="space-y-2">
                                  <label className="text-sm font-medium mb-2">Trả lời phản hồi</label>
                                  <Textarea
                                    value={responseNote}
                                    onChange={(e) => setResponseNote(e.target.value)}
                                    rows={4}
                                    placeholder="Nhập phản hồi cho bệnh nhân..."
                                  />
                                </div>
                              )}
                              
                              <div className="flex justify-end gap-2">
                                <Button
                                  variant="outline"
                                  onClick={() => {
                                    setViewFeedbackOpenId(null);
                                    setResponseNote('');
                                  }}
                                  disabled={submittingResponse}
                                >
                                  {prescription.feedbackResponseNote ? 'Đóng' : 'Hủy'}
                                </Button>
                                {!prescription.feedbackResponseNote && (
                                  <Button onClick={handleSubmitResponse} disabled={submittingResponse}>
                                    {submittingResponse ? 'Đang gửi...' : 'Gửi phản hồi'}
                                  </Button>
                                )}
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      )}
                      {!isDoctor && (
                        <Dialog open={feedbackOpenId === prescription.id} onOpenChange={(open) => {
                          if (!open) {
                            setFeedbackOpenId(null);
                            return;
                          }
                          handleOpenFeedback(prescription.id, prescription.feedbackMessage, prescription.feedbackIsUrgent ?? undefined);
                        }}>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              Phản hồi
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-md">
                            <DialogHeader>
                              <DialogTitle>Gửi phản hồi đơn thuốc #{prescription.code}</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div className="space-y-2">
                                <label className="text-sm font-medium">Nội dung</label>
                                <Textarea
                                  value={feedbackMessage}
                                  onChange={(e) => setFeedbackMessage(e.target.value)}
                                  rows={4}
                                  placeholder="Nhập phản hồi cho bác sĩ..."
                                />
                              </div>
                              <label className="flex items-center gap-2 text-sm">
                                <Checkbox
                                  checked={feedbackUrgent}
                                  onCheckedChange={(checked) => setFeedbackUrgent(Boolean(checked))}
                                />
                                <span>Đánh dấu khẩn cấp</span>
                              </label>
                              <div className="flex justify-end gap-2">
                                <Button
                                  variant="outline"
                                  onClick={() => setFeedbackOpenId(null)}
                                  disabled={submittingFeedback}
                                >
                                  Hủy
                                </Button>
                                <Button onClick={handleSubmitFeedback} disabled={submittingFeedback}>
                                  {submittingFeedback ? 'Đang gửi...' : 'Gửi phản hồi'}
                                </Button>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const url = `/medication-prescriptions/print/${encodeURIComponent(prescription.code)}`;
                          window.open(url, '_blank');
                        }}
                      >
                        <Printer className="h-4 w-4 mr-2" />
                        In đơn thuốc
                      </Button>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4 mr-2" />
                            Xem chi tiết
                          </Button>
                        </DialogTrigger>
                      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle className="flex items-center gap-2">
                            <FileText className="h-5 w-5" />
                            Chi tiết đơn thuốc #{prescription.code}
                          </DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="text-sm font-medium text-gray-500">Mã đơn thuốc</label>
                              <p className="text-sm">{prescription.code}</p>
                            </div>
                            <div>
                              <label className="text-sm font-medium text-gray-500">Trạng thái</label>
                              <p className="text-sm">
                                <Badge className={getStatusColor(prescription.status)}>
                                  {getStatusText(prescription.status)}
                                </Badge>
                              </p>
                            </div>
                          </div>
                          
                          {prescription.patientProfile && (
                            <div>
                              <label className="text-sm font-medium text-gray-500">Thông tin bệnh nhân</label>
                              <div className="mt-1 p-3 bg-gray-50 rounded-lg">
                                <p className="text-sm font-medium">{prescription.patientProfile.name}</p>
                                <p className="text-xs text-gray-500">
                                  {prescription.patientProfile.profileCode} • {prescription.patientProfile.phone || 'Không có SĐT'}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {prescription.patientProfile.address}
                                </p>
                              </div>
                            </div>
                          )}
                          
                          {prescription.note && (
                            <div>
                              <label className="text-sm font-medium text-gray-500">Ghi chú</label>
                              <p className="text-sm">{prescription.note}</p>
                            </div>
                          )}

                          <div>
                            <div className="flex items-center justify-between mb-3">
                              <label className="text-sm font-medium text-gray-500">Danh sách thuốc</label>
                              <Badge variant="secondary" className="text-xs">
                                {prescription.items.length} thuốc
                              </Badge>
                            </div>
                            {prescription.items.length > 0 ? (
                              <div className="space-y-4">
                                {prescription.items.map((item, index) => (
                                  <div key={index} className="border border-blue-200 rounded-xl p-4">
                                    <div className="flex items-start justify-between mb-3">
                                      <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 bg-blue-400 text-white rounded-full flex items-center justify-center text-sm font-bold">
                                          {index + 1}
                                        </div>
                                        <div>
                                          <h4 className="font-semibold text-gray-900 text-lg">{item.name}</h4>
                                          {item.ndc && (
                                            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full mt-1 inline-block">
                                              NDC: {item.ndc}
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 mb-4">
                                      {item.strength && (
                                        <div className="bg-white p-3 rounded-lg border">
                                          <span className="text-xs font-medium text-gray-500 block">Liều lượng</span>
                                          <span className="text-sm font-semibold text-gray-900">{item.strength}</span>
                                        </div>
                                      )}
                                      {item.dosageForm && (
                                        <div className="bg-white p-3 rounded-lg border">
                                          <span className="text-xs font-medium text-gray-500 block">Dạng bào chế</span>
                                          <span className="text-sm font-semibold text-gray-900">{item.dosageForm}</span>
                                        </div>
                                      )}
                                      {item.route && (
                                        <div className="bg-white p-3 rounded-lg border">
                                          <span className="text-xs font-medium text-gray-500 block">Đường dùng</span>
                                          <span className="text-sm font-semibold text-gray-900">{item.route}</span>
                                        </div>
                                      )}
                                      
                                      {item.frequency && (
                                        <div className="bg-white p-3 rounded-lg border">
                                          <span className="text-xs font-medium text-gray-500 block">Tần suất</span>
                                          <span className="text-sm font-semibold text-gray-900">{item.frequency}</span>
                                        </div>
                                      )}
                                      {item.durationDays && (
                                        <div className="bg-white p-3 rounded-lg border">
                                          <span className="text-xs font-medium text-gray-500 block">Thời gian</span>
                                          <span className="text-sm font-semibold text-gray-900">{item.durationDays} ngày</span>
                                        </div>
                                      )}
                                      {item.quantity && item.quantityUnit && (
                                        <div className="p-3 rounded-lg border border-blue-300">
                                          <span className="text-xs font-medium text-blue-700 block">Số lượng</span>
                                          <span className="text-sm font-bold text-blue-900">{item.quantity} {item.quantityUnit}</span>
                                        </div>
                                      )}
                                    </div>
                                    
                                    {item.instructions && (
                                      <div className="bg-white border-l-4 border-blue-400 p-3 rounded-r-lg">
                                        <span className="text-xs font-medium text-blue-700 block mb-1">Hướng dẫn sử dụng</span>
                                        <p className="text-sm text-gray-700 leading-relaxed">{item.instructions}</p>
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                                <div className="text-gray-400 mb-2">
                                  <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                                  </svg>
                                </div>
                                <p className="text-sm text-gray-500">Đơn thuốc này chưa có thuốc nào</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                    
                    
                  </div>
                </div>
              </div>
              </CardContent>
            </Card>
            ))}
          </>
        )}
      </div>
    </div>
  );
}
