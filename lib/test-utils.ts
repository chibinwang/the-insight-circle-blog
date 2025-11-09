import { supabase } from './supabase';

export type TestResult = {
  name: string;
  status: 'pass' | 'fail' | 'pending';
  message: string;
  timestamp: Date;
};

export async function testDatabaseConnection(): Promise<TestResult> {
  try {
    const { data, error } = await supabase.from('subscribers').select('count');
    if (error) throw error;
    return {
      name: 'Database Connection',
      status: 'pass',
      message: 'Successfully connected to Supabase database',
      timestamp: new Date(),
    };
  } catch (error) {
    return {
      name: 'Database Connection',
      status: 'fail',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date(),
    };
  }
}

export async function testSubscriberTableAccess(): Promise<TestResult> {
  try {
    const { data, error } = await supabase
      .from('subscribers')
      .select('*')
      .limit(1);
    if (error) throw error;
    return {
      name: 'Subscriber Table Access',
      status: 'pass',
      message: `Successfully accessed subscribers table. ${data?.length || 0} records found in test query.`,
      timestamp: new Date(),
    };
  } catch (error) {
    return {
      name: 'Subscriber Table Access',
      status: 'fail',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date(),
    };
  }
}

export async function testEmailStatsTableAccess(): Promise<TestResult> {
  try {
    const { data, error } = await supabase
      .from('email_stats')
      .select('*')
      .limit(1);
    if (error) throw error;
    return {
      name: 'Email Stats Table Access',
      status: 'pass',
      message: `Successfully accessed email_stats table. ${data?.length || 0} records found in test query.`,
      timestamp: new Date(),
    };
  } catch (error) {
    return {
      name: 'Email Stats Table Access',
      status: 'fail',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date(),
    };
  }
}

export async function testSubscriptionAPI(email: string): Promise<TestResult> {
  try {
    const response = await fetch('/api/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });

    const data = await response.json();

    if (response.ok) {
      return {
        name: 'Subscription API',
        status: 'pass',
        message: `Successfully subscribed ${email}`,
        timestamp: new Date(),
      };
    } else {
      return {
        name: 'Subscription API',
        status: 'fail',
        message: data.error || 'Failed to subscribe',
        timestamp: new Date(),
      };
    }
  } catch (error) {
    return {
      name: 'Subscription API',
      status: 'fail',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date(),
    };
  }
}

export async function getActiveSubscribers(): Promise<{
  count: number;
  subscribers: any[];
}> {
  const { data, error } = await supabase
    .from('subscribers')
    .select('*')
    .eq('is_subscribed', true)
    .order('subscribed_at', { ascending: false });

  if (error) throw error;
  return {
    count: data?.length || 0,
    subscribers: data || [],
  };
}

export async function getEmailStats() {
  const { data, error } = await supabase
    .from('email_stats')
    .select(`
      *,
      subscribers (email),
      posts (title, slug)
    `)
    .order('sent_at', { ascending: false })
    .limit(10);

  if (error) throw error;
  return data || [];
}

export async function testNewsletterAPI(postId: number): Promise<TestResult> {
  try {
    const response = await fetch('/api/send-newsletter', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ postId }),
    });

    const data = await response.json();

    if (response.ok) {
      return {
        name: 'Newsletter Sending API',
        status: 'pass',
        message: `Newsletter sent to ${data.sentCount}/${data.totalSubscribers} subscribers`,
        timestamp: new Date(),
      };
    } else {
      return {
        name: 'Newsletter Sending API',
        status: 'fail',
        message: data.error || 'Failed to send newsletter',
        timestamp: new Date(),
      };
    }
  } catch (error) {
    return {
      name: 'Newsletter Sending API',
      status: 'fail',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date(),
    };
  }
}

export async function getPublishedPosts() {
  const { data, error } = await supabase
    .from('posts')
    .select('id, title, slug, is_email_sent, email_sent_at, created_at')
    .eq('is_published', true)
    .order('created_at', { ascending: false })
    .limit(10);

  if (error) throw error;
  return data || [];
}

export async function testUnsubscribeFlow(unsubscribeToken: string): Promise<TestResult> {
  try {
    const response = await fetch('/api/unsubscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: unsubscribeToken }),
    });

    const data = await response.json();

    if (response.ok) {
      return {
        name: 'Unsubscribe API',
        status: 'pass',
        message: 'Successfully unsubscribed user',
        timestamp: new Date(),
      };
    } else {
      return {
        name: 'Unsubscribe API',
        status: 'fail',
        message: data.error || 'Failed to unsubscribe',
        timestamp: new Date(),
      };
    }
  } catch (error) {
    return {
      name: 'Unsubscribe API',
      status: 'fail',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date(),
    };
  }
}

