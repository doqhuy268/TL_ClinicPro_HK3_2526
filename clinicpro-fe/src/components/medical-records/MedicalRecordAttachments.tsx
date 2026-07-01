'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Paperclip, 
  FileText, 
  Image, 
  File,
  Download,
  Eye,
  ExternalLink
} from 'lucide-react';
import { Attachment } from '@/lib/types/medical-record';

interface MedicalRecordAttachmentsProps {
  attachments: Attachment[];
  showTitle?: boolean;
  className?: string;
}

export function MedicalRecordAttachments({
  attachments,
  showTitle = true,
  className,
}: MedicalRecordAttachmentsProps) {
  if (!attachments || attachments.length === 0) {
    return null;
  }

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

  const handleDownload = (attachment: Attachment) => {
    const link = document.createElement('a');
    link.href = attachment.url;
    link.download = attachment.filename;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleView = (attachment: Attachment) => {
    window.open(attachment.url, '_blank', 'noopener,noreferrer');
  };

  return (
    <Card className={className}>
      {showTitle && (
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Paperclip className="h-5 w-5" />
            File đính kèm
            <Badge variant="secondary" className="text-xs">
              {attachments.length}
            </Badge>
          </CardTitle>
        </CardHeader>
      )}
      <CardContent className={showTitle ? 'space-y-3' : 'pt-0 space-y-3'}>
        <div className="grid grid-cols-1 gap-3">
          {attachments.map((attachment, index) => (
            <div 
              key={index} 
              className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors"
            >
              {getFileIcon(attachment.filename)}
              
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {attachment.filename}
                </p>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <span>{attachment.filetype}</span>
                </div>
              </div>
              
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleView(attachment)}
                  className="text-gray-400 hover:text-blue-500 p-1 h-7 w-7"
                  title="Xem file"
                >
                  <Eye className="h-3 w-3" />
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDownload(attachment)}
                  className="text-gray-400 hover:text-green-500 p-1 h-7 w-7"
                  title="Tải xuống"
                >
                  <Download className="h-3 w-3" />
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => window.open(attachment.url, '_blank')}
                  className="text-gray-400 hover:text-purple-500 p-1 h-7 w-7"
                  title="Mở trong tab mới"
                >
                  <ExternalLink className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
        
        {/* Summary */}
        <div className="text-xs text-gray-500 text-center pt-2 border-t">
          Tổng cộng {attachments.length} file đính kèm
        </div>
      </CardContent>
    </Card>
  );
}
