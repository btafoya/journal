# Production Deployment Guide

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Setup](#environment-setup)
3. [Database Configuration](#database-configuration)
4. [Deployment Options](#deployment-options)
5. [Security Configuration](#security-configuration)
6. [Performance Optimization](#performance-optimization)
7. [Monitoring & Logging](#monitoring--logging)
8. [Backup & Recovery](#backup--recovery)
9. [Scaling Strategies](#scaling-strategies)
10. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Software

- **Node.js**: 18.x or higher (LTS recommended)
- **pnpm**: 8.x or higher
- **PostgreSQL**: 14.x or higher
- **Redis**: 7.x or higher (for session storage and caching)
- **Docker**: 24.x or higher (for containerized deployment)

### Recommended Infrastructure

- **Memory**: Minimum 2GB RAM (4GB+ recommended)
- **CPU**: 2+ cores
- **Storage**: 20GB+ SSD storage
- **Bandwidth**: 100Mbps+ connection

---

## Environment Setup

### Production Environment Variables

Create a `.env.production` file with the following configuration:

```bash
# Application
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://your-domain.com
PORT=3000

# Database
DATABASE_URL=postgresql://user:password@host:5432/journal_production?schema=public

# Authentication
NEXTAUTH_URL=https://your-domain.com
NEXTAUTH_SECRET=your-secure-random-secret-minimum-32-characters

# Email Configuration
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASSWORD=your-sendgrid-api-key
SMTP_FROM=noreply@your-domain.com

# File Storage (AWS S3)
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_S3_BUCKET=journal-attachments-production

# Redis (Session & Cache)
REDIS_URL=redis://default:password@redis-host:6379

# Rate Limiting
RATE_LIMIT_MAX=100
RATE_LIMIT_WINDOW_MS=900000

# Logging
LOG_LEVEL=info
LOG_FILE_PATH=/var/log/journal-app

# Monitoring
SENTRY_DSN=your-sentry-dsn
SENTRY_ENVIRONMENT=production

# Feature Flags
ENABLE_REGISTRATION=true
ENABLE_MCP_SERVER=false
ENABLE_ANALYTICS=true
```

### Security Best Practices

**Generate Secure Secrets:**

```bash
# NEXTAUTH_SECRET (minimum 32 characters)
openssl rand -base64 32

# Database password
openssl rand -base64 24

# Session secret
openssl rand -hex 32
```

**Never commit secrets to version control:**

```bash
# Add to .gitignore
echo ".env.production" >> .gitignore
echo ".env.local" >> .gitignore
echo "*.pem" >> .gitignore
```

---

## Database Configuration

### PostgreSQL Setup

#### Option 1: Managed Database (Recommended)

Use managed PostgreSQL services for production:

- **Vercel Postgres** (seamless integration)
- **AWS RDS PostgreSQL**
- **DigitalOcean Managed Database**
- **Supabase** (includes auth features)
- **Neon** (serverless PostgreSQL)

#### Option 2: Self-Hosted PostgreSQL

**Installation (Ubuntu/Debian):**

```bash
# Install PostgreSQL
sudo apt update
sudo apt install postgresql postgresql-contrib

# Start service
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Create production database
sudo -u postgres psql << EOF
CREATE DATABASE journal_production;
CREATE USER journal_user WITH PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE journal_production TO journal_user;
ALTER DATABASE journal_production OWNER TO journal_user;
\q
EOF
```

**PostgreSQL Configuration (`/etc/postgresql/14/main/postgresql.conf`):**

```conf
# Performance tuning
max_connections = 200
shared_buffers = 256MB
effective_cache_size = 1GB
maintenance_work_mem = 64MB
work_mem = 4MB

# Write-ahead log
wal_buffers = 16MB
checkpoint_completion_target = 0.9

# Security
ssl = on
ssl_cert_file = '/etc/ssl/certs/server.crt'
ssl_key_file = '/etc/ssl/private/server.key'
```

**Connection Pooling with PgBouncer:**

```bash
# Install PgBouncer
sudo apt install pgbouncer

# Configure /etc/pgbouncer/pgbouncer.ini
[databases]
journal_production = host=localhost port=5432 dbname=journal_production

[pgbouncer]
listen_addr = 127.0.0.1
listen_port = 6432
auth_type = md5
auth_file = /etc/pgbouncer/userlist.txt
pool_mode = transaction
max_client_conn = 1000
default_pool_size = 25
```

### Database Migrations

**Run migrations in production:**

```bash
# Set production database URL
export DATABASE_URL="postgresql://user:password@host:5432/journal_production"

# Generate Prisma client
pnpm prisma generate

# Run migrations
pnpm prisma migrate deploy

# Verify migration status
pnpm prisma migrate status
```

**Migration rollback strategy:**

```bash
# Backup before migration
pg_dump -U journal_user journal_production > backup_pre_migration.sql

# If migration fails, restore
psql -U journal_user journal_production < backup_pre_migration.sql
```

---

## Deployment Options

### Option 1: Vercel Deployment (Recommended for Next.js)

#### Prerequisites

```bash
# Install Vercel CLI
pnpm add -g vercel

# Login to Vercel
vercel login
```

#### Deployment Steps

```bash
# Build and deploy
vercel --prod

# Configure environment variables in Vercel dashboard
# Settings -> Environment Variables
```

#### Vercel Configuration (`vercel.json`)

```json
{
  "buildCommand": "pnpm prisma generate && pnpm build",
  "outputDirectory": ".next",
  "devCommand": "pnpm dev",
  "installCommand": "pnpm install",
  "framework": "nextjs",
  "regions": ["iad1"],
  "env": {
    "DATABASE_URL": "@database_url",
    "NEXTAUTH_SECRET": "@nextauth_secret",
    "NEXTAUTH_URL": "@nextauth_url"
  },
  "functions": {
    "app/api/**": {
      "maxDuration": 30
    }
  },
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "Referrer-Policy",
          "value": "strict-origin-when-cross-origin"
        }
      ]
    }
  ]
}
```

#### Database Setup with Vercel Postgres

```bash
# Create Vercel Postgres database
vercel postgres create

# Link to project
vercel link

# Pull environment variables
vercel env pull .env.local
```

---

### Option 2: Docker Deployment

#### Dockerfile

Create `Dockerfile` in project root:

```dockerfile
# Build stage
FROM node:18-alpine AS builder

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml ./
COPY prisma ./prisma/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Generate Prisma client
RUN pnpm prisma generate

# Build application
RUN pnpm build

# Production stage
FROM node:18-alpine AS runner

WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy necessary files from builder
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

# Set ownership
RUN chown -R nextjs:nodejs /app

USER nextjs

EXPOSE 3000

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
```

#### Docker Compose Configuration

Create `docker-compose.production.yml`:

```yaml
version: '3.8'

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=${DATABASE_URL}
      - NEXTAUTH_URL=${NEXTAUTH_URL}
      - NEXTAUTH_SECRET=${NEXTAUTH_SECRET}
      - REDIS_URL=redis://redis:6379
    depends_on:
      - postgres
      - redis
    restart: unless-stopped
    networks:
      - journal-network

  postgres:
    image: postgres:14-alpine
    environment:
      - POSTGRES_USER=${POSTGRES_USER}
      - POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
      - POSTGRES_DB=${POSTGRES_DB}
    volumes:
      - postgres-data:/var/lib/postgresql/data
      - ./backups:/backups
    ports:
      - "5432:5432"
    restart: unless-stopped
    networks:
      - journal-network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER}"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    command: redis-server --requirepass ${REDIS_PASSWORD}
    volumes:
      - redis-data:/data
    ports:
      - "6379:6379"
    restart: unless-stopped
    networks:
      - journal-network
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 3s
      retries: 5

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./ssl:/etc/nginx/ssl:ro
    depends_on:
      - app
    restart: unless-stopped
    networks:
      - journal-network

volumes:
  postgres-data:
  redis-data:

networks:
  journal-network:
    driver: bridge
```

#### Nginx Configuration

Create `nginx.conf`:

```nginx
events {
    worker_connections 1024;
}

http {
    upstream app {
        server app:3000;
    }

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=general:10m rate=30r/s;

    # Cache settings
    proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=my_cache:10m max_size=1g
                     inactive=60m use_temp_path=off;

    server {
        listen 80;
        server_name your-domain.com;

        # Redirect to HTTPS
        return 301 https://$server_name$request_uri;
    }

    server {
        listen 443 ssl http2;
        server_name your-domain.com;

        # SSL Configuration
        ssl_certificate /etc/nginx/ssl/cert.pem;
        ssl_certificate_key /etc/nginx/ssl/key.pem;
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers HIGH:!aNULL:!MD5;
        ssl_prefer_server_ciphers on;

        # Security headers
        add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
        add_header X-Frame-Options "DENY" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header X-XSS-Protection "1; mode=block" always;

        # Compression
        gzip on;
        gzip_vary on;
        gzip_proxied any;
        gzip_comp_level 6;
        gzip_types text/plain text/css text/xml text/javascript
                   application/json application/javascript application/xml+rss;

        # Static files caching
        location /_next/static {
            proxy_pass http://app;
            proxy_cache my_cache;
            proxy_cache_valid 200 365d;
            add_header Cache-Control "public, immutable";
        }

        # API rate limiting
        location /api {
            limit_req zone=api burst=20 nodelay;
            proxy_pass http://app;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_cache_bypass $http_upgrade;
        }

        # General application
        location / {
            limit_req zone=general burst=50 nodelay;
            proxy_pass http://app;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_cache_bypass $http_upgrade;
        }
    }
}
```

#### Deploy with Docker

```bash
# Build and start services
docker-compose -f docker-compose.production.yml up -d --build

# Run migrations
docker-compose exec app pnpm prisma migrate deploy

# View logs
docker-compose logs -f app

# Stop services
docker-compose -f docker-compose.production.yml down
```

---

### Option 3: VPS Deployment (Ubuntu Server)

#### Server Setup

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install pnpm
npm install -g pnpm

# Install PostgreSQL and Redis
sudo apt install -y postgresql postgresql-contrib redis-server

# Install Nginx
sudo apt install -y nginx

# Install PM2 for process management
pnpm add -g pm2
```

#### Application Deployment

```bash
# Clone repository
cd /var/www
git clone https://github.com/your-org/journal-app.git
cd journal-app

# Install dependencies
pnpm install --frozen-lockfile

# Setup environment
cp .env.example .env.production
nano .env.production  # Configure production variables

# Generate Prisma client
pnpm prisma generate

# Build application
pnpm build

# Run migrations
pnpm prisma migrate deploy

# Start with PM2
pm2 start pnpm --name "journal-app" -- start
pm2 save
pm2 startup
```

#### PM2 Configuration

Create `ecosystem.config.js`:

```javascript
module.exports = {
  apps: [{
    name: 'journal-app',
    script: 'pnpm',
    args: 'start',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: '/var/log/journal-app/error.log',
    out_file: '/var/log/journal-app/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    max_memory_restart: '1G',
    autorestart: true,
    watch: false
  }]
};
```

Start with ecosystem config:

```bash
pm2 start ecosystem.config.js
pm2 save
```

---

## Security Configuration

### SSL/TLS Certificates

#### Option 1: Let's Encrypt (Free)

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Obtain certificate
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# Auto-renewal (already configured by default)
sudo systemctl status certbot.timer
```

#### Option 2: Custom Certificate

```bash
# Generate self-signed certificate (development only)
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout /etc/ssl/private/nginx-selfsigned.key \
  -out /etc/ssl/certs/nginx-selfsigned.crt
```

### Firewall Configuration

```bash
# Enable UFW firewall
sudo ufw enable

# Allow SSH
sudo ufw allow 22/tcp

# Allow HTTP and HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Deny PostgreSQL from external access
sudo ufw deny 5432/tcp

# Check status
sudo ufw status verbose
```

### Application Security Headers

Add to `next.config.js`:

```javascript
const securityHeaders = [
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'on'
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload'
  },
  {
    key: 'X-Frame-Options',
    value: 'DENY'
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff'
  },
  {
    key: 'X-XSS-Protection',
    value: '1; mode=block'
  },
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin'
  },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=()'
  }
];

module.exports = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ];
  },
};
```

---

## Performance Optimization

### Next.js Configuration

Update `next.config.js`:

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,

  // Enable standalone output for Docker
  output: 'standalone',

  // Image optimization
  images: {
    domains: ['your-cdn-domain.com'],
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 31536000,
  },

  // Compression
  compress: true,

  // Performance monitoring
  experimental: {
    optimizeCss: true,
    optimizePackageImports: ['lucide-react', '@radix-ui/*'],
  },

  // Headers for caching
  async headers() {
    return [
      {
        source: '/assets/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
```

### Database Query Optimization

```typescript
// Use connection pooling
import { PrismaClient } from '@prisma/client';

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma || new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
```

### Redis Caching Strategy

```typescript
// lib/cache.ts
import { createClient } from 'redis';

const client = createClient({
  url: process.env.REDIS_URL,
});

client.on('error', (err) => console.error('Redis Client Error', err));

await client.connect();

export async function getCached<T>(key: string, fetchFn: () => Promise<T>, ttl = 3600): Promise<T> {
  const cached = await client.get(key);

  if (cached) {
    return JSON.parse(cached);
  }

  const data = await fetchFn();
  await client.setEx(key, ttl, JSON.stringify(data));

  return data;
}

export const cache = client;
```

### CDN Configuration

For static assets, use a CDN:

- **Vercel Edge Network** (automatic with Vercel)
- **Cloudflare CDN**
- **AWS CloudFront**
- **Fastly**

---

## Monitoring & Logging

### Application Monitoring with Sentry

```bash
# Install Sentry
pnpm add @sentry/nextjs
```

Initialize Sentry (`sentry.client.config.ts`):

```typescript
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
  beforeSend(event, hint) {
    // Filter sensitive data
    if (event.request?.cookies) {
      delete event.request.cookies;
    }
    return event;
  },
});
```

### Logging with Winston

```typescript
// lib/logger.ts
import winston from 'winston';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({
      filename: '/var/log/journal-app/error.log',
      level: 'error'
    }),
    new winston.transports.File({
      filename: '/var/log/journal-app/combined.log'
    }),
  ],
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple(),
  }));
}

export default logger;
```

### Health Check Endpoint

Create `app/api/health/route.ts`:

```typescript
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cache } from '@/lib/cache';

export async function GET() {
  try {
    // Check database
    await prisma.$queryRaw`SELECT 1`;

    // Check Redis
    await cache.ping();

    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        database: 'up',
        cache: 'up',
      }
    });
  } catch (error) {
    return NextResponse.json({
      status: 'unhealthy',
      error: error.message,
    }, { status: 503 });
  }
}
```

### Uptime Monitoring

Setup external monitoring with:

- **UptimeRobot** (free tier available)
- **Pingdom**
- **Better Uptime**
- **StatusCake**

Monitor these endpoints:

- `https://your-domain.com/api/health` (every 5 minutes)
- `https://your-domain.com` (every 10 minutes)

