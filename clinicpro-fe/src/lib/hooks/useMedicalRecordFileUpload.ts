'use client';

import { useState, useCallback } from 'react';
import { Attachment } from '@/lib/types/medical-record';

interface UseMedicalRecordFileUploadReturn {
  files: File[];
  attachments: Attachment[];
  isUploading: boolean;
  error: string | null;
  addFiles: (newFiles: File[]) => void;
  removeFile: (index: number) => void;
  removeAttachment: (index: number) => void;
  clearFiles: () => void;
  clearError: () => void;
  setAttachments: (attachments: Attachment[]) => void;
}

export function useMedicalRecordFileUpload(): UseMedicalRecordFileUploadReturn {
  const [files, setFiles] = useState<File[]>([]);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addFiles = useCallback((newFiles: File[]) => {
    setError(null);
    
    // Validate files
    const validFiles: File[] = [];
    const errors: string[] = [];
    
    newFiles.forEach(file => {
      // Check file size (max 10MB)
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxSize) {
        errors.push(`File "${file.name}" vượt quá kích thước tối đa 10MB`);
        return;
      }
      
      // Check file type
      const allowedTypes = [
        'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/bmp',
        'application/pdf',
        'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'text/plain'
      ];
      
      if (!allowedTypes.includes(file.type)) {
        errors.push(`File "${file.name}" không được hỗ trợ. Chỉ hỗ trợ: hình ảnh, PDF, Word, Excel, Text`);
        return;
      }
      
      // Check if file already exists
      const exists = files.some(existingFile => 
        existingFile.name === file.name && existingFile.size === file.size
      );
      
      if (exists) {
        errors.push(`File "${file.name}" đã được thêm rồi`);
        return;
      }
      
      validFiles.push(file);
    });
    
    if (errors.length > 0) {
      setError(errors.join('\n'));
    }
    
    if (validFiles.length > 0) {
      setFiles(prev => [...prev, ...validFiles]);
    }
  }, [files]);

  const removeFile = useCallback((index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  }, []);

  const removeAttachment = useCallback((index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  }, []);

  const clearFiles = useCallback(() => {
    setFiles([]);
    setError(null);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const setAttachmentsCallback = useCallback((newAttachments: Attachment[]) => {
    setAttachments(newAttachments);
  }, []);

  return {
    files,
    attachments,
    isUploading,
    error,
    addFiles,
    removeFile,
    removeAttachment,
    clearFiles,
    clearError,
    setAttachments: setAttachmentsCallback,
  };
}
