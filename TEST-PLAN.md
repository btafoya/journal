# TEST_PLAN.md  
**Spider + Auto-Fix Pass for App Starting at**  
`http://192.168.25.165:3000/entries/new`

---

## 1. Purpose

Guide Claude Code to:

1. Crawl (“spider”) the web app as a real user starting from  
   `http://192.168.25.165:3000/entries/new`.
2. Discover all reachable pages under the same origin.
3. Systematically **test CRUD operations** on relevant resources (especially entries).
4. Detect issues on each page (functional, CRUD, UI/UX, accessibility, performance, errors).
5. Propose and implement code fixes, verify them, and keep a clear log of changes.

This document is written for **Claude Code running in a project repo** with access to:
- Source code
- Tests (if available)
- Dev server responding on `http://192.168.25.165:3000`

---

## 2. Scope

### 2.1 In Scope

- All pages on the same origin whose URLs start with:

  - `http://192.168.25.165:3000/entries/new`
  - Any **internal link** navigated to from that starting point, **within the same host/port**.

- Types of checks to perform on each page:
  - **CRUD behavior** for any resources with forms or edit/delete flows, especially:
    - `entries` (`/entries/new`, `/entries`, `/entries/:id`, `/entries/:id/edit`, delete actions)
  - Functional behavior (forms, buttons, navigation)
  - Console errors, network errors (4xx/5xx), missing assets
  - UI/UX layout and responsiveness issues
  - Accessibility basics (WCAG-ish checks)
  - HTML/JS/CSS code quality (obvious smells)
  - Performance “low hanging fruit” (massive images, useless blocking scripts)

### 2.2 Out of Scope (for this pass)

- Load testing / concurrency benchmarking
- Deep security / penetration testing
- Non-HTTP/HTTPS services
- External sites and third-party domains

---

## 3. Assumptions

1. The server `http://192.168.25.165:3000` is reachable from the environment where Claude Code runs.
2. Claude Code has:
   - Read/write access to the project repository.
   - Ability to run commands (e.g., via a shell tool / MCP).
   - Optionally, a **browser automation tool** (e.g., Playwright MCP or similar).
3. Authentication:
   - If login is required, credentials or an auth flow will be discoverable or provided in the repo/config.
4. Crawling should be **safe**:
   - Assume **dev/test environment** where **test CRUD data is allowed**.
   - Avoid destructive CRUD ops if this is ever pointed at production.

---

## 4. Test Objectives

1. **Crawl coverage**: Visit as many unique internal pages as possible reachable by normal clicking/navigation.
2. **CRUD coverage**:
   - Identify resources that support CRUD (especially `entries`).
   - Exercise **Create, Read, Update, Delete** operations end-to-end for at least one test record per resource.
3. **Issue detection**:
   - Identify JavaScript errors, broken links, failed network requests.
   - Identify CRUD-specific errors (validation, persistence, wrong redirects).
   - Identify obvious UX issues (overlapping elements, unreadable text, etc.).
   - Identify accessibility issues (missing labels, missing alt text, low contrast).
4. **Issue remediation**:
   - Locate relevant source files.
   - Propose clear, minimal fixes.
   - Apply the fixes and run tests.
5. **Verification**:
   - Re-run the relevant CRUD flows and visual checks after each fix.
   - Make sure no new issues are introduced.
6. **Documentation**:
   - Maintain a structured log of:
     - Pages visited
     - CRUD flows tested
     - Issues found
     - Fixes applied
     - Verification status

---

## 5. Pre-Run Setup (for Claude Code)

Claude Code should:

1. **Understand the project**  
   - Inspect the repo structure:
     - Identify `frontend`/`backend` directories.
     - Detect frameworks (Next.js, React, Vue, Laravel, Rails, etc.).
     - Locate test suites (Jest, Vitest, PHPUnit, RSpec, etc.).
   - Identify configuration for dev server (if needed) and any `.env` / config files (read-only).