---

## Backup & Recovery

### Automated Database Backups

Create backup script (`scripts/backup-db.sh`):

```bash
#!/bin/bash

# Configuration
BACKUP_DIR="/backups/postgres"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
DATABASE="journal_production"
RETENTION_DAYS=30

# Create backup directory
mkdir -p $BACKUP_DIR

# Perform backup
pg_dump -U journal_user -h localhost $DATABASE | gzip > "$BACKUP_DIR/backup_$TIMESTAMP.sql.gz"

# Upload to S3 (optional)
aws s3 cp "$BACKUP_DIR/backup_$TIMESTAMP.sql.gz" s3://your-backup-bucket/postgres/

# Remove old backups
find $BACKUP_DIR -name "backup_*.sql.gz" -mtime +$RETENTION_DAYS -delete

echo "Backup completed: backup_$TIMESTAMP.sql.gz"
```

Schedule with cron:

```bash
# Run daily at 2 AM
0 2 * * * /var/www/journal-app/scripts/backup-db.sh >> /var/log/backup.log 2>&1
```

### Restore from Backup

```bash
# Decompress and restore
gunzip -c backup_20250117_020000.sql.gz | psql -U journal_user journal_production

# Or restore from S3
aws s3 cp s3://your-backup-bucket/postgres/backup_20250117_020000.sql.gz - | \
  gunzip | psql -U journal_user journal_production
```

