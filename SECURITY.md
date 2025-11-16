# Security and Privacy Documentation

## Overview

OpenJournal implements multiple layers of security to protect user data and ensure privacy.

## Encryption

### Entry Content Encryption (End-to-End)

**Implementation**: `lib/encryption.ts`

All journal entry content is encrypted before being stored in the database using AES-256-GCM encryption.

**Features**:
- **Algorithm**: AES-256-GCM (Galois/Counter Mode)
- **Key Derivation**: PBKDF2 with 100,000 iterations using SHA-256
- **Authentication**: Built-in authentication tags prevent tampering
- **Salt**: 64-byte random salt per encrypted value
- **IV**: 16-byte random initialization vector per encrypted value

**Process**:
1. Plain text content → Encrypted in API layer
2. Stored encrypted in database
3. Decrypted only when retrieved by authorized user
4. Never logged or cached in plain text

**Configuration**:
- Set `ENCRYPTION_KEY` environment variable (generate with `openssl rand -base64 32`)
- Key must be kept secret and backed up securely
- Rotate keys periodically (requires re-encryption migration)

### Database Encryption at Rest

**Recommendation**: Configure PostgreSQL with transparent data encryption (TDE) or use encrypted volumes.

**Options**:
1. **PostgreSQL Native**:
   - Enable `pgcrypto` extension
   - Use encrypted tablespaces

2. **Cloud Provider Solutions**:
   - AWS RDS: Enable encryption at rest
   - Google Cloud SQL: Enable automatic encryption
   - Azure Database: Enable transparent data encryption

3. **Filesystem Level**:
   - LUKS (Linux Unified Key Setup)
   - dm-crypt for volume encryption
   - Cloud provider encrypted volumes

## Transport Security (TLS/HTTPS)

### Production Deployment

**Requirements**:
- All connections must use HTTPS
- TLS 1.2 or higher
- Strong cipher suites only

**Implementation Options**:

#### 1. Reverse Proxy (Recommended)
```nginx
# nginx configuration
server {
    listen 443 ssl http2;
    server_name journal.example.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Host $host;
    }
}
```

#### 2. Cloud Platform
- Vercel: Automatic HTTPS
- Netlify: Automatic HTTPS
- AWS ALB: Configure SSL/TLS certificate
- Google Cloud Load Balancer: Configure SSL certificate

#### 3. Let's Encrypt
```bash
# Using certbot
certbot --nginx -d journal.example.com
```

### Development

Local development uses HTTP by default. For testing HTTPS locally:

```bash
# Generate self-signed certificate
openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -days 365 -nodes

# Update package.json
"dev": "NODE_OPTIONS='--tls-key=key.pem --tls-cert=cert.pem' next dev -p 3001"
```

## Authentication Security

### Password Security
- Bcrypt hashing with salt rounds: 12
- Minimum password requirements enforced
- Password reset tokens expire after 1 hour
- Secure token generation using cryptographic random

### Two-Factor Authentication (2FA)
- TOTP (Time-based One-Time Password)
- QR code setup with secret backup
- Recovery codes available
- Enforced for sensitive operations

### Session Management
- HTTP-only cookies
- Secure flag in production
- SameSite: Lax protection
- Session expiration: 30 days (configurable)
- Automatic session cleanup

### OAuth Security
- State parameter for CSRF protection
- PKCE (Proof Key for Code Exchange) where supported
- Secure token storage
- Token encryption at rest

## Audit Logging

### Events Tracked

**Authentication Events**:
- Login attempts (success/failure)
- Logout events
- Password changes
- 2FA setup/changes
- Account lockouts

**Data Access Events**:
- Entry creation
- Entry modifications
- Entry deletions
- Entry views (optional, configurable)

**Security Events**:
- Failed authentication attempts
- Permission denied errors
- Suspicious activity patterns
- API rate limit violations

### Log Format

```typescript
interface AuditLog {
  id: string;
  userId: string;
  action: string;          // e.g., "entry.create", "auth.login"
  resourceType: string;    // e.g., "entry", "user"
  resourceId: string | null;
  ipAddress: string;
  userAgent: string;
  metadata: object;        // Additional context
  timestamp: Date;
  success: boolean;
}
```

