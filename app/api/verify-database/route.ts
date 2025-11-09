import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const results: any = {
      timestamp: new Date().toISOString(),
      tests: [],
      summary: {
        total: 0,
        passed: 0,
        failed: 0
      }
    };

    const { data: subscribers, error: subError } = await supabase
      .from('subscribers')
      .select('*');

    results.tests.push({
      name: 'Subscribers Table',
      status: subError ? 'fail' : 'pass',
      error: subError?.message,
      recordCount: subscribers?.length || 0,
      activeCount: subscribers?.filter((s: any) => s.is_subscribed).length || 0
    });

    const { data: posts, error: postsError } = await supabase
      .from('posts')
      .select('*')
      .eq('is_published', true);

    results.tests.push({
      name: 'Posts Table',
      status: postsError ? 'fail' : 'pass',
      error: postsError?.message,
      publishedCount: posts?.length || 0,
      emailSentCount: posts?.filter((p: any) => p.is_email_sent).length || 0
    });

    const { data: emailStats, error: statsError } = await supabase
      .from('email_stats')
      .select('*');

    const openedCount = emailStats?.filter((s: any) => s.opened_at).length || 0;
    const clickedCount = emailStats?.filter((s: any) => s.clicked_at).length || 0;

    results.tests.push({
      name: 'Email Stats Table',
      status: statsError ? 'fail' : 'pass',
      error: statsError?.message,
      totalSent: emailStats?.length || 0,
      opened: openedCount,
      clicked: clickedCount,
      openRate: emailStats?.length ? ((openedCount / emailStats.length) * 100).toFixed(2) + '%' : '0%',
      clickRate: emailStats?.length ? ((clickedCount / emailStats.length) * 100).toFixed(2) + '%' : '0%'
    });

    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*');

    results.tests.push({
      name: 'Profiles Table',
      status: profilesError ? 'fail' : 'pass',
      error: profilesError?.message,
      totalProfiles: profiles?.length || 0,
      adminCount: profiles?.filter((p: any) => p.is_admin).length || 0
    });

    const testSubscriberEmail = 'test-verification@example.com';
    const { data: insertData, error: insertError } = await supabase
      .from('subscribers')
      .insert({
        email: testSubscriberEmail,
        unsubscribe_token: 'test-token-' + Date.now(),
        is_subscribed: true
      })
      .select();

    if (!insertError && insertData) {
      await supabase
        .from('subscribers')
        .delete()
        .eq('id', insertData[0].id);
    }

    results.tests.push({
      name: 'Database Write Permission',
      status: insertError ? 'fail' : 'pass',
      error: insertError?.message,
      message: insertError ? 'Cannot write to database' : 'Write operations working correctly'
    });

    results.summary.total = results.tests.length;
    results.summary.passed = results.tests.filter((t: any) => t.status === 'pass').length;
    results.summary.failed = results.tests.filter((t: any) => t.status === 'fail').length;

    const allPassed = results.summary.failed === 0;

    return NextResponse.json(
      {
        success: allPassed,
        ...results
      },
      { status: allPassed ? 200 : 500 }
    );
  } catch (error) {
    console.error('Database verification error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}
