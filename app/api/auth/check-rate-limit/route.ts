import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

const RATE_LIMIT_WINDOW_MINUTES = 15;
const MAX_FAILED_ATTEMPTS = 5;

export async function POST(request: NextRequest) {
  try {
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Supabase configuration missing');
      return NextResponse.json(
        { allowed: true },
        { status: 200 }
      );
    }

    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: '電子郵件地址是必需的' },
        { status: 400 }
      );
    }

    const ipAddress = request.headers.get('x-forwarded-for') ||
                      request.headers.get('x-real-ip') ||
                      'unknown';

    const windowStart = new Date();
    windowStart.setMinutes(windowStart.getMinutes() - RATE_LIMIT_WINDOW_MINUTES);

    const { data: recentAttempts, error } = await supabaseAdmin
      .from('login_attempts')
      .select('*')
      .eq('email', email.toLowerCase())
      .eq('success', false)
      .gte('attempted_at', windowStart.toISOString())
      .order('attempted_at', { ascending: false });

    if (error) {
      console.error('Error checking rate limit:', error);
      return NextResponse.json(
        { allowed: true },
        { status: 200 }
      );
    }

    const failedAttempts = recentAttempts?.length || 0;

    if (failedAttempts >= MAX_FAILED_ATTEMPTS) {
      const oldestAttempt = recentAttempts[recentAttempts.length - 1];
      const oldestAttemptTime = new Date(oldestAttempt.attempted_at);
      const unlockTime = new Date(oldestAttemptTime);
      unlockTime.setMinutes(unlockTime.getMinutes() + RATE_LIMIT_WINDOW_MINUTES);

      const minutesRemaining = Math.ceil(
        (unlockTime.getTime() - Date.now()) / (1000 * 60)
      );

      return NextResponse.json(
        {
          allowed: false,
          reason: 'rate_limit_exceeded',
          message: `登入嘗試次數過多。請在 ${minutesRemaining} 分鐘後再試。`,
          attemptsRemaining: 0,
          unlockAt: unlockTime.toISOString(),
        },
        { status: 429 }
      );
    }

    return NextResponse.json(
      {
        allowed: true,
        attemptsRemaining: MAX_FAILED_ATTEMPTS - failedAttempts,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Rate limit check error:', error);
    return NextResponse.json(
      { allowed: true },
      { status: 200 }
    );
  }
}
