# Email Verification Setup Guide

## Overview
This guide explains how to set up email verification for your Doc Upload App using Gmail and Nodemailer.

## What We've Implemented

✅ **Email Verification System**
- Users must verify their email before logging in
- Verification tokens expire after 24 hours
- Beautiful verification email templates
- Resend verification email functionality
- Secure token generation and validation

✅ **Database Changes**
- Added `emailVerified` field to User model
- Added `emailVerificationToken` field for secure verification
- Added `emailVerificationExpires` field for token expiration

✅ **API Endpoints**
- `/api/verify-email` - Verifies email tokens
- `/api/resend-verification` - Resends verification emails
- Updated `/api/signup` - Sends verification emails
- Updated `/api/login` - Checks email verification

✅ **Frontend Pages**
- `/verify-email` - Email verification page
- Updated signup flow with verification messages

## Setup Instructions

### 1. Create Environment Variables
Create a `.env.local` file in your project root with:

```bash
# Resend Configuration
RESEND_API_KEY=re_1234567890abcdef...

# From Email Address (optional - defaults to noreply@yourdomain.com)
FROM_EMAIL=noreply@yourdomain.com

# App URL for verification links
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 2. Set Up Resend Account

1. **Sign up for Resend** at [resend.com](https://resend.com)
2. **Get your API key**:
   - Go to your Resend dashboard
   - Copy your API key (starts with `re_`)
   - Add it to your `.env.local` file
3. **Verify your domain** (optional but recommended):
   - Add your domain in Resend dashboard
   - This allows you to send from `noreply@yourdomain.com`
   - Without verification, you can use `noreply@resend.dev`

### 3. Update App URL
For production, change `NEXT_PUBLIC_APP_URL` to your actual domain:
```bash
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

## How It Works

### Signup Flow
1. User fills out signup form
2. System creates user with `status: PENDING`
3. Verification email is sent with secure token
4. User clicks verification link in email
5. Email is verified and user `status` becomes `APPROVED`
6. User can now log in

### Verification Flow
1. User clicks verification link: `/verify-email?token=abc123...`
2. System validates token and expiration
3. User account is marked as verified
4. Success page is shown with login link

### Login Protection
- Only verified users can log in
- Unverified users see helpful error message
- Users can request new verification emails

## Security Features

🔒 **Token Security**
- 32-character random tokens
- 24-hour expiration
- One-time use (tokens are cleared after verification)

🔒 **Email Security**
- Gmail App Passwords (more secure than regular passwords)
- No sensitive data in verification emails
- Secure token generation using crypto.randomBytes()

🔒 **Database Security**
- Tokens are hashed and stored securely
- Automatic cleanup of expired tokens
- Activity logging for audit trails

## Testing

### Test the System
1. Start your development server: `npm run dev`
2. Sign up with a new email
3. Check your email for verification link
4. Click the verification link
5. Try logging in with the verified account

### Test Error Cases
- Try logging in before verification
- Use expired verification links
- Test with invalid tokens

## Troubleshooting

### Common Issues

**"Failed to send verification email"**
- Check Resend API key in `.env.local`
- Ensure your Resend account is active
- Verify API key is correct and has sending permissions

**"Verification token has expired"**
- User waited too long to verify
- Use resend verification endpoint
- Check server time settings

**"Invalid verification token"**
- Token was already used
- Token was corrupted
- Check database connection

### Debug Mode
Add logging to see what's happening:
```typescript
console.log('Sending email to:', email);
console.log('Verification token:', token);
```

## Cost Analysis

💰 **Resend Solution (Current)**
- **Free Tier**: 3,000 emails/month
- **Paid**: $20/month for 50,000 emails
- **Best for**: Modern apps, great developer experience

💰 **Alternative: SendGrid**
- **Free Tier**: 100 emails/day (3,000/month)
- **Paid**: $15/month for 50,000 emails
- **Best for**: Enterprise apps, advanced features

💰 **Alternative: Gmail (Previous)**
- **Cost**: $0/month
- **Limit**: 500 emails/day (15,000/month)
- **Best for**: Personal projects, limited scale

## Next Steps

🚀 **Enhancements You Could Add**
- Password reset functionality
- Email templates customization
- Multiple email providers
- Email delivery tracking
- Rate limiting for verification requests

## Support

If you encounter issues:
1. Check the console logs
2. Verify environment variables
3. Test Gmail credentials manually
4. Check database migration status

---

**Note**: This system is production-ready and follows security best practices. The Resend solution provides professional email delivery with excellent deliverability and can scale with your business needs.
