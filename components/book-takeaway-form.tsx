'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

interface BookTakeawayFormProps {
  bookId: number;
  onTakeawayAdded?: () => void;
}

export function BookTakeawayForm({ bookId, onTakeawayAdded }: BookTakeawayFormProps) {
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast({
        title: '需要登入',
        description: '請先登入以分享您的讀後感',
        variant: 'destructive',
      });
      return;
    }

    if (!content.trim()) {
      toast({
        title: '內容不能為空',
        description: '請輸入您的讀後感',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from('book_takeaways')
        .insert({
          book_id: bookId,
          user_id: user.id,
          content: content.trim(),
        });

      if (error) throw error;

      toast({
        title: '發布成功',
        description: '您的讀後感已成功發布',
      });

      setContent('');

      if (onTakeawayAdded) {
        onTakeawayAdded();
      }
    } catch (error) {
      console.error('Error posting takeaway:', error);
      toast({
        title: '發布失敗',
        description: '無法發布讀後感，請稍後再試',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>請先登入以分享您的讀後感</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          分享您的讀後感
        </label>
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="寫下您讀完這本書後的想法、收穫或反思..."
          rows={6}
          className="resize-none"
          disabled={isSubmitting}
        />
      </div>
      <Button type="submit" disabled={isSubmitting || !content.trim()} className="w-full">
        {isSubmitting ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            發布中...
          </>
        ) : (
          '發布讀後感'
        )}
      </Button>
    </form>
  );
}
