'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { postsService } from '@/lib/services/posts.service';
import { PostDetailResponse, CommentNode, PostResponse, PostSeriesResponse } from '@/lib/types/posts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Heart,
  MessageCircle,
  Calendar,
  User,
  ChevronLeft,
  Send,
  ThumbsUp,
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { toast } from 'sonner';
import { usePostSocket } from '@/lib/hooks/usePostSocket';

export default function PostDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const [postDetail, setPostDetail] = useState<PostDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [commentContent, setCommentContent] = useState('');
  const [replyTo, setReplyTo] = useState<string | null>(null); // Store comment ID to reply to
  const [submittingComment, setSubmittingComment] = useState(false);
  const [replyContents, setReplyContents] = useState<Record<string, string>>({}); // Store reply content for each comment
  
  // Related content
  const [relatedPosts, setRelatedPosts] = useState<PostResponse[]>([]);
  const [postSeries, setPostSeries] = useState<PostSeriesResponse[]>([]);
  const [loadingRelated, setLoadingRelated] = useState(false);

  useEffect(() => {
    const fetchPostDetail = async () => {
      try {
        setLoading(true);
        const data = await postsService.getPostBySlug(slug);
        setPostDetail(data);
      } catch (error) {
        console.error('Failed to fetch post detail:', error);
        toast.error('Không thể tải bài viết');
        router.push('/posts');
      } finally {
        setLoading(false);
      }
    };

    if (slug) {
      fetchPostDetail();
    }
  }, [slug, router]);

  // Fetch related posts and series
  useEffect(() => {
    const fetchRelatedContent = async () => {
      if (!postDetail?.post.id) return;

      setLoadingRelated(true);
      try {
        const [related, series] = await Promise.all([
          postsService.getRelatedPosts(postDetail.post.id).catch(() => []),
          postsService.getPostSeries(postDetail.post.id).catch(() => []),
        ]);
        setRelatedPosts(related);
        setPostSeries(series);
      } catch (error) {
        console.error('Failed to fetch related content:', error);
      } finally {
        setLoadingRelated(false);
      }
    };

    fetchRelatedContent();
  }, [postDetail?.post.id]);

  const handleLikePost = async () => {
    if (!postDetail) return;

    try {
      if (postDetail.post.isLike) {
        const result = await postsService.unlikePost(postDetail.post.id);
        setPostDetail({
          ...postDetail,
          likedByViewer: false,
          post: {
            ...postDetail.post,
            isLike: false,
            likesCount: result.likesCount || postDetail.post.likesCount - 1,
          },
        });
        toast.success('Đã bỏ thích bài viết');
      } else {
        const result = await postsService.likePost(postDetail.post.id);
        setPostDetail({
          ...postDetail,
          likedByViewer: true,
          post: {
            ...postDetail.post,
            isLike: true,
            likesCount: result.likesCount || postDetail.post.likesCount + 1,
          },
        });
        toast.success('Đã thích bài viết');
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

  const handleSubmitComment = async (parentId?: string) => {
    if (!postDetail) return;

    const content = parentId ? replyContents[parentId] : commentContent;
    if (!content?.trim()) return;

    try {
      setSubmittingComment(true);
      await postsService.createComment(postDetail.post.id, {
        content: content.trim(),
        parentId: parentId,
      });

      // Refresh post detail to get updated comments
      const updatedDetail = await postsService.getPostBySlug(slug);
      setPostDetail(updatedDetail);
      
      // Clear appropriate input
      if (parentId) {
        setReplyContents(prev => ({ ...prev, [parentId]: '' }));
        setReplyTo(null);
      } else {
        setCommentContent('');
      }
      
      toast.success('Đã thêm bình luận');
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'response' in error) {
        const err = error as { response?: { status?: number } };
        if (err.response?.status === 401) {
          toast.error('Vui lòng đăng nhập để bình luận');
        } else {
          toast.error('Không thể thêm bình luận');
        }
      } else {
        toast.error('Không thể thêm bình luận');
      }
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleLikeComment = async (commentId: string) => {
    try {
      await postsService.likeComment(commentId);
      // Refresh to get updated comment likes
      const updatedDetail = await postsService.getPostBySlug(slug);
      setPostDetail(updatedDetail);
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'response' in error) {
        const err = error as { response?: { status?: number } };
        if (err.response?.status === 401) {
          toast.error('Vui lòng đăng nhập để thích bình luận');
        }
      }
    }
  };

  const handleReply = (commentId: string) => {
    setReplyTo(commentId);
  };

  const handleCancelReply = (commentId: string) => {
    setReplyTo(null);
    setReplyContents(prev => ({ ...prev, [commentId]: '' }));
  };

  const handleReplyContentChange = (commentId: string, content: string) => {
    setReplyContents(prev => ({ ...prev, [commentId]: content }));
  };

  // Handle like/unlike for related posts
  const handleToggleLikeRelated = async (post: PostResponse) => {
    try {
      if (post.isLike) {
        const result = await postsService.unlikePost(post.id);
        setRelatedPosts(prev => prev.map(p =>
          p.id === post.id
            ? { ...p, isLike: false, likesCount: result.likesCount || p.likesCount - 1 }
            : p
        ));
      } else {
        const result = await postsService.likePost(post.id);
        setRelatedPosts(prev => prev.map(p =>
          p.id === post.id
            ? { ...p, isLike: true, likesCount: result.likesCount || p.likesCount + 1 }
            : p
        ));
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

  // Socket event handlers
  const handlePostLiked = React.useCallback((event: { postId: string; likesCount: number }) => {
    if (!postDetail) return;
    setPostDetail(prev => prev ? {
      ...prev,
      post: {
        ...prev.post,
        likesCount: event.likesCount,
      },
    } : null);
    
    // Update related posts if affected
    setRelatedPosts(prev => prev.map(p =>
      p.id === event.postId
        ? { ...p, likesCount: event.likesCount }
        : p
    ));
  }, [postDetail]);

  const handlePostUnliked = React.useCallback((event: { postId: string; likesCount: number }) => {
    if (!postDetail) return;
    setPostDetail(prev => prev ? {
      ...prev,
      post: {
        ...prev.post,
        likesCount: event.likesCount,
      },
    } : null);
    
    // Update related posts if affected
    setRelatedPosts(prev => prev.map(p =>
      p.id === event.postId
        ? { ...p, likesCount: event.likesCount }
        : p
    ));
  }, [postDetail]);

  const handleCommentCreated = React.useCallback(async () => {
    // Refresh comments to get the new comment
    if (!slug) return;
    try {
      const updatedDetail = await postsService.getPostBySlug(slug);
      setPostDetail(updatedDetail);
    } catch (error) {
      console.error('Failed to refresh comments:', error);
    }
  }, [slug]);

  const handleCommentDeleted = React.useCallback((event: { commentId: string }) => {
    if (!postDetail) return;
    // Remove deleted comment from the tree
    const removeComment = (comments: CommentNode[]): CommentNode[] => {
      return comments.filter(comment => {
        if (comment.id === event.commentId) {
          return false;
        }
        if (comment.replies && comment.replies.length > 0) {
          comment.replies = removeComment(comment.replies);
        }
        return true;
      });
    };

    setPostDetail(prev => prev ? {
      ...prev,
      comments: removeComment(prev.comments),
      post: {
        ...prev.post,
        commentsCount: Math.max(0, prev.post.commentsCount - 1),
      },
    } : null);
  }, [postDetail]);

  const handleCommentLiked = React.useCallback((event: { commentId: string; likeCount: number }) => {
    if (!postDetail) return;
    // Update like count for specific comment
    const updateCommentLikes = (comments: CommentNode[]): CommentNode[] => {
      return comments.map(comment => {
        if (comment.id === event.commentId) {
          return { ...comment, likeCount: event.likeCount };
        }
        if (comment.replies && comment.replies.length > 0) {
          return { ...comment, replies: updateCommentLikes(comment.replies) };
        }
        return comment;
      });
    };

    setPostDetail(prev => prev ? {
      ...prev,
      comments: updateCommentLikes(prev.comments),
    } : null);
  }, [postDetail]);

  const handleCommentUnliked = React.useCallback((event: { commentId: string; likeCount: number }) => {
    if (!postDetail) return;
    // Update like count for specific comment
    const updateCommentLikes = (comments: CommentNode[]): CommentNode[] => {
      return comments.map(comment => {
        if (comment.id === event.commentId) {
          return { ...comment, likeCount: event.likeCount };
        }
        if (comment.replies && comment.replies.length > 0) {
          return { ...comment, replies: updateCommentLikes(comment.replies) };
        }
        return comment;
      });
    };

    setPostDetail(prev => prev ? {
      ...prev,
      comments: updateCommentLikes(prev.comments),
    } : null);
  }, [postDetail]);

  // Setup socket connection
  usePostSocket({
    postId: postDetail?.post.id || '',
    onPostLiked: handlePostLiked,
    onPostUnliked: handlePostUnliked,
    onCommentCreated: handleCommentCreated,
    onCommentDeleted: handleCommentDeleted,
    onCommentLiked: handleCommentLiked,
    onCommentUnliked: handleCommentUnliked,
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Skeleton className="h-8 w-24 mb-6" />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8">
            <Skeleton className="h-12 w-3/4 mb-4" />
            <Skeleton className="h-6 w-1/2 mb-8" />
            <Skeleton className="h-96 w-full mb-8" />
            <div className="space-y-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          </div>
          <div className="lg:col-span-4">
            <Skeleton className="h-64 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!postDetail) {
    return null;
  }

  const { post, comments } = postDetail;

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Back button */}
      <Link href="/posts">
        <Button variant="ghost" className="mb-6">
          <ChevronLeft className="h-4 w-4 mr-2" />
        </Button>
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-8">
          <article>
          <header className="mb-8">
            <h1 className="text-4xl font-bold mb-4">{post.title}</h1>

            {post.summary && (
              <p className="text-xl text-muted-foreground mb-6">{post.summary}</p>
            )}

            {/* Meta information */}
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-6">
              <span className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                {formatDate(post.createdAt)}
              </span>
              {post.author && (
                <span className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  {post.author.name || post.author.adminCode}
                </span>
              )}
              <span className="flex items-center gap-2">
                <Heart className="h-4 w-4" />
                {post.likesCount} lượt thích
              </span>
              <span className="flex items-center gap-2">
                <MessageCircle className="h-4 w-4" />
                {post.commentsCount} bình luận
              </span>
            </div>

            {/* Categories */}
            {post.categories && post.categories.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {post.categories.map((category) => (
                  <Badge key={category.id} variant="secondary">
                    {category.name}
                  </Badge>
                ))}
              </div>
            )}

            {/* Tags */}
            {post.tags && post.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-6">
                {post.tags.map((tag) => (
                  <Badge key={tag} variant="outline">
                    #{tag}
                  </Badge>
                ))}
              </div>
            )}

            {/* Series */}
            {post.series && post.series.length > 0 && (
              <div className="mb-6">
                <p className="text-sm font-semibold mb-2">Series:</p>
                <div className="flex flex-wrap gap-2">
                  {post.series.map((s) => (
                    <Badge key={s.id} variant="default">
                      {s.name}
                      {s.order !== null && ` (Phần ${s.order})`}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </header>

          {/* Cover Image */}
          {post.coverImage && (
            <div className="relative w-full h-96 mb-8 rounded-lg overflow-hidden">
              <Image
                src={post.coverImage}
                alt={post.title}
                fill
                className="object-cover"
              />
            </div>
          )}

          {/* Content */}
          <div
            className="prose prose-lg max-w-none mb-8"
            dangerouslySetInnerHTML={{ __html: post.content || '' }}
          />

          {/* Like button */}
          <div className="flex items-center gap-4 mb-8">
            <Button
              variant={post.isLike ? 'default' : 'outline'}
              onClick={handleLikePost}
              className={`gap-2 ${post.isLike ? 'bg-pink-500 hover:bg-pink-600 border-pink-500' : ''}`}
            >
              <Heart className={`h-4 w-4 ${post.isLike ? 'fill-current' : ''}`} />
              {post.isLike ? 'Đã thích' : 'Thích'} ({post.likesCount})
            </Button>
          </div>

          <Separator className="my-8" />

          {/* Comments Section */}
          <section>
            <h2 className="text-2xl font-bold mb-6">
              Bình luận ({post.commentsCount})
            </h2>

            {/* Comment Form */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="text-lg">Viết bình luận</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  placeholder="Nhập bình luận của bạn..."
                  value={commentContent}
                  onChange={(e) => setCommentContent(e.target.value)}
                  rows={4}
                  className="mb-4"
                />
                <Button
                  onClick={() => handleSubmitComment()}
                  disabled={!commentContent.trim() || submittingComment}
                  className="gap-2"
                >
                  <Send className="h-4 w-4" />
                  {submittingComment ? 'Đang gửi...' : 'Gửi bình luận'}
                </Button>
              </CardContent>
            </Card>

            {/* Comments List */}
            <div className="space-y-4">
              {comments.map((comment) => (
                <CommentItem
                  key={comment.id}
                  comment={comment}
                  onLike={handleLikeComment}
                  onReply={handleReply}
                  replyTo={replyTo}
                  replyContents={replyContents}
                  onReplyContentChange={handleReplyContentChange}
                  onSubmitReply={handleSubmitComment}
                  onCancelReply={handleCancelReply}
                  submitting={submittingComment}
                />
              ))}

              {comments.length === 0 && (
                <Card>
                  <CardContent className="py-12 text-center text-muted-foreground">
                    Chưa có bình luận nào. Hãy là người đầu tiên bình luận!
                  </CardContent>
                </Card>
              )}
            </div>
          </section>
        </article>
        </div>

        {/* Sidebar */}
        <aside className="lg:col-span-4">
          <div className="sticky top-8 space-y-6">
            {/* Related Posts */}
            {!loadingRelated && relatedPosts.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Bài viết liên quan</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {relatedPosts.map((relatedPost) => (
                    <div key={relatedPost.id} className="border-b last:border-0 pb-4 last:pb-0">
                      <Link href={`/posts/${relatedPost.slug}`}>
                        <div className="group cursor-pointer">
                          {relatedPost.coverImage && (
                            <div className="relative w-full h-32 mb-2 rounded-lg overflow-hidden">
                              <Image
                                src={relatedPost.coverImage}
                                alt={relatedPost.title}
                                fill
                                className="object-cover group-hover:scale-105 transition-transform"
                              />
                            </div>
                          )}
                          <h3 className="font-medium text-sm line-clamp-2 group-hover:text-primary transition-colors mb-2">
                            {relatedPost.title}
                          </h3>
                        </div>
                      </Link>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(relatedPost.createdAt).toLocaleDateString('vi-VN')}
                        </span>
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleToggleLikeRelated(relatedPost);
                          }}
                          className="flex items-center gap-1 hover:text-primary transition-colors"
                        >
                          <Heart 
                            className={`h-3 w-3 ${relatedPost.isLike ? 'fill-pink-500 text-pink-500' : ''}`}
                          />
                          {relatedPost.likesCount}
                        </button>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Post Series */}
            {!loadingRelated && postSeries.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Series chứa bài viết này</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {postSeries.map((series) => (
                    <div key={series.id} className="space-y-3">
                      <h3 className="font-semibold text-base">{series.name}</h3>
                      <div className="space-y-2">
                        {series.posts.map(({ order, post: seriesPost }) => (
                          <Link 
                            key={seriesPost.id} 
                            href={`/posts/${seriesPost.slug}`}
                            className={`block p-2 rounded-lg hover:bg-gray-50 transition-colors ${
                              seriesPost.id === post.id ? 'bg-primary/10 border border-primary' : ''
                            }`}
                          >
                            <div className="flex items-start gap-2">
                              <span className="text-xs font-semibold text-primary flex-shrink-0 mt-1">
                                #{order !== null ? order + 1 : '?'}
                              </span>
                              <span className="text-sm line-clamp-2 flex-1">
                                {seriesPost.title}
                              </span>
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {loadingRelated && (
              <>
                <Skeleton className="h-64 w-full" />
                <Skeleton className="h-64 w-full" />
              </>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}

// Comment Item Component
interface CommentItemProps {
  comment: CommentNode;
  onLike: (commentId: string) => void;
  onReply: (commentId: string) => void;
  replyTo: string | null;
  replyContents: Record<string, string>;
  onReplyContentChange: (commentId: string, content: string) => void;
  onSubmitReply: (commentId: string) => void;
  onCancelReply: (commentId: string) => void;
  submitting: boolean;
  level?: number;
}

function CommentItem({ 
  comment, 
  onLike, 
  onReply, 
  replyTo,
  replyContents,
  onReplyContentChange,
  onSubmitReply,
  onCancelReply,
  submitting,
  level = 0 
}: CommentItemProps) {
  const replyContent = replyContents[comment.id] || '';
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className={`${level > 0 ? 'ml-8 border-l-2 pl-4' : ''}`}>
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <Avatar>
              <AvatarImage src={comment.author?.avatar || undefined} />
              <AvatarFallback>
                {comment.author?.name?.charAt(0).toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className="font-semibold">
                  {comment.author?.name || 'Người dùng ẩn danh'}
                </span>
                <span className="text-xs text-muted-foreground">
                  {formatDate(comment.createdAt)}
                </span>
                {comment.isEdited && (
                  <Badge variant="outline" className="text-xs">
                    Đã chỉnh sửa
                  </Badge>
                )}
              </div>

              <p className="text-sm mb-3 whitespace-pre-wrap">{comment.content}</p>

              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onLike(comment.id)}
                  className={`gap-2 ${
                    comment.likedByViewer ? 'text-primary' : ''
                  }`}
                >
                  <ThumbsUp
                    className={`h-3 w-3 ${
                      comment.likedByViewer ? 'fill-current' : ''
                    }`}
                  />
                  {comment.likeCount}
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onReply(comment.id)}
                  className="gap-2"
                >
                  <MessageCircle className="h-3 w-3" />
                  Trả lời
                </Button>

                {comment.replyCount > 0 && (
                  <span className="text-xs text-muted-foreground">
                    {comment.replyCount} phản hồi
                  </span>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Inline Reply Form */}
      {replyTo === comment.id && (
        <Card className="mt-3 ml-12">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">
                Trả lời {comment.author?.name || 'người dùng'}
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onCancelReply(comment.id)}
                className="h-6 text-xs"
              >
                Hủy
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="Nhập câu trả lời của bạn..."
              value={replyContent}
              onChange={(e) => onReplyContentChange(comment.id, e.target.value)}
              rows={3}
              className="mb-3"
              autoFocus
            />
            <Button
              onClick={() => onSubmitReply(comment.id)}
              disabled={!replyContent.trim() || submitting}
              size="sm"
              className="gap-2"
            >
              <Send className="h-3 w-3" />
              {submitting ? 'Đang gửi...' : 'Gửi trả lời'}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Nested replies */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="mt-4 space-y-4">
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              onLike={onLike}
              onReply={onReply}
              replyTo={replyTo}
              replyContents={replyContents}
              onReplyContentChange={onReplyContentChange}
              onSubmitReply={onSubmitReply}
              onCancelReply={onCancelReply}
              submitting={submitting}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

