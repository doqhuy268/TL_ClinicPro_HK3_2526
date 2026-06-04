'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { postsService } from '@/lib/services/posts.service';
import { PublicSeriesDetailResponse } from '@/lib/types/posts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ChevronLeft,
  Calendar,
  Heart,
  MessageCircle,
  BookOpen,
  ListOrdered,
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { toast } from 'sonner';
import { PostResponse } from '@/lib/types/posts';

export default function SeriesDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const [series, setSeries] = useState<PublicSeriesDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSeries = async () => {
      try {
        setLoading(true);
        const data = await postsService.getPublicSeriesBySlug(slug);
        setSeries(data);
      } catch (error) {
        console.error('Failed to fetch series:', error);
        toast.error('Không thể tải series');
        router.push('/posts');
      } finally {
        setLoading(false);
      }
    };

    if (slug) {
      fetchSeries();
    }
  }, [slug, router]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const handleToggleLike = async (post: PostResponse) => {
    if (!series) return;
    
    try {
      if (post.isLike) {
        const result = await postsService.unlikePost(post.id);
        setSeries({
          ...series,
          posts: series.posts.map(item =>
            item.post.id === post.id
              ? { ...item, post: { ...item.post, isLike: false, likesCount: result.likesCount || item.post.likesCount - 1 } }
              : item
          ),
        });
      } else {
        const result = await postsService.likePost(post.id);
        setSeries({
          ...series,
          posts: series.posts.map(item =>
            item.post.id === post.id
              ? { ...item, post: { ...item.post, isLike: true, likesCount: result.likesCount || item.post.likesCount + 1 } }
              : item
          ),
        });
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

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <Skeleton className="h-8 w-24 mb-6" />
        <Skeleton className="h-12 w-3/4 mb-4" />
        <Skeleton className="h-6 w-1/2 mb-8" />
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (!series) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Back button */}
        <Link href="/posts">
          <Button variant="ghost" className="mb-6">
            <ChevronLeft className="h-4 w-4 mr-2" />
          </Button>
        </Link>

        {/* Series Header */}
        <div className="mb-8">
          {series.coverImage && (
            <div className="relative w-full h-64 mb-6 rounded-lg overflow-hidden">
              <Image
                src={series.coverImage}
                alt={series.name}
                fill
                className="object-cover"
              />
            </div>
          )}
          
          <h1 className="text-4xl font-bold mb-4">{series.name}</h1>
          <p className="text-xl text-muted-foreground mb-4">{series.description}</p>
          
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              {series.totalPosts} bài viết
            </span>
            <span className="flex items-center gap-2">
              <ListOrdered className="h-4 w-4" />
              Theo thứ tự
            </span>
          </div>
        </div>

        {/* Posts List */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-6">Danh sách bài viết trong series</h2>
          
          {series.posts.length > 0 ? (
            <div className="space-y-4">
              {series.posts.map(({ order, post }, index) => (
                <Card key={post.id} className="hover:shadow-lg transition-shadow">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {/* Order Badge */}
                    <div className="flex items-center justify-center p-6 bg-primary/5">
                      <div className="text-center">
                        <div className="text-3xl font-bold text-primary">
                          {order !== null ? order + 1 : index + 1}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          Phần {order !== null ? order + 1 : index + 1}
                        </div>
                      </div>
                    </div>

                    {/* Post Content */}
                    <div className="md:col-span-3">
                      <Link href={`/posts/${post.slug}`} className="cursor-pointer">
                        {post.coverImage && (
                          <div className="relative h-48 w-full overflow-hidden rounded-t-lg md:hidden">
                            <Image
                              src={post.coverImage}
                              alt={post.title}
                              fill
                              className="object-cover"
                            />
                          </div>
                        )}
                        
                        <CardHeader>
                          <CardTitle className="line-clamp-2">{post.title}</CardTitle>
                          {post.summary && (
                            <CardDescription className="line-clamp-2">
                              {post.summary}
                            </CardDescription>
                          )}
                        </CardHeader>
                      </Link>
                      
                      <CardContent>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatDate(post.createdAt)}
                          </span>
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleToggleLike(post);
                            }}
                            className="flex items-center gap-1 hover:text-primary transition-colors"
                          >
                            <Heart 
                              className={`h-3 w-3 ${post.isLike ? 'fill-pink-500 text-pink-500' : ''}`}
                            />
                            {post.likesCount}
                          </button>
                          <span className="flex items-center gap-1">
                            <MessageCircle className="h-3 w-3" />
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
                      </CardContent>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                Chưa có bài viết nào trong series này
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

