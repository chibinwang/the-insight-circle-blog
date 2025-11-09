import nodemailer from 'nodemailer';
import { google } from 'googleapis';

type EmailOptions = {
  to: string;
  subject: string;
  html: string;
};

const oAuth2Client = new google.auth.OAuth2(
  process.env.GMAIL_CLIENT_ID,
  process.env.GMAIL_CLIENT_SECRET
);

if (process.env.GMAIL_REFRESH_TOKEN) {
  oAuth2Client.setCredentials({ refresh_token: process.env.GMAIL_REFRESH_TOKEN });
}

export async function getTransporter() {
  if (!process.env.GMAIL_USER || !process.env.GMAIL_CLIENT_ID || !process.env.GMAIL_CLIENT_SECRET || !process.env.GMAIL_REFRESH_TOKEN) {
    throw new Error('Gmail OAuth2 credentials not configured. Required: GMAIL_USER, GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET, GMAIL_REFRESH_TOKEN');
  }

  try {
    const accessToken = await oAuth2Client.getAccessToken();

    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        type: 'OAuth2',
        user: process.env.GMAIL_USER,
        clientId: process.env.GMAIL_CLIENT_ID,
        clientSecret: process.env.GMAIL_CLIENT_SECRET,
        refreshToken: process.env.GMAIL_REFRESH_TOKEN,
        accessToken: accessToken.token || '',
      },
    });
  } catch (error) {
    console.error('Failed to create OAuth2 transporter:', error);
    throw new Error('Failed to authenticate with Gmail OAuth2');
  }
}

export async function sendEmail({ to, subject, html }: EmailOptions) {
  try {
    const transporter = await getTransporter();

    await transporter.sendMail({
      from: `"${process.env.GMAIL_FROM_NAME || '思圈blog'}" <${process.env.GMAIL_USER}>`,
      to,
      subject,
      html,
    });

    return { success: true };
  } catch (error) {
    console.error('Email sending error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

export function generateTrackingPixel(trackingToken: string, baseUrl: string): string {
  return `${baseUrl}/api/track/open?token=${trackingToken}`;
}

export function generateTrackedLink(url: string, trackingToken: string, baseUrl: string): string {
  return `${baseUrl}/api/track/click?token=${trackingToken}&url=${encodeURIComponent(url)}`;
}

export function createNewsletterEmail(post: {
  title: string;
  content: string;
  cover_image: string | null;
  slug: string;
  author: string;
  created_at: string;
}, trackingToken: string, unsubscribeToken: string, baseUrl: string): string {
  const postUrl = `${baseUrl}/post/${post.slug}`;
  const trackedPostUrl = generateTrackedLink(postUrl, trackingToken, baseUrl);
  const unsubscribeUrl = `${baseUrl}/unsubscribe?token=${unsubscribeToken}`;
  const trackingPixelUrl = generateTrackingPixel(trackingToken, baseUrl);

  const excerpt = post.content.substring(0, 200).trim() + '...';
  const formattedDate = new Date(post.created_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${post.title}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f9fafb; line-height: 1.6;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); overflow: hidden;">

          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 30px; text-align: center; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">思圈blog</h1>
              <p style="margin: 10px 0 0; color: #e0e7ff; font-size: 14px;">New Story Published</p>
            </td>
          </tr>

          ${post.cover_image ? `
          <!-- Cover Image -->
          <tr>
            <td style="padding: 0;">
              <img src="${post.cover_image}" alt="${post.title}" style="width: 100%; height: auto; display: block; max-height: 300px; object-fit: cover;">
            </td>
          </tr>
          ` : ''}

          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <h2 style="margin: 0 0 16px; color: #111827; font-size: 24px; font-weight: bold; line-height: 1.3;">${post.title}</h2>

              <div style="margin-bottom: 24px; padding-bottom: 24px; border-bottom: 1px solid #e5e7eb;">
                <p style="margin: 0; color: #6b7280; font-size: 14px;">
                  <strong>By ${post.author}</strong> • ${formattedDate}
                </p>
              </div>

              <div style="margin-bottom: 32px; color: #374151; font-size: 16px; line-height: 1.6;">
                <p style="margin: 0;">${excerpt}</p>
              </div>

              <!-- CTA Button -->
              <table cellpadding="0" cellspacing="0" style="margin: 0 auto;">
                <tr>
                  <td align="center" style="border-radius: 6px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
                    <a href="${trackedPostUrl}" style="display: inline-block; padding: 14px 32px; color: #ffffff; text-decoration: none; font-weight: 600; font-size: 16px;">Read Full Story</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 30px 40px; background-color: #f9fafb; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0 0 12px; color: #6b7280; font-size: 14px; text-align: center;">
                You're receiving this email because you subscribed to 思圈blog newsletter.
              </p>
              <p style="margin: 0; color: #9ca3af; font-size: 12px; text-align: center;">
                <a href="${unsubscribeUrl}" style="color: #6b7280; text-decoration: underline;">Unsubscribe</a> from future emails
              </p>
            </td>
          </tr>
        </table>

        <!-- Copyright -->
        <table width="600" cellpadding="0" cellspacing="0" style="margin-top: 20px;">
          <tr>
            <td style="text-align: center; color: #9ca3af; font-size: 12px;">
              <p style="margin: 0;">&copy; ${new Date().getFullYear()} 思圈blog. All rights reserved.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>

  <!-- Tracking Pixel -->
  <img src="${trackingPixelUrl}" width="1" height="1" style="display: none;" alt="">
</body>
</html>
  `.trim();
}

export function generateUnsubscribeToken(): string {
  return Array.from(crypto.getRandomValues(new Uint8Array(32)))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

export function generateTrackingToken(): string {
  return Array.from(crypto.getRandomValues(new Uint8Array(24)))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}
