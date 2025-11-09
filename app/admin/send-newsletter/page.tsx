'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  ArrowLeft,
  Search,
  Send,
  Loader2,
  CheckCircle,
  XCircle,
  AlertCircle,
  Filter
} from 'lucide-react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

type Subscriber = {
  id: number;
  email: string;
  is_subscribed: boolean;
  subscribed_at: string;
  category_1: string | null;
  category_2: string | null;
};

type Post = {
  id: number;
  title: string;
  slug: string;
  created_at: string;
  is_email_sent: boolean;
};

export default function SendNewsletterPage() {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [filteredSubscribers, setFilteredSubscribers] = useState<Subscriber[]>([]);
  const [selectedSubscribers, setSelectedSubscribers] = useState<number[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [selectedPostId, setSelectedPostId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    filterSubscribers();
  }, [subscribers, searchTerm, categoryFilter]);

  const fetchData = async () => {
    const [subsData, postsData] = await Promise.all([
      supabase.from('subscribers').select('*').eq('is_subscribed', true).order('subscribed_at', { ascending: false }),
      supabase.from('posts').select('id, title, slug, created_at, is_email_sent').eq('is_published', true).order('created_at', { ascending: false }).limit(10)
    ]);

    setSubscribers(subsData.data || []);
    setPosts(postsData.data || []);
    setLoading(false);
  };

  const filterSubscribers = () => {
    let filtered = subscribers;

    if (searchTerm) {
      filtered = filtered.filter(s =>
        s.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (categoryFilter) {
      filtered = filtered.filter(s =>
        s.category_1?.toLowerCase().includes(categoryFilter.toLowerCase()) ||
        s.category_2?.toLowerCase().includes(categoryFilter.toLowerCase())
      );
    }

    setFilteredSubscribers(filtered);
  };

  const handleSelectAll = () => {
    if (selectedSubscribers.length === filteredSubscribers.length) {
      setSelectedSubscribers([]);
    } else {
      setSelectedSubscribers(filteredSubscribers.map(s => s.id));
    }
  };

  const handleToggleSubscriber = (id: number) => {
    setSelectedSubscribers(prev =>
      prev.includes(id) ? prev.filter(sid => sid !== id) : [...prev, id]
    );
  };

  const handleSelectByCategory = (category: string, categoryField: 'category_1' | 'category_2') => {
    const matching = subscribers.filter(s => s[categoryField] === category);
    const matchingIds = matching.map(s => s.id);
    setSelectedSubscribers(prev => {
      const newSet = new Set([...prev, ...matchingIds]);
      return Array.from(newSet);
    });
  };

  const handleSendNewsletter = async () => {
    if (!selectedPostId) {
      toast({
        title: '錯誤',
        description: '請選擇一篇文章',
        variant: 'destructive',
      });
      return;
    }

    if (selectedSubscribers.length === 0) {
      toast({
        title: '錯誤',
        description: '請至少選擇一位訂閱者',
        variant: 'destructive',
      });
      return;
    }

    setSending(true);

    try {
      const response = await fetch('/api/send-newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          postId: selectedPostId,
          subscriberIds: selectedSubscribers,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: '成功',
          description: `成功發送 ${data.sentCount} 封電子郵件`,
        });
        setSelectedSubscribers([]);
        setSelectedPostId(null);
        await fetchData();
      } else {
        toast({
          title: '錯誤',
          description: data.error || '發送失敗',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: '錯誤',
        description: '發送電子郵件時發生錯誤',
        variant: 'destructive',
      });
    }

    setSending(false);
  };

  const uniqueCategories = {
    category1: Array.from(new Set(subscribers.map(s => s.category_1).filter(Boolean))) as string[],
    category2: Array.from(new Set(subscribers.map(s => s.category_2).filter(Boolean))) as string[],
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-12">
        <Link href="/admin/subscribers">
          <Button variant="ghost" className="mb-6 gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Subscribers
          </Button>
        </Link>

        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Send Newsletter</h1>
          <p className="text-gray-600">Select subscribers and a post to send</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Select Post</CardTitle>
                    <CardDescription>Choose a published post to send</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {posts.length === 0 ? (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      No published posts available. Create and publish a post first.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <div className="space-y-2">
                    {posts.map((post) => (
                      <div
                        key={post.id}
                        className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                          selectedPostId === post.id
                            ? 'border-blue-500 bg-blue-50'
                            : 'hover:bg-gray-50'
                        }`}
                        onClick={() => setSelectedPostId(post.id)}
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-medium">{post.title}</p>
                            <p className="text-sm text-gray-600 mt-1">
                              Created {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                            </p>
                          </div>
                          {post.is_email_sent && (
                            <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded">
                              Previously Sent
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <CardTitle>Select Recipients</CardTitle>
                    <CardDescription>
                      {selectedSubscribers.length} of {filteredSubscribers.length} subscribers selected
                    </CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSelectAll}
                  >
                    {selectedSubscribers.length === filteredSubscribers.length ? 'Deselect All' : 'Select All'}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row gap-2">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        type="text"
                        placeholder="Search by email..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    <div className="relative flex-1">
                      <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        type="text"
                        placeholder="Filter by category..."
                        value={categoryFilter}
                        onChange={(e) => setCategoryFilter(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>

                  {filteredSubscribers.length === 0 ? (
                    <div className="text-center py-12">
                      <XCircle className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500">No subscribers found</p>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {filteredSubscribers.map((subscriber) => (
                        <div
                          key={subscriber.id}
                          className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50"
                        >
                          <Checkbox
                            checked={selectedSubscribers.includes(subscriber.id)}
                            onCheckedChange={() => handleToggleSubscriber(subscriber.id)}
                          />
                          <div className="flex-1">
                            <p className="font-medium text-sm">{subscriber.email}</p>
                            <div className="flex gap-2 mt-1">
                              {subscriber.category_1 && (
                                <span className="px-2 py-0.5 text-xs bg-blue-100 text-blue-800 rounded">
                                  {subscriber.category_1}
                                </span>
                              )}
                              {subscriber.category_2 && (
                                <span className="px-2 py-0.5 text-xs bg-purple-100 text-purple-800 rounded">
                                  {subscriber.category_2}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Quick Select by Category</CardTitle>
                <CardDescription>Select all subscribers in a category</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {uniqueCategories.category1.length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Category 1</Label>
                    <div className="space-y-2">
                      {uniqueCategories.category1.map((cat) => (
                        <Button
                          key={cat}
                          variant="outline"
                          size="sm"
                          className="w-full justify-start"
                          onClick={() => handleSelectByCategory(cat, 'category_1')}
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          {cat} ({subscribers.filter(s => s.category_1 === cat).length})
                        </Button>
                      ))}
                    </div>
                  </div>
                )}

                {uniqueCategories.category2.length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Category 2</Label>
                    <div className="space-y-2">
                      {uniqueCategories.category2.map((cat) => (
                        <Button
                          key={cat}
                          variant="outline"
                          size="sm"
                          className="w-full justify-start"
                          onClick={() => handleSelectByCategory(cat, 'category_2')}
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          {cat} ({subscribers.filter(s => s.category_2 === cat).length})
                        </Button>
                      ))}
                    </div>
                  </div>
                )}

                {uniqueCategories.category1.length === 0 && uniqueCategories.category2.length === 0 && (
                  <p className="text-sm text-gray-500 text-center py-4">
                    No categories assigned yet. Edit subscribers to add categories.
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Send Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Selected Post:</span>
                    <span className="font-medium">
                      {selectedPostId ? posts.find(p => p.id === selectedPostId)?.title?.substring(0, 20) + '...' : 'None'}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Recipients:</span>
                    <span className="font-medium">{selectedSubscribers.length}</span>
                  </div>
                </div>

                <Button
                  className="w-full gap-2"
                  onClick={handleSendNewsletter}
                  disabled={sending || !selectedPostId || selectedSubscribers.length === 0}
                >
                  {sending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      Send Newsletter
                    </>
                  )}
                </Button>

                {(!selectedPostId || selectedSubscribers.length === 0) && (
                  <p className="text-xs text-gray-500 text-center">
                    Select a post and at least one subscriber to send
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
