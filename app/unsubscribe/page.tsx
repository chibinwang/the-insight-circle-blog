'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, XCircle, Loader2, Mail } from 'lucide-react';
import Link from 'next/link';

export default function UnsubscribePage() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'invalid'>('loading');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!token) {
      setStatus('invalid');
      return;
    }

    const unsubscribe = async () => {
      try {
        const response = await fetch('/api/unsubscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        });

        if (response.ok) {
          setStatus('success');
        } else {
          setStatus('error');
        }
      } catch (error) {
        setStatus('error');
      }
    };

    unsubscribe();
  }, [token]);

  const handleResubscribe = async () => {
    if (!token) return;

    setLoading(true);
    try {
      const response = await fetch('/api/resubscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });

      if (response.ok) {
        setStatus('loading');
        setTimeout(() => {
          window.location.href = '/';
        }, 1500);
      }
    } catch (error) {
      console.error('Resubscribe error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          {status === 'loading' && (
            <>
              <div className="mx-auto mb-4 p-3 bg-gray-100 rounded-full w-fit">
                <Loader2 className="h-8 w-8 text-gray-600 animate-spin" />
              </div>
              <CardTitle>Processing...</CardTitle>
              <CardDescription>Please wait while we process your request.</CardDescription>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="mx-auto mb-4 p-3 bg-green-100 rounded-full w-fit">
                <CheckCircle2 className="h-8 w-8 text-green-600" />
              </div>
              <CardTitle>Successfully Unsubscribed</CardTitle>
              <CardDescription>
                You&apos;ve been removed from our mailing list. We&apos;re sorry to see you go!
              </CardDescription>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="mx-auto mb-4 p-3 bg-red-100 rounded-full w-fit">
                <XCircle className="h-8 w-8 text-red-600" />
              </div>
              <CardTitle>Unsubscribe Failed</CardTitle>
              <CardDescription>
                We couldn&apos;t process your request. Please try again or contact support.
              </CardDescription>
            </>
          )}

          {status === 'invalid' && (
            <>
              <div className="mx-auto mb-4 p-3 bg-orange-100 rounded-full w-fit">
                <Mail className="h-8 w-8 text-orange-600" />
              </div>
              <CardTitle>Invalid Link</CardTitle>
              <CardDescription>
                This unsubscribe link is invalid or has expired. Please use the link from your email.
              </CardDescription>
            </>
          )}
        </CardHeader>

        <CardContent className="space-y-4">
          {status === 'success' && (
            <>
              <Button
                onClick={handleResubscribe}
                disabled={loading}
                className="w-full"
                variant="outline"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Resubscribing...
                  </>
                ) : (
                  'Changed Your Mind? Resubscribe'
                )}
              </Button>
              <Link href="/" className="block">
                <Button className="w-full">Back to Home</Button>
              </Link>
            </>
          )}

          {status === 'error' && (
            <Link href="/" className="block">
              <Button className="w-full">Back to Home</Button>
            </Link>
          )}

          {status === 'invalid' && (
            <Link href="/" className="block">
              <Button className="w-full">Back to Home</Button>
            </Link>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
