# Manual Import/Export Testing Guide

## Prerequisites
- Development server running (`pnpm dev`)
- Authenticated user session
- Test data files in `tests/fixtures/`

## Test Cases

### 1. Markdown Import
**Steps:**
1. Navigate to `/import-export`
2. Select "Import" tab
3. Choose "Markdown (.md)" format
4. Select `tests/fixtures/import-test.md`
5. Click "Import Data"

**Expected Results:**
- ✅ Import successful message
- ✅ 3 entries imported
- ✅ 5 categories created (personal, reflection, travel, work, planning)
- ✅ Entries appear in dashboard
- ✅ Markdown content converted to HTML
- ✅ Frontmatter metadata preserved (dates, categories, workspace)

### 2. Evernote Import
**Steps:**
1. Navigate to `/import-export`
2. Select "Import" tab
3. Choose "Evernote (.enex)" format
4. Select `tests/fixtures/import-test.enex`
5. Click "Import Data"

**Expected Results:**
- ✅ Import successful message
- ✅ 2 notes imported
- ✅ Tags converted to categories (work, meetings, planning, books, productivity, personal-development)
- ✅ HTML content preserved
- ✅ Created/updated dates preserved
- ✅ Lists and formatting intact

### 3. HTML Import
**Steps:**
1. Create a simple HTML file with:
   ```html
   <html>
   <head><title>Test HTML Entry</title></head>
   <body>
   <h1>Heading</h1>
   <p>Paragraph with <strong>bold</strong> text.</p>
   </body>
   </html>
   ```
2. Navigate to `/import-export`
3. Select "Import" tab
4. Choose "HTML (.html)" format
5. Select the HTML file
6. Click "Import Data"

**Expected Results:**
- ✅ Import successful message
- ✅ 1 entry imported
- ✅ Title extracted from `<title>` tag
- ✅ Body content extracted and preserved
- ✅ HTML formatting maintained

### 4. Markdown Export
**Steps:**
1. Navigate to `/import-export`
2. Select "Export" tab
3. Choose "Markdown (.md)" format
4. Leave filters empty (export all)
5. Click "Export Data"

**Expected Results:**
- ✅ File download triggered
- ✅ Filename: `openjournal-export-[timestamp].md`
- ✅ File contains all entries
- ✅ Each entry has frontmatter with metadata
- ✅ Entries separated by `---`
- ✅ HTML converted to Markdown syntax
- ✅ Categories, dates, workspace preserved in frontmatter

### 5. JSON Export (Full Backup)
**Steps:**
1. Navigate to `/import-export`
2. Select "Export" tab
3. Choose "JSON (.json)" format
4. Leave filters empty
5. Click "Export Data"

**Expected Results:**
- ✅ File download triggered
- ✅ Filename: `openjournal-export-[timestamp].json`
- ✅ JSON structure contains:
  - `version` field
  - `exportDate` field
  - `entries` array with all entries
  - `categories` array with all categories
  - `workspaces` array with all workspaces
- ✅ All metadata preserved
- ✅ Content decrypted in export
- ✅ Attachments included as base64

### 6. HTML Export
**Steps:**
1. Navigate to `/import-export`
2. Select "Export" tab
3. Choose "HTML (.html)" format
4. Leave filters empty
5. Click "Export Data"

**Expected Results:**
- ✅ File download triggered
- ✅ For single entry: standalone HTML with entry title as filename
- ✅ For multiple entries: index HTML with all entries
- ✅ Dark mode support included
- ✅ Styling applied (readable, professional)
- ✅ Metadata displayed (date, word count, categories)
- ✅ HTML can be opened in browser

### 7. PDF Export
**Steps:**
1. Navigate to `/import-export`
2. Select "Export" tab
3. Choose "PDF (via HTML)" format
4. Leave filters empty
5. Click "Export Data"

**Expected Results:**
- ✅ File download triggered
- ✅ HTML file optimized for printing
- ✅ Page breaks between entries
- ✅ Professional formatting
- ✅ User can use browser "Print to PDF" to create PDF
- ✅ Headers and footers styled appropriately

### 8. Filtered Export (by Workspace)
**Steps:**
1. Create entries in different workspaces
2. Navigate to `/import-export`
3. Select "Export" tab
4. Choose any format
5. Enter a workspace ID in "Workspace ID" field
6. Click "Export Data"

**Expected Results:**
- ✅ Only entries from specified workspace exported
- ✅ Categories used in those entries included
- ✅ Workspace information preserved

### 9. Filtered Export (by Category)
**Steps:**
1. Create entries with different categories
2. Navigate to `/import-export`
3. Select "Export" tab
4. Choose any format
5. Enter a category ID in "Category ID" field
6. Click "Export Data"

**Expected Results:**
- ✅ Only entries with specified category exported
- ✅ Category information preserved
- ✅ Other categories used in those entries also included

