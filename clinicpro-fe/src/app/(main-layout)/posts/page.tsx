'use client';

import { useState, useEffect } from 'react';
import { postsService } from '@/lib/services/posts.service';
import {
  PostResponse,
  PublicCategoryResponse,
  PublicSeriesResponse,
  PostsListResponse,
} from '@/lib/types/posts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Search,
  Calendar,
  Heart,
  MessageCircle,
  Pin,
  TrendingUp,
  BookOpen,
  Layers,
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { toast } from 'sonner';

export default function PostsPage() {
  // State cho các loại bài viết
  const [pinnedPosts, setPinnedPosts] = useState<PostResponse[]>([]);
  const [topPosts, setTopPosts] = useState<PostResponse[]>([]);
  const [posts, setPosts] = useState<PostsListResponse>({
    items: [],
    pagination: { total: 0, limit: 10, offset: 0, hasMore: false },
  });

  // State cho categories và series
  const [categories, setCategories] = useState<PublicCategoryResponse[]>([]);
  const [series, setSeries] = useState<PublicSeriesResponse[]>([]);

  // State cho filter
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedSeries, setSelectedSeries] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(0);

  // State cho loading
  const [loadingPinned, setLoadingPinned] = useState(true);
  const [loadingTop, setLoadingTop] = useState(true);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [loadingSeries, setLoadingSeries] = useState(true);

  // Fetch pinned posts
  useEffect(() => {
    const fetchPinnedPosts = async () => {
      try {
        setLoadingPinned(true);
        const data = await postsService.getPinnedPosts({ limit: 5 });
        setPinnedPosts(data);
      } catch (error) {
        console.error('Failed to fetch pinned posts:', error);
      } finally {
        setLoadingPinned(false);
      }
    };

    fetchPinnedPosts();
  }, []);

  // Fetch top posts
  useEffect(() => {
    const fetchTopPosts = async () => {
      try {
        setLoadingTop(true);
        const data = await postsService.getTopPosts({ limit: 5 });
        setTopPosts(data);
      } catch (error) {
        console.error('Failed to fetch top posts:', error);
      } finally {
        setLoadingTop(false);
      }
    };

    fetchTopPosts();
  }, []);

  // Fetch published posts
  useEffect(() => {
    const fetchPosts = async () => {
      try {
        setLoadingPosts(true);
        const data = await postsService.getPublishedPosts({
          search: searchQuery || undefined,
          categoryId: selectedCategory || undefined,
          seriesId: selectedSeries || undefined,
          limit: 10,
          offset: currentPage * 10,
        });
        setPosts(data);
      } catch (error) {
        console.error('Failed to fetch posts:', error);
      } finally {
        setLoadingPosts(false);
      }
    };

    fetchPosts();
  }, [searchQuery, selectedCategory, selectedSeries, currentPage]);

  // Fetch categories (public)
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoadingCategories(true);
        const data = await postsService.getPublicCategories();
        setCategories(data);
      } catch (error) {
        console.error('Failed to fetch categories:', error);
        setCategories([]);
      } finally {
        setLoadingCategories(false);
      }
    };

    fetchCategories();
  }, []);

  // Fetch series (public)
  useEffect(() => {
    const fetchSeries = async () => {
      try {
        setLoadingSeries(true);
        const data = await postsService.getPublicSeries();
        setSeries(data);
      } catch (error) {
        console.error('Failed to fetch series:', error);
        setSeries([]);
      } finally {
        setLoadingSeries(false);
      }
    };

    fetchSeries();
  }, []);

  // Handle search
  const handleSearch = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(0);
  };

  // Handle like/unlike post
  const handleToggleLike = async (post: PostResponse) => {
    try {
      if (post.isLike) {
        const result = await postsService.unlikePost(post.id);
        // Update the post in all lists
        const updatePost = (p: PostResponse) => 
          p.id === post.id ? { ...p, isLike: false, likesCount: result.likesCount || p.likesCount - 1 } : p;
        
        setPinnedPosts(prev => prev.map(updatePost));
        setTopPosts(prev => prev.map(updatePost));
        setPosts(prev => ({ ...prev, items: prev.items.map(updatePost) }));
      } else {
        const result = await postsService.likePost(post.id);
        // Update the post in all lists
        const updatePost = (p: PostResponse) => 
          p.id === post.id ? { ...p, isLike: true, likesCount: result.likesCount || p.likesCount + 1 } : p;
        
        setPinnedPosts(prev => prev.map(updatePost));
        setTopPosts(prev => prev.map(updatePost));
        setPosts(prev => ({ ...prev, items: prev.items.map(updatePost) }));
      }
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'response' in error) {
        const err = error as { response?: { status?: number } };
        if (err.response?.status === 401) {
          toast.error('Vui lòng đăng nhập để thích bài viết');
        } else {
          toast.error('Không thể thực hiện thao tác');
        }
      } else {
        toast.error('Không thể thực hiện thao tác');
      }
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Search Bar */}
      <div className="mb-8">
        <div className="flex gap-3 items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Tìm kiếm bài viết..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10 h-12 text-base"
            />
          </div>
          {(selectedCategory || selectedSeries || searchQuery) && (
            <Button
              variant="outline"
              onClick={() => {
                setSelectedCategory('');
                setSelectedSeries('');
                setSearchQuery('');
                setCurrentPage(0);
              }}
              className="h-12"
            >
              Xóa bộ lọc
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Main Content */}
        <main className="lg:col-span-9 space-y-8">
          {/* Pinned Posts Section */}
          {!loadingPinned && pinnedPosts.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-4">
                <Pin className="h-5 w-5 text-primary" />
                <h2 className="text-2xl font-bold">Bài viết ghim</h2>
              </div>
              <div className="space-y-4">
                {pinnedPosts.map((post) => (
                  <PostCard key={post.id} post={post} featured onToggleLike={handleToggleLike} />
                ))}
              </div>
            </section>
          )}

          {loadingPinned && (
            <section>
              <Skeleton className="h-8 w-48 mb-4" />
              <Skeleton className="h-64 w-full" />
            </section>
          )}

          <Separator />

          {/* Top Posts Section */}
          {!loadingTop && topPosts.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="h-5 w-5 text-primary" />
                <h2 className="text-2xl font-bold">Bài viết mới nhất</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {topPosts.map((post) => (
                  <PostCard key={post.id} post={post} compact onToggleLike={handleToggleLike} />
                ))}
              </div>
            </section>
          )}

          {loadingTop && (
            <section>
              <Skeleton className="h-8 w-48 mb-4" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Skeleton className="h-48 w-full" />
                <Skeleton className="h-48 w-full" />
              </div>
            </section>
          )}

          <Separator />

          {/* All Posts Section */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <BookOpen className="h-5 w-5 text-primary" />
              <h2 className="text-2xl font-bold">Tất cả bài viết</h2>
              {posts.pagination.total > 0 && (
                <span className="text-sm text-muted-foreground ml-2">
                  ({posts.pagination.total} bài viết)
                </span>
              )}
            </div>

            {loadingPosts ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-48 w-full" />
                ))}
              </div>
            ) : posts.items.length > 0 ? (
              <>
                <div className="space-y-4">
                  {posts.items.map((post) => (
                    <PostCard key={post.id} post={post} onToggleLike={handleToggleLike} />
                  ))}
                </div>

                {/* Pagination */}
                {posts.pagination.total > 10 && (
                  <div className="flex justify-center gap-2 mt-6">
                    <Button
                      variant="outline"
                      disabled={currentPage === 0}
                      onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
                    >
                      Trang trước
                    </Button>
                    <span className="flex items-center px-4 text-sm text-muted-foreground">
                      Trang {currentPage + 1} / {Math.ceil(posts.pagination.total / 10)}
                    </span>
                    <Button
                      variant="outline"
                      disabled={!posts.pagination.hasMore}
                      onClick={() => setCurrentPage((p) => p + 1)}
                    >
                      Trang sau
                    </Button>
                  </div>
                )}
              </>
            ) : (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  Không tìm thấy bài viết nào
                </CardContent>
              </Card>
            )}
          </section>
        </main>

        {/* Sidebar Right - Categories & Series */}
        <aside className="lg:col-span-3 space-y-6">
          {/* Categories */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Layers className="h-5 w-5" />
                Danh mục
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loadingCategories ? (
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-8 w-full" />
                  ))}
                </div>
              ) : categories.length > 0 ? (
                <ScrollArea className="h-[400px]">
                  <div className="space-y-3">
                    {categories.map((category) => (
                      <Link key={category.id} href={`/posts/categories/${category.slug}`} className="block">
                        <div className="group cursor-pointer rounded-lg border p-3 hover:border-primary hover:shadow-md transition-all">
                          <div className="flex items-center gap-3">
                            {category.coverImage && (
                              <div className="relative w-16 h-16 flex-shrink-0 rounded-md overflow-hidden">
                                <Image
                                  src={category.coverImage}
                                  alt={category.name}
                                  fill
                                  className="object-cover"
                                />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <h3 className="font-medium text-sm truncate group-hover:text-primary transition-colors">
                                {category.name}
                              </h3>
                              {category.description && (
                                <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                                  {category.description}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </ScrollArea>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Chưa có danh mục nào
                </p>
              )}
            </CardContent>
          </Card>

          {/* Series */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Series bài viết
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loadingSeries ? (
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-8 w-full" />
                  ))}
                </div>
              ) : series.length > 0 ? (
                <ScrollArea className="h-[400px]">
                  <div className="space-y-3">
                    {series.map((s) => (
                      <Link key={s.id} href={`/posts/series/${s.slug}`} className="block">
                        <div className="group cursor-pointer rounded-lg border p-3 hover:border-primary hover:shadow-md transition-all">
                          <div className="flex items-center gap-3">
                            {s.coverImage && (
                              <div className="relative w-16 h-16 flex-shrink-0 rounded-md overflow-hidden">
                                <Image
                                  src={s.coverImage}
                                  alt={s.name}
                                  fill
                                  className="object-cover"
                                />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <h3 className="font-medium text-sm truncate group-hover:text-primary transition-colors">
                                {s.name}
                              </h3>
                              {s.description && (
                                <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                                  {s.description}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </ScrollArea>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Chưa có series nào
                </p>
              )}
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}

// Post Card Component
interface PostCardProps {
  post: PostResponse;
  featured?: boolean;
  compact?: boolean;
  onToggleLike: (post: PostResponse) => void;
}

function PostCard({ post, featured = false, compact = false, onToggleLike }: PostCardProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (compact) {
    return (
      <Card className="h-full hover:shadow-lg transition-shadow">
        <Link href={`/posts/${post.slug}`} className="cursor-pointer">
          {post.coverImage && (
            <div className="relative h-40 w-full overflow-hidden rounded-t-lg">
              <Image
                src={post.coverImage}
                alt={post.title}
                fill
                className="object-cover"
              />
            </div>
          )}
          <CardHeader className="pb-3">
            <CardTitle className="text-base line-clamp-2">{post.title}</CardTitle>
            {post.summary && (
              <CardDescription className="text-sm line-clamp-2">
                {post.summary}
              </CardDescription>
            )}
          </CardHeader>
        </Link>
        <CardContent>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {formatDate(post.createdAt)}
            </span>
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onToggleLike(post);
              }}
              className="flex items-center gap-1 hover:text-primary transition-colors"
            >
              <Heart 
                className={`h-3 w-3 ${post.isLike ? 'fill-pink-500 text-pink-500' : ''}`}
              />
              {post.likesCount}
            </button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      className={`hover:shadow-lg transition-shadow ${
        featured ? 'border-primary' : ''
      }`}
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link href={`/posts/${post.slug}`} className={post.coverImage ? '' : 'md:col-span-3'}>
          {post.coverImage && (
            <div className="relative h-48 md:h-full w-full overflow-hidden rounded-l-lg cursor-pointer">
              <Image
                src={post.coverImage}
                alt={post.title}
                fill
                className="object-cover"
              />
            </div>
          )}
        </Link>
        <div className={post.coverImage ? 'md:col-span-2' : 'md:col-span-3'}>
          <Link href={`/posts/${post.slug}`}>
            <CardHeader className="cursor-pointer">
              <div className="flex items-start justify-between gap-2">
                <CardTitle className="text-xl line-clamp-2">{post.title}</CardTitle>
                {post.isPinned && (
                  <Pin className="h-4 w-4 text-primary flex-shrink-0" />
                )}
              </div>
              {post.summary && (
                <CardDescription className="line-clamp-3">
                  {post.summary}
                </CardDescription>
              )}
            </CardHeader>
          </Link>
          <CardContent>
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-3">
              <span className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {formatDate(post.createdAt)}
              </span>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onToggleLike(post);
                }}
                className="flex items-center gap-1 hover:text-primary transition-colors"
              >
                <Heart 
                  className={`h-4 w-4 ${post.isLike ? 'fill-pink-500 text-pink-500' : ''}`}
                />
                {post.likesCount}
              </button>
              <span className="flex items-center gap-1">
                <MessageCircle className="h-4 w-4" />
                {post.commentsCount}
              </span>
            </div>

              {/* Categories */}
              {post.categories && post.categories.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {post.categories.map((category) => (
                    <Badge key={category.id} variant="secondary">
                      {category.name}
                    </Badge>
                  ))}
                </div>
              )}

              {/* Tags */}
              {post.tags && post.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {post.tags.slice(0, 5).map((tag) => (
                    <Badge key={tag} variant="outline" className="text-xs">
                      #{tag}
                    </Badge>
                  ))}
                </div>
              )}

              {/* Author */}
              {post.author && (
                <div className="mt-3 text-sm text-muted-foreground">
                  Tác giả: {post.author.name || post.author.adminCode}
                </div>
              )}
            </CardContent>
          </div>
        </div>
      </Card>
  );
}

