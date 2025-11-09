# Environment Variables Checklist

Use this checklist when setting up your deployment on Vercel or any other platform.

## Quick Setup Checklist

Copy this checklist and check off each item as you complete it:

- [ ] NEXT_PUBLIC_SUPABASE_URL configured
- [ ] NEXT_PUBLIC_SUPABASE_ANON_KEY configured
- [ ] GMAIL_USER configured with real Gmail address
- [ ] GMAIL_APP_PASSWORD configured with 16-character app password
- [ ] GMAIL_FROM_NAME configured (optional, defaults to "思圈blog")
- [ ] NEXT_PUBLIC_SITE_URL configured with deployment URL
- [ ] Tested newsletter subscription
- [ ] Tested email sending from admin panel
- [ ] Verified authentication works

---

## Required Environment Variables

### 1. Supabase Database Configuration

#### NEXT_PUBLIC_SUPABASE_URL
- **Type:** Public (visible to browser)
- **Required:** Yes
- **Description:** Your Supabase project URL
- **Current Value:** `https://xdotbcpkufvgycbddgot.supabase.co`
- **Where to find it:** Supabase Dashboard > Settings > API > Project URL

#### NEXT_PUBLIC_SUPABASE_ANON_KEY
- **Type:** Public (visible to browser)
- **Required:** Yes
- **Description:** Your Supabase anonymous/public API key
- **Current Value:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhkb3RiY3BrdWZ2Z3ljYmRkZ290Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIwODcwMDUsImV4cCI6MjA3NzY2MzAwNX0.u4LBz6y-erh6Dq0irdaYZUOg_whZscp9ub387ulOoxM`
- **Where to find it:** Supabase Dashboard > Settings > API > Project API keys > anon/public

---

### 2. Gmail Newsletter Configuration

#### GMAIL_USER
- **Type:** Secret (server-side only)
- **Required:** Yes (for newsletter functionality)
- **Description:** Gmail address used to send newsletter emails
- **Example:** `your-email@gmail.com`
- **How to set up:**
  1. Use a Gmail account you control
  2. This email will be the "From" address for newsletters
  3. Must have 2FA enabled
  4. Must generate an App Password (see below)

#### GMAIL_APP_PASSWORD
- **Type:** Secret (server-side only)
- **Required:** Yes (for newsletter functionality)
- **Description:** 16-character app password for Gmail
- **Format:** 16 characters (remove spaces if present)
- **Example:** `abcdabcdabcdabcd`
- **How to generate:**
  1. Go to [Google Account Security](https://myaccount.google.com/security)
  2. Enable 2-Factor Authentication if not enabled
  3. Go to "App passwords"
  4. Generate new password for "Mail" app
  5. Copy the 16-character password (remove spaces)

#### GMAIL_FROM_NAME
- **Type:** Secret (server-side only)
- **Required:** No (has default value)
- **Description:** Display name for newsletter sender
- **Default:** `思圈blog`
- **Example:** `思圈blog` or `My Blog Newsletter`

---

### 3. Site Configuration

#### NEXT_PUBLIC_SITE_URL
- **Type:** Public (visible to browser)
- **Required:** Yes
- **Description:** Full URL of your deployed application
- **Example (Vercel):** `https://your-project-name.vercel.app`
- **Example (Custom Domain):** `https://blog.yourdomain.com`
- **Important:**
  - Must include `https://`
  - No trailing slash
  - Update this after initial deployment
  - Used for generating email links and tracking

---

## Platform-Specific Instructions

### For Vercel Deployment

1. Go to your project in Vercel dashboard
2. Click "Settings" > "Environment Variables"
3. Add each variable one by one
4. For secrets (GMAIL_*), leave "Expose to" as default (not exposed to browser)
5. For public variables (NEXT_PUBLIC_*), they're automatically available to browser
6. After adding all variables, trigger a redeploy

### For Local Development

Create a `.env.local` file in your project root:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xdotbcpkufvgycbddgot.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhkb3RiY3BrdWZ2Z3ljYmRkZ290Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIwODcwMDUsImV4cCI6MjA3NzY2MzAwNX0.u4LBz6y-erh6Dq0irdaYZUOg_whZscp9ub387ulOoxM