### Retention Policy
- Security logs: 90 days minimum
- Compliance logs: As required by regulations
- Access logs: 30 days
- Auto-archival to cold storage for long-term retention

## Privacy Controls

### Data Minimization
- Only collect necessary data
- No tracking cookies without consent
- Minimal metadata collection
- User-configurable data retention

### User Rights
- Export all personal data (GDPR compliance)
- Delete account and all associated data
- View audit logs of their own data access
- Control data sharing preferences

### Access Control
- Role-based access control (RBAC)
- User can only access their own data
- Admin access logged and audited
- Principle of least privilege

## Security Headers

### Implemented Headers

```typescript
// middleware.ts
export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // Security headers
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline';"
  );

  return response;
}
```

## Rate Limiting

### API Protection
- Rate limiting per IP address
- Rate limiting per user account
- Exponential backoff on failures
- CAPTCHA for repeated failures

### Limits (Configurable)
- Authentication: 5 attempts per 15 minutes
- API endpoints: 100 requests per minute
- Entry creation: 10 per minute
- Export operations: 1 per hour

## Vulnerability Management

### Regular Updates
- Dependencies updated monthly
- Security patches applied immediately
- Automated dependency scanning (Dependabot)
- Regular security audits

### Reporting
- Security issues: security@openjournal.example
- Bug bounty program (if applicable)
- Responsible disclosure policy
- 90-day disclosure timeline

## Compliance

### Standards
- GDPR (General Data Protection Regulation)
- CCPA (California Consumer Privacy Act)
- SOC 2 Type II (if applicable)
- HIPAA compliance considerations (for medical journaling)

### Certifications
- Regular penetration testing
- Third-party security audits
- Compliance certifications maintained

## Incident Response

### Process
1. Detect and identify security incident
2. Contain and mitigate immediate threat
3. Investigate root cause
4. Remediate vulnerabilities
5. Notify affected users (if required)
6. Document and learn from incident

### Contact
- Security team: security@openjournal.example
- Emergency hotline: +1-XXX-XXX-XXXX
- Public disclosure: security page on website

## Environment Variables

### Required Security Variables

```bash
# Encryption
ENCRYPTION_KEY=                    # AES-256 encryption key

# Authentication
NEXTAUTH_SECRET=                   # NextAuth.js secret
NEXTAUTH_URL=                      # Application URL

# Database (use SSL in production)
DATABASE_URL=                      # PostgreSQL connection with SSL

# OAuth (store securely)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
```

### Secret Management

**Development**:
- `.env.local` (git-ignored)
- Never commit secrets to version control

**Production**:
- Environment variable injection
- Secret management services (AWS Secrets Manager, HashiCorp Vault)
- Encrypted secret storage
- Access audit logging

## Best Practices

### For Users
1. Use strong, unique passwords
2. Enable two-factor authentication
3. Review audit logs regularly
4. Report suspicious activity
5. Keep recovery codes secure

### For Developers
1. Never log sensitive data
2. Use parameterized queries (prevent SQL injection)
3. Validate all user input
4. Follow principle of least privilege
5. Keep dependencies updated
6. Use security linters and scanners
7. Conduct code reviews for security

### For Administrators
1. Enable all security features
2. Monitor audit logs
3. Set up alerting for security events
4. Regular security assessments
5. Maintain backup and recovery procedures
6. Document security procedures
7. Train team on security practices

## Security Checklist

### Before Production Deployment

- [ ] All environment variables set securely
- [ ] HTTPS/TLS enabled and configured
- [ ] Database encryption at rest enabled
- [ ] Security headers configured
- [ ] Rate limiting implemented
- [ ] Audit logging enabled
- [ ] Session security configured
- [ ] Password policies enforced
- [ ] 2FA available and encouraged
- [ ] CSRF protection enabled
- [ ] XSS protection in place
- [ ] SQL injection prevention verified
- [ ] Dependency vulnerabilities checked
- [ ] Security testing completed
- [ ] Incident response plan documented
- [ ] Backup and recovery tested

## References

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [NIST Cybersecurity Framework](https://www.nist.gov/cyberframework)
- [CIS Controls](https://www.cisecurity.org/controls)
- [Next.js Security Best Practices](https://nextjs.org/docs/advanced-features/security-headers)
