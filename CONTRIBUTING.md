# Contributing to OpenJournal

Thank you for your interest in contributing to OpenJournal! This document provides guidelines and instructions for contributing.

## Code of Conduct

### Our Pledge

We are committed to providing a welcoming and inclusive environment for all contributors, regardless of experience level, gender identity, sexual orientation, disability, personal appearance, body size, race, ethnicity, age, religion, or nationality.

### Our Standards

**Positive behaviors**:
- Using welcoming and inclusive language
- Being respectful of differing viewpoints and experiences
- Gracefully accepting constructive criticism
- Focusing on what is best for the community
- Showing empathy towards other community members

**Unacceptable behaviors**:
- Use of sexualized language or imagery
- Trolling, insulting/derogatory comments, and personal or political attacks
- Public or private harassment
- Publishing others' private information without explicit permission
- Other conduct which could reasonably be considered inappropriate

## How to Contribute

### Reporting Bugs

Before creating bug reports, please check the existing issues to avoid duplicates. When creating a bug report, include:

- **Clear title**: Descriptive summary of the issue
- **Description**: Detailed explanation of the problem
- **Steps to Reproduce**: Step-by-step instructions to reproduce the behavior
- **Expected Behavior**: What you expected to happen
- **Actual Behavior**: What actually happened
- **Screenshots**: If applicable
- **Environment**: OS, Node.js version, browser, etc.
- **Additional Context**: Any other relevant information

**Bug Report Template**:
```markdown
**Description**
A clear description of the bug.

**To Reproduce**
1. Go to '...'
2. Click on '...'
3. See error

**Expected Behavior**
What should happen.

**Screenshots**
If applicable, add screenshots.

**Environment**
- OS: [e.g., macOS 14.0]
- Node.js: [e.g., 18.17.0]
- Browser: [e.g., Chrome 119]
- OpenJournal Version: [e.g., 1.0.0]

**Additional Context**
Any other context about the problem.
```

### Suggesting Features

Feature suggestions are welcome! Please:

1. Check if the feature has already been suggested
2. Provide a clear and detailed explanation
3. Explain why this feature would be useful
4. Include examples of how it would work

**Feature Request Template**:
```markdown
**Feature Description**
A clear description of the feature.

**Problem It Solves**
What problem does this feature address?

**Proposed Solution**
How should this feature work?

**Alternatives Considered**
Other solutions you've considered.

**Additional Context**
Screenshots, mockups, or examples.
```

### Pull Requests

1. **Fork the Repository**
   ```bash
   git clone https://github.com/btafoya/journal.git
   cd journal
   ```

2. **Create a Branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

   Branch naming conventions:
   - `feature/` - New features
   - `fix/` - Bug fixes
   - `docs/` - Documentation changes
   - `refactor/` - Code refactoring
   - `test/` - Adding or updating tests
   - `chore/` - Maintenance tasks

3. **Make Your Changes**
   - Follow the code style guidelines (see below)
   - Add tests for new functionality
   - Update documentation as needed
   - Ensure all tests pass

4. **Commit Your Changes**
   ```bash
   git add .
   git commit -m "feat: add amazing feature"
   ```

   Commit message format (Conventional Commits):
   - `feat:` - New feature
   - `fix:` - Bug fix
   - `docs:` - Documentation changes
   - `style:` - Code style changes (formatting, etc.)
   - `refactor:` - Code refactoring
   - `test:` - Adding or updating tests
   - `chore:` - Maintenance tasks

5. **Push to Your Fork**
   ```bash
   git push origin feature/your-feature-name
   ```

6. **Open a Pull Request**
   - Provide a clear title and description
   - Reference any related issues
   - Explain your changes and why they're needed
   - Include screenshots for UI changes

**Pull Request Template**:
```markdown
## Description
Brief description of changes.

## Type of Change
- [ ] Bug fix (non-breaking change fixing an issue)
- [ ] New feature (non-breaking change adding functionality)
- [ ] Breaking change (fix or feature causing existing functionality to change)
- [ ] Documentation update

## Related Issues
Closes #(issue number)

## Testing
- [ ] Tests pass locally
- [ ] New tests added for new functionality
- [ ] All existing tests still pass

## Screenshots (if applicable)
Add screenshots here.

## Checklist
- [ ] Code follows project style guidelines
- [ ] Self-review completed
- [ ] Code commented where necessary
- [ ] Documentation updated
- [ ] No new warnings generated
- [ ] Tests added/updated
```

