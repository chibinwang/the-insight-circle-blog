'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ArrowLeft, Mail, Eye, MousePointerClick, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';

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

export default function AnalyticsPage() {
  const [postStats, setPostStats] = useState<PostStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalStats, setTotalStats] = useState({
    totalSent: 0,
    totalOpened: 0,
    totalClicked: 0,
    avgOpenRate: 0,
    avgClickRate: 0,
  });

  useEffect(() => {
    fetchAnalytics();
  }, []);

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

    if (!stats) {
      setLoading(false);
      return;
    }

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
    setLoading(false);
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
      <div className="container mx-auto px-4 py-12">
        <Link href="/admin">
          <Button variant="ghost" className="mb-6 gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Button>
        </Link>

        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Email Analytics</h1>
          <p className="text-gray-600">Track newsletter performance and engagement</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
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
                <MousePointerClick className="h-5 w-5 text-purple-600" />
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
                        <p className="text-2xl font-bold text-purple-600">{stat.click_count}</p>
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
      </div>
    </div>
  );
}
