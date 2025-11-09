import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { sendEmail, createNewsletterEmail, generateTrackingToken } from '@/lib/gmail';

export async function POST(request: NextRequest) {
  try {
    const { postId, subscriberIds } = await request.json();

    if (!postId) {
      return NextResponse.json(
        { error: 'Post ID is required' },
        { status: 400 }
      );
    }

    const { data: post } = await supabase
      .from('posts')
      .select(`
        *,
        profiles (
          username
        )
      `)
      .eq('id', postId)
      .maybeSingle();

    if (!post) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      );
    }

    let subscriberQuery = supabase
      .from('subscribers')
      .select('*')
      .eq('is_subscribed', true);

    if (subscriberIds && Array.isArray(subscriberIds) && subscriberIds.length > 0) {
      subscriberQuery = subscriberQuery.in('id', subscriberIds);
    }

    const { data: subscribers } = await subscriberQuery;

    if (!subscribers || subscribers.length === 0) {
      return NextResponse.json(
        { error: subscriberIds ? 'No matching subscribers found' : 'No active subscribers' },
        { status: 400 }
      );
    }

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    const authorName = post.profiles?.username || 'Anonymous';

    let sentCount = 0;
    let failedCount = 0;

    for (const subscriber of subscribers) {
      try {
        const trackingToken = generateTrackingToken();

        await supabase.from('email_stats').insert({
          subscriber_id: subscriber.id,
          post_id: post.id,
          tracking_token: trackingToken,
        });

        const emailHtml = createNewsletterEmail(
          {
            title: post.title,
            content: post.content,
            cover_image: post.cover_image,
            slug: post.slug,
            author: authorName,
            created_at: post.created_at,
          },
          trackingToken,
          subscriber.unsubscribe_token,
          baseUrl
        );

        const result = await sendEmail({
          to: subscriber.email,
          subject: `New Story: ${post.title}`,
          html: emailHtml,
        });

        if (result.success) {
          sentCount++;
        } else {
          failedCount++;
          console.error(`Failed to send to ${subscriber.email}:`, result.error);
        }

        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        failedCount++;
        console.error(`Error sending to ${subscriber.email}:`, error);
      }
    }

    await supabase
      .from('posts')
      .update({
        is_email_sent: true,
        email_sent_at: new Date().toISOString(),
      })
      .eq('id', postId);

    return NextResponse.json(
      {
        message: 'Newsletter sent successfully',
        sentCount,
        failedCount,
        totalSubscribers: subscribers.length,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Send newsletter error:', error);
    return NextResponse.json(
      { error: 'Failed to send newsletter' },
      { status: 500 }
    );
  }
}
