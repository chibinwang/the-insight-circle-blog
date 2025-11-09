'use client';

import { useState } from 'react';
import { MoreVertical, Trash2, Pin, Lock, Unlock, PinOff, Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { supabase, DiscussionThread } from '@/lib/supabase';
import { toast } from 'sonner';

interface AdminThreadActionsProps {
  thread: DiscussionThread;
  onUpdate?: () => void;
}

export function AdminThreadActions({ thread, onUpdate }: AdminThreadActionsProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [editedTitle, setEditedTitle] = useState(thread.title);
  const [editedDescription, setEditedDescription] = useState(thread.description || '');

  async function handleTogglePin() {
    setIsProcessing(true);
    try {
      const { error } = await supabase
        .from('discussion_threads')
        .update({ is_pinned: !thread.is_pinned })
        .eq('id', thread.id);

      if (error) throw error;

      toast.success(thread.is_pinned ? '已取消置頂' : '已置頂討論串');
      onUpdate?.();
    } catch (error) {
      console.error('Error toggling pin:', error);
      toast.error('操作失敗');
    } finally {
      setIsProcessing(false);
    }
  }

  async function handleToggleLock() {
    setIsProcessing(true);
    try {
      const { error } = await supabase
        .from('discussion_threads')
        .update({ is_locked: !thread.is_locked })
        .eq('id', thread.id);

      if (error) throw error;

      toast.success(thread.is_locked ? '已解鎖討論串' : '已鎖定討論串');
      onUpdate?.();
    } catch (error) {
      console.error('Error toggling lock:', error);
      toast.error('操作失敗');
    } finally {
      setIsProcessing(false);
    }
  }

  async function handleDelete() {
    setIsProcessing(true);
    try {
      const { error } = await supabase
        .from('discussion_threads')
        .delete()
        .eq('id', thread.id);

      if (error) throw error;

      toast.success('討論串已刪除');
      setShowDeleteDialog(false);
      onUpdate?.();
    } catch (error) {
      console.error('Error deleting thread:', error);
      toast.error('刪除失敗');
    } finally {
      setIsProcessing(false);
    }
  }

  async function handleEdit() {
    if (editedTitle.trim() === '') {
      toast.error('討論串標題不能為空');
      return;
    }

    if (editedTitle === thread.title && editedDescription === (thread.description || '')) {
      setShowEditDialog(false);
      return;
    }

    setIsProcessing(true);
    try {
      const { error } = await supabase
        .from('discussion_threads')
        .update({
          title: editedTitle,
          description: editedDescription || null
        })
        .eq('id', thread.id);

      if (error) throw error;

      toast.success('討論串已更新');
      setShowEditDialog(false);
      onUpdate?.();
    } catch (error) {
      console.error('Error editing thread:', error);
      toast.error('更新失敗');
    } finally {
      setIsProcessing(false);
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            onClick={() => {
              setEditedTitle(thread.title);
              setEditedDescription(thread.description || '');
              setShowEditDialog(true);
            }}
            disabled={isProcessing}
            className="cursor-pointer"
          >
            <Edit className="h-4 w-4 mr-2" />
            編輯討論串
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={handleTogglePin}
            disabled={isProcessing}
            className="cursor-pointer"
          >
            {thread.is_pinned ? (
              <>
                <PinOff className="h-4 w-4 mr-2" />
                取消置頂
              </>
            ) : (
              <>
                <Pin className="h-4 w-4 mr-2" />
                置頂討論串
              </>
            )}
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={handleToggleLock}
            disabled={isProcessing}
            className="cursor-pointer"
          >
            {thread.is_locked ? (
              <>
                <Unlock className="h-4 w-4 mr-2" />
                解鎖討論串
              </>
            ) : (
              <>
                <Lock className="h-4 w-4 mr-2" />
                鎖定討論串
              </>
            )}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => setShowDeleteDialog(true)}
            className="text-red-600 cursor-pointer"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            刪除討論串
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>編輯討論串</DialogTitle>
            <DialogDescription>
              修改討論串的標題和描述。
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="thread-title">標題</Label>
              <Input
                id="thread-title"
                value={editedTitle}
                onChange={(e) => setEditedTitle(e.target.value)}
                placeholder="輸入討論串標題..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="thread-description">描述（可選）</Label>
              <Textarea
                id="thread-description"
                value={editedDescription}
                onChange={(e) => setEditedDescription(e.target.value)}
                placeholder="輸入討論串描述..."
                rows={4}
                className="resize-none"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowEditDialog(false)}
              disabled={isProcessing}
            >
              取消
            </Button>
            <Button
              onClick={handleEdit}
              disabled={isProcessing || editedTitle.trim() === ''}
            >
              {isProcessing ? '更新中...' : '更新討論串'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>確定要刪除此討論串嗎？</AlertDialogTitle>
            <AlertDialogDescription>
              此操作無法復原。討論串及其所有訊息都將被永久刪除。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isProcessing}
              className="bg-red-600 hover:bg-red-700"
            >
              {isProcessing ? '刪除中...' : '確定刪除'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