### File Attachments Backup

```bash
#!/bin/bash

# Sync S3 bucket to backup location
aws s3 sync s3://journal-attachments-production s3://journal-attachments-backup

# Or backup locally
aws s3 sync s3://journal-attachments-production /backups/attachments
```

---

## Scaling Strategies

### Horizontal Scaling

#### Load Balancer Configuration

Use a load balancer (AWS ALB, DigitalOcean Load Balancer, or Nginx):

```nginx
upstream journal_app {
    least_conn;
    server app1.internal:3000 max_fails=3 fail_timeout=30s;
    server app2.internal:3000 max_fails=3 fail_timeout=30s;
    server app3.internal:3000 max_fails=3 fail_timeout=30s;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;

    location / {
        proxy_pass http://journal_app;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header Host $host;
    }
}
```

### Vertical Scaling

Increase resources per instance:

- **Memory**: Increase Node.js heap size
- **CPU**: Add more cores for PM2 cluster mode
- **Database**: Upgrade PostgreSQL instance class

```bash
# Increase Node.js memory
NODE_OPTIONS="--max-old-space-size=4096" pnpm start

# PM2 cluster mode
pm2 start ecosystem.config.js --instances max
```

### Database Scaling

#### Read Replicas

Configure read replicas in Prisma:

```typescript
// prisma/schema.prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// In application code
const readPrisma = new PrismaClient({
  datasources: {
    db: { url: process.env.DATABASE_READ_REPLICA_URL }
  }
});

// Use for read operations
const entries = await readPrisma.entry.findMany();
```

