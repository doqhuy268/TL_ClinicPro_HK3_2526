"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Users, 
  FileText, 
  Calendar, 
  TrendingUp,
  UserCheck,
  Clock,
  Activity
} from "lucide-react";
import { KPIData } from "@/lib/types/statistics";
import { formatNumber, formatPercentage } from "@/lib/services/statistics";
import { colors } from "@/lib/colors";
import { useAppointmentsByTime } from "@/lib/hooks/use-statistics";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Tooltip,
  AreaChart,
  Area
} from "recharts";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

interface ChartStatisticsCardsProps {
  data: KPIData | null;
  loading: boolean;
  error: string | null;
  period?: string;
  startDate?: string;
  endDate?: string;
}


export function ChartStatisticsCards({ data, loading, error }: ChartStatisticsCardsProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, index) => (
          <Card key={index} className="border border-gray-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16 mb-2" />
              <Skeleton className="h-3 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border border-red-200 bg-red-50">
        <CardContent className="p-6">
          <div className="flex items-center space-x-2 text-red-600">
            <Activity className="h-5 w-5" />
            <p className="font-medium">Lỗi tải dữ liệu</p>
          </div>
          <p className="text-sm text-red-500 mt-1">{error}</p>
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return null;
  }

  const { appointmentStats, patientStats, doctorRatingStats } = data;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {/* Total Patients */}
      <Card className="border border-gray-200">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-gray-600">
            Tổng bệnh nhân
          </CardTitle>
          <Users className="h-4 w-4 text-gray-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-gray-900">
            {formatNumber(patientStats.totalPatients)}
          </div>
          <p className="text-xs text-green-600 flex items-center mt-1">
            <TrendingUp className="h-3 w-3 mr-1" />
            {formatPercentage(patientStats.newPatientsPercent)} bệnh nhân mới
          </p>
        </CardContent>
      </Card>

      {/* Medical Records */}
      <Card className="border border-gray-200">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-gray-600">
            Hồ sơ bệnh án
          </CardTitle>
          <FileText className="h-4 w-4 text-gray-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-gray-900">
            {formatNumber(appointmentStats.total)}
          </div>
          <p className="text-xs text-blue-500 flex items-center mt-1">
            <Clock className="h-3 w-3 mr-1" />
            {formatPercentage(appointmentStats.completedPercent)} đã hoàn thành
          </p>
        </CardContent>
      </Card>

      {/* Today's Appointments */}
      <Card className="border border-gray-200">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-gray-600">
            Lịch hẹn hôm nay
          </CardTitle>
          <Calendar className="h-4 w-4 text-gray-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-gray-900">
            {formatNumber(appointmentStats.total)}
          </div>
          <div className="flex items-center justify-between mt-1">
            <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
              {appointmentStats.confirmed} đã xác nhận
            </Badge>
            <Badge variant="outline" className="text-xs bg-yellow-50 text-yellow-700 border-yellow-200">
              {appointmentStats.pending} chờ xác nhận
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Doctor Rating */}
      <Card className="border border-gray-200">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-gray-600">
            Đánh giá bác sĩ
          </CardTitle>
          <UserCheck className="h-4 w-4 text-gray-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-gray-900">
            {doctorRatingStats.averageRating.toFixed(1)}/5.0
          </div>
          <p className="text-xs text-gray-500 flex items-center mt-1">
            <UserCheck className="h-3 w-3 mr-1" />
            {doctorRatingStats.activeDoctors}/{doctorRatingStats.totalDoctors} bác sĩ đang hoạt động
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

