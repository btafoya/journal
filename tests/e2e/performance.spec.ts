import { test, expect } from '@playwright/test';
import { IssueLogger } from '../fixtures/issue-logger';

/**
 * Performance testing for key pages
 * Following TEST-PLAN.md Section 7.5
 */

test.describe('Performance Checks', () => {
  let issueLogger: IssueLogger;

  test.beforeEach(async ({ page }) => {
    issueLogger = new IssueLogger(page);
  });

  test.afterAll(async () => {
    await issueLogger.saveReport('performance-issues.md');
  });

  const pagesToTest = [
    '/entries/new',
    '/entries',
    '/auth/signin',
  ];

  for (const pageUrl of pagesToTest) {
    test(`should have acceptable performance for ${pageUrl}`, async ({ page }) => {
      // Start performance measurement
      const navigationStart = Date.now();

      // Navigate and measure
      await page.goto(pageUrl);
      await page.waitForLoadState('networkidle');

      const navigationEnd = Date.now();
      const loadTime = navigationEnd - navigationStart;

      // Check load time (should be under 3 seconds for good UX)
      if (loadTime > 3000) {
        await issueLogger.logIssue({
          url: pageUrl,
          type: 'Performance',
          severity: loadTime > 5000 ? 'High' : 'Medium',
          description: `Slow page load time: ${loadTime}ms`,
          stepsToReproduce: [`Navigate to ${pageUrl}`, 'Measure time to networkidle'],
          expectedBehavior: 'Page should load in under 3 seconds',
          actualBehavior: `Page took ${loadTime}ms to load`,
          proposedFix: 'Optimize asset loading, reduce bundle size, or improve server response',
        });
      }

      // Check for large images
      const largeImages = await page.evaluate(() => {
        const images = Array.from(document.querySelectorAll('img'));
        return images
          .map((img) => ({
            src: img.src,
            naturalWidth: img.naturalWidth,
            naturalHeight: img.naturalHeight,
            displayWidth: img.width,
            displayHeight: img.height,
          }))
          .filter(
            (img) =>
              img.naturalWidth > img.displayWidth * 2 || img.naturalHeight > img.displayHeight * 2
          );
      });

      if (largeImages.length > 0) {
        await issueLogger.logIssue({
          url: pageUrl,
          type: 'Performance',
          severity: 'Low',
          description: `${largeImages.length} oversized images detected (natural size > 2x display size)`,
          stepsToReproduce: [`Navigate to ${pageUrl}`, 'Inspect image dimensions'],
          expectedBehavior: 'Images should be optimally sized for display',
          actualBehavior: 'Images are larger than needed',
          proposedFix: 'Resize images to appropriate dimensions or use responsive images',
        });
      }

      // Check for blocking resources
      const performanceData = await page.evaluate(() => {
        const resources = performance.getEntriesByType('resource');
        return resources
          .filter((r: any) => r.renderBlockingStatus === 'blocking')
          .map((r: any) => ({
            name: r.name,
            duration: r.duration,
            type: r.initiatorType,
          }));
      });

      const slowBlockingResources = performanceData.filter((r: any) => r.duration > 1000);
      if (slowBlockingResources.length > 0) {
        await issueLogger.logIssue({
          url: pageUrl,
          type: 'Performance',
          severity: 'Medium',
          description: `Slow render-blocking resources detected: ${slowBlockingResources.map((r: any) => r.name).join(', ')}`,
          stepsToReproduce: [
            `Navigate to ${pageUrl}`,
            'Check Performance tab for blocking resources',
          ],
          expectedBehavior: 'Render-blocking resources should load quickly',
          actualBehavior: `${slowBlockingResources.length} slow blocking resources found`,
          proposedFix: 'Defer non-critical scripts or optimize resource loading',
        });
      }

      // Get Web Vitals
      const webVitals = await page.evaluate(() => {
        return new Promise((resolve) => {
          const vitals: any = {};

          // LCP (Largest Contentful Paint)
          new PerformanceObserver((list) => {
            const entries = list.getEntries();
            const lastEntry = entries[entries.length - 1];
            vitals.lcp = lastEntry.startTime;
          }).observe({ entryTypes: ['largest-contentful-paint'] });

          // FID (First Input Delay) - we can't easily simulate this in tests
          // CLS (Cumulative Layout Shift)
          new PerformanceObserver((list) => {
            let cls = 0;
            for (const entry of list.getEntries()) {
              if (!(entry as any).hadRecentInput) {
                cls += (entry as any).value;
              }
            }
            vitals.cls = cls;
          }).observe({ entryTypes: ['layout-shift'] });

          // Give it a moment to collect
          setTimeout(() => resolve(vitals), 2000);
        });
      });

      // Check LCP (should be under 2.5s for good)
      if ((webVitals as any).lcp > 2500) {
        await issueLogger.logIssue({
          url: pageUrl,
          type: 'Performance',
          severity: 'Medium',
          description: `Poor Largest Contentful Paint: ${(webVitals as any).lcp}ms`,
          stepsToReproduce: [`Navigate to ${pageUrl}`, 'Measure LCP in Performance tab'],
          expectedBehavior: 'LCP should be under 2.5 seconds',
          actualBehavior: `LCP is ${(webVitals as any).lcp}ms`,
          proposedFix: 'Optimize critical rendering path and largest content element',
        });
      }

      // Check CLS (should be under 0.1 for good)
      if ((webVitals as any).cls > 0.1) {
        await issueLogger.logIssue({
          url: pageUrl,
          type: 'Performance',
          severity: 'Low',
          description: `High Cumulative Layout Shift: ${(webVitals as any).cls}`,
          stepsToReproduce: [`Navigate to ${pageUrl}`, 'Observe layout shifting'],
          expectedBehavior: 'CLS should be under 0.1',
          actualBehavior: `CLS is ${(webVitals as any).cls}`,
          proposedFix: 'Add size attributes to images, reserve space for dynamic content',
        });
      }

      console.log(`Performance for ${pageUrl}:`, {
        loadTime,
        webVitals,
        largeImages: largeImages.length,
        slowBlockingResources: slowBlockingResources.length,
      });
    });
  }
});
