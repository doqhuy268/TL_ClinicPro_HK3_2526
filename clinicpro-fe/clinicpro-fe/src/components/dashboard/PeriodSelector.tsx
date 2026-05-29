"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar, Clock } from "lucide-react";
import { PeriodType } from "@/lib/types/statistics";

interface PeriodSelectorProps {
  period: PeriodType;
  customStartDate: string;
  customEndDate: string;
  onPeriodChange: (period: PeriodType) => void;
  onCustomDateChange: (startDate: string, endDate: string) => void;
  loading?: boolean;
}

export function PeriodSelector({
  period,
  customStartDate,
  customEndDate,
  onPeriodChange,
  onCustomDateChange,
  loading = false
}: PeriodSelectorProps) {
  const periods: { value: PeriodType; label: string }[] = [
    { value: 'day', label: 'Hôm nay' },
    { value: 'week', label: 'Tuần này' },
    { value: 'month', label: 'Tháng này' },
    { value: 'custom', label: 'Tùy chỉnh' },
  ];

  const handleCustomStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onCustomDateChange(e.target.value, customEndDate);
  };

  const handleCustomEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onCustomDateChange(customStartDate, e.target.value);
  };

  const handlePeriodChange = (newPeriod: PeriodType) => {
    onPeriodChange(newPeriod);
    
    // Khi chọn "Tùy chỉnh", tự động set ngày mặc định
    if (newPeriod === 'custom' && (!customStartDate || !customEndDate)) {
      const today = new Date();
      const lastWeek = new Date();
      lastWeek.setDate(today.getDate() - 7);
      
      const formatDate = (date: Date) => {
        return date.toISOString().split('T')[0];
      };
      
      onCustomDateChange(formatDate(lastWeek), formatDate(today));
    }
  };

  return (
    <Card className="border border-gray-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-gray-600" />
          Chọn khoảng thời gian
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Period Buttons */}
          <div className="flex flex-wrap gap-2">
            {periods.map((p) => (
              <Button
                key={p.value}
                variant={period === p.value ? "default" : "outline"}
                size="sm"
                onClick={() => handlePeriodChange(p.value)}
                disabled={loading}
                className={period === p.value ? "bg-[#0F766E] hover:bg-[#0F766E]" : ""}
              >
                {p.label}
              </Button>
            ))}
          </div>

          {/* Custom Date Range - Enhanced UI */}
          {period === 'custom' && (
            <div className="space-y-3">
              <Label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Chọn khoảng thời gian tùy chỉnh
              </Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 rounded-xl border shadow-sm">
                <div className="space-y-3">
                  <Label htmlFor="start-date" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    Từ ngày
                  </Label>
                  <div className="relative">
                    <Input
                      id="start-date"
                      type="date"
                      value={customStartDate}
                      onChange={handleCustomStartDateChange}
                      disabled={loading}
                      className="w-full h-12 pl-4 pr-4 border-2 border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all duration-300 shadow-sm hover:shadow-md rounded-lg bg-white"
                    />
                    <div className="absolute inset-y-0 right-3 flex items-center pr-3 pointer-events-none">
                      <Calendar className="h-5 w-5 text-gray-400" />
                    </div>
                  </div>
                </div>
                <div className="space-y-3">
                  <Label htmlFor="end-date" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
                    Đến ngày
                  </Label>
                  <div className="relative">
                    <Input
                      id="end-date"
                      type="date"
                      value={customEndDate}
                      onChange={handleCustomEndDateChange}
                      disabled={loading}
                      className="w-full h-12 pl-4 pr-4 border-2 border-gray-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all duration-300 shadow-sm hover:shadow-md rounded-lg bg-white"
                    />
                    <div className="absolute inset-y-0 right-3 flex items-center pr-3 pointer-events-none">
                      <Calendar className="h-5 w-5 text-gray-400" />
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Quick Preset Buttons */}
              <div className="space-y-3">
                <Label className="text-sm font-medium text-gray-600">Chọn nhanh:</Label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { label: '7 ngày qua', days: 7 },
                    { label: '30 ngày qua', days: 30 },
                    { label: '3 tháng qua', days: 90 },
                    { label: '6 tháng qua', days: 180 }
                  ].map((preset) => (
                    <Button
                      key={preset.days}
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const today = new Date();
                        const startDate = new Date();
                        startDate.setDate(today.getDate() - preset.days);
                        
                        const formatDate = (date: Date) => {
                          return date.toISOString().split('T')[0];
                        };
                        
                        onCustomDateChange(formatDate(startDate), formatDate(today));
                      }}
                      disabled={loading}
                      className="text-xs border-gray-300  transition-all duration-200"
                    >
                      {preset.label}
                    </Button>
                  ))}
                </div>
              </div>
              
              {/* Date Range Preview */}
              {customStartDate && customEndDate && (
                <div className="p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <Calendar className="h-5 w-5 text-blue-500" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-800">Khoảng thời gian đã chọn</p>
                        <p className="text-sm text-gray-600">
                          {new Date(customStartDate).toLocaleDateString('vi-VN')} - {new Date(customEndDate).toLocaleDateString('vi-VN')}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500">Tổng số ngày</p>
                      <p className="text-lg font-semibold text-blue-500">
                        {Math.ceil((new Date(customEndDate).getTime() - new Date(customStartDate).getTime()) / (1000 * 60 * 60 * 24)) + 1}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Current Selection Display */}
         
        </div>
      </CardContent>
    </Card>
  );
}
