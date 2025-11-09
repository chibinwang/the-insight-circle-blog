'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Book } from '@/lib/supabase';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BookOpen, Edit, Trash2, MessageSquare } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { AddToBookListButton } from '@/components/add-to-book-list-button';

type BookCardProps = {
  book: Book & { takeaway_count?: number };
  onDelete?: (bookId: number) => void;
};

export function BookCard({ book, onDelete }: BookCardProps) {
  const { profile } = useAuth();
  const isAdmin = profile?.is_admin || false;
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  return (
    <Card className="hover:shadow-2xl hover:-translate-y-1 hover:scale-[1.02] transition-all duration-300 ease-out h-full relative group cursor-pointer">
      <div className="absolute top-3 right-3 z-10 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        {isAdmin ? (
          <>
            <Link href={`/admin/library/edit/${book.id}`} onClick={(e) => e.stopPropagation()}>
              <Button variant="secondary" size="sm" className="gap-1 shadow-lg hover:shadow-xl transition-shadow">
                <Edit className="h-4 w-4" />
                <span className="hidden sm:inline">編輯</span>
              </Button>
            </Link>
            {onDelete && (
              <div onClick={(e) => e.stopPropagation()}>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => onDelete(book.id)}
                  className="gap-1 shadow-lg hover:shadow-xl transition-shadow"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            )}
          </>
        ) : (
          <div onClick={(e) => e.stopPropagation()}>
            <AddToBookListButton bookId={book.id} variant="secondary" size="icon" showText={false} />
          </div>
        )}
      </div>

      <Link href={`/library/${book.id}`}>
        {book.cover_image_url ? (
          <div className="relative w-full h-64 overflow-hidden rounded-t-lg">
            <img
              src={book.cover_image_url}
              alt={book.title}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 ease-out"
            />
          </div>
        ) : (
          <div className="relative w-full h-64 overflow-hidden rounded-t-lg bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center">
            <BookOpen className="h-20 w-20 text-blue-400" />
          </div>
        )}
      </Link>

      <Link href={`/library/${book.id}`}>
        <CardContent className="pt-6">
          <h2 className="text-2xl font-bold mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors duration-200">
            {book.title}
          </h2>
          <p className="text-gray-600 mb-3">作者：{book.author}</p>
          {book.description && (
            <p className="text-gray-500 text-sm line-clamp-3">{book.description}</p>
          )}
        </CardContent>

        <CardFooter className="flex items-center justify-between text-sm text-gray-500">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            <span>{book.takeaway_count || 0} 讀後感</span>
          </div>
          <div className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            <span>閱讀</span>
          </div>
        </CardFooter>
      </Link>
    </Card>
  );
}
