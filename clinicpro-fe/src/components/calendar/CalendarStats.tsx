'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  CalendarPlus,
  CheckCircle,
  Clock,
  Users,
  TrendingUp,
  Activity,
  X,
} from 'lucide-react';
import { WorkSession, Service } from '@/lib/types/work-session';

interface CalendarStatsProps {
  workSessions: WorkSession[];
  services: Service[];
  showOnlyStats?: boolean;
  showOnlyServices?: boolean;
  showOnlyStatus?: boolean;
}

export function CalendarStats({ 
  workSessions, 
  services, 
  showOnlyStats = false,
  showOnlyServices = false,
  showOnlyStatus = false 
}: CalendarStatsProps) {
  const getStatistics = () => {
    const pending = workSessions.filter(s => s.status === 'PENDING').length;
    const approved = workSessions.filter(s => s.status === 'APPROVED').length;
    const rejected = workSessions.filter(s => s.status === 'CANCELED').length;
    const total = workSessions.length;
    
    // Calculate today's sessions
    const today = new Date().toISOString().split('T')[0];
    const todaySessions = workSessions.filter(s => 
      new Date(s.startTime).toISOString().split('T')[0] === today
    ).length;
    
    return { pending, approved, rejected, total, todaySessions };
  };

  const stats = getStatistics();

  const statCards = [
    {
      title: 'Tổng ca làm việc',
      value: stats.total,
      icon: Users,
      color: '#0F766E',
      bgColor: '#f0fffe',
      description: 'Tổng số ca đã đăng ký'
    },
    {
      title: 'Hôm nay',
      value: stats.todaySessions,
      icon: Activity,
      color: '#10b981',
      bgColor: '#f0fdf4',
      description: 'Ca làm việc hôm nay'
    },
    {
      title: 'Chờ duyệt',
      value: stats.pending,
      icon: Clock,
      color: '#f59e0b',
      bgColor: '#fffbeb',
      description: 'Đang chờ phê duyệt'
    },
    {
      title: 'Đã duyệt',
      value: stats.approved,
      icon: CheckCircle,
      color: '#059669',
      bgColor: '#ecfdf5',
      description: 'Đã được phê duyệt'
    },
    {
      title: 'Đã hủy',
      value: stats.rejected,
      icon: X,
      color: '#ef4444',
      bgColor: '#fef2f2',
      description: 'Các ca đã bị hủy'
    },
  ];

  // Show only statistics (sidebar)
  if (showOnlyStats) {
    return (
      <div className=" grid grid-cols-5 gap-3">
        {statCards.map((stat, index) => {
          const IconComponent = stat.icon;
          return (
            <Card 
              key={index} 
              className="border shadow-sm hover:shadow-md transition-shadow"
              style={{ backgroundColor: stat.bgColor }}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      {stat.title}
                    </p>
                    <p className="text-2xl font-bold text-gray-900">
                      {stat.value}
                    </p>
                  </div>
                  <div 
                    className="p-2 rounded-lg"
                    style={{ backgroundColor: stat.color }}
                  >
                    <IconComponent className="h-5 w-5 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    );
  }

  // Show only services (bottom left)
  if (showOnlyServices) {
    return (
      <Card className="border shadow-sm">
        <CardContent className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 rounded-lg bg-[#0F766E]">
              <CalendarPlus className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Dịch vụ khả dụng</h3>
              <p className="text-sm text-gray-600">Các dịch vụ có thể đăng ký ca làm việc</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-3xl font-bold text-gray-900">{services?.length || 0}</span>
            <span className="text-lg text-gray-600">dịch vụ</span>
          </div>
          <div className="mt-4 text-sm text-gray-500">
            Bao gồm các dịch vụ khám bệnh, xét nghiệm và điều trị
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show only status (bottom right)
  if (showOnlyStatus) {
    return (
      <Card className="border shadow-sm">
        <CardContent className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 rounded-lg bg-gray-500">
              <TrendingUp className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Trạng thái lịch làm việc</h3>
              <p className="text-sm text-gray-600">Chú thích màu sắc và ý nghĩa</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Badge
              variant="outline"
              className="w-28 justify-center py-3 bg-yellow-50 border-yellow-300 text-yellow-700 font-medium"
            >
              <Clock className="h-4 w-4 mr-2" />
              Chờ duyệt
            </Badge>
            <Badge
              variant="outline"
              className="w-28 justify-center py-3 bg-blue-50 border-blue-300 text-blue-400 font-medium"
            >
              <Activity className="h-4 w-4 mr-2" />
              Đã duyệt
            </Badge>
            <Badge
              variant="outline"
              className="w-28 justify-center py-3 bg-red-50 border-red-300 text-red-700 font-medium"
            >
              <X className="h-4 w-4 mr-2" />
              Đã hủy
            </Badge>
            <Badge
              variant="outline"
              className="w-28 justify-center py-3 bg-green-50 border-green-300 text-green-500 font-medium"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Hoàn thành
            </Badge>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Default: show all (backward compatibility)
  return (
    <div className="space-y-4">
      {/* Main Statistics - Stacked for sidebar */}
      <div className="space-y-3">
        {statCards.map((stat, index) => {
          const IconComponent = stat.icon;
          return (
            <Card 
              key={index} 
              className="border shadow-sm hover:shadow-md transition-shadow"
              style={{ backgroundColor: stat.bgColor }}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between ">
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      {stat.title}
                    </p>
                    <p className="text-2xl font-bold text-gray-900">
                      {stat.value}
                    </p>
                  </div>
                  <div 
                    className="p-2 rounded-lg"
                    style={{ backgroundColor: stat.color }}
                  >
                    <IconComponent className="h-5 w-5 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Services Overview */}
      <Card className="border shadow-sm">
        <CardContent className="p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg bg-[#0F766E]">
              <CalendarPlus className="h-4 w-4 text-white" />
            </div>
            <div>
              <h3 className="font-medium text-gray-900">Dịch vụ khả dụng</h3>
              <p className="text-sm text-gray-600">{services?.length || 0} dịch vụ</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Status Legend */}
      <Card className="border shadow-sm">
        <CardContent className="p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg bg-gray-500">
              <TrendingUp className="h-4 w-4 text-white" />
            </div>
            <div>
              <h3 className="font-medium text-gray-900">Trạng thái</h3>
              <p className="text-sm text-gray-600">Chú thích màu sắc</p>
            </div>
          </div>
          <div className="space-y-2">
            <Badge
              variant="outline"
              className="w-full justify-center py-1 bg-yellow-50 border-yellow-300 text-yellow-700"
            >
              Chờ duyệt
            </Badge>
            <Badge
              variant="outline"
              className="w-full justify-center py-1 bg-blue-50 border-blue-300 text-blue-500"
            >
              Đã duyệt
            </Badge>
            <Badge
              variant="outline"
              className="w-full justify-center py-1 bg-red-50 border-red-300 text-red-700"
            >
              Đã hủy
            </Badge>
            <Badge
              variant="outline"
              className="w-full justify-center py-1 bg-green-50 border-green-300 text-green-400"
            >
              Đã hoàn thành
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
