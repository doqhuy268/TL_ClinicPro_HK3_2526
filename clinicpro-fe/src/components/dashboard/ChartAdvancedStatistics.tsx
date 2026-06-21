"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { 
  Users, 
  Activity,
  BarChart3,
  PieChart,
  Clock,
  TrendingUp,
  UserCheck,
  Stethoscope,
  Calendar,
  Pill
} from "lucide-react";
import { 
  WorkSessionData, 
  ExaminationVolumeData, 
  TopServicesData,
  PatientSpendingData 
} from "@/lib/types/statistics";
import { formatCurrency, formatNumber, formatPercentage } from "@/lib/services/statistics";
import { colors } from "@/lib/colors";
import { useExaminationsByTime } from "@/lib/hooks/use-statistics";
import { 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Line,
  ComposedChart,
} from "recharts";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

interface ChartAdvancedStatisticsProps {
  workSessionData: WorkSessionData | null;
  examinationData: ExaminationVolumeData | null;
  topServicesData: TopServicesData | null;
  patientSpendingData: PatientSpendingData | null;
  loading: boolean;
  error: string | null;
  userRole?: string;
  period?: string;
  startDate?: string;
  endDate?: string;
}


export function ChartAdvancedStatistics({
  workSessionData,
  examinationData,
  topServicesData,
  loading,
  error,
  userRole,
  period,
  startDate,
  endDate
}: ChartAdvancedStatisticsProps) {
  const getTabCount = () => {
    let count = 0;
    if (['ADMIN', 'RECEPTIONIST', 'DOCTOR', 'TECHNICIAN'].includes(userRole || '')) count++;
    if (['ADMIN', 'RECEPTIONIST', 'DOCTOR'].includes(userRole || '')) count++;
    if (['ADMIN', 'RECEPTIONIST'].includes(userRole || '')) count++;
    return count;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {Array.from({ length: 4 }).map((_, index) => (
            <Card key={index} className="border border-gray-200">
              <CardHeader>
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-4 w-48" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-24 mb-4" />
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="flex justify-between">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-4 w-16" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border border-red-200 bg-red-50">
        <CardContent className="p-6">
          <div className="flex items-center space-x-2 text-red-600">
            <Activity className="h-5 w-5" />
            <p className="font-medium">Lỗi tải dữ liệu thống kê nâng cao</p>
          </div>
          <p className="text-sm text-red-500 mt-1">{error}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6 ">
      <div className="flex items-center gap-2">
        <BarChart3 className="h-6 w-6 text-gray-600" />
        <h2 className="text-2xl font-bold text-gray-900">Thống kê nâng cao</h2>
      </div>

      <Tabs defaultValue="work-sessions" className="space-y-6">
        <TabsList className={`grid w-full ${getTabCount() === 3 ? 'grid-cols-3' : getTabCount() === 2 ? 'grid-cols-2' : 'grid-cols-1'}`}>
          {['ADMIN', 'RECEPTIONIST', 'DOCTOR', 'TECHNICIAN'].includes(userRole || '') && (
            <TabsTrigger value="work-sessions"><Calendar className="h-4 w-4" /> Ca làm việc</TabsTrigger>
          )}
          {['ADMIN', 'RECEPTIONIST', 'DOCTOR'].includes(userRole || '') && (
            <TabsTrigger value="examination"><Stethoscope className="h-4 w-4" /> Khám bệnh</TabsTrigger>
          )}
          {['ADMIN', 'RECEPTIONIST'].includes(userRole || '') && (
            <TabsTrigger value="services"><Pill className="h-4 w-4" /> Dịch vụ</TabsTrigger>
          )}
        </TabsList>

        {/* Work Sessions Tab */}
        <TabsContent value="work-sessions" className="space-y-6">
          <ChartWorkSessionStatistics data={workSessionData} />
        </TabsContent>

        {/* Examination Tab */}
        <TabsContent value="examination" className="space-y-6">
          <ChartExaminationStatistics 
            data={examinationData} 
            period={period}
            startDate={startDate}
            endDate={endDate}
          />
        </TabsContent>

        {/* Top Services Tab */}
        <TabsContent value="services" className="space-y-6">
          <ChartTopServicesStatistics data={topServicesData} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Chart-based Work Session Statistics Component
function ChartWorkSessionStatistics({ data }: { data: WorkSessionData | null }) {
  if (!data) {
    return (
      <Card className="border border-gray-200">
        <CardContent className="p-6 text-center text-gray-500">
          <p>Chưa có dữ liệu ca làm việc</p>
        </CardContent>
      </Card>
    );
  }

  const { summary, byDoctor, byTechnician } = data;

  // Prepare data for charts with all available statuses from API
  const workSessionStatusData = [
    { status: 'Hoàn thành', value: summary.completedSessions, fill: '#6EE7B7' },   // green-300
    { status: 'Đã hủy', value: summary.canceledSessions, fill: '#D1D5DB' },       // gray-300
    { status: 'Đã duyệt', value: summary.approvedSessions, fill: '#7DD3FC' },     // sky-300
    { status: 'Đang chờ', value: summary.pendingSessions, fill: '#FCD34D' },      // yellow-300
    { status: 'Đang thực hiện', value: summary.inProgressSessions || 0, fill: '#C4B5FD' } // purple-300
  ].filter(item => item.value > 0);
  // Only show statuses with data

  // Chart configuration with all possible statuses
  const workSessionConfig = {
    value: {
      label: "Số ca",
    },
    "Hoàn thành": {
      label: "Hoàn thành",
      color: "#10B981",
    },
    "Đã hủy": {
      label: "Đã hủy",
      color: "#6B7280",
    },
    "Đã duyệt": {
      label: "Đã duyệt",
      color: "#3B82F6",
    },
    "Đang chờ": {
      label: "Đang chờ",
      color: "#F59E0B",
    },
    "Đang thực hiện": {
      label: "Đang thực hiện",
      color: "#8B5CF6",
    },
  } satisfies ChartConfig;

  // Use real data from API
  const doctorDataToUse = byDoctor;

  const doctorChartData = doctorDataToUse.map(doctor => {
    const total = doctor.totalSessions || 0;
    const completed = doctor.completedSessions || 0;
    const canceled = doctor.canceledSessions || 0;
    const approved = doctor.approvedSessions || 0;
    const pending = doctor.pendingSessions || 0;
    const inProgress = doctor.inProgressSessions || 0;
    
    const result = {
      name: doctor.doctorName.length > 10 
        ? doctor.doctorName.substring(0, 6) + '...' 
        : doctor.doctorName,
      fullName: doctor.doctorName,
      completed: completed,
      canceled: canceled,
      approved: approved,
      pending: pending,
      inProgress: inProgress,
      total: total,
      completionRate: total > 0 ? (completed / total) * 100 : 0
    };
    
    console.log('Doctor chart data:', result);
    return result;
  });

  // Use real data from API
  const technicianDataToUse = byTechnician;

  const technicianChartData = technicianDataToUse.map(tech => {
    const total = tech.totalSessions || 0;
    const completed = tech.completedSessions || 0;
    const canceled = tech.canceledSessions || 0;
    const approved = tech.approvedSessions || 0;
    const pending = tech.pendingSessions || 0;
    const inProgress = tech.inProgressSessions || 0;
    
    return {
      name: tech.technicianName.length > 10 
        ? tech.technicianName.substring(0, 10) + '...' 
        : tech.technicianName,
      fullName: tech.technicianName,
      completed: completed,
      canceled: canceled,
      approved: approved,
      pending: pending,
      inProgress: inProgress,
      total: total,
      completionRate: total > 0 ? (completed / total) * 100 : 0
    };
  });

  return (
    <div className="space-y-6">
      {/* Summary */}
      <Card className="border border-gray-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-gray-600" />
            Tổng quan ca làm việc
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-900">
                {formatNumber(summary.totalSessions)}
              </div>
              <p className="text-sm text-blue-600 mt-1">Tổng ca</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-900">
                {formatNumber(summary.completedSessions)}
              </div>
              <p className="text-sm text-green-600 mt-1">Hoàn thành</p>
              <Badge variant="outline" className="text-xs bg-green-50 text-green-700 mt-1">
                {formatPercentage(summary.completedPercent)}
              </Badge>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-gray-900">
                {formatNumber(summary.canceledSessions)}
              </div>
              <p className="text-sm text-gray-600 mt-1">Đã hủy</p>
              <Badge variant="outline" className="text-xs bg-gray-50 text-gray-700 mt-1">
                {formatPercentage(summary.canceledPercent)}
              </Badge>
            </div>
            <div className="text-center p-4 bg-cyan-50 rounded-lg">
              <div className="text-2xl font-bold text-cyan-900">
                {formatNumber(summary.approvedSessions)}
              </div>
              <p className="text-sm text-cyan-600 mt-1">Đã duyệt</p>
              <Badge variant="outline" className="text-xs bg-cyan-50 text-cyan-700 mt-1">
                {formatPercentage(summary.totalSessions > 0 ? (summary.approvedSessions / summary.totalSessions) * 100 : 0)}
              </Badge>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <div className="text-2xl font-bold text-yellow-900">
                {formatNumber(summary.pendingSessions)}
              </div>
              <p className="text-sm text-yellow-600 mt-1">Đang chờ</p>
              <Badge variant="outline" className="text-xs bg-yellow-50 text-yellow-700 mt-1">
                {formatPercentage(summary.totalSessions > 0 ? (summary.pendingSessions / summary.totalSessions) * 100 : 0)}
              </Badge>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-900">
                {formatNumber(summary.inProgressSessions || 0)}
              </div>
              <p className="text-sm text-purple-600 mt-1">Đang thực hiện</p>
              <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700 mt-1">
                {formatPercentage(summary.totalSessions > 0 ? ((summary.inProgressSessions || 0) / summary.totalSessions) * 100 : 0)}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Work Session Status Pie Chart */}
        <Card className="border border-gray-200">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Trạng thái ca làm việc</CardTitle>
          </CardHeader>
          <CardContent>
            {workSessionStatusData.some(item => item.value > 0) ? (
              <ChartContainer
                config={workSessionConfig}
                className="mx-auto aspect-square max-h-[250px]"
              >
                <RechartsPieChart>
                  <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent hideLabel />}
                  />
                  <Pie 
                    data={workSessionStatusData} 
                    dataKey="value" 
                    nameKey="status"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                  />
                </RechartsPieChart>
              </ChartContainer>
            ) : (
              <div className="h-64 flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <Clock className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                  <p className="text-sm">Chưa có dữ liệu ca làm việc</p>
                  <p className="text-xs text-gray-400 mt-1">Vui lòng chọn khoảng thời gian khác</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Doctor Performance Chart */}
        <Card className="border border-gray-200">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Hiệu suất bác sĩ</CardTitle>
          </CardHeader>
          <CardContent>
            {doctorChartData.length > 0 ? (
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={doctorChartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="name" 
                      angle={-45}
                      textAnchor="end"
                      height={80}
                      interval={0}
                    />
                    <YAxis />
                    <Tooltip 
                      formatter={(value: number, name: string) => {
                        const labels: { [key: string]: string } = {
                          'completed': 'Hoàn thành',
                          'canceled': 'Đã hủy',
                          'approved': 'Đã duyệt',
                          'pending': 'Đang chờ',
                          'inProgress': 'Đang thực hiện',
                          'total': 'Tổng ca'
                        };
                        return [value, labels[name] || name];
                      }}
                      labelFormatter={(label, payload) => {
                        if (payload && payload[0]) {
                          return payload[0].payload.fullName;
                        }
                        return label;
                      }}
                    />
                    <Bar dataKey="completed" fill="#6EE7B7" name="Hoàn thành" stackId="a" />
                    <Bar dataKey="canceled" fill="#D1D5DB" name="Đã hủy" stackId="a" />
                    <Bar dataKey="approved" fill="#7DD3FC" name="Đã duyệt" stackId="a" />
                    <Bar dataKey="pending" fill="#FCD34D" name="Đang chờ" stackId="a" />
                    <Bar dataKey="inProgress" fill="#C4B5FD" name="Đang thực hiện" stackId="a" />



                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <UserCheck className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                  <p className="text-sm">Chưa có dữ liệu hiệu suất bác sĩ</p>
                  <p className="text-xs text-gray-400 mt-1">Vui lòng chọn khoảng thời gian khác</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Technician Performance Chart */}
        <Card className="border border-gray-200">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Hiệu suất kỹ thuật viên</CardTitle>
          </CardHeader>
          <CardContent>
            {technicianChartData.length > 0 ? (
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={technicianChartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="name" 
                      angle={-45}
                      textAnchor="end"
                      height={80}
                      interval={0}
                    />
                    <YAxis />
                    <Tooltip 
                      formatter={(value: number, name: string) => {
                        const labels: { [key: string]: string } = {
                          'completed': 'Hoàn thành',
                          'canceled': 'Đã hủy',
                          'approved': 'Đã duyệt',
                          'pending': 'Đang chờ',
                          'inProgress': 'Đang thực hiện',
                          'total': 'Tổng ca'
                        };
                        return [value, labels[name] || name];
                      }}
                      labelFormatter={(label, payload) => {
                        if (payload && payload[0]) {
                          return payload[0].payload.fullName;
                        }
                        return label;
                      }}
                    />
                    <Bar dataKey="completed" fill="#10B981" name="completed" stackId="a" />
                    <Bar dataKey="canceled" fill="#6B7280" name="canceled" stackId="a" />
                    <Bar dataKey="approved" fill="#3B82F6" name="approved" stackId="a" />
                    <Bar dataKey="pending" fill="#F59E0B" name="pending" stackId="a" />
                    <Bar dataKey="inProgress" fill="#8B5CF6" name="inProgress" stackId="a" />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <Users className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                  <p className="text-sm">Chưa có dữ liệu hiệu suất kỹ thuật viên</p>
                  <p className="text-xs text-gray-400 mt-1">Vui lòng chọn khoảng thời gian khác</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Chart-based Examination Statistics Component
function ChartExaminationStatistics({ 
  data, 
  period, 
  startDate, 
  endDate 
}: { 
  data: ExaminationVolumeData | null;
  period?: string;
  startDate?: string;
  endDate?: string;
}) {
  // Fetch time-based examination data (always call hooks at the top level)
  const examinationsByTime = useExaminationsByTime(
    (period as 'day' | 'week' | 'month' | 'custom') || 'day',
    startDate,
    endDate,
    !!(period && (period !== 'custom' || (startDate && endDate)))
  );

  if (!data) {
    return (
      <Card className="border border-gray-200">
        <CardContent className="p-6 text-center text-gray-500">
          <p>Chưa có dữ liệu khám bệnh</p>
        </CardContent>
      </Card>
    );
  }

  const { summary, byDoctor } = data;

  // Prepare data for charts with ClinicPro colors
  const examinationOverviewData = [
    { status: 'Tổng lịch hẹn', value: summary.totalAppointments, fill: colors.primary.hex },
    { status: 'Đã hoàn thành', value: summary.completedAppointments, fill: colors.primaryLight.hex },
    { status: 'Chưa hoàn thành', value: summary.totalAppointments - summary.completedAppointments, fill: colors.primaryDark.hex }
  ];

  // Chart configuration
  const examinationConfig = {
    value: {
      label: "Số lịch hẹn",
    },
    "Tổng lịch hẹn": {
      label: "Tổng lịch hẹn",
      color: colors.primary.hex,
    },
    "Đã hoàn thành": {
      label: "Đã hoàn thành",
      color: colors.primaryLight.hex,
    },
    "Chưa hoàn thành": {
      label: "Chưa hoàn thành",
      color: colors.primaryDark.hex,
    },
  } satisfies ChartConfig;

  const doctorPerformanceData = byDoctor.map(doctor => ({
    name: doctor.doctorName.length > 10 
      ? doctor.doctorName.substring(0, 10) + '...' 
      : doctor.doctorName,
    fullName: doctor.doctorName,
    completed: doctor.completedAppointments,
    total: doctor.totalAppointments,
    avgDuration: doctor.averageDurationMinutes
  }));

  // Check if we have time-based data from API
  const hasTimeData = examinationsByTime.data && examinationsByTime.data.data.length > 0;

  return (
    <div className="space-y-6">
      {/* Summary */}
      <Card className="border border-gray-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-gray-600" />
            Tổng quan khám bệnh
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-900">
                {formatNumber(summary.totalAppointments)}
              </div>
              <p className="text-sm text-blue-600 mt-1">Tổng lịch hẹn</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-900">
                {formatNumber(summary.completedAppointments)}
              </div>
              <p className="text-sm text-green-600 mt-1">Đã hoàn thành</p>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-900">
                {formatNumber(summary.averageDurationMinutes)}
              </div>
              <p className="text-sm text-purple-600 mt-1">Thời gian TB (phút)</p>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <div className="text-2xl font-bold text-orange-900">
                {formatNumber(summary.appointmentsPerDay)}
              </div>
              <p className="text-sm text-orange-600 mt-1">Lịch hẹn/ngày</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Examination Overview Pie Chart */}
        <Card className="border border-gray-200">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Tình trạng khám bệnh</CardTitle>
          </CardHeader>
          <CardContent>
            {examinationOverviewData.some(item => item.value > 0) ? (
              <ChartContainer
                config={examinationConfig}
                className="mx-auto aspect-square max-h-[300px]"
              >
                <RechartsPieChart>
                  <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent hideLabel />}
                  />
                  <Pie 
                    data={examinationOverviewData} 
                    dataKey="value" 
                    nameKey="status"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    fill="#8884d8"
                  />
                </RechartsPieChart>
              </ChartContainer>
            ) : (
              <div className="h-80 flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <Activity className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                  <p className="text-sm">Chưa có dữ liệu khám bệnh</p>
                  <p className="text-xs text-gray-400 mt-1">Vui lòng chọn khoảng thời gian khác</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Examination Trend Chart - Show real data if available */}
        {hasTimeData ? (
          <Card className="border border-gray-200">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Xu hướng khám bệnh</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={examinationsByTime.data?.data || []}>
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
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
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
                    <Bar yAxisId="left" dataKey="totalAppointments" fill={colors.primary.hex} name="Tổng lịch hẹn" />
                    <Bar yAxisId="left" dataKey="completedAppointments" fill={colors.primaryLight.hex} name="Đã hoàn thành" />
                    <Line yAxisId="right" type="monotone" dataKey="averageDurationMinutes" stroke={colors.primaryDark.hex} strokeWidth={2} name="Thời gian TB (phút)" />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        ) : examinationsByTime.loading ? (
          <Card className="border border-gray-200">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Xu hướng khám bệnh</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="border border-gray-200">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Xu hướng khám bệnh</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80 flex items-center justify-center text-gray-500">
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

      {/* Doctor Performance Chart */}
      <Card className="border border-gray-200">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Hiệu suất bác sĩ</CardTitle>
        </CardHeader>
        <CardContent>
          {doctorPerformanceData.some(item => item.completed > 0 || item.total > 0) ? (
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={doctorPerformanceData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="name"
                    angle={-45}
                    textAnchor="end"
                    height={80}
                    interval={0}
                  />
                  <YAxis />
                  <Tooltip 
                    formatter={(value: number, name: string) => {
                      if (name === 'completed') return [value, 'Đã hoàn thành'];
                      if (name === 'total') return [value, 'Tổng lịch hẹn'];
                      if (name === 'avgDuration') return [value, 'Thời gian TB (phút)'];
                      return [value, name];
                    }}
                    labelFormatter={(label, payload) => {
                      if (payload && payload[0]) {
                        return payload[0].payload.fullName;
                      }
                      return label;
                    }}
                  />
                  <Bar dataKey="completed" fill={colors.primary.hex} name="Đã hoàn thành" />
                  <Bar dataKey="total" fill={colors.primaryLight.hex} name="Tổng lịch hẹn" />
                  <Line type="monotone" dataKey="avgDuration" stroke={colors.primaryDark.hex} strokeWidth={2} name="Thời gian TB (phút)" />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-80 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <UserCheck className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                <p className="text-sm">Chưa có dữ liệu hiệu suất bác sĩ</p>
                <p className="text-xs text-gray-400 mt-1">Vui lòng chọn khoảng thời gian khác</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Chart-based Top Services Statistics Component
function ChartTopServicesStatistics({ data }: { data: TopServicesData | null }) {
  if (!data) {
    return (
      <Card className="border border-gray-200">
        <CardContent className="p-6 text-center text-gray-500">
          <p>Chưa có dữ liệu dịch vụ</p>
        </CardContent>
      </Card>
    );
  }

  const { summary, topServices, topPackages } = data;

  // Prepare data for charts with ClinicPro colors
  const serviceRevenueData = [
    { category: 'Dịch vụ', value: summary.totalServiceRevenue, fill: colors.primary.hex },
    { category: 'Gói dịch vụ', value: summary.totalPackageRevenue, fill: colors.primaryLight.hex }
  ];

  // Chart configuration
  const serviceRevenueConfig = {
    value: {
      label: "Doanh thu",
    },
    "Dịch vụ": {
      label: "Dịch vụ",
      color: colors.primary.hex,
    },
    "Gói dịch vụ": {
      label: "Gói dịch vụ",
      color: colors.primaryLight.hex,
    },
  } satisfies ChartConfig;

  const topServicesChartData = topServices.slice(0, 8).map(service => ({
    name: service.serviceName.length > 15 
      ? service.serviceName.substring(0, 15) + '...' 
      : service.serviceName,
    fullName: service.serviceName,
    revenue: service.revenue,
    usage: service.usageCount,
    specialty: service.specialtyName
  }));

  const topPackagesChartData = topPackages.slice(0, 8).map(pkg => ({
    name: pkg.packageName.length > 15 
      ? pkg.packageName.substring(0, 15) + '...' 
      : pkg.packageName,
    fullName: pkg.packageName,
    revenue: pkg.revenue,
    usage: pkg.usageCount
  }));

  return (
    <div className="space-y-6">
      {/* Summary */}
      <Card className="border border-gray-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PieChart className="h-5 w-5 text-gray-600" />
            Tổng quan dịch vụ
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-900">
                {formatCurrency(summary.totalServiceRevenue)}
              </div>
              <p className="text-sm text-blue-600 mt-1">Doanh thu dịch vụ</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-900">
                {formatCurrency(summary.totalPackageRevenue)}
              </div>
              <p className="text-sm text-green-600 mt-1">Doanh thu gói</p>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-900">
                {formatNumber(summary.totalServiceUsage)}
              </div>
              <p className="text-sm text-purple-600 mt-1">Sử dụng dịch vụ</p>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <div className="text-2xl font-bold text-orange-900">
                {formatNumber(summary.totalPackageUsage)}
              </div>
              <p className="text-sm text-orange-600 mt-1">Sử dụng gói</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Revenue Distribution */}
      <Card className="border border-gray-200">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Phân bố doanh thu</CardTitle>
        </CardHeader>
        <CardContent>
          {serviceRevenueData.some(item => item.value > 0) ? (
            <ChartContainer
              config={serviceRevenueConfig}
              className="mx-auto aspect-square max-h-[300px]"
            >
              <RechartsPieChart>
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent hideLabel />}
                />
                <Pie 
                  data={serviceRevenueData} 
                  dataKey="value" 
                  nameKey="category"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  fill="#8884d8"
                />
              </RechartsPieChart>
            </ChartContainer>
          ) : (
            <div className="h-80 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <TrendingUp className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                <p className="text-sm">Chưa có dữ liệu doanh thu dịch vụ</p>
                <p className="text-xs text-gray-400 mt-1">Vui lòng chọn khoảng thời gian khác</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Top Services and Packages Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Services Chart */}
        <Card className="border border-gray-200">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Dịch vụ phổ biến</CardTitle>
          </CardHeader>
          <CardContent>
            {topServicesChartData.some(item => item.revenue > 0 || item.usage > 0) ? (
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={topServicesChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip 
                      formatter={(value: number, name: string) => {
                        if (name === 'revenue') return [formatCurrency(value), 'Doanh thu'];
                        if (name === 'usage') return [value, 'Lần sử dụng'];
                        return [value, name];
                      }}
                      labelFormatter={(label, payload) => {
                        if (payload && payload[0]) {
                          return payload[0].payload.fullName;
                        }
                        return label;
                      }}
                    />
                    <Bar yAxisId="left" dataKey="revenue" fill={colors.primary.hex} />
                    <Line yAxisId="right" type="monotone" dataKey="usage" stroke={colors.primaryLight.hex} strokeWidth={2} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-80 flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <BarChart3 className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                  <p className="text-sm">Chưa có dữ liệu dịch vụ phổ biến</p>
                  <p className="text-xs text-gray-400 mt-1">Vui lòng chọn khoảng thời gian khác</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Packages Chart */}
        <Card className="border border-gray-200">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Gói dịch vụ phổ biến</CardTitle>
          </CardHeader>
          <CardContent>
            {topPackagesChartData.some(item => item.revenue > 0 || item.usage > 0) ? (
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={topPackagesChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip 
                      formatter={(value: number, name: string) => {
                        if (name === 'revenue') return [formatCurrency(value), 'Doanh thu'];
                        if (name === 'usage') return [value, 'Lần sử dụng'];
                        return [value, name];
                      }}
                      labelFormatter={(label, payload) => {
                        if (payload && payload[0]) {
                          return payload[0].payload.fullName;
                        }
                        return label;
                      }}
                    />
                    <Bar yAxisId="left" dataKey="revenue" fill={colors.primaryDark.hex} />
                    <Line yAxisId="right" type="monotone" dataKey="usage" stroke={colors.secondary.hex} strokeWidth={2} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-80 flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <PieChart className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                  <p className="text-sm">Chưa có dữ liệu gói dịch vụ phổ biến</p>
                  <p className="text-xs text-gray-400 mt-1">Vui lòng chọn khoảng thời gian khác</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