2. **Confirm server availability**
   - Ensure the app is running and responding:
     - `curl -I http://192.168.25.165:3000/entries/new`
   - If not running and if allowed:
     - Start dev server (e.g., `npm run dev`, `pnpm dev`, `rails server`, etc.) as defined by the project.

3. **Set test environment**
   - Use a **non-production** environment (dev or local).
   - Ensure logging is enabled (server logs, browser console logs, network trace if possible).

4. **Identify CRUD Targets**

From routes / controllers / views / frontend router, identify resources that support CRUD, for example:

- `entries`:
  - Index: `/entries`
  - New: `/entries/new`
  - Create: POST `/entries`
  - Show: `/entries/:id`
  - Edit: `/entries/:id/edit`
  - Update: PUT/PATCH `/entries/:id`
  - Delete/Destroy: DELETE `/entries/:id` (or POST with `_method=delete` etc.)

Also note any other resources with similar patterns for later CRUD passes.

---

## 6. Crawling / Spidering Strategy

### 6.1 Start URL

- Initial entrypoint:  
  `http://192.168.25.165:3000/entries/new`

### 6.2 Navigation Rules

1. Follow only URLs that:
   - Use `http://192.168.25.165:3000` as host + port.
   - Are reachable by user action: clicking links, buttons, tabs, menus, pagination, etc.
2. Avoid:
   - Obvious destructive actions in non-test environments (Delete, Reset, Wipe, etc.).
   - Infinite loops (e.g., infinite scroll, auto-refresh links).
3. Limit depth:
   - Default max depth: **5 navigation steps** from the starting page.
   - Default max pages: **100 unique** URLs per run (configurable).

### 6.3 State Handling

- If login is required:
  - Identify login form pages linked from the entrypoint or repo documentation.
  - Perform login once and reuse the same browser session/cookies for the crawl.
- For forms:
  - Use **safe, test-like values**.
  - Prefer submissions clearly in a dev/test database.

---

## 7. Checks to Perform on Each Visited Page

For each unique page URL discovered during spidering, Claude Code should perform the following categories of checks.

### 7.1 CRUD Operation Checks (High Priority)

For each identified CRUD-capable resource (especially `entries`):

#### 7.1.1 Create (C)

From `/entries/new` and any other “New” pages:

- **Happy Path:**
  - Fill out the form with **valid test data**:
    - Use realistic values (`title`, `description`, etc. as applicable).
  - Submit the form.
  - Verify:
    - No client-side JS errors.
    - No server-side 4xx/5xx errors.
    - Appropriate redirect or success message (e.g., to `/entries/:id` or `/entries`).
    - The new record appears in:
      - Index/list view.
      - Show view (if applicable).
- **Validation Errors:**
  - Submit with **missing required fields** or invalid formats.
  - Verify:
    - Validation messages appear and are readable.
    - Fields in error are clearly indicated.
    - The record is **not** created.

#### 7.1.2 Read (R)

From index/show pages:

- **Index / List (`/entries`):**
  - Verify that:
    - The new test entry created above appears with correct data.
    - Pagination (if any) works and doesn’t break.
    - Sorting/filtering controls (if any) work and do not produce errors.

- **Show / Detail (`/entries/:id`):**
  - Navigate to the detail page of the test entry.
  - Verify:
    - All fields display as expected.
    - No JS or server errors.
    - Edit/Delete links/buttons (if present) point to correct URLs / actions.

#### 7.1.3 Update (U)

From edit pages (`/entries/:id/edit`):

- **Happy Path Update:**
  - Click “Edit” on the test entry.
  - Change one or more fields (e.g., add “(updated)” to a title).
  - Submit the form.
  - Verify:
    - No JS or server errors.
    - Correct redirect or success message.
    - Updated data appears on show page and index page.

- **Validation Errors on Update:**
  - Intentionally introduce invalid data.
  - Verify:
    - Validation messages appear.
    - Data is not updated to an invalid state.

#### 7.1.4 Delete (D)

From index/show pages:

> **IMPORTANT:** Only perform deletes in a **known safe dev/test environment**.

