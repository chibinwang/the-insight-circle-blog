'use client';

import { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { GroupMember, Profile } from '@/lib/supabase';
import { Users, Crown, Shield, MessageCircle } from 'lucide-react';
import { KickMemberButton } from '@/components/kick-member-button';
import { DirectMessageDialog } from '@/components/direct-message-dialog';
import { UserTitleBadge } from '@/components/user-title-badge';

interface GroupMembersSidebarProps {
  members: GroupMember[];
  totalCount: number;
  groupId: number;
  currentUserId?: string;
  isAdmin?: boolean;
  onMemberKicked?: () => void;
}

export function GroupMembersSidebar({
  members,
  totalCount,
  groupId,
  currentUserId,
  isAdmin = false,
  onMemberKicked
}: GroupMembersSidebarProps) {
  const [dmUser, setDmUser] = useState<Profile | null>(null);

  function getRoleIcon(role: string) {
    if (role === 'admin') return <Crown className="h-3 w-3" />;
    if (role === 'moderator') return <Shield className="h-3 w-3" />;
    return null;
  }

  function getRoleLabel(role: string) {
    if (role === 'admin') return '管理員';
    if (role === 'moderator') return '版主';
    return '成員';
  }

  return (
    <>
      <div className="w-64 border-l bg-gray-50 flex flex-col">
        <div className="p-4 border-b bg-white">
          <div className="flex items-center gap-2 mb-1">
            <Users className="h-5 w-5 text-gray-600" />
            <h3 className="font-semibold">社群成員</h3>
          </div>
          <p className="text-sm text-gray-500">{totalCount} 位成員</p>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-3 space-y-2">
            {members.map((member) => {
              const username = member.profiles?.username || '匿名用戶';
              const avatarUrl = member.profiles?.avatar_url;
              const initial = username.charAt(0).toUpperCase();
              const isCurrentUser = member.user_id === currentUserId;

              return (
                <div
                  key={member.id}
                  className="flex items-start gap-2 p-2 rounded-lg hover:bg-white transition-colors group"
                >
                  <Avatar className="h-8 w-8 flex-shrink-0">
                    {avatarUrl && <AvatarImage src={avatarUrl} alt={username} />}
                    <AvatarFallback className="text-xs">{initial}</AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{username}</p>
                    <div className="flex items-center gap-1 mb-1 flex-wrap">
                      {getRoleIcon(member.role)}
                      <span className="text-xs text-gray-500">
                        {getRoleLabel(member.role)}
                      </span>
                    </div>
                    {member.profiles?.user_title && (
                      <div className="mb-1">
                        <UserTitleBadge title={member.profiles.user_title} size="sm" />
                      </div>
                    )}

                    {!isCurrentUser && (
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs"
                          onClick={() => member.profiles && setDmUser(member.profiles)}
                        >
                          <MessageCircle className="h-3 w-3 mr-1" />
                          私訊
                        </Button>
                        {isAdmin && member.role !== 'admin' && (
                          <KickMemberButton
                            groupId={groupId}
                            userId={member.user_id}
                            username={username}
                            onKicked={onMemberKicked}
                          />
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </div>

      {dmUser && currentUserId && (
        <DirectMessageDialog
          open={!!dmUser}
          onOpenChange={(open) => !open && setDmUser(null)}
          currentUserId={currentUserId}
          otherUser={dmUser}
        />
      )}
    </>
  );
}
