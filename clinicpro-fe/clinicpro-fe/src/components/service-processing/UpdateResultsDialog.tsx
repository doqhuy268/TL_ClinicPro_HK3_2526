'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { serviceProcessingService } from '@/lib/services/service-processing.service';
import { fileStorageService } from '@/lib/services/file-storage.service';
import { PrescriptionService, UpdateServiceResultsRequest } from '@/lib/types/service-processing';
import { Upload, FileText, X, Image, File, Loader2, CheckCircle2 } from 'lucide-react';

interface UpdateResultsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  service: PrescriptionService;
  patientProfileId?: string; // Add patientProfileId prop
  onUpdate: () => void;
  shouldReschedule?: boolean; // If true, marks service as RESCHEDULED
}

export function UpdateResultsDialog({
  open,
  onOpenChange,
  service,
  patientProfileId,
  onUpdate,
  shouldReschedule = false
}: UpdateResultsDialogProps) {
  const [results, setResults] = useState<string[]>(service.results || []);
  const [note, setNote] = useState(service.note || '');
  const [updating, setUpdating] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState(false);

  // Reset form when service changes or dialog opens
  useEffect(() => {
    if (open) {
      setResults(service.results || []);
      setNote(service.note || '');
    }
  }, [open, service]);

  const handleRemoveResult = (index: number) => {
    setResults(results.filter((_, i) => i !== index));
  };

  const handleFileUpload = async (files: File[]) => {
    if (files.length === 0) return;

    setUploadingFiles(true);
    try {
      // Use patientProfileId from prop, fallback to service data
      const serviceWithExtras = service as PrescriptionService & {
        prescription?: { patientProfile?: { id?: string } };
        patientProfileId?: string;
      };
      const folderId = patientProfileId || 
                       serviceWithExtras.prescription?.patientProfile?.id || 
                       serviceWithExtras.patientProfileId || 
                       'unknown';
      
      console.log('Uploading files to bucket "results" with folder:', folderId);
      
      // Upload files using file-storage.service
      const uploadResponse = await fileStorageService.uploadMultiple(
        files,
        'results',
        folderId // folder is patientProfileId
      );
      
      console.log('Files uploaded:', uploadResponse);

      // Extract URLs from upload response
      const uploadedUrls = uploadResponse.map(file => file.url);
      
      // Add uploaded URLs to results
      setResults(prev => [...prev, ...uploadedUrls]);
      toast.success(`Đã upload ${files.length} file thành công`);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      console.error('Error uploading files:', error);
      toast.error(error.response?.data?.message || 'Không thể upload files');
    } finally {
      setUploadingFiles(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length > 0) {
      handleFileUpload(files);
    }
  };

  const handleSubmit = async () => {
    // Filter out empty results (but allow empty array)
    const filteredResults = results.filter(result => result.trim() !== '');

    setUpdating(true);
    try {
      // Get prescriptionServiceId
      const prescriptionServiceId = service.id;
      if (!prescriptionServiceId) {
        toast.error('Không tìm thấy ID dịch vụ. Vui lòng làm mới trang.');
        setUpdating(false);
        return;
      }

      // Update results - ALWAYS include shouldReschedule field
      // Allow empty results array if user only wants to add note or complete without files
      const updateData: UpdateServiceResultsRequest = {
        prescriptionServiceId,
        results: filteredResults, // Can be empty array
        shouldReschedule: shouldReschedule || false, // Explicitly set to false if not true
        ...(note.trim() && { note: note.trim() }),
      };
      
      console.log('📤 Updating results for service:', {
        prescriptionId: service.prescriptionId,
        serviceId: service.serviceId,
        resultCount: filteredResults.length,
        note: note.trim(),
        currentStatus: service.status,
        shouldReschedule: shouldReschedule
      });
      
      console.log('📤 Sending update request:', JSON.stringify(updateData, null, 2));
      
      await serviceProcessingService.updateServiceResults(updateData);

      console.log('✅ Results updated successfully');

      toast.success('Cập nhật kết quả thành công');
      onOpenChange(false);
      onUpdate();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      console.error('❌ Error updating results:', error);
      toast.error(error.response?.data?.message || 'Không thể cập nhật kết quả');
    } finally {
      setUpdating(false);
    }
  };

  const handleClose = () => {
    // Reset form when closing
    setResults(service.results || []);
    setNote(service.note || '');
    onOpenChange(false);
  };

  const getFileIcon = (url: string) => {
    const extension = url.split('.').pop()?.toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension || '')) {
      // eslint-disable-next-line jsx-a11y/alt-text
      return <Image className="h-4 w-4 text-blue-500" />;
    }
    return <File className="h-4 w-4 text-gray-500" />;
  };

  const getFileName = (url: string) => {
    return url.split('/').pop() || 'File';
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <FileText className="h-5 w-5 text-blue-600" />
            {shouldReschedule ? 'Hẹn lại dịch vụ' : 'Cập nhật kết quả'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Service Info */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-5 rounded-lg border border-blue-100">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-white rounded-lg shadow-sm">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-lg text-gray-900 mb-1">{service.service.name}</h3>
                {service.service.serviceCode && (
                  <p className="text-sm text-gray-600 mb-2">Mã dịch vụ: {service.service.serviceCode}</p>
                )}
                {service.service.description && (
                  <p className="text-sm text-gray-700">{service.service.description}</p>
                )}
              </div>
            </div>
          </div>

          {/* File Upload Section */}
          <div className="space-y-3">
            <Label className="text-base font-semibold flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Upload files kết quả
            </Label>
            
            <div className="relative">
              <input
                type="file"
                id="files"
                multiple
                accept="image/*,.pdf,.doc,.docx"
                onChange={handleFileSelect}
                className="hidden"
                disabled={uploadingFiles}
              />
              <label
                htmlFor="files"
                className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer transition-all ${
                  uploadingFiles
                    ? 'border-gray-300 bg-gray-50 opacity-50 cursor-not-allowed'
                    : 'border-blue-300 bg-blue-50 hover:bg-blue-100 hover:border-blue-400'
                }`}
              >
                {uploadingFiles ? (
                  <>
                    <Loader2 className="h-8 w-8 text-blue-600 animate-spin mb-2" />
                    <p className="text-sm text-gray-600 font-medium">Đang upload...</p>
                  </>
                ) : (
                  <>
                    <Upload className="h-10 w-10 text-blue-600 mb-2" />
                    <p className="text-sm font-medium text-gray-700 mb-1">
                      <span className="text-blue-600">Click để chọn files</span> hoặc kéo thả vào đây
                    </p>
                    <p className="text-xs text-gray-500">Hỗ trợ: JPG, PNG, PDF, DOC, DOCX</p>
                  </>
                )}
              </label>
            </div>
          </div>

          {/* Uploaded Files Display */}
          {results.length > 0 && (
            <div className="space-y-3">
              <Label className="text-base font-semibold flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                Files đã upload ({results.length})
              </Label>
              <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                {results.map((url, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-sm transition-all group"
                  >
                    <div className="flex-shrink-0">
                      {getFileIcon(url)}
                    </div>
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 min-w-0 text-sm text-blue-600 hover:text-blue-800 hover:underline truncate font-medium"
                      title={url}
                    >
                      {getFileName(url)}
                    </a>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveResult(index)}
                      className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Note Section */}
          <div className="space-y-2">
            <Label htmlFor="note" className="text-base font-semibold">
              Ghi chú (tùy chọn)
            </Label>
            <Textarea
              id="note"
              placeholder="Nhập ghi chú về quá trình thực hiện hoặc kết quả..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={4}
              className="resize-none"
            />
          </div>
        </div>

        <DialogFooter className="gap-2 pt-4 border-t">
          <Button 
            variant="outline" 
            onClick={handleClose} 
            disabled={updating || uploadingFiles}
            className="min-w-[100px]"
          >
            Hủy
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={updating || uploadingFiles}
            className={`min-w-[150px] ${shouldReschedule ? 'bg-orange-600 hover:bg-orange-700' : 'bg-blue-600 hover:bg-blue-700'}`}
          >
            {updating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Đang cập nhật...
              </>
            ) : uploadingFiles ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Đang upload...
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4 mr-2" />
                {shouldReschedule ? 'Hẹn lại dịch vụ' : 'Cập nhật kết quả'}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

