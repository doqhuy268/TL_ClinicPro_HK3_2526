'use client';

import React, { useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Paperclip, 
  Upload, 
  X, 
  FileText, 
  Image, 
  File,
  Download,
  Eye
} from 'lucide-react';
import { Attachment } from '@/lib/types/medical-record';
import { toast } from 'sonner';

interface MedicalRecordFileUploadProps {
  files: File[];
  attachments: Attachment[];
  onFilesChange: (files: File[]) => void;
  onRemoveFile: (index: number) => void;
  onRemoveAttachment: (index: number) => void;
  error?: string | null;
  disabled?: boolean;
  maxFiles?: number;
}

export function MedicalRecordFileUpload({
  files,
  attachments,
  onFilesChange,
  onRemoveFile,
  onRemoveAttachment,
  error,
  disabled = false,
  maxFiles = 10,
}: MedicalRecordFileUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files || []);
    
    if (files.length + selectedFiles.length > maxFiles) {
      toast.error(`Chỉ được phép tải lên tối đa ${maxFiles} file`);
      return;
    }
    
    onFilesChange(selectedFiles);
    
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    
    const droppedFiles = Array.from(event.dataTransfer.files);
    
    if (files.length + droppedFiles.length > maxFiles) {
      toast.error(`Chỉ được phép tải lên tối đa ${maxFiles} file`);
      return;
    }
    
    onFilesChange(droppedFiles);
  };

  const getFileIcon = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'].includes(extension || '')) {
      // eslint-disable-next-line jsx-a11y/alt-text
      return <Image className="h-4 w-4 text-green-500" />;
    }
    
    if (['pdf'].includes(extension || '')) {
      return <FileText className="h-4 w-4 text-red-500" />;
    }
    
    if (['doc', 'docx'].includes(extension || '')) {
      return <FileText className="h-4 w-4 text-blue-500" />;
    }
    
    if (['xls', 'xlsx'].includes(extension || '')) {
      return <FileText className="h-4 w-4 text-green-600" />;
    }
    
    return <File className="h-4 w-4 text-gray-500" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const totalFiles = files.length + attachments.length;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Paperclip className="h-5 w-5" />
          File đính kèm
          {totalFiles > 0 && (
            <Badge variant="secondary" className="text-xs">
              {totalFiles}/{maxFiles}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Upload Area */}
        <div
          className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
            disabled 
              ? 'border-gray-200 bg-gray-50 cursor-not-allowed' 
              : 'border-gray-300 hover:border-blue-400 cursor-pointer'
          }`}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onClick={() => !disabled && fileInputRef.current?.click()}
        >
          <div className="flex flex-col items-center gap-2">
            <div className={`p-3 rounded-full ${disabled ? 'bg-gray-200' : 'bg-blue-100'}`}>
              <Upload className={`h-6 w-6 ${disabled ? 'text-gray-400' : 'text-blue-500'}`} />
            </div>
            <div>
              <p className={`font-medium ${disabled ? 'text-gray-400' : 'text-gray-700'}`}>
                Kéo thả file vào đây hoặc click để chọn
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Hỗ trợ: Hình ảnh, PDF, Word, Excel, Text (tối đa 10MB/file)
              </p>
            </div>
          </div>
          
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
            onChange={handleFileSelect}
            className="hidden"
            disabled={disabled}
          />
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <X className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-red-700 whitespace-pre-line">{error}</div>
            </div>
          </div>
        )}

        {/* File Lists */}
        {(files.length > 0 || attachments.length > 0) && (
          <div className="space-y-3">
            {/* New Files */}
            {files.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">File mới ({files.length})</h4>
                <div className="space-y-2">
                  {files.map((file, index) => (
                    <div key={`new-${index}`} className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      {getFileIcon(file.name)}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
                        <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                      </div>
                      <Badge variant="outline" className="text-xs bg-blue-100 text-blue-700">
                        Mới
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onRemoveFile(index)}
                        className="text-gray-400 hover:text-red-500 p-1 h-6 w-6"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Existing Attachments */}
            {attachments.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">File đã có ({attachments.length})</h4>
                <div className="space-y-2">
                  {attachments.map((attachment, index) => (
                    <div key={`existing-${index}`} className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                      {getFileIcon(attachment.filename)}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{attachment.filename}</p>
                        <p className="text-xs text-gray-500">{attachment.filetype}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => window.open(attachment.url, '_blank')}
                          className="text-gray-400 hover:text-blue-500 p-1 h-6 w-6"
                        >
                          <Eye className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            const link = document.createElement('a');
                            link.href = attachment.url;
                            link.download = attachment.filename;
                            link.click();
                          }}
                          className="text-gray-400 hover:text-green-500 p-1 h-6 w-6"
                        >
                          <Download className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onRemoveAttachment(index)}
                          className="text-gray-400 hover:text-red-500 p-1 h-6 w-6"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Empty State */}
        {files.length === 0 && attachments.length === 0 && (
          <div className="text-center py-4">
            <p className="text-sm text-gray-500">Chưa có file nào được đính kèm</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
