'use client';

import { UserTitle, USER_TITLES } from '@/lib/supabase';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface UserTitleBadgeProps {
  title: UserTitle | null;
  size?: 'sm' | 'md' | 'lg';
  showTooltip?: boolean;
  className?: string;
}

export function UserTitleBadge({ title, size = 'md', showTooltip = true, className }: UserTitleBadgeProps) {
  if (!title) return null;

  const titleInfo = USER_TITLES[title];
  if (!titleInfo) return null;

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-1',
    lg: 'text-base px-3 py-1.5',
  };

  const badge = (
    <Badge
      variant="outline"
      className={cn(
        sizeClasses[size],
        titleInfo.color,
        titleInfo.bgColor,
        titleInfo.borderColor,
        'font-medium transition-all hover:scale-105',
        className
      )}
    >
      <span className="font-semibold">{titleInfo.nameChinese}</span>
      <span className="ml-1.5 opacity-75 text-xs">{titleInfo.nameEnglish}</span>
    </Badge>
  );

  if (!showTooltip) {
    return badge;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>{badge}</TooltipTrigger>
        <TooltipContent>
          <p className="max-w-xs">{titleInfo.description}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
