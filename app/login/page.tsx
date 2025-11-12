'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [rateLimitError, setRateLimitError] = useState<string | null>(null);
  const [unlockTime, setUnlockTime] = useState<Date | null>(null);
  const router = useRouter();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setRateLimitError(null);

    try {
      const rateLimitResponse = await fetch('/api/auth/check-rate-limit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const rateLimitData = await rateLimitResponse.json();

      if (!rateLimitData.allowed) {
        setRateLimitError(rateLimitData.message);
        if (rateLimitData.unlockAt) {
          setUnlockTime(new Date(rateLimitData.unlockAt));
        }
        toast({
          title: '登入被限制',
          description: rateLimitData.message,
          variant: 'destructive',
        });
        setLoading(false);
        return;
      }
    } catch (error) {
      console.error('Rate limit check failed:', error);
    }

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    try {
      await fetch('/api/auth/record-login-attempt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          success: !error,
        }),
      });
    } catch (recordError) {
      console.error('Failed to record login attempt:', recordError);
    }

    if (error) {
      toast({
        title: '錯誤',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: '成功',
        description: '登入成功',
      });
      router.push('/');
      router.refresh();
    }

    setLoading(false);
  };

  const handleGoogleLogin = async () => {
    try {
      setGoogleLoading(true);
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      });

      if (error) {
        toast({
          title: 'Google 登入失敗',
          description: error.message,
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Google OAuth error:', error);
      toast({
        title: 'Google 登入失敗',
        description: '請稍後再試或改用電子郵件登入',
        variant: 'destructive',
      });
    } finally {
      setGoogleLoading(false);
    }
  };


  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">歡迎回來</CardTitle>
          <CardDescription>登入您的帳戶以繼續</CardDescription>
        </CardHeader>
        <CardContent>
          {rateLimitError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-800 font-medium">{rateLimitError}</p>
              {unlockTime && (
                <p className="text-xs text-red-600 mt-1">
                  您的帳戶將在 {unlockTime.toLocaleTimeString('zh-TW')} 解鎖
                </p>
              )}
            </div>
          )}
          <Button
            onClick={handleGoogleLogin}
            variant="outline"
            className="w-full flex items-center justify-center gap-2 font-medium"
            type="button"
            disabled={googleLoading || loading}
          >
            {googleLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                正在連結 Google...
              </>
            ) : (
              <>
                <span className="bg-white rounded-full p-1 shadow-sm">
                  <svg
                    className="h-4 w-4"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path fill="#EA4335" d="M12 10.2v4h5.7c-.2 1.3-1.7 3.8-5.7 3.8-3.4 0-6.3-2.8-6.3-6.2s2.9-6.2 6.3-6.2c1.9 0 3.2.8 4 1.6l2.8-2.7C17.2 2.8 14.8 1.8 12 1.8 6.9 1.8 2.7 6 2.7 11s4.2 9.2 9.3 9.2c5.4 0 9-3.8 9-9.1 0-.6-.1-1-.2-1.5H12z" />
                  </svg>
                </span>
                使用 Google 繼續
              </>
            )}
          </Button>

          <p className="text-xs text-muted-foreground text-center mt-2">
            我們將帶您前往 Google 完成驗證
          </p>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-muted-foreground">
                或使用電子郵件登入
              </span>
            </div>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
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
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading || !!rateLimitError}>
              {loading ? '登入中...' : '登入'}
            </Button>
          </form>

          <div className="mt-4 text-center text-sm">
            還沒有帳戶嗎？{' '}
            <Link href="/signup" className="text-blue-600 hover:underline">
              註冊
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