// Chart-based detailed statistics cards
export function ChartDetailedStatisticsCards({ data, loading, error, period, startDate, endDate }: ChartStatisticsCardsProps) {
  // Fetch time-based appointment data (always call hooks at the top level)
  const appointmentsByTime = useAppointmentsByTime(
    (period as 'day' | 'week' | 'month' | 'custom') || 'day',
    startDate,
    endDate,
    !!(period && (period !== 'custom' || (startDate && endDate)))
  );

  if (loading || error || !data) {
    return null;
  }

  const { appointmentStats, patientStats } = data;

  // Prepare data for charts with ClinicPro colors
  const appointmentStatusData = [
    { status: 'Hoàn thành', value: appointmentStats.completed, fill: colors.primary.hex },
    { status: 'Đã xác nhận', value: appointmentStats.confirmed, fill: colors.primaryLight.hex },
    { status: 'Đã hủy', value: appointmentStats.cancelled, fill: '#EF4444' },
    { status: 'Chờ xác nhận', value: appointmentStats.pending, fill: '#F59E0B' }
  ];

  const patientTypeData = [
    { type: 'Bệnh nhân mới', value: patientStats.newPatients, fill: colors.primary.hex },
    { type: 'Bệnh nhân cũ', value: patientStats.returningPatients, fill: colors.secondary.hex }
  ];

  // Chart configurations
  const appointmentStatusConfig = {
    value: {
      label: "Số lượng",
    },
    "Hoàn thành": {
      label: "Hoàn thành",
      color: colors.primary.hex,
    },
    "Đã xác nhận": {
      label: "Đã xác nhận", 
      color: colors.primaryLight.hex,
    },
    "Đã hủy": {
      label: "Đã hủy",
      color: "#EF4444",
    },
    "Chờ xác nhận": {
      label: "Chờ xác nhận",
      color: "#F59E0B",
    },
  } satisfies ChartConfig;

  // Check if we have time-based data from API
  const hasTimeData = appointmentsByTime.data && appointmentsByTime.data.data.length > 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
      {/* Appointment Status Pie Chart */}
      <Card className="border border-gray-200">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900">
            Trạng thái lịch hẹn
          </CardTitle>
          <CardDescription>
            Phân tích chi tiết các lịch hẹn
          </CardDescription>
        </CardHeader>
        <CardContent>
          {appointmentStatusData.some(item => item.value > 0) ? (
            <ChartContainer
              config={appointmentStatusConfig}
              className="mx-auto aspect-square max-h-[250px]"
            >
              <PieChart>
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent hideLabel />}
                />
                <Pie 
                  data={appointmentStatusData} 
                  dataKey="value" 
                  nameKey="status"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                />
              </PieChart>
            </ChartContainer>
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <Calendar className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                <p className="text-sm">Chưa có dữ liệu lịch hẹn</p>
                <p className="text-xs text-gray-400 mt-1">Vui lòng chọn khoảng thời gian khác</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Patient Type Chart */}
      <Card className="border border-gray-200">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900">
            Loại bệnh nhân
          </CardTitle>
          <CardDescription>
            Phân loại bệnh nhân mới và cũ
          </CardDescription>
        </CardHeader>
        <CardContent>
          {patientTypeData.some(item => item.value > 0) ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={patientTypeData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="type" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill={colors.primary.hex} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <Users className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                <p className="text-sm">Chưa có dữ liệu bệnh nhân</p>
                <p className="text-xs text-gray-400 mt-1">Vui lòng chọn khoảng thời gian khác</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Appointment Trend Chart - Show real data if available */}
      {hasTimeData ? (
        <Card className="border border-gray-200">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900">
              Xu hướng lịch hẹn
            </CardTitle>
            <CardDescription>
              Lịch hẹn theo thời gian
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={appointmentsByTime.data?.data || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={(value) => {
                      const date = new Date(value);
                      return date.toLocaleDateString('vi-VN', { 
                        day: '2-digit', 
                        month: '2-digit' 
                      });
                    }}
                  />
                  <YAxis />
                  <Tooltip 
                    labelFormatter={(value) => {
                      const date = new Date(value);
                      return date.toLocaleDateString('vi-VN', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric'
                      });
                    }}
                  />
                  <Area type="monotone" dataKey="completed" stackId="1" stroke={colors.primary.hex} fill={colors.primary.hex} name="Hoàn thành" />
                  <Area type="monotone" dataKey="pending" stackId="1" stroke={colors.primaryLight.hex} fill={colors.primaryLight.hex} name="Chờ xác nhận" />
                  <Area type="monotone" dataKey="cancelled" stackId="1" stroke="#EF4444" fill="#EF4444" name="Đã hủy" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      ) : appointmentsByTime.loading ? (
        <Card className="border border-gray-200">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900">
              Xu hướng lịch hẹn
            </CardTitle>
            <CardDescription>
              Đang tải dữ liệu...
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border border-gray-200">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900">
              Xu hướng lịch hẹn
            </CardTitle>
            <CardDescription>
              Lịch hẹn theo thời gian
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <Activity className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                <p className="text-sm">Chưa có dữ liệu theo thời gian</p>
                <p className="text-xs text-gray-400 mt-1">Vui lòng chọn khoảng thời gian</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

