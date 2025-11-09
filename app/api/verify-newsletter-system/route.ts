import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    const checks = {
      gmailConfigured: false,
      databaseConnected: false,
      subscribersTableExists: false,
      hasSubscribers: false,
      postsTableExists: false,
      hasPosts: false,
      emailStatsTableExists: false,
    };

    checks.gmailConfigured = !!(
      process.env.GMAIL_USER &&
      process.env.GMAIL_CLIENT_ID &&
      process.env.GMAIL_CLIENT_SECRET &&
      process.env.GMAIL_REFRESH_TOKEN
    );

    try {
      const { data: subscribers, error: subError } = await supabase
        .from('subscribers')
        .select('id', { count: 'exact', head: false })
        .limit(1);

      if (!subError) {
        checks.subscribersTableExists = true;
        checks.databaseConnected = true;

        const { count } = await supabase
          .from('subscribers')
          .select('*', { count: 'exact', head: true })
          .eq('is_subscribed', true);

        checks.hasSubscribers = (count || 0) > 0;
      }
    } catch (error) {
      checks.subscribersTableExists = false;
    }

    try {
      const { error: postsError } = await supabase
        .from('posts')
        .select('id')
        .limit(1);

      if (!postsError) {
        checks.postsTableExists = true;

        const { count } = await supabase
          .from('posts')
          .select('*', { count: 'exact', head: true });

        checks.hasPosts = (count || 0) > 0;
      }
    } catch (error) {
      checks.postsTableExists = false;
    }

    try {
      const { error: statsError } = await supabase
        .from('email_stats')
        .select('id')
        .limit(1);

      checks.emailStatsTableExists = !statsError;
    } catch (error) {
      checks.emailStatsTableExists = false;
    }

    const ready =
      checks.gmailConfigured &&
      checks.databaseConnected &&
      checks.subscribersTableExists &&
      checks.postsTableExists &&
      checks.emailStatsTableExists;

    const warnings = [];
    if (!checks.hasSubscribers) {
      warnings.push('No active subscribers found');
    }
    if (!checks.hasPosts) {
      warnings.push('No posts available to send');
    }

    return NextResponse.json({
      ready,
      checks,
      warnings,
      message: ready
        ? 'Newsletter system is fully operational'
        : 'Newsletter system has configuration issues',
    });
  } catch (error) {
    return NextResponse.json(
      {
        ready: false,
        error: 'Failed to verify newsletter system',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
