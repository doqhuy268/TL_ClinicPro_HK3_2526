"use client";

import { PatientSpendingSelector } from "@/components/dashboard/PatientSpendingSelector";
import { usePatientSpendingStatistics, usePeriodSelection } from "@/lib/hooks/use-statistics";
import { PeriodType } from "@/lib/types/statistics";
import { useState } from "react";
import { useAuth } from "@/lib/hooks/useAuth";

export default function PatientSpendingPage() {
  const { user } = useAuth();
  const userRole = user?.role;
  
  const [selectedPatientId] = useState<string>('');
  const [selectedPatientProfileId] = useState<string>('');
  const [searchType] = useState<'patient' | 'profile'>('patient');

  const {
    getCurrentParams
  } = usePeriodSelection('month');

  const params = getCurrentParams();

  // Patient spending statistics
  const patientSpendingStats = usePatientSpendingStatistics(
    searchType === 'patient' ? selectedPatientId : undefined,
    searchType === 'profile' ? selectedPatientProfileId : undefined,
    params.period as PeriodType,
    params.startDate,
    params.endDate,
    !!(selectedPatientId || selectedPatientProfileId)
  );

  // Check if user can view patient spending
  const canViewPatientSpending = ['ADMIN', 'RECEPTIONIST', 'DOCTOR', 'CASHIER', 'PATIENT'].includes(userRole || '');

  if (!canViewPatientSpending) {
    return (
      <div className="px-8 py-6 bg-white space-y-6 h-full">
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Không có quyền truy cập</h1>
          <p className="text-gray-600">Bạn không có quyền xem thống kê chi tiêu bệnh nhân.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-8 py-6 bg-white space-y-6 h-full">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Thống kê chi tiêu bệnh nhân</h1>
        <p className="text-gray-600 mt-1">Xem và phân tích chi tiêu của bệnh nhân</p>
      </div>

      {/* Patient Search */}
      <PatientSpendingSelector
        onDataUpdate={(data) => {
          // Handle data update if needed
          console.log('Patient spending data updated:', data);
        }}
      />

      {/* Patient Spending Statistics */}
      {patientSpendingStats.data && (
        <div className="space-y-6">
          {patientSpendingStats.data.familySpending && (
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-gray-900">
                Chi tiêu gia đình: {patientSpendingStats.data.familySpending.patientName}
              </h2>
              
              {/* Family Overview */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-900">
                    {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(
                      patientSpendingStats.data.familySpending.totalSpent
                    )}
                  </div>
                  <p className="text-sm text-blue-600 mt-1">Tổng chi tiêu</p>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-900">
                    {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(
                      patientSpendingStats.data.familySpending.totalPaid
                    )}
                  </div>
                  <p className="text-sm text-green-600 mt-1">Đã thanh toán</p>
                </div>
                <div className="text-center p-4 bg-yellow-50 rounded-lg">
                  <div className="text-2xl font-bold text-yellow-900">
                    {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(
                      patientSpendingStats.data.familySpending.accountsReceivable
                    )}
                  </div>
                  <p className="text-sm text-yellow-600 mt-1">Công nợ</p>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-900">
                    {patientSpendingStats.data.familySpending.profileCount}
                  </div>
                  <p className="text-sm text-purple-600 mt-1">Số hồ sơ</p>
                </div>
              </div>

              {/* Profile Details */}
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-gray-900">Chi tiết theo hồ sơ:</h3>
                {patientSpendingStats.data.familySpending.profiles.map((profile) => (
                  <div key={profile.patientProfileId} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{profile.profileName}</p>
                      <p className="text-sm text-gray-500">{profile.relationship}</p>
                      <p className="text-xs text-gray-400">
                        {profile.appointmentCount} lịch hẹn • {profile.invoiceCount} hóa đơn
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-medium text-gray-900">
                        {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(
                          profile.totalSpent
                        )}
                      </p>
                      <p className="text-sm text-gray-500">
                        Đã trả: {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(
                          profile.totalPaid
                        )}
                      </p>
                      {profile.accountsReceivable > 0 && (
                        <p className="text-xs text-red-500">
                          Nợ: {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(
                            profile.accountsReceivable
                          )}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {patientSpendingStats.data.profileSpending && (
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-gray-900">
                Chi tiêu hồ sơ: {patientSpendingStats.data.profileSpending.profileName}
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-900">
                    {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(
                      patientSpendingStats.data.profileSpending.totalSpent
                    )}
                  </div>
                  <p className="text-sm text-blue-600 mt-1">Tổng chi tiêu</p>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-900">
                    {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(
                      patientSpendingStats.data.profileSpending.totalPaid
                    )}
                  </div>
                  <p className="text-sm text-green-600 mt-1">Đã thanh toán</p>
                </div>
                <div className="text-center p-4 bg-yellow-50 rounded-lg">
                  <div className="text-2xl font-bold text-yellow-900">
                    {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(
                      patientSpendingStats.data.profileSpending.accountsReceivable
                    )}
                  </div>
                  <p className="text-sm text-yellow-600 mt-1">Công nợ</p>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-900">
                    {patientSpendingStats.data.profileSpending.appointmentCount}
                  </div>
                  <p className="text-sm text-purple-600 mt-1">Lịch hẹn</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Loading State */}
      {patientSpendingStats.loading && (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="text-gray-600 mt-2">Đang tải dữ liệu...</p>
        </div>
      )}

      {/* Error State */}
      {patientSpendingStats.error && (
        <div className="text-center py-12">
          <div className="text-red-600 mb-2">
            <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Lỗi tải dữ liệu</h3>
          <p className="text-gray-600">{patientSpendingStats.error}</p>
        </div>
      )}
    </div>
  );
}
