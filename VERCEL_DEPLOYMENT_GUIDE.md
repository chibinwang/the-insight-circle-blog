# Vercel Deployment Guide - 思圈blog

This guide will walk you through deploying your Next.js blog application to Vercel with full Gmail newsletter functionality.

## Prerequisites

Before you begin, make sure you have:
- A GitHub, GitLab, or Bitbucket account
- Your code pushed to a Git repository
- A Gmail account for sending newsletters
- Access to your Supabase dashboard

---

## Part 1: Set Up Gmail for Newsletter Functionality

Your blog needs to send newsletters to subscribers. Follow these steps to configure Gmail:

### Step 1: Enable 2-Factor Authentication (2FA)

1. Go to [Google Account Security](https://myaccount.google.com/security)
2. Scroll to "How you sign in to Google"
3. Click on "2-Step Verification"
4. Follow the prompts to enable 2FA if not already enabled

### Step 2: Generate App Password

1. After enabling 2FA, go back to [Google Account Security](https://myaccount.google.com/security)
2. Click on "2-Step Verification" again
3. Scroll down to "App passwords" and click it
4. Select "Mail" as the app and "Other" as the device
5. Enter "思圈blog Newsletter" as the device name
6. Click "Generate"
7. **IMPORTANT:** Copy the 16-character password (looks like: xxxx xxxx xxxx xxxx)
8. Save this password securely - you'll need it in Step 4

### Step 3: Note Your Gmail Address

Write down the Gmail address you'll use (e.g., your-email@gmail.com)

---

## Part 2: Deploy to Vercel

### Step 1: Sign Up for Vercel

1. Go to [vercel.com](https://vercel.com)
2. Click "Sign Up"
3. Choose to sign up with GitHub, GitLab, or Bitbucket
4. Authorize Vercel to access your repositories
5. Complete the sign-up process

### Step 2: Import Your Project

1. After signing in, you'll see the Vercel dashboard
2. Click "Add New..." button in the top right
3. Select "Project"
4. Find your blog repository in the list
5. Click "Import" next to your repository

### Step 3: Configure Your Project

Vercel will automatically detect that it's a Next.js project. You'll see:

- **Framework Preset:** Next.js (automatically detected)
- **Root Directory:** ./ (keep as default)
- **Build Command:** `npm run build` (automatically set)
- **Output Directory:** .next (automatically set)
- **Install Command:** `npm install` (automatically set)

**DO NOT CLICK DEPLOY YET!** First, we need to add environment variables.

### Step 4: Add Environment Variables

Before deploying, you need to configure environment variables. Click on "Environment Variables" section to expand it.

Add each of these variables one by one:

#### 4.1: Supabase Configuration

**Variable Name:** `NEXT_PUBLIC_SUPABASE_URL`
**Value:** `https://xdotbcpkufvgycbddgot.supabase.co`
Click "Add"

**Variable Name:** `NEXT_PUBLIC_SUPABASE_ANON_KEY`
**Value:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhkb3RiY3BrdWZ2Z3ljYmRkZ290Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIwODcwMDUsImV4cCI6MjA3NzY2MzAwNX0.u4LBz6y-erh6Dq0irdaYZUOg_whZscp9ub387ulOoxM`
Click "Add"

#### 4.2: Gmail Configuration

**Variable Name:** `GMAIL_USER`
**Value:** Your Gmail address from Part 1, Step 3 (e.g., your-email@gmail.com)
Click "Add"

**Variable Name:** `GMAIL_APP_PASSWORD`
**Value:** The 16-character app password from Part 1, Step 2 (remove spaces if any)
Click "Add"

**Variable Name:** `GMAIL_FROM_NAME`
**Value:** `思圈blog`
Click "Add"

#### 4.3: Site URL (Skip for now)

We'll add `NEXT_PUBLIC_SITE_URL` after the first deployment.

### Step 5: Deploy!

1. After adding all environment variables, click "Deploy"
2. Vercel will start building your project
3. Wait 2-4 minutes for the build to complete
4. You'll see a success message with your live URL (e.g., `your-project-name.vercel.app`)

### Step 6: Add Site URL Environment Variable

1. Copy your new Vercel URL (e.g., `https://your-project-name.vercel.app`)
2. Go to your project dashboard in Vercel
3. Click "Settings" at the top
4. Click "Environment Variables" in the left sidebar
5. Add a new variable:
   - **Variable Name:** `NEXT_PUBLIC_SITE_URL`
   - **Value:** Your Vercel URL (paste it here)
   - Click "Add"

### Step 7: Redeploy

1. Go to the "Deployments" tab
2. Click "..." next to your latest deployment
3. Click "Redeploy"
4. Confirm the redeployment
5. Wait for it to complete

---

## Part 3: Verify Everything Works

After deployment, test these features:

### Test 1: Visit Your Site
- Open your Vercel URL
- Verify the homepage loads correctly

### Test 2: Test Authentication
- Click "Login" in the navigation
- Try signing up for a new account
- Try logging in with your credentials

### Test 3: Test Newsletter Subscription
- Go to the homepage
- Enter an email in the newsletter subscription form
- Click "Subscribe"
- Check if you receive a success message

### Test 4: Test Admin Panel
- Login with an admin account
- Go to `/admin`
- Navigate to "Test Newsletter"
- Send a test email to your own email
- Check if you receive the email

### Test 5: Test Blog Posts
- Browse blog posts on the homepage
- Click on a post to read it
- Verify images and content load correctly

---

## Part 4: Automatic Deployments

Great news! Your deployment is now automated:

- Every time you push to your main/master branch, Vercel will automatically rebuild and deploy
- Preview deployments are created for pull requests
- You can view deployment logs in the Vercel dashboard

---

## Troubleshooting

### Issue: "Email service not configured" error

**Solution:**
1. Go to Vercel dashboard > Your Project > Settings > Environment Variables
2. Verify that `GMAIL_USER` and `GMAIL_APP_PASSWORD` are set correctly
3. Make sure there are no extra spaces in the values
4. Redeploy the project

### Issue: Authentication not working

**Solution:**
1. Check that both Supabase environment variables are set correctly
2. Go to your Supabase dashboard
3. Verify the URL and anon key match your environment variables
4. Check Supabase authentication settings

### Issue: Images not loading

**Solution:**
1. Check that `NEXT_PUBLIC_SITE_URL` is set to your Vercel URL
2. Verify your Supabase storage bucket is publicly accessible
3. Check the browser console for CORS errors

### Issue: Build fails on Vercel

**Solution:**
1. Go to Vercel dashboard > Deployments
2. Click on the failed deployment
3. Check the build logs for specific error messages
4. Most common issue: missing environment variables
5. Verify all environment variables are added correctly

### Issue: Newsletter emails not sending

**Solution:**
1. Verify Gmail App Password is correct (no spaces)
2. Make sure 2FA is enabled on your Gmail account
3. Check if Gmail is blocking the app password:
   - Go to [Gmail Security Checkup](https://myaccount.google.com/security-checkup)
   - Look for any alerts about blocked sign-in attempts
   - Allow the app if blocked
4. Test with the admin panel's "Test Newsletter" feature

---

## Custom Domain (Optional)

If you want to use your own domain (e.g., blog.yourdomain.com):

1. Go to Vercel dashboard > Your Project > Settings > Domains
2. Click "Add"
3. Enter your domain name
4. Follow Vercel's instructions to update your DNS settings
5. After DNS propagates, update `NEXT_PUBLIC_SITE_URL` environment variable with your custom domain
6. Redeploy the project

Vercel automatically provides SSL certificates for all domains.

---

## Environment Variables Reference

Here's a complete list of all environment variables needed:

| Variable | Description | Example Value |
|----------|-------------|---------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL | https://xxxxx.supabase.co |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anonymous key | eyJhbGc... |
| `GMAIL_USER` | Gmail address for sending emails | your-email@gmail.com |
| `GMAIL_APP_PASSWORD` | Gmail app password (16 chars) | abcdabcdabcdabcd |
| `GMAIL_FROM_NAME` | Display name for newsletter emails | 思圈blog |
| `NEXT_PUBLIC_SITE_URL` | Your Vercel deployment URL | https://your-app.vercel.app |

---

## Support and Resources

- **Vercel Documentation:** [vercel.com/docs](https://vercel.com/docs)
- **Next.js Documentation:** [nextjs.org/docs](https://nextjs.org/docs)
- **Supabase Documentation:** [supabase.com/docs](https://supabase.com/docs)
- **Gmail App Passwords Help:** [support.google.com](https://support.google.com/accounts/answer/185833)

---

## Important Notes

- Vercel's free tier includes:
  - Unlimited personal projects
  - Automatic HTTPS/SSL certificates
  - Automatic CI/CD from Git
  - 100GB bandwidth per month
  - Preview deployments for every commit

- Your Gmail account can send up to 500 emails per day with App Passwords
- If you need to send more emails, consider upgrading to a professional email service

- For production use, consider:
  - Setting up a custom domain
  - Using a dedicated email service (SendGrid, AWS SES, etc.)
  - Configuring email rate limiting
  - Setting up proper monitoring and error tracking

---

## Next Steps

After successful deployment:

1. Create your first admin account
2. Write and publish your first blog post
3. Test the newsletter functionality
4. Share your new blog URL with the world!

Congratulations! Your blog is now live on Vercel! 🎉
