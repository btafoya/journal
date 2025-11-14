# Product Requirements Document: OpenJournal

**Version:** 1.0
**Date:** 2025-11-14
**Status:** Draft

---

## 1. EXECUTIVE SUMMARY

### 1.1 Product Overview

OpenJournal is an open-source, feature-rich journaling application designed to serve both personal and business documentation needs with enterprise-grade security and flexibility. Built on Next.js 14 and PostgreSQL, OpenJournal combines the intuitive organization of Evernote with robust knowledge management capabilities, offering users a comprehensive solution for capturing, organizing, and retrieving information.

### 1.2 Product Vision

To create the definitive open-source journaling platform that empowers individuals and teams to capture, organize, and leverage their knowledge without compromising security, privacy, or user experience.

### 1.3 Target Market

- **Primary:** Individual users seeking a secure, feature-rich personal journaling solution
- **Secondary:** Small teams requiring collaborative documentation and knowledge management
- **Tertiary:** Open-source communities and self-hosted solution enthusiasts

### 1.4 Key Differentiators

- End-to-end encryption for maximum privacy
- Unlimited version history with complete audit trails
- MCP (Model Context Protocol) server integration for AI-enhanced workflows
- Professional-grade security with personal journaling simplicity
- Flexible workspace separation for personal and business use
- Complete data ownership and portability

---

## 2. CORE OBJECTIVES

### 2.1 Business Goals

- Launch MVP with comprehensive feature set within aggressive timeline
- Build thriving open-source community with plugin and theme ecosystem
- Establish OpenJournal as the leading self-hosted journaling solution
- Enable seamless migration from legacy platforms (Evernote, TrilliumNext)

### 2.2 User Goals

- **Individual Users:**
  - Secure, private space for personal journaling and knowledge capture
  - Rich media support with powerful organization capabilities
  - Fast, intuitive search across all content
  - Data portability and export flexibility

- **Team Users:**
  - Collaborative documentation with granular access controls
  - Workspace separation for different projects or departments
  - Comment and discussion capabilities
  - Audit trails for compliance and accountability

### 2.3 Technical Goals

- High-performance application with fast page loads and responsive search
- Scalable architecture supporting growth from individual to team usage
- Comprehensive security with encryption at rest and in transit
- Self-hosted deployment flexibility with Docker support
- MCP server integration for AI-enhanced workflows

---

## 3. USER PERSONAS

### 3.1 Primary Persona: Sarah - Personal Knowledge Manager

**Demographics:** 32, Software Engineer, Tech-savvy
**Goals:**

- Maintain personal journal with code snippets and technical notes
- Organize knowledge across multiple categories (work, personal, learning)
- Search quickly across years of entries
- Keep data private and under personal control

**Pain Points:**

- Cloud services don't provide adequate privacy
- Vendor lock-in with proprietary formats
- Limited code syntax highlighting in existing tools

### 3.2 Secondary Persona: Michael - Team Lead

**Demographics:** 40, Engineering Manager, Team of 8
**Goals:**

- Document team decisions and technical specifications
- Share knowledge with team members
- Track changes and maintain audit trail for compliance
- Separate personal notes from team documentation

**Pain Points:**

- Need better organization than wiki systems
- Want more privacy than cloud document services
- Lack of granular permission controls
- Insufficient version history in current tools

---

## 4. FUNCTIONAL REQUIREMENTS

### 4.1 Journal Entry Management

#### 4.1.1 Rich Text Editor

- **FR-001:** WYSIWYG editor supporting bold, italic, underline, strikethrough
- **FR-002:** Multiple heading levels (H1-H6) for document structure
- **FR-003:** Bulleted and numbered lists with nesting support
- **FR-004:** Code blocks with syntax highlighting for multiple languages
- **FR-005:** Tables with customizable rows and columns
- **FR-006:** Interactive checklists/to-do items with completion tracking
- **FR-007:** Embedded hyperlinks with preview capability
- **FR-008:** Automatic timestamp insertion and date markers
- **FR-009:** Auto-save functionality to prevent data loss
- **FR-010:** Markdown shortcuts for power users

**Editor Selection:** System will evaluate and select best-fit editor (TipTap, Quill, ProseMirror, or Draft.js) based on feature requirements and Next.js 14 compatibility.

#### 4.1.2 File & Media Attachments

- **FR-011:** Image upload and embedding with preview
- **FR-012:** Document attachment support (PDF, DOCX, XLSX, etc.)
- **FR-013:** Audio file attachment and playback
- **FR-014:** Video file attachment and playback
- **FR-015:** Spreadsheet attachment support
- **FR-016:** Inline preview for supported file types
- **FR-017:** File size limits (configurable per deployment)
- **FR-018:** Encrypted file storage in PostgreSQL

#### 4.1.3 Entry Operations

- **FR-019:** Create new entry with template support
- **FR-020:** Edit existing entries with auto-save
- **FR-021:** Delete entries with confirmation
- **FR-022:** Duplicate entries for templating
- **FR-023:** Entry metadata (created, modified, author, word count)
- **FR-024:** Print-friendly entry view

### 4.2 Organization & Navigation

#### 4.2.1 Category System

- **FR-025:** Unlimited category nesting depth
- **FR-026:** Multiple category assignment per entry
- **FR-027:** Category creation, rename, delete, and reorganization
- **FR-028:** Drag-and-drop category management
- **FR-029:** Category-specific icons and colors
- **FR-030:** Category statistics (entry count, size)

#### 4.2.2 Search & Discovery

- **FR-031:** Full-text search across all entry content
- **FR-032:** Advanced filters: date range, category, author
- **FR-033:** Saved search queries for frequent searches
- **FR-034:** Search history with quick access
- **FR-035:** Fuzzy search for typo tolerance
- **FR-036:** Search results highlighting
- **FR-037:** Sort results by relevance, date, or title
- **FR-038:** Real-time search suggestions

#### 4.2.3 Navigation

- **FR-039:** Sidebar navigation with collapsible categories
- **FR-040:** Dashboard view showing recent entries and statistics
- **FR-041:** Quick access to recently viewed entries
- **FR-042:** Breadcrumb navigation for deep category hierarchies
- **FR-043:** Keyboard shortcuts for common actions

### 4.3 Version Control & History

#### 4.3.1 Version Management

- **FR-044:** Automatic version creation on entry save
- **FR-045:** Unlimited version retention
- **FR-046:** Version comparison view (diff visualization)
- **FR-047:** Restore previous versions with confirmation
- **FR-048:** Version metadata (timestamp, author, change summary)
- **FR-049:** Version browsing interface
- **FR-050:** Change log/audit trail for compliance

### 4.4 User Management

#### 4.4.1 Authentication

- **FR-051:** Email/password registration and login
- **FR-052:** OAuth integration (Google, GitHub, Microsoft)
- **FR-053:** Two-factor authentication (TOTP)
- **FR-054:** Password reset via email
- **FR-055:** Account email verification
- **FR-056:** Session management and timeout
- **FR-057:** Remember me functionality

#### 4.4.2 User Roles

- **FR-058:** Three role types: Admin, Editor, Viewer
- **FR-059:** Admin: Full system access and user management
- **FR-060:** Editor: Create, edit, delete own entries
- **FR-061:** Viewer: Read-only access to shared entries
- **FR-062:** Role assignment by workspace admins

