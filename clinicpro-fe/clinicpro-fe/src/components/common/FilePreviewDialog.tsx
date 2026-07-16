'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download, X, FileText, Image as ImageIcon, File, Loader2 } from 'lucide-react';

interface FilePreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fileUrl: string;
  fileName?: string;
}

export function FilePreviewDialog({
  open,
  onOpenChange,
  fileUrl,
  fileName,
}: FilePreviewDialogProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Reset loading và error khi dialog mở hoặc fileUrl thay đổi
  useEffect(() => {
    if (open && fileUrl) {
      setLoading(true);
      setError(null);
    }
  }, [open, fileUrl]);

  // Xác định loại file từ URL hoặc fileName
  const getFileType = (url: string, name?: string): 'pdf' | 'image' | 'document' | 'other' => {
    const file = name || url;
    const extension = file.split('.').pop()?.toLowerCase() || '';
    
    if (['pdf'].includes(extension)) {
      return 'pdf';
    }
    
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg'].includes(extension)) {
      return 'image';
    }
    
    if (['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt'].includes(extension)) {
      return 'document';
    }
    
    return 'other';
  };

  const fileType = getFileType(fileUrl, fileName);
  const displayName = fileName || fileUrl.split('/').pop() || 'File';

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = fileUrl;
    link.download = displayName;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleOpenInNewTab = () => {
    window.open(fileUrl, '_blank', 'noopener,noreferrer');
  };

  // Lấy icon phù hợp với loại file
  const getFileIcon = () => {
    const extension = (fileName || fileUrl).split('.').pop()?.toLowerCase() || '';
    
    if (['pdf'].includes(extension)) {
      return <FileText className="h-5 w-5 text-red-500" />;
    }
    
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg'].includes(extension)) {
      return <ImageIcon className="h-5 w-5 text-green-500" />;
    }
    
    if (['doc', 'docx'].includes(extension)) {
      return <FileText className="h-5 w-5 text-blue-500" />;
    }
    
    if (['xls', 'xlsx'].includes(extension)) {
      return <FileText className="h-5 w-5 text-green-600" />;
    }
    
    return <File className="h-5 w-5 text-gray-500" />;
  };

  // Rút gọn tên file để hiển thị
  const getShortFileName = (name: string) => {
    if (name.length <= 30) return name;
    const ext = name.split('.').pop();
    const nameWithoutExt = name.substring(0, name.lastIndexOf('.'));
    if (nameWithoutExt.length <= 20) return name;
    return `${nameWithoutExt.substring(0, 20)}...${ext ? '.' + ext : ''}`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] w-[95vw] max-h-[95vh] h-[95vh] p-0 flex flex-col" showCloseButton={false}>
        <DialogHeader className="px-6 pt-4 pb-3 border-b flex-shrink-0">
          <div className="flex items-center justify-between gap-4">
            <DialogTitle className="flex items-center gap-2 min-w-0 flex-1">
              {getFileIcon()}
              <span className="truncate" title={displayName}>
                {getShortFileName(displayName)}
              </span>
            </DialogTitle>
            <div className="flex items-center gap-2 flex-shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownload}
                className="flex items-center gap-1.5"
                title="Tải xuống file"
              >
                <Download className="h-4 w-4" />
                <span className="hidden sm:inline">Tải xuống</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleOpenInNewTab}
                className="flex items-center gap-1.5"
                title="Mở trong tab mới"
              >
                <span className="hidden sm:inline">Mở tab mới</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onOpenChange(false)}
                className="h-8 w-8 p-0"
                title="Đóng"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>
        
        <div className="flex-1 overflow-auto p-2 bg-gray-50 min-h-0">
          {fileType === 'pdf' && (
            <div className="w-full h-full min-h-[calc(95vh-120px)] relative">
              {loading && (
                <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75 z-10">
                  <div className="flex flex-col items-center gap-2">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                    <span className="text-sm text-gray-600">Đang tải file PDF...</span>
                  </div>
                </div>
              )}
              {error && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-white z-10">
                  <File className="h-12 w-12 text-gray-400 mb-4" />
                  <p className="text-gray-600 mb-4">{error}</p>
                  <Button onClick={handleOpenInNewTab} variant="outline">
                    Mở trong tab mới
                  </Button>
                </div>
              )}
              <iframe
                src={fileUrl}
                className="w-full h-full border-0 rounded-lg"
                onLoad={() => setLoading(false)}
                onError={() => {
                  setLoading(false);
                  setError('Không thể tải file PDF. Vui lòng thử mở trong tab mới.');
                }}
                title={displayName}
              />
            </div>
          )}

          {fileType === 'image' && (
            <div className="flex items-center justify-center relative w-full h-full min-h-[calc(95vh-120px)]">
              {loading && (
                <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75 z-10">
                  <div className="flex flex-col items-center gap-2">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                    <span className="text-sm text-gray-600">Đang tải hình ảnh...</span>
                  </div>
                </div>
              )}
              {error && (
                <div className="flex flex-col items-center justify-center min-h-[400px]">
                  <ImageIcon className="h-12 w-12 text-gray-400 mb-4" />
                  <p className="text-gray-600 mb-4">{error}</p>
                  <Button onClick={handleOpenInNewTab} variant="outline">
                    Mở trong tab mới
                  </Button>
                </div>
              )}
              {!error && (
                <Image
                  src={fileUrl}
                  alt={displayName}
                  width={800}
                  height={600}
                  className="max-w-full max-h-[calc(95vh-140px)] w-auto h-auto object-contain rounded-lg shadow-lg"
                  onLoad={() => setLoading(false)}
                  onError={() => {
                    setLoading(false);
                    setError('Không thể tải hình ảnh. Vui lòng thử mở trong tab mới.');
                  }}
                  unoptimized
                />
              )}
            </div>
          )}

          {(fileType === 'document' || fileType === 'other') && (
            <div className="flex flex-col items-center justify-center min-h-[400px]">
              <File className="h-16 w-16 text-gray-400 mb-4" />
              <p className="text-gray-600 mb-2">Không thể xem trực tiếp loại file này</p>
              <p className="text-sm text-gray-500 mb-6">{displayName}</p>
              <div className="flex gap-2">
                <Button onClick={handleDownload} className="flex items-center gap-2">
                  <Download className="h-4 w-4" />
                  Tải xuống
                </Button>
                <Button onClick={handleOpenInNewTab} variant="outline" className="flex items-center gap-2">
                  Mở trong tab mới
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

