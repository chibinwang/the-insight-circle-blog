import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request: NextRequest) {
  try {
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Supabase configuration missing');
      return NextResponse.json(
        { success: true },
        { status: 200 }
      );
    }

    const { email, success = false } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: '電子郵件地址是必需的' },
        { status: 400 }
      );
    }

    const ipAddress = request.headers.get('x-forwarded-for') ||
                      request.headers.get('x-real-ip') ||
                      'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    const { error: insertError } = await supabaseAdmin
      .from('login_attempts')
      .insert({
        email: email.toLowerCase(),
        ip_address: ipAddress,
        user_agent: userAgent,
        success,
        attempted_at: new Date().toISOString(),
      });

    if (insertError) {
      console.error('Error recording login attempt:', insertError);
      return NextResponse.json(
        { error: '無法記錄登入嘗試' },
        { status: 500 }
      );
    }

    if (success) {
      const fifteenMinutesAgo = new Date();
      fifteenMinutesAgo.setMinutes(fifteenMinutesAgo.getMinutes() - 15);

      await supabaseAdmin
        .from('login_attempts')
        .delete()
        .eq('email', email.toLowerCase())
        .eq('success', false)
        .gte('attempted_at', fifteenMinutesAgo.toISOString());
    }

    return NextResponse.json(
      { success: true },
      { status: 200 }
    );
  } catch (error) {
    console.error('Record login attempt error:', error);
    return NextResponse.json(
      { error: '伺服器錯誤' },
      { status: 500 }
    );
  }
}
