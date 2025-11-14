# OpenJournal

OpenJournal is an open-source, feature-rich journaling application designed to serve both personal and business documentation needs with enterprise-grade security and flexibility.

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

## License

MIT License - see LICENSE file for details

## Contributing

Contributions are welcome! Please read CONTRIBUTING.md for details on our code of conduct and the process for submitting pull requests.
