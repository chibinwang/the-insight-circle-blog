import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json();

    if (!token) {
      return NextResponse.json(
        { error: 'Token is required' },
        { status: 400 }
      );
    }

    const { data: subscriber } = await supabase
      .from('subscribers')
      .select('*')
      .eq('unsubscribe_token', token)
      .maybeSingle();

    if (!subscriber) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 404 }
      );
    }

    const { error } = await supabase
      .from('subscribers')
      .update({
        is_subscribed: true,
        subscribed_at: new Date().toISOString(),
        unsubscribed_at: null,
      })
      .eq('id', subscriber.id);

    if (error) throw error;

    return NextResponse.json(
      { message: 'Successfully resubscribed' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Resubscribe error:', error);
    return NextResponse.json(
      { error: 'Failed to resubscribe' },
      { status: 500 }
    );
  }
}
