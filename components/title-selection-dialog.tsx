'use client';

import { useState } from 'react';
import { supabase, UserTitle, USER_TITLES, REGULAR_USER_TITLES } from '@/lib/supabase';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Sparkles, Target, Rocket, Lightbulb } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TitleSelectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentTitle: UserTitle | null;
  userId: string;
  onTitleUpdate: (newTitle: UserTitle) => void;
}

const TITLE_ICONS = {
  dream_seeker: Sparkles,
  path_builder: Target,
  creator: Rocket,
  strategist: Lightbulb,
};

export function TitleSelectionDialog({
  open,
  onOpenChange,
  currentTitle,
  userId,
  onTitleUpdate,
}: TitleSelectionDialogProps) {
  const [selectedTitle, setSelectedTitle] = useState<UserTitle | null>(currentTitle);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSave = async () => {
    if (!selectedTitle) {
      toast({
        title: '請選擇標籤',
        description: '請選擇一個代表你的身份標籤',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ user_title: selectedTitle })
        .eq('id', userId);

      if (error) throw error;

      toast({
        title: '更新成功',
        description: '你的身份標籤已更新',
      });

      onTitleUpdate(selectedTitle);
      onOpenChange(false);
    } catch (error) {
      console.error('Error updating title:', error);
      toast({
        title: '更新失敗',
        description: '無法更新身份標籤，請稍後再試',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl">選擇你的身份標籤</DialogTitle>
          <DialogDescription>
            選擇一個最能代表你當前狀態的身份標籤，你可以隨時更改
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
          {REGULAR_USER_TITLES.map((titleKey) => {
            const titleInfo = USER_TITLES[titleKey];
            const Icon = TITLE_ICONS[titleKey as keyof typeof TITLE_ICONS];
            const isSelected = selectedTitle === titleKey;

            return (
              <button
                key={titleKey}
                onClick={() => setSelectedTitle(titleKey)}
                className={cn(
                  'p-4 rounded-lg border-2 text-left transition-all hover:shadow-md',
                  isSelected
                    ? `${titleInfo.borderColor} ${titleInfo.bgColor} ring-2 ring-offset-2`
                    : 'border-gray-200 hover:border-gray-300'
                )}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={cn(
                      'p-2 rounded-lg shrink-0',
                      isSelected ? titleInfo.bgColor : 'bg-gray-100'
                    )}
                  >
                    {Icon && <Icon className={cn('h-5 w-5', isSelected ? titleInfo.color : 'text-gray-600')} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2 mb-1">
                      <h3 className={cn('font-bold text-lg', isSelected ? titleInfo.color : 'text-gray-900')}>
                        {titleInfo.nameChinese}
                      </h3>
                      <span className="text-sm text-gray-500">{titleInfo.nameEnglish}</span>
                    </div>
                    <p className="text-sm text-gray-600 leading-relaxed">{titleInfo.description}</p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            取消
          </Button>
          <Button onClick={handleSave} disabled={loading || !selectedTitle}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                儲存中...
              </>
            ) : (
              '儲存'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
