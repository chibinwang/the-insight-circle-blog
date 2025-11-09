import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getTransporter } from '@/lib/gmail';

export async function POST(request: Request) {
  try {
    const { subject, content } = await request.json();

    if (!subject || !content) {
      return NextResponse.json(
        { error: 'Subject and content are required' },
        { status: 400 }
      );
    }

    const { data: subscribers, error } = await supabase
      .from('subscribers')
      .select('email')
      .eq('is_subscribed', true);

    if (error || !subscribers || subscribers.length === 0) {
      return NextResponse.json(
        { error: 'No active subscribers found' },
        { status: 400 }
      );
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

    const transporter = await getTransporter();

    const emailPromises = subscribers.map((subscriber) =>
      transporter.sendMail({
        from: `"${process.env.GMAIL_FROM_NAME || '思圈blog'}" <${process.env.GMAIL_USER}>`,
        to: subscriber.email,
        subject: subject,
        html: `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <style>
                body {
                  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                  line-height: 1.6;
                  color: #333;
                  max-width: 600px;
                  margin: 0 auto;
                  padding: 20px;
                }
                .content {
                  background: #ffffff;
                  padding: 30px;
                  border-radius: 8px;
                  margin: 20px 0;
                }
                .footer {
                  text-align: center;
                  padding: 20px;
                  color: #666;
                  font-size: 14px;
                }
                .footer a {
                  color: #2563eb;
                  text-decoration: none;
                }
              </style>
            </head>
            <body>
              <div class="content">
                ${content.replace(/\n/g, '<br>')}
              </div>
              <div class="footer">
                <p>
                  You're receiving this email because you subscribed to our newsletter.<br>
                  <a href="${siteUrl}">Visit our blog</a>
                </p>
              </div>
            </body>
          </html>
        `,
      })
    );

    await Promise.all(emailPromises);

    return NextResponse.json({
      success: true,
      sentCount: subscribers.length,
    });
  } catch (error) {
    console.error('Error sending custom email:', error);
    return NextResponse.json(
      { error: 'Failed to send email' },
      { status: 500 }
    );
  }
}
