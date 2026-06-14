import { useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { CommentNode } from '@/lib/types/posts';

interface PostLikedEvent {
  type: 'POST_LIKED';
  postId: string;
  userId: string;
  likesCount: number;
  timestamp: string;
}

interface PostUnlikedEvent {
  type: 'POST_UNLIKED';
  postId: string;
  userId: string;
  likesCount: number;
  timestamp: string;
}

interface PostCommentCreatedEvent {
  type: 'POST_COMMENT_CREATED';
  postId: string;
  comment: CommentNode;
  timestamp: string;
}

interface PostCommentDeletedEvent {
  type: 'POST_COMMENT_DELETED';
  postId: string;
  commentId: string;
  timestamp: string;
}

interface PostCommentLikedEvent {
  type: 'POST_COMMENT_LIKED';
  postId: string;
  commentId: string;
  userId: string;
  likeCount: number;
  timestamp: string;
}

interface PostCommentUnlikedEvent {
  type: 'POST_COMMENT_UNLIKED';
  postId: string;
  commentId: string;
  userId: string;
  likeCount: number;
  timestamp: string;
}

interface UsePostSocketOptions {
  postId: string;
  onPostLiked?: (event: PostLikedEvent) => void;
  onPostUnliked?: (event: PostUnlikedEvent) => void;
  onCommentCreated?: (event: PostCommentCreatedEvent) => void;
  onCommentDeleted?: (event: PostCommentDeletedEvent) => void;
  onCommentLiked?: (event: PostCommentLikedEvent) => void;
  onCommentUnliked?: (event: PostCommentUnlikedEvent) => void;
}

export function usePostSocket({
  postId,
  onPostLiked,
  onPostUnliked,
  onCommentCreated,
  onCommentDeleted,
  onCommentLiked,
  onCommentUnliked,
}: UsePostSocketOptions) {
  const socketRef = useRef<Socket | null>(null);

  // Get socket URL from API URL
  const getSocketUrl = useCallback(() => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';
    // Remove /api suffix and add /counters namespace
    const baseUrl = apiUrl.replace(/\/api$/, '');
    return `${baseUrl}/counters`;
  }, []);

  useEffect(() => {
    if (!postId) return;

    // Create socket connection
    const socketUrl = getSocketUrl();
    const socket = io(socketUrl, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    socketRef.current = socket;

    // Connection handlers
    socket.on('connect', () => {
      console.log('Socket connected to counters namespace');
      // Join post room
      socket.emit('join_post', { postId });
    });

    socket.on('joined_post', (data: { postId: string; message: string }) => {
      console.log('Joined post room:', data);
    });

    socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });

    socket.on('error', (error) => {
      console.error('Socket error:', error);
    });

    // Post events
    socket.on('post_liked', (event: PostLikedEvent) => {
      console.log('Post liked event:', event);
      onPostLiked?.(event);
    });

    socket.on('post_unliked', (event: PostUnlikedEvent) => {
      console.log('Post unliked event:', event);
      onPostUnliked?.(event);
    });

    // Comment events
    socket.on('post_comment_created', (event: PostCommentCreatedEvent) => {
      console.log('Comment created event:', event);
      onCommentCreated?.(event);
    });

    socket.on('post_comment_deleted', (event: PostCommentDeletedEvent) => {
      console.log('Comment deleted event:', event);
      onCommentDeleted?.(event);
    });

    socket.on('post_comment_liked', (event: PostCommentLikedEvent) => {
      console.log('Comment liked event:', event);
      onCommentLiked?.(event);
    });

    socket.on('post_comment_unliked', (event: PostCommentUnlikedEvent) => {
      console.log('Comment unliked event:', event);
      onCommentUnliked?.(event);
    });

    // Cleanup
    return () => {
      if (socket) {
        socket.emit('leave_post', { postId });
        socket.off('connect');
        socket.off('joined_post');
        socket.off('connect_error');
        socket.off('error');
        socket.off('post_liked');
        socket.off('post_unliked');
        socket.off('post_comment_created');
        socket.off('post_comment_deleted');
        socket.off('post_comment_liked');
        socket.off('post_comment_unliked');
        socket.disconnect();
      }
    };
  }, [postId, onPostLiked, onPostUnliked, onCommentCreated, onCommentDeleted, onCommentLiked, onCommentUnliked, getSocketUrl]);

  return socketRef.current;
}






