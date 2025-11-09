import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');
    const url = searchParams.get('url');

    if (!token || !url) {
      return NextResponse.redirect(new URL('/', request.url));
    }

    const { data: stat } = await supabase
      .from('email_stats')
      .select('*')
      .eq('tracking_token', token)
      .maybeSingle();

    if (stat && !stat.clicked_at) {
      await supabase
        .from('email_stats')
        .update({ clicked_at: new Date().toISOString() })
        .eq('id', stat.id);
    }

    return NextResponse.redirect(url);
  } catch (error) {
    console.error('Tracking click error:', error);
    return NextResponse.redirect(new URL('/', request.url));
  }
}
