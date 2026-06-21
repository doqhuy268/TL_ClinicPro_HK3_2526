/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, User, Users } from "lucide-react";
import { useState } from "react";
import { usePatientSpendingStatistics } from "@/lib/hooks/use-statistics";
import { PeriodType } from "@/lib/types/statistics";

interface PatientSpendingSelectorProps {
  onDataUpdate?: (data: any) => void;
}

export function PatientSpendingSelector({ onDataUpdate }: PatientSpendingSelectorProps) {
  const [patientId, setPatientId] = useState<string>('');
  const [patientProfileId, setPatientProfileId] = useState<string>('');
  const [searchType, setSearchType] = useState<'patient' | 'profile'>('patient');
  const [period, setPeriod] = useState<PeriodType>('month');

  const patientSpending = usePatientSpendingStatistics(
    searchType === 'patient' ? patientId : undefined,
    searchType === 'profile' ? patientProfileId : undefined,
    period,
    undefined,
    undefined,
    !!(patientId || patientProfileId)
  );

  const handleSearch = () => {
    if (patientSpending.data && onDataUpdate) {
      onDataUpdate(patientSpending.data);
    }
  };

  return (
    <Card className="border border-gray-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5 text-gray-600" />
          Tìm kiếm chi tiêu bệnh nhân
        </CardTitle>
        <CardDescription>
          Xem thống kê chi tiêu theo bệnh nhân hoặc hồ sơ bệnh nhân
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search Type Selection */}
        <div className="space-y-2">
          <Label htmlFor="search-type">Loại tìm kiếm</Label>
          <Select value={searchType} onValueChange={(value: 'patient' | 'profile') => setSearchType(value)}>
            <SelectTrigger>
              <SelectValue placeholder="Chọn loại tìm kiếm" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="patient">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Theo bệnh nhân (gia đình)
                </div>
              </SelectItem>
              <SelectItem value="profile">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Theo hồ sơ bệnh nhân
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* ID Input */}
        <div className="space-y-2">
          <Label htmlFor="patient-id">
            {searchType === 'patient' ? 'ID Bệnh nhân' : 'ID Hồ sơ bệnh nhân'}
          </Label>
          <div className="flex gap-2">
            <Input
              id="patient-id"
              type="text"
              placeholder={searchType === 'patient' ? 'Nhập ID bệnh nhân' : 'Nhập ID hồ sơ bệnh nhân'}
              value={searchType === 'patient' ? patientId : patientProfileId}
              onChange={(e) => {
                if (searchType === 'patient') {
                  setPatientId(e.target.value);
                  setPatientProfileId('');
                } else {
                  setPatientProfileId(e.target.value);
                  setPatientId('');
                }
              }}
              className="flex-1"
            />
            <Button onClick={handleSearch} disabled={!patientId && !patientProfileId}>
              <Search className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Period Selection */}
        <div className="space-y-2">
          <Label htmlFor="period">Khoảng thời gian</Label>
          <Select value={period} onValueChange={(value: PeriodType) => setPeriod(value)}>
            <SelectTrigger>
              <SelectValue placeholder="Chọn khoảng thời gian" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="day">Hôm nay</SelectItem>
              <SelectItem value="week">Tuần này</SelectItem>
              <SelectItem value="month">Tháng này</SelectItem>
              <SelectItem value="custom">Tùy chỉnh</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Loading and Error States */}
        {patientSpending.loading && (
          <div className="text-center py-4 text-blue-600">
            <p className="text-sm">Đang tải dữ liệu...</p>
          </div>
        )}

        {patientSpending.error && (
          <div className="text-center py-4 text-red-600">
            <p className="text-sm">{patientSpending.error}</p>
          </div>
        )}

        {/* Quick Stats */}
        {patientSpending.data && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">Thông tin nhanh:</h4>
            {patientSpending.data.familySpending && (
              <div className="text-sm text-gray-600">
                <p><strong>Bệnh nhân:</strong> {patientSpending.data.familySpending.patientName}</p>
                <p><strong>Tổng chi tiêu:</strong> {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(patientSpending.data.familySpending.totalSpent)}</p>
                <p><strong>Số hồ sơ:</strong> {patientSpending.data.familySpending.profileCount}</p>
              </div>
            )}
            {patientSpending.data.profileSpending && (
              <div className="text-sm text-gray-600">
                <p><strong>Hồ sơ:</strong> {patientSpending.data.profileSpending.profileName}</p>
                <p><strong>Tổng chi tiêu:</strong> {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(patientSpending.data.profileSpending.totalSpent)}</p>
                <p><strong>Lịch hẹn:</strong> {patientSpending.data.profileSpending.appointmentCount}</p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
