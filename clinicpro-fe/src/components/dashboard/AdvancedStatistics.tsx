"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { 
  Users, 
  Activity,
  BarChart3,
  PieChart
} from "lucide-react";
import { 
  WorkSessionData, 
  ExaminationVolumeData, 
  TopServicesData,
  PatientSpendingData 
} from "@/lib/types/statistics";
import { formatCurrency, formatNumber, formatPercentage } from "@/lib/services/statistics";

interface AdvancedStatisticsProps {
  workSessionData: WorkSessionData | null;
  examinationData: ExaminationVolumeData | null;
  topServicesData: TopServicesData | null;
  patientSpendingData: PatientSpendingData | null;
  loading: boolean;
  error: string | null;
  userRole?: string;
}

export function AdvancedStatistics({
  workSessionData,
  examinationData,
  topServicesData,
  loading,
  error,
  userRole
}: AdvancedStatisticsProps) {
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
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <BarChart3 className="h-6 w-6 text-gray-600" />
        <h2 className="text-2xl font-bold text-gray-900">Thống kê nâng cao</h2>
      </div>

      <Tabs defaultValue="work-sessions" className="space-y-6">
        <TabsList className={`grid w-full ${getTabCount() === 3 ? 'grid-cols-3' : getTabCount() === 2 ? 'grid-cols-2' : 'grid-cols-1'}`}>
          {['ADMIN', 'RECEPTIONIST', 'DOCTOR', 'TECHNICIAN'].includes(userRole || '') && (
            <TabsTrigger value="work-sessions">Ca làm việc</TabsTrigger>
          )}
          {['ADMIN', 'RECEPTIONIST', 'DOCTOR'].includes(userRole || '') && (
            <TabsTrigger value="examination">Khám bệnh</TabsTrigger>
          )}
          {['ADMIN', 'RECEPTIONIST'].includes(userRole || '') && (
            <TabsTrigger value="services">Dịch vụ</TabsTrigger>
          )}
        </TabsList>

        {/* Work Sessions Tab */}
        <TabsContent value="work-sessions" className="space-y-6">
          <WorkSessionStatistics data={workSessionData} />
        </TabsContent>

        {/* Examination Tab */}
        <TabsContent value="examination" className="space-y-6">
          <ExaminationStatistics data={examinationData} />
        </TabsContent>

        {/* Top Services Tab */}
        <TabsContent value="services" className="space-y-6">
          <TopServicesStatistics data={topServicesData} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Work Session Statistics Component
function WorkSessionStatistics({ data }: { data: WorkSessionData | null }) {
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
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <div className="text-2xl font-bold text-red-900">
                {formatNumber(summary.canceledSessions)}
              </div>
              <p className="text-sm text-red-600 mt-1">Đã hủy</p>
              <Badge variant="outline" className="text-xs bg-red-50 text-red-700 mt-1">
                {formatPercentage(summary.canceledPercent)}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* By Doctor and Technician */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* By Doctor */}
        <Card className="border border-gray-200">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Theo bác sĩ</CardTitle>
          </CardHeader>
          <CardContent>
            {byDoctor.length === 0 ? (
              <p className="text-center text-gray-500 py-4">Chưa có dữ liệu</p>
            ) : (
              <div className="space-y-3">
                {byDoctor.map((doctor) => (
                  <div key={doctor.doctorId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{doctor.doctorName}</p>
                      <p className="text-sm text-gray-500">
                        {doctor.completedSessions}/{doctor.totalSessions} ca hoàn thành
                      </p>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {formatPercentage(doctor.completionRate)}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* By Technician */}
        <Card className="border border-gray-200">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Theo kỹ thuật viên</CardTitle>
          </CardHeader>
          <CardContent>
            {byTechnician.length === 0 ? (
              <p className="text-center text-gray-500 py-4">Chưa có dữ liệu</p>
            ) : (
              <div className="space-y-3">
                {byTechnician.map((tech) => (
                  <div key={tech.technicianId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{tech.technicianName}</p>
                      <p className="text-sm text-gray-500">
                        {tech.completedSessions}/{tech.totalSessions} ca hoàn thành
                      </p>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {formatPercentage(tech.completionRate)}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Examination Statistics Component
function ExaminationStatistics({ data }: { data: ExaminationVolumeData | null }) {
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

      {/* By Doctor */}
      <Card className="border border-gray-200">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Theo bác sĩ</CardTitle>
        </CardHeader>
        <CardContent>
          {byDoctor.length === 0 ? (
            <p className="text-center text-gray-500 py-4">Chưa có dữ liệu</p>
          ) : (
            <div className="space-y-3">
              {byDoctor.map((doctor) => (
                <div key={doctor.doctorId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{doctor.doctorName}</p>
                    <p className="text-sm text-gray-500">
                      {doctor.completedAppointments}/{doctor.totalAppointments} lịch hoàn thành
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">
                      {formatNumber(doctor.averageDurationMinutes)} phút
                    </p>
                    <p className="text-xs text-gray-500">Thời gian TB</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Top Services Statistics Component
function TopServicesStatistics({ data }: { data: TopServicesData | null }) {
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

      {/* Top Services and Packages */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Services */}
        <Card className="border border-gray-200">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Dịch vụ phổ biến</CardTitle>
          </CardHeader>
          <CardContent>
            {topServices.length === 0 ? (
              <p className="text-center text-gray-500 py-4">Chưa có dữ liệu</p>
            ) : (
              <div className="space-y-3">
                {topServices.slice(0, 5).map((service) => (
                  <div key={service.serviceId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{service.serviceName}</p>
                      <p className="text-sm text-gray-500">{service.specialtyName}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">
                        {formatCurrency(service.revenue)}
                      </p>
                      <p className="text-xs text-gray-500">{service.usageCount} lần</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Packages */}
        <Card className="border border-gray-200">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Gói dịch vụ phổ biến</CardTitle>
          </CardHeader>
          <CardContent>
            {topPackages.length === 0 ? (
              <p className="text-center text-gray-500 py-4">Chưa có dữ liệu</p>
            ) : (
              <div className="space-y-3">
                {topPackages.slice(0, 5).map((pkg) => (
                  <div key={pkg.packageId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{pkg.packageName}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">
                        {formatCurrency(pkg.revenue)}
                      </p>
                      <p className="text-xs text-gray-500">{pkg.usageCount} lần</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

