'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Post, UserTitle } from '@/lib/supabase';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, User, Eye, Edit, Trash2, BookOpen, Heart } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '@/lib/auth-context';
import { DeletePostButton } from '@/components/delete-post-button';
import { SaveArticleButton } from '@/components/save-article-button';
import { LikeButton } from '@/components/like-button';
import { calculateWordCount, getPreviewText } from '@/lib/utils';
import { UserTitleBadge } from '@/components/user-title-badge';

type PostCardProps = {
  post: Post & { profiles?: { username: string | null; user_title?: UserTitle | null } };
};

const getCategoryColor = (category: string) => {
  const colors = {
    'AI News': 'bg-blue-100 text-blue-800 hover:bg-blue-200',
    'Finance': 'bg-green-100 text-green-800 hover:bg-green-200',
    'Study Overseas': 'bg-orange-100 text-orange-800 hover:bg-orange-200',
    'Entrepreneur Story': 'bg-rose-100 text-rose-800 hover:bg-rose-200',
    'Other': 'bg-slate-100 text-slate-800 hover:bg-slate-200',
  };
  return colors[category as keyof typeof colors] || 'bg-gray-100 text-gray-800 hover:bg-gray-200';
};

export function PostCard({ post }: PostCardProps) {
  const { profile } = useAuth();
  const isAdmin = profile?.is_admin || false;
  const wordCount = calculateWordCount(post.content);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleClick = async () => {
    try {
      await fetch('/api/track/view', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId: post.id }),
      });
    } catch (error) {
      console.error('Failed to track view:', error);
    }
  };

  return (
    <Card className="hover:shadow-lg transition-all duration-300 ease-out h-full flex flex-col overflow-hidden group bg-white">
      <div className="relative">
        <div className="absolute top-3 right-3 z-10 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          {isAdmin ? (
            <>
              <Link href={`/admin/edit/${post.id}`} onClick={(e) => e.stopPropagation()}>
                <Button variant="secondary" size="sm" className="gap-1 shadow-lg hover:shadow-xl transition-shadow">
                  <Edit className="h-4 w-4" />
                  <span className="hidden sm:inline">Edit</span>
                </Button>
              </Link>
              <div onClick={(e) => e.stopPropagation()}>
                <DeletePostButton postId={post.id} compact />
              </div>
            </>
          ) : (
            <div onClick={(e) => e.stopPropagation()}>
              <SaveArticleButton postId={post.id} variant="secondary" size="icon" />
            </div>
          )}
        </div>

        <Link href={`/post/${post.slug}`} onClick={handleClick}>
          {post.cover_image && (
            <div className="relative w-full h-52 overflow-hidden">
              <img
                src={post.cover_image}
                alt={post.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
              />
            </div>
          )}
        </Link>
      </div>

      <Link href={`/post/${post.slug}`} onClick={handleClick} className="flex-1 flex flex-col">
        <CardContent className="pt-5 pb-4 flex-1">
          <div className="flex items-center gap-2 mb-3">
            <Badge className={`${getCategoryColor(post.category)} transition-colors duration-200 text-xs font-medium`}>
              {post.category}
            </Badge>
          </div>
          <h2 className="text-xl font-bold mb-3 line-clamp-2 group-hover:text-blue-600 transition-colors duration-200 leading-tight">
            {post.title}
          </h2>
          <p className="text-gray-600 text-sm line-clamp-3 leading-relaxed">
            {getPreviewText(post.content, 150)}
          </p>
        </CardContent>

        <CardFooter className="pt-3 pb-4 border-t bg-gray-50/50">
          <div className="w-full space-y-3">
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-1.5">
                <User className="h-3.5 w-3.5 text-gray-500" />
                <span className="text-sm text-gray-700 font-medium">{post.profiles?.username || 'Anonymous'}</span>
              </div>
              {post.profiles?.user_title && (
                <UserTitleBadge title={post.profiles.user_title} size="sm" />
              )}
            </div>

            <div className="flex items-center justify-between text-xs text-gray-500">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1">
                  <Eye className="h-3.5 w-3.5" />
                  <span>{post.view_count || 0}</span>
                </div>
                <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                  <Heart className="h-3.5 w-3.5 text-red-500" />
                  <span>{post.like_count || 0}</span>
                </div>
                <div className="flex items-center gap-1">
                  <BookOpen className="h-3.5 w-3.5" />
                  <span>{wordCount} words</span>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                <span suppressHydrationWarning>
                  {isMounted ? formatDistanceToNow(new Date(post.created_at), { addSuffix: true }) : new Date(post.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
        </CardFooter>
      </Link>
    </Card>
  );
}
