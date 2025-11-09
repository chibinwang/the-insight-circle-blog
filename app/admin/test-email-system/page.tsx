'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle2, XCircle, Loader2, Mail, AlertCircle, Send } from 'lucide-react';

export default function TestEmailSystem() {
  const [testEmail, setTestEmail] = useState('');
  const [customSubject, setCustomSubject] = useState('Gmail System Test');
  const [customContent, setCustomContent] = useState('This is a test email to verify the Gmail sending functionality is working correctly.');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
    details?: any;
  } | null>(null);
  const [envCheck, setEnvCheck] = useState<{
    hasUser: boolean;
    hasPassword: boolean;
    hasFromName: boolean;
  } | null>(null);

  const checkEnvironment = async () => {
    setLoading(true);
    setResult(null);

    try {
      const response = await fetch('/api/test-email-config', {
        method: 'GET',
      });

      const data = await response.json();
      setEnvCheck(data);

      if (!data.hasUser || !data.hasPassword) {
        setResult({
          type: 'error',
          message: 'Gmail environment variables are not properly configured',
          details: data,
        });
      } else {
        setResult({
          type: 'success',
          message: 'Gmail environment variables are properly configured',
          details: data,
        });
      }
    } catch (error) {
      setResult({
        type: 'error',
        message: 'Failed to check environment configuration',
        details: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      setLoading(false);
    }
  };

  const sendTestEmail = async () => {
    if (!testEmail) {
      setResult({
        type: 'error',
        message: 'Please enter a test email address',
      });
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const response = await fetch('/api/test-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: testEmail,
          subject: customSubject,
          content: customContent,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setResult({
          type: 'success',
          message: `Test email sent successfully to ${testEmail}`,
          details: data,
        });
      } else {
        setResult({
          type: 'error',
          message: data.error || 'Failed to send test email',
          details: data,
        });
      }
    } catch (error) {
      setResult({
        type: 'error',
        message: 'Network error or server is down',
        details: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      setLoading(false);
    }
  };

  const testNewsletterSystem = async () => {
    setLoading(true);
    setResult(null);

    try {
      const response = await fetch('/api/verify-newsletter-system', {
        method: 'GET',
      });

      const data = await response.json();

      if (response.ok && data.ready) {
        setResult({
          type: 'success',
          message: 'Newsletter system is fully operational',
          details: data,
        });
      } else {
        setResult({
          type: 'error',
          message: data.error || 'Newsletter system has issues',
          details: data,
        });
      }
    } catch (error) {
      setResult({
        type: 'error',
        message: 'Failed to verify newsletter system',
        details: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Email System Test Suite</h1>
        <p className="text-muted-foreground">
          Comprehensive testing for Gmail sending functionality
        </p>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Step 1: Environment Configuration Check
            </CardTitle>
            <CardDescription>
              Verify that all Gmail environment variables are properly set
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={checkEnvironment}
              disabled={loading}
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Checking...
                </>
              ) : (
                <>
                  <AlertCircle className="mr-2 h-4 w-4" />
                  Check Environment Variables
                </>
              )}
            </Button>

            {envCheck && (
              <div className="mt-4 space-y-2">
                <div className="flex items-center gap-2">
                  {envCheck.hasUser ? (
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-600" />
                  )}
                  <span>GMAIL_USER: {envCheck.hasUser ? 'Configured' : 'Missing'}</span>
                </div>
                <div className="flex items-center gap-2">
                  {envCheck.hasPassword ? (
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-600" />
                  )}
                  <span>GMAIL_APP_PASSWORD: {envCheck.hasPassword ? 'Configured' : 'Missing'}</span>
                </div>
                <div className="flex items-center gap-2">
                  {envCheck.hasFromName ? (
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-yellow-600" />
                  )}
                  <span>GMAIL_FROM_NAME: {envCheck.hasFromName ? 'Configured' : 'Using default'}</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Step 2: Send Test Email
            </CardTitle>
            <CardDescription>
              Send a test email to verify Gmail connection and sending capability
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Recipient Email</label>
              <Input
                type="email"
                placeholder="your-email@example.com"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Subject</label>
              <Input
                type="text"
                value={customSubject}
                onChange={(e) => setCustomSubject(e.target.value)}
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Content</label>
              <Textarea
                value={customContent}
                onChange={(e) => setCustomContent(e.target.value)}
                rows={4}
              />
            </div>

            <Button
              onClick={sendTestEmail}
              disabled={loading || !testEmail}
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Send Test Email
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5" />
              Step 3: Verify Newsletter System
            </CardTitle>
            <CardDescription>
              Check if the complete newsletter system is ready to send bulk emails
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={testNewsletterSystem}
              disabled={loading}
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Verify Newsletter System
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {result && (
          <Alert
            variant={result.type === 'error' ? 'destructive' : 'default'}
            className={
              result.type === 'success'
                ? 'border-green-200 bg-green-50 text-green-900'
                : result.type === 'error'
                ? ''
                : 'border-blue-200 bg-blue-50 text-blue-900'
            }
          >
            {result.type === 'success' && <CheckCircle2 className="h-4 w-4" />}
            {result.type === 'error' && <XCircle className="h-4 w-4" />}
            {result.type === 'info' && <AlertCircle className="h-4 w-4" />}
            <AlertDescription>
              <div className="font-semibold mb-2">{result.message}</div>
              {result.details && (
                <pre className="text-xs mt-2 p-2 bg-black/5 rounded overflow-auto">
                  {JSON.stringify(result.details, null, 2)}
                </pre>
              )}
            </AlertDescription>
          </Alert>
        )}

        <Card className="bg-muted">
          <CardHeader>
            <CardTitle className="text-lg">Testing Instructions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div>
              <strong>1. Check Environment Variables:</strong>
              <p className="text-muted-foreground">Ensures all required Gmail credentials are configured in your .env file</p>
            </div>
            <div>
              <strong>2. Send Test Email:</strong>
              <p className="text-muted-foreground">Sends an actual email through Gmail to verify the connection works</p>
            </div>
            <div>
              <strong>3. Verify Newsletter System:</strong>
              <p className="text-muted-foreground">Checks database connectivity and subscriber system readiness</p>
            </div>
            <div className="pt-3 border-t">
              <strong className="text-amber-600">Important:</strong>
              <p className="text-muted-foreground">Make sure you're using a Gmail App Password (not your regular password) and have 2-factor authentication enabled on your Google account.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
