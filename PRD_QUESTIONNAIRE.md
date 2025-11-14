# Journaling App PRD - Interactive Questionnaire

Please answer the following questions to help create a comprehensive Product Requirements Document for your journaling app.

---

## 1. PROJECT OVERVIEW & GOALS

### 1.1 Project Name

**Q:** What would you like to name this journaling application?
**A:** OpenJournal

### 1.2 Primary Purpose

**Q:** What are the top 3 primary goals/purposes for this application? (e.g., personal journaling, business documentation, knowledge management, etc.)
**A:** personal journaling, business documentation, knowledge management

### 1.3 Target Users

**Q:** Who are the primary user types? (e.g., individual users, small teams, business departments, etc.)
**A:** individual users, small teams

### 1.4 Scale Expectations

**Q:** How many concurrent users do you expect to support initially? What about in 1 year?
**A:** Unknown

---

## 2. CORE FEATURES & FUNCTIONALITY

### 2.1 Journal Entry Features

**Q:** Beyond basic text entry, what specific features do you need for journal entries?

- [x] Rich text formatting (bold, italic, headers, etc.)
- [x] Code blocks with syntax highlighting
- [x] Tables
- [x] Checklists/To-do items
- [x] Embedded links
- [ ] Mentions/Tags (@user, #tag)
- [x] Timestamps/date markers
- [ ] Other (please specify):

**A:**

- [x] Rich text formatting (bold, italic, headers, etc.)
- [x] Code blocks with syntax highlighting
- [x] Tables
- [x] Checklists/To-do items
- [x] Embedded links
- [x] Timestamps/date markers

### 2.2 File & Media Support

**Q:** What types of files should be supported?

- [x] Images (specify max size):
- [x] Documents (PDF, DOCX, etc.)
- [x] Audio files
- [x] Video files
- [x] Spreadsheets
- [ ] Max total attachment size per entry:

**A:**

- [x] Images (specify max size):
- [x] Documents (PDF, DOCX, etc.)
- [x] Audio files
- [x] Video files
- [x] Spreadsheets

### 2.3 Search Capabilities

**Q:** What search features are essential?

- [x] Full-text search
- [ ] Search within attachments
- [x] Advanced filters (date range, category, tags, author)
- [x] Saved searches
- [x] Search history
- [x] Fuzzy search

**A:**

- [x] Full-text search
- [x] Advanced filters (date range, category, tags, author)
- [x] Saved searches
- [x] Search history
- [x] Fuzzy search

### 2.4 Organization Features

**Q:** How deep should category nesting go? (e.g., unlimited, max 5 levels, etc.)
**A:** unlimited

**Q:** Should users be able to assign multiple categories to a single entry?
**A:** yes

**Q:** Do you want tags separate from categories? If yes, how should they work?
**A:** no

### 2.5 Versioning & History

**Q:** Should entries maintain version history?

- If yes, how many versions should be kept?
- Should users be able to restore previous versions?
- Should there be a change log/audit trail?

**A:**

- If yes, how many versions should be kept? unlimited
- Should users be able to restore previous versions? yes
- Should there be a change log/audit trail? yes

---

## 3. USER MANAGEMENT & ACCESS CONTROL

### 3.1 Authentication

**Q:** What authentication methods should be supported?

- [x] Email/Password
- [x] OAuth (Google, GitHub, Microsoft, etc.)
- [x] Two-Factor Authentication (2FA)
- [ ] SSO (SAML, LDAP)
- [ ] Magic links

**A:**

- [x] Email/Password
- [x] OAuth (Google, GitHub, Microsoft, etc.)
- [x] Two-Factor Authentication (2FA)

### 3.2 User Roles & Permissions

**Q:** What user roles do you need? (e.g., Admin, Editor, Viewer, etc.)
**A:** Admin, Editor, Viewer

**Q:** Should users be able to share entries with specific users or groups?
**A:** Yes

**Q:** What permission levels should be available for shared entries?

- [x] View only
- [x] Comment
- [ ] Edit
- [ ] Full control (delete, share, etc.)

**A:**

- [x] View only
- [x] Comment

### 3.3 Personal vs. Business Use

**Q:** How should personal and business journals be separated?

- Separate workspaces?
- Different categories?
- Tag-based organization?

**A:**

- Separate workspaces? Yes
- Different categories? Yes
- Tag-based organization? N/A

---

## 4. SECURITY & PRIVACY

### 4.1 Encryption

**Q:** What encryption requirements do you have?

- [ ] Data at rest encryption
- [ ] Data in transit (HTTPS/TLS)
- [ ] End-to-end encryption for entries
- [ ] Encrypted file storage

**A:**

- [x] Data at rest encryption
- [x] Data in transit (HTTPS/TLS)
- [x] End-to-end encryption for entries
- [x] Encrypted file storage (stored in postgres)

### 4.2 Data Privacy

**Q:** Should entries be private by default?
**A:** Yes

**Q:** Do you need GDPR compliance features (data export, right to be forgotten, etc.)?
**A:** Yes

### 4.3 Audit & Compliance

**Q:** Do you need audit logs for security/compliance?
**A:** Yes

---

## 5. MCP SERVER INTEGRATION

### 5.1 MCP Server Purpose

**Q:** What will the MCP server be used for?

- [ ] AI assistant integration
- [ ] Automated categorization
- [ ] Content suggestions
- [ ] Smart search
- [ ] Other (please specify):

**A:**

- [x] AI assistant integration
- [x] Smart search

### 5.2 MCP Features

**Q:** What specific MCP tools/resources should be exposed?

- Journal entry CRUD operations?
- Search functionality?
- Category management?
- Analytics?

**A:**

- Journal entry CRUD operations? Yes
- Search functionality? Yes
- Category management? Yes

### 5.3 External Access

**Q:** Should the MCP server be accessible to external clients or only internal to the app?
**A:** External using http transport

---

## 6. USER INTERFACE & EXPERIENCE

### 6.1 Theme Preferences

**Q:** Since I couldn't access the reference website, please describe your preferred theme:

- Color scheme (primary, secondary, accent colors):
- Light/Dark mode support?
- Overall aesthetic (modern, minimal, professional, etc.):

**A:**

- https://solid-tailwind.preview.uideck.com/
- Light/Dark mode support
- Professional

### 6.2 Layout Preferences

**Q:** What layout structure do you prefer?

- [x] Sidebar navigation (like Evernote)
- [ ] Tree view (like TrilliumNext)
- [ ] Horizontal tabs
- [x] Dashboard view
- [ ] Other:

**A:**

- [x] Sidebar navigation (like Evernote)
- [x] Dashboard view

### 6.3 Mobile Experience

**Q:** Should this be mobile-responsive?

- [x] Yes, fully responsive web app
- [ ] Progressive Web App (PWA) with offline support
- [ ] Native mobile apps (future consideration)

**A:**

- [x] Yes, fully responsive web app

### 6.4 Editor Preferences

**Q:** For the WYSIWYG editor, do you have a preference?

- [ ] TipTap
- [ ] Quill
- [ ] Draft.js
- [ ] ProseMirror
- [ ] Other:

**A:**
Best fit

---

## 7. COLLABORATION FEATURES

### 7.1 Real-time Collaboration

**Q:** Should multiple users be able to edit the same entry simultaneously?
**A:** No

### 7.2 Comments & Discussions

**Q:** Should entries support comments/discussions?
**A:** Yes

### 7.3 Notifications

**Q:** What types of notifications should users receive?

- [x] Email notifications
- [ ] In-app notifications
- [ ] Browser push notifications
- Events to notify about (shares, comments, mentions, etc.):

**A:**

- [x] Email notifications

---

## 8. IMPORT/EXPORT & INTEGRATIONS

### 8.1 Import Capabilities

**Q:** Should users be able to import from other platforms?

- [x] Evernote (.enex)
- [x] Markdown files
- [ ] HTML files
- [ ] Other formats:

**A:**

- [x] Evernote (.enex)
- [x] Markdown files
- [x] HTML files
- [x] TrilliamNotes

### 8.2 Export Capabilities

**Q:** What export formats should be supported?

- [ ] Markdown
- [ ] PDF
- [ ] HTML
- [ ] JSON
- [ ] Backup (full database export)

**A:**

- [x] Markdown
- [x] PDF
- [x] HTML
- [x] JSON
- [x] Backup (full database export)

### 8.3 API Access

**Q:** Should there be a public API for third-party integrations?
**A:** No

---

## 9. PERFORMANCE & SCALABILITY

### 9.1 Performance Requirements

**Q:** What are your performance expectations?

- Page load time:
- Search response time:
- Maximum entries per user:

**A:**

- Page load time: Fast
- Search response time: Fast
- Maximum entries per user: Unknowen

### 9.2 Offline Support

**Q:** Should the app work offline with sync when back online?
**A:** No

---

## 10. DEPLOYMENT & HOSTING

### 10.1 Hosting Preferences

**Q:** Where do you plan to host this?

- [x] Self-hosted (own infrastructure)
- [x] Cloud provider (AWS, GCP, Azure, etc.)
- [x] Docker containers
- [ ] Kubernetes

**A:**

### 10.2 Database

**Q:** Any specific PostgreSQL version requirements or extensions needed?
**A:** Latest

---

## 11. ANALYTICS & REPORTING

### 11.1 User Analytics

**Q:** What analytics do you need?

- [ ] Entry count trends
- [ ] User activity logs
- [ ] Category usage statistics
- [ ] Search analytics
- [ ] Storage usage
- [ ] Other:

**A:**
None

### 11.2 Admin Dashboard

**Q:** What should admins be able to monitor/manage?
**A:** Users

---

## 12. BACKUP & RECOVERY

### 12.1 Backup Strategy

**Q:** What backup requirements do you have?

- Automated backups frequency:
- Retention period:
- Backup destinations:

**A:**

- Automated backups frequency: Daily
- Retention period: 1 month
- Backup destinations: Offsite SSH

### 12.2 Disaster Recovery

**Q:** What's your Recovery Point Objective (RPO) and Recovery Time Objective (RTO)?
**A:** Unknown

---

## 13. FEATURES FROM EVERNOTE/TRILLIUM

### 13.1 Evernote Features

**Q:** Which specific Evernote features did you love and want to include?
**A:** No

### 13.2 TrilliumNext Features

**Q:** Which specific TrilliumNext features did you love and want to include?
**A:** No

### 13.3 Improvements

**Q:** What did you wish Evernote or TrilliumNext did better that you want to improve in this app?
**A:** No

---

## 14. OPEN SOURCE CONSIDERATIONS

### 14.1 License

**Q:** What open source license do you prefer?

- [ ] MIT
- [ ] Apache 2.0
- [ ] GPL v3
- [ ] Other:

**A:**
MIT

### 14.2 Documentation

**Q:** What level of documentation should be provided?

- [ ] API documentation
- [ ] User guide
- [ ] Developer setup guide
- [ ] Contribution guidelines
- [ ] Architecture documentation

**A:**
All

### 14.3 Community Features

**Q:** Should there be community features built-in?

- [ ] Public templates/templates marketplace
- [ ] Plugin system
- [ ] Theme marketplace
- [ ] Community forums

**A:**
All

---

## 15. TIMELINE & PRIORITIES

### 15.1 MVP Features

**Q:** What are the must-have features for the initial MVP release?
**A:** All

### 15.2 Phase 2 Features

**Q:** What features can wait for a later release?
**A:** None

### 15.3 Launch Timeline

**Q:** What's your target timeline for the MVP?
**A:** ASAP

---

## 16. ADDITIONAL REQUIREMENTS

### 16.1 Accessibility

**Q:** What accessibility standards should be met? (WCAG 2.1 AA, etc.)
**A:** Best for Open Source

### 16.2 Internationalization

**Q:** Should the app support multiple languages?
**A:** Future

### 16.3 Other Considerations

**Q:** Any other specific requirements, constraints, or features not covered above?
**A:** None

---

## NEXT STEPS

Once you complete this questionnaire, I will:

1. Generate a comprehensive PRD document
2. Create technical specifications
3. Design the database schema
4. Outline the system architecture
5. Create a development roadmap

Please fill out as many sections as possible. You can skip questions if you're unsure - we can refine later!