### 10. Filtered Export (by Entry IDs)
**Steps:**
1. Note down specific entry IDs from dashboard
2. Navigate to `/import-export`
3. Select "Export" tab
4. Choose any format
5. Enter comma-separated entry IDs in "Specific Entry IDs" field
6. Click "Export Data"

**Expected Results:**
- ✅ Only specified entries exported
- ✅ All metadata for those entries preserved

### 11. JSON Import (Full Restore)
**Steps:**
1. Export data to JSON (Test #5)
2. Delete some entries from database (or use different user account)
3. Navigate to `/import-export`
4. Select "Import" tab
5. Choose "JSON (.json)" format
6. Select the exported JSON file
7. Click "Import Data"

**Expected Results:**
- ✅ Import successful message
- ✅ All entries restored
- ✅ All categories restored
- ✅ All workspaces restored
- ✅ Relationships preserved (entry-category links)
- ✅ Attachments restored with encryption
- ✅ Content encrypted in database

### 12. Large File Import
**Steps:**
1. Create a Markdown file with 100+ entries (can duplicate test data)
2. Navigate to `/import-export`
3. Select "Import" tab
4. Choose "Markdown (.md)" format
5. Select the large file
6. Click "Import Data"

**Expected Results:**
- ✅ Import completes without timeout
- ✅ Progress indication (if implemented)
- ✅ All entries imported successfully
- ✅ Accurate count reported
- ✅ No memory issues
- ✅ Performance acceptable (<30s for 100 entries)

### 13. Error Handling - Invalid Format
**Steps:**
1. Navigate to `/import-export`
2. Select "Import" tab
3. Choose "Markdown (.md)" format
4. Select a .jpg image file instead
5. Click "Import Data"

**Expected Results:**
- ✅ Error message displayed
- ✅ No entries imported
- ✅ Error list shows format mismatch
- ✅ UI remains functional

### 14. Error Handling - Malformed Content
**Steps:**
1. Create a Markdown file with invalid frontmatter
2. Navigate to `/import-export`
3. Select "Import" tab
4. Choose "Markdown (.md)" format
5. Select the malformed file
6. Click "Import Data"

**Expected Results:**
- ✅ Partial import success (valid entries imported)
- ✅ Error list shows which entries failed
- ✅ Specific error messages provided
- ✅ Successfully imported entries count accurate

### 15. Audit Logging
**Steps:**
1. Perform any export operation
2. Check audit logs in database

**Expected Results:**
- ✅ Audit log entry created with:
  - Action: `ACCOUNT_EXPORT`
  - Resource type: `ENTRY`
  - User ID
  - Metadata: format, entry count
  - Timestamp

**Steps (Import):**
1. Perform any import operation
2. Check audit logs in database

**Expected Results:**
- ✅ Audit log entry created with:
  - Action: `data.import`
  - Resource type: `ENTRY`
  - User ID
  - Metadata: format, import results
  - Timestamp

## Security Tests

### 16. Encryption Verification (Export)
**Steps:**
1. Export data to JSON
2. Open the JSON file
3. Check `entries[].content` field

**Expected Results:**
- ✅ Content is decrypted (readable HTML)
- ✅ Attachments are base64-encoded but decrypted

### 17. Encryption Verification (Import)
**Steps:**
1. Import data from any format
2. Query database directly for imported entry
3. Check `content` column

**Expected Results:**
- ✅ Content is encrypted in database (base64 string with salt, IV, authTag)
- ✅ Attachment data is encrypted

### 18. Authorization Check
**Steps:**
1. Log out
2. Try to access `/api/export?format=json` directly
3. Try to POST to `/api/import`

**Expected Results:**
- ✅ 401 Unauthorized response
- ✅ No data exported
- ✅ No data imported
- ✅ Redirect to login page

### 19. Cross-User Data Isolation
**Steps:**
1. Create entries as User A
2. Export User A's data
3. Log in as User B
4. Try to export using User A's entry IDs

**Expected Results:**
- ✅ 404 Not Found or empty export
- ✅ User B cannot access User A's entries
- ✅ Authorization checks working correctly

## Performance Benchmarks

### 20. Export Performance
**Test with varying data sizes:**
- 10 entries: < 1 second
- 100 entries: < 5 seconds
- 1000 entries: < 30 seconds

**Measure:**
- Time to generate export
- File size
- Memory usage

### 21. Import Performance
**Test with varying data sizes:**
- 10 entries: < 2 seconds
- 100 entries: < 10 seconds
- 1000 entries: < 60 seconds

**Measure:**
- Time to import
- Database transaction time
- Memory usage

## Browser Compatibility

### 22. Test in Multiple Browsers
**Browsers to test:**
- Chrome/Edge
- Firefox
- Safari

**Features to verify:**
- File upload works
- File download works
- UI renders correctly
- Progress indicators display
- Error messages show properly

## Cleanup

After testing:
1. Delete test entries from database
2. Remove test categories if not needed
3. Verify no orphaned data
4. Check audit logs are accurate
