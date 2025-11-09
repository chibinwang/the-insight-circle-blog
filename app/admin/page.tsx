'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Post } from '@/lib/supabase';
import { FileText, Mail, Users, Send, Loader2, Edit, Eye, TrendingUp, Clock, FileEdit, Calendar, Shield, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow, format } from 'date-fns';
import { DeletePostButton } from '@/components/delete-post-button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function AdminDashboard() {
  const [publishedPosts, setPublishedPosts] = useState<Post[]>([]);
  const [draftPosts, setDraftPosts] = useState<Post[]>([]);
  const [scheduledPosts, setScheduledPosts] = useState<Post[]>([]);
  const [popularPosts, setPopularPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [subscriberCount, setSubscriberCount] = useState(0);
  const [postsCount, setPostsCount] = useState(0);
  const [draftsCount, setDraftsCount] = useState(0);
  const [scheduledCount, setScheduledCount] = useState(0);
  const [emailSubject, setEmailSubject] = useState('');
  const [emailContent, setEmailContent] = useState('');
  const [sendingEmail, setSendingEmail] = useState(false);
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    fetchStats();
    fetchPosts();
  }, []);

  const fetchStats = async () => {
    const { count: postsTotal } = await supabase
      .from('posts')
      .select('*', { count: 'exact', head: true })
      .eq('is_published', true);

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
  };

  const fetchPosts = async () => {
    const { data: published } = await supabase
      .from('posts')
      .select('*')
      .eq('is_published', true)
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
      .order('view_count', { ascending: false })
      .limit(5);

    setPublishedPosts(published || []);
    setDraftPosts(drafts || []);
    setScheduledPosts(scheduled || []);
    setPopularPosts(popular || []);
    setLoading(false);
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="container mx-auto px-4 py-12 max-w-7xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 text-slate-900">Admin Dashboard</h1>
          <p className="text-slate-600">Manage your blog and communicate with subscribers</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
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
              <Calendar className="h-5 w-5 text-blue-600" />
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
              <Link href="/admin/subscribers">
                <Button variant="outline" className="mt-4 w-full" size="sm">View All</Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
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

          <Card className="bg-gradient-to-br from-amber-50 to-orange-50 shadow-sm hover:shadow-md transition-shadow border-2 border-amber-200">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle className="text-lg font-medium text-slate-900 flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-amber-600" />
                  Famous People
                </CardTitle>
                <p className="text-sm text-slate-500 mt-1">Manage famous people book lists</p>
              </div>
            </CardHeader>
            <CardContent>
              <Link href="/admin/famous-people">
                <Button variant="outline" className="w-full gap-2 border-amber-300 hover:bg-amber-100">
                  <Sparkles className="h-4 w-4" />
                  Manage Famous People
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="published" className="mb-8">
          <TabsList className="grid w-full grid-cols-4 mb-6">
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
                  <Calendar className="h-5 w-5" />
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
      </div>
    </div>
  );
}