# Gmail (use real values)
GMAIL_USER=your-email@gmail.com
GMAIL_APP_PASSWORD=your-16-char-app-password
GMAIL_FROM_NAME=思圈blog

# Site URL (for local development)
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

---

## Testing Your Configuration

### Test 1: Check Environment Variables Are Loaded

Create a test API route to verify (for development only):

```typescript
// app/api/test-env/route.ts
export async function GET() {
  return Response.json({
    supabase_url: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Set' : 'Missing',
    supabase_key: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Set' : 'Missing',
    gmail_user: process.env.GMAIL_USER ? 'Set' : 'Missing',
    gmail_pass: process.env.GMAIL_APP_PASSWORD ? 'Set' : 'Missing',
    site_url: process.env.NEXT_PUBLIC_SITE_URL ? 'Set' : 'Missing',
  });
}
```

Visit `/api/test-env` to check. All should show "Set".

### Test 2: Test Database Connection

1. Visit your site
2. Try to sign up for a new account
3. If successful, Supabase is configured correctly

### Test 3: Test Email Functionality

1. Login to admin account
2. Go to `/admin/test-newsletter`
3. Send a test email to your own address
4. Check your inbox (and spam folder)
5. If received, Gmail is configured correctly

---

## Security Best Practices

### DO:
- ✅ Use environment variables for all sensitive data
- ✅ Use App Passwords (never your real Gmail password)
- ✅ Keep `.env` files in `.gitignore`
- ✅ Use different credentials for development and production
- ✅ Rotate passwords regularly
- ✅ Use Vercel's encrypted environment variables

### DON'T:
- ❌ Never commit `.env` files to Git
- ❌ Never use your real Gmail password
- ❌ Never expose server-side secrets to the browser
- ❌ Never hardcode sensitive values in your code
- ❌ Never share your App Password publicly

---

## Troubleshooting

### Problem: Environment variables not loading

**Solution:**
- On Vercel: Make sure you added them in the dashboard and redeployed
- Locally: Make sure `.env.local` exists and is in project root
- Check for typos in variable names
- Restart your development server

### Problem: Gmail authentication failing

**Solution:**
- Verify 2FA is enabled on Gmail account
- Regenerate App Password
- Make sure there are no spaces in the password
- Check if Gmail blocked the sign-in attempt
- Try using a different Gmail account

### Problem: "Email service not configured" error

**Solution:**
- Check that both `GMAIL_USER` and `GMAIL_APP_PASSWORD` are set
- Verify the values don't have extra spaces or quotes
- Check server logs for specific error messages
- Test with the admin panel's test email feature

### Problem: Database connection errors

**Solution:**
- Verify Supabase URL is correct
- Check that anon key is correct and not expired
- Ensure Supabase project is active (not paused)
- Check Supabase dashboard for any service issues

---

## Quick Copy-Paste Template

Use this template when adding environment variables to Vercel:

```
Variable: NEXT_PUBLIC_SUPABASE_URL
Value: https://xdotbcpkufvgycbddgot.supabase.co

Variable: NEXT_PUBLIC_SUPABASE_ANON_KEY
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhkb3RiY3BrdWZ2Z3ljYmRkZ290Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIwODcwMDUsImV4cCI6MjA3NzY2MzAwNX0.u4LBz6y-erh6Dq0irdaYZUOg_whZscp9ub387ulOoxM

Variable: GMAIL_USER
Value: [YOUR_GMAIL_ADDRESS]

Variable: GMAIL_APP_PASSWORD
Value: [YOUR_16_CHAR_APP_PASSWORD]

Variable: GMAIL_FROM_NAME
Value: 思圈blog

Variable: NEXT_PUBLIC_SITE_URL
Value: [YOUR_VERCEL_URL] (add after first deployment)
```

---

## Need Help?

If you're stuck:
1. Check the VERCEL_DEPLOYMENT_GUIDE.md for step-by-step instructions
2. Review the Troubleshooting section above
3. Check Vercel deployment logs for specific errors
4. Verify all variables are spelled correctly (case-sensitive!)
5. Make sure you redeployed after adding/changing variables
