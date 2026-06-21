"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  DollarSign,
  TrendingUp,
  CreditCard,
  Banknote,
  Smartphone
} from "lucide-react";
import { RevenueData, PaymentMethodData } from "@/lib/types/statistics";
import { formatCurrency, formatPercentage } from "@/lib/services/statistics";
import { colors } from "@/lib/colors";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Line,
  ComposedChart
} from "recharts";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

interface ChartRevenueStatisticsProps {
  data: RevenueData | null;
  loading: boolean;
  error: string | null;
}


export function ChartRevenueStatistics({ data, loading, error }: ChartRevenueStatisticsProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {Array.from({ length: 2 }).map((_, index) => (
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
    );
  }

  if (error) {
    return (
      <Card className="border border-red-200 bg-red-50">
        <CardContent className="p-6">
          <div className="flex items-center space-x-2 text-red-600">
            <DollarSign className="h-5 w-5" />
            <p className="font-medium">Lỗi tải dữ liệu doanh thu</p>
          </div>
          <p className="text-sm text-red-500 mt-1">{error}</p>
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return null;
  }

  const { overview, bySpecialty, byService } = data;

  // Prepare data for charts with ClinicPro colors
  const revenueOverviewData = [
    { category: 'Tổng doanh thu', value: overview.totalRevenue, fill: colors.primary.hex },
    { category: 'Đã thanh toán', value: overview.paidRevenue, fill: colors.primaryLight.hex },
    { category: 'Công nợ', value: overview.accountsReceivable, fill: '#F59E0B' }
  ];

  // Chart configuration
  const revenueOverviewConfig = {
    value: {
      label: "Doanh thu",
    },
    "Tổng doanh thu": {
      label: "Tổng doanh thu",
      color: colors.primary.hex,
    },
    "Đã thanh toán": {
      label: "Đã thanh toán",
      color: colors.primaryLight.hex,
    },
    "Công nợ": {
      label: "Công nợ",
      color: "#F59E0B",
    },
  } satisfies ChartConfig;

  const specialtyChartData = bySpecialty.slice(0, 8).map(specialty => ({
    name: specialty.specialtyName.length > 10 
      ? specialty.specialtyName.substring(0, 10) + '...' 
      : specialty.specialtyName,
    fullName: specialty.specialtyName,
    revenue: specialty.revenue,
    appointments: specialty.appointmentCount
  }));

  const serviceChartData = byService.slice(0, 8).map(service => ({
    name: service.serviceName.length > 10 
      ? service.serviceName.substring(0, 10) + '...' 
      : service.serviceName,
    fullName: service.serviceName,
    revenue: service.revenue,
    usage: service.usageCount
  }));

  return (
    <div className="space-y-6">
      {/* Revenue Overview */}
      <Card className="border border-gray-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-gray-600" />
            Tổng quan doanh thu
          </CardTitle>
          <CardDescription>
            Thống kê doanh thu tổng thể trong kỳ
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Total Revenue */}
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-900">
                {formatCurrency(overview.totalRevenue)}
              </div>
              <p className="text-sm text-blue-600 mt-1">Tổng doanh thu</p>
            </div>

            {/* Paid Revenue */}
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-900">
                {formatCurrency(overview.paidRevenue)}
              </div>
              <p className="text-sm text-green-600 mt-1">Đã thanh toán</p>
              <Badge variant="outline" className="text-xs bg-green-50 text-green-700 mt-1">
                {formatPercentage(overview.paidPercent)}
              </Badge>
            </div>

            {/* Accounts Receivable */}
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <div className="text-2xl font-bold text-yellow-900">
                {formatCurrency(overview.accountsReceivable)}
              </div>
              <p className="text-sm text-yellow-600 mt-1">Công nợ</p>
              <Badge variant="outline" className="text-xs bg-yellow-50 text-yellow-700 mt-1">
                {formatPercentage(overview.arPercent)}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Revenue Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue by Specialty Chart */}
        <Card className="border border-gray-200">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900">
              Doanh thu theo khoa
            </CardTitle>
            <CardDescription>
              Phân tích doanh thu theo từng khoa
            </CardDescription>
          </CardHeader>
          <CardContent>
            {bySpecialty.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p className="text-sm">Chưa có dữ liệu doanh thu theo khoa</p>
              </div>
            ) : (
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={specialtyChartData} layout="horizontal">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" width={100} />
                    <Tooltip 
                      formatter={(value: number) => [formatCurrency(value), 'Doanh thu']}
                      labelFormatter={(label, payload) => {
                        if (payload && payload[0]) {
                          return payload[0].payload.fullName;
                        }
                        return label;
                      }}
                    />
                    <Bar dataKey="revenue" fill={colors.primary.hex} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Revenue by Service Chart */}
        <Card className="border border-gray-200">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900">
              Doanh thu theo dịch vụ
            </CardTitle>
            <CardDescription>
              Top dịch vụ có doanh thu cao nhất
            </CardDescription>
          </CardHeader>
          <CardContent>
            {byService.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p className="text-sm">Chưa có dữ liệu doanh thu theo dịch vụ</p>
              </div>
            ) : (
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={serviceChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip 
                      formatter={(value: number, name: string) => {
                        if (name === 'revenue') {
                          return [formatCurrency(value), 'Doanh thu'];
                        }
                        return [value, 'Lần sử dụng'];
                      }}
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      labelFormatter={((label: any, payload: { payload: any; }[]) => {
                        if (payload && payload[0]) {
                          // eslint-disable-next-line @typescript-eslint/no-explicit-any
                          return (payload[0].payload as any).fullName;
                        }
                        return label;
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      }) as any}
                    />
                    <Bar yAxisId="left" dataKey="revenue" fill={colors.primary.hex} />
                    <Line yAxisId="right" type="monotone" dataKey="usage" stroke={colors.primaryLight.hex} strokeWidth={2} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Revenue Overview Pie Chart */}
      <Card className="border border-gray-200">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900">
            Phân bố doanh thu
          </CardTitle>
          <CardDescription>
            Tỷ lệ doanh thu đã thanh toán và công nợ
          </CardDescription>
        </CardHeader>
        <CardContent>
          {revenueOverviewData.some(item => item.value > 0) ? (
            <ChartContainer
              config={revenueOverviewConfig}
              className="mx-auto aspect-square max-h-[300px]"
            >
              <PieChart>
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent hideLabel />}
                />
                <Pie 
                  data={revenueOverviewData} 
                  dataKey="value" 
                  nameKey="category"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  fill="#8884d8"
                />
              </PieChart>
            </ChartContainer>
          ) : (
            <div className="h-80 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <DollarSign className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                <p className="text-sm">Chưa có dữ liệu doanh thu</p>
                <p className="text-xs text-gray-400 mt-1">Vui lòng chọn khoảng thời gian khác</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Payment Method Statistics Component with Charts
interface ChartPaymentMethodStatisticsProps {
  data: PaymentMethodData | null;
  loading: boolean;
  error: string | null;
}

export function ChartPaymentMethodStatistics({ data, loading, error }: ChartPaymentMethodStatisticsProps) {
  if (loading) {
    return (
      <Card className="border border-gray-200">
        <CardHeader>
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-48" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="p-4 bg-white rounded-lg">
                <Skeleton className="h-6 w-16 mb-2" />
                <Skeleton className="h-4 w-20" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !data) {
    return null;
  }

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case 'CASH':
        return <Banknote className="h-5 w-5 text-green-600" />;
      case 'CARD':
        return <CreditCard className="h-5 w-5 text-blue-600" />;
      case 'TRANSFER':
        return <TrendingUp className="h-5 w-5 text-purple-600" />;
      case 'WALLET':
        return <Smartphone className="h-5 w-5 text-orange-600" />;
      default:
        return <DollarSign className="h-5 w-5 text-gray-600" />;
    }
  };

  const getPaymentMethodLabel = (method: string) => {
    switch (method) {
      case 'CASH':
        return 'Tiền mặt';
      case 'CARD':
        return 'Thẻ';
      case 'TRANSFER':
        return 'Chuyển khoản';
      case 'WALLET':
        return 'Ví điện tử';
      default:
        return method;
    }
  };

  const getPaymentMethodColor = (method: string) => {
    switch (method) {
      case 'CASH':
        return colors.primary.hex;
      case 'CARD':
        return colors.primaryLight.hex;
      case 'TRANSFER':
        return colors.secondary.hex;
      case 'WALLET':
        return colors.primaryDark.hex;
      default:
        return '#6B7280';
    }
  };

  // Prepare data for charts
  const paymentMethodData = data.byPaymentMethod.map(method => ({
    method: getPaymentMethodLabel(method.paymentMethod),
    value: method.revenue,
    count: method.invoiceCount,
    paidPercent: method.paidPercent,
    fill: getPaymentMethodColor(method.paymentMethod)
  }));

  // Chart configuration for payment methods
  const paymentMethodConfig = {
    value: {
      label: "Doanh thu",
    },
    ...data.byPaymentMethod.reduce((config, method) => {
      const label = getPaymentMethodLabel(method.paymentMethod);
      config[label] = {
        label,
        color: getPaymentMethodColor(method.paymentMethod),
      };
      return config;
    }, {} as Record<string, { label: string; color: string }>),
  } satisfies ChartConfig;

  return (
    <div className="space-y-6">
      {/* Payment Method Overview Cards */}
      <Card className="border border-gray-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-gray-600" />
            Phương thức thanh toán
          </CardTitle>
          <CardDescription>
            Thống kê doanh thu theo phương thức thanh toán
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {data.byPaymentMethod.map((method) => (
              <div key={method.paymentMethod} className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  {getPaymentMethodIcon(method.paymentMethod)}
                  <span className="text-sm font-medium text-gray-900">
                    {getPaymentMethodLabel(method.paymentMethod)}
                  </span>
                </div>
                <div className="text-lg font-bold text-gray-900 mb-1">
                  {formatCurrency(method.revenue)}
                </div>
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>{method.invoiceCount} hóa đơn</span>
                  <Badge variant="outline" className="text-xs">
                    {formatPercentage(method.paidPercent)}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Payment Method Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Payment Method Pie Chart */}
        <Card className="border border-gray-200">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900">
              Phân bố thanh toán
            </CardTitle>
            <CardDescription>
              Tỷ lệ doanh thu theo phương thức thanh toán
            </CardDescription>
          </CardHeader>
        <CardContent>
          {paymentMethodData.some(item => item.value > 0) ? (
            <ChartContainer
              config={paymentMethodConfig}
              className="mx-auto aspect-square max-h-[300px]"
            >
              <PieChart>
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent hideLabel />}
                />
                <Pie 
                  data={paymentMethodData} 
                  dataKey="value" 
                  nameKey="method"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  fill="#8884d8"
                />
              </PieChart>
            </ChartContainer>
          ) : (
            <div className="h-80 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <CreditCard className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                <p className="text-sm">Chưa có dữ liệu phương thức thanh toán</p>
                <p className="text-xs text-gray-400 mt-1">Vui lòng chọn khoảng thời gian khác</p>
              </div>
            </div>
          )}
        </CardContent>
        </Card>

        {/* Payment Method Bar Chart */}
        <Card className="border border-gray-200">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900">
              So sánh phương thức
            </CardTitle>
            <CardDescription>
              Doanh thu và số lượng hóa đơn theo phương thức
            </CardDescription>
          </CardHeader>
          <CardContent>
            {paymentMethodData.some(item => item.value > 0) ? (
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={paymentMethodData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="method" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip 
                      formatter={(value: number, name: string) => {
                        if (name === 'value') {
                          return [formatCurrency(value), 'Doanh thu'];
                        }
                        return [value, 'Số hóa đơn'];
                      }}
                    />
                    <Bar yAxisId="left" dataKey="value" fill={colors.primary.hex} />
                    <Line yAxisId="right" type="monotone" dataKey="count" stroke={colors.primaryLight.hex} strokeWidth={2} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-80 flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <TrendingUp className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                  <p className="text-sm">Chưa có dữ liệu so sánh phương thức</p>
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

