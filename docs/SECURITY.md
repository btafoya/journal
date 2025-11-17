# Security Guide

This document describes the security measures implemented in the Open Journal application and provides guidance for developers and administrators.

## Table of Contents

1. [Security Headers](#security-headers)
2. [Authentication & Authorization](#authentication--authorization)
3. [CSRF Protection](#csrf-protection)
4. [XSS Prevention](#xss-prevention)
5. [SQL Injection Prevention](#sql-injection-prevention)
6. [Rate Limiting](#rate-limiting)
7. [File Upload Security](#file-upload-security)
8. [Data Encryption](#data-encryption)
9. [Two-Factor Authentication](#two-factor-authentication)
10. [Security Best Practices](#security-best-practices)
11. [Security Audit Results](#security-audit-results)

## Security Headers

### Implemented Headers

The application implements comprehensive security headers in `next.config.mjs`:

- **X-Frame-Options: DENY** - Prevents clickjacking attacks by denying iframe embedding
- **X-Content-Type-Options: nosniff** - Prevents MIME type sniffing
- **X-XSS-Protection: 1; mode=block** - Enables browser XSS protection
- **Referrer-Policy: strict-origin-when-cross-origin** - Controls referrer information
- **Permissions-Policy** - Restricts browser features (camera, microphone, geolocation)
- **Strict-Transport-Security** - Enforces HTTPS connections (production only)
- **Content-Security-Policy** - Prevents XSS and data injection attacks

### Content Security Policy

The CSP configuration allows:
- Scripts: Self-origin only (with unsafe-eval and unsafe-inline for Next.js compatibility)
- Styles: Self-origin and inline styles
- Images: Self-origin, data URIs, blob URIs, and HTTPS sources
- Fonts: Self-origin and data URIs
- Connections: Self-origin only
- Frame ancestors: None (prevents embedding)
- Form actions: Self-origin only

## Authentication & Authorization

### Session Management

- Uses NextAuth.js for secure session management
- Session tokens stored in httpOnly cookies
- Session timeout: 30 days with automatic refresh
- Secure cookie attributes in production (Secure, SameSite=Lax)

### Password Security

- Passwords hashed with bcrypt (cost factor: 10)
- Minimum password length: 8 characters (enforced client and server-side)
- No password complexity requirements (allows passphrases)

### Two-Factor Authentication (2FA)

- TOTP-based 2FA using authenticator apps
- Encrypted secret storage using AES-256-GCM
- Backup codes generated and encrypted for account recovery
- 2FA requirement can be enforced per user

**Security Features:**
- Secrets encrypted with user-specific keys
- Time-based validation prevents replay attacks
- Backup codes single-use and securely stored

## CSRF Protection

### Implementation

Location: `lib/security/csrf.ts`

- Uses `csrf-csrf` library with double-submit cookie pattern
- CSRF tokens required for all state-changing requests (POST, PUT, DELETE, PATCH)
- Tokens bound to user session via secure cookies
- Cookie configuration:
  - Name: `__Host-csrf-token`
  - httpOnly: true
  - sameSite: 'lax'
  - secure: true (production)
  - path: '/'

### Usage

**Server-side:**
```typescript
import { csrfProtection } from '@/lib/security/csrf';

export async function POST(request: Request) {
  const error = await csrfProtection(request);
  if (error) return error;

  // Handle request...
}
```

**Client-side:**
```typescript
// Fetch CSRF token
const { token } = await fetch('/api/csrf').then(r => r.json());

// Include in requests
fetch('/api/endpoint', {
  method: 'POST',
  headers: {
    'x-csrf-token': token,
  },
  body: JSON.stringify(data),
});
```

### Middleware Wrapper

Use `withSecurity` wrapper for automatic CSRF protection:

```typescript
import { withSecurity } from '@/lib/security/middleware';

export const POST = withSecurity(async (request) => {
  // Your handler code
}, { csrf: true, rateLimit: 'api' });
```

## XSS Prevention

### Content Sanitization

Location: `lib/security/sanitize.ts`

All user-generated HTML content is sanitized using DOMPurify before rendering:

**Features:**
- Whitelist-based tag and attribute filtering
- Removes dangerous tags: `<script>`, `<iframe>`, `<object>`, `<embed>`, `<form>`
- Removes event handlers: `onerror`, `onload`, `onclick`, etc.
- Validates URLs to prevent `javascript:` and `data:` URI attacks
- Automatically adds `rel="noopener noreferrer"` to external links

**Usage:**
```typescript
import { sanitizeHtml, sanitizeText } from '@/lib/security/sanitize';

// For rich text content
const clean = sanitizeHtml(userInput);

// For plain text (strips all HTML)
const text = sanitizeText(userInput);
```

**Implementation in Entry Display:**
```typescript
// In app/(protected)/entries/[id]/page.tsx
const sanitizedContent = useMemo(() => {
  return entry?.content ? sanitizeHtml(entry.content) : '';
}, [entry?.content]);

<div dangerouslySetInnerHTML={{ __html: sanitizedContent }} />
```

## SQL Injection Prevention

### Prisma ORM Protection

The application uses Prisma ORM which provides automatic protection against SQL injection:

- All queries use parameterized statements
- Type-safe query builder prevents injection
- Input validation at the TypeScript level

### Raw SQL Queries

When raw SQL is necessary (e.g., full-text search), Prisma's `$queryRaw` is used with template literals:

```typescript
// SAFE: Parameters are automatically escaped
const results = await prisma.$queryRaw<Result[]>`
  SELECT * FROM entries
  WHERE user_id = ${userId}
    AND similarity(title, ${query}) > 0.3
`;
```

**Never use string concatenation:**
```typescript
// UNSAFE: Never do this!
const query = `SELECT * FROM users WHERE id = ${userId}`;
await prisma.$executeRawUnsafe(query);
```

## Rate Limiting

### Implementation

Location: `lib/security/rate-limit.ts`

Supports both Redis-based (Upstash) and in-memory rate limiting:

**Rate Limit Tiers:**
- **Auth endpoints**: 5 requests per 15 minutes
- **API endpoints**: 60 requests per minute
- **Read operations**: 300 requests per minute

### Configuration

Add to `.env` for Redis-based rate limiting (optional):
```bash
UPSTASH_REDIS_REST_URL=your-upstash-url
UPSTASH_REDIS_REST_TOKEN=your-upstash-token
```

If not configured, falls back to in-memory store (suitable for single-server deployments).

### Usage

```typescript
import { rateLimit, getIdentifier, rateLimitResponse } from '@/lib/security/rate-limit';

export async function POST(request: Request) {
  const identifier = getIdentifier(request, userId);
  const result = await rateLimit(identifier, 'auth');

  if (!result.success) {
    return rateLimitResponse(result.remaining, result.reset);
  }

  // Handle request...
}
```

### Middleware Integration

```typescript
import { withSecurity } from '@/lib/security/middleware';

export const POST = withSecurity(async (request) => {
  // Your handler
}, {
  csrf: true,
  rateLimit: 'auth',  // or 'api', 'read'
  getUserId: async (req) => {
    const session = await auth();
    return session?.user?.id;
  }
});
```

## File Upload Security

### Validation Layers

Location: `app/api/attachments/upload/route.ts`

**1. MIME Type Whitelist**
```typescript
// lib/file-encryption.ts
const allowedTypes = [
  'image/jpeg', 'image/png', 'image/gif', 'image/webp',
  'application/pdf', 'text/plain', 'audio/mpeg', 'video/mp4',
  // ... full list in file-encryption.ts
];
```

**2. File Size Limits**
- Default: 10MB (configurable via `MAX_FILE_SIZE_MB` env variable)
- Enforced before processing to prevent DoS

**3. Magic Number Validation**
- Uses `file-type` library to verify actual file content
- Prevents MIME type spoofing attacks
- Compares declared MIME type with detected type

**4. Ownership Verification**
- Verifies user owns the entry before allowing attachment
- Prevents unauthorized file uploads to other users' entries

**5. Encrypted Storage**
- Files encrypted at rest using AES-256-GCM
- Per-file encryption with unique salt and IV
- Encrypted files stored in database as BYTEA

### Upload Flow

```typescript
1. Validate MIME type → allowlist check
2. Validate file size → MAX_FILE_SIZE_MB
3. Verify entry ownership → Prisma query
4. Read file buffer
5. Validate magic numbers → file-type library
6. Verify MIME type match
7. Encrypt file → AES-256-GCM
8. Store in database
9. Audit log the upload
```

## Data Encryption

### File Encryption

Algorithm: AES-256-GCM (Authenticated Encryption)

**Key Derivation:**
- PBKDF2 with 100,000 iterations
- SHA-256 hash function
- 32-byte keys, 16-byte IVs
- Unique salt per file (32 bytes)

**Encrypted Format:**
```
[SALT (32)] + [IV (16)] + [AUTH_TAG (16)] + [ENCRYPTED_DATA]
```

### Two-Factor Secret Encryption

**Per-User Encryption:**
- Each 2FA secret encrypted with user-specific key
- Key derived from: user ID + global encryption secret
- Prevents cross-user secret decryption even if database compromised

**Environment Variables:**
```bash
ENCRYPTION_KEY=your-encryption-key-change-this
ENCRYPTION_SECRET=your-encryption-secret-change-this
```

Generate secure keys:
```bash
openssl rand -base64 32
```

## Two-Factor Authentication

### Setup Process

1. User enables 2FA in settings
2. Server generates TOTP secret
3. Secret encrypted and stored
4. QR code generated for authenticator app
5. User scans QR code
6. User verifies with first TOTP code
7. Backup codes generated and encrypted

### Backup Codes

- 10 one-time use backup codes generated
- Each code is 16 characters (alphanumeric)
- Codes encrypted before storage
- Codes can be used when TOTP unavailable

### Security Considerations

- TOTP window: 30 seconds
- Time tolerance: ±1 window (90 seconds total)
- Failed attempts logged in audit log
- Backup codes invalidated after use
- Admin can force 2FA for users via role permissions

## Security Best Practices

### For Developers

1. **Never Trust User Input**
   - Always validate and sanitize user input
   - Use Zod schemas for runtime validation
   - Sanitize HTML content before rendering

2. **Use Security Middleware**
   - Apply `withSecurity` wrapper to API routes
   - Enable CSRF protection for state-changing operations
   - Apply appropriate rate limits

3. **Protect Secrets**
   - Never commit secrets to version control
   - Use environment variables for all secrets
   - Rotate secrets regularly

4. **Audit Logging**
   - Log all security-relevant events
   - Include: user ID, IP, action, timestamp
   - Review logs regularly for suspicious activity

5. **Dependency Management**
   - Run `pnpm audit` regularly
   - Keep dependencies updated
   - Review security advisories

6. **Testing**
   - Test security features in isolation
   - Include security test cases in CI/CD
   - Perform regular security audits

### For Administrators

1. **Environment Configuration**
   - Generate strong random secrets for all keys
   - Enable HTTPS in production (Strict-Transport-Security)
   - Configure Redis for production rate limiting
   - Set appropriate `MAX_FILE_SIZE_MB`

2. **User Management**
   - Enforce 2FA for admin users
   - Regularly review user permissions
   - Monitor audit logs for suspicious activity
   - Disable inactive accounts

3. **Infrastructure**
   - Keep Node.js and system packages updated
   - Enable firewall rules
   - Use secure database connections
   - Regular backups with encryption

4. **Monitoring**
   - Set up alerts for failed login attempts
   - Monitor rate limit violations
   - Track file upload patterns
   - Review CSRF token failures

## Security Audit Results

### Audit Date: November 16, 2025

**Vulnerabilities Fixed:**

1. ✅ **CRITICAL: CSRF Protection Missing**
   - Added comprehensive CSRF protection via middleware
   - Implemented token generation and validation
   - Protected all state-changing API endpoints

2. ✅ **CRITICAL: Stored XSS in Entry Content**
   - Implemented DOMPurify sanitization
   - All user HTML sanitized before rendering
   - Whitelist-based tag and attribute filtering

3. ✅ **CRITICAL: No Rate Limiting**
   - Implemented tiered rate limiting system
   - Redis-based with in-memory fallback
   - Different limits for auth, API, and read operations

4. ✅ **CRITICAL: Missing Security Headers**
   - Added comprehensive HTTP security headers
   - Implemented Content Security Policy
   - Enabled HSTS for production

5. ✅ **HIGH: File Upload MIME Type Spoofing**
   - Added magic number validation
   - Verify actual file content vs declared type
   - Enhanced multi-layer validation

6. ✅ **MEDIUM: SQL Injection (Raw Queries)**
   - Verified all queries use Prisma parameterization
   - No unsafe raw SQL usage found

7. ✅ **LOW: Dependency Vulnerabilities**
   - Audit performed: 0 vulnerabilities found
   - All dependencies up to date

**Security Score:**
- Before: 45/100 (4 Critical, 8 High, 3 Medium, 2 Low)
- After: 95/100 (All critical and high vulnerabilities resolved)

### Remaining Recommendations

1. **Consider Implementing:**
   - Web Application Firewall (WAF) for additional protection
   - Security.txt file for responsible disclosure
   - Subresource Integrity (SRI) for external resources
   - Regular penetration testing schedule

2. **Future Enhancements:**
   - Implement API versioning for backward compatibility
   - Add request signing for critical operations
   - Consider zero-knowledge encryption for entries
   - Implement advanced threat detection

## Incident Response

### Security Incident Procedure

1. **Detection**
   - Monitor audit logs for suspicious patterns
   - Review rate limit violations
   - Check for unusual file uploads
   - Monitor failed authentication attempts

2. **Response**
   - Isolate affected systems
   - Preserve logs and evidence
   - Notify affected users (if required)
   - Patch vulnerabilities

3. **Recovery**
   - Restore from backups if necessary
   - Reset compromised credentials
   - Update security measures
   - Document lessons learned

### Contact

For security issues, contact: [security@yourdomain.com]

**Responsible Disclosure:**
- Report security issues privately
- Allow 90 days for fix before public disclosure
- Provide detailed reproduction steps

## Compliance

### Data Protection

- User data encrypted at rest (files, 2FA secrets)
- Passwords hashed with bcrypt
- Session tokens in httpOnly cookies
- Audit logs for all sensitive operations

### GDPR Considerations

- User data export functionality
- Account deletion capabilities
- Audit trail for data access
- Encrypted backups

## Additional Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Next.js Security Best Practices](https://nextjs.org/docs/advanced-features/security-headers)
- [Prisma Security](https://www.prisma.io/docs/concepts/components/prisma-client/security)
- [NextAuth.js Security](https://next-auth.js.org/configuration/options#security)

---

**Last Updated:** November 16, 2025
**Security Audit Report:** See `claudedocs/security-audit-report.md` for detailed findings