export function generateTestEmail(): string {
  const timestamp = Date.now();
  return `test-${timestamp}@example.com`;
}

export function checkGmailConfiguration(): TestResult {
  const gmailUser = process.env.GMAIL_USER;
  const gmailClientId = process.env.GMAIL_CLIENT_ID;
  const gmailClientSecret = process.env.GMAIL_CLIENT_SECRET;
  const gmailRefreshToken = process.env.GMAIL_REFRESH_TOKEN;

  const isConfigured = gmailUser && gmailClientId && gmailClientSecret && gmailRefreshToken;

  if (isConfigured) {
    return {
      name: 'Gmail OAuth2 Configuration',
      status: 'pass',
      message: 'Gmail OAuth2 credentials are configured',
      timestamp: new Date(),
    };
  } else {
    const missing = [];
    if (!gmailUser) missing.push('GMAIL_USER');
    if (!gmailClientId) missing.push('GMAIL_CLIENT_ID');
    if (!gmailClientSecret) missing.push('GMAIL_CLIENT_SECRET');
    if (!gmailRefreshToken) missing.push('GMAIL_REFRESH_TOKEN');

    return {
      name: 'Gmail OAuth2 Configuration',
      status: 'fail',
      message: `Gmail OAuth2 credentials not configured. Missing: ${missing.join(', ')}`,
      timestamp: new Date(),
    };
  }
}

export async function testEmailSending(testEmail: string): Promise<TestResult> {
  try {
    const response = await fetch('/api/test-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: testEmail,
        subject: 'Newsletter System Test',
        content: 'This is a test email to verify the email sending functionality is working correctly. If you receive this email, your newsletter system is properly configured!'
      }),
    });

    const data = await response.json();

    if (response.ok) {
      return {
        name: 'Email Sending Test',
        status: 'pass',
        message: `Test email sent successfully to ${testEmail}`,
        timestamp: new Date(),
      };
    } else {
      return {
        name: 'Email Sending Test',
        status: 'fail',
        message: data.error || 'Failed to send test email',
        timestamp: new Date(),
      };
    }
  } catch (error) {
    return {
      name: 'Email Sending Test',
      status: 'fail',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date(),
    };
  }
}

export async function verifyDatabaseIntegrity(): Promise<TestResult> {
  try {
    const response = await fetch('/api/verify-database');
    const data = await response.json();

    if (data.success) {
      const summary = data.summary;
      return {
        name: 'Database Integrity Check',
        status: 'pass',
        message: `All ${summary.total} database tests passed`,
        timestamp: new Date(),
      };
    } else {
      return {
        name: 'Database Integrity Check',
        status: 'fail',
        message: `${data.summary.failed}/${data.summary.total} tests failed`,
        timestamp: new Date(),
      };
    }
  } catch (error) {
    return {
      name: 'Database Integrity Check',
      status: 'fail',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date(),
    };
  }
}

export async function runEndToEndTest(testEmail: string): Promise<TestResult[]> {
  const results: TestResult[] = [];

  results.push({
    name: 'Starting End-to-End Test',
    status: 'pending',
    message: 'Running comprehensive system test',
    timestamp: new Date(),
  });

  const dbTest = await testDatabaseConnection();
  results.push(dbTest);

  if (dbTest.status === 'fail') {
    results.push({
      name: 'End-to-End Test',
      status: 'fail',
      message: 'Database connection failed, stopping test',
      timestamp: new Date(),
    });
    return results;
  }

  const subscriberTableTest = await testSubscriberTableAccess();
  results.push(subscriberTableTest);

  const emailStatsTest = await testEmailStatsTableAccess();
  results.push(emailStatsTest);

  const dbIntegrityTest = await verifyDatabaseIntegrity();
  results.push(dbIntegrityTest);

  const gmailConfigTest = checkGmailConfiguration();
  results.push(gmailConfigTest);

  if (gmailConfigTest.status === 'pass') {
    const emailTest = await testEmailSending(testEmail);
    results.push(emailTest);
  } else {
    results.push({
      name: 'Email Sending Test',
      status: 'fail',
      message: 'Skipped due to missing Gmail configuration',
      timestamp: new Date(),
    });
  }

  const subscriptionTest = await testSubscriptionAPI(testEmail);
  results.push(subscriptionTest);

  const failedTests = results.filter(r => r.status === 'fail').length;
  const passedTests = results.filter(r => r.status === 'pass').length;

  results.push({
    name: 'End-to-End Test Complete',
    status: failedTests === 0 ? 'pass' : 'fail',
    message: `${passedTests} passed, ${failedTests} failed`,
    timestamp: new Date(),
  });

  return results;
}
