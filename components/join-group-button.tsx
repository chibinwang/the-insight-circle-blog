'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Users, Check } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

interface JoinGroupButtonProps {
  groupId?: number;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg';
  className?: string;
}

export function JoinGroupButton({
  groupId = 1,
  variant = 'default',
  size = 'default',
  className = ''
}: JoinGroupButtonProps) {
  const { user } = useAuth();
  const router = useRouter();
  const [isMember, setIsMember] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (isMounted) {
      checkMembership();
    }
  }, [user, groupId, isMounted]);

  async function checkMembership() {
    if (!user) {
      setIsChecking(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('group_members')
        .select('id')
        .eq('group_id', groupId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      setIsMember(!!data);
    } catch (error) {
      console.error('Error checking membership:', error);
    } finally {
      setIsChecking(false);
    }
  }

  async function handleClick() {
    if (!user) {
      toast.info('請先登入以加入社群');
      router.push('/login');
      return;
    }

    if (isMember) {
      router.push(`/community/${groupId}`);
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase
        .from('group_members')
        .insert({
          group_id: groupId,
          user_id: user.id,
          role: 'member'
        });

      if (error) {
        if (error.code === '23505') {
          toast.success('您已經是社群成員！正在進入...');
          setIsMember(true);
          router.push(`/community/${groupId}`);
          return;
        }
        throw error;
      }

      setIsMember(true);
      toast.success('成功加入社群！正在進入...');

      setTimeout(() => {
        router.push(`/community/${groupId}`);
      }, 500);
    } catch (error: any) {
      console.error('Error joining group:', error);
      toast.error(`加入社群失敗：${error.message || '請稍後再試'}`);
    } finally {
      setIsLoading(false);
    }
  }

  if (!isMounted || isChecking) {
    return (
      <Button
        variant={variant}
        size={size}
        className={className}
        disabled
      >
        <Users className="h-4 w-4 mr-2" />
        載入中...
      </Button>
    );
  }

  return (
    <Button
      variant={variant}
      size={size}
      className={className}
      onClick={handleClick}
      disabled={isLoading}
    >
      {isLoading ? (
        <>
          <svg className="animate-spin h-5 w-5 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          處理中...
        </>
      ) : isMember ? (
        <>
          <Check className="h-5 w-5 mr-2" />
          進入社群
        </>
      ) : (
        <>
          <Users className="h-5 w-5 mr-2" />
          加入社群
        </>
      )}
    </Button>
  );
}
