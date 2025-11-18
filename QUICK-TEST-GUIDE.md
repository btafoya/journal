# Quick Test Execution Guide

## 🚀 Fastest Way to Run Tests

### Using Playwright MCP (Recommended for this system)

1. **Start Testing**:
   ```bash
   cat test-results/mcp/test-execution-script.md
   ```

2. **Follow the script** - Execute each MCP command in Claude Code

3. **View Results**:
   ```bash
   cat test-results/mcp/summary-report.md
   ```

---

## 📋 Quick Test Checklist

### Pre-Flight
- [ ] Dev server running at http://192.168.25.165:3000
- [ ] Database initialized
- [ ] Test environment confirmed (not production)

### Test Execution
- [ ] CREATE test (valid data)
- [ ] CREATE test (validation)
- [ ] READ test (index)
- [ ] READ test (detail)
- [ ] UPDATE test (valid)
- [ ] UPDATE test (validation)
- [ ] DELETE test (with confirmation)
- [ ] Spider test (link discovery)
- [ ] Performance test (all pages)
- [ ] Accessibility test (all pages)

### Post-Test
- [ ] Review issue reports
- [ ] Prioritize by severity
- [ ] Implement fixes
- [ ] Re-run tests
- [ ] Verify all passing

---

## 🎯 Key Commands

```bash
# Check if server is running
curl -I http://192.168.25.165:3000/entries/new

# View test execution guide
cat test-results/mcp/test-execution-script.md

# Check test results
ls -la test-results/issues/

# View summary
cat test-results/mcp/summary-report.md
```

---

## 📊 Expected Results

✅ **All tests pass**: No issues found
⚠️ **Some issues**: Check `test-results/issues/*.md`
❌ **Major failures**: Review Blocker and High severity issues first

---

## 🐛 Common Issues

**Server not running**:
```bash
pnpm dev
```

**Database not initialized**:
```bash
npx prisma migrate dev
```

**MCP not available**: Check `.mcp.json` configuration

---

## 📁 Important Files

- `test-results/mcp/test-execution-script.md` - Full test commands
- `test-results/issues/` - Issue reports
- `tests/README.md` - Complete documentation
- `TEST-AUTOMATION-SUMMARY.md` - Implementation details

---

## 💡 Quick Tips

1. **Start simple**: Run CREATE test first
2. **Log everything**: Screenshot + description for each issue
3. **Be systematic**: Complete one test before moving to next
4. **Verify fixes**: Re-run affected tests after fixing
5. **Document**: Keep issue reports updated with fix status

---

## 🎓 MCP Command Pattern

```
1. Navigate: mcp__playwright__browser_navigate({ url: '...' })
2. Snapshot: mcp__playwright__browser_snapshot()
3. Fill form: mcp__playwright__browser_fill_form({ fields: [...] })
4. Click: mcp__playwright__browser_click({ element: '...', ref: '...' })
5. Check errors: mcp__playwright__browser_console_messages()
6. Repeat for next test
```

---

**Ready to test?** Start here: `test-results/mcp/test-execution-script.md`
