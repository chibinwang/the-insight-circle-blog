import { NextResponse } from 'next/server';
import { google } from 'googleapis';

export async function GET() {
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

  const redirectUri = `${siteUrl}/api/auth/gmail/callback`;
  const oAuth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);

  const scopes = [
    'https://www.googleapis.com/auth/gmail.send',
    'https://www.googleapis.com/auth/gmail.compose',
    'https://www.googleapis.com/auth/gmail.modify',
  ];

  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: scopes,
  });

  return NextResponse.redirect(authUrl);
}

