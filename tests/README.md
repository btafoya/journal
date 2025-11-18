# E2E Test Suite - Automated TEST-PLAN.md Implementation

This directory contains a comprehensive end-to-end test suite that implements the requirements from TEST-PLAN.md.

## 📁 Test Structure

```
tests/
├── e2e/
│   ├── entries-crud.spec.ts       # Comprehensive CRUD testing for entries
│   ├── spider-crawler.spec.ts     # Application crawling and discovery
│   └── performance.spec.ts        # Performance and Web Vitals testing
├── fixtures/
│   └── issue-logger.ts            # Issue tracking and reporting utility
└── README.md                      # This file
```

## 🎯 Test Coverage

### 1. **entries-crud.spec.ts** - CRUD Operations Testing
Implements TEST-PLAN.md Section 7.1

- ✅ **CREATE Operations**
  - Happy path: Valid entry creation
  - Validation: Empty form submission handling
  - Success verification and redirects
  - Console error detection

- ✅ **READ Operations**
  - Index list display and pagination
  - Entry detail page rendering
  - Action links verification (Edit/Delete)

- ✅ **UPDATE Operations**
  - Successful update with valid data
  - Validation error handling
  - Data persistence verification

- ✅ **DELETE Operations**
  - Safe deletion in test environment
  - Confirmation dialog handling
  - Post-deletion verification

### 2. **spider-crawler.spec.ts** - Application Discovery
Implements TEST-PLAN.md Section 6

- ✅ **Crawling Strategy**
  - Starting from `/entries/new`
  - Max depth: 5 levels
  - Max pages: 100 unique URLs
  - Same-origin link following

- ✅ **Per-Page Checks**
  - HTTP status validation
  - Console error detection
  - Broken image detection
  - Basic accessibility checks
  - Layout and responsive testing

### 3. **performance.spec.ts** - Performance Testing
Implements TEST-PLAN.md Section 7.5

- ✅ **Load Time Measurement**
  - Page load performance
  - Network idle detection
  - Thresholds: <3s good, >5s high severity

- ✅ **Web Vitals**
  - LCP (Largest Contentful Paint)
  - CLS (Cumulative Layout Shift)
  - Performance API data

- ✅ **Asset Optimization**
  - Oversized image detection
  - Render-blocking resource analysis
  - Resource loading optimization

## 🔧 Running the Tests

### Option 1: Standard Playwright (if browsers are installed)
```bash
# Run all tests
pnpm test:e2e

# Run with UI mode
pnpm test:e2e:ui

# Debug mode
pnpm test:e2e:debug

# View HTML report
pnpm test:e2e:report
```

### Option 2: Using Playwright MCP
Since the system doesn't support standard Playwright browsers, use the Playwright MCP:

```bash
# The MCP will handle browser automation
# Tests are designed to work with both approaches
```

## 📊 Test Output

### Issue Reports
All issues are automatically logged to `test-results/issues/`:

- `entries-crud-issues.md` - CRUD operation issues
- `spider-crawler-issues.md` - Crawling and discovery issues
- `performance-issues.md` - Performance-related issues

### Report Format
Each issue includes:
- **Type**: CRUD | Functional | UI/UX | Accessibility | Performance | Code quality
- **Severity**: Blocker | High | Medium | Low
- **Description**: Clear explanation
- **Steps to Reproduce**: Numbered steps
- **Expected vs Actual Behavior**
- **Proposed Fix**: Actionable solution
- **Screenshot**: Visual evidence
- **Fix Status Checklist**

### HTML Report
Located at `test-results/html/index.html`:
- Test execution timeline
- Pass/fail statistics
- Screenshots and videos of failures
- Trace viewer for debugging

## 🎨 Issue Logger Utility

The `IssueLogger` class provides structured issue tracking:

```typescript
import { IssueLogger } from '../fixtures/issue-logger';

const issueLogger = new IssueLogger(page);

await issueLogger.logIssue({
  url: page.url(),
  type: 'CRUD',
  operation: 'Create',
  severity: 'High',
  description: 'Form validation not working',
  stepsToReproduce: ['Step 1', 'Step 2'],
  expectedBehavior: 'Should show validation error',
  actualBehavior: 'Form submits anyway',
  proposedFix: 'Add client-side validation',
});

await issueLogger.saveReport('my-issues.md');
```

## 📋 Pre-Test Checklist

Before running tests, ensure:

1. ✅ Dev server is running at `http://192.168.25.165:3000`
   ```bash
   pnpm dev
   ```

2. ✅ Database is set up and accessible
   ```bash
   npx prisma migrate dev
   ```

3. ✅ Test environment is configured (not production!)

4. ✅ Playwright browsers are installed (if using standard Playwright)
   ```bash
   npx playwright install chromium
   ```

## 🔍 Test Methodology

### Parallel vs Sequential
- Tests run **sequentially** to avoid data conflicts
- Each test creates its own test data
- Cleanup happens automatically
- Tests are isolated and independent

### Safety Measures
- Tests only run in dev/test environments
- All test data uses timestamps for uniqueness
- DELETE operations only affect test-created entries
- No production data is modified

### Error Handling
- Comprehensive error logging
- Screenshots on failure
- Console error capture
- Network request monitoring

## 📈 Success Criteria

Tests are considered successful when:

1. ✅ All CRUD operations work correctly
2. ✅ No console errors during normal flows
3. ✅ Validation properly prevents invalid submissions
4. ✅ All pages load without HTTP errors
5. ✅ Basic accessibility standards are met
6. ✅ Performance is within acceptable thresholds
7. ✅ No broken images or resources

## 🐛 Debugging Failed Tests

If tests fail:

1. **Check the HTML report**:
   ```bash
   pnpm test:e2e:report
   ```

2. **Review screenshots**:
   - Located in `test-results/`
   - Captured automatically on failure

3. **Read issue reports**:
   - Check `test-results/issues/*.md`
   - Contains detailed reproduction steps

4. **Debug interactively**:
   ```bash
   pnpm test:e2e:debug
   ```

5. **Use UI mode for inspection**:
   ```bash
   pnpm test:e2e:ui
   ```

## 🔄 Continuous Integration

For CI/CD integration:

```yaml
# Example GitHub Actions workflow
- name: Run E2E Tests
  run: |
    pnpm test:e2e
- name: Upload Test Results
  uses: actions/upload-artifact@v3
  with:
    name: test-results
    path: test-results/
```

## 📚 Additional Resources

- [TEST-PLAN.md](/TEST-PLAN.md) - Original test plan document
- [Playwright Documentation](https://playwright.dev)
- [Web Vitals](https://web.dev/vitals/)
- [WCAG Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)

## 🎯 Next Steps

After running tests:

1. Review issue reports in `test-results/issues/`
2. Prioritize issues by severity (Blocker → High → Medium → Low)
3. Implement fixes for each issue
4. Re-run tests to verify fixes
5. Update test expectations if needed

## 💡 Tips

- Run tests frequently during development
- Use UI mode for exploratory testing
- Keep test data realistic but clearly identifiable
- Update tests when features change
- Monitor test execution time and optimize as needed
