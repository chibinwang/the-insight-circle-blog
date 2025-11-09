'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { PostCard } from '@/components/post-card';
import { User, Calendar, Mail, TrendingUp, Users, FileText, Send, Loader2, Edit, Eye, Clock, FileEdit, Search, CheckCircle, XCircle, MousePointerClick, ArrowLeft, Bookmark, Tag, Library, Shield } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { notFound } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { DeletePostButton } from '@/components/delete-post-button';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Post, UserTitle } from '@/lib/supabase';
import { UserTitleBadge } from '@/components/user-title-badge';
import { TitleSelectionDialog } from '@/components/title-selection-dialog';
import { UserQuotesDisplay } from '@/components/user-quotes-display';
import { QuoteSelectionDialog } from '@/components/quote-selection-dialog';
import { BookCard } from '@/components/book-card';

type Subscriber = {
  id: number;
  email: string;
  is_subscribed: boolean;
  subscribed_at: string;
  unsubscribed_at: string | null;
};

type PostStats = {
  post_id: number;
  post_title: string;
  post_slug: string;
  sent_count: number;
  open_count: number;
  click_count: number;
  open_rate: number;
  click_rate: number;
  sent_at: string;
};

export default function ProfilePage({ params }: { params: { username: string } }) {
  const [profile, setProfile] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const defaultTab = profile?.is_admin ? 'dashboard' : 'overview';
  const initialTab = searchParams.get('tab') || defaultTab;
  const [activeTab, setActiveTab] = useState(initialTab);

  const [publishedPosts, setPublishedPosts] = useState<Post[]>([]);
  const [draftPosts, setDraftPosts] = useState<Post[]>([]);
  const [scheduledPosts, setScheduledPosts] = useState<Post[]>([]);
  const [popularPosts, setPopularPosts] = useState<Post[]>([]);
  const [subscriberCount, setSubscriberCount] = useState(0);
  const [postsCount, setPostsCount] = useState(0);
  const [draftsCount, setDraftsCount] = useState(0);
  const [scheduledCount, setScheduledCount] = useState(0);
  const [emailSubject, setEmailSubject] = useState('');
  const [emailContent, setEmailContent] = useState('');
  const [sendingEmail, setSendingEmail] = useState(false);

  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [filteredSubscribers, setFilteredSubscribers] = useState<Subscriber[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'unsubscribed'>('active');

  const [postStats, setPostStats] = useState<PostStats[]>([]);
  const [totalStats, setTotalStats] = useState({
    totalSent: 0,
    totalOpened: 0,
    totalClicked: 0,
    avgOpenRate: 0,
    avgClickRate: 0,
  });

  const [savedPosts, setSavedPosts] = useState<any[]>([]);
  const [myBooks, setMyBooks] = useState<any[]>([]);
  const [titleDialogOpen, setTitleDialogOpen] = useState(false);
  const [quoteDialogOpen, setQuoteDialogOpen] = useState(false);

  const { toast } = useToast();
  const isOwnProfile = user?.id === profile?.id;
  const isAdmin = profile?.is_admin;
  const showAdminTabs = isOwnProfile && isAdmin;

  useEffect(() => {
    loadProfile();
  }, [params.username]);

  useEffect(() => {
    if (profile && isOwnProfile && isAdmin && !searchParams.get('tab')) {
      setActiveTab('dashboard');
    }
  }, [profile, isOwnProfile, isAdmin, searchParams]);

  useEffect(() => {
    if (showAdminTabs && activeTab === 'dashboard') {
      fetchDashboardData();
    } else if (showAdminTabs && activeTab === 'subscribers') {
      fetchSubscribers();
    } else if (showAdminTabs && activeTab === 'analytics') {
      fetchAnalytics();
    } else if (isOwnProfile && !isAdmin) {
      fetchSavedPosts();
      fetchMyBooks();
    }
  }, [showAdminTabs, activeTab, isOwnProfile, isAdmin]);

  useEffect(() => {
    filterSubscribers();
  }, [subscribers, searchTerm, filter]);

  const loadProfile = async () => {
    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('username', params.username)
      .maybeSingle();

    let finalProfile = profileData;

    if (!profileData) {
      const { data: profileById } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', params.username)
        .maybeSingle();
      finalProfile = profileById;
    }

    if (!finalProfile) {
      notFound();
    }

    setProfile(finalProfile);

    const { data: userPosts } = await supabase
      .from('posts')
      .select(`
        *,
        profiles (
          username
        )
      `)
      .eq('author_id', finalProfile.id)
      .eq('is_published', true)
      .eq('scheduling_status', 'published')
      .order('created_at', { ascending: false });

    setPosts(userPosts || []);
    setLoading(false);
  };

  const fetchDashboardData = async () => {
    const { count: postsTotal } = await supabase
      .from('posts')
      .select('*', { count: 'exact', head: true })
      .eq('is_published', true)
      .eq('scheduling_status', 'published');

    const { count: draftsTotal } = await supabase
      .from('posts')
      .select('*', { count: 'exact', head: true })
      .eq('scheduling_status', 'draft');

    const { count: scheduledTotal } = await supabase
      .from('posts')
      .select('*', { count: 'exact', head: true })
      .eq('scheduling_status', 'scheduled');

    const { count: subscribersTotal } = await supabase
      .from('subscribers')
      .select('*', { count: 'exact', head: true })
      .eq('is_subscribed', true);

    setPostsCount(postsTotal || 0);
    setDraftsCount(draftsTotal || 0);
    setScheduledCount(scheduledTotal || 0);
    setSubscriberCount(subscribersTotal || 0);

    const { data: published } = await supabase
      .from('posts')
      .select('*')
      .eq('is_published', true)
      .eq('scheduling_status', 'published')
      .order('created_at', { ascending: false })
      .limit(3);

    const { data: drafts } = await supabase
      .from('posts')
      .select('*')
      .eq('scheduling_status', 'draft')
      .order('created_at', { ascending: false })
      .limit(10);

    const { data: scheduled } = await supabase
      .from('posts')
      .select('*')
      .eq('scheduling_status', 'scheduled')
      .order('scheduled_publish_at', { ascending: true })
      .limit(10);

    const { data: popular } = await supabase
      .from('posts')
      .select('*')
      .eq('is_published', true)
      .eq('scheduling_status', 'published')
      .order('view_count', { ascending: false })
      .limit(5);

    setPublishedPosts(published || []);
    setDraftPosts(drafts || []);
    setScheduledPosts(scheduled || []);
    setPopularPosts(popular || []);
  };

  const fetchSubscribers = async () => {
    const { data } = await supabase
      .from('subscribers')
      .select('*')
      .order('subscribed_at', { ascending: false });

    setSubscribers(data || []);
  };

  const fetchAnalytics = async () => {
    const { data: stats } = await supabase
      .from('email_stats')
      .select(`
        *,
        posts (
          id,
          title,
          slug,
          email_sent_at
        )
      `);

    if (!stats) return;

    const postMap = new Map<number, PostStats>();

    stats.forEach((stat: any) => {
      const postId = stat.post_id;
      const post = stat.posts;

      if (!post) return;

      if (!postMap.has(postId)) {
        postMap.set(postId, {
          post_id: postId,
          post_title: post.title,
          post_slug: post.slug,
          sent_count: 0,
          open_count: 0,
          click_count: 0,
          open_rate: 0,
          click_rate: 0,
          sent_at: post.email_sent_at,
        });
      }

      const postStat = postMap.get(postId)!;
      postStat.sent_count++;
      if (stat.opened_at) postStat.open_count++;
      if (stat.clicked_at) postStat.click_count++;
    });

    const postStatsArray = Array.from(postMap.values()).map((stat) => ({
      ...stat,
      open_rate: stat.sent_count > 0 ? (stat.open_count / stat.sent_count) * 100 : 0,
      click_rate: stat.sent_count > 0 ? (stat.click_count / stat.sent_count) * 100 : 0,
    }));

    postStatsArray.sort((a, b) => new Date(b.sent_at).getTime() - new Date(a.sent_at).getTime());

    const totalSent = postStatsArray.reduce((sum, stat) => sum + stat.sent_count, 0);
    const totalOpened = postStatsArray.reduce((sum, stat) => sum + stat.open_count, 0);
    const totalClicked = postStatsArray.reduce((sum, stat) => sum + stat.click_count, 0);

    setTotalStats({
      totalSent,
      totalOpened,
      totalClicked,
      avgOpenRate: totalSent > 0 ? (totalOpened / totalSent) * 100 : 0,
      avgClickRate: totalSent > 0 ? (totalClicked / totalSent) * 100 : 0,
    });

    setPostStats(postStatsArray);
  };

  const fetchSavedPosts = async () => {
    if (!user) return;

    const { data: savedArticles } = await supabase
      .from('saved_articles')
      .select(`
        post_id,
        saved_at,
        posts (
          *,
          profiles (
            username
          )
        )
      `)
      .eq('user_id', user.id)
      .order('saved_at', { ascending: false });

    if (savedArticles) {
      const posts = savedArticles.map((item: any) => item.posts).filter(Boolean);
      setSavedPosts(posts);
    }
  };

  const fetchMyBooks = async () => {
    if (!user) return;

    const { data: bookList } = await supabase
      .from('user_book_list')
      .select(`
        book_id,
        added_at,
        books (
          *
        )
      `)
      .eq('user_id', user.id)
      .order('added_at', { ascending: false });

    if (bookList) {
      const booksWithCounts = await Promise.all(
        bookList.map(async (item: any) => {
          if (!item.books) return null;

          const { count } = await supabase
            .from('book_takeaways')
            .select('*', { count: 'exact', head: true })
            .eq('book_id', item.books.id);

          return {
            ...item.books,
            takeaway_count: count || 0,
          };
        })
      );

      setMyBooks(booksWithCounts.filter(Boolean));
    }
  };

  const filterSubscribers = () => {
    let filtered = subscribers;

    if (filter === 'active') {
      filtered = filtered.filter(s => s.is_subscribed);
    } else if (filter === 'unsubscribed') {
      filtered = filtered.filter(s => !s.is_subscribed);
    }

    if (searchTerm) {
      filtered = filtered.filter(s =>
        s.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredSubscribers(filtered);
  };

  const handleSendCustomEmail = async () => {
    if (!emailSubject.trim() || !emailContent.trim()) {
      toast({
        title: 'Error',
        description: 'Please provide both subject and content',
        variant: 'destructive',
      });
      return;
    }

    const subscriberText = subscriberCount === 1 ? '1 subscriber' : `${subscriberCount} subscribers`;
    if (!confirm(`Send this email to ${subscriberText}?`)) return;

    setSendingEmail(true);

    try {
      const response = await fetch('/api/send-custom-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject: emailSubject, content: emailContent }),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: 'Email Sent!',
          description: `Successfully sent to ${data.sentCount} subscribers.`,
        });
        setEmailSubject('');
        setEmailContent('');
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Failed to send email',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to send email',
        variant: 'destructive',
      });
    } finally {
      setSendingEmail(false);
    }
  };

  const getStatusBadge = (post: Post) => {
    if (post.scheduling_status === 'scheduled') {
      return (
        <Badge variant="outline" className="shrink-0 bg-blue-50 text-blue-700 border-blue-300">
          <Clock className="h-3 w-3 mr-1" />
          Scheduled
        </Badge>
      );
    }
    if (post.scheduling_status === 'draft') {
      return (
        <Badge variant="secondary" className="shrink-0">
          Draft
        </Badge>
      );
    }
    if (post.is_published) {
      return (
        <Badge variant="default" className="shrink-0 bg-green-600">
          Published
        </Badge>
      );
    }
    return null;
  };

  const activeCount = subscribers.filter(s => s.is_subscribed).length;
  const unsubscribedCount = subscribers.filter(s => !s.is_subscribed).length;

  const handleTitleUpdate = (newTitle: UserTitle) => {
    setProfile({ ...profile, user_title: newTitle });
  };

  const handleQuoteDialogComplete = () => {
    setQuoteDialogOpen(false);
    router.refresh();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-12">
          <div className="flex items-start space-x-6">
            <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center">
              {profile.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt={profile.username || 'User'}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <User className="h-12 w-12 text-gray-400" />
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold">
                  {profile.username || 'Anonymous'}
                </h1>
                {profile.user_title && <UserTitleBadge title={profile.user_title} size="lg" />}
              </div>
              {!profile.user_title && isOwnProfile && !isAdmin && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setTitleDialogOpen(true)}
                  className="mb-3 gap-2"
                >
                  <Tag className="h-4 w-4" />
                  選擇身份標籤
                </Button>
              )}
              {profile.user_title && isOwnProfile && !isAdmin && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setTitleDialogOpen(true)}
                  className="mb-3 gap-2 text-gray-600 hover:text-gray-900"
                >
                  <Edit className="h-3 w-3" />
                  編輯標籤
                </Button>
              )}
              {profile.bio && <p className="text-gray-600 mb-4">{profile.bio}</p>}
              <div className="flex items-center space-x-2 text-gray-500 text-sm">
                <Calendar className="h-4 w-4" />
                <span>
                  Joined {formatDistanceToNow(new Date(profile.created_at), { addSuffix: true })}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showAdminTabs ? (
        <div className="container mx-auto px-4 py-8">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
              <TabsTrigger value="subscribers">Subscribers</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold mb-6">Posts ({posts.length})</h2>
                {posts.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-gray-500 text-lg">No posts yet.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {posts.map((post) => (
                      <PostCard key={post.id} post={post} />
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="dashboard" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="bg-white shadow-sm hover:shadow-md transition-shadow">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-slate-600">Published</CardTitle>
                    <FileText className="h-5 w-5 text-green-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-slate-900">{postsCount}</div>
                    <Link href="/admin/create">
                      <Button className="mt-4 w-full" size="sm">Create New Post</Button>
                    </Link>
                  </CardContent>
                </Card>

                <Card className="bg-white shadow-sm hover:shadow-md transition-shadow">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-slate-600">Drafts</CardTitle>
                    <FileEdit className="h-5 w-5 text-slate-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-slate-900">{draftsCount}</div>
                    <p className="text-xs text-slate-500 mt-4">Unpublished articles</p>
                  </CardContent>
                </Card>

                <Card className="bg-white shadow-sm hover:shadow-md transition-shadow">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-slate-600">Scheduled</CardTitle>
                    <Clock className="h-5 w-5 text-blue-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-slate-900">{scheduledCount}</div>
                    <Link href="/admin/scheduled">
                      <Button variant="outline" className="mt-4 w-full" size="sm">View Schedule</Button>
                    </Link>
                  </CardContent>
                </Card>

                <Card className="bg-white shadow-sm hover:shadow-md transition-shadow">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-slate-600">Subscribers</CardTitle>
                    <Users className="h-5 w-5 text-orange-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-slate-900">{subscriberCount}</div>
                    <Button
                      variant="outline"
                      className="mt-4 w-full"
                      size="sm"
                      onClick={() => setActiveTab('subscribers')}
                    >
                      View All
                    </Button>
                  </CardContent>
                </Card>
              </div>

              <Card className="bg-white shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <div>
                    <CardTitle className="text-lg font-medium text-slate-900 flex items-center gap-2">
                      <Shield className="h-5 w-5 text-blue-600" />
                      Admin Management
                    </CardTitle>
                    <p className="text-sm text-slate-500 mt-1">Manage admin users and permissions</p>
                  </div>
                </CardHeader>
                <CardContent>
                  <Link href="/admin/manage-admins">
                    <Button variant="outline" className="w-full gap-2">
                      <Shield className="h-4 w-4" />
                      Manage Admins
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              <Tabs defaultValue="published" className="space-y-6">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="published">Published (Latest 3)</TabsTrigger>
                  <TabsTrigger value="drafts">Drafts</TabsTrigger>
                  <TabsTrigger value="scheduled">Scheduled</TabsTrigger>
                  <TabsTrigger value="popular">Most Popular</TabsTrigger>
                </TabsList>

                <TabsContent value="published">
                  <Card className="bg-white shadow-sm">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-xl">
                        <FileText className="h-5 w-5" />
                        Latest Published Articles
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {publishedPosts.length === 0 ? (
                        <p className="text-slate-500 text-center py-8">No published posts yet</p>
                      ) : (
                        <div className="space-y-3">
                          {publishedPosts.map((post) => (
                            <div
                              key={post.id}
                              className="flex items-center justify-between p-4 border rounded-lg hover:bg-slate-50 transition-colors"
                            >
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <h3 className="font-medium text-slate-900 truncate">{post.title}</h3>
                                  {getStatusBadge(post)}
                                </div>
                                <div className="flex items-center gap-4 text-sm text-slate-500">
                                  <span>{formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}</span>
                                  <span className="flex items-center gap-1">
                                    <Eye className="h-3 w-3" />
                                    {post.view_count} views
                                  </span>
                                </div>
                              </div>
                              <div className="flex gap-2 ml-4">
                                <Link href={`/post/${post.slug}`} target="_blank">
                                  <Button variant="ghost" size="sm" className="gap-1">
                                    <Eye className="h-4 w-4" />
                                    View
                                  </Button>
                                </Link>
                                <Link href={`/admin/edit/${post.id}`}>
                                  <Button variant="outline" size="sm" className="gap-1">
                                    <Edit className="h-4 w-4" />
                                    Edit
                                  </Button>
                                </Link>
                                <DeletePostButton postId={post.id} />
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="drafts">
                  <Card className="bg-white shadow-sm">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-xl">
                        <FileEdit className="h-5 w-5" />
                        Draft Articles
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {draftPosts.length === 0 ? (
                        <p className="text-slate-500 text-center py-8">No drafts</p>
                      ) : (
                        <div className="space-y-3">
                          {draftPosts.map((post) => (
                            <div
                              key={post.id}
                              className="flex items-center justify-between p-4 border rounded-lg hover:bg-slate-50 transition-colors"
                            >
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <h3 className="font-medium text-slate-900 truncate">{post.title}</h3>
                                  {getStatusBadge(post)}
                                </div>
                                <p className="text-sm text-slate-500">
                                  {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                                </p>
                              </div>
                              <div className="flex gap-2 ml-4">
                                <Link href={`/admin/edit/${post.id}`}>
                                  <Button variant="outline" size="sm" className="gap-1">
                                    <Edit className="h-4 w-4" />
                                    Edit
                                  </Button>
                                </Link>
                                <DeletePostButton postId={post.id} />
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="scheduled">
                  <Card className="bg-white shadow-sm">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-xl">
                        <Clock className="h-5 w-5" />
                        Scheduled Posts
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {scheduledPosts.length === 0 ? (
                        <p className="text-slate-500 text-center py-8">No scheduled posts</p>
                      ) : (
                        <div className="space-y-3">
                          {scheduledPosts.map((post) => (
                            <div
                              key={post.id}
                              className="flex items-center justify-between p-4 border rounded-lg hover:bg-slate-50 transition-colors"
                            >
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <h3 className="font-medium text-slate-900 truncate">{post.title}</h3>
                                  {getStatusBadge(post)}
                                </div>
                                <div className="flex items-center gap-2 text-sm">
                                  <Clock className="h-3 w-3 text-blue-600" />
                                  <span className="text-blue-700 font-medium">
                                    {post.scheduled_publish_at && format(new Date(post.scheduled_publish_at), 'PPp')}
                                  </span>
                                  <span className="text-slate-400">•</span>
                                  <span className="text-slate-500">
                                    {post.scheduled_publish_at && formatDistanceToNow(new Date(post.scheduled_publish_at), { addSuffix: true })}
                                  </span>
                                </div>
                              </div>
                              <div className="flex gap-2 ml-4">
                                <Link href={`/admin/edit/${post.id}`}>
                                  <Button variant="outline" size="sm" className="gap-1">
                                    <Edit className="h-4 w-4" />
                                    Edit
                                  </Button>
                                </Link>
                                <DeletePostButton postId={post.id} />
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="popular">
                  <Card className="bg-white shadow-sm">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-xl">
                        <TrendingUp className="h-5 w-5" />
                        Most Popular Articles
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {popularPosts.length === 0 ? (
                        <p className="text-slate-500 text-center py-8">No published posts yet</p>
                      ) : (
                        <div className="space-y-3">
                          {popularPosts.map((post, index) => (
                            <div
                              key={post.id}
                              className="flex items-center justify-between p-4 border rounded-lg hover:bg-slate-50 transition-colors"
                            >
                              <div className="flex items-center gap-4 flex-1 min-w-0">
                                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-orange-100 text-orange-700 font-bold text-sm shrink-0">
                                  {index + 1}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h3 className="font-medium text-slate-900 truncate mb-1">{post.title}</h3>
                                  <div className="flex items-center gap-4 text-sm text-slate-500">
                                    <span className="flex items-center gap-1">
                                      <Eye className="h-3 w-3" />
                                      {post.view_count} views
                                    </span>
                                    <span>{formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}</span>
                                  </div>
                                </div>
                              </div>
                              <div className="flex gap-2 ml-4">
                                <Link href={`/post/${post.slug}`} target="_blank">
                                  <Button variant="ghost" size="sm" className="gap-1">
                                    <Eye className="h-4 w-4" />
                                    View
                                  </Button>
                                </Link>
                                <Link href={`/admin/edit/${post.id}`}>
                                  <Button variant="outline" size="sm" className="gap-1">
                                    <Edit className="h-4 w-4" />
                                    Edit
                                  </Button>
                                </Link>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>

              <Card className="bg-white shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <Mail className="h-5 w-5" />
                    Send Email to Subscribers
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="subject" className="text-sm font-medium text-slate-700">Subject</Label>
                    <Input
                      id="subject"
                      placeholder="Enter email subject"
                      value={emailSubject}
                      onChange={(e) => setEmailSubject(e.target.value)}
                      className="mt-1.5"
                    />
                  </div>
                  <div>
                    <Label htmlFor="content" className="text-sm font-medium text-slate-700">Content</Label>
                    <Textarea
                      id="content"
                      placeholder="Write your email content here..."
                      value={emailContent}
                      onChange={(e) => setEmailContent(e.target.value)}
                      rows={8}
                      className="mt-1.5 resize-none"
                    />
                  </div>
                  <Button
                    onClick={handleSendCustomEmail}
                    disabled={sendingEmail || !emailSubject.trim() || !emailContent.trim()}
                    className="w-full gap-2"
                    size="lg"
                  >
                    {sendingEmail ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Sending to {subscriberCount} subscribers...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4" />
                        Send to {subscriberCount} {subscriberCount === 1 ? 'subscriber' : 'subscribers'}
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="analytics" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-gray-600">Total Sent</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2">
                      <Mail className="h-5 w-5 text-blue-600" />
                      <p className="text-3xl font-bold">{totalStats.totalSent}</p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-gray-600">Total Opens</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2">
                      <Eye className="h-5 w-5 text-green-600" />
                      <p className="text-3xl font-bold">{totalStats.totalOpened}</p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-gray-600">Total Clicks</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2">
                      <MousePointerClick className="h-5 w-5 text-slate-600" />
                      <p className="text-3xl font-bold">{totalStats.totalClicked}</p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-gray-600">Avg Open Rate</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-orange-600" />
                      <p className="text-3xl font-bold">{totalStats.avgOpenRate.toFixed(1)}%</p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-gray-600">Avg Click Rate</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-pink-600" />
                      <p className="text-3xl font-bold">{totalStats.avgClickRate.toFixed(1)}%</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Post Performance</CardTitle>
                  <CardDescription>Email engagement metrics for each newsletter sent</CardDescription>
                </CardHeader>
                <CardContent>
                  {postStats.length === 0 ? (
                    <div className="text-center py-12">
                      <Mail className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500">No newsletters sent yet</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {postStats.map((stat) => (
                        <div
                          key={stat.post_id}
                          className="border rounded-lg p-6 hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex-1">
                              <Link
                                href={`/post/${stat.post_slug}`}
                                className="text-lg font-semibold hover:underline"
                                target="_blank"
                              >
                                {stat.post_title}
                              </Link>
                              <p className="text-sm text-gray-500 mt-1">
                                Sent {formatDistanceToNow(new Date(stat.sent_at), { addSuffix: true })}
                              </p>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                            <div>
                              <p className="text-sm text-gray-600 mb-1">Sent</p>
                              <p className="text-2xl font-bold">{stat.sent_count}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600 mb-1">Opens</p>
                              <p className="text-2xl font-bold text-green-600">{stat.open_count}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600 mb-1">Clicks</p>
                              <p className="text-2xl font-bold text-slate-600">{stat.click_count}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600 mb-1">Open Rate</p>
                              <p className="text-2xl font-bold text-orange-600">{stat.open_rate.toFixed(1)}%</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600 mb-1">Click Rate</p>
                              <p className="text-2xl font-bold text-pink-600">{stat.click_rate.toFixed(1)}%</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="subscribers" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-gray-600">Total Subscribers</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold">{subscribers.length}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-gray-600">Active Subscribers</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold text-green-600">{activeCount}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-gray-600">Unsubscribed</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold text-gray-400">{unsubscribedCount}</p>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <CardTitle>Subscriber List</CardTitle>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          type="text"
                          placeholder="Search by email..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-10 w-full sm:w-64"
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant={filter === 'all' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setFilter('all')}
                        >
                          All
                        </Button>
                        <Button
                          variant={filter === 'active' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setFilter('active')}
                        >
                          Active
                        </Button>
                        <Button
                          variant={filter === 'unsubscribed' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setFilter('unsubscribed')}
                        >
                          Unsubscribed
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {filteredSubscribers.length === 0 ? (
                    <div className="text-center py-12">
                      <Mail className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500">No subscribers found</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {filteredSubscribers.map((subscriber) => (
                        <div
                          key={subscriber.id}
                          className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                        >
                          <div className="flex items-center gap-3">
                            {subscriber.is_subscribed ? (
                              <CheckCircle className="h-5 w-5 text-green-600" />
                            ) : (
                              <XCircle className="h-5 w-5 text-gray-400" />
                            )}
                            <div>
                              <p className="font-medium">{subscriber.email}</p>
                              <p className="text-sm text-gray-500">
                                {subscriber.is_subscribed ? (
                                  <>Subscribed {formatDistanceToNow(new Date(subscriber.subscribed_at), { addSuffix: true })}</>
                                ) : subscriber.unsubscribed_at ? (
                                  <>Unsubscribed {formatDistanceToNow(new Date(subscriber.unsubscribed_at), { addSuffix: true })}</>
                                ) : (
                                  'Unsubscribed'
                                )}
                              </p>
                            </div>
                          </div>
                          <span
                            className={`px-3 py-1 text-xs font-medium rounded-full ${
                              subscriber.is_subscribed
                                ? 'bg-green-100 text-green-800'
                                : 'bg-gray-100 text-gray-600'
                            }`}
                          >
                            {subscriber.is_subscribed ? 'Active' : 'Unsubscribed'}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      ) : isOwnProfile ? (
        <div className="container mx-auto px-4 py-8">
          <div className="mb-12">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold">我的座右銘</h2>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setQuoteDialogOpen(true)}
                className="gap-2"
              >
                <Edit className="h-4 w-4" />
                管理語錄
              </Button>
            </div>
            <UserQuotesDisplay userId={user?.id || ''} />
          </div>

          <div className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <Library className="h-6 w-6 text-blue-600" />
              <h2 className="text-2xl font-bold">我的書單 ({myBooks.length})</h2>
            </div>
            {myBooks.length === 0 ? (
              <div className="text-center py-12">
                <Library className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">書單是空的</p>
                <p className="text-gray-400 mt-2">前往圖書館探索精選書籍並加入您的書單！</p>
                <Link href="/library">
                  <Button className="mt-4 gap-2">
                    <Library className="h-4 w-4" />
                    探索圖書館
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                {myBooks.map((book) => (
                  <BookCard key={book.id} book={book} />
                ))}
              </div>
            )}
          </div>

          <div>
            <div className="flex items-center gap-3 mb-6">
              <Bookmark className="h-6 w-6 text-blue-600" />
              <h2 className="text-2xl font-bold">收藏文章 ({savedPosts.length})</h2>
            </div>
            {savedPosts.length === 0 ? (
              <div className="text-center py-12">
                <Bookmark className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">還沒有收藏的文章</p>
                <p className="text-gray-400 mt-2">點擊文章上的書籤圖示開始收藏您喜歡的內容！</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {savedPosts.map((post) => (
                  <PostCard key={post.id} post={post} />
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="container mx-auto px-4 py-12">
          <h2 className="text-2xl font-bold mb-6">Posts ({posts.length})</h2>

          {posts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">No posts yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {posts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          )}
        </div>
      )}

      {isOwnProfile && !isAdmin && (
        <>
          <TitleSelectionDialog
            open={titleDialogOpen}
            onOpenChange={setTitleDialogOpen}
            currentTitle={profile?.user_title || null}
            userId={user?.id || ''}
            onTitleUpdate={handleTitleUpdate}
          />
          <QuoteSelectionDialog
            open={quoteDialogOpen}
            onComplete={handleQuoteDialogComplete}
            userId={user?.id || ''}
          />
        </>
      )}
    </div>
  );
}