#### Connection Pooling

Use PgBouncer or built-in Prisma pooling:

```env
# Use connection pooling
DATABASE_URL="postgresql://user:pass@host:6432/db?pgbouncer=true"
```

### CDN for Static Assets

Configure Next.js to use CDN:

```javascript
// next.config.js
module.exports = {
  assetPrefix: process.env.NODE_ENV === 'production'
    ? 'https://cdn.your-domain.com'
    : undefined,
};
```

---

## Troubleshooting

### Common Issues

#### Issue: Database Connection Errors

```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Check connection
psql -U journal_user -h localhost -d journal_production

# Review logs
sudo tail -f /var/log/postgresql/postgresql-14-main.log
```

#### Issue: High Memory Usage

```bash
# Check Node.js memory
pm2 monit

# Increase heap size
NODE_OPTIONS="--max-old-space-size=2048" pm2 restart journal-app
```

#### Issue: Slow Query Performance

```sql
-- Enable query logging
ALTER SYSTEM SET log_min_duration_statement = 1000;

-- Check slow queries
SELECT query, calls, total_time, mean_time
FROM pg_stat_statements
ORDER BY total_time DESC
LIMIT 10;

-- Create missing indexes
CREATE INDEX idx_entries_user_created ON entries(user_id, created_at DESC);
```

