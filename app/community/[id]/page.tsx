'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { supabase, GroupMessage, GroupMember, DiscussionGroup, DiscussionThread } from '@/lib/supabase';
import { ChatInput } from '@/components/chat-input';
import { ThreadList } from '@/components/thread-list';
import { ThreadMessages } from '@/components/thread-messages';
import { GroupMembersSidebar } from '@/components/group-members-sidebar';
import { CreateThreadDialog } from '@/components/create-thread-dialog';
import { CommunityOnboardingDialog } from '@/components/community-onboarding-dialog';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Users as UsersIcon, MessageSquare, BookOpen } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

export default function CommunityPage() {
  const params = useParams();
  const router = useRouter();
  const { user, profile } = useAuth();
  const [group, setGroup] = useState<DiscussionGroup | null>(null);
  const [threads, setThreads] = useState<DiscussionThread[]>([]);
  const [selectedThread, setSelectedThread] = useState<DiscussionThread | null>(null);
  const [messages, setMessages] = useState<GroupMessage[]>([]);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [memberCount, setMemberCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isMember, setIsMember] = useState(false);
  const [showMembersSidebar, setShowMembersSidebar] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);

  const groupId = Number(params.id);

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }

    checkMembershipAndLoadData();
  }, [user, groupId]);

  useEffect(() => {
    if (selectedThread) {
      loadMessages(selectedThread.id);
      setupRealtimeSubscription(selectedThread.id);
    }
  }, [selectedThread?.id]);

  async function checkMembershipAndLoadData() {
    if (!user) return;

    try {
      const { data: memberData } = await supabase
        .from('group_members')
        .select('id, has_completed_onboarding')
        .eq('group_id', groupId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (!memberData) {
        setShowWelcome(true);
        setIsLoading(false);
        await loadGroupData();
        return;
      }

      // Only show onboarding if explicitly false (not null or true)
      // Treat null as already completed (for backward compatibility with old records)
      if (memberData.has_completed_onboarding === false) {
        setNeedsOnboarding(true);
        setShowOnboarding(true);
        setIsMember(false);
        await loadGroupData();
        setIsLoading(false);
        return;
      }

      setIsMember(true);
      await Promise.all([
        loadGroupData(),
        loadThreads(),
        loadMembers()
      ]);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('載入社群資料失敗');
    } finally {
      setIsLoading(false);
    }
  }

  async function loadGroupData() {
    const { data, error } = await supabase
      .from('discussion_groups')
      .select('*')
      .eq('id', groupId)
      .maybeSingle();

    if (error) throw error;
    setGroup(data);
  }

  async function loadThreads() {
    const { data, error } = await supabase
      .from('discussion_threads')
      .select(`
        *,
        profiles (
          id,
          username,
          avatar_url
        )
      `)
      .eq('group_id', groupId)
      .order('is_pinned', { ascending: false })
      .order('last_activity_at', { ascending: false });

    if (error) throw error;
    setThreads(data || []);

    if (data && data.length > 0 && !selectedThread) {
      setSelectedThread(data[0]);
    }
  }

  async function loadMessages(threadId: number) {
    const { data, error } = await supabase
      .from('group_messages')
      .select(`
        *,
        profiles (
          id,
          username,
          avatar_url
        )
      `)
      .eq('thread_id', threadId)
      .eq('is_deleted', false)
      .order('created_at', { ascending: true })
      .limit(200);

    if (error) throw error;
    setMessages(data || []);
  }

  async function loadMembers() {
    const { data, error, count } = await supabase
      .from('group_members')
      .select(`
        *,
        profiles (
          id,
          username,
          avatar_url
        )
      `, { count: 'exact' })
      .eq('group_id', groupId)
      .order('role', { ascending: true })
      .order('joined_at', { ascending: true });

    if (error) throw error;
    setMembers(data || []);
    setMemberCount(count || 0);
  }

  function setupRealtimeSubscription(threadId: number) {
    const channel = supabase
      .channel(`thread_${threadId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'group_messages',
          filter: `thread_id=eq.${threadId}`
        },
        async (payload) => {
          const { data: newMessage } = await supabase
            .from('group_messages')
            .select(`
              *,
              profiles (
                id,
                username,
                avatar_url
              )
            `)
            .eq('id', payload.new.id)
            .maybeSingle();

          if (newMessage) {
            setMessages((prev) => [...prev, newMessage]);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'discussion_threads',
          filter: `group_id=eq.${groupId}`
        },
        () => {
          loadThreads();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }

  async function handleSendMessage(content: string) {
    if (!user || !selectedThread) return;

    const { error } = await supabase
      .from('group_messages')
      .insert({
        group_id: groupId,
        thread_id: selectedThread.id,
        user_id: user.id,
        content,
        message_type: 'message'
      });

    if (error) {
      console.error('Error sending message:', error);
      toast.error('發送訊息失敗');
      throw error;
    }
  }

  function handleThreadSelect(threadId: number) {
    const thread = threads.find(t => t.id === threadId);
    if (thread) {
      setSelectedThread(thread);
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="h-screen flex">
          <div className="w-80 border-r bg-white p-4 space-y-4">
            <Skeleton className="h-12 w-full" />
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
          <div className="flex-1 flex flex-col">
            <Skeleton className="h-16 w-full" />
            <div className="flex-1 p-4 space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex gap-3">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-20 w-96" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (showWelcome && group) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-3xl mx-auto">
            <Link href="/">
              <Button variant="ghost" className="mb-8 gap-2">
                <ArrowLeft className="h-4 w-4" />
                返回首頁
              </Button>
            </Link>

            <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
              <div className="bg-gradient-to-r from-slate-900 to-slate-800 p-12 text-white text-center">
                <MessageSquare className="h-20 w-20 mx-auto mb-6 opacity-90" />
                <h1 className="text-4xl font-bold mb-4">{group.name}</h1>
                {group.description && (
                  <p className="text-xl text-slate-100 mb-8">{group.description}</p>
                )}
              </div>

              <div className="p-12">
                <div className="space-y-8">
                  <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">
                      歡迎來到我們的社群！
                    </h2>
                    <p className="text-gray-600 text-lg leading-relaxed">
                      這是一個充滿活力的討論空間，讓讀者們能夠互相交流想法、分享見解，並建立有意義的連結。
                    </p>
                  </div>

                  <div className="grid md:grid-cols-3 gap-6">
                    <div className="bg-slate-50 rounded-xl p-6 text-center">
                      <div className="bg-slate-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                        <MessageSquare className="h-8 w-8 text-slate-600" />
                      </div>
                      <h3 className="font-semibold text-gray-900 mb-2">即時討論</h3>
                      <p className="text-sm text-gray-600">
                        參與即時對話，與其他成員交流想法
                      </p>
                    </div>

                    <div className="bg-slate-50 rounded-xl p-6 text-center">
                      <div className="bg-slate-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                        <UsersIcon className="h-8 w-8 text-slate-600" />
                      </div>
                      <h3 className="font-semibold text-gray-900 mb-2">社群互動</h3>
                      <p className="text-sm text-gray-600">
                        結識志同道合的朋友，建立人脈
                      </p>
                    </div>

                    <div className="bg-slate-50 rounded-xl p-6 text-center">
                      <div className="bg-slate-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                        <BookOpen className="h-8 w-8 text-slate-600" />
                      </div>
                      <h3 className="font-semibold text-gray-900 mb-2">知識分享</h3>
                      <p className="text-sm text-gray-600">
                        分享知識與經驗，共同成長學習
                      </p>
                    </div>
                  </div>

                  <div className="border-t border-gray-200 pt-8">
                    <div className="bg-gradient-to-r from-slate-50 to-slate-100 rounded-xl p-8 text-center">
                      <h3 className="text-xl font-bold text-gray-900 mb-4">
                        準備好加入我們了嗎？
                      </h3>
                      <p className="text-gray-600 mb-6">
                        只需一鍵，即可開始與社群成員互動交流
                      </p>
                      <Button
                        size="lg"
                        className="bg-slate-700 hover:bg-slate-800 text-white px-8 py-6 text-lg font-semibold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        onClick={async () => {
                          if (!user || isJoining) return;

                          setIsJoining(true);

                          try {
                            const { error } = await supabase
                              .from('group_members')
                              .insert({
                                group_id: groupId,
                                user_id: user.id,
                                role: 'member',
                                has_completed_onboarding: false
                              });

                            if (error) {
                              if (error.code === '23505') {
                                toast.success('您已經是社群成員！');
                              } else {
                                throw error;
                              }
                            }

                            setShowWelcome(false);
                            setNeedsOnboarding(true);
                            setShowOnboarding(true);
                            setIsJoining(false);
                          } catch (error: any) {
                            console.error('Error joining group:', error);
                            toast.error('加入社群失敗，請稍後再試');
                            setIsJoining(false);
                          }
                        }}
                        disabled={isJoining}
                      >
                        {isJoining ? (
                          <>
                            <svg className="animate-spin h-5 w-5 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            加入中...
                          </>
                        ) : (
                          <>
                            <UsersIcon className="h-5 w-5 mr-2" />
                            立即加入社群
                          </>
                        )}
                      </Button>
                    </div>
                  </div>

                  <div className="text-center text-sm text-gray-500">
                    <p>加入後即可查看所有討論串並參與對話</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (needsOnboarding && group) {
    return (
      <>
        <CommunityOnboardingDialog
          open={showOnboarding}
          onComplete={async () => {
            setShowOnboarding(false);
            setNeedsOnboarding(false);
            setIsMember(true);
            setIsLoading(true);
            await Promise.all([
              loadThreads(),
              loadMembers()
            ]);
            setIsLoading(false);
          }}
          groupId={groupId}
          userId={user!.id}
        />
      </>
    );
  }

  if (!isMember || !group) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="h-screen flex flex-col">
        <div className="border-b bg-gradient-to-r from-slate-900 to-slate-800 text-white px-6 py-4 shadow-xl">
          <div className="container mx-auto flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/">
                <Button variant="ghost" size="sm" className="text-white hover:bg-slate-800 gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  返回
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold">{group.name}</h1>
                {group.description && (
                  <p className="text-sm text-slate-100">{group.description}</p>
                )}
              </div>
            </div>

            <Sheet open={showMembersSidebar} onOpenChange={setShowMembersSidebar}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm" className="text-white hover:bg-slate-800 gap-2 lg:hidden">
                  <UsersIcon className="h-4 w-4" />
                  成員 ({memberCount})
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-80 p-0">
                <GroupMembersSidebar
                  members={members}
                  totalCount={memberCount}
                  groupId={groupId}
                  currentUserId={user?.id}
                  isAdmin={profile?.is_admin}
                  onMemberKicked={loadMembers}
                />
              </SheetContent>
            </Sheet>
          </div>
        </div>

        <div className="flex-1 flex overflow-hidden">
          <div className="hidden md:flex md:w-80 border-r bg-white shadow-lg flex-col">
            <div className="p-4 border-b bg-gradient-to-br from-gray-50 to-white">
              <CreateThreadDialog
                groupId={groupId}
                userId={user!.id}
                onThreadCreated={loadThreads}
              />
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              <ThreadList
                threads={threads}
                selectedThreadId={selectedThread?.id || null}
                onThreadSelect={handleThreadSelect}
                isAdmin={profile?.is_admin}
                onThreadUpdate={loadThreads}
              />
            </div>
          </div>

          <div className="flex-1 flex flex-col bg-gradient-to-b from-white to-gray-50">
            <div className="md:hidden border-b bg-white p-4">
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" className="w-full">
                    <MessageSquare className="h-4 w-4 mr-2" />
                    {selectedThread ? selectedThread.title : '選擇討論串'}
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-80 p-0">
                  <div className="p-4 border-b bg-gradient-to-br from-gray-50 to-white">
                    <CreateThreadDialog
                      groupId={groupId}
                      userId={user!.id}
                      onThreadCreated={loadThreads}
                    />
                  </div>
                  <div className="flex-1 overflow-y-auto p-4">
                    <ThreadList
                      threads={threads}
                      selectedThreadId={selectedThread?.id || null}
                      onThreadSelect={handleThreadSelect}
                      isAdmin={profile?.is_admin}
                      onThreadUpdate={loadThreads}
                    />
                  </div>
                </SheetContent>
              </Sheet>
            </div>

            {selectedThread && (
              <>
                <div className="border-b bg-white px-6 py-4 shadow-sm">
                  <h2 className="text-xl font-bold text-gray-900">{selectedThread.title}</h2>
                  {selectedThread.description && (
                    <p className="text-sm text-gray-600 mt-1">{selectedThread.description}</p>
                  )}
                </div>

                <ThreadMessages
                  messages={messages}
                  currentUserId={user?.id}
                  isAdmin={profile?.is_admin}
                  onMessageDelete={() => loadMessages(selectedThread.id)}
                />

                <div className="border-t bg-white p-4">
                  <div className="container mx-auto max-w-5xl">
                    <ChatInput
                      onSend={handleSendMessage}
                      disabled={selectedThread.is_locked}
                    />
                    {selectedThread.is_locked && (
                      <p className="text-xs text-amber-600 mt-2 text-center">
                        此討論串已被鎖定，無法發送新訊息
                      </p>
                    )}
                  </div>
                </div>
              </>
            )}

            {!selectedThread && threads.length > 0 && (
              <div className="flex-1 flex items-center justify-center text-gray-500">
                <p>請選擇一個討論串開始對話</p>
              </div>
            )}
          </div>

          <div className="hidden lg:block">
            <GroupMembersSidebar
              members={members}
              totalCount={memberCount}
              groupId={groupId}
              currentUserId={user?.id}
              isAdmin={profile?.is_admin}
              onMemberKicked={loadMembers}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
