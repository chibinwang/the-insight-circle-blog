'use client';

import { useEffect, useRef } from 'react';
import { GroupMessage } from '@/lib/supabase';
import { formatDistanceToNow } from 'date-fns';
import { zhTW } from 'date-fns/locale';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Megaphone, Bot, MessageSquare } from 'lucide-react';
import { AdminMessageActions } from '@/components/admin-message-actions';

interface ThreadMessagesProps {
  messages: GroupMessage[];
  currentUserId?: string;
  isAdmin?: boolean;
  onMessageDelete?: () => void;
}

export function ThreadMessages({ messages, currentUserId, isAdmin = false, onMessageDelete }: ThreadMessagesProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  function scrollToBottom() {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }

  function renderMessage(message: GroupMessage, isOwnMessage: boolean) {
    const username = message.profiles?.username || '匿名用戶';
    const avatarUrl = message.profiles?.avatar_url;
    const initial = username.charAt(0).toUpperCase();

    if (message.message_type === 'announcement') {
      return (
        <div key={message.id} className="mx-auto max-w-2xl">
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-l-4 border-amber-500 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-1">
                <div className="h-8 w-8 rounded-full bg-amber-500 flex items-center justify-center">
                  <Megaphone className="h-4 w-4 text-white" />
                </div>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="secondary" className="bg-amber-500 text-white text-xs">
                    公告
                  </Badge>
                  <span className="text-xs font-medium text-amber-900">{username}</span>
                  <span className="text-xs text-amber-700">
                    {formatDistanceToNow(new Date(message.created_at), {
                      addSuffix: true,
                      locale: zhTW
                    })}
                  </span>
                </div>
                <p className="text-sm text-amber-900 leading-relaxed whitespace-pre-wrap">
                  {message.content}
                </p>
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (message.message_type === 'system') {
      return (
        <div key={message.id} className="flex justify-center">
          <div className="bg-gray-100 rounded-full px-4 py-1.5 text-xs text-gray-600 flex items-center gap-2">
            <Bot className="h-3 w-3" />
            {message.content}
          </div>
        </div>
      );
    }

    return (
      <div key={message.id} className={`flex gap-3 ${isOwnMessage ? 'flex-row-reverse' : 'flex-row'} group`}>
        <Avatar className="h-10 w-10 flex-shrink-0 ring-2 ring-white shadow-md">
          {avatarUrl && <AvatarImage src={avatarUrl} alt={username} />}
          <AvatarFallback className="text-sm font-semibold bg-gradient-to-br from-slate-500 to-slate-700 text-white">
            {initial}
          </AvatarFallback>
        </Avatar>

        <div className={`flex flex-col max-w-[70%] ${isOwnMessage ? 'items-end' : 'items-start'}`}>
          <div className={`flex items-center gap-2 mb-1 ${isOwnMessage ? 'flex-row-reverse' : 'flex-row'}`}>
            <span className="text-xs font-semibold text-gray-700">{username}</span>
            <span className="text-xs text-gray-400">
              {formatDistanceToNow(new Date(message.created_at), {
                addSuffix: true,
                locale: zhTW
              })}
            </span>
            {message.is_edited && (
              <span className="text-xs text-gray-400">(已編輯)</span>
            )}
            {isAdmin && <AdminMessageActions messageId={message.id} currentContent={message.content} onDelete={onMessageDelete} onEdit={onMessageDelete} />}
          </div>

          <div
            className={`rounded-2xl px-4 py-3 shadow-sm ${
              isOwnMessage
                ? 'bg-gradient-to-br from-slate-900 to-slate-800 text-white'
                : 'bg-white text-gray-900 border border-gray-200'
            }`}
          >
            <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
              {message.content}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <ScrollArea className="flex-1 px-4 py-6">
      <div className="space-y-4 max-w-5xl mx-auto">
        {messages.length === 0 ? (
          <div className="text-center py-12">
            <div className="inline-block p-4 rounded-full bg-gray-100 mb-4">
              <MessageSquare className="h-8 w-8 text-gray-400" />
            </div>
            <p className="text-gray-500">還沒有訊息。開始對話吧！</p>
          </div>
        ) : (
          messages.map((message) =>
            renderMessage(message, message.user_id === currentUserId)
          )
        )}
        <div ref={messagesEndRef} />
      </div>
    </ScrollArea>
  );
}
