# Security Documentation

This document outlines the security measures implemented in the Associate Incidents application.

## Security Vulnerabilities Fixed

### 1. NPM Dependencies

- **Fixed**: All npm audit vulnerabilities (previously 10 vulnerabilities including 1 critical, 2 high, 1 moderate, 6 low)
- **Action**: Updated vulnerable packages and removed unused `expo-secure-store` dependency
- **Result**: 0 vulnerabilities found

### 2. Hardcoded Secrets

- **Fixed**: Removed hardcoded JWT secret fallback
- **Fixed**: Removed hardcoded encryption key fallback
- **Action**: Environment variables are now required and validated at startup
- **Impact**: Prevents use of weak default secrets in production

### 3. Password Security

- **Enhanced**: Password requirements increased from 6 to 8 characters minimum
- **Added**: Strong password policy requiring uppercase, lowercase, numbers, and special characters
- **Regex**: `/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/`

### 4. Input Validation

- **Added**: Email format validation using regex
- **Added**: Name length validation (minimum 2 characters)
- **Added**: Comprehensive input validation for user registration
- **Added**: File type validation for uploads

### 5. File Upload Security

- **Added**: File type whitelist (PDF, DOC, DOCX, TXT, JPG, PNG, GIF)
- **Added**: MIME type validation
- **Added**: File extension validation
- **Added**: Filename sanitization
- **Added**: File size limits (1MB regular, 10MB templates)

## Environment Variables Required

### Production Security Requirements

```env
# REQUIRED - Strong JWT secret (minimum 32 characters)
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"

# REQUIRED - 64-character encryption key for backups
BACKUP_ENCRYPTION_KEY="your64-character-encryption-key-here-must-be-exactly-64-chars"
```

### Security Validation

- Application will fail to start if required environment variables are missing
- JWT_SECRET must be set (no fallback)
- BACKUP_ENCRYPTION_KEY must be exactly 64 characters

## Authentication Security

### JWT Tokens

- **Algorithm**: HMAC SHA256
- **Expiration**: 24 hours
- **Secret**: Must be set via environment variable
- **Validation**: Required on all protected routes

### Password Hashing

- **Algorithm**: bcrypt
- **Salt Rounds**: 12
- **Storage**: Hashed passwords only, never plain text

### Role-Based Access Control

- **Admin Protection**: Admin-only routes protected
- **Token Validation**: Middleware on all protected routes
- **User Status**: Inactive users cannot authenticate

## File Upload Security

### Allowed File Types

- **Documents**: PDF, DOC, DOCX, TXT
- **Images**: JPG, JPEG, PNG, GIF

### Security Measures

- **MIME Type Validation**: Server-side validation
- **File Extension Validation**: Whitelist approach
- **Filename Sanitization**: Removes special characters
- **Size Limits**: 1MB regular files, 10MB templates
- **Memory Storage**: Files stored in memory, not disk

## Backup Security

### Encryption

- **Algorithm**: AES-256-CBC
- **Key**: 64-character hex string from environment
- **IV**: Random 16-byte initialization vector per backup
- **Validation**: Key length validation at startup

## Development vs Production

### Development

- Use strong, unique secrets even in development
- Never commit secrets to version control
- Use `.env` file for local development

### Production

- Use environment variables for all secrets
- Rotate secrets regularly
- Use HTTPS in production
- Set appropriate CORS origins
- Monitor for security issues

## Security Best Practices

1. **Never commit secrets** to version control
2. **Use strong passwords** meeting the policy requirements
3. **Rotate secrets regularly** in production
4. **Monitor logs** for suspicious activity
5. **Keep dependencies updated** to avoid vulnerabilities
6. **Use HTTPS** in production environments
7. **Validate all inputs** on both client and server side
8. **Sanitize file uploads** before processing
9. **Implement rate limiting** for authentication endpoints
10. **Regular security audits** of dependencies

## Reporting Security Issues

If you discover a security vulnerability, please:

1. Do not create a public issue
2. Contact the development team privately
3. Provide detailed information about the vulnerability
4. Allow reasonable time for fixes before disclosure

## Security Checklist

- [ ] JWT_SECRET environment variable set
- [ ] BACKUP_ENCRYPTION_KEY environment variable set (64 characters)
- [ ] Strong passwords enforced
- [ ] File upload validation enabled
- [ ] HTTPS enabled in production
- [ ] CORS properly configured
- [ ] Dependencies up to date
- [ ] No secrets in version control
- [ ] Regular security audits scheduled
