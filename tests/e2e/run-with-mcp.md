# Running Tests with Playwright MCP

Since standard Playwright browser installation is not supported on this system, use the Playwright MCP to run the tests.

## Using Playwright MCP from Claude Code

The Playwright MCP provides browser automation capabilities through the following tools:

### 1. Navigate and Take Snapshot
```typescript
// Navigate to a page
mcp__playwright__browser_navigate({ url: 'http://192.168.25.165:3000/entries/new' })

// Take a snapshot of the page
mcp__playwright__browser_snapshot()
```

### 2. Fill Forms
```typescript
// Fill a form
mcp__playwright__browser_fill_form({
  fields: [
    {
      name: 'Title',
      type: 'textbox',
      ref: 'element-ref-from-snapshot',
      value: 'Test Entry Title'
    }
  ]
})
```

### 3. Click Elements
```typescript
// Click a button
mcp__playwright__browser_click({
  element: 'Submit button',
  ref: 'element-ref-from-snapshot'
})
```

### 4. Check for Errors
```typescript
// Get console messages
mcp__playwright__browser_console_messages()

// Get network requests
mcp__playwright__browser_network_requests()
```

## Manual Test Execution with MCP

To manually run the test plan:

1. **Navigate to starting page**:
   ```
   mcp__playwright__browser_navigate({ url: 'http://192.168.25.165:3000/entries/new' })
   ```

2. **Take snapshot to understand page structure**:
   ```
   mcp__playwright__browser_snapshot()
   ```

3. **Fill the entry form**:
   ```
   mcp__playwright__browser_fill_form({
     fields: [
       { name: 'Title', type: 'textbox', ref: '<ref-from-snapshot>', value: 'Test Entry' },
       { name: 'Content', type: 'textbox', ref: '<ref-from-snapshot>', value: 'Test content' }
     ]
   })
   ```

4. **Submit the form**:
   ```
   mcp__playwright__browser_click({ element: 'Submit button', ref: '<ref-from-snapshot>' })
   ```

5. **Check for errors**:
   ```
   mcp__playwright__browser_console_messages()
   ```

6. **Verify redirect/success**:
   ```
   mcp__playwright__browser_snapshot()
   ```

## Automated MCP-Based Testing

The test files in this directory are designed to work with standard Playwright, but the same logic can be executed through MCP tools.

To convert tests to MCP-based execution, each Playwright API call needs to be mapped to the corresponding MCP tool.

## Advantages of MCP Approach

- ✅ No browser installation required
- ✅ Works on systems without GUI
- ✅ Can be controlled from Claude Code directly
- ✅ Same capabilities as standard Playwright
- ✅ Better integration with Claude Code workflows

## Limitations

- Manual step-by-step execution
- No built-in test runner UI
- Requires ref extraction from snapshots
- Less convenient for large test suites

## Recommendation

For comprehensive testing:
1. Use standard Playwright on systems that support it
2. Use MCP for manual testing and exploration on restricted systems
3. Combine both approaches for best coverage