## Development Guidelines

### Setting Up Development Environment

1. **Prerequisites**
   - Node.js 18+ (LTS recommended)
   - pnpm 8+
   - Docker and Docker Compose
   - Git

2. **Installation**
   ```bash
   # Clone your fork
   git clone https://github.com/btafoya/journal.git
   cd journal

   # Install dependencies
   pnpm install

   # Start PostgreSQL
   docker compose up -d

   # Set up environment
   cp .env.example .env.local

   # Run migrations
   pnpm prisma migrate dev

   # Start dev server
   pnpm dev
   ```

### Code Style Guidelines

#### TypeScript

- Use TypeScript for all new code
- Prefer `interface` over `type` for object shapes
- Use proper typing; avoid `any` unless absolutely necessary
- Use `const` for immutable values, `let` for mutable

**Example**:
```typescript
// Good
interface User {
  id: string;
  name: string;
  email: string;
}

const getUser = async (id: string): Promise<User> => {
  // ...
};

// Bad
type User = any;
const getUser = (id) => {
  // ...
};
```

#### React Components

- Use functional components with hooks
- Use named exports for components
- Destructure props in function signature
- Use PascalCase for component names

**Example**:
```typescript
// Good
export function UserProfile({ user, onUpdate }: UserProfileProps) {
  const [editing, setEditing] = useState(false);

  return (
    <div>
      {/* component JSX */}
    </div>
  );
}

// Bad
export default (props) => {
  return <div>{props.user.name}</div>;
};
```

#### File Naming

- Components: `PascalCase.tsx` (e.g., `UserProfile.tsx`)
- Utilities: `camelCase.ts` (e.g., `formatDate.ts`)
- Hooks: `use*.ts` (e.g., `useAuth.ts`)
- API routes: `route.ts` (Next.js convention)

#### Code Organization

- Keep files focused and under 300 lines
- Extract complex logic into utility functions
- Use custom hooks for reusable logic
- Group related files in directories

### Testing Guidelines

#### Unit Tests

```typescript
import { describe, it, expect } from '@jest/globals';
import { formatDate } from './formatDate';

describe('formatDate', () => {
  it('should format date correctly', () => {
    const date = new Date('2024-01-01');
    expect(formatDate(date)).toBe('January 1, 2024');
  });

  it('should handle invalid dates', () => {
    expect(formatDate(null)).toBe('Invalid Date');
  });
});
```

#### Integration Tests

```typescript
import { describe, it, expect, beforeEach } from '@jest/globals';

describe('POST /api/entries', () => {
  beforeEach(async () => {
    await cleanDatabase();
  });

  it('should create a new entry', async () => {
    const response = await fetch('/api/entries', {
      method: 'POST',
      body: JSON.stringify({ title: 'Test Entry', content: 'Content' }),
    });

    expect(response.status).toBe(201);
  });
});
```

### Security Guidelines

- Never commit secrets or credentials
- Sanitize all user inputs (use DOMPurify for HTML)
- Validate all inputs with Zod schemas
- Use parameterized queries (Prisma handles this)
- Implement proper authentication checks
- Follow OWASP Top 10 guidelines

### Performance Guidelines

- Use React.memo() for expensive components
- Implement proper pagination for large datasets
- Optimize images and assets
- Use lazy loading where appropriate
- Monitor bundle size

### Documentation

- Update relevant documentation when changing features
- Add JSDoc comments for public APIs
- Update API documentation for endpoint changes
- Include examples in documentation

## Review Process

### What We Look For

1. **Code Quality**
   - Follows style guidelines
   - Well-structured and maintainable
   - Properly commented where necessary

2. **Testing**
   - All tests pass
   - New functionality has test coverage
   - Edge cases considered

3. **Documentation**
   - Code is self-documenting
   - Complex logic explained
   - API changes documented

4. **Security**
   - No security vulnerabilities introduced
   - Input validation implemented
   - Authentication/authorization proper

### Review Timeline

- Initial review: Within 1-3 days
- Follow-up reviews: Within 1-2 days
- Merging: After approval from maintainers

## Getting Help

- **Documentation**: Check [docs/](docs/) for guides
- **Discussions**: Ask questions in GitHub Discussions
- **Issues**: Search existing issues first
- **Chat**: Join our community chat (link coming soon)

## Recognition

Contributors are recognized in:
- Project README
- Release notes
- Hall of Fame (coming soon)

Thank you for contributing to OpenJournal! 🎉
