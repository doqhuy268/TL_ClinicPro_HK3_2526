'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { AlertTriangle, X, RefreshCw } from 'lucide-react';

interface CalendarErrorDisplayProps {
  error: string;
  onClear: () => void;
  onRetry?: () => void;
}

export function CalendarErrorDisplay({ error, onClear, onRetry }: CalendarErrorDisplayProps) {
  return (
    <Card className="border-red-200 bg-red-50 shadow-sm">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-red-500 text-white">
            <AlertTriangle className="h-4 w-4" />
          </div>
          
          <div className="flex-1 space-y-2">
            <div>
              <h3 className="font-medium text-red-900">Có lỗi xảy ra</h3>
              <p className="text-red-700 text-sm mt-1">{error}</p>
            </div>
            
            <div className="flex items-center gap-2">
              {onRetry && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onRetry}
                  className="border-red-300 text-red-700 hover:bg-red-100"
                >
                  <RefreshCw className="h-3 w-3 mr-1" />
                  Thử lại
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={onClear}
                className="text-red-700 hover:bg-red-100"
              >
                <X className="h-3 w-3 mr-1" />
                Đóng
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
