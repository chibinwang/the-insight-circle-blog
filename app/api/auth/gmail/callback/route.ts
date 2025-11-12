import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';

export async function GET(req: NextRequest) {
  const clientId = process.env.GMAIL_CLIENT_ID;
  const clientSecret = process.env.GMAIL_CLIENT_SECRET;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;

  if (!clientId || !clientSecret || !siteUrl) {
    return NextResponse.json(
      {
        error: 'Missing required env vars',
        details: {
          hasClientId: !!clientId,
          hasClientSecret: !!clientSecret,
          hasSiteUrl: !!siteUrl,
        },
      },
      { status: 400 }
    );
  }

  const url = new URL(req.url);
  const code = url.searchParams.get('code');
  if (!code) {
    return NextResponse.json({ error: 'Missing code' }, { status: 400 });
  }

  const redirectUri = `${siteUrl}/api/auth/gmail/callback`;
  const oAuth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);

  try {
    const { tokens } = await oAuth2Client.getToken(code);
    return NextResponse.json({
      message: 'Copy this refresh token into GMAIL_REFRESH_TOKEN and redeploy',
      refresh_token: tokens.refresh_token || null,
      note: 'If refresh_token is null, re-initiate with prompt=consent and access_type=offline.',
      scopes: tokens.scope,
    });
  } catch (error) {
    console.error('OAuth token exchange failed:', error);
    return NextResponse.json({ error: 'Failed to exchange code for tokens' }, { status: 500 });
  }
}

