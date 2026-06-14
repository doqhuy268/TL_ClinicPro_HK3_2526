import api from '../config';
import {
  PostResponse,
  PostsListResponse,
  PostDetailResponse,
  CategoryResponse,
  SeriesResponse,
  CreateDraftPostDto,
  UpdatePostDto,
  AdminPostsQueryDto,
  PublishedPostsQueryDto,
  LimitedPostsQueryDto,
  CreateDraftCategoryDto,
  CreateCategoryDto,
  UpdateCategoryDto,
  CreateDraftSeriesDto,
  CreateSeriesDto,
  UpdateSeriesDto,
  CreateCommentDto,
  LikeResponse,
  CommentNode,
  PublicCategoryResponse,
  PublicSeriesResponse,
  PublicCategoryDetailResponse,
  PublicSeriesDetailResponse,
  PostSeriesResponse,
} from '../types/posts';

/**
 * Posts Service
 * Xử lý tất cả các API calls liên quan đến bài viết, categories, series
 */
export const postsService = {
  // ==================== ADMIN POST MANAGEMENT ====================

  /**
   * Tạo bản nháp bài viết mới
   * @param data - Dữ liệu bài viết (title optional)
   * @returns Promise với thông tin bài viết draft vừa tạo
   */
  createDraft: async (data: CreateDraftPostDto = {}): Promise<PostResponse> => {
    const response = await api.post<PostResponse>('/posts/admin/draft', data);
    return response.data;
  },

  /**
   * Cập nhật bài viết
   * @param postId - ID của bài viết
   * @param data - Dữ liệu cập nhật
   * @returns Promise với thông tin bài viết đã cập nhật
   */
  updatePost: async (
    postId: string,
    data: UpdatePostDto
  ): Promise<PostResponse> => {
    const response = await api.put<PostResponse>(
      `/posts/admin/${postId}`,
      data
    );
    return response.data;
  },

  /**
   * Xóa bài viết
   * @param postId - ID của bài viết cần xóa
   * @returns Promise với kết quả xóa
   */
  deletePost: async (postId: string): Promise<{ success: boolean }> => {
    const response = await api.delete<{ success: boolean }>(
      `/posts/admin/${postId}`
    );
    return response.data;
  },

  /**
   * Lấy thông tin chi tiết bài viết (admin)
   * @param postId - ID của bài viết
   * @returns Promise với thông tin bài viết
   */
  getPostById: async (postId: string): Promise<PostResponse> => {
    const response = await api.get<PostResponse>(`/posts/admin/${postId}`);
    return response.data;
  },

  /**
   * Lấy danh sách bài viết (admin - có thể xem tất cả status)
   * @param params - Query parameters
   * @returns Promise với danh sách bài viết và pagination
   */
  getAdminPosts: async (
    params: AdminPostsQueryDto = {}
  ): Promise<PostsListResponse> => {
    const response = await api.get<PostsListResponse>('/posts/admin', {
      params,
    });
    return response.data;
  },

  // ==================== CATEGORY MANAGEMENT ====================

  /**
   * Tạo category draft
   * @param data - Dữ liệu category (optional)
   * @returns Promise với thông tin category draft vừa tạo
   */
  createDraftCategory: async (
    data: CreateDraftCategoryDto = {}
  ): Promise<CategoryResponse> => {
    const response = await api.post<CategoryResponse>(
      '/posts/admin/categories/draft',
      data
    );
    return response.data;
  },

  /**
   * Tạo category mới
   * @param data - Dữ liệu category
   * @returns Promise với thông tin category vừa tạo
   */
  createCategory: async (
    data: CreateCategoryDto
  ): Promise<CategoryResponse> => {
    const response = await api.post<CategoryResponse>(
      '/posts/admin/categories',
      data
    );
    return response.data;
  },

  /**
   * Cập nhật category
   * @param categoryId - ID của category
   * @param data - Dữ liệu cập nhật
   * @returns Promise với thông tin category đã cập nhật
   */
  updateCategory: async (
    categoryId: string,
    data: UpdateCategoryDto
  ): Promise<CategoryResponse> => {
    const response = await api.put<CategoryResponse>(
      `/posts/admin/categories/${categoryId}`,
      data
    );
    return response.data;
  },

  /**
   * Lấy danh sách tất cả categories
   * @returns Promise với danh sách categories
   */
  getAllCategories: async (): Promise<CategoryResponse[]> => {
    const response = await api.get<CategoryResponse[]>(
      '/posts/admin/categories'
    );
    return response.data;
  },

  /**
   * Xóa category
   * @param categoryId - ID của category cần xóa
   * @returns Promise với kết quả xóa
   */
  deleteCategory: async (
    categoryId: string
  ): Promise<{ success: boolean }> => {
    const response = await api.delete<{ success: boolean }>(
      `/posts/admin/categories/${categoryId}`
    );
    return response.data;
  },

  // ==================== SERIES MANAGEMENT ====================

  /**
   * Tạo series draft
   * @param data - Dữ liệu series (optional)
   * @returns Promise với thông tin series draft vừa tạo
   */
  createDraftSeries: async (
    data: CreateDraftSeriesDto = {}
  ): Promise<SeriesResponse> => {
    const response = await api.post<SeriesResponse>(
      '/posts/admin/series/draft',
      data
    );
    return response.data;
  },

  /**
   * Tạo series mới
   * @param data - Dữ liệu series
   * @returns Promise với thông tin series vừa tạo
   */
  createSeries: async (data: CreateSeriesDto): Promise<SeriesResponse> => {
    const response = await api.post<SeriesResponse>(
      '/posts/admin/series',
      data
    );
    return response.data;
  },

  /**
   * Cập nhật series
   * @param seriesId - ID của series
   * @param data - Dữ liệu cập nhật
   * @returns Promise với thông tin series đã cập nhật
   */
  updateSeries: async (
    seriesId: string,
    data: UpdateSeriesDto
  ): Promise<SeriesResponse> => {
    const response = await api.put<SeriesResponse>(
      `/posts/admin/series/${seriesId}`,
      data
    );
    return response.data;
  },

  /**
   * Lấy danh sách tất cả series
   * @returns Promise với danh sách series
   */
  getAllSeries: async (): Promise<SeriesResponse[]> => {
    const response = await api.get<SeriesResponse[]>('/posts/admin/series');
    return response.data;
  },

  /**
   * Xóa series
   * @param seriesId - ID của series cần xóa
   * @returns Promise với kết quả xóa
   */
  deleteSeries: async (seriesId: string): Promise<{ success: boolean }> => {
    const response = await api.delete<{ success: boolean }>(
      `/posts/admin/series/${seriesId}`
    );
    return response.data;
  },

  // ==================== PUBLIC POST ENDPOINTS ====================

  /**
   * Lấy danh sách bài viết đã publish (public)
   * @param params - Query parameters
   * @returns Promise với danh sách bài viết và pagination
   */
  getPublishedPosts: async (
    params: PublishedPostsQueryDto = {}
  ): Promise<PostsListResponse> => {
    const response = await api.get<PostsListResponse>('/posts', { params });
    return response.data;
  },

  /**
   * Lấy danh sách bài viết pinned (public)
   * @param params - Query parameters
   * @returns Promise với danh sách bài viết pinned
   */
  getPinnedPosts: async (
    params: LimitedPostsQueryDto = {}
  ): Promise<PostResponse[]> => {
    const response = await api.get<PostResponse[]>('/posts/pinned', {
      params,
    });
    return response.data;
  },

  /**
   * Lấy danh sách bài viết top (mới nhất, public)
   * @param params - Query parameters
   * @returns Promise với danh sách bài viết top
   */
  getTopPosts: async (
    params: LimitedPostsQueryDto = {}
  ): Promise<PostResponse[]> => {
    const response = await api.get<PostResponse[]>('/posts/top', { params });
    return response.data;
  },

  /**
   * Lấy chi tiết bài viết theo slug (public)
   * @param slug - Slug của bài viết
   * @returns Promise với thông tin chi tiết bài viết
   */
  getPostBySlug: async (slug: string): Promise<PostDetailResponse> => {
    const response = await api.get<PostDetailResponse>(`/posts/${slug}`);
    return response.data;
  },

  // ==================== LIKE & COMMENT ====================

  /**
   * Like bài viết
   * @param postId - ID của bài viết
   * @returns Promise với kết quả like
   */
  likePost: async (postId: string): Promise<LikeResponse> => {
    const response = await api.post<LikeResponse>(`/posts/${postId}/like`);
    return response.data;
  },

  /**
   * Unlike bài viết
   * @param postId - ID của bài viết
   * @returns Promise với kết quả unlike
   */
  unlikePost: async (postId: string): Promise<LikeResponse> => {
    const response = await api.post<LikeResponse>(`/posts/${postId}/unlike`);
    return response.data;
  },

  /**
   * Tạo comment cho bài viết
   * @param postId - ID của bài viết
   * @param data - Dữ liệu comment
   * @returns Promise với thông tin comment vừa tạo
   */
  createComment: async (
    postId: string,
    data: CreateCommentDto
  ): Promise<CommentNode> => {
    const response = await api.post<CommentNode>(
      `/posts/${postId}/comments`,
      data
    );
    return response.data;
  },

  /**
   * Like comment
   * @param commentId - ID của comment
   * @returns Promise với kết quả like
   */
  likeComment: async (commentId: string): Promise<LikeResponse> => {
    const response = await api.post<LikeResponse>(
      `/posts/comments/${commentId}/like`
    );
    return response.data;
  },

  /**
   * Unlike comment
   * @param commentId - ID của comment
   * @returns Promise với kết quả unlike
   */
  unlikeComment: async (commentId: string): Promise<LikeResponse> => {
    const response = await api.delete<LikeResponse>(
      `/posts/comments/${commentId}/like`
    );
    return response.data;
  },

  // ==================== PUBLIC CATEGORY & SERIES ENDPOINTS ====================

  /**
   * Lấy danh sách categories đã publish (public)
   * @returns Promise với danh sách categories published
   */
  getPublicCategories: async (): Promise<PublicCategoryResponse[]> => {
    const response = await api.get<PublicCategoryResponse[]>('/posts/categories');
    return response.data;
  },

  /**
   * Lấy chi tiết category theo slug (public)
   * @param slug - Slug của category
   * @returns Promise với thông tin chi tiết category
   */
  getPublicCategoryBySlug: async (
    slug: string
  ): Promise<PublicCategoryDetailResponse> => {
    const response = await api.get<PublicCategoryDetailResponse>(
      `/posts/categories/${slug}`
    );
    return response.data;
  },

  /**
   * Lấy danh sách series đã publish (public)
   * @returns Promise với danh sách series published
   */
  getPublicSeries: async (): Promise<PublicSeriesResponse[]> => {
    const response = await api.get<PublicSeriesResponse[]>('/posts/series');
    return response.data;
  },

  /**
   * Lấy chi tiết series theo slug (public)
   * @param slug - Slug của series
   * @returns Promise với thông tin chi tiết series
   */
  getPublicSeriesBySlug: async (
    slug: string
  ): Promise<PublicSeriesDetailResponse> => {
    const response = await api.get<PublicSeriesDetailResponse>(
      `/posts/series/${slug}`
    );
    return response.data;
  },

  // ==================== RELATED POSTS & SERIES ====================

  /**
   * Lấy danh sách bài viết liên quan (cùng category)
   * @param postId - ID của bài viết
   * @returns Promise với danh sách bài viết liên quan (tối đa 10)
   */
  getRelatedPosts: async (postId: string): Promise<PostResponse[]> => {
    const response = await api.get<PostResponse[]>(`/posts/${postId}/related`);
    return response.data;
  },

  /**
   * Lấy danh sách series chứa bài viết
   * @param postId - ID của bài viết
   * @returns Promise với danh sách series chứa bài viết đó
   */
  getPostSeries: async (postId: string): Promise<PostSeriesResponse[]> => {
    const response = await api.get<PostSeriesResponse[]>(`/posts/${postId}/series`);
    return response.data;
  },
};

