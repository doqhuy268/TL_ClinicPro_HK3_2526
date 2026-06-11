export type PostStatus = 'DRAFT' | 'PUBLISHED' | 'UNPUBLISHED';

export interface PostAuthor {
  id: string;
  adminCode: string;
  name: string | null;
  avatar: string | null;
}

export interface PostCategory {
  id: string;
  name: string;
  slug: string;
  description: string;
}

export interface PostSeries {
  id: string;
  name: string;
  slug: string;
  description: string;
  order: number | null;
}

export interface PostResponse {
  id: string;
  title: string;
  slug: string;
  summary: string | null;
  content: string | null;
  coverImage: string | null;
  status: PostStatus;
  isPinned: boolean;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  likesCount: number;
  commentsCount: number;
  isLike: boolean;
  categories: PostCategory[];
  series: PostSeries[];
  author: PostAuthor | null;
}

export interface PostInList {
  id: string;
  title: string;
  slug: string;
  status: PostStatus;
  isPinned: boolean;
  createdAt: string;
  updatedAt: string;
  order?: number | null;
}

export interface CategoryResponse {
  id: string;
  name: string;
  slug: string;
  description: string;
  coverImage: string | null;
  status: PostStatus;
  createdAt: string;
  updatedAt: string;
  totalPosts: number;
  posts: PostInList[];
}

export interface SeriesResponse {
  id: string;
  name: string;
  slug: string;
  description: string;
  coverImage: string | null;
  status: PostStatus;
  createdAt: string;
  updatedAt: string;
  totalPosts: number;
  posts: PostInList[];
}

export interface CommentAuthor {
  id: string;
  name: string;
  avatar: string | null;
}

export interface CommentNode {
  id: string;
  postId: string;
  parentId: string | null;
  content: string;
  isEdited: boolean;
  createdAt: string;
  updatedAt: string;
  likeCount: number;
  replyCount: number;
  likedByViewer: boolean;
  author: CommentAuthor | null;
  replies: CommentNode[];
}

export interface Pagination {
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

export interface PostsListResponse {
  items: PostResponse[];
  pagination: Pagination;
}

export interface PostDetailResponse {
  post: PostResponse;
  likedByViewer: boolean;
  comments: CommentNode[];
}

// DTOs
export interface CreateDraftPostDto {
  title?: string;
}

export interface UpdatePostDto {
  title?: string;
  summary?: string;
  content?: string;
  coverImage?: string;
  status?: PostStatus;
  isPinned?: boolean;
  tags?: string[];
  categoryIds?: string[];
  seriesAssignments?: {
    seriesId: string;
    order?: number;
  }[];
}

export interface AdminPostsQueryDto {
  status?: PostStatus;
  isPinned?: boolean;
  search?: string;
  categoryId?: string;
  seriesId?: string;
  limit?: number;
  offset?: number;
}

export interface PublishedPostsQueryDto {
  search?: string;
  categoryId?: string;
  seriesId?: string;
  limit?: number;
  offset?: number;
}

export interface LimitedPostsQueryDto {
  limit?: number;
}

export interface CreateDraftCategoryDto {
  name?: string;
  slug?: string;
  description?: string;
  coverImage?: string;
}

export interface CreateCategoryDto {
  name: string;
  slug?: string;
  description: string;
  coverImage?: string;
  postIds?: string[];
}

export interface UpdateCategoryDto {
  name?: string;
  slug?: string;
  description?: string;
  coverImage?: string;
  status?: PostStatus;
  postIds?: string[];
}

export interface CreateDraftSeriesDto {
  name?: string;
  slug?: string;
  description?: string;
  coverImage?: string;
}

export interface CreateSeriesDto {
  name: string;
  slug?: string;
  description: string;
  coverImage?: string;
  posts?: {
    postId: string;
    order?: number;
  }[];
}

export interface UpdateSeriesDto {
  name?: string;
  slug?: string;
  description?: string;
  coverImage?: string;
  status?: PostStatus;
  posts?: {
    postId: string;
    order?: number;
  }[];
}

// Public category/series types (only published)
export interface PublicCategoryResponse {
  id: string;
  name: string;
  slug: string;
  description: string;
  coverImage: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PublicSeriesResponse {
  id: string;
  name: string;
  slug: string;
  description: string;
  coverImage: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PublicCategoryDetailResponse {
  id: string;
  name: string;
  slug: string;
  description: string;
  coverImage: string | null;
  totalPosts: number;
  posts: PostResponse[];
  createdAt: string;
  updatedAt: string;
}

export interface PublicSeriesDetailResponse {
  id: string;
  name: string;
  slug: string;
  description: string;
  coverImage: string | null;
  totalPosts: number;
  posts: Array<{
    order: number | null;
    post: PostResponse;
  }>;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCommentDto {
  content: string;
  parentId?: string;
}

export interface LikeResponse {
  postId?: string;
  commentId?: string;
  liked: boolean;
  likesCount?: number;
  likeCount?: number;
}

// Post related and series responses
export interface PostSeriesResponse {
  id: string;
  name: string;
  posts: Array<{
    order: number | null;
    post: PostResponse;
  }>;
}

