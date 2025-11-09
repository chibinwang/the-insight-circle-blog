'use client';

import { useState } from 'react';
import { UserX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

interface KickMemberButtonProps {
  groupId: number;
  userId: string;
  username: string;
  onKicked?: () => void;
}

export function KickMemberButton({ groupId, userId, username, onKicked }: KickMemberButtonProps) {
  const [isKicking, setIsKicking] = useState(false);

  async function handleKick() {
    setIsKicking(true);
    try {
      const { error } = await supabase
        .from('group_members')
        .delete()
        .eq('group_id', groupId)
        .eq('user_id', userId);

      if (error) throw error;

      toast.success(`已將 ${username} 移出社群`);
      onKicked?.();
    } catch (error) {
      console.error('Error kicking member:', error);
      toast.error('移除成員失敗');
    } finally {
      setIsKicking(false);
    }
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50">
          <UserX className="h-4 w-4 mr-1" />
          移除
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>確定要移除此成員嗎？</AlertDialogTitle>
          <AlertDialogDescription>
            您即將把 <span className="font-semibold">{username}</span> 從社群中移除。
            他們將無法再查看或參與此社群的討論。
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>取消</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleKick}
            disabled={isKicking}
            className="bg-red-600 hover:bg-red-700"
          >
            {isKicking ? '移除中...' : '確定移除'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
