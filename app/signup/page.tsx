'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { QuoteSelectionDialog } from '@/components/quote-selection-dialog';
import { PasswordStrengthIndicator, PasswordInputWithToggle } from '@/components/password-strength-indicator';
import { validatePassword } from '@/lib/password-validator';

export default function SignUpPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [wantsBlogNotifications, setWantsBlogNotifications] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showQuoteDialog, setShowQuoteDialog] = useState(false);
  const [newUserId, setNewUserId] = useState<string | null>(null);
  const router = useRouter();
  const { toast } = useToast();

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const validation = validatePassword(password, email, username);

    if (!validation.isValid) {
      toast({
        title: '密碼不符合要求',
        description: validation.feedback.join('、'),
        variant: 'destructive',
      });
      setLoading(false);
      return;
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      toast({
        title: '錯誤',
        description: error.message,
        variant: 'destructive',
      });
      setLoading(false);
      return;
    }

    if (data.user) {
      const { error: profileError } = await supabase
        .from('profiles')
        .insert([
          {
            id: data.user.id,
            username,
            avatar_url: null,
            bio: null,
            wants_blog_notifications: wantsBlogNotifications,
          },
        ]);

      if (profileError) {
        toast({
          title: '錯誤',
          description: '建立個人資料失敗',
          variant: 'destructive',
        });
        setLoading(false);
        return;
      }

      if (wantsBlogNotifications) {
        const unsubscribeToken = crypto.randomUUID();
        const { error: subscriberError } = await supabase
          .from('subscribers')
          .insert([
            {
              email: email,
              is_subscribed: true,
              unsubscribe_token: unsubscribeToken,
            },
          ]);

        if (subscriberError && subscriberError.code !== '23505') {
          console.error('Failed to add to subscribers:', subscriberError);
        }
      }

      toast({
        title: '成功',
        description: '帳戶建立成功',
      });
      setNewUserId(data.user.id);
      setShowQuoteDialog(true);
      setLoading(false);
    } else {
      setLoading(false);
    }
  };

  const handleQuoteSelectionComplete = () => {
    setShowQuoteDialog(false);
    router.push('/');
    router.refresh();
  };


  return (
    <>
      {newUserId && (
        <QuoteSelectionDialog
          open={showQuoteDialog}
          onComplete={handleQuoteSelectionComplete}
          userId={newUserId}
        />
      )}

      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">建立帳戶</CardTitle>
          <CardDescription>加入我們的社群，開始分享您的故事</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignUp} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">用戶名稱</Label>
              <Input
                id="username"
                type="text"
                placeholder="johndoe"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">電子郵件</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">密碼</Label>
              <PasswordInputWithToggle
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="請輸入安全的密碼"
                required
                autoComplete="new-password"
              />
              <PasswordStrengthIndicator
                password={password}
                email={email}
                username={username}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="notifications"
                checked={wantsBlogNotifications}
                onCheckedChange={(checked) => setWantsBlogNotifications(checked as boolean)}
              />
              <Label
                htmlFor="notifications"
                className="text-sm font-normal leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
              >
                我想收到思圈計畫的相關訊息跟之後的好康
              </Label>
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? '建立帳戶中...' : '建立帳戶'}
            </Button>
          </form>

          <div className="mt-4 text-center text-sm">
            已經有帳戶了嗎？{' '}
            <Link href="/login" className="text-blue-600 hover:underline">
              登入
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
    </>
  );
}
