'use client';

import { useState, useCallback } from 'react';
import { userService } from '@/lib/services/user.service';
import { useAuth } from './useAuth';

interface UseAvatarUploadReturn {
  isUploading: boolean;
  error: string | null;
  uploadAvatar: (file: File) => Promise<boolean>;
  clearError: () => void;
}

export function useAvatarUpload(): UseAvatarUploadReturn {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { updateAvatar } = useAuth();

  const uploadAvatar = useCallback(async (file: File): Promise<boolean> => {
    try {
      setIsUploading(true);
      setError(null);

      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        throw new Error('Chỉ hỗ trợ file ảnh định dạng JPEG, PNG, GIF, WEBP');
      }

      // Validate file size (max 5MB)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        throw new Error('Kích thước file không được vượt quá 5MB');
      }

      // Upload avatar
      const response = await userService.uploadAvatar(file);
      
      // Update user avatar in auth context
      await updateAvatar(response.avatarUrl);

      return true;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || error?.message || 'Upload avatar thất bại';
      setError(errorMessage);
      return false;
    } finally {
      setIsUploading(false);
    }
  }, [updateAvatar]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    isUploading,
    error,
    uploadAvatar,
    clearError,
  };
}