#### 4.4.3 User Profile

- **FR-063:** Customizable profile information
- **FR-064:** Profile picture upload
- **FR-065:** Email preferences management
- **FR-066:** Password change functionality
- **FR-067:** Account deletion with data export

### 4.5 Workspace & Collaboration

#### 4.5.1 Workspace Management

- **FR-068:** Multiple workspace support per user
- **FR-069:** Personal and business workspace separation
- **FR-070:** Workspace creation, rename, delete
- **FR-071:** Workspace-specific categories
- **FR-072:** Workspace switching interface
- **FR-073:** Default workspace preference

#### 4.5.2 Sharing & Permissions

- **FR-074:** Share individual entries with users
- **FR-075:** Share categories with users or groups
- **FR-076:** Permission levels: View Only, Comment
- **FR-077:** Share link generation with expiration
- **FR-078:** Revoke access functionality
- **FR-079:** Sharing activity log

#### 4.5.3 Comments & Discussion

- **FR-080:** Comment on shared entries
- **FR-081:** Threaded comment discussions
- **FR-082:** Comment editing and deletion
- **FR-083:** Comment notifications via email
- **FR-084:** @mention users in comments (future)

### 4.6 Import & Export

#### 4.6.1 Import Capabilities

- **FR-085:** Import from Evernote (.enex format)
- **FR-086:** Import Markdown files with frontmatter
- **FR-087:** Import HTML files with metadata preservation
- **FR-088:** Import from TrilliumNext export format
- **FR-089:** Bulk import with progress indicator
- **FR-090:** Import error handling and reporting

#### 4.6.2 Export Capabilities

- **FR-091:** Export entries to Markdown
- **FR-092:** Export entries to PDF with formatting
- **FR-093:** Export entries to HTML
- **FR-094:** Export entries to JSON
- **FR-095:** Full database backup export
- **FR-096:** Selective export (single entry, category, workspace)
- **FR-097:** Export with or without attachments option

### 4.7 MCP Server Integration

#### 4.7.1 MCP Server Features

- **FR-098:** MCP server for AI assistant integration
- **FR-099:** Smart search capabilities via MCP
- **FR-100:** Journal entry CRUD operations via MCP tools
- **FR-101:** Search functionality exposed via MCP resources
- **FR-102:** Category management via MCP tools
- **FR-103:** HTTP transport for external client access
- **FR-104:** Authentication for MCP connections
- **FR-105:** Rate limiting for MCP requests

### 4.8 Security & Privacy

#### 4.8.1 Encryption

- **FR-106:** Data at rest encryption for database
- **FR-107:** HTTPS/TLS for all data in transit
- **FR-108:** End-to-end encryption for entry content
- **FR-109:** Encrypted file storage in PostgreSQL
- **FR-110:** Secure key management
- **FR-111:** Encryption status indicators in UI

#### 4.8.2 Privacy Controls

- **FR-112:** Entries private by default
- **FR-113:** Explicit sharing consent required
- **FR-114:** GDPR compliance features:
  - Data export (portability)
  - Right to be forgotten (account deletion)
  - Data processing transparency
  - Consent management
- **FR-115:** Privacy policy and terms display

#### 4.8.3 Audit & Compliance

- **FR-116:** Comprehensive audit logs for security events
- **FR-117:** User activity tracking
- **FR-118:** Access logs for shared entries
- **FR-119:** Admin audit dashboard
- **FR-120:** Audit log export capability

---

## 5. NON-FUNCTIONAL REQUIREMENTS

### 5.1 Performance

#### 5.1.1 Response Time Requirements

- **NFR-001:** Page load time < 2 seconds on standard broadband
- **NFR-002:** Search response time < 500ms for typical queries
- **NFR-003:** Entry save operation < 1 second
- **NFR-004:** Category navigation instantaneous (< 100ms)
- **NFR-005:** File upload with progress feedback

#### 5.1.2 Scalability

- **NFR-006:** Support for unlimited entries per user
- **NFR-007:** Efficient handling of large entries (>10,000 words)
- **NFR-008:** Optimize database queries for large datasets
- **NFR-009:** Lazy loading for category trees and search results
- **NFR-010:** Resource usage monitoring and optimization

### 5.2 Usability

#### 5.2.1 User Experience

- **NFR-011:** Mobile-responsive design (320px to 4K displays)
- **NFR-012:** Professional aesthetic consistent with design reference
- **NFR-013:** Light and dark mode support
- **NFR-014:** Intuitive navigation requiring minimal training
- **NFR-015:** Consistent UI patterns throughout application

#### 5.2.2 Accessibility

- **NFR-016:** WCAG 2.1 AA compliance minimum
- **NFR-017:** Keyboard navigation for all functions
- **NFR-018:** Screen reader compatibility
- **NFR-019:** Sufficient color contrast ratios
- **NFR-020:** Alt text for images and icons

### 5.3 Reliability

#### 5.3.1 Availability

- **NFR-021:** 99.5% uptime target for self-hosted deployments
- **NFR-022:** Graceful degradation when services unavailable
- **NFR-023:** Auto-save preventing data loss on crashes
- **NFR-024:** Database connection pooling and failover

#### 5.3.2 Data Integrity

- **NFR-025:** Database transactions for consistency
- **NFR-026:** Automated backup system (daily frequency)
- **NFR-027:** Backup retention for 30 days
- **NFR-028:** Offsite backup to SSH destination
- **NFR-029:** Backup verification and restore testing

### 5.4 Security

#### 5.4.1 Application Security

- **NFR-030:** Protection against OWASP Top 10 vulnerabilities
- **NFR-031:** SQL injection prevention
- **NFR-032:** XSS (Cross-Site Scripting) prevention
- **NFR-033:** CSRF (Cross-Site Request Forgery) protection
- **NFR-034:** Secure session management
- **NFR-035:** Rate limiting on authentication endpoints
- **NFR-036:** Input validation and sanitization

#### 5.4.2 Data Security

- **NFR-037:** Encryption for sensitive data fields
- **NFR-038:** Secure password hashing (bcrypt or Argon2)
- **NFR-039:** Secure file upload validation
- **NFR-040:** Regular security dependency updates

### 5.5 Maintainability

#### 5.5.1 Code Quality

- **NFR-041:** TypeScript for type safety
- **NFR-042:** ESLint and Prettier for code consistency
- **NFR-043:** Comprehensive code comments
- **NFR-044:** Unit test coverage >80%
- **NFR-045:** Integration test coverage for critical paths

#### 5.5.2 Documentation

- **NFR-046:** API documentation (OpenAPI/Swagger)
- **NFR-047:** User guide with screenshots and examples
- **NFR-048:** Developer setup guide
- **NFR-049:** Contribution guidelines for open source
- **NFR-050:** Architecture documentation with diagrams

### 5.6 Deployment

#### 5.6.1 Infrastructure

- **NFR-051:** Docker containerization
- **NFR-052:** Docker Compose for local development
- **NFR-053:** Cloud provider compatibility (AWS, GCP, Azure)
- **NFR-054:** Self-hosted deployment documentation
- **NFR-055:** Environment variable configuration

#### 5.6.2 Database

- **NFR-056:** Latest stable PostgreSQL version
- **NFR-057:** Database migration system (Prisma or TypeORM)
- **NFR-058:** Database indexing for performance
- **NFR-059:** Connection pooling configuration

