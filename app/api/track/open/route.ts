import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return new NextResponse(null, { status: 400 });
    }

    const { data: stat } = await supabase
      .from('email_stats')
      .select('*')
      .eq('tracking_token', token)
      .maybeSingle();

    if (stat && !stat.opened_at) {
      await supabase
        .from('email_stats')
        .update({ opened_at: new Date().toISOString() })
        .eq('id', stat.id);
    }

    const transparentPixel = Buffer.from(
      'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
      'base64'
    );

    return new NextResponse(transparentPixel, {
      status: 200,
      headers: {
        'Content-Type': 'image/gif',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
  } catch (error) {
    console.error('Tracking pixel error:', error);
    const transparentPixel = Buffer.from(
      'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
      'base64'
    );
    return new NextResponse(transparentPixel, {
      status: 200,
      headers: { 'Content-Type': 'image/gif' },
    });
  }
}
