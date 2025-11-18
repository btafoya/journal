import { test, expect, Page } from '@playwright/test';
import { IssueLogger } from '../fixtures/issue-logger';

/**
 * Spider/Crawler test for discovering and testing all reachable pages
 * Following TEST-PLAN.md Section 6
 */

test.describe('Application Spider/Crawler', () => {
  let issueLogger: IssueLogger;
  const visitedUrls = new Set<string>();
  const urlsToVisit: string[] = [];
  const maxDepth = 5;
  const maxPages = 100;
  const baseUrl = 'http://192.168.25.165:3000';

  test.beforeEach(async ({ page }) => {
    issueLogger = new IssueLogger(page);
  });

  test.afterAll(async () => {
    await issueLogger.saveReport('spider-crawler-issues.md');
  });

  test('should crawl application from starting point', async ({ page }) => {
    const startUrl = '/entries/new';

    // Start crawling
    await crawlPage(page, startUrl, 0);

    // Generate crawl report
    console.log(`\n=== Crawl Complete ===`);
    console.log(`Pages visited: ${visitedUrls.size}`);
    console.log(`Issues found: ${issueLogger.getIssueCount()}`);
  });

  async function crawlPage(page: Page, url: string, depth: number): Promise<void> {
    // Stop conditions
    if (depth > maxDepth || visitedUrls.size >= maxPages) {
      return;
    }

    const fullUrl = url.startsWith('http') ? url : `${baseUrl}${url}`;
    const normalizedUrl = normalizeUrl(fullUrl);

    // Skip if already visited
    if (visitedUrls.has(normalizedUrl)) {
      return;
    }

    console.log(`Crawling [depth ${depth}]: ${normalizedUrl}`);
    visitedUrls.add(normalizedUrl);

    // Navigate to page
    try {
      const response = await page.goto(normalizedUrl, {
        waitUntil: 'networkidle',
        timeout: 30000,
      });

      // Check HTTP status
      if (!response) {
        await issueLogger.logIssue({
          url: normalizedUrl,
          type: 'Functional',
          severity: 'High',
          description: 'Page failed to load (no response)',
          stepsToReproduce: [`Navigate to ${normalizedUrl}`],
          expectedBehavior: 'Page should load successfully',
          actualBehavior: 'No response from server',
          proposedFix: 'Check route configuration and server availability',
        });
        return;
      }

      const status = response.status();
      if (status >= 400) {
        await issueLogger.logIssue({
          url: normalizedUrl,
          type: 'Functional',
          severity: status >= 500 ? 'High' : 'Medium',
          description: `Page returned HTTP ${status} error`,
          stepsToReproduce: [`Navigate to ${normalizedUrl}`],
          expectedBehavior: 'Page should return 2xx status',
          actualBehavior: `Received ${status} status code`,
          proposedFix: 'Fix route handler or check for missing resources',
        });
      }

      // Perform checks on this page
      await performPageChecks(page, normalizedUrl);

      // Discover links on this page
      if (depth < maxDepth) {
        const links = await discoverLinks(page, normalizedUrl);

        // Recursively crawl discovered links
        for (const link of links) {
          await crawlPage(page, link, depth + 1);
        }
      }
    } catch (error) {
      await issueLogger.logIssue({
        url: normalizedUrl,
        type: 'Functional',
        severity: 'High',
        description: `Page navigation error: ${error}`,
        stepsToReproduce: [`Navigate to ${normalizedUrl}`],
        expectedBehavior: 'Page should load without errors',
        actualBehavior: `Error: ${error}`,
        proposedFix: 'Fix navigation error or timeout issues',
      });
    }
  }

  async function performPageChecks(page: Page, url: string): Promise<void> {
    // Check for console errors
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    // Wait a bit for any console errors to appear
    await page.waitForTimeout(1000);

    if (consoleErrors.length > 0) {
      await issueLogger.logIssue({
        url,
        type: 'Functional',
        severity: 'Medium',
        description: `JavaScript console errors: ${consoleErrors.join(', ')}`,
        stepsToReproduce: [`Navigate to ${url}`, 'Check browser console'],
        expectedBehavior: 'No JavaScript errors',
        actualBehavior: `Console errors: ${consoleErrors.join(', ')}`,
        proposedFix: 'Fix JavaScript errors',
      });
    }

    // Check for broken images
    const brokenImages = await page.locator('img[alt]').evaluateAll((images) => {
      return images
        .filter((img) => !(img as HTMLImageElement).complete || (img as HTMLImageElement).naturalHeight === 0)
        .map((img) => img.getAttribute('src') || 'unknown');
    });

    if (brokenImages.length > 0) {
      await issueLogger.logIssue({
        url,
        type: 'Functional',
        severity: 'Low',
        description: `Broken images found: ${brokenImages.join(', ')}`,
        stepsToReproduce: [`Navigate to ${url}`, 'Observe broken images'],
        expectedBehavior: 'All images should load',
        actualBehavior: `${brokenImages.length} broken images`,
        proposedFix: 'Fix image paths or ensure images exist',
      });
    }

    // Check for accessibility issues (basic)
    await performAccessibilityChecks(page, url);

    // Check for layout issues (basic)
    await performLayoutChecks(page, url);
  }

  async function performAccessibilityChecks(page: Page, url: string): Promise<void> {
    // Check for images without alt text
    const imagesWithoutAlt = await page.locator('img:not([alt])').count();
    if (imagesWithoutAlt > 0) {
      await issueLogger.logIssue({
        url,
        type: 'Accessibility',
        severity: 'Medium',
        description: `${imagesWithoutAlt} images missing alt attribute`,
        stepsToReproduce: [`Navigate to ${url}`, 'Inspect images for alt attributes'],
        expectedBehavior: 'All images should have alt attribute',
        actualBehavior: `${imagesWithoutAlt} images without alt`,
        proposedFix: 'Add meaningful alt text to all images',
      });
    }

    // Check for inputs without labels
    const inputsWithoutLabel = await page.locator('input:not([aria-label]):not([aria-labelledby])').evaluateAll((inputs) => {
      return inputs.filter((input) => {
        const id = input.id;
        if (!id) return true;
        const label = document.querySelector(`label[for="${id}"]`);
        return !label && !input.closest('label');
      }).length;
    });

    if (inputsWithoutLabel > 0) {
      await issueLogger.logIssue({
        url,
        type: 'Accessibility',
        severity: 'High',
        description: `${inputsWithoutLabel} form inputs without associated labels`,
        stepsToReproduce: [`Navigate to ${url}`, 'Check form inputs for labels'],
        expectedBehavior: 'All inputs should have associated labels',
        actualBehavior: `${inputsWithoutLabel} unlabeled inputs`,
        proposedFix: 'Add labels or aria-label to all form inputs',
      });
    }

    // Check for proper heading hierarchy
    const headings = await page.locator('h1, h2, h3, h4, h5, h6').allTextContents();
    if (headings.length === 0) {
      await issueLogger.logIssue({
        url,
        type: 'Accessibility',
        severity: 'Low',
        description: 'No semantic headings found on page',
        stepsToReproduce: [`Navigate to ${url}`, 'Look for h1-h6 elements'],
        expectedBehavior: 'Page should have semantic heading structure',
        actualBehavior: 'No headings found',
        proposedFix: 'Add semantic headings to structure content',
      });
    }
  }

  async function performLayoutChecks(page: Page, url: string): Promise<void> {
    // Check for overlapping elements (basic check)
    const hasOverlap = await page.evaluate(() => {
      const elements = Array.from(document.querySelectorAll('*'));
      for (let i = 0; i < elements.length; i++) {
        const rect1 = elements[i].getBoundingClientRect();
        for (let j = i + 1; j < elements.length; j++) {
          const rect2 = elements[j].getBoundingClientRect();
          if (
            rect1.left < rect2.right &&
            rect1.right > rect2.left &&
            rect1.top < rect2.bottom &&
            rect1.bottom > rect2.top
          ) {
            // Basic overlap detected (this is very naive)
            return true;
          }
        }
      }
      return false;
    });

    // Test responsive behavior at different viewports
    const viewports = [
      { width: 375, height: 667, name: 'Mobile' },
      { width: 768, height: 1024, name: 'Tablet' },
      { width: 1280, height: 720, name: 'Desktop' },
    ];

    for (const viewport of viewports) {
      await page.setViewportSize(viewport);
      await page.waitForTimeout(500);

      // Check for horizontal scroll (usually bad on mobile)
      const hasHorizontalScroll = await page.evaluate(() => {
        return document.documentElement.scrollWidth > document.documentElement.clientWidth;
      });

      if (hasHorizontalScroll && viewport.name === 'Mobile') {
        await issueLogger.logIssue({
          url,
          type: 'UI/UX',
          severity: 'Medium',
          description: `Horizontal scroll present on ${viewport.name} viewport`,
          stepsToReproduce: [
            `Navigate to ${url}`,
            `Resize to ${viewport.width}x${viewport.height}`,
            'Observe horizontal scrollbar',
          ],
          expectedBehavior: 'Content should fit within viewport width',
          actualBehavior: 'Horizontal scroll required',
          proposedFix: 'Fix responsive layout to prevent horizontal scroll',
        });
      }
    }

    // Reset viewport
    await page.setViewportSize({ width: 1280, height: 720 });
  }

  async function discoverLinks(page: Page, currentUrl: string): Promise<string[]> {
    const links = await page.locator('a[href]').evaluateAll((anchors, baseUrl) => {
      return anchors
        .map((a) => {
          const href = (a as HTMLAnchorElement).href;
          if (!href) return null;

          // Only follow same-origin links
          try {
            const url = new URL(href);
            const base = new URL(baseUrl);
            if (url.origin !== base.origin) return null;
            return url.pathname + url.search;
          } catch {
            return null;
          }
        })
        .filter((href): href is string => href !== null);
    }, baseUrl);

    // Remove duplicates
    return [...new Set(links)];
  }

  function normalizeUrl(url: string): string {
    try {
      const parsed = new URL(url);
      // Remove trailing slash and normalize
      return parsed.origin + parsed.pathname.replace(/\/$/, '') + parsed.search;
    } catch {
      return url;
    }
  }
});
