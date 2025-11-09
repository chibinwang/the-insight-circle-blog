'use client';

import { formatDistanceToNow } from 'date-fns';
import { zhTW } from 'date-fns/locale';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { GroupMessage } from '@/lib/supabase';
import { AdminMessageActions } from '@/components/admin-message-actions';
import { UserTitleBadge } from '@/components/user-title-badge';

interface ChatMessageProps {
  message: GroupMessage;
  isOwnMessage: boolean;
  isAdmin?: boolean;
  onDelete?: () => void;
}

export function ChatMessage({ message, isOwnMessage, isAdmin = false, onDelete }: ChatMessageProps) {
  const username = message.profiles?.username || '匿名用戶';
  const avatarUrl = message.profiles?.avatar_url;
  const userTitle = message.profiles?.user_title;
  const initial = username.charAt(0).toUpperCase();

  return (
    <div className={`flex gap-3 ${isOwnMessage ? 'flex-row-reverse' : 'flex-row'} group`}>
      <Avatar className="h-8 w-8 flex-shrink-0">
        {avatarUrl && <AvatarImage src={avatarUrl} alt={username} />}
        <AvatarFallback className="text-xs">{initial}</AvatarFallback>
      </Avatar>

      <div className={`flex flex-col max-w-[70%] ${isOwnMessage ? 'items-end' : 'items-start'}`}>
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <span className="text-xs font-medium text-gray-700">{username}</span>
          {userTitle && <UserTitleBadge title={userTitle} size="sm" />}
          <span className="text-xs text-gray-400">
            {formatDistanceToNow(new Date(message.created_at), {
              addSuffix: true,
              locale: zhTW
            })}
          </span>
          {isAdmin && <AdminMessageActions messageId={message.id} currentContent={message.content} onDelete={onDelete} onEdit={onDelete} />}
        </div>

        <div
          className={`rounded-2xl px-4 py-2 ${
            isOwnMessage
              ? 'bg-slate-600 text-white'
              : 'bg-gray-100 text-gray-900'
          }`}
        >
          <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
        </div>
      </div>
    </div>
  );
}
