'use client';

import React, { useState, useEffect, useImperativeHandle, forwardRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { medicationPrescriptionApi } from '@/lib/api';
import { MedicationPrescription, MedicationPrescriptionStatus } from '@/lib/types/medication-prescription';
import { Pill, Eye, CalendarDays, RefreshCw, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { toast } from 'sonner';

interface MedicalRecordPrescriptionsProps {
  medicalRecordId: string;
  patientProfileId: string;
  onRefresh?: () => void;
}

export interface MedicalRecordPrescriptionsRef {
  refresh: () => void;
}

export const MedicalRecordPrescriptions = forwardRef<MedicalRecordPrescriptionsRef, MedicalRecordPrescriptionsProps>(
  ({ medicalRecordId, onRefresh }, ref) => {
    const [prescriptions, setPrescriptions] = useState<MedicationPrescription[]>([]);
    const [loading, setLoading] = useState(true);
    const [updatingId, setUpdatingId] = useState<string | null>(null);

    useEffect(() => {
      fetchPrescriptions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [medicalRecordId]);

    useImperativeHandle(ref, () => ({
      refresh: fetchPrescriptions
    }));

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

    const fetchPrescriptions = async () => {
      try {
        setLoading(true);
        console.log('Fetching prescriptions for medical record:', medicalRecordId);
        
        // Use the new API to get prescriptions by medical record
        const response = await medicationPrescriptionApi.getByMedicalRecord(medicalRecordId, { 
          page: 1, 
          limit: 50 
        });
        
        console.log('Prescriptions API response:', response.data);
        
        // Handle the actual API response structure: { results: [], total: number, skip: number, limit: number }
        const prescriptionsData = response.data?.results || response.data?.prescriptions || response.data?.data || response.data || [];
        const prescriptionsList = Array.isArray(prescriptionsData) ? prescriptionsData : [];
        setPrescriptions(prescriptionsList);
        
        
      } catch (error) {
        console.error('Error fetching prescriptions:', error);
        setPrescriptions([]);
        toast.error('Không thể tải danh sách đơn thuốc');
      } finally {
        setLoading(false);
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

    if (loading) {
      return (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Pill className="h-5 w-5 text-blue-600" />
              Đơn thuốc
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="h-4 bg-gray-200 rounded animate-pulse" />
              <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4" />
            </div>
          </CardContent>
        </Card>
      );
    }

    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Pill className="h-5 w-5 text-blue-600" />
              Đơn thuốc
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  fetchPrescriptions();
                  onRefresh?.();
                }}
                disabled={loading}
                className="text-xs"
              >
                <RefreshCw className={`h-3 w-3 mr-1 ${loading ? 'animate-spin' : ''}`} />
                Tải lại
              </Button>
            </div>
          </div>
          <div className="text-xs text-gray-500 mt-2 space-y-1">
            <div>Hiển thị {prescriptions.length} đơn thuốc</div>
          </div>
        </CardHeader>
        <CardContent>
          {prescriptions.length === 0 ? (
            <div className="text-center py-8">
              <Pill className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Chưa có đơn thuốc</h3>
              <p className="text-gray-500">
                Bệnh án này chưa có đơn thuốc nào được kê.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {prescriptions.map((prescription) => (
                <div key={prescription.id} className="border rounded-lg p-4 ">
                  <div className="flex items-center justify-between ">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium text-sm">Đơn thuốc #{prescription.code}</h4>
                      <Badge className={getStatusColor(prescription.status)}>
                        {getStatusText(prescription.status)}
                      </Badge>
                    </div>
                   
                  </div>
                  <div className="flex items-center text-xs text-gray-500 mb-2">
                      <CalendarDays className="h-3 w-3 mr-1" />
                      {format(new Date(prescription.createdAt), 'dd/MM/yyyy HH:mm', { locale: vi })}
                    </div>
                  {/* Doctor and Medical Record Info */}
                  {/* <div className="grid grid-cols-1 md:grid-cols-1 gap-3 mb-3 text-sm">
                    {prescription.doctor && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          <span className="font-medium text-blue-900">Bác sĩ kê đơn</span>
                        </div>
                        <div className="text-blue-800">
                          <p className="font-medium">{prescription.doctor.degrees?.[0] || 'Bác sĩ'}</p>
                          <p className="text-xs">Mã: {prescription.doctor.doctorCode}</p>
                          {prescription.doctor.workHistory && (
                            <p className="text-xs">Nơi làm việc: {prescription.doctor.workHistory}</p>
                          )}
                        </div>
                      </div>
                    )} */}
                    
                    {/* {prescription.medicalRecord && (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <span className="font-medium text-green-900">Bệnh án liên kết</span>
                        </div>
                        <div className="text-green-800">
                          <p className="font-medium">Mã: {prescription.medicalRecord.medicalRecordCode}</p>
                          {prescription.medicalRecord.content?.diagnosis && (
                            <p className="text-xs">Chẩn đoán: {prescription.medicalRecord.content.diagnosis}</p>
                          )}
                          <p className="text-xs">
                            Trạng thái: {prescription.medicalRecord.status === 'IN_PROGRESS' ? 'Đang điều trị' : prescription.medicalRecord.status}
                          </p>
                        </div>
                      </div>
                    )} */}
                  {/* </div> */}

                  {prescription.note && (
                    <p className="text-sm text-gray-600 mb-3">
                      <span className="font-medium ">Ghi chú:</span> {prescription.note}
                    </p>
                  )}

                  <div className="space-y-2">
                    <h5 className="font-md text-sm">Danh sách thuốc:</h5>
                    {prescription.items && prescription.items.length > 0 ? (
                      <div className="space-y-1">
                        {prescription.items.map((item, index) => (
                          <div key={index} className="flex items-center justify-between text-xs bg-gray-50 p-2 rounded">
                            <div>
                              <span className="font-medium">{item.name}</span>
                              {item.strength && <span className="text-gray-500 ml-2">({item.strength})</span>}
                            </div>
                            <div className="text-gray-500">
                              {item.quantity} {item.quantityUnit}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                          <span className="text-yellow-800 text-sm">
                            Đơn thuốc chưa có thuốc nào được kê
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-between items-center mt-3">
                    {/* Status Update Actions */}
                    <div className="flex gap-2">
                      {/* {prescription.status === 'DRAFT' && (
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
                      )} */}
                      
                      

                    {/* View and Delete Actions */}
                    <div className="flex gap-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4 " />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>Chi tiết đơn thuốc #{prescription.code}</DialogTitle>
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
                            
                            {prescription.note && (
                              <div>
                                <label className="text-sm font-medium text-gray-500">Ghi chú</label>
                                <p className="text-sm">{prescription.note}</p>
                              </div>
                            )}

                            <div>
                              <label className="text-sm font-medium text-gray-500">Danh sách thuốc</label>
                              <div className="space-y-3 mt-2">
                                {prescription.items && prescription.items.length > 0 ? (
                                  prescription.items.map((item, index) => (
                                  <div key={index} className="border rounded-lg p-4 space-y-2">
                                    <div className="flex items-center justify-between">
                                      <h4 className="font-medium">{item.name}</h4>
                                      {item.ndc && (
                                        <span className="text-xs text-gray-500">NDC: {item.ndc}</span>
                                      )}
                                    </div>
                                    
                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                      {item.strength && (
                                        <div>
                                          <span className="text-gray-500">Liều lượng:</span> {item.strength}
                                        </div>
                                      )}
                                      {item.dosageForm && (
                                        <div>
                                          <span className="text-gray-500">Dạng bào chế:</span> {item.dosageForm}
                                        </div>
                                      )}
                                      {item.route && (
                                        <div>
                                          <span className="text-gray-500">Đường dùng:</span> {item.route}
                                        </div>
                                      )}
                                      {item.frequency && (
                                        <div>
                                          <span className="text-gray-500">Tần suất:</span> {item.frequency}
                                        </div>
                                      )}
                                      {item.durationDays && (
                                        <div>
                                          <span className="text-gray-500">Thời gian:</span> {item.durationDays} ngày
                                        </div>
                                      )}
                                      {item.quantity && (
                                        <div>
                                          <span className="text-gray-500">Số lượng:</span> {item.quantity} {item.quantityUnit}
                                        </div>
                                      )}
                                    </div>
                                    
                                    {item.instructions && (
                                      <div>
                                        <span className="text-gray-500 text-sm">Hướng dẫn sử dụng:</span>
                                        <p className="text-sm mt-1">{item.instructions}</p>
                                      </div>
                                    )}
                                  </div>
                                ))
                                ) : (
                                  <div className="text-center py-6 text-gray-500">
                                    <Pill className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                    <p className="text-sm">Đơn thuốc chưa có thuốc nào được kê</p>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                      
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
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    );
  });

MedicalRecordPrescriptions.displayName = 'MedicalRecordPrescriptions';