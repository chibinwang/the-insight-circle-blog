'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { BookmarkPlus, BookmarkCheck } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

interface AddToBookListButtonProps {
  bookId: number;
  variant?: 'default' | 'ghost' | 'outline' | 'secondary' | 'destructive' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  showText?: boolean;
}

export function AddToBookListButton({
  bookId,
  variant = 'default',
  size = 'default',
  showText = true
}: AddToBookListButtonProps) {
  const [isAdded, setIsAdded] = useState(false);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    if (user) {
      checkIfAdded();
    }
  }, [user, bookId]);

  const checkIfAdded = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('user_book_list')
      .select('id')
      .eq('user_id', user.id)
      .eq('book_id', bookId)
      .maybeSingle();

    setIsAdded(!!data);
  };

  const handleToggleAdd = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      toast({
        title: '需要登入',
        description: '請先登入以加入書單',
        variant: 'destructive',
      });
      router.push('/login');
      return;
    }

    setLoading(true);

    try {
      if (isAdded) {
        const { error } = await supabase
          .from('user_book_list')
          .delete()
          .eq('user_id', user.id)
          .eq('book_id', bookId);

        if (error) throw error;

        setIsAdded(false);
        toast({
          title: '已從書單移除',
          description: '這本書已從您的書單中移除',
        });
      } else {
        const { error } = await supabase
          .from('user_book_list')
          .insert({
            user_id: user.id,
            book_id: bookId,
          });

        if (error) throw error;

        setIsAdded(true);
        toast({
          title: '已加入書單',
          description: '這本書已加入您的書單',
        });
      }
    } catch (error) {
      console.error('Error toggling book list:', error);
      toast({
        title: '錯誤',
        description: '無法更新書單狀態',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleToggleAdd}
      disabled={loading}
      className={`gap-2 ${isAdded ? 'bg-green-600 hover:bg-green-700' : ''}`}
    >
      {isAdded ? (
        <>
          <BookmarkCheck className="h-4 w-4" />
          {showText && '已在書單'}
        </>
      ) : (
        <>
          <BookmarkPlus className="h-4 w-4" />
          {showText && '加入書單'}
        </>
      )}
    </Button>
  );
}