---

## 6. SYSTEM ARCHITECTURE

### 6.1 Technology Stack

#### 6.1.1 Frontend

- **Framework:** Next.js 14 (React-based)
- **Language:** TypeScript
- **Styling:** Tailwind CSS (based on solid-tailwind design system)
- **UI Components:** shadcn/ui
- **Rich Text Editor:** Best-fit selection (TipTap/Quill/ProseMirror)
- **State Management:** React Context API + Server Components
- **Forms:** React Hook Form with Zod validation

#### 6.1.2 Backend

- **Framework:** Next.js 14 API Routes
- **Language:** TypeScript
- **ORM:** Prisma or TypeORM
- **Authentication:** NextAuth.js with OAuth providers
- **File Storage:** PostgreSQL (encrypted)
- **MCP Server:** Custom implementation with HTTP transport

#### 6.1.3 Database

- **Primary Database:** PostgreSQL (latest stable)
- **Extensions:** pgcrypto (encryption), pg_trgm (fuzzy search)

#### 6.1.4 Infrastructure

- **Containerization:** Docker
- **Orchestration:** Docker Compose
- **Reverse Proxy:** Nginx (recommended)
- **SSL/TLS:** Let's Encrypt integration

### 6.2 High-Level Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     Client Layer                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │
│  │   Web App   │  │ MCP Clients │  │  Mobile Web │     │
│  │  (Next.js)  │  │  (HTTP)     │  │  (PWA Future) │    │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘     │
└─────────┼─────────────────┼─────────────────┼───────────┘
          │                 │                 │
          │                 │                 │
┌─────────▼─────────────────▼─────────────────▼───────────┐
│                  Application Layer                       │
│  ┌───────────────────────────────────────────────────┐  │
│  │         Next.js 14 Application Server             │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌──────────┐  │  │
│  │  │   Pages &   │  │  API Routes │  │   MCP    │  │  │
│  │  │ Components  │  │  (REST)     │  │  Server  │  │  │
│  │  └─────────────┘  └─────────────┘  └──────────┘  │  │
│  │                                                    │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌──────────┐  │  │
│  │  │    Auth     │  │   Search    │  │  File    │  │  │
│  │  │   Service   │  │   Service   │  │ Service  │  │  │
│  │  └─────────────┘  └─────────────┘  └──────────┘  │  │
│  └───────────────────────────────────────────────────┘  │
└──────────────────────────┬───────────────────────────────┘
                           │
                           │
┌──────────────────────────▼───────────────────────────────┐
│                    Data Layer                            │
│  ┌─────────────────────────────────────────────────┐    │
│  │         PostgreSQL Database (Encrypted)         │    │
│  │  ┌────────────┐  ┌────────────┐  ┌───────────┐  │    │
│  │  │   Entries  │  │   Users    │  │   Files   │  │    │
│  │  │ Categories │  │ Workspaces │  │  Versions │  │    │
│  │  │   Shares   │  │  Comments  │  │   Audit   │  │    │
│  │  └────────────┘  └────────────┘  └───────────┘  │    │
│  └─────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────┘
```

### 6.3 Data Flow

#### 6.3.1 Entry Creation Flow

```
User → Editor Component → Auto-save → API Route → Service Layer →
Database (Encrypted) → Version Created → Audit Log → Response → UI Update
```

#### 6.3.2 Search Flow

```
User Query → Search Component → API Route → Search Service →
PostgreSQL Full-Text Search → Fuzzy Match → Results Ranked →
Highlights Applied → Response → UI Display
```

#### 6.3.3 MCP Integration Flow

```
AI Assistant → MCP Client → HTTP Transport → MCP Server →
Authentication → Tool/Resource Handler → Database → Response →
AI Assistant Processing
```

### 6.4 Security Architecture

#### 6.4.1 Defense in Depth

- **Layer 1:** HTTPS/TLS encryption for all traffic
- **Layer 2:** Authentication and authorization middleware
- **Layer 3:** Input validation and sanitization
- **Layer 4:** Parameterized queries (SQL injection prevention)
- **Layer 5:** End-to-end encryption for sensitive data
- **Layer 6:** Audit logging for security events
- **Layer 7:** Regular security updates and scanning

#### 6.4.2 Encryption Flow

```
User Input → Client-side Validation →
HTTPS Transport (TLS 1.3) → Server Validation →
Application-level Encryption → Database Encryption (at rest) →
PostgreSQL Storage
```

---

## 7. DATA MODEL

### 7.1 Core Entities

#### 7.1.1 User

```typescript
interface User {
  id: string (UUID)
  email: string (unique, indexed)
  password_hash: string
  name: string
  profile_picture_url?: string
  role: 'admin' | 'editor' | 'viewer'
  two_factor_enabled: boolean
  two_factor_secret?: string
  email_verified: boolean
  created_at: timestamp
  updated_at: timestamp
  last_login: timestamp
}
```

#### 7.1.2 Workspace

```typescript
interface Workspace {
  id: string (UUID)
  owner_id: string (FK → User)
  name: string
  type: 'personal' | 'business'
  created_at: timestamp
  updated_at: timestamp
}
```

#### 7.1.3 Entry

```typescript
interface Entry {
  id: string (UUID)
  workspace_id: string (FK → Workspace)
  author_id: string (FK → User)
  title: string (indexed)
  content: text (encrypted, full-text indexed)
  content_hash: string (for change detection)
  word_count: integer
  created_at: timestamp
  updated_at: timestamp
  deleted_at?: timestamp (soft delete)
}
```

#### 7.1.4 Category

```typescript
interface Category {
  id: string (UUID)
  workspace_id: string (FK → Workspace)
  parent_id?: string (FK → Category, nullable for root)
  name: string (indexed)
  icon?: string
  color?: string
  position: integer (for ordering)
  created_at: timestamp
  updated_at: timestamp
}
```

#### 7.1.5 EntryCategory (Many-to-Many)

```typescript
interface EntryCategory {
  entry_id: string (FK → Entry)
  category_id: string (FK → Category)
  created_at: timestamp
}
```

#### 7.1.6 EntryVersion

```typescript
interface EntryVersion {
  id: string (UUID)
  entry_id: string (FK → Entry)
  version_number: integer
  title: string
  content: text (encrypted)
  author_id: string (FK → User)
  change_summary?: string
  created_at: timestamp
}
```

#### 7.1.7 File

```typescript
interface File {
  id: string (UUID)
  entry_id: string (FK → Entry)
  filename: string
  mime_type: string
  size_bytes: integer
  encrypted_data: bytea (encrypted blob)
  encryption_metadata: jsonb
  uploaded_by: string (FK → User)
  created_at: timestamp
}
```

#### 7.1.8 Share

```typescript
interface Share {
  id: string (UUID)
  entry_id?: string (FK → Entry)
  category_id?: string (FK → Category)
  shared_by: string (FK → User)
  shared_with: string (FK → User)
  permission_level: 'view' | 'comment'
  expires_at?: timestamp
  created_at: timestamp
}
```

#### 7.1.9 Comment

```typescript
interface Comment {
  id: string (UUID)
  entry_id: string (FK → Entry)
  author_id: string (FK → User)
  parent_id?: string (FK → Comment, for threading)
  content: text
  created_at: timestamp
  updated_at: timestamp
  deleted_at?: timestamp
}
```

#### 7.1.10 AuditLog

```typescript
interface AuditLog {
  id: string (UUID)
  user_id: string (FK → User)
  action: string (enum: create, read, update, delete, share, etc.)
  entity_type: string (entry, category, user, etc.)
  entity_id: string
  metadata: jsonb (additional context)
  ip_address: string
  user_agent: string
  created_at: timestamp
}
```

#### 7.1.11 SavedSearch

```typescript
interface SavedSearch {
  id: string (UUID)
  user_id: string (FK → User)
  workspace_id: string (FK → Workspace)
  name: string
  query_params: jsonb (search filters)
  created_at: timestamp
}
```

### 7.2 Database Indexes

#### 7.2.1 Performance Indexes

```sql
-- User lookup
CREATE INDEX idx_users_email ON users(email);

