# Automated Testing Issues Log
## Test Run: 2025-11-17

---

## [PAGE] http://192.168.25.165:3000/entries/new

### Issue 1: NextAuth Configuration - Missing AUTH_URL (CRITICAL)
- **Type**: Configuration | Authentication
- **Operation**: All auth-related operations
- **Severity**: Blocker
- **Description**: NextAuth 5 (beta.30) is not configured with AUTH_URL environment variable, causing authentication system failures across the application.
- **Steps to Reproduce**:
  1. Check dev server logs
  2. See errors: `TypeError: Invalid URL` and `input: 'null/auth/error?error=Configuration'`
  3. Observe repeated auth errors when accessing any protected routes
- **Expected Behavior**: NextAuth should be properly configured with AUTH_URL
- **Actual Behavior**:
  - Server logs show: `[auth][error] TypeError: Invalid URL`
  - Warning: `[auth][warn][env-url-basepath-mismatch]`
  - AUTH_URL is being read as `null` instead of the configured value
  - Template API returns 401 due to auth misconfiguration
  - Form submissions may be blocked due to session issues
- **Root Cause**: NextAuth 5 uses `AUTH_URL` but `.env.local` only has `NEXTAUTH_URL` (v4 naming)
- **Suspected Source File(s)**:
  - `.env.local` (missing AUTH_URL)
  - `lib/auth.ts:18-22` (NextAuth configuration)
  - NextAuth library expecting `AUTH_URL` environment variable
- **Proposed Fix Summary**:
  1. Add `AUTH_URL=http://192.168.25.165:3000` to `.env.local`
  2. Verify auth.ts configuration is compatible with NextAuth 5 beta
  3. Restart dev server to apply environment changes
  4. Test authentication flows after fix

### Issue 2: Template API Dependent on Auth Fix
- **Type**: Functional | API Error (Dependent on Issue #1)
- **Operation**: Read (fetching templates)
- **Severity**: High (blocked by Issue #1)
- **Description**: The `/api/templates` endpoint returns 401 Unauthorized, likely caused by the AUTH_URL misconfiguration.
- **Steps to Reproduce**:
  1. Navigate to `http://192.168.25.165:3000/entries/new`
  2. Observe browser console
  3. See repeated 401 errors for `/api/templates`
- **Expected Behavior**: Templates should load successfully
- **Actual Behavior**:
  - Console shows: "Error fetching templates: Error: Failed to fetch templates"
  - Template dropdown shows "No template" only (disabled state)
  - Error repeats multiple times in console
- **Suspected Source File(s)**:
  - `app/(protected)/entries/new/page.tsx:34-48` (fetchTemplates function)
  - `app/api/templates/route.ts` (authentication middleware)
- **Proposed Fix Summary**:
  1. Fix Issue #1 first (AUTH_URL configuration)
  2. Verify template API works after auth fix
  3. Add proper error handling and user feedback for failed template fetch
  4. Consider making template fetch optional with graceful degradation

### Fix Status
- [ ] Fix implemented in code
- [ ] Lint/tests passing
- [ ] Verified in browser (including CRUD scenario)

---

### Issue 3: Form Submission Failure (Likely Auth-Related)
- **Type**: CRUD | Functional (Likely dependent on Issue #1)
- **Operation**: Create (new entry)
- **Severity**: Blocker
- **Description**: The "Save Draft" button does not submit the form. No POST request is made to `/api/entries`.
- **Steps to Reproduce**:
  1. Navigate to `http://192.168.25.165:3000/entries/new`
  2. Fill in Title: "Test Entry - Automated Testing"
  3. Fill in Content: "This is a test entry..."
  4. Click "Save Draft" button
  5. Wait 3 seconds
  6. Observe: Page does not navigate, no POST request in network log
- **Expected Behavior**:
  - POST request to `/api/entries` with entry data
  - Redirect to `/entries/:id` on success
  - Error message on failure
- **Actual Behavior**:
  - Button click has no visible effect
  - No network request initiated
  - No error messages shown
  - Page remains on /entries/new
- **Suspected Source File(s)**:
  - `app/(protected)/entries/new/page.tsx:63-103` (handleSubmit function)
  - `components/editor/tiptap-editor.tsx` (content state management)
- **Proposed Fix Summary**:
  1. Investigate why handleSubmit is not being called or is failing validation
  2. Check if TipTap editor's onChange is properly updating content state
  3. Add console logging to handleSubmit for debugging
  4. Verify form's onSubmit event binding

### Fix Status
- [ ] Fix implemented in code
- [ ] Lint/tests passing
- [ ] Verified in browser (including CRUD scenario)

---

### Issue 4: Duplicate Content in Editor
- **Type**: UI/UX
- **Operation**: N/A
- **Severity**: Low
- **Description**: When using document.execCommand to insert text in TipTap editor, content is duplicated.
- **Steps to Reproduce**:
  1. Navigate to new entry page
  2. Click in editor
  3. Use JavaScript to insert text via execCommand
  4. Observe duplicated content
- **Expected Behavior**: Text should appear once
- **Actual Behavior**: Text appears twice in the editor paragraph
- **Suspected Source File(s)**:
  - `components/editor/tiptap-editor.tsx` (event handling)
- **Proposed Fix Summary**: This may be a testing artifact. Need to verify if manual typing causes the same issue or if it's specific to programmatic text insertion.

### Fix Status
- [ ] Investigation needed
- [ ] Fix implemented in code
- [ ] Lint/tests passing
- [ ] Verified in browser

---

## Testing Progress

### CRUD Operations Status
- **Create**: ❌ BLOCKED - Form submission not working
- **Read**: ⏳ PENDING - Cannot test until Create works
- **Update**: ⏳ PENDING - Cannot test until Create works
- **Delete**: ⏳ PENDING - Cannot test until Create works

### Pages Visited
1. `/entries/new` - Issues found, CREATE operation blocked

### Next Steps
1. Investigate and fix Issue #2 (form submission failure) - CRITICAL
2. Fix Issue #1 (template API authentication)
3. Retry CRUD Create operation
4. Continue with Read, Update, Delete operations
5. Spider remaining pages
6. Perform accessibility and UI/UX checks
