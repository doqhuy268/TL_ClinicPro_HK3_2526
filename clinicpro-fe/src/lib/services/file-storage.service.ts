import api from '../config';

export interface UploadFileResponse {
  url: string;
  originalName: string;
  fileName: string;
  size: number;
  mimeType: string;
  uploadedAt: string;
}

export interface GetFileUrlResponse {
  publicUrl: string;
}

export interface DeleteManyResponse {
  deleted: string[];
  failed: string[];
}

/**
 * File Storage Service
 * Hỗ trợ upload, xóa file với Supabase Storage
 */
export const fileStorageService = {
  /**
   * Upload một file
   * @param file - File cần upload
   * @param bucket - Bucket name (profiles, results, certificates)
   * @param folder - Folder path (optional, ví dụ: 'avatars/', 'appendices/')
   * @returns Promise với thông tin file đã upload
   */
  uploadFile: async (
    file: File,
    bucket: string,
    folder?: string
  ): Promise<UploadFileResponse> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('bucket', bucket);
    if (folder) {
      formData.append('folder', folder);
    }

    const response = await api.post<UploadFileResponse>(
      '/file-storage/upload',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );

    return response.data;
  },

  /**
   * Upload nhiều file
   * @param files - Danh sách file cần upload
   * @param bucket - Bucket name
   * @param folder - Folder path (optional)
   * @returns Promise với danh sách thông tin file đã upload
   */
  uploadMultiple: async (
    files: File[],
    bucket: string,
    folder?: string
  ): Promise<UploadFileResponse[]> => {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append('files', file);
    });
    formData.append('bucket', bucket);
    if (folder) {
      formData.append('folder', folder);
    }

    const response = await api.post<UploadFileResponse[]>(
      '/file-storage/upload-multiple',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );

    return response.data;
  },

  /**
   * Lấy URL công khai của file
   * @param bucket - Bucket name
   * @param fileName - Tên file
   * @param folder - Folder path (optional)
   * @returns Promise với URL công khai
   */
  getFileUrl: async (
    bucket: string,
    fileName: string,
    folder?: string
  ): Promise<GetFileUrlResponse> => {
    const params = new URLSearchParams({ bucket, fileName });
    if (folder) {
      params.append('folder', folder);
    }

    const response = await api.get<GetFileUrlResponse>(
      `/file-storage/url?${params.toString()}`
    );

    return response.data;
  },

  /**
   * Xóa một file
   * @param fileName - Tên file cần xóa
   * @param bucket - Bucket name
   * @param folder - Folder path (optional)
   * @returns Promise với kết quả xóa
   */
  deleteFile: async (
    fileName: string,
    bucket: string,
    folder?: string
  ): Promise<{ message: string }> => {
    const params = new URLSearchParams({ bucket });
    if (folder) {
      params.append('folder', folder);
    }

    const response = await api.delete<{ message: string }>(
      `/file-storage/${fileName}?${params.toString()}`
    );

    return response.data;
  },

  /**
   * Liệt kê file trong thư mục
   * @param bucket - Bucket name
   * @param folder - Folder path (optional)
   * @returns Promise với danh sách file
   */
  listFiles: async (
    bucket: string,
    folder?: string
  ): Promise<{ files: string[] }> => {
    const params = new URLSearchParams({ bucket });
    if (folder) {
      params.append('folder', folder);
    }

    const response = await api.get<{ files: string[] }>(
      `/file-storage/list?${params.toString()}`
    );

    return response.data;
  },

  /**
   * Xóa nhiều file bằng tên/đường dẫn
   * @param bucket - Bucket name
   * @param items - Danh sách tên file hoặc path
   * @returns Promise với kết quả xóa
   */
  deleteMany: async (
    bucket: string,
    items: string[]
  ): Promise<DeleteManyResponse> => {
    const response = await api.post<DeleteManyResponse>(
      '/file-storage/delete-many',
      { bucket, items }
    );

    return response.data;
  },

  /**
   * Xóa nhiều file bằng URL công khai
   * @param urls - Danh sách URL công khai
   * @returns Promise với kết quả xóa
   */
  deleteByUrls: async (urls: string[]): Promise<DeleteManyResponse> => {
    const response = await api.post<DeleteManyResponse>(
      '/file-storage/delete-by-urls',
      { urls }
    );

    return response.data;
  },
};

