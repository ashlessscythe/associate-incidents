# Email Setup Guide

This guide explains how to set up email functionality for the Associate Incidents application using Resend.

## Features Implemented

1. **Welcome Emails**: Sent automatically when users register
2. **Password Reset Emails**: Sent when users request password reset
3. **Password Reset Success Emails**: Confirmation when password is successfully reset

## Setup Instructions

### 1. Create a Resend Account

1. Go to [Resend.com](https://resend.com) and create an account
2. Verify your domain or use the sandbox domain for testing
3. Create an API key in your dashboard

### 2. Environment Variables

Add the following variables to your `.env` file:

```env
# Email Configuration
RESEND_API_KEY="re_your_api_key_here"
EMAIL_FROM="noreply@yourdomain.com"
FRONTEND_URL="http://localhost:5173"
```

**Important Notes:**
- `EMAIL_FROM` should be a verified domain in Resend
- For testing, you can use `onboarding@resend.dev` (Resend's sandbox domain)
- `FRONTEND_URL` should match your frontend URL for password reset links

### 3. Domain Verification (Production)

For production use, you need to verify your domain in Resend:

1. Add your domain in the Resend dashboard
2. Add the required DNS records (TXT, MX, CNAME)
3. Wait for verification to complete
4. Update `EMAIL_FROM` to use your verified domain

## Email Templates

The application includes three email templates:

### Welcome Email
- Sent when users register
- Explains the pending approval process
- Professional styling with company branding

### Password Reset Email
- Sent when users request password reset
- Contains a secure reset link (expires in 1 hour)
- Includes security warnings and instructions

### Password Reset Success Email
- Confirmation when password is successfully reset
- Security notification for unauthorized changes

## Frontend Integration

### Authentication Modal
- Added "Forgot Password?" link in the login tab
- Opens a modal for email input
- Handles password reset requests

### Reset Password Page
- Dedicated page at `/reset-password`
- Validates reset tokens
- Secure password reset form

## Security Features

1. **Token Expiration**: Reset tokens expire after 1 hour
2. **Secure Tokens**: 32-byte random hex tokens
3. **Rate Limiting**: Consider implementing rate limiting for production
4. **Email Validation**: Server-side email validation
5. **Password Requirements**: Minimum 6 characters

## Testing

### Local Development
1. Use Resend's sandbox domain for testing
2. Check the Resend dashboard for email delivery
3. Test both registration and password reset flows

### Production Testing
1. Verify your domain in Resend
2. Test with real email addresses
3. Monitor email delivery rates

## Troubleshooting

### Common Issues

1. **Emails not sending**
   - Check RESEND_API_KEY is correct
   - Verify domain is approved in Resend
   - Check server logs for errors

2. **Reset links not working**
   - Verify FRONTEND_URL is correct
   - Check token expiration
   - Ensure database migration was applied

3. **Email delivery issues**
   - Check spam folders
   - Verify domain reputation
   - Monitor Resend dashboard for bounces

### Debug Mode

Enable debug logging by checking the server console for email-related errors.

## API Endpoints

### Password Reset
- `POST /auth/forgot-password` - Request password reset
- `POST /auth/reset-password` - Reset password with token

### Registration
- `POST /auth/register` - User registration (sends welcome email)

## Database Schema

The User model includes:
- `resetToken`: String (optional) - Password reset token
- `resetTokenExpiry`: DateTime (optional) - Token expiration time

## Next Steps

1. **Customize Email Templates**: Update HTML templates in `src/lib/emailService.js`
2. **Add Email Preferences**: Allow users to opt-out of certain emails
3. **Implement Rate Limiting**: Add rate limiting for password reset requests
4. **Email Analytics**: Track email open rates and click-through rates
5. **Template Management**: Move email templates to a CMS or configuration file 