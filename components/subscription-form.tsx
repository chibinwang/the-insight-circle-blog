'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Mail, Loader2, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

type SubscriptionFormProps = {
  className?: string;
  onSuccess?: () => void;
};

export function SubscriptionForm({ className = '', onSuccess }: SubscriptionFormProps) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !email.includes('@')) {
      toast({
        title: '無效的電子郵件',
        description: '請輸入有效的電子郵件地址。',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(true);
        setEmail('');
        toast({
          title: '訂閱成功！',
          description: '您將會收到新文章的電子郵件通知。',
        });
        if (onSuccess) onSuccess();
      } else {
        toast({
          title: '訂閱失敗',
          description: data.error || '發生錯誤，請重試。',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: '錯誤',
        description: '訂閱失敗，請稍後再試。',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className={`flex items-center gap-2 text-green-600 ${className}`}>
        <CheckCircle2 className="h-5 w-5" />
        <p className="text-sm font-medium">感謝您的訂閱！</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className={`flex gap-2 ${className}`}>
      <div className="relative flex-1">
        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          type="email"
          placeholder="輸入您的電子郵件"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="pl-10"
          disabled={loading}
          required
        />
      </div>
      <Button type="submit" disabled={loading}>
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            訂閱中...
          </>
        ) : (
          '訂閱'
        )}
      </Button>
    </form>
  );
}
