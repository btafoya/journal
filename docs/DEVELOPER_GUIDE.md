# Developer Guide

Welcome to the OpenJournal development team! This guide will help you get started with the codebase and contribute effectively.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Development Environment Setup](#development-environment-setup)
3. [Project Structure](#project-structure)
4. [Key Technologies](#key-technologies)
5. [Development Workflow](#development-workflow)
6. [Testing Strategies](#testing-strategies)
7. [Code Style Guidelines](#code-style-guidelines)
8. [Security Best Practices](#security-best-practices)
9. [Contributing Guidelines](#contributing-guidelines)
10. [Deployment Process](#deployment-process)
11. [Troubleshooting](#troubleshooting)

---

## Architecture Overview

### High-Level Architecture

OpenJournal is built as a full-stack Next.js 14 application with the following architecture:

```
┌─────────────────────────────────────────────────────────┐
│                    Client Layer                         │
│  Next.js 14 App Router + React 18 + Tailwind CSS        │
│  - shadcn/ui components                                 │
│  - TipTap rich text editor                              │
│  - Client-side state management                         │
└─────────────────┬───────────────────────────────────────┘
                  │
┌─────────────────┴───────────────────────────────────────┐
│                    API Layer                            │
│  Next.js 14 API Routes                                  │
│  - RESTful endpoints                                    │
│  - NextAuth.js authentication                           │
│  - Rate limiting & CSRF protection                      │
└─────────────────┬───────────────────────────────────────┘
                  │
┌─────────────────┴───────────────────────────────────────┐
│                  Business Logic Layer                   │
│  - Encryption services                                  │
│  - Audit logging                                        │
│  - Email notifications                                  │
│  - Plugin system                                        │
│  - Import/Export handlers                               │
└─────────────────┬───────────────────────────────────────┘
                  │
┌─────────────────┴───────────────────────────────────────┐
│                    Data Layer                           │
│  Prisma ORM + PostgreSQL 16                             │
│  - Type-safe database access                            │
│  - Migration management                                 │
│  - Connection pooling                                   │
└─────────────────────────────────────────────────────────┘
```

### Design Patterns

**1. API Route Handlers**
- Each API route follows a consistent pattern: validation → authentication → authorization → business logic → response
- Error handling middleware wraps all routes
- Rate limiting applied per route category (auth, API, read operations)

**2. Database Access**
- All database operations use Prisma ORM
- Type-safe queries prevent runtime errors
- Transactions for multi-step operations
- Audit logging for sensitive operations

**3. Security Layers**
- End-to-end encryption for file uploads (AES-256-GCM)
- CSRF protection on all state-changing operations
- XSS prevention with DOMPurify sanitization
- Role-based access control (RBAC)

**4. Plugin Architecture**
- Event-driven lifecycle hooks
- Sandboxed execution environment
- Permission-based access control
- Storage isolation per plugin

---

## Development Environment Setup

### Prerequisites

Install the following tools:

- **Node.js**: 18+ (LTS recommended)
- **pnpm**: 8+ (preferred package manager)
- **Docker**: For PostgreSQL database
- **Git**: Version control

### Initial Setup

**1. Clone the repository**
```bash
git clone <repository-url>
cd journal
```

**2. Install dependencies**
```bash
pnpm install
```

**3. Start PostgreSQL with Docker**
```bash
docker compose up -d
```

This starts PostgreSQL on port 5433 with credentials defined in `docker-compose.yml`.

**4. Configure environment variables**
```bash
cp .env.example .env.local
```

Edit `.env.local` with your configuration:

```env
# Database
DATABASE_URL="postgresql://openjournal:openjournal_dev_password@localhost:5433/openjournal?schema=public"

# NextAuth (generate with: openssl rand -base64 32)
NEXTAUTH_SECRET=your-secret-key-here
NEXTAUTH_URL=http://localhost:3000

# Security (generate with: openssl rand -base64 32)
CSRF_SECRET=your-csrf-secret-here
ENCRYPTION_KEY=your-encryption-key-here
ENCRYPTION_SECRET=your-encryption-secret-here

# OAuth (optional for development)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret

# Email (optional - Postmark)
POSTMARK_API_KEY=your-postmark-api-key
POSTMARK_FROM_EMAIL=noreply@yourdomain.com
```

**5. Initialize Prisma**
```bash
pnpm prisma generate
pnpm prisma migrate dev
```

**6. Start the development server**
```bash
pnpm dev
```

Navigate to [http://localhost:3000](http://localhost:3000).

### Recommended IDE Setup

**VS Code Extensions:**
- ESLint
- Prettier
- Prisma
- Tailwind CSS IntelliSense
- TypeScript and JavaScript Language Features

**VS Code Settings** (`.vscode/settings.json`):
```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.tsdk": "node_modules/typescript/lib"
}
```

---

## Project Structure

```
journal/
├── app/                          # Next.js 14 App Router
│   ├── (protected)/              # Protected routes (requires auth)
│   │   ├── admin/                # Admin-only pages
│   │   ├── entries/              # Journal entry pages
│   │   ├── settings/             # User settings
│   │   ├── workspaces/           # Workspace management
│   │   ├── plugins/              # Plugin management
│   │   └── layout.tsx            # Protected layout wrapper
│   ├── api/                      # API routes
│   │   ├── auth/                 # Authentication endpoints
│   │   ├── entries/              # Entry CRUD operations
│   │   ├── comments/             # Comment operations
│   │   ├── roles/                # Role management
│   │   └── users/                # User operations
│   ├── auth/                     # Public auth pages (signin, signup)
│   ├── layout.tsx                # Root layout
│   └── page.tsx                  # Landing page
│
├── components/                   # React components
│   ├── comments/                 # Comment system components
│   ├── editor/                   # TipTap editor components
│   ├── providers/                # Context providers
│   └── ui/                       # shadcn/ui components
│
├── lib/                          # Utility libraries
│   ├── security/                 # Security utilities (CSRF, rate limiting)
│   ├── plugins/                  # Plugin system implementation
│   ├── themes/                   # Theme system
│   ├── auth.ts                   # NextAuth configuration
│   ├── audit-log.ts              # Audit logging utilities
│   ├── encryption.ts             # Encryption helpers
│   ├── file-encryption.ts        # File encryption service
│   ├── email.ts                  # Email notification service
│   ├── import-export.ts          # Import/export functionality
│   ├── mcp-server.ts             # MCP server implementation
│   ├── prisma.ts                 # Prisma client singleton
│   └── utils.ts                  # Common utilities
│
├── prisma/                       # Database schema and migrations
│   ├── migrations/               # Database migrations
│   └── schema.prisma             # Prisma schema definition
│
├── public/                       # Static assets
│
├── docs/                         # Documentation
│   ├── DEVELOPER_GUIDE.md        # This file
│   ├── SECURITY.md               # Security documentation
│   ├── OAUTH_SETUP.md            # OAuth configuration guide
│   ├── PLUGIN_DEVELOPMENT.md     # Plugin development guide
│   └── API_DOCUMENTATION.md      # API reference
│
├── .taskmaster/                  # Task Master configuration
│   ├── tasks/                    # Task definitions
│   └── docs/                     # PRD and planning docs
│
├── .env.local                    # Local environment variables
├── .prettierrc                   # Prettier configuration
├── .eslintrc.json                # ESLint configuration
├── tailwind.config.ts            # Tailwind CSS configuration
├── tsconfig.json                 # TypeScript configuration
├── next.config.mjs               # Next.js configuration
├── docker-compose.yml            # PostgreSQL Docker setup
└── package.json                  # Dependencies and scripts
```

### Key Directory Patterns

**App Router Conventions:**
- `(protected)/` - Route group requiring authentication
- `[id]/` - Dynamic route segment
- `page.tsx` - Page component
- `layout.tsx` - Layout wrapper
- `route.ts` - API route handler

**Component Organization:**
- UI components follow shadcn/ui conventions
- Business logic components grouped by feature
- Shared components in root `components/`

---

## Key Technologies

### Frontend Stack

**Next.js 14**
- App Router for file-based routing
- Server and client components
- Server actions for mutations
- API routes for RESTful endpoints

**React 18**
- Hooks-based component architecture
- Context API for global state
- Suspense for async rendering

**TypeScript**
- Strict type checking enabled
- Full type coverage across codebase
- Prisma-generated types for database

**Tailwind CSS + shadcn/ui**
- Utility-first CSS framework
- Design system with CSS variables
- Pre-built accessible components
- Theme system support

**TipTap Editor**
- Rich text editing with ProseMirror
- Extensible with custom nodes/marks
- Character and word counting
- Code highlighting with lowlight

### Backend Stack

**Prisma ORM**
- Type-safe database queries
- Migration management
- Connection pooling
- Query optimization

**PostgreSQL 16**
- Relational database
- JSONB for flexible schemas
- Full-text search capabilities
- ACID transactions

**NextAuth.js**
- Authentication framework
- OAuth provider support (Google, GitHub, Microsoft)
- Session management
- JWT and database sessions

**Security Libraries**
- `bcryptjs` - Password hashing
- `csrf-csrf` - CSRF protection
- `@upstash/ratelimit` - Rate limiting
- `dompurify` - XSS prevention
- `otplib` - Two-factor authentication

**Email Service**
- Postmark for transactional emails
- Template-based notifications
- Delivery tracking

---

## Development Workflow

### Daily Workflow with Task Master

OpenJournal uses Task Master for project management. Start each session:

```bash
# View current tasks
task-master list

# Get next available task
task-master next

# View task details
task-master show <id>

# Mark task as in-progress
task-master set-status --id=<id> --status=in-progress

# Add implementation notes
task-master update-subtask --id=<id> --prompt="implementation notes"

# Mark task complete
task-master set-status --id=<id> --status=done
```

### Git Workflow

**Branch Naming:**
```
feature/<task-id>-brief-description    # New features
fix/<task-id>-brief-description        # Bug fixes
refactor/<task-id>-brief-description   # Code refactoring
docs/<task-id>-brief-description       # Documentation
```

**Commit Messages:**
```
feat: implement user authentication (task 1.2)
fix: resolve CSRF token validation (task 3.5)
refactor: optimize database queries (task 4.1)
docs: update API documentation (task 5.3)
```

**Pull Request Process:**
1. Create feature branch from main
2. Implement changes with tests
3. Run linting and formatting
4. Create PR with description referencing task
5. Request review from team
6. Address feedback
7. Merge after approval

### Code Review Checklist

- [ ] Type safety: No TypeScript errors
- [ ] Security: Input validation, authorization checks
- [ ] Performance: No N+1 queries, efficient algorithms
- [ ] Testing: Unit tests for business logic
- [ ] Documentation: JSDoc comments for public APIs
- [ ] Accessibility: ARIA attributes, keyboard navigation
- [ ] Error handling: Graceful error messages
- [ ] Code style: Follows ESLint and Prettier rules

### Database Changes

**Creating Migrations:**
```bash
# Create migration after schema changes
pnpm prisma migrate dev --name descriptive_migration_name

# Reset database (development only)
pnpm prisma migrate reset

# Apply migrations (production)
pnpm prisma migrate deploy
```

**Migration Guidelines:**
- Always create migrations for schema changes
- Never edit generated migration files manually
- Test migrations on development database first
- Include rollback strategy for production migrations
- Document breaking changes in migration comments

### Environment Management

**Local Development:**
- Use `.env.local` for local configuration
- Never commit `.env.local` to version control
- Keep `.env.example` updated with required variables

**Staging/Production:**
- Use environment-specific variables
- Rotate secrets regularly
- Use secure secret management (AWS Secrets Manager, Vault)

---

## Testing Strategies

### Unit Testing

**Test File Conventions:**
```
lib/encryption.ts       →  tests/lib/encryption.test.ts
lib/audit-log.ts        →  tests/lib/audit-log.test.ts
```

**Example Test:**
```typescript
import { describe, it, expect } from 'vitest';
import { encrypt, decrypt } from '@/lib/encryption';

describe('Encryption', () => {
  it('should encrypt and decrypt text correctly', () => {
    const plaintext = 'sensitive data';
    const encrypted = encrypt(plaintext);
    const decrypted = decrypt(encrypted);

    expect(decrypted).toBe(plaintext);
    expect(encrypted).not.toBe(plaintext);
  });

  it('should throw error for invalid encrypted data', () => {
    expect(() => decrypt('invalid')).toThrow();
  });
});
```

### Integration Testing

**API Route Testing:**
```typescript
import { NextRequest } from 'next/server';
import { POST } from '@/app/api/entries/route';

describe('POST /api/entries', () => {
  it('should create entry with valid data', async () => {
    const request = new NextRequest('http://localhost:3000/api/entries', {
      method: 'POST',
      body: JSON.stringify({
        title: 'Test Entry',
        content: 'Test content'
      })
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.title).toBe('Test Entry');
  });

  it('should reject unauthenticated requests', async () => {
    const request = new NextRequest('http://localhost:3000/api/entries', {
      method: 'POST'
    });

    const response = await POST(request);
    expect(response.status).toBe(401);
  });
});
```

### End-to-End Testing

Use Playwright for E2E testing:

```bash
# Install Playwright
pnpm add -D @playwright/test

# Run E2E tests
pnpm exec playwright test
```

**Example E2E Test:**
```typescript
import { test, expect } from '@playwright/test';

test('user can create journal entry', async ({ page }) => {
  await page.goto('http://localhost:3000/auth/signin');

  // Sign in
  await page.fill('[name="email"]', 'test@example.com');
  await page.fill('[name="password"]', 'password123');
  await page.click('button[type="submit"]');

  // Create entry
  await page.goto('http://localhost:3000/entries/new');
  await page.fill('[name="title"]', 'My First Entry');
  await page.fill('[contenteditable]', 'This is my first journal entry.');
  await page.click('button:has-text("Save")');

  // Verify creation
  await expect(page.locator('h1')).toContainText('My First Entry');
});
```

### Testing Best Practices

- Write tests alongside code (test-driven development)
- Aim for 80%+ code coverage on business logic
- Mock external dependencies (database, APIs)
- Use factories/fixtures for test data
- Test error cases and edge conditions
- Keep tests fast and independent

---

## Code Style Guidelines

### TypeScript Standards

**Type Definitions:**
```typescript
// Use interfaces for object shapes
interface User {
  id: string;
  name: string;
  email: string;
}

// Use types for unions and primitives
type Status = 'pending' | 'active' | 'inactive';
type ID = string | number;

// Prefer explicit return types for functions
function getUser(id: string): Promise<User | null> {
  // implementation
}

// Use generics for reusable types
function paginate<T>(items: T[], page: number): T[] {
  // implementation
}
```

**Avoid:**
- `any` type (use `unknown` if type is truly unknown)
- Type assertions (`as`) unless absolutely necessary
- Non-null assertions (`!`) without null checks

### React/Next.js Conventions

**Component Structure:**
```typescript
'use client'; // Only for client components

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';

interface EntryCardProps {
  entry: {
    id: string;
    title: string;
    content: string;
  };
  onDelete?: (id: string) => void;
}

export function EntryCard({ entry, onDelete }: EntryCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    await onDelete?.(entry.id);
    setIsDeleting(false);
  };

  return (
    <div className="rounded-lg border p-4">
      <h3 className="text-lg font-semibold">{entry.title}</h3>
      <p className="mt-2 text-muted-foreground">{entry.content}</p>
      {onDelete && (
        <Button
          variant="destructive"
          size="sm"
          onClick={handleDelete}
          disabled={isDeleting}
        >
          Delete
        </Button>
      )}
    </div>
  );
}
```

**Server Component Example:**
```typescript
// app/entries/page.tsx
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { EntryCard } from '@/components/entry-card';

export default async function EntriesPage() {
  const session = await getServerSession(authOptions);

  const entries = await prisma.entry.findMany({
    where: { userId: session!.user.id },
    orderBy: { createdAt: 'desc' }
  });

  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-bold">My Entries</h1>
      <div className="grid gap-4">
        {entries.map(entry => (
          <EntryCard key={entry.id} entry={entry} />
        ))}
      </div>
    </div>
  );
}
```

### Naming Conventions

**Files and Directories:**
- Components: `PascalCase.tsx` (e.g., `EntryCard.tsx`)
- Utilities: `kebab-case.ts` (e.g., `audit-log.ts`)
- API routes: `route.ts`
- Pages: `page.tsx`

**Variables and Functions:**
- Variables: `camelCase` (e.g., `userName`, `isLoading`)
- Functions: `camelCase` (e.g., `getUserData`, `handleSubmit`)
- Components: `PascalCase` (e.g., `EntryCard`, `UserProfile`)
- Constants: `UPPER_SNAKE_CASE` (e.g., `MAX_FILE_SIZE`)

### Formatting

Prettier handles formatting automatically. Key settings:

```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": false,
  "printWidth": 80,
  "tabWidth": 2
}
```

Run formatting:
```bash
pnpm format        # Format all files
pnpm format:check  # Check formatting
```

---

## Security Best Practices

### Input Validation

**Always validate user input:**
```typescript
import { z } from 'zod';

const entrySchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().min(1).max(50000),
  workspaceId: z.string().optional()
});

export async function POST(request: NextRequest) {
  const body = await request.json();

  // Validate input
  const result = entrySchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      { error: 'Invalid input', details: result.error },
      { status: 400 }
    );
  }

  // Proceed with validated data
  const entry = await createEntry(result.data);
  return NextResponse.json(entry);
}
```

### Authentication & Authorization

**Check authentication:**
```typescript
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // User is authenticated
}
```

**Check authorization:**
```typescript
import { hasPermission } from '@/lib/security/rbac';

export async function DELETE(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return unauthorizedResponse();

  const entry = await prisma.entry.findUnique({ where: { id } });

  // Check ownership or admin role
  if (entry.userId !== session.user.id && !hasPermission(session.user, 'ADMIN')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  await prisma.entry.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
```

### XSS Prevention

**Sanitize user-generated HTML:**
```typescript
import DOMPurify from 'isomorphic-dompurify';

// On the server
const sanitizedContent = DOMPurify.sanitize(userContent, {
  ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'ul', 'ol', 'li'],
  ALLOWED_ATTR: ['class']
});

// In React components
<div dangerouslySetInnerHTML={{ __html: sanitizedContent }} />
```

### CSRF Protection

**Apply CSRF tokens to state-changing operations:**
```typescript
import { validateCsrfToken } from '@/lib/security/csrf';

export async function POST(request: NextRequest) {
  // Validate CSRF token
  const isValid = await validateCsrfToken(request);
  if (!isValid) {
    return NextResponse.json({ error: 'Invalid CSRF token' }, { status: 403 });
  }

  // Proceed with request
}
```

### Rate Limiting

**Apply rate limits to sensitive endpoints:**
```typescript
import { rateLimit } from '@/lib/security/rate-limit';

export async function POST(request: NextRequest) {
  // Check rate limit
  const rateLimitResult = await rateLimit('auth', request);
  if (!rateLimitResult.success) {
    return NextResponse.json(
      { error: 'Too many requests' },
      { status: 429 }
    );
  }

  // Proceed with request
}
```

### Encryption

**Encrypt sensitive data at rest:**
```typescript
import { encrypt, decrypt } from '@/lib/file-encryption';

// Encrypt file before storage
const encryptedData = encrypt(fileBuffer, 'encryption-key');
await prisma.attachment.create({
  data: {
    filename,
    data: encryptedData,
    userId: session.user.id
  }
});

// Decrypt when serving
const attachment = await prisma.attachment.findUnique({ where: { id } });
const decryptedData = decrypt(attachment.data, 'encryption-key');
```

---

## Contributing Guidelines

### Code Contribution Process

1. **Check existing issues** - Search for related issues or feature requests
2. **Create issue** - Describe the feature/bug with clear acceptance criteria
3. **Discuss approach** - Get feedback from maintainers before major work
4. **Create branch** - Branch from `main` using naming conventions
5. **Implement** - Write code following style guidelines and tests
6. **Test thoroughly** - Run all tests and manual testing
7. **Submit PR** - Create PR with clear description and screenshots
8. **Address feedback** - Respond to review comments promptly
9. **Merge** - Maintainer merges after approval

### Pull Request Template

```markdown
## Description
Brief description of changes

## Related Issue
Closes #<issue-number>

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] Manual testing performed

## Screenshots (if applicable)
[Add screenshots here]

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex logic
- [ ] Documentation updated
- [ ] No new warnings generated
- [ ] Tests pass locally
```

### Code Review Guidelines

**As a reviewer:**
- Focus on logic, security, and architecture
- Provide constructive feedback with examples
- Approve quickly for minor changes
- Request changes for issues that must be addressed

**As an author:**
- Keep PRs focused and reasonably sized (< 500 lines)
- Respond to all comments
- Don't take feedback personally
- Ask questions if feedback is unclear

---

## Deployment Process

### Production Deployment

**Pre-deployment Checklist:**
- [ ] All tests passing
- [ ] Environment variables configured
- [ ] Database migrations tested
- [ ] Security headers configured
- [ ] Rate limiting enabled
- [ ] Error monitoring configured
- [ ] Backup strategy in place

**Deployment Steps:**

1. **Build application**
```bash
pnpm build
```

2. **Run database migrations**
```bash
pnpm prisma migrate deploy
```

3. **Start production server**
```bash
pnpm start
```

### Environment Variables

**Required for production:**
```env
DATABASE_URL=<production-postgresql-url>
NEXTAUTH_SECRET=<strong-secret>
NEXTAUTH_URL=<production-url>
CSRF_SECRET=<strong-secret>
ENCRYPTION_KEY=<strong-key>
ENCRYPTION_SECRET=<strong-secret>
UPSTASH_REDIS_REST_URL=<redis-url>
UPSTASH_REDIS_REST_TOKEN=<redis-token>
```

### Monitoring

**Application Monitoring:**
- Use Sentry or similar for error tracking
- Configure logs aggregation (CloudWatch, Datadog)
- Set up uptime monitoring (Pingdom, UptimeRobot)
- Monitor database performance

**Key Metrics:**
- Response times (API routes)
- Error rates
- Database query performance
- Authentication success/failure rates
- Rate limit violations

---

## Troubleshooting

### Common Issues

**Problem: Prisma client out of sync**
```bash
# Regenerate Prisma client
pnpm prisma generate
```

**Problem: Database migration conflicts**
```bash
# Reset database (development only)
pnpm prisma migrate reset

# Or manually resolve migration state
pnpm prisma migrate resolve --applied <migration-name>
```

**Problem: TypeScript errors after dependency update**
```bash
# Clear Next.js cache
rm -rf .next

# Reinstall dependencies
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

**Problem: Environment variables not loading**
- Check file name is exactly `.env.local`
- Restart development server after changes
- Verify variables don't contain quotes (unless needed)

**Problem: Authentication not working**
- Verify `NEXTAUTH_SECRET` is set
- Check `NEXTAUTH_URL` matches your domain
- Clear browser cookies and retry
- Check database session table exists

**Problem: File upload fails**
- Verify `ENCRYPTION_KEY` and `ENCRYPTION_SECRET` are set
- Check `MAX_FILE_SIZE_MB` configuration
- Ensure PostgreSQL has sufficient storage
- Verify file type is allowed

### Debugging Tips

**Enable debug logging:**
```typescript
// In development
console.log('[DEBUG]', { data, context });

// Use debug library for conditional logging
import debug from 'debug';
const log = debug('app:api:entries');
log('Creating entry', { title, userId });
```

**Inspect database queries:**
```typescript
// Enable Prisma query logging
const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error']
});
```

**Test API routes directly:**
```bash
# Using curl
curl -X POST http://localhost:3000/api/entries \
  -H "Content-Type: application/json" \
  -d '{"title":"Test","content":"Test content"}'

# Using httpie
http POST localhost:3000/api/entries title="Test" content="Test content"
```

### Getting Help

**Resources:**
- Documentation in `docs/` directory
- Task Master: `task-master list` for current tasks
- GitHub issues for bug reports
- Team chat for questions

**Before asking for help:**
1. Check existing documentation
2. Search closed issues on GitHub
3. Review error messages and stack traces
4. Try minimal reproduction of the issue
5. Document steps taken so far

---

## Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [NextAuth.js Documentation](https://next-auth.js.org)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [shadcn/ui Components](https://ui.shadcn.com)
- [TipTap Editor](https://tiptap.dev)

---

**Welcome to the team! If you have questions, don't hesitate to ask.**