#### Issue: SSL Certificate Renewal

```bash
# Renew Let's Encrypt certificate
sudo certbot renew --dry-run
sudo certbot renew

# Restart Nginx
sudo systemctl restart nginx
```

### Debug Mode

Enable debug logging temporarily:

```bash
# Set environment variable
export DEBUG=*
export LOG_LEVEL=debug

# Restart application
pm2 restart journal-app
```

### Performance Profiling

```bash
# Enable Node.js profiling
node --prof server.js

# Generate readable output
node --prof-process isolate-*.log > processed.txt
```

---

## Deployment Checklist

### Pre-Deployment

- [ ] Update all dependencies to stable versions
- [ ] Run full test suite (`pnpm test`)
- [ ] Test build locally (`pnpm build`)
- [ ] Review and update environment variables
- [ ] Backup current production database
- [ ] Generate and test database migrations
- [ ] Review security headers and configurations
- [ ] Update documentation with any changes

### Deployment

- [ ] Deploy to staging environment first
- [ ] Run smoke tests on staging
- [ ] Monitor staging for 24-48 hours
- [ ] Schedule deployment during low-traffic period
- [ ] Deploy to production
- [ ] Run database migrations
- [ ] Verify health check endpoint
- [ ] Monitor error rates and performance

### Post-Deployment

- [ ] Verify critical user flows
- [ ] Check application logs for errors
- [ ] Monitor database performance
- [ ] Verify email delivery
- [ ] Test file upload functionality
- [ ] Review monitoring dashboards
- [ ] Update status page if applicable
- [ ] Notify team of successful deployment

---

## Support & Maintenance

### Regular Maintenance Tasks

**Daily:**
- Monitor error logs and alerts
- Review application performance metrics
- Check backup completion

**Weekly:**
- Review slow database queries
- Update dependencies (security patches)
- Review user feedback and issues

**Monthly:**
- Full security audit
- Database optimization and vacuuming
- Review and optimize storage usage
- Capacity planning review

### Emergency Contacts

Document emergency procedures:

```markdown
## Emergency Response

1. **Database Failure**: Restore from latest backup
2. **Application Crash**: PM2 auto-restart + investigate logs
3. **Security Breach**: Rotate secrets, force logout, investigate
4. **DDoS Attack**: Enable Cloudflare DDoS protection

Contact: devops@your-domain.com
On-call: +1-XXX-XXX-XXXX
```

---

## Additional Resources

- [Next.js Production Checklist](https://nextjs.org/docs/going-to-production)
- [Prisma Production Best Practices](https://www.prisma.io/docs/guides/performance-and-optimization)
- [PostgreSQL Performance Tuning](https://wiki.postgresql.org/wiki/Performance_Optimization)
- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)

---

**Last Updated:** 2025-01-17
**Version:** 1.0.0
