# OpenJournal REST API Documentation

**Version:** 1.0.0
**Base URL:** `/api`
**Authentication:** Session-based (JWT)

## Table of Contents

1. [Authentication](#authentication)
2. [Entries](#entries)
3. [Templates](#templates)
4. [Attachments](#attachments)
5. [Comments](#comments)
6. [Users](#users)
7. [Workspaces](#workspaces)
8. [Categories](#categories)
9. [Plugins](#plugins)
10. [Themes](#themes)
11. [Search](#search)
12. [Import/Export](#importexport)
13. [Roles & Permissions](#roles--permissions)
14. [CSRF Protection](#csrf-protection)
15. [Error Codes](#error-codes)

---

## Authentication

All API endpoints (except `/api/auth/register` and `/api/csrf`) require authentication via session cookies.

### Register User

**POST** `/api/auth/register`

Create a new user account.

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "secure_password123"
}
```

**Response:** `201 Created`
```json
{
  "user": {
    "id": "clxxx...",
    "name": "John Doe",
    "email": "john@example.com",
    "createdAt": "2025-11-17T10:00:00.000Z"
  },
  "message": "User created successfully"
}
```

**Validation:**
- Password must be at least 8 characters
- Email must be unique

### 2FA Management

#### Setup 2FA
**POST** `/api/auth/2fa/setup`

Returns QR code and secret for 2FA setup.

**Response:** `200 OK`
```json
{
  "qrCode": "data:image/png;base64,...",
  "secret": "SECRET_KEY"
}
```

#### Verify 2FA
**POST** `/api/auth/2fa/verify`

**Request Body:**
```json
{
  "token": "123456"
}
```

#### Disable 2FA
**POST** `/api/auth/2fa/disable`

#### Check 2FA Status
**GET** `/api/auth/2fa/status`

**Response:** `200 OK`
```json
{
  "twoFactorEnabled": true
}
```

### Password Reset

#### Request Reset
**POST** `/api/auth/forgot-password`

**Request Body:**
```json
{
  "email": "john@example.com"
}
```

#### Reset Password
**POST** `/api/auth/reset-password`

**Request Body:**
```json
{
  "token": "reset_token",
  "password": "new_password123"
}
```

---

## Entries

Journal entries with version control and encryption.

### List Entries

**GET** `/api/entries`

**Query Parameters:**
- `page` (number, default: 1) - Page number
- `limit` (number, default: 10) - Items per page
- `search` (string) - Search in title/content
- `published` (boolean) - Filter by published status
- `workspaceId` (string) - Filter by workspace

**Response:** `200 OK`
```json
{
  "entries": [
    {
      "id": "clxxx...",
      "title": "My First Entry",
      "content": "Decrypted content...",
      "wordCount": 150,
      "charCount": 890,
      "published": false,
      "template": {
        "id": "clyyy...",
        "name": "Daily Reflection"
      },
      "workspace": {
        "id": "clzzz...",
        "name": "Personal",
        "type": "personal"
      },
      "createdAt": "2025-11-17T10:00:00.000Z",
      "updatedAt": "2025-11-17T12:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 45,
    "pages": 5
  }
}
```

### Create Entry

**POST** `/api/entries`

**Request Body:**
```json
{
  "title": "New Entry",
  "content": "<p>Rich text content...</p>",
  "templateId": "clyyy...",
  "workspaceId": "clzzz...",
  "published": false
}
```

**Response:** `201 Created`
```json
{
  "id": "clxxx...",
  "title": "New Entry",
  "content": "Decrypted content...",
  "wordCount": 50,
  "charCount": 300,
  "published": false,
  "createdAt": "2025-11-17T10:00:00.000Z"
}
```

**Notes:**
- Content is automatically encrypted before storage
- Word and character counts are calculated automatically
- If no `workspaceId` provided, uses default workspace

### Get Entry

**GET** `/api/entries/:id`

**Response:** `200 OK`
```json
{
  "id": "clxxx...",
  "title": "My Entry",
  "content": "Decrypted content...",
  "template": {
    "id": "clyyy...",
    "name": "Daily Reflection",
    "description": "Daily reflection template"
  }
}
```

### Update Entry

**PUT** `/api/entries/:id`

**Request Body:**
```json
{
  "title": "Updated Title",
  "content": "<p>Updated content...</p>",
  "published": true,
  "changeSummary": "Fixed typos and added conclusion"
}
```

**Response:** `200 OK`

**Notes:**
- Creates automatic version snapshot before update
- Content re-encrypted if modified
- Word/character counts recalculated

### Delete Entry

**DELETE** `/api/entries/:id`

**Response:** `200 OK`
```json
{
  "message": "Entry deleted successfully"
}
```

### Entry Versions

#### List Versions
**GET** `/api/entries/:id/versions`

**Response:** `200 OK`
```json
{
  "versions": [
    {
      "id": "clvvv...",
      "versionNumber": 2,
      "title": "Previous Title",
      "wordCount": 100,
      "changeSummary": "Initial draft",
      "createdAt": "2025-11-16T10:00:00.000Z"
    }
  ]
}
```

#### Get Version
**GET** `/api/entries/:id/versions/:versionId`

#### Restore Version
**POST** `/api/entries/:id/versions/:versionId/restore`

#### Compare Versions
**GET** `/api/entries/:id/versions/compare?v1=clv1...&v2=clv2...`

### Entry Sharing

#### Share Entry
**POST** `/api/entries/:id/share`

**Request Body:**
```json
{
  "email": "colleague@example.com",
  "permission": "comment"
}
```

**Permissions:** `view`, `comment`, `edit`

#### List Shared Entries
**GET** `/api/entries/shared-with-me`

### Entry Categories

**GET** `/api/entries/:id/categories` - List categories for entry
**POST** `/api/entries/:id/categories` - Add category to entry
**DELETE** `/api/entries/:id/categories/:categoryId` - Remove category

---

## Templates

Reusable templates for journal entries.

### List Templates

**GET** `/api/templates`

**Query Parameters:**
- `public` (boolean, default: true) - Include public templates

**Response:** `200 OK`
```json
{
  "templates": [
    {
      "id": "clyyy...",
      "name": "Daily Reflection",
      "description": "Template for daily reflections",
      "content": "<h2>Today's Reflection</h2>...",
      "isPublic": true,
      "userId": "cluuu...",
      "_count": {
        "entries": 15
      },
      "createdAt": "2025-11-01T10:00:00.000Z"
    }
  ]
}
```

### Create Template

**POST** `/api/templates`

**Request Body:**
```json
{
  "name": "Weekly Review",
  "description": "Template for weekly reviews",
  "content": "<h2>Week of {{date}}</h2>...",
  "isPublic": false
}
```

**Response:** `201 Created`

### Get Template

**GET** `/api/templates/:id`

### Update Template

**PUT** `/api/templates/:id`

### Delete Template

**DELETE** `/api/templates/:id`

---

## Attachments

File attachments for journal entries (encrypted).

### List Attachments

**GET** `/api/attachments`

**Query Parameters:**
- `page` (number, default: 1)
- `limit` (number, default: 20)
- `entryId` (string) - Filter by entry
- `mimeType` (string) - Filter by MIME type (e.g., "image/")

**Response:** `200 OK`
```json
{
  "attachments": [
    {
      "id": "claaa...",
      "filename": "photo-1234567890.jpg",
      "originalName": "vacation-photo.jpg",
      "mimeType": "image/jpeg",
      "size": 245678,
      "entryId": "clxxx...",
      "createdAt": "2025-11-17T10:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 8,
    "pages": 1
  }
}
```

### Upload Attachment

**POST** `/api/attachments/upload`

**Request:** `multipart/form-data`
- `file` - File to upload
- `entryId` - Entry ID to attach to

**Response:** `201 Created`
```json
{
  "id": "claaa...",
  "filename": "photo-1234567890.jpg",
  "originalName": "vacation-photo.jpg",
  "mimeType": "image/jpeg",
  "size": 245678,
  "url": "/api/attachments/claaa.../preview"
}
```

**Notes:**
- Files are encrypted before storage
- Maximum file size: 10MB (configurable)
- Supported formats: images, PDFs, documents

### Get Attachment

**GET** `/api/attachments/:id`

### Preview Attachment

**GET** `/api/attachments/:id/preview`

Returns decrypted file with appropriate `Content-Type` header.

### Delete Attachment

**DELETE** `/api/attachments/:id`

---

## Comments

Threaded comments on journal entries.

### List Comments

**GET** `/api/comments?entryId=clxxx...`

**Response:** `200 OK`
```json
{
  "comments": [
    {
      "id": "clccc...",
      "content": "Great insights!",
      "user": {
        "id": "cluuu...",
        "name": "Jane Doe",
        "email": "jane@example.com",
        "image": "https://..."
      },
      "replies": [
        {
          "id": "clccd...",
          "content": "Thanks!",
          "user": {...}
        }
      ],
      "createdAt": "2025-11-17T10:00:00.000Z"
    }
  ]
}
```

### Create Comment

**POST** `/api/comments`

**Request Body:**
```json
{
  "entryId": "clxxx...",
  "content": "This is a great entry!",
  "parentId": "clccc..."
}
```

**Response:** `201 Created`

**Notes:**
- Requires `comment` permission on entry
- Email notification sent to entry owner
- Supports threading via `parentId`

### Update Comment

**PUT** `/api/comments/:id`

### Delete Comment

**DELETE** `/api/comments/:id`

---

## Users

User management and search.

### Search User by Email

**GET** `/api/users?email=user@example.com`

**Response:** `200 OK`
```json
{
  "user": {
    "id": "cluuu...",
    "name": "John Doe",
    "email": "user@example.com",
    "image": "https://..."
  }
}
```

**Use Case:** Find users for role assignment or sharing.

---

## Workspaces

Organizational containers for entries.

### List Workspaces

**GET** `/api/workspaces`

**Response:** `200 OK`
```json
{
  "workspaces": [
    {
      "id": "clwww...",
      "name": "Personal",
      "description": "Personal journal entries",
      "type": "personal",
      "isDefault": true,
      "_count": {
        "entries": 42
      },
      "createdAt": "2025-11-01T10:00:00.000Z"
    }
  ]
}
```

### Create Workspace

**POST** `/api/workspaces`

**Request Body:**
```json
{
  "name": "Work Notes",
  "description": "Professional development journal",
  "type": "professional",
  "isDefault": false
}
```

**Response:** `201 Created`

**Workspace Types:** `personal`, `professional`, `creative`, `academic`

### Get Workspace

**GET** `/api/workspaces/:id`

### Update Workspace

**PUT** `/api/workspaces/:id`

### Delete Workspace

**DELETE** `/api/workspaces/:id`

---

## Categories

Hierarchical organization system (up to 3 levels).

### List Categories

**GET** `/api/categories`

**Response:** `200 OK`
```json
{
  "categories": [
    {
      "id": "clkkk...",
      "name": "Personal Growth",
      "description": "Self-improvement entries",
      "color": "#3B82F6",
      "icon": "📈",
      "order": 0,
      "children": [
        {
          "id": "clkkl...",
          "name": "Health",
          "parentId": "clkkk...",
          "_count": {"entries": 15}
        }
      ],
      "_count": {"entries": 45}
    }
  ]
}
```

### Create Category

**POST** `/api/categories`

**Request Body:**
```json
{
  "name": "Travel",
  "description": "Travel experiences and reflections",
  "color": "#10B981",
  "icon": "✈️",
  "parentId": null
}
```

### Reorder Categories

**POST** `/api/categories/reorder`

**Request Body:**
```json
{
  "categoryIds": ["clk1...", "clk2...", "clk3..."]
}
```

### Update Category

**PUT** `/api/categories/:id`

### Delete Category

**DELETE** `/api/categories/:id`

---

## Plugins

Extensibility system for custom functionality.

### List Plugins

**GET** `/api/plugins`

**Response:** `200 OK`
```json
{
  "plugins": [
    {
      "id": "clppp...",
      "name": "Markdown Export",
      "version": "1.0.0",
      "isActive": true,
      "permissions": ["entries.read", "export.markdown"]
    }
  ]
}
```

### Install Plugin

**POST** `/api/plugins`

**Request Body:**
```json
{
  "manifest": {
    "name": "Custom Plugin",
    "version": "1.0.0",
    "author": "John Doe",
    "entryPoint": "index.js"
  },
  "permissions": ["entries.read"]
}
```

**Response:** `201 Created`

### Activate Plugin

**POST** `/api/plugins/:id/activate`

### Deactivate Plugin

**POST** `/api/plugins/:id/deactivate`

### Uninstall Plugin

**DELETE** `/api/plugins/:id`

---

## Themes

Customizable visual themes.

### List Themes

**GET** `/api/themes`

**Response:** `200 OK`
```json
{
  "themes": [
    {
      "id": "clttt...",
      "name": "Ocean Blue",
      "version": "1.0.0",
      "isActive": false
    }
  ],
  "activeTheme": {
    "id": "clttt...",
    "name": "Dark Mode"
  }
}
```

### Install Theme

**POST** `/api/themes`

**Request Body:**
```json
{
  "manifest": {
    "name": "Forest Green",
    "version": "1.0.0",
    "author": "Jane Doe"
  },
  "config": {
    "primaryColor": "#10B981",
    "backgroundColor": "#F9FAFB"
  }
}
```

### Activate Theme

**POST** `/api/themes/:id/activate`

### Uninstall Theme

**DELETE** `/api/themes/:id`

---

## Search

Advanced search with filters and history.

### Search Entries

**GET** `/api/search`

**Query Parameters:**
- `q` (string) - Search query
- `page` (number, default: 1)
- `limit` (number, default: 10)
- `categoryId` (string) - Filter by category
- `dateFrom` (ISO date) - Start date
- `dateTo` (ISO date) - End date
- `published` (boolean) - Filter by status
- `fuzzy` (boolean, default: false) - Enable fuzzy matching

**Response:** `200 OK`
```json
{
  "entries": [...],
  "pagination": {...},
  "query": {
    "q": "productivity",
    "fuzzy": false,
    "categoryId": "clkkk...",
    "dateFrom": "2025-11-01",
    "dateTo": "2025-11-17"
  }
}
```

**Notes:**
- Searches title and content fields
- Search queries are logged to history
- Fuzzy search uses PostgreSQL full-text search

### Search Suggestions

**GET** `/api/search/suggestions?q=prod`

**Response:** `200 OK`
```json
{
  "suggestions": [
    "productivity",
    "productive habits",
    "product design"
  ]
}
```

### Search History

**GET** `/api/search/history`

**Response:** `200 OK`
```json
{
  "history": [
    {
      "id": "clsss...",
      "query": "productivity",
      "resultCount": 15,
      "filters": {...},
      "createdAt": "2025-11-17T10:00:00.000Z"
    }
  ]
}
```

**DELETE** `/api/search/history` - Clear search history

---

## Import/Export

Bulk data operations supporting multiple formats.

### Export Data

**GET** `/api/export`

**Query Parameters:**
- `format` (string) - Export format: `json`, `markdown`, `html`, `pdf`
- `entryIds` (string) - Comma-separated entry IDs
- `workspaceId` (string) - Export entire workspace
- `categoryId` (string) - Export by category

**Response:** File download with appropriate Content-Type

**Formats:**
- `json` - Full structured export with metadata
- `markdown` - Entries as markdown files
- `html` - Standalone HTML documents
- `pdf` - Print-ready HTML (browser renders to PDF)

**Example:**
```
GET /api/export?format=markdown&workspaceId=clwww...
```

**Response:** `200 OK`
```
Content-Type: text/markdown
Content-Disposition: attachment; filename="openjournal-export-1234567890.md"

# My First Entry
*Created: 2025-11-17*

Content here...

---

# Second Entry
...
```

### Import Data

**POST** `/api/import`

**Request:** `multipart/form-data`
- `file` - File to import
- `format` - Import format: `json`, `markdown`, `html`, `evernote`
- `workspaceId` (optional) - Target workspace

**Response:** `200 OK`
```json
{
  "success": true,
  "entriesImported": 25,
  "categoriesImported": 8,
  "attachmentsImported": 12,
  "errors": []
}
```

**Supported Formats:**
- `json` - OpenJournal export format
- `markdown` - Single or multi-entry markdown files
- `html` - HTML documents
- `evernote` - Evernote ENEX format

**Notes:**
- Evernote tags imported as categories
- Attachments preserved in all formats
- Timestamps preserved when available
- Duplicate detection by title/content hash

---

## Roles & Permissions

Role-based access control (RBAC).

### List Role Assignments

**GET** `/api/roles?workspaceId=clwww...`

**Auth Required:** Admin role

**Response:** `200 OK`
```json
{
  "roles": [
    {
      "id": "clrrr...",
      "userId": "cluuu...",
      "role": "EDITOR",
      "workspaceId": "clwww...",
      "user": {
        "id": "cluuu...",
        "name": "Jane Doe",
        "email": "jane@example.com"
      },
      "workspace": {
        "id": "clwww...",
        "name": "Team Workspace"
      },
      "assignedByUser": {
        "id": "cladm...",
        "name": "Admin User"
      },
      "createdAt": "2025-11-17T10:00:00.000Z"
    }
  ]
}
```

### Assign Role

**POST** `/api/roles`

**Auth Required:** Admin role

**Request Body:**
```json
{
  "userId": "cluuu...",
  "role": "EDITOR",
  "workspaceId": "clwww..."
}
```

**Roles:**
- `ADMIN` - Full system access
- `EDITOR` - Create/edit entries
- `VIEWER` - Read-only access

**Scopes:**
- Global: `workspaceId: null`
- Workspace-specific: `workspaceId: "clwww..."`

**Response:** `201 Created`

**Notes:**
- Email notification sent to user
- Global admin can assign any role
- Workspace admin can assign workspace roles

### Revoke Role

**DELETE** `/api/roles/:id`

**Auth Required:** Admin role

---

## CSRF Protection

CSRF token generation for state-changing operations.

### Get CSRF Token

**GET** `/api/csrf`

**Response:** `200 OK`
```json
{
  "token": "csrf_token_here",
  "message": "CSRF token generated successfully"
}
```

**Usage:**
Include token in request headers for POST/PUT/DELETE:
```
X-CSRF-Token: csrf_token_here
```

---

## Error Codes

Standard HTTP status codes with consistent error format.

### Error Response Format

```json
{
  "error": "Error message",
  "details": {...}
}
```

### Common Status Codes

#### 200 OK
Successful GET request.

#### 201 Created
Successful POST request creating a resource.

#### 400 Bad Request
Invalid request parameters or validation errors.

**Example:**
```json
{
  "error": "Title and content are required"
}
```

#### 401 Unauthorized
Missing or invalid authentication.

**Example:**
```json
{
  "error": "Unauthorized"
}
```

#### 403 Forbidden
Authenticated but lacks permissions.

**Example:**
```json
{
  "error": "Forbidden: Admin access required"
}
```

#### 404 Not Found
Resource does not exist or user lacks access.

**Example:**
```json
{
  "error": "Entry not found"
}
```

#### 500 Internal Server Error
Server-side error (logged for debugging).

**Example:**
```json
{
  "error": "Internal server error"
}
```

---

## Rate Limiting

### Default Limits
- **Authentication endpoints:** 5 requests/minute
- **Search endpoints:** 30 requests/minute
- **Upload endpoints:** 10 requests/minute
- **Standard endpoints:** 100 requests/minute

### Rate Limit Headers
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 87
X-RateLimit-Reset: 1637164800
```

### Rate Limit Response

**Status:** `429 Too Many Requests`
```json
{
  "error": "Too many requests, please try again later",
  "retryAfter": 60
}
```

---

## Audit Logging

All API operations are logged for security and compliance.

### Logged Actions
- `entry.create`, `entry.update`, `entry.delete`
- `account.export`, `data.import`
- `template.create`, `template.update`, `template.delete`
- `security.rate.limit`

### View Audit Logs

**GET** `/api/audit-logs`

**Auth Required:** Admin role

**Query Parameters:**
- `page`, `limit` - Pagination
- `userId` - Filter by user
- `action` - Filter by action type
- `resourceType` - Filter by resource

**Response:** `200 OK`
```json
{
  "logs": [
    {
      "id": "claaa...",
      "userId": "cluuu...",
      "action": "entry.create",
      "resourceType": "entry",
      "resourceId": "clxxx...",
      "metadata": {"title": "New Entry"},
      "ipAddress": "192.168.1.1",
      "userAgent": "Mozilla/5.0...",
      "createdAt": "2025-11-17T10:00:00.000Z"
    }
  ],
  "pagination": {...}
}
```

---

## Best Practices

### Authentication
- Always use HTTPS in production
- Rotate session tokens regularly
- Enable 2FA for sensitive accounts

### Performance
- Use pagination for list endpoints
- Cache frequently accessed data
- Compress responses with gzip

### Security
- Validate all input data
- Never expose sensitive data in logs
- Use CSRF tokens for state changes
- Content is encrypted at rest

### Error Handling
- Check status codes before parsing response
- Handle rate limits with exponential backoff
- Log errors for debugging

---

## Changelog

### Version 1.0.0 (2025-11-17)
- Initial API release
- Authentication and user management
- Journal entries with encryption
- Templates and workspaces
- Categories and attachments
- Comments system
- Import/export functionality
- Plugin and theme systems
- Advanced search
- Role-based access control
- Audit logging

---

## Support

For API issues or questions:
- GitHub Issues: https://github.com/openjournal/openjournal
- Documentation: https://docs.openjournal.app
- Email: support@openjournal.app