-- Entry search and filtering
CREATE INDEX idx_entries_workspace ON entries(workspace_id);
CREATE INDEX idx_entries_author ON entries(author_id);
CREATE INDEX idx_entries_created ON entries(created_at DESC);
CREATE INDEX idx_entries_title ON entries USING gin(to_tsvector('english', title));
CREATE INDEX idx_entries_content ON entries USING gin(to_tsvector('english', content));

-- Category hierarchy
CREATE INDEX idx_categories_parent ON categories(parent_id);
CREATE INDEX idx_categories_workspace ON categories(workspace_id);

-- Version history
CREATE INDEX idx_versions_entry ON entry_versions(entry_id, version_number DESC);

-- Sharing and permissions
CREATE INDEX idx_shares_shared_with ON shares(shared_with);
CREATE INDEX idx_shares_entry ON shares(entry_id);

-- Audit trail
CREATE INDEX idx_audit_user ON audit_logs(user_id);
CREATE INDEX idx_audit_created ON audit_logs(created_at DESC);
```

### 7.3 Data Relationships

```
User ──┬──< Entry (author)
       ├──< Workspace (owner)
       ├──< Comment (author)
       ├──< Share (shared_by, shared_with)
       └──< AuditLog

Workspace ──┬──< Entry
            └──< Category

Entry ──┬──< EntryVersion
        ├──< File
        ├──< Comment
        ├──< EntryCategory (many-to-many)
        └──< Share

Category ──┬──< Category (parent-child)
           ├──< EntryCategory (many-to-many)
           └──< Share

Comment ──< Comment (parent-child threading)
```

---

## 8. USER INTERFACE DESIGN

### 8.1 Design System

#### 8.1.1 Visual Style

- **Design Reference:** https://solid-tailwind.preview.uideck.com/
- **Aesthetic:** Professional, clean, modern
- **Framework:** Tailwind CSS with shadcn/ui components
- **Theme Support:** Light and dark modes with system preference detection

#### 8.1.2 Layout Structure

- **Primary Navigation:** Sidebar with workspace switcher and category tree
- **Main Content:** Entry editor or dashboard view
- **Secondary Actions:** Toolbar with search, create, share options
- **Responsive Breakpoints:**
  - Mobile: 320px - 767px (single column, hamburger menu)
  - Tablet: 768px - 1023px (collapsible sidebar)
  - Desktop: 1024px+ (full sidebar, multi-column layout)

### 8.2 Key Screens

#### 8.2.1 Dashboard View

- **Header:** Workspace switcher, search bar, user menu
- **Left Sidebar:**
  - Quick actions (New Entry button)
  - Recent entries list (last 10)
  - Category tree with expand/collapse
  - Saved searches
- **Main Content:**
  - Welcome message or statistics
  - Recent activity feed
  - Quick access cards (Today's entries, Shared with me, etc.)
- **Footer:** Version info, help link

#### 8.2.2 Entry Editor View

- **Header:** Breadcrumb navigation, entry title, save status
- **Toolbar:** Rich text formatting controls, insert options (image, file, table, code block)
- **Editor Area:** WYSIWYG editor with live preview
- **Right Sidebar:**
  - Entry metadata (created, modified, word count)
  - Category assignment
  - File attachments
  - Version history access
  - Share button
- **Auto-save Indicator:** Persistent status in header

#### 8.2.3 Search Results View

- **Search Bar:** Prominent with advanced filter toggle
- **Filters Panel:**
  - Date range picker
  - Category multi-select
  - Author filter (for shared workspaces)
  - Sort options (relevance, date, title)
- **Results List:**
  - Entry title with snippet
  - Highlighted search terms
  - Metadata (date, author, category)
  - Quick actions (open, share)
- **Pagination:** Infinite scroll or pagination controls

#### 8.2.4 Category Management View

- **Tree View:** Hierarchical category display with drag-and-drop
- **Operations:**
  - Create new category (modal)
  - Rename category (inline edit)
  - Delete category (confirmation dialog)
  - Move category (drag-and-drop)
- **Properties Panel:**
  - Icon selection
  - Color picker
  - Entry count display

#### 8.2.5 Settings View

- **Navigation Tabs:**
  - Profile (name, email, password, 2FA)
  - Preferences (theme, default workspace, email notifications)
  - Security (active sessions, audit log)
  - Import/Export (data portability)
  - Account (danger zone - account deletion)

### 8.3 Component Specifications

#### 8.3.1 Navigation Sidebar

```
Width: 280px (desktop), 100% (mobile)
Background: bg-white dark:bg-gray-900
Border: border-r border-gray-200 dark:border-gray-700

Components:
- Workspace Switcher: Dropdown with icon
- New Entry Button: Primary CTA, full width
- Category Tree: Expandable/collapsible with icons
- Search Shortcut: Keyboard hint (Cmd+K)
```

#### 8.3.2 Rich Text Editor

```
Min Height: 500px
Background: bg-white dark:bg-gray-900
Toolbar: Sticky, shadow on scroll

