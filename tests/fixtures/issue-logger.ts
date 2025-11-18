import { Page } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

export interface Issue {
  url: string;
  type: 'CRUD' | 'Functional' | 'UI/UX' | 'Accessibility' | 'Performance' | 'Code quality';
  operation?: 'Create' | 'Read' | 'Update' | 'Delete';
  severity: 'Blocker' | 'High' | 'Medium' | 'Low';
  description: string;
  stepsToReproduce: string[];
  expectedBehavior: string;
  actualBehavior: string;
  proposedFix: string;
  sourceFiles?: string[];
  timestamp?: string;
  screenshot?: string;
}

export class IssueLogger {
  private issues: Issue[] = [];
  private page: Page;
  private reportDir = 'test-results/issues';

  constructor(page: Page) {
    this.page = page;
    if (!fs.existsSync(this.reportDir)) {
      fs.mkdirSync(this.reportDir, { recursive: true });
    }
  }

  async logIssue(issue: Omit<Issue, 'timestamp' | 'screenshot'>): Promise<void> {
    const timestamp = new Date().toISOString();
    let screenshot: string | undefined;

    // Take screenshot of the issue
    try {
      const screenshotPath = path.join(
        this.reportDir,
        `issue-${this.issues.length + 1}-${Date.now()}.png`
      );
      await this.page.screenshot({ path: screenshotPath, fullPage: true });
      screenshot = screenshotPath;
    } catch (error) {
      console.error('Failed to capture screenshot:', error);
    }

    this.issues.push({
      ...issue,
      timestamp,
      screenshot,
    });
  }

  async saveReport(filename: string): Promise<void> {
    if (this.issues.length === 0) {
      console.log('No issues found - test passed successfully!');
      return;
    }

    const reportPath = path.join(this.reportDir, filename);
    let markdown = '# Test Issues Report\n\n';
    markdown += `Generated: ${new Date().toISOString()}\n\n`;
    markdown += `Total Issues Found: ${this.issues.length}\n\n`;

    // Group issues by URL
    const issuesByUrl = this.issues.reduce((acc, issue) => {
      if (!acc[issue.url]) {
        acc[issue.url] = [];
      }
      acc[issue.url].push(issue);
      return {};
    }, {} as Record<string, Issue[]>);

    // Generate markdown for each URL
    this.issues.forEach((issue, index) => {
      markdown += `## Issue ${index + 1}: [${issue.severity}] ${issue.type}`;
      if (issue.operation) {
        markdown += ` - ${issue.operation}`;
      }
      markdown += '\n\n';

      markdown += `**Page**: ${issue.url}\n\n`;
      markdown += `**Type**: ${issue.type}\n\n`;
      if (issue.operation) {
        markdown += `**Operation**: ${issue.operation}\n\n`;
      }
      markdown += `**Severity**: ${issue.severity}\n\n`;
      markdown += `**Timestamp**: ${issue.timestamp}\n\n`;

      markdown += `### Description\n${issue.description}\n\n`;

      markdown += `### Steps to Reproduce\n`;
      issue.stepsToReproduce.forEach((step, i) => {
        markdown += `${i + 1}. ${step}\n`;
      });
      markdown += '\n';

      markdown += `### Expected Behavior\n${issue.expectedBehavior}\n\n`;
      markdown += `### Actual Behavior\n${issue.actualBehavior}\n\n`;
      markdown += `### Proposed Fix\n${issue.proposedFix}\n\n`;

      if (issue.sourceFiles && issue.sourceFiles.length > 0) {
        markdown += `### Suspected Source Files\n`;
        issue.sourceFiles.forEach((file) => {
          markdown += `- \`${file}\`\n`;
        });
        markdown += '\n';
      }

      if (issue.screenshot) {
        markdown += `### Screenshot\n![Issue Screenshot](${issue.screenshot})\n\n`;
      }

      markdown += `### Fix Status\n`;
      markdown += `- [ ] Fix implemented in code\n`;
      markdown += `- [ ] Lint/tests passing\n`;
      markdown += `- [ ] Verified in browser\n\n`;

      markdown += '---\n\n';
    });

    // Summary statistics
    markdown += '## Summary\n\n';
    const severityCounts = this.issues.reduce((acc, issue) => {
      acc[issue.severity] = (acc[issue.severity] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    markdown += '### Issues by Severity\n';
    Object.entries(severityCounts).forEach(([severity, count]) => {
      markdown += `- ${severity}: ${count}\n`;
    });
    markdown += '\n';

    const typeCounts = this.issues.reduce((acc, issue) => {
      acc[issue.type] = (acc[issue.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    markdown += '### Issues by Type\n';
    Object.entries(typeCounts).forEach(([type, count]) => {
      markdown += `- ${type}: ${count}\n`;
    });
    markdown += '\n';

    fs.writeFileSync(reportPath, markdown);
    console.log(`Issue report saved to: ${reportPath}`);
  }

  getIssues(): Issue[] {
    return this.issues;
  }

  getIssueCount(): number {
    return this.issues.length;
  }

  getSeverityCounts(): Record<string, number> {
    return this.issues.reduce((acc, issue) => {
      acc[issue.severity] = (acc[issue.severity] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }
}
