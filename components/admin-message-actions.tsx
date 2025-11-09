'use client';

import { useState } from 'react';
import { MoreVertical, Trash2, Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

interface AdminMessageActionsProps {
  messageId: number;
  currentContent: string;
  onDelete?: () => void;
  onEdit?: () => void;
}

export function AdminMessageActions({ messageId, currentContent, onDelete, onEdit }: AdminMessageActionsProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(currentContent);

  async function handleDelete() {
    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from('group_messages')
        .update({ is_deleted: true })
        .eq('id', messageId);

      if (error) throw error;

      toast.success('訊息已刪除');
      setShowDeleteDialog(false);
      onDelete?.();
    } catch (error) {
      console.error('Error deleting message:', error);
      toast.error('刪除訊息失敗');
    } finally {
      setIsDeleting(false);
    }
  }

  async function handleEdit() {
    if (editedContent.trim() === '') {
      toast.error('訊息內容不能為空');
      return;
    }

    if (editedContent === currentContent) {
      setShowEditDialog(false);
      return;
    }

    setIsEditing(true);
    try {
      const { error } = await supabase
        .from('group_messages')
        .update({
          content: editedContent,
          is_edited: true,
          edited_at: new Date().toISOString()
        })
        .eq('id', messageId);

      if (error) throw error;

      toast.success('訊息已更新');
      setShowEditDialog(false);
      onEdit?.();
    } catch (error) {
      console.error('Error editing message:', error);
      toast.error('更新訊息失敗');
    } finally {
      setIsEditing(false);
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            onClick={() => {
              setEditedContent(currentContent);
              setShowEditDialog(true);
            }}
            className="cursor-pointer"
          >
            <Edit className="h-4 w-4 mr-2" />
            編輯訊息
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => setShowDeleteDialog(true)}
            className="text-red-600 cursor-pointer"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            刪除訊息
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>編輯訊息</DialogTitle>
            <DialogDescription>
              修改訊息內容。訊息將標記為已編輯。
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="message-content">訊息內容</Label>
              <Textarea
                id="message-content"
                value={editedContent}
                onChange={(e) => setEditedContent(e.target.value)}
                placeholder="輸入訊息內容..."
                rows={6}
                className="resize-none"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowEditDialog(false)}
              disabled={isEditing}
            >
              取消
            </Button>
            <Button
              onClick={handleEdit}
              disabled={isEditing || editedContent.trim() === ''}
            >
              {isEditing ? '更新中...' : '更新訊息'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>確定要刪除這則訊息嗎？</AlertDialogTitle>
            <AlertDialogDescription>
              此操作無法復原。訊息將被永久刪除。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? '刪除中...' : '確定刪除'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
