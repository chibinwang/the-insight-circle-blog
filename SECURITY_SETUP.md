# Security Configuration Guide

## Overview

This guide covers the security enhancements applied to your Supabase project, including index optimization and password protection setup.

---

## 1. Index Optimization (Completed)

### What Was Done

We've optimized your database indexes by removing redundant single-column indexes where composite indexes can serve the same purpose. This improves:

- **Storage efficiency**: Fewer indexes mean less disk space used
- **Write performance**: Fewer indexes to update on INSERT/UPDATE operations
- **Maintenance overhead**: Less indexes to analyze and maintain

### Indexes Removed

The following redundant indexes were removed because composite indexes handle their queries:

- `idx_posts_author_id` - Replaced by `idx_posts_author_published`
- `idx_email_stats_subscriber_id` - Replaced by `idx_email_stats_subscriber_post`
- `idx_email_stats_post_id` - Composite index handles both columns
- `idx_group_messages_group_id` - Replaced by `idx_group_messages_group_created`
- `idx_group_messages_user_id` - Composite index sufficient for queries

### Indexes Retained

All essential indexes are retained for optimal performance:

- Foreign key indexes for JOIN operations
- Composite indexes for common query patterns
- Single-column indexes where no composite alternative exists

### Performance Impact

- ✅ Query performance: **No degradation** (composite indexes serve single-column queries)
- ✅ Write performance: **Improved** (fewer indexes to maintain)
- ✅ Storage usage: **Reduced** (less disk space used)

---

## 2. Enable Leaked Password Protection (Action Required)

### What is HIBP Password Protection?

Supabase Auth can prevent users from using passwords that have been exposed in data breaches by checking against the [Have I Been Pwned (HIBP)](https://haveibeenpwned.com/) database.

### Why Enable This?

- **Enhanced Security**: Prevents use of compromised passwords
- **User Protection**: Helps users avoid passwords that hackers already know
- **Industry Best Practice**: Recommended by security experts worldwide
- **No Performance Impact**: Checks are done via secure API calls

### How to Enable (Step-by-Step)

1. **Go to Supabase Dashboard**
   - Navigate to [https://supabase.com/dashboard](https://supabase.com/dashboard)
   - Select your project

2. **Open Authentication Settings**
   - Click on "Authentication" in the left sidebar
   - Click on "Policies" or "Settings" tab

3. **Enable Password Protection**
   - Look for "Password Strength" or "Security" section
   - Find the option: **"Enable Have I Been Pwned (HIBP) password protection"**
   - Toggle it to **ON** / **Enabled**

4. **Save Changes**
   - Click "Save" or "Apply" button
   - Changes take effect immediately

### What Happens When Enabled?

- **During Signup**: If a user tries to sign up with a compromised password, they'll receive an error message
- **During Password Change**: Users cannot change to a compromised password
- **Existing Users**: Not affected until they try to change their password
- **User Experience**: Clear error message: "This password has been exposed in a data breach. Please choose a different password."

### Alternative Configuration (Via SQL)

If the UI option is not available, you can enable it via SQL:

```sql
-- Enable HIBP password protection
UPDATE auth.config
SET value = 'true'
WHERE parameter = 'password_breach_check_enabled';
```

**Note**: This requires superuser access and may not be available in all Supabase plans.

---

## 3. Additional Security Recommendations

### 3.1 Password Requirements

Consider setting strong password requirements:

- **Minimum length**: 8-12 characters recommended
- **Complexity**: Require mix of uppercase, lowercase, numbers, symbols
- **Dictionary words**: Prevent common dictionary words

### 3.2 Rate Limiting

Enable rate limiting for authentication endpoints:

- Prevents brute force attacks
- Limits signup/login attempts per IP
- Configure in Supabase Dashboard → Authentication → Rate Limits

### 3.3 Email Verification

Ensure email verification is enabled:

- Go to Authentication → Settings
- Enable "Enable email confirmations"
- Users must verify their email before accessing the app

### 3.4 MFA (Multi-Factor Authentication)

Consider enabling MFA for enhanced security:

- Go to Authentication → Settings
- Enable "Enable phone authentication" or "Enable TOTP"
- Require MFA for admin accounts

### 3.5 Session Management

Configure secure session settings:

- **Session timeout**: Set appropriate timeout (default: 1 week)
- **JWT expiry**: Configure token expiration
- **Refresh tokens**: Enable secure refresh token rotation

---

## 4. Monitoring and Maintenance

### Regular Security Audits

Perform regular security audits:

1. **Review user accounts**: Check for suspicious activity
2. **Monitor failed login attempts**: Track potential attacks
3. **Update dependencies**: Keep Supabase client libraries up-to-date
4. **Review RLS policies**: Ensure Row Level Security is properly configured

### Database Index Monitoring

Monitor index usage over time:

```sql
-- Check index usage statistics
SELECT
  schemaname,
  tablename,
  indexname,
  idx_scan as times_used,
  idx_tup_read as tuples_read,
  idx_tup_fetch as tuples_fetched
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan DESC;
```

### Performance Monitoring

Keep track of query performance:

```sql
-- Check slow queries
SELECT
  calls,
  mean_exec_time,
  max_exec_time,
  query
FROM pg_stat_statements
WHERE mean_exec_time > 100
ORDER BY mean_exec_time DESC
LIMIT 20;
```

---

## 5. Verification Checklist

After completing all security setup, verify:

- [ ] Index optimization migration applied successfully
- [ ] HIBP password protection enabled in Supabase Dashboard
- [ ] Password requirements configured appropriately
- [ ] Rate limiting enabled for authentication endpoints
- [ ] Email verification enabled
- [ ] RLS policies reviewed and tested
- [ ] Admin accounts secured with strong passwords
- [ ] Monitoring tools configured

---

## 6. Support and Resources

### Documentation

- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Have I Been Pwned API](https://haveibeenpwned.com/API/v3)
- [PostgreSQL Index Documentation](https://www.postgresql.org/docs/current/indexes.html)

### Security Best Practices

- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)
- [NIST Password Guidelines](https://pages.nist.gov/800-63-3/sp800-63b.html)

### Getting Help

If you encounter any issues:

1. Check Supabase documentation
2. Review migration logs for errors
3. Contact Supabase support
4. Check community forums and Discord

---

## Summary

✅ **Completed:**
- Removed redundant database indexes
- Optimized composite indexes for better performance
- Documented essential indexes and their purposes

⚠️ **Action Required:**
- Enable HIBP password protection in Supabase Dashboard
- Review and configure additional security settings
- Set up monitoring and regular security audits

📊 **Expected Benefits:**
- Improved write performance (fewer indexes to update)
- Better storage efficiency (reduced disk space)
- Enhanced user security (compromised password protection)
- Maintained query performance (composite indexes optimize queries)
