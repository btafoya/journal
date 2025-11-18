# MCP Test Execution Script

## Automated TEST-PLAN.md Execution

This document contains the complete sequence of MCP commands to execute the TEST-PLAN.md.

### Prerequisites
- [ ] Dev server running at http://192.168.25.165:3000
- [ ] Database initialized and accessible
- [ ] Playwright MCP available in Claude Code
- [ ] Test environment confirmed (not production)

---

## Test Execution Sequence

### Test 1: CREATE - Happy Path

```
1. mcp__playwright__browser_navigate({ url: 'http://192.168.25.165:3000/entries/new' })
2. mcp__playwright__browser_snapshot()
3. [Copy title input ref from snapshot]
4. mcp__playwright__browser_fill_form({
     fields: [
       { name: 'Title', type: 'textbox', ref: '[REF]', value: 'Test Entry 1763443676790' }
     ]
   })
5. [Copy submit button ref]
6. mcp__playwright__browser_click({ element: 'Submit', ref: '[REF]' })
7. mcp__playwright__browser_console_messages()
8. mcp__playwright__browser_snapshot()
```

**Expected**: Redirect to entry detail or index, no console errors
**Log issues if**: No redirect, errors present, validation fails

---

### Test 2: CREATE - Validation Test

```
1. mcp__playwright__browser_navigate({ url: 'http://192.168.25.165:3000/entries/new' })
2. mcp__playwright__browser_snapshot()
3. [Copy submit button ref]
4. mcp__playwright__browser_click({ element: 'Submit', ref: '[REF]' })
5. mcp__playwright__browser_snapshot()
```

**Expected**: Validation errors shown, form not submitted
**Log issues if**: No validation messages, empty form accepted

---

### Test 3: READ - Index List

```
1. mcp__playwright__browser_navigate({ url: 'http://192.168.25.165:3000/entries' })
2. mcp__playwright__browser_snapshot()
3. [Verify test entry in snapshot]
4. [Check for pagination controls]
5. mcp__playwright__browser_console_messages()
```

**Expected**: Entry list displays, pagination works
**Log issues if**: Entries missing, pagination broken, errors present

---

### Test 4: READ - Detail View

```
1. mcp__playwright__browser_navigate({ url: 'http://192.168.25.165:3000/entries/[ID]' })
2. mcp__playwright__browser_snapshot()
3. [Verify title and content in snapshot]
4. [Check for Edit/Delete buttons]
5. mcp__playwright__browser_console_messages()
```

**Expected**: Full entry data displayed, action buttons present
**Log issues if**: Data missing, buttons missing, errors present

---

### Test 5: UPDATE - Happy Path

```
1. mcp__playwright__browser_navigate({ url: 'http://192.168.25.165:3000/entries/[ID]/edit' })
2. mcp__playwright__browser_snapshot()
3. [Copy title ref]
4. mcp__playwright__browser_fill_form({
     fields: [
       { name: 'Title', type: 'textbox', ref: '[REF]', value: 'Updated Entry Title' }
     ]
   })
5. [Copy submit button ref]
6. mcp__playwright__browser_click({ element: 'Submit', ref: '[REF]' })
7. mcp__playwright__browser_snapshot()
8. mcp__playwright__browser_navigate({ url: 'http://192.168.25.165:3000/entries/[ID]' })
9. mcp__playwright__browser_snapshot()
10. [Verify updated title in snapshot]
```

**Expected**: Update saves, redirect occurs, changes persist
**Log issues if**: No redirect, changes not saved, errors present

---

### Test 6: DELETE - Safe Deletion

```
1. mcp__playwright__browser_navigate({ url: 'http://192.168.25.165:3000/entries/[ID]' })
2. mcp__playwright__browser_snapshot()
3. [Copy delete button ref]
4. mcp__playwright__browser_click({ element: 'Delete', ref: '[REF]' })
5. mcp__playwright__browser_handle_dialog({ accept: true })
6. mcp__playwright__browser_snapshot()
7. mcp__playwright__browser_navigate({ url: 'http://192.168.25.165:3000/entries/[ID]' })
8. mcp__playwright__browser_snapshot()
```

**Expected**: Confirmation dialog, redirect after delete, 404 on deleted entry
**Log issues if**: No confirmation, entry still exists, errors present

---

### Test 7: Spider - Link Discovery

```
1. mcp__playwright__browser_navigate({ url: 'http://192.168.25.165:3000/entries/new' })
2. mcp__playwright__browser_snapshot()
3. [Extract all <a href> links from snapshot]
4. For each link:
   - mcp__playwright__browser_navigate({ url: '[LINK]' })
   - mcp__playwright__browser_snapshot()
   - mcp__playwright__browser_console_messages()
   - [Check HTTP status in response]
   - [Log any issues]
```

**Expected**: All links work, no 404s, no console errors
**Log issues if**: Broken links, errors, missing pages

---

### Test 8: Accessibility - Form Labels

```
1. For each page with forms:
   - mcp__playwright__browser_snapshot()
   - [Check snapshot for inputs without labels]
   - [Check for images without alt]
   - [Check heading hierarchy]
```

**Expected**: All inputs labeled, images have alt, proper headings
**Log issues if**: Missing labels, missing alt, poor heading structure

---

### Test 9: Performance - Load Times

```
1. [Start timer]
2. mcp__playwright__browser_navigate({ url: 'http://192.168.25.165:3000/entries/new' })
3. [End timer when networkidle]
4. mcp__playwright__browser_network_requests()
5. [Analyze slow requests]
6. [Check for large images]
```

**Expected**: Page loads < 3s, no huge images, no slow blocking resources
**Log issues if**: Load > 3s, oversized images, blocking resources

---

### Test 10: Responsive - Mobile Layout

```
1. mcp__playwright__browser_resize({ width: 375, height: 667 })
2. mcp__playwright__browser_navigate({ url: 'http://192.168.25.165:3000/entries/new' })
3. mcp__playwright__browser_snapshot()
4. [Check for horizontal scroll]
5. [Verify form usability]
6. mcp__playwright__browser_resize({ width: 1280, height: 720 })
```

**Expected**: Mobile layout works, no horizontal scroll, form usable
**Log issues if**: Layout breaks, horizontal scroll, unusable elements

---

## Issue Tracking Template

Copy this for each issue found:

```markdown
## Issue [NUMBER]: [SEVERITY] - [TYPE]

**Test**: [Test name from above]
**URL**: http://192.168.25.165:3000/[path]
**Type**: CRUD | Functional | UI/UX | Accessibility | Performance
**Severity**: Blocker | High | Medium | Low

### Description
[Clear explanation of the problem]

### Steps to Reproduce
1. [Step 1]
2. [Step 2]
3. [Step 3]

### Expected Behavior
[What should happen]

### Actual Behavior
[What actually happens]

### Proposed Fix
[How to fix it]

### Screenshot
[Path or description]

### Fix Status
- [ ] Fix implemented in code
- [ ] Lint/tests passing
- [ ] Verified in browser
```

---

## Completion Checklist

- [ ] All 10 tests executed
- [ ] All issues logged with screenshots
- [ ] Issue severity assigned
- [ ] Proposed fixes documented
- [ ] Summary report generated
- [ ] Test results saved to test-results/mcp/
