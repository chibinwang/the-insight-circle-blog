import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { generateUnsubscribeToken } from '@/lib/gmail';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    const { data: existing } = await supabase
      .from('subscribers')
      .select('*')
      .eq('email', normalizedEmail)
      .maybeSingle();

    if (existing) {
      if (existing.is_subscribed) {
        return NextResponse.json(
          { error: 'Email already subscribed' },
          { status: 400 }
        );
      } else {
        const { error } = await supabase
          .from('subscribers')
          .update({
            is_subscribed: true,
            subscribed_at: new Date().toISOString(),
            unsubscribed_at: null,
          })
          .eq('id', existing.id);

        if (error) throw error;

        return NextResponse.json(
          { message: 'Successfully resubscribed!' },
          { status: 200 }
        );
      }
    }

    const unsubscribeToken = generateUnsubscribeToken();

    const { error } = await supabase.from('subscribers').insert({
      email: normalizedEmail,
      unsubscribe_token: unsubscribeToken,
      is_subscribed: true,
    });

    if (error) throw error;

    return NextResponse.json(
      { message: 'Successfully subscribed!' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Subscribe error:', error);
    return NextResponse.json(
      { error: 'Failed to subscribe' },
      { status: 500 }
    );
  }
}
