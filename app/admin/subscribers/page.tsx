'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Search, Mail, CheckCircle, XCircle, Edit, Send } from 'lucide-react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';

type Subscriber = {
  id: number;
  email: string;
  is_subscribed: boolean;
  subscribed_at: string;
  unsubscribed_at: string | null;
  category_1: string | null;
  category_2: string | null;
};

export default function SubscribersPage() {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [filteredSubscribers, setFilteredSubscribers] = useState<Subscriber[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'unsubscribed'>('active');
  const [editingSubscriber, setEditingSubscriber] = useState<Subscriber | null>(null);
  const [category1, setCategory1] = useState('');
  const [category2, setCategory2] = useState('');
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSubscribers();
  }, []);

  useEffect(() => {
    filterSubscribers();
  }, [subscribers, searchTerm, filter]);

  const fetchSubscribers = async () => {
    const { data } = await supabase
      .from('subscribers')
      .select('*')
      .order('subscribed_at', { ascending: false });

    setSubscribers(data || []);
    setLoading(false);
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

  const activeCount = subscribers.filter(s => s.is_subscribed).length;
  const unsubscribedCount = subscribers.filter(s => !s.is_subscribed).length;

  const handleEditSubscriber = (subscriber: Subscriber) => {
    setEditingSubscriber(subscriber);
    setCategory1(subscriber.category_1 || '');
    setCategory2(subscriber.category_2 || '');
    setIsEditDialogOpen(true);
  };

  const handleSaveCategories = async () => {
    if (!editingSubscriber) return;

    setSaving(true);
    const { error } = await supabase
      .from('subscribers')
      .update({
        category_1: category1 || null,
        category_2: category2 || null,
      })
      .eq('id', editingSubscriber.id);

    if (!error) {
      await fetchSubscribers();
      setIsEditDialogOpen(false);
      setEditingSubscriber(null);
    }
    setSaving(false);
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
          <h1 className="text-4xl font-bold mb-2">Newsletter Subscribers</h1>
          <p className="text-gray-600">Manage your email subscriber list</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
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
                    <div className="flex items-center gap-3 flex-1">
                      {subscriber.is_subscribed ? (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      ) : (
                        <XCircle className="h-5 w-5 text-gray-400" />
                      )}
                      <div className="flex-1">
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
                        {(subscriber.category_1 || subscriber.category_2) && (
                          <div className="flex gap-2 mt-2">
                            {subscriber.category_1 && (
                              <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                                {subscriber.category_1}
                              </span>
                            )}
                            {subscriber.category_2 && (
                              <span className="px-2 py-1 text-xs bg-purple-100 text-purple-800 rounded">
                                {subscriber.category_2}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-3 py-1 text-xs font-medium rounded-full ${
                          subscriber.is_subscribed
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {subscriber.is_subscribed ? 'Active' : 'Unsubscribed'}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditSubscriber(subscriber)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Subscriber Categories</DialogTitle>
              <DialogDescription>
                Assign categories to {editingSubscriber?.email} for targeted email campaigns
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="category1">Category 1</Label>
                <Input
                  id="category1"
                  placeholder="e.g., Premium, VIP, Early Adopter"
                  value={category1}
                  onChange={(e) => setCategory1(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category2">Category 2</Label>
                <Input
                  id="category2"
                  placeholder="e.g., Weekly, Monthly, Tech News"
                  value={category2}
                  onChange={(e) => setCategory2(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} disabled={saving}>
                Cancel
              </Button>
              <Button onClick={handleSaveCategories} disabled={saving}>
                {saving ? 'Saving...' : 'Save Categories'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Send Newsletter</CardTitle>
            <CardDescription>Send targeted emails to your subscribers</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/admin/send-newsletter">
              <Button className="gap-2">
                <Send className="h-4 w-4" />
                Go to Send Newsletter
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