Features:
- Floating toolbar for text selection
- Slash commands for quick insertion
- Markdown shortcuts (**, ##, etc.)
- Syntax highlighting for code blocks
- Table editing with row/column controls
```

#### 8.3.3 Modal Dialogs

```
Max Width: 600px (default), 800px (large)
Background: Overlay with backdrop blur
Animation: Fade in, scale from center

Types:
- Confirmation dialogs (destructive actions)
- Form modals (create category, share entry)
- Preview modals (file attachments)
```

### 8.4 Interaction Patterns

#### 8.4.1 Keyboard Shortcuts

```
Global:
- Cmd/Ctrl + K: Open search
- Cmd/Ctrl + N: New entry
- Cmd/Ctrl + S: Save entry (manual)
- Cmd/Ctrl + /: Toggle sidebar

Editor:
- Cmd/Ctrl + B: Bold
- Cmd/Ctrl + I: Italic
- Cmd/Ctrl + Shift + K: Code block
- Cmd/Ctrl + L: Insert link
```

#### 8.4.2 Drag and Drop

- Reorder categories in tree
- Assign entries to categories
- Upload files to entry

#### 8.4.3 Context Menus

- Right-click on entry: Open, Edit, Share, Delete, Duplicate
- Right-click on category: Rename, Delete, New Subcategory
- Right-click on file: Download, Remove, Replace

---

## 9. INTEGRATION SPECIFICATIONS

### 9.1 MCP Server Integration

#### 9.1.1 MCP Server Architecture

```
┌─────────────────────────────────────────┐
│        MCP Server (HTTP Transport)      │
│  ┌───────────────────────────────────┐  │
│  │      Authentication Middleware     │  │
│  └───────────────────────────────────┘  │
│  ┌───────────────────────────────────┐  │
│  │         Tool Handlers             │  │
│  │  - create_entry                   │  │
│  │  - read_entry                     │  │
│  │  - update_entry                   │  │
│  │  - delete_entry                   │  │
│  │  - search_entries                 │  │
│  │  - list_categories                │  │
│  │  - create_category                │  │
│  └───────────────────────────────────┘  │
│  ┌───────────────────────────────────┐  │
│  │      Resource Providers           │  │
│  │  - workspace://entries            │  │
│  │  - workspace://categories         │  │
│  └───────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

#### 9.1.2 MCP Tools

**Tool: create_entry**

```typescript
interface CreateEntryTool {
  name: "create_entry";
  description: "Create a new journal entry";
  inputSchema: {
    type: "object";
    properties: {
      title: { type: "string" };
      content: { type: "string" };
      workspace_id: { type: "string" };
      category_ids?: { type: "array"; items: { type: "string" } };
    };
    required: ["title", "content", "workspace_id"];
  };
}
```

**Tool: search_entries**

```typescript
interface SearchEntriesTool {
  name: "search_entries";
  description: "Search journal entries with smart ranking";
  inputSchema: {
    type: "object";
    properties: {
      query: { type: "string" };
      workspace_id: { type: "string" };
      category_ids?: { type: "array" };
      date_from?: { type: "string" };
      date_to?: { type: "string" };
      limit?: { type: "number" };
    };
    required: ["query", "workspace_id"];
  };
}
```

**Tool: list_categories**

```typescript
interface ListCategoriesTool {
  name: "list_categories";
  description: "Get category hierarchy for a workspace";
  inputSchema: {
    type: "object";
    properties: {
      workspace_id: { type: "string" };
      parent_id?: { type: "string" };
    };
    required: ["workspace_id"];
  };
}
```

#### 9.1.3 MCP Resources

**Resource: workspace://entries**

```typescript
interface EntriesResource {
  uri: "workspace://{workspace_id}/entries";
  name: "Journal Entries";
  description: "Access journal entries for a workspace";
  mimeType: "application/json";
}
```

**Resource: workspace://categories**

```typescript
interface CategoriesResource {
  uri: "workspace://{workspace_id}/categories";
  name: "Categories";
  description: "Category hierarchy for a workspace";
  mimeType: "application/json";
}
```

#### 9.1.4 Authentication

- Bearer token authentication
- API key generation in user settings
- Rate limiting: 100 requests per minute per API key
- Scope-based permissions (read, write, admin)

### 9.2 OAuth Integrations

#### 9.2.1 Supported Providers

- **Google:** OAuth 2.0 with profile and email scopes
- **GitHub:** OAuth 2.0 with user:email scope
- **Microsoft:** OAuth 2.0 with openid and email scopes

#### 9.2.2 OAuth Flow

```
User clicks "Sign in with Google" →
Redirect to provider authorization →
User grants permission →
Callback with authorization code →
Exchange code for access token →
Fetch user profile →
Create or link user account →
Generate session token →
Redirect to dashboard
```

### 9.3 Import/Export Formats

#### 9.3.1 Evernote Import (.enex)

- Parse XML structure
- Extract notes with metadata
- Convert HTML to editor format
- Download and store attachments
- Preserve notebooks as categories
- Maintain created/modified dates

#### 9.3.2 Markdown Import

- Parse frontmatter for metadata
- Convert Markdown to editor format
- Support for inline images and links
- Bulk import from directory structure

#### 9.3.3 Export Formats

- **Markdown:** Clean format with frontmatter
- **PDF:** Formatted with fonts and images
- **HTML:** Standalone files with embedded assets
- **JSON:** Complete data export for backup
- **Database Backup:** PostgreSQL dump with encryption

---

## 10. OPEN SOURCE STRATEGY

### 10.1 Licensing

#### 10.1.1 License Choice

- **Primary License:** MIT License
- **Rationale:**
  - Maximum permissiveness for community adoption
  - Commercial use friendly
  - Compatible with most other open source projects
  - Simple and well-understood terms

#### 10.1.2 License File

```markdown
MIT License

Copyright (c) 2025 OpenJournal Contributors

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

[Standard MIT License text continues...]
```

### 10.2 Community Features

#### 10.2.1 Plugin System

- **Architecture:**
  - Plugin API with lifecycle hooks
  - Sandboxed plugin execution
  - Permission model for plugin capabilities
  - Plugin registry for discovery

- **Plugin Types:**
  - Editor extensions (custom formatting, embeds)
  - Import/export formats
  - Integration connectors (Zapier, IFTTT)
  - Theme customizations

- **Distribution:**
  - NPM packages with naming convention `openjournal-plugin-*`
  - Plugin marketplace on project website
  - Community voting and ratings

#### 10.2.2 Theme Marketplace

- **Theme Structure:**
  - Tailwind CSS configuration overrides
  - Custom CSS variables
  - Component style overrides
  - Preview screenshots

- **Submission Process:**
  - GitHub repository with theme template
  - Pull request to theme registry
  - Community review and approval
  - Versioning and update mechanism

#### 10.2.3 Template Library

- **Template Categories:**
  - Daily journal prompts
  - Project documentation templates
  - Meeting notes formats
  - Goal tracking layouts

- **Template Sharing:**
  - Export/import template bundles
  - Public template gallery
  - User ratings and comments
  - Featured templates showcase

#### 10.2.4 Community Forums

- **Platform:** Discourse or GitHub Discussions
- **Categories:**
  - General discussion
  - Feature requests
  - Bug reports
  - Plugin development
  - Theme showcase
  - Self-hosting support

### 10.3 Documentation Strategy

#### 10.3.1 User Documentation

- **Getting Started Guide:**
  - Installation instructions (Docker, cloud, self-hosted)
  - First-time setup wizard walkthrough
  - Basic features tutorial with screenshots
  - Video tutorials for key workflows

- **User Manual:**
  - Comprehensive feature documentation
  - Searchable knowledge base
  - FAQ section
  - Troubleshooting guides

- **Hosting:** docs.openjournal.org with Docusaurus or GitBook

#### 10.3.2 Developer Documentation

- **Setup Guide:**
  - Prerequisites and environment setup
  - Local development with Docker
  - Database initialization
  - Running tests

- **Architecture Documentation:**
  - System architecture diagrams
  - Data model with ER diagrams
  - API reference (auto-generated from code)
  - Component documentation

- **Plugin Development:**
  - Plugin API reference
  - Plugin development tutorial
  - Best practices and patterns
  - Example plugins

#### 10.3.3 API Documentation

- **OpenAPI Specification:**
  - Auto-generated from route definitions
  - Interactive API explorer (Swagger UI)
  - Code examples in multiple languages
  - Authentication documentation

- **MCP Documentation:**
  - Tool and resource specifications
  - Integration examples
  - Authentication setup
  - Rate limiting and best practices

#### 10.3.4 Contribution Guidelines

- **CONTRIBUTING.md:**
  - Code of conduct
  - How to report bugs
  - How to suggest features
  - Pull request process
  - Code style guide
  - Testing requirements
  - Documentation requirements

- **Development Workflow:**
  - Git branching strategy (main, develop, feature/\*)
  - Commit message conventions (Conventional Commits)
  - CI/CD pipeline (automated tests, linting)
  - Release process and versioning

### 10.4 Governance

#### 10.4.1 Project Structure

- **Core Maintainers:** Trusted contributors with merge access
- **Triage Team:** Issue management and community support
- **Community Council:** Elected members representing users

#### 10.4.2 Decision Making

- **RFCs (Request for Comments):** Major feature proposals
- **Community Voting:** Feature prioritization
- **Transparent Roadmap:** Public project board on GitHub

---

## 11. IMPLEMENTATION ROADMAP

### 11.1 Development Phases

#### 11.1.1 Phase 0: Foundation (Weeks 1-2)

**Goal:** Project setup and core infrastructure

**Deliverables:**

- [ ] Repository initialization with README and LICENSE
- [ ] Next.js 14 project scaffolding
- [ ] TypeScript, ESLint, Prettier configuration
- [ ] Tailwind CSS with shadcn/ui setup
- [ ] PostgreSQL Docker container setup
- [ ] Prisma ORM configuration with initial schema
- [ ] CI/CD pipeline (GitHub Actions)
- [ ] Documentation site structure

**Critical Dependencies:**

- Development environment standardization
- Database schema finalization
- Design system implementation

#### 11.1.2 Phase 1: Core Features (Weeks 3-6)

**Goal:** Essential journaling functionality

**Deliverables:**

- [ ] User authentication (email/password)
- [ ] Entry CRUD operations
- [ ] Rich text editor integration and configuration
- [ ] Basic category management (create, read, update, delete)
- [ ] Entry-category association
- [ ] Dashboard with recent entries
- [ ] Sidebar navigation with category tree
- [ ] Auto-save functionality
- [ ] Basic search (full-text)

**Critical Path:**

- Editor selection and implementation
- Database performance optimization
- Authentication security hardening

#### 11.1.3 Phase 2: Organization & Search (Weeks 7-9)

**Goal:** Advanced organization and discovery

**Deliverables:**

- [ ] Unlimited category nesting
- [ ] Multiple categories per entry
- [ ] Advanced search with filters
- [ ] Saved searches
- [ ] Fuzzy search implementation
- [ ] Search history
- [ ] Entry versioning system
- [ ] Version comparison view
- [ ] Restore previous versions

**Critical Path:**

- Search performance tuning
- Version storage optimization
- Category tree performance

#### 11.1.4 Phase 3: Collaboration (Weeks 10-12)

**Goal:** Workspace and sharing features

**Deliverables:**

- [ ] Workspace management
- [ ] Personal vs. business workspace separation
- [ ] Entry sharing with permissions (view, comment)
- [ ] Category sharing
- [ ] Comment system with threading
- [ ] Email notifications for shares and comments
- [ ] User role implementation (Admin, Editor, Viewer)
- [ ] OAuth integration (Google, GitHub, Microsoft)
- [ ] Two-factor authentication (TOTP)

**Critical Path:**

- Permission system security
- Notification delivery reliability
- OAuth provider integration

#### 11.1.5 Phase 4: Files & Security (Weeks 13-15)

**Goal:** File management and security hardening

**Deliverables:**

- [ ] File upload functionality (images, documents, audio, video, spreadsheets)
- [ ] Encrypted file storage in PostgreSQL
- [ ] File preview generation
- [ ] End-to-end encryption for entry content
- [ ] Data at rest encryption
- [ ] HTTPS/TLS enforcement
- [ ] Audit log system
- [ ] Security dashboard for admins
- [ ] GDPR compliance features (data export, account deletion)

**Critical Path:**

- Encryption key management
- File storage performance
- Security audit completion

#### 11.1.6 Phase 5: Import/Export (Weeks 16-18)

**Goal:** Data portability

**Deliverables:**

- [ ] Evernote (.enex) import
- [ ] Markdown file import
- [ ] HTML file import
- [ ] TrilliumNext import (if format available)
- [ ] Export to Markdown
- [ ] Export to PDF
- [ ] Export to HTML
- [ ] Export to JSON
- [ ] Full database backup export
- [ ] Import/export progress indicators
- [ ] Bulk operations handling

**Critical Path:**

- Format parser reliability
- Large file handling
- Data integrity validation

#### 11.1.7 Phase 6: MCP Integration (Weeks 19-21)

**Goal:** AI assistant integration

**Deliverables:**

- [ ] MCP server implementation with HTTP transport
- [ ] MCP authentication and authorization
- [ ] Entry CRUD tools for MCP
- [ ] Search functionality via MCP
- [ ] Category management tools
- [ ] Smart search ranking
- [ ] MCP rate limiting
- [ ] MCP documentation
- [ ] Example AI assistant integrations

**Critical Path:**

- MCP specification compliance
- Authentication security
- Tool performance optimization

#### 11.1.8 Phase 7: Polish & Performance (Weeks 22-24)

**Goal:** Production readiness

**Deliverables:**

- [ ] Performance optimization (page load <2s, search <500ms)
- [ ] Mobile responsive refinement
- [ ] Dark mode implementation and testing
- [ ] Accessibility audit and fixes (WCAG 2.1 AA)
- [ ] Comprehensive testing (unit, integration, E2E)
- [ ] Load testing and optimization
- [ ] User documentation completion
- [ ] Developer documentation completion
- [ ] Deployment guides (Docker, cloud providers)
- [ ] Backup and restore procedures

**Critical Path:**

- Performance benchmarking
- Accessibility compliance
- Documentation completeness

#### 11.1.9 Phase 8: Community & Extensibility (Weeks 25-28)

**Goal:** Open source community preparation

**Deliverables:**

- [ ] Plugin system architecture
- [ ] Plugin API documentation
- [ ] Example plugins (2-3 reference implementations)
- [ ] Theme system implementation
- [ ] Theme marketplace structure
- [ ] Template library system
- [ ] Community forum setup (Discourse/GitHub Discussions)
- [ ] Contribution guidelines
- [ ] Governance documentation
- [ ] Public roadmap publication

**Critical Path:**

- Plugin security model
- Community platform selection
- Marketing and launch preparation

### 11.2 MVP Definition

#### 11.2.1 MVP Scope (Phases 1-4)

**Essential Features:**

- User authentication (email/password, OAuth)
- Entry creation and editing with rich text editor
- Category organization with unlimited nesting
- Full-text search with basic filters
- Entry versioning and history
- Workspace separation (personal/business)
- Entry sharing with view and comment permissions
- File attachments (images, documents)
- Mobile-responsive design
- Basic security (encryption, HTTPS)

**MVP Timeline:** 15 weeks (approximately 4 months)

**Post-MVP Features (Phases 5-8):**

- Import/export capabilities
- MCP server integration
- Plugin and theme systems
- Community features
- Advanced performance optimizations

### 11.3 Resource Requirements

#### 11.3.1 Development Team (Ideal)

- **1 Full-Stack Engineer (Lead):** Architecture, backend, DevOps
- **1 Frontend Engineer:** UI/UX, React/Next.js, responsive design
- **1 Part-Time Designer:** UI design, branding, documentation graphics

**Solo Developer Alternative:**

- Allocate 30-40 hours per week
- Follow phased approach strictly
- Use AI assistance (Claude, GitHub Copilot) for productivity
- Prioritize MVP scope, defer community features

#### 11.3.2 Infrastructure Costs (Self-Hosted)

- **Development:**
  - Local development: $0 (Docker)
  - CI/CD: GitHub Actions free tier
- **Production (Minimal):**
  - VPS: $10-20/month (DigitalOcean, Linode)
  - Domain: $10-15/year
  - SSL: Free (Let's Encrypt)
  - Backup storage: $5-10/month (Backblaze B2, Wasabi)

**Total Monthly:** $15-30 for small-scale deployment

#### 11.3.3 Tools & Services

- **Free/Open Source:**
  - VS Code / Cursor IDE
  - PostgreSQL
  - Docker
  - Git/GitHub
  - Figma (free tier for design)
- **Paid (Optional):**
  - Vercel/Netlify for staging (free tier available)
  - Sentry for error tracking (free tier available)
  - PostHog for analytics (free tier available)

### 11.4 Risk Management

#### 11.4.1 Technical Risks

| Risk                            | Probability | Impact | Mitigation                                                      |
| ------------------------------- | ----------- | ------ | --------------------------------------------------------------- |
| Editor integration complexity   | Medium      | High   | Evaluate multiple editors early, have fallback options          |
| Search performance at scale     | Medium      | High   | Implement PostgreSQL full-text search with proper indexes early |
| Encryption performance overhead | Low         | Medium | Use hardware acceleration, optimize storage                     |
| MCP specification changes       | Low         | Medium | Follow MCP community closely, design for flexibility            |

#### 11.4.2 Project Risks

| Risk                          | Probability | Impact | Mitigation                                                |
| ----------------------------- | ----------- | ------ | --------------------------------------------------------- |
| Scope creep                   | High        | High   | Strict MVP definition, defer non-essential features       |
| Solo developer burnout        | Medium      | High   | Realistic timeline, regular breaks, community engagement  |
| Community adoption challenges | Medium      | Medium | Early marketing, clear documentation, responsive support  |
| Security vulnerabilities      | Medium      | High   | Regular audits, dependency updates, security-first design |

#### 11.4.3 Mitigation Strategies

- **Weekly Progress Reviews:** Assess scope adherence, adjust timeline
- **Security Audits:** Automated scanning + manual review at each phase
- **Performance Benchmarks:** Define and test at each phase
- **Community Engagement:** Start building community during development
- **Documentation-First:** Write docs alongside features, not after

---

## 12. SUCCESS METRICS

### 12.1 MVP Launch Criteria

#### 12.1.1 Functional Completeness

- [ ] All Phase 1-4 features implemented and tested
- [ ] Zero critical bugs in production
- [ ] <5 high-priority bugs outstanding
- [ ] User acceptance testing completed
- [ ] Security audit passed

#### 12.1.2 Performance Benchmarks

- [ ] Page load time <2 seconds (P95)
- [ ] Search response time <500ms (P95)
- [ ] Entry save time <1 second (P95)
- [ ] Time to first byte <200ms

#### 12.1.3 Quality Gates

- [ ] Test coverage >80%
- [ ] No ESLint errors
- [ ] Accessibility audit passed (WCAG 2.1 AA)
- [ ] Mobile responsiveness verified (3 device sizes)
- [ ] Cross-browser testing completed (Chrome, Firefox, Safari, Edge)

#### 12.1.4 Documentation Completeness

- [ ] User guide published
- [ ] Installation guide published
- [ ] API documentation published
- [ ] Contribution guidelines published
- [ ] Security and privacy policies published

### 12.2 Post-Launch Metrics (3 Months)

#### 12.2.1 Adoption Metrics

- **Target:** 100+ active users (self-hosted + cloud)
- **Active User Definition:** Created ≥1 entry in last 30 days
- **GitHub Stars:** 500+ (community interest indicator)
- **Docker Pulls:** 1,000+ (deployment indicator)

#### 12.2.2 Engagement Metrics

- **Entries Created:** 5,000+ total entries
- **Average Entries per Active User:** 10+
- **Session Duration:** >5 minutes average
- **Retention Rate (30-day):** >50%

#### 12.2.3 Community Metrics

- **GitHub Contributors:** 10+ contributors
- **Pull Requests:** 20+ merged PRs
- **Issues Resolved:** >80% of reported issues resolved
- **Forum Activity:** 50+ forum posts

#### 12.2.4 Technical Metrics

- **Uptime:** >99% for hosted instances
- **Error Rate:** <1% of requests
- **Search Success Rate:** >95% (queries returning results)
- **Import Success Rate:** >90% (Evernote, Markdown imports)

### 12.3 Long-Term Vision (1 Year)

#### 12.3.1 Product Maturity

- Full feature parity with Evernote (core features)
- 20+ community plugins available
- 10+ community themes available
- Mobile apps (iOS/Android) in beta
- Multi-language support (5+ languages)

#### 12.3.2 Community Growth

- 5,000+ active users
- 50+ contributors
- 100+ GitHub stars per month
- Sustainable sponsorship/donations model
- Active community forum with daily activity

#### 12.3.3 Technical Excellence

- Performance optimizations completed
- Advanced search features (semantic search)
- Offline-first Progressive Web App
- Real-time collaboration capabilities
- Advanced analytics and insights

---

## 13. COMPLIANCE & LEGAL

### 13.1 GDPR Compliance

#### 13.1.1 Data Subject Rights

- **Right to Access:** Users can export all their data (JSON format)
- **Right to Rectification:** Users can edit their profile and entries
- **Right to Erasure:** Account deletion with data purging option
- **Right to Portability:** Export in standard formats (JSON, Markdown)
- **Right to Object:** Opt-out of analytics and email notifications

#### 13.1.2 Data Processing

- **Lawful Basis:** User consent via terms acceptance
- **Data Minimization:** Only collect essential user data
- **Purpose Limitation:** Data used only for stated purposes
- **Storage Limitation:** Configurable data retention policies
- **Integrity and Confidentiality:** Encryption and access controls

#### 13.1.3 Transparency

- **Privacy Policy:** Clear explanation of data collection and usage
- **Terms of Service:** User rights and responsibilities
- **Consent Management:** Explicit consent for optional features
- **Breach Notification:** 72-hour notification procedure

### 13.2 Security Standards

#### 13.2.1 OWASP Top 10 Protection

- **Injection:** Parameterized queries, input validation
- **Broken Authentication:** Secure session management, 2FA
- **Sensitive Data Exposure:** Encryption at rest and in transit
- **XML External Entities (XXE):** Input sanitization
- **Broken Access Control:** Role-based access control (RBAC)
- **Security Misconfiguration:** Secure defaults, hardened Docker images
- **Cross-Site Scripting (XSS):** Content Security Policy, output encoding
- **Insecure Deserialization:** Input validation, safe parsers
- **Using Components with Known Vulnerabilities:** Dependency scanning
- **Insufficient Logging & Monitoring:** Comprehensive audit logs

#### 13.2.2 Certifications (Future)

- SOC 2 Type II (for hosted service)
- ISO 27001 (information security management)
- HIPAA compliance (for healthcare use cases)

### 13.3 Licensing Compliance

#### 13.3.1 Dependency Licenses

- **Audit:** Regular review of dependency licenses
- **Compatible Licenses:** MIT, Apache 2.0, BSD-3-Clause
- **Avoided Licenses:** GPL (due to copyleft), proprietary licenses
- **License File:** Comprehensive LICENSES.md with all dependencies

#### 13.3.2 Contribution Licensing

- **Contributor License Agreement (CLA):** Optional, for large contributions
- **DCO (Developer Certificate of Origin):** Signed-off commits required
- **Copyright:** "OpenJournal Contributors" as collective copyright holder

---

## 14. GLOSSARY

### 14.1 Technical Terms

- **Entry:** A single journal entry containing text, media, and metadata
- **Category:** Organizational unit for grouping entries (analogous to folders/notebooks)
- **Workspace:** Isolated environment for personal or business use
- **Version:** Historical snapshot of an entry's content
- **Share:** Permission granted to another user to access an entry or category
- **MCP (Model Context Protocol):** Standard for AI assistant integration
- **Rich Text Editor:** WYSIWYG editor for formatted content creation
- **Full-Text Search:** Search across all text content using PostgreSQL capabilities
- **Fuzzy Search:** Approximate string matching for typo tolerance
- **End-to-End Encryption:** Encryption where only the user holds decryption keys
- **Audit Log:** Record of security-relevant events for compliance

### 14.2 User Roles

- **Admin:** Full system access, user management, configuration
- **Editor:** Create, edit, delete own entries, manage own categories
- **Viewer:** Read-only access to shared entries

### 14.3 Permission Levels

- **View Only:** Read access without ability to comment or edit
- **Comment:** Read access with ability to add comments
- **Edit:** (Future) Full edit access to shared content
- **Full Control:** (Future) Edit, delete, and re-share content

### 14.4 Acronyms

- **API:** Application Programming Interface
- **CLI:** Command Line Interface
- **CRUD:** Create, Read, Update, Delete
- **GDPR:** General Data Protection Regulation
- **HTTPS:** Hypertext Transfer Protocol Secure
- **JWT:** JSON Web Token
- **MCP:** Model Context Protocol
- **MVP:** Minimum Viable Product
- **OWASP:** Open Web Application Security Project
- **PRD:** Product Requirements Document
- **RBAC:** Role-Based Access Control
- **REST:** Representational State Transfer
- **SSO:** Single Sign-On
- **TLS:** Transport Layer Security
- **TOTP:** Time-Based One-Time Password
- **UI/UX:** User Interface / User Experience
- **WCAG:** Web Content Accessibility Guidelines
- **WYSIWYG:** What You See Is What You Get

---

## 15. APPENDICES

### 15.1 References

#### 15.1.1 Design References

- **Solid Tailwind:** https://solid-tailwind.preview.uideck.com/
- **shadcn/ui:** https://ui.shadcn.com/
- **Tailwind CSS:** https://tailwindcss.com/

#### 15.1.2 Technical Documentation

- **Next.js 14:** https://nextjs.org/docs
- **PostgreSQL:** https://www.postgresql.org/docs/
- **Prisma ORM:** https://www.prisma.io/docs
- **MCP Specification:** https://modelcontextprotocol.io/

#### 15.1.3 Security Standards

- **OWASP Top 10:** https://owasp.org/www-project-top-ten/
- **WCAG 2.1:** https://www.w3.org/WAI/WCAG21/quickref/
- **GDPR:** https://gdpr.eu/

### 15.2 Competitive Analysis

#### 15.2.1 Evernote

**Strengths:**

- Mature, polished UI
- Strong mobile apps
- Web clipper functionality
- Large user base

**Weaknesses:**

- Limited free tier
- Privacy concerns (cloud-hosted)
- Vendor lock-in
- Limited customization

**OpenJournal Advantages:**

- Self-hosted privacy
- Open source transparency
- No subscription required
- End-to-end encryption

#### 15.2.2 TrilliumNext

**Strengths:**

- Powerful tree structure
- Developer-friendly (Markdown, code notes)
- Self-hosted
- Advanced features (scripting, relations)

**Weaknesses:**

- Steeper learning curve
- Less intuitive for casual users
- Limited mobile experience
- Complex for simple journaling

**OpenJournal Advantages:**

- Simpler UX for general users
- Better mobile responsiveness
- Modern tech stack (Next.js vs older frameworks)
- AI integration via MCP

#### 15.2.3 Notion

**Strengths:**

- Beautiful UI
- Collaboration features
- Database functionality
- Template marketplace

**Weaknesses:**

- Cloud-only
- Privacy concerns
- Performance issues with large workspaces
- Complex for simple needs

**OpenJournal Advantages:**

- Self-hosted control
- Focused journaling experience (not all-in-one)
- Better privacy guarantees
- Faster for core journaling use case

### 15.3 Future Considerations

#### 15.3.1 Features for Post-MVP

- Real-time collaborative editing
- Native mobile apps (React Native)
- Advanced analytics and insights dashboard
- Machine learning for entry categorization
- OCR for image text extraction
- Voice-to-text entry creation
- Calendar integration for daily prompts
- Mood tracking and journaling analytics
- Public blogging from entries
- Zapier/IFTTT integrations

#### 15.3.2 Scalability Enhancements

- Read replicas for database scaling
- CDN for static assets
- Redis caching layer
- Elasticsearch for advanced search
- S3-compatible storage for files (alternative to PostgreSQL)
- Kubernetes orchestration for cloud deployments
- Horizontal scaling with load balancing

#### 15.3.3 Advanced Security

- Hardware security key support (WebAuthn)
- Biometric authentication (mobile)
- Zero-knowledge architecture exploration
- Advanced threat detection
- Intrusion detection system
- Regular penetration testing

### 15.4 Changelog

**Version 1.0 - 2025-11-14**

- Initial PRD creation based on comprehensive questionnaire
- Defined MVP scope (Phases 1-4)
- Established technical architecture with Next.js 14 and PostgreSQL
- Outlined 28-week implementation roadmap
- Specified security and compliance requirements
- Defined success metrics and launch criteria

**Future Versions:**

- Revisions based on stakeholder feedback
- Updates from development discoveries
- Refinements from user testing

---

## 16. APPROVAL & SIGN-OFF

### 16.1 Document Review

| Reviewer | Role              | Status  | Date | Comments |
| -------- | ----------------- | ------- | ---- | -------- |
| [Name]   | Product Owner     | Pending | TBD  |          |
| [Name]   | Technical Lead    | Pending | TBD  |          |
| [Name]   | Security Reviewer | Pending | TBD  |          |
| [Name]   | UX/UI Designer    | Pending | TBD  |          |

### 16.2 Approval

**This PRD will be considered approved when:**

- [ ] All reviewers have signed off
- [ ] Technical feasibility confirmed
- [ ] Resource availability verified
- [ ] Timeline consensus reached

**Approved by:**

---

Product Owner | Date

---

Technical Lead | Date

---

**Document Control**

- **Version:** 1.0
- **Last Updated:** 2025-11-14
- **Next Review:** Upon MVP completion or major scope change
- **Location:** `/PRD.md` in project repository
- **Distribution:** Public (MIT License, open source project)

---

_This Product Requirements Document serves as the foundation for the OpenJournal project. It is a living document that will evolve with community feedback and development learnings._