- **Delete Flow:**
  - Trigger the delete action (button/link).
  - Confirm any confirmation dialogs (if present).
  - Verify:
    - No JS or server errors.
    - Redirect or success message is shown.
    - The record is **no longer** present:
      - In the index list.
      - On direct show URL (ideally returns 404 or similar).

- **Safety:**
  - Ensure deletion only affects test data created during this run.
  - Avoid bulk delete actions unless explicitly intended for testing.

---

### 7.2 Functional Checks

- Does the page load successfully (HTTP 2xx)?
- Are there broken links or resources? Check for:
  - 4xx/5xx responses in network tab (if using Playwright).
  - Missing images or assets.
- Do primary user flows on the page work?
  - Forms accept data and submit properly.
  - Buttons trigger expected actions.
  - Navigation elements change views as expected.
- Any unhandled exceptions?
  - JavaScript console errors
  - Stack traces in the UI

---

### 7.3 UI/UX Checks

- Layout:
  - No overlapping or cutoff text.
  - Elements are aligned and readable.
  - Spacing and padding look intentional, not cramped or huge.
- Responsiveness:
  - Test at least:
    - Mobile width (~375–414px)
    - Tablet (~768px)
    - Desktop (~1280–1440px)
  - Content should reflow rather than break:
    - Nav still usable.
    - Forms still accessible.
- Text & copy:
  - Check for obvious typos/grammar issues in titles, buttons, and key labels.
  - Ensure button/link labels are descriptive (“Save Entry” instead of “OK”).

---

### 7.4 Accessibility Checks (Baseline)

- Images:
  - `<img>` elements must have meaningful `alt` attributes (or empty `alt=""` for purely decorative).
- Forms:
  - Inputs should be associated with `<label>` (`for`/`id` or wrapping label).
  - Required fields should be clearly indicated.
  - Error messages should be descriptive and visible.
- Headings:
  - Use semantic headings (`h1`, `h2`, etc.) in a sensible hierarchy.
- Keyboard navigation:
  - Verify focus can be moved logically with Tab/Shift+Tab (if supported via automation).
  - Confirm no focus traps.
- ARIA roles (if used) are valid and appropriate.

---

### 7.5 Performance / Asset Checks (Quick Pass)

- Check for:
  - Oversized images (e.g., > 1–2 MB or obviously too large for their display size).
  - Blocking scripts/resources loaded synchronously that could be deferred.
- Look at network waterfall (if available):
  - Identify obviously redundant requests.
  - Identify failed requests that may degrade UX.

---

### 7.6 Code Quality Checks (Static)

For files associated with the current page (templates, components, controllers, models):

- Run appropriate linters/formatters if available:
  - `npm test`, `npm run lint`, `eslint`, `phpcs`, `rubocop`, etc.
- Document any:
  - Type errors (TypeScript, Flow).
  - Lint failures.
  - Unused variables, dead code, etc. that clearly impact maintainability/readability.
- For CRUD:
  - Ensure controllers/handlers validate inputs and return appropriate HTTP codes.
  - Ensure database transactions are handled correctly (create/update/delete).

---

## 8. Issue Logging Format

For each issue discovered, Claude Code should log it in a structured checklist (Markdown within this project):

```markdown
## [PAGE] http://192.168.25.165:3000/example/path

### Issue 1
- **Type**: (CRUD | Functional | UI/UX | Accessibility | Performance | Code quality)
- **Operation** (if CRUD): (Create | Read | Update | Delete)
- **Severity**: (Blocker | High | Medium | Low)
- **Description**: Clear explanation of what is wrong.
- **Steps to Reproduce**:
  1. Go to `<URL>`
  2. Do `X`
  3. Observe `Y`
- **Expected Behavior**: What should happen.
- **Actual Behavior**: What actually happens.
- **Suspected Source File(s)**: `path/to/component.tsx`, `app/controllers/entries_controller.rb`, etc.
- **Proposed Fix Summary**: One or two sentences summarizing the change.

### Fix Status
- [ ] Fix implemented in code
- [ ] Lint/tests passing
- [ ] Verified in browser (including CRUD scenario)
