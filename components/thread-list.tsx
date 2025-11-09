'use client';

import { DiscussionThread } from '@/lib/supabase';
import { formatDistanceToNow } from 'date-fns';
import { zhTW } from 'date-fns/locale';
import { MessageSquare, Pin, Lock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { AdminThreadActions } from '@/components/admin-thread-actions';

interface ThreadListProps {
  threads: DiscussionThread[];
  selectedThreadId: number | null;
  onThreadSelect: (threadId: number) => void;
  isAdmin?: boolean;
  onThreadUpdate?: () => void;
}

export function ThreadList({ threads, selectedThreadId, onThreadSelect, isAdmin = false, onThreadUpdate }: ThreadListProps) {
  const pinnedThreads = threads.filter(t => t.is_pinned);
  const regularThreads = threads.filter(t => !t.is_pinned);

  function renderThread(thread: DiscussionThread) {
    const isSelected = thread.id === selectedThreadId;

    return (
      <div key={thread.id} className="relative group">
        <button
          onClick={() => onThreadSelect(thread.id)}
          className={`w-full text-left px-4 py-3 rounded-lg transition-all ${
            isSelected
              ? 'bg-gradient-to-r from-slate-900 to-slate-800 text-white shadow-lg'
              : 'hover:bg-slate-50 text-gray-700'
          }`}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                {thread.is_pinned && (
                  <Pin className={`h-3 w-3 ${isSelected ? 'text-yellow-300' : 'text-yellow-600'}`} />
                )}
                {thread.is_locked && (
                  <Lock className={`h-3 w-3 ${isSelected ? 'text-gray-300' : 'text-gray-500'}`} />
                )}
                <h3 className={`font-semibold text-sm truncate ${isSelected ? 'text-white' : 'text-gray-900'}`}>
                  {thread.title}
                </h3>
              </div>

            {thread.description && (
              <p className={`text-xs mb-2 line-clamp-2 ${isSelected ? 'text-slate-100' : 'text-gray-600'}`}>
                {thread.description}
              </p>
            )}

            <div className="flex items-center gap-3 text-xs">
              <div className="flex items-center gap-1">
                <MessageSquare className={`h-3 w-3 ${isSelected ? 'text-slate-200' : 'text-gray-500'}`} />
                <span className={isSelected ? 'text-slate-200' : 'text-gray-500'}>
                  {thread.message_count}
                </span>
              </div>
              <span className={isSelected ? 'text-slate-200' : 'text-gray-500'}>
                {formatDistanceToNow(new Date(thread.last_activity_at), {
                  addSuffix: true,
                  locale: zhTW
                })}
              </span>
            </div>
          </div>
        </div>
        </button>
        {isAdmin && (
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <AdminThreadActions thread={thread} onUpdate={onThreadUpdate} />
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {pinnedThreads.length > 0 && (
        <div className="space-y-1">
          {pinnedThreads.map(renderThread)}
          {regularThreads.length > 0 && (
            <div className="border-t border-gray-200 my-2" />
          )}
        </div>
      )}

      {regularThreads.map(renderThread)}

      {threads.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <MessageSquare className="h-12 w-12 mx-auto mb-3 text-gray-300" />
          <p className="text-sm">還沒有討論串</p>
        </div>
      )}
    </div>
  );
}
