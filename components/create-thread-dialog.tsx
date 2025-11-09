'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plus } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

interface CreateThreadDialogProps {
  groupId: number;
  userId: string;
  onThreadCreated: () => void;
}

export function CreateThreadDialog({ groupId, userId, onThreadCreated }: CreateThreadDialogProps) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  async function handleCreate() {
    if (!title.trim()) {
      toast.error('請輸入討論串標題');
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase
        .from('discussion_threads')
        .insert({
          group_id: groupId,
          created_by: userId,
          title: title.trim(),
          description: description.trim() || null
        });

      if (error) throw error;

      toast.success('討論串創建成功！');
      setTitle('');
      setDescription('');
      setOpen(false);
      onThreadCreated();
    } catch (error) {
      console.error('Error creating thread:', error);
      toast.error('創建討論串失敗');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="w-full bg-gradient-to-r from-slate-900 to-slate-800 hover:from-slate-800 hover:to-slate-700 text-white shadow-lg">
          <Plus className="h-4 w-4 mr-2" />
          創建新討論串
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>創建新討論串</DialogTitle>
          <DialogDescription>
            為新的討論主題創建一個專屬空間
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="title">討論串標題 *</Label>
            <Input
              id="title"
              placeholder="例如：AI 技術的未來發展"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={100}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="description">簡短描述（可選）</Label>
            <Textarea
              id="description"
              placeholder="簡單介紹這個討論串的主題..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              maxLength={500}
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
          >
            取消
          </Button>
          <Button
            type="button"
            onClick={handleCreate}
            disabled={isLoading || !title.trim()}
            className="bg-gradient-to-r from-slate-900 to-slate-800 hover:from-slate-800 hover:to-slate-700"
          >
            {isLoading ? '創建中...' : '創建討論串'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
