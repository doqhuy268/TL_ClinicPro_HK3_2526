'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { postsService } from '@/lib/services/posts.service';
import { PublicCategoryDetailResponse } from '@/lib/types/posts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Calendar,
  Heart,
  MessageCircle,
  BookOpen,
  ChevronLeft,
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { toast } from 'sonner';
import { PostResponse } from '@/lib/types/posts';

export default function CategoryDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const [category, setCategory] = useState<PublicCategoryDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCategory = async () => {
      try {
        setLoading(true);
        const data = await postsService.getPublicCategoryBySlug(slug);
        setCategory(data);
      } catch (error) {
        console.error('Failed to fetch category:', error);
        toast.error('Không thể tải danh mục');
        router.push('/posts');
      } finally {
        setLoading(false);
      }
    };

    if (slug) {
      fetchCategory();
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
    if (!category) return;
    
    try {
      if (post.isLike) {
        const result = await postsService.unlikePost(post.id);
        setCategory({
          ...category,
          posts: category.posts.map(p =>
            p.id === post.id
              ? { ...p, isLike: false, likesCount: result.likesCount || p.likesCount - 1 }
              : p
          ),
        });
      } else {
        const result = await postsService.likePost(post.id);
        setCategory({
          ...category,
          posts: category.posts.map(p =>
            p.id === post.id
              ? { ...p, isLike: true, likesCount: result.likesCount || p.likesCount + 1 }
              : p
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-64 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (!category) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        {/* Back button */}
        <Link href="/posts">
          <Button variant="ghost" className="mb-6">
            <ChevronLeft className="h-4 w-4 mr-2" />
          </Button>
        </Link>

        {/* Category Header */}
        <div className="mb-8">
          {category.coverImage && (
            <div className="relative w-full h-64 mb-6 rounded-lg overflow-hidden">
              <Image
                src={category.coverImage}
                alt={category.name}
                fill
                className="object-cover"
              />
            </div>
          )}
          
          <h1 className="text-4xl font-bold mb-4">{category.name}</h1>
          <p className="text-xl text-muted-foreground mb-4">{category.description}</p>
          
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              {category.totalPosts} bài viết
            </span>
          </div>
        </div>

        {/* Posts Grid */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-6">Bài viết trong danh mục</h2>
          
          {category.posts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {category.posts.map((post) => (
                <Card key={post.id} className="h-full hover:shadow-lg transition-shadow flex flex-col">
                  <Link href={`/posts/${post.slug}`} className="cursor-pointer flex-1">
                    {post.coverImage && (
                      <div className="relative h-48 w-full overflow-hidden rounded-t-lg">
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
                        <CardDescription className="line-clamp-3">
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

                    {/* Tags */}
                    {post.tags && post.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {post.tags.slice(0, 3).map((tag) => (
                          <Badge key={tag} variant="outline" className="text-xs">
                            #{tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                Chưa có bài viết nào trong danh mục này
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

