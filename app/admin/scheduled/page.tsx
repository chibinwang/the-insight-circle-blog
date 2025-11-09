'use client';

import { useState, useEffect } from 'react';
import { supabase, Post } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ArrowLeft, Clock, Edit, Calendar as CalendarIcon, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { format, formatDistanceToNow, isPast } from 'date-fns';
import { DeletePostButton } from '@/components/delete-post-button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function ScheduledPostsPage() {
  const [scheduledPosts, setScheduledPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchScheduledPosts();
    const interval = setInterval(fetchScheduledPosts, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchScheduledPosts = async () => {
    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .eq('scheduling_status', 'scheduled')
      .order('scheduled_publish_at', { ascending: true });

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to load scheduled posts',
        variant: 'destructive',
      });
      setLoading(false);
      return;
    }

    setScheduledPosts(data || []);
    setLoading(false);
  };

  const handlePublishNow = async (postId: number) => {
    if (!confirm('Publish this post immediately?')) return;

    const { error } = await supabase
      .from('posts')
      .update({
        is_published: true,
        scheduling_status: 'published',
        scheduled_publish_at: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', postId);

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to publish post',
        variant: 'destructive',
      });
      return;
    }

    toast({
      title: 'Success',
      description: 'Post published successfully',
    });

    fetchScheduledPosts();
  };

  const handleUnschedule = async (postId: number) => {
    if (!confirm('Remove schedule and save as draft?')) return;

    const { error } = await supabase
      .from('posts')
      .update({
        is_published: false,
        scheduling_status: 'draft',
        scheduled_publish_at: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', postId);

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to unschedule post',
        variant: 'destructive',
      });
      return;
    }

    toast({
      title: 'Success',
      description: 'Post unscheduled and saved as draft',
    });

    fetchScheduledPosts();
  };

  const groupPostsByStatus = () => {
    const now = new Date();
    const upcoming = scheduledPosts.filter(
      (post) => post.scheduled_publish_at && !isPast(new Date(post.scheduled_publish_at))
    );
    const overdue = scheduledPosts.filter(
      (post) => post.scheduled_publish_at && isPast(new Date(post.scheduled_publish_at))
    );
    return { upcoming, overdue };
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  const { upcoming, overdue } = groupPostsByStatus();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="container mx-auto px-4 py-12 max-w-6xl">
        <Link href="/admin">
          <Button variant="ghost" className="mb-6 gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Button>
        </Link>

        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 text-slate-900">Scheduled Posts</h1>
          <p className="text-slate-600">Manage and monitor your scheduled publications</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-white shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600">Total Scheduled</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-900">{scheduledPosts.length}</div>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600">Upcoming</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">{upcoming.length}</div>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600">Needs Attention</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-orange-600">{overdue.length}</div>
            </CardContent>
          </Card>
        </div>

        {overdue.length > 0 && (
          <Alert className="mb-8 border-orange-300 bg-orange-50">
            <AlertCircle className="h-4 w-4 text-orange-600" />
            <AlertDescription className="text-orange-800">
              {overdue.length} {overdue.length === 1 ? 'post' : 'posts'} passed the scheduled time but {overdue.length === 1 ? 'has' : 'have'} not been published yet.
              The auto-publish system will publish {overdue.length === 1 ? 'it' : 'them'} shortly.
            </AlertDescription>
          </Alert>
        )}

        {scheduledPosts.length === 0 ? (
          <Card className="bg-white shadow-sm">
            <CardContent className="py-16">
              <div className="text-center">
                <CalendarIcon className="h-16 w-16 text-slate-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-slate-900 mb-2">No Scheduled Posts</h3>
                <p className="text-slate-500 mb-6">You don't have any posts scheduled for publication</p>
                <Link href="/admin/create">
                  <Button>Create & Schedule a Post</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            {upcoming.length > 0 && (
              <Card className="bg-white shadow-sm mb-8">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <Clock className="h-5 w-5 text-blue-600" />
                    Upcoming Posts
                  </CardTitle>
                  <CardDescription>Posts scheduled for future publication</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {upcoming.map((post) => (
                      <div
                        key={post.id}
                        className="flex flex-col md:flex-row md:items-center justify-between p-6 border rounded-lg hover:bg-slate-50 transition-colors gap-4"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold text-slate-900 text-lg">{post.title}</h3>
                            <Badge variant="outline" className="shrink-0 bg-blue-50 text-blue-700 border-blue-300">
                              <Clock className="h-3 w-3 mr-1" />
                              Scheduled
                            </Badge>
                          </div>
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 text-sm">
                              <CalendarIcon className="h-4 w-4 text-blue-600" />
                              <span className="font-medium text-blue-700">
                                {post.scheduled_publish_at && format(new Date(post.scheduled_publish_at), 'EEEE, MMMM d, yyyy')}
                              </span>
                              <span className="text-slate-400">at</span>
                              <span className="font-medium text-blue-700">
                                {post.scheduled_publish_at && format(new Date(post.scheduled_publish_at), 'h:mm a')}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-slate-500">
                              <Clock className="h-4 w-4" />
                              <span>
                                {post.scheduled_publish_at && formatDistanceToNow(new Date(post.scheduled_publish_at), { addSuffix: true })}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Link href={`/admin/edit/${post.id}`}>
                            <Button variant="outline" size="sm" className="gap-1">
                              <Edit className="h-4 w-4" />
                              Edit
                            </Button>
                          </Link>
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => handlePublishNow(post.id)}
                            className="gap-1"
                          >
                            Publish Now
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleUnschedule(post.id)}
                            className="gap-1"
                          >
                            Unschedule
                          </Button>
                          <DeletePostButton postId={post.id} />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {overdue.length > 0 && (
              <Card className="bg-white shadow-sm border-orange-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-xl text-orange-700">
                    <AlertCircle className="h-5 w-5" />
                    Needs Attention
                  </CardTitle>
                  <CardDescription>Posts past their scheduled time</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {overdue.map((post) => (
                      <div
                        key={post.id}
                        className="flex flex-col md:flex-row md:items-center justify-between p-6 border border-orange-200 rounded-lg bg-orange-50 gap-4"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold text-slate-900 text-lg">{post.title}</h3>
                            <Badge variant="outline" className="shrink-0 bg-orange-100 text-orange-700 border-orange-300">
                              <AlertCircle className="h-3 w-3 mr-1" />
                              Overdue
                            </Badge>
                          </div>
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 text-sm">
                              <CalendarIcon className="h-4 w-4 text-orange-600" />
                              <span className="font-medium text-orange-700">
                                {post.scheduled_publish_at && format(new Date(post.scheduled_publish_at), 'EEEE, MMMM d, yyyy')}
                              </span>
                              <span className="text-slate-400">at</span>
                              <span className="font-medium text-orange-700">
                                {post.scheduled_publish_at && format(new Date(post.scheduled_publish_at), 'h:mm a')}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-orange-600">
                              <Clock className="h-4 w-4" />
                              <span className="font-medium">
                                {post.scheduled_publish_at && formatDistanceToNow(new Date(post.scheduled_publish_at), { addSuffix: true })}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Link href={`/admin/edit/${post.id}`}>
                            <Button variant="outline" size="sm" className="gap-1">
                              <Edit className="h-4 w-4" />
                              Edit
                            </Button>
                          </Link>
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => handlePublishNow(post.id)}
                            className="gap-1 bg-orange-600 hover:bg-orange-700"
                          >
                            Publish Now
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleUnschedule(post.id)}
                            className="gap-1"
                          >
                            Unschedule
                          </Button>
                          <DeletePostButton postId={post.id} />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  );
}
