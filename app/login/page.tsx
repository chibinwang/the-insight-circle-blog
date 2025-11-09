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

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
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
