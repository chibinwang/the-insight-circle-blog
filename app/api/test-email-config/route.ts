import { NextResponse } from 'next/server';

export async function GET() {
  const hasUser = !!process.env.GMAIL_USER;
  const hasClientId = !!process.env.GMAIL_CLIENT_ID;
  const hasClientSecret = !!process.env.GMAIL_CLIENT_SECRET;
  const hasRefreshToken = !!process.env.GMAIL_REFRESH_TOKEN;
  const hasFromName = !!process.env.GMAIL_FROM_NAME;

  return NextResponse.json({
    hasUser,
    hasClientId,
    hasClientSecret,
    hasRefreshToken,
    hasFromName,
    gmailUser: hasUser ? process.env.GMAIL_USER : null,
    fromName: hasFromName ? process.env.GMAIL_FROM_NAME : '思圈blog',
    isOAuth2Configured: hasUser && hasClientId && hasClientSecret && hasRefreshToken,
  });
}
