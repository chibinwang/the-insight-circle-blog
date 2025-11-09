'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  ArrowLeft,
  Play,
  CheckCircle2,
  XCircle,
  Loader2,
  Database,
  Mail,
  Users,
  Send,
  Clock,
  Eye,
  MousePointer,
  AlertCircle
} from 'lucide-react';
import Link from 'next/link';
import {
  TestResult,
  testDatabaseConnection,
  testSubscriberTableAccess,
  testEmailStatsTableAccess,
  testSubscriptionAPI,
  getActiveSubscribers,
  getEmailStats,
  testNewsletterAPI,
  getPublishedPosts,
  generateTestEmail,
  checkGmailConfiguration,
} from '@/lib/test-utils';
import { formatDistanceToNow } from 'date-fns';

export default function TestNewsletterPage() {
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [testEmail, setTestEmail] = useState('');
  const [selectedPostId, setSelectedPostId] = useState<number | null>(null);
  const [subscriberStats, setSubscriberStats] = useState<any>(null);
  const [emailStats, setEmailStats] = useState<any[]>([]);
  const [publishedPosts, setPublishedPosts] = useState<any[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [subscribers, stats, posts] = await Promise.all([
        getActiveSubscribers(),
        getEmailStats(),
        getPublishedPosts(),
      ]);
      setSubscriberStats(subscribers);
      setEmailStats(stats);
      setPublishedPosts(posts);
    } catch (error) {
      console.error('Failed to load data:', error);
    }
  };

  const addTestResult = (result: TestResult) => {
    setTestResults((prev) => [...prev, result]);
  };

  const clearResults = () => {
    setTestResults([]);
  };

  const runBasicTests = async () => {
    setLoading(true);
    clearResults();

    const gmailTest = checkGmailConfiguration();
    addTestResult(gmailTest);

    const dbTest = await testDatabaseConnection();
    addTestResult(dbTest);

    const subTableTest = await testSubscriberTableAccess();
    addTestResult(subTableTest);

    const statsTableTest = await testEmailStatsTableAccess();
    addTestResult(statsTableTest);

    setLoading(false);
  };

  const testSubscription = async () => {
    if (!testEmail) {
      addTestResult({
        name: 'Subscription Test',
        status: 'fail',
        message: 'Please enter a test email address',
        timestamp: new Date(),
      });
      return;
    }

    setLoading(true);
    const result = await testSubscriptionAPI(testEmail);
    addTestResult(result);
    setLoading(false);

    await loadData();
  };

  const testNewsletterSending = async () => {
    if (!selectedPostId) {
      addTestResult({
        name: 'Newsletter Test',
        status: 'fail',
        message: 'Please select a post to send',
        timestamp: new Date(),
      });
      return;
    }

    setLoading(true);
    const result = await testNewsletterAPI(selectedPostId);
    addTestResult(result);
    setLoading(false);

    await loadData();
  };

  const runFullTest = async () => {
    setLoading(true);
    clearResults();

    addTestResult({
      name: 'Full Integration Test',
      status: 'pending',
      message: 'Starting comprehensive test...',
      timestamp: new Date(),
    });

    await runBasicTests();

    const testEmailAddress = generateTestEmail();
    addTestResult({
      name: 'Generated Test Email',
      status: 'pass',
      message: `Using ${testEmailAddress} for testing`,
      timestamp: new Date(),
    });

    const subResult = await testSubscriptionAPI(testEmailAddress);
    addTestResult(subResult);

    await loadData();

    addTestResult({
      name: 'Full Integration Test',
      status: 'pass',
      message: 'All automated tests completed',
      timestamp: new Date(),
    });

    setLoading(false);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pass':
        return <CheckCircle2 className="h-5 w-5 text-green-600" />;
      case 'fail':
        return <XCircle className="h-5 w-5 text-red-600" />;
      default:
        return <Clock className="h-5 w-5 text-yellow-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: { [key: string]: string } = {
      pass: 'bg-green-100 text-green-800',
      fail: 'bg-red-100 text-red-800',
      pending: 'bg-yellow-100 text-yellow-800',
    };

    return (
      <Badge className={variants[status]}>
        {status.toUpperCase()}
      </Badge>
    );
  };

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
          <h1 className="text-4xl font-bold mb-2">Newsletter System Testing</h1>
          <p className="text-gray-600">
            Comprehensive testing dashboard for subscription and newsletter functionality
          </p>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="tests">Run Tests</TabsTrigger>
            <TabsTrigger value="subscribers">Subscribers</TabsTrigger>
            <TabsTrigger value="stats">Email Stats</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Active Subscribers
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">{subscriberStats?.count || 0}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Emails Sent
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">{emailStats.length}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                    <Eye className="h-4 w-4" />
                    Open Rate
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">
                    {emailStats.length > 0
                      ? Math.round((emailStats.filter(s => s.opened_at).length / emailStats.length) * 100)
                      : 0}%
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                    <MousePointer className="h-4 w-4" />
                    Click Rate
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">
                    {emailStats.length > 0
                      ? Math.round((emailStats.filter(s => s.clicked_at).length / emailStats.length) * 100)
                      : 0}%
                  </p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>System Status</CardTitle>
                <CardDescription>Check the health of your newsletter system</CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={runBasicTests} disabled={loading} className="gap-2">
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Play className="h-4 w-4" />
                  )}
                  Run System Check
                </Button>
              </CardContent>
            </Card>

            {testResults.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Test Results</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {testResults.map((result, index) => (
                      <div
                        key={index}
                        className="flex items-start justify-between p-4 border rounded-lg"
                      >
                        <div className="flex items-start gap-3 flex-1">
                          {getStatusIcon(result.status)}
                          <div className="flex-1">
                            <p className="font-medium">{result.name}</p>
                            <p className="text-sm text-gray-600 mt-1">{result.message}</p>
                            <p className="text-xs text-gray-400 mt-1">
                              {formatDistanceToNow(result.timestamp, { addSuffix: true })}
                            </p>
                          </div>
                        </div>
                        {getStatusBadge(result.status)}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="tests" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Subscription Testing</CardTitle>
                <CardDescription>Test the email subscription flow</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="testEmail">Test Email Address</Label>
                  <Input
                    id="testEmail"
                    type="email"
                    placeholder="test@example.com"
                    value={testEmail}
                    onChange={(e) => setTestEmail(e.target.value)}
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={testSubscription} disabled={loading} className="gap-2">
                    {loading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Play className="h-4 w-4" />
                    )}
                    Test Subscription
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setTestEmail(generateTestEmail())}
                  >
                    Generate Test Email
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Newsletter Sending Test</CardTitle>
                <CardDescription>Send a test newsletter to all active subscribers</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {publishedPosts.length === 0 ? (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      No published posts available. Create and publish a post first.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <>
                    <div className="space-y-2">
                      <Label>Select Post</Label>
                      <div className="space-y-2">
                        {publishedPosts.map((post) => (
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
                                <Badge className="bg-green-100 text-green-800">
                                  Email Sent
                                </Badge>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <Button
                      onClick={testNewsletterSending}
                      disabled={loading || !selectedPostId}
                      className="gap-2"
                    >
                      {loading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                      Send Test Newsletter
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Full Integration Test</CardTitle>
                <CardDescription>Run a complete end-to-end test</CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={runFullTest} disabled={loading} className="gap-2">
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Play className="h-4 w-4" />
                  )}
                  Run Full Test Suite
                </Button>
              </CardContent>
            </Card>

            {testResults.length > 0 && (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Test Results</CardTitle>
                    <Button variant="outline" size="sm" onClick={clearResults}>
                      Clear Results
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {testResults.map((result, index) => (
                      <div
                        key={index}
                        className="flex items-start justify-between p-4 border rounded-lg"
                      >
                        <div className="flex items-start gap-3 flex-1">
                          {getStatusIcon(result.status)}
                          <div className="flex-1">
                            <p className="font-medium">{result.name}</p>
                            <p className="text-sm text-gray-600 mt-1">{result.message}</p>
                            <p className="text-xs text-gray-400 mt-1">
                              {formatDistanceToNow(result.timestamp, { addSuffix: true })}
                            </p>
                          </div>
                        </div>
                        {getStatusBadge(result.status)}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="subscribers" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Active Subscribers</CardTitle>
                <CardDescription>
                  {subscriberStats?.count || 0} active subscribers
                </CardDescription>
              </CardHeader>
              <CardContent>
                {subscriberStats?.subscribers.length === 0 ? (
                  <div className="text-center py-12">
                    <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">No subscribers yet</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {subscriberStats?.subscribers.map((subscriber: any) => (
                      <div
                        key={subscriber.id}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div>
                          <p className="font-medium">{subscriber.email}</p>
                          <p className="text-sm text-gray-600">
                            Subscribed{' '}
                            {formatDistanceToNow(new Date(subscriber.subscribed_at), {
                              addSuffix: true,
                            })}
                          </p>
                        </div>
                        <Badge className="bg-green-100 text-green-800">Active</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="stats" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Email Statistics</CardTitle>
                <CardDescription>Recent email tracking data</CardDescription>
              </CardHeader>
              <CardContent>
                {emailStats.length === 0 ? (
                  <div className="text-center py-12">
                    <Mail className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">No emails sent yet</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {emailStats.map((stat: any) => (
                      <div key={stat.id} className="p-4 border rounded-lg">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <p className="font-medium">{stat.posts?.title || 'Unknown Post'}</p>
                            <p className="text-sm text-gray-600">
                              To: {stat.subscribers?.email || 'Unknown'}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            {stat.opened_at && (
                              <Badge className="bg-blue-100 text-blue-800">
                                <Eye className="h-3 w-3 mr-1" />
                                Opened
                              </Badge>
                            )}
                            {stat.clicked_at && (
                              <Badge className="bg-green-100 text-green-800">
                                <MousePointer className="h-3 w-3 mr-1" />
                                Clicked
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="text-xs text-gray-500 space-y-1">
                          <p>
                            Sent: {formatDistanceToNow(new Date(stat.sent_at), { addSuffix: true })}
                          </p>
                          {stat.opened_at && (
                            <p>
                              Opened: {formatDistanceToNow(new Date(stat.opened_at), { addSuffix: true })}
                            </p>
                          )}
                          {stat.clicked_at && (
                            <p>
                              Clicked: {formatDistanceToNow(new Date(stat.clicked_at), { addSuffix: true })}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
