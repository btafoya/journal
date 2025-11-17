# OpenJournal

OpenJournal is an open-source, feature-rich journaling application designed to serve both personal and business documentation needs with enterprise-grade security and flexibility.

## Features

### 📝 Core Journaling
- **Rich Text Editor**: Powered by TipTap with full formatting support
- **Entry Management**: Create, edit, delete, and organize journal entries
- **Templates**: Pre-built entry templates for different use cases
- **Tags & Categories**: Organize entries with customizable tags
- **Advanced Search**: Full-text search with fuzzy matching and suggestions
- **Attachments**: Upload and attach files to entries with encryption

### 🎨 Customization
- **Theme System**: Install and customize themes with Tailwind CSS variables
- **Plugin Architecture**: Extend functionality with custom plugins
- **Workspace Management**: Multiple workspaces for different contexts
- **User Preferences**: Customizable settings and preferences

### 🔒 Security & Privacy
- **End-to-End Encryption**: Files encrypted at rest with AES-256-GCM
- **Two-Factor Authentication**: TOTP-based 2FA with backup codes
- **Role-Based Access Control**: Granular permissions system
- **Security Headers**: Comprehensive HTTP security headers and CSP
- **CSRF Protection**: Double-submit cookie CSRF protection
- **Rate Limiting**: Tiered rate limiting to prevent abuse
- **XSS Prevention**: DOMPurify sanitization for user-generated content
- **Audit Logging**: Complete audit trail for all sensitive operations

### 👥 Collaboration
- **Comments System**: Add comments to entries for team collaboration
- **User Mentions**: Mention other users in comments
- **Notifications**: Real-time notifications for mentions and updates
- **Role Management**: Admin, User, and custom role support

### 📊 Advanced Features
- **Version Control**: Track changes to entries with version history
- **Import/Export**: Import/export entries in various formats
- **MCP Server Integration**: Model Context Protocol server support
- **OAuth Authentication**: Google, GitHub, Microsoft OAuth support
- **Email Notifications**: Postmark integration for email delivery

### 🛠️ Developer Features
- **Plugin System**: Comprehensive plugin API with lifecycle hooks
- **Theme Marketplace**: Share and distribute custom themes
- **REST API**: Full-featured API for third-party integrations
- **TypeScript**: Fully typed codebase for better DX
- **Prisma ORM**: Type-safe database queries

## Tech Stack

- **Frontend**: Next.js 14 with TypeScript, Tailwind CSS, and shadcn/ui
- **Backend**: Next.js 14 API Routes
- **Database**: PostgreSQL 16
- **ORM**: Prisma
- **Styling**: Tailwind CSS with shadcn/ui components
- **Code Quality**: ESLint, Prettier, TypeScript

## Prerequisites

- Node.js 18+ (LTS recommended)
- pnpm 8+
- Docker and Docker Compose
- Git

## Getting Started

### 1. Clone the Repository

```bash
git clone <repository-url>
cd journal
```

### 2. Install Dependencies

```bash
pnpm install
```

### 3. Start PostgreSQL Database

```bash
docker compose up -d
```

This will start a PostgreSQL instance on port 5433.

### 4. Set Up Environment Variables

Copy the example environment file:

```bash
cp .env.example .env.local
```

The default `.env.local` is configured for local development.

**For OAuth authentication providers** (Google, GitHub, Microsoft):

- See [OAuth Setup Guide](docs/OAUTH_SETUP.md) for detailed instructions on configuring OAuth providers

### 5. Initialize Prisma

```bash
pnpm prisma generate
```

### 6. Run Database Migrations

```bash
pnpm prisma migrate dev
```

### 7. Start the Development Server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the application.

## Available Scripts

- `pnpm dev` - Start the development server
- `pnpm build` - Build the production application
- `pnpm start` - Start the production server
- `pnpm lint` - Run ESLint
- `pnpm format` - Format code with Prettier
- `pnpm format:check` - Check code formatting

## Project Structure

```
journal/
├── app/                    # Next.js 14 app directory
│   ├── layout.tsx          # Root layout
│   └── page.tsx            # Home page
├── components/             # React components
├── lib/                    # Utility functions
├── prisma/                 # Prisma schema and migrations
├── public/                 # Static assets
├── .taskmaster/            # Task Master configuration
├── docker-compose.yml      # PostgreSQL Docker setup
├── .env.local              # Environment variables (local)
├── .prettierrc             # Prettier configuration
├── .eslintrc.json          # ESLint configuration
├── tailwind.config.ts      # Tailwind CSS configuration
└── tsconfig.json           # TypeScript configuration
```

## Documentation

Comprehensive documentation is available in the `docs/` directory:

- **[Security Guide](docs/SECURITY.md)** - Security features, best practices, and audit results
- **[OAuth Setup](docs/OAUTH_SETUP.md)** - Configure Google, GitHub, and Microsoft OAuth
- **[Plugin Development](docs/PLUGIN_DEVELOPMENT.md)** - Create custom plugins
- **[Plugin API Reference](docs/PLUGIN_API.md)** - Complete plugin API documentation
- **[User Guide](docs/USER_GUIDE.md)** - End-user documentation and features
- **[Developer Guide](docs/DEVELOPER_GUIDE.md)** - Developer onboarding and architecture
- **[API Documentation](docs/API_DOCUMENTATION.md)** - REST API reference
- **[Deployment Guide](docs/DEPLOYMENT_GUIDE.md)** - Production deployment instructions

## Development Workflow

### Using Task Master

This project uses Task Master for task tracking and workflow management:

```bash
# View all tasks
task-master list

# Get next available task
task-master next

# View task details
task-master show <id>

# Mark task as in-progress
task-master set-status --id=<id> --status=in-progress

# Mark task as complete
task-master set-status --id=<id> --status=done
```

For detailed development workflows, see the [Developer Guide](docs/DEVELOPER_GUIDE.md).

## Security

OpenJournal implements enterprise-grade security features:

- 🔒 **File Encryption**: AES-256-GCM encryption for all uploaded files
- 🔐 **Two-Factor Authentication**: TOTP-based 2FA with backup codes
- 🛡️ **Security Headers**: Comprehensive HTTP security headers and CSP
- 🚫 **CSRF Protection**: Double-submit cookie pattern for all state-changing operations
- ⚡ **Rate Limiting**: Tiered rate limiting (auth, API, read operations)
- 🧹 **XSS Prevention**: DOMPurify sanitization for user-generated HTML
- 📝 **Audit Logging**: Complete audit trail for all sensitive operations

**Security Score**: 95/100 (see [Security Guide](docs/SECURITY.md) for details)

For detailed security information, see the [Security Guide](docs/SECURITY.md).

## License

MIT License - see LICENSE file for details

## Contributing

Contributions are welcome! Please read CONTRIBUTING.md for details on our code of conduct and the process for submitting pull requests.
