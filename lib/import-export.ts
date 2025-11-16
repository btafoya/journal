import { Entry, Category, Attachment, Workspace } from "@prisma/client";
import { decryptEntryContent, encryptEntryContent } from "./encryption";
import { decryptFile } from "./file-encryption";

// ============================================
// TYPES AND INTERFACES
// ============================================

export interface ExportedEntry {
  id: string;
  title: string;
  content: string; // Decrypted content
  wordCount: number;
  charCount: number;
  published: boolean;
  categories: string[]; // Category names
  workspace: string | null; // Workspace name
  attachments: ExportedAttachment[];
  createdAt: string;
  updatedAt: string;
}

export interface ExportedAttachment {
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  data: string; // Base64 encoded decrypted data
}

export interface ExportedCategory {
  id: string;
  name: string;
  description: string | null;
  color: string | null;
  icon: string | null;
  parentId: string | null;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface ExportedWorkspace {
  id: string;
  name: string;
  description: string | null;
  type: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface FullExport {
  version: string;
  exportDate: string;
  entries: ExportedEntry[];
  categories: ExportedCategory[];
  workspaces: ExportedWorkspace[];
}

export interface ImportResult {
  success: boolean;
  entriesImported: number;
  categoriesImported: number;
  attachmentsImported: number;
  errors: string[];
}

export interface EvernoteNote {
  title: string;
  content: string; // HTML content
  created: Date;
  updated: Date;
  tags: string[];
  resources: EvernoteResource[]; // Attachments
}

export interface EvernoteResource {
  data: string; // Base64 encoded
  mime: string;
  filename?: string;
}

// ============================================
// MARKDOWN UTILITIES
// ============================================

/**
 * Convert entry to Markdown format with frontmatter
 */
export function entryToMarkdown(entry: ExportedEntry): string {
  const frontmatter = `---
title: ${entry.title}
created: ${entry.createdAt}
updated: ${entry.updatedAt}
categories: ${entry.categories.join(", ")}
${entry.workspace ? `workspace: ${entry.workspace}` : ""}
published: ${entry.published}
wordCount: ${entry.wordCount}
---

`;

  // Convert HTML content to Markdown (basic conversion)
  let markdown = entry.content;

  // Basic HTML to Markdown conversions
  markdown = markdown
    .replace(/<h1>(.*?)<\/h1>/gi, "# $1\n")
    .replace(/<h2>(.*?)<\/h2>/gi, "## $1\n")
    .replace(/<h3>(.*?)<\/h3>/gi, "### $1\n")
    .replace(/<h4>(.*?)<\/h4>/gi, "#### $1\n")
    .replace(/<h5>(.*?)<\/h5>/gi, "##### $1\n")
    .replace(/<h6>(.*?)<\/h6>/gi, "###### $1\n")
    .replace(/<strong>(.*?)<\/strong>/gi, "**$1**")
    .replace(/<b>(.*?)<\/b>/gi, "**$1**")
    .replace(/<em>(.*?)<\/em>/gi, "*$1*")
    .replace(/<i>(.*?)<\/i>/gi, "*$1*")
    .replace(/<code>(.*?)<\/code>/gi, "`$1`")
    .replace(/<pre><code>(.*?)<\/code><\/pre>/gis, "```\n$1\n```")
    .replace(/<a href="(.*?)">(.*?)<\/a>/gi, "[$2]($1)")
    .replace(/<ul>/gi, "")
    .replace(/<\/ul>/gi, "\n")
    .replace(/<ol>/gi, "")
    .replace(/<\/ol>/gi, "\n")
    .replace(/<li>(.*?)<\/li>/gi, "- $1\n")
    .replace(/<p>(.*?)<\/p>/gi, "$1\n\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, ""); // Remove any remaining HTML tags

  return frontmatter + markdown.trim();
}

/**
 * Parse Markdown with frontmatter into entry data
 */
export function markdownToEntry(markdown: string): Partial<ExportedEntry> {
  const frontmatterRegex = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/;
  const match = markdown.match(frontmatterRegex);

  if (!match) {
    // No frontmatter, treat entire content as entry content
    return {
      content: markdownToHtml(markdown),
      wordCount: markdown.split(/\s+/).length,
      charCount: markdown.length,
    };
  }

  const [, frontmatterText, content] = match;
  const frontmatter: Record<string, any> = {};

  // Parse frontmatter
  frontmatterText.split("\n").forEach((line) => {
    const [key, ...valueParts] = line.split(":");
    if (key && valueParts.length > 0) {
      const value = valueParts.join(":").trim();
      frontmatter[key.trim()] = value;
    }
  });

  return {
    title: frontmatter.title || "Untitled",
    content: markdownToHtml(content.trim()),
    categories: frontmatter.categories
      ? frontmatter.categories.split(",").map((c: string) => c.trim())
      : [],
    published: frontmatter.published === "true",
    createdAt: frontmatter.created,
    updatedAt: frontmatter.updated,
    wordCount: content.split(/\s+/).length,
    charCount: content.length,
  };
}

/**
 * Convert Markdown to HTML (basic conversion)
 */
function markdownToHtml(markdown: string): string {
  let html = markdown;

  // Headers
  html = html.replace(/^######\s+(.*)$/gm, "<h6>$1</h6>");
  html = html.replace(/^#####\s+(.*)$/gm, "<h5>$1</h5>");
  html = html.replace(/^####\s+(.*)$/gm, "<h4>$1</h4>");
  html = html.replace(/^###\s+(.*)$/gm, "<h3>$1</h3>");
  html = html.replace(/^##\s+(.*)$/gm, "<h2>$1</h2>");
  html = html.replace(/^#\s+(.*)$/gm, "<h1>$1</h1>");

  // Bold and italic
  html = html.replace(/\*\*\*(.+?)\*\*\*/g, "<strong><em>$1</em></strong>");
  html = html.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/\*(.+?)\*/g, "<em>$1</em>");
  html = html.replace(/___(.+?)___/g, "<strong><em>$1</em></strong>");
  html = html.replace(/__(.+?)__/g, "<strong>$1</strong>");
  html = html.replace(/_(.+?)_/g, "<em>$1</em>");

  // Code blocks
  html = html.replace(/```([\s\S]*?)```/g, "<pre><code>$1</code></pre>");
  html = html.replace(/`(.+?)`/g, "<code>$1</code>");

  // Links
  html = html.replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2">$1</a>');

  // Lists
  html = html.replace(/^\* (.*)$/gm, "<li>$1</li>");
  html = html.replace(/^- (.*)$/gm, "<li>$1</li>");
  html = html.replace(/(<li>.*<\/li>\n?)+/g, "<ul>$&</ul>");

  // Paragraphs
  html = html.replace(/^(?!<[huo]|<\/|<li|<pre)(.+)$/gm, "<p>$1</p>");

  return html;
}

// ============================================
// EVERNOTE (.ENEX) UTILITIES
// ============================================

/**
 * Parse Evernote .enex XML format
 * This is a simplified parser - production version would use xml2js
 */
export function parseEvernoteEnex(xml: string): EvernoteNote[] {
  const notes: EvernoteNote[] = [];

  // Simple regex-based parsing (for production, use a proper XML parser)
  const noteRegex = /<note>([\s\S]*?)<\/note>/g;
  let noteMatch;

  while ((noteMatch = noteRegex.exec(xml)) !== null) {
    const noteXml = noteMatch[1];

    // Extract title
    const titleMatch = noteXml.match(/<title>(.*?)<\/title>/);
    const title = titleMatch ? titleMatch[1] : "Untitled";

    // Extract content (CDATA section)
    const contentMatch = noteXml.match(/<content><!\[CDATA\[([\s\S]*?)\]\]><\/content>/);
    const content = contentMatch ? contentMatch[1] : "";

    // Extract created date
    const createdMatch = noteXml.match(/<created>(.*?)<\/created>/);
    const created = createdMatch ? new Date(createdMatch[1]) : new Date();

    // Extract updated date
    const updatedMatch = noteXml.match(/<updated>(.*?)<\/updated>/);
    const updated = updatedMatch ? new Date(updatedMatch[1]) : created;

    // Extract tags
    const tags: string[] = [];
    const tagRegex = /<tag>(.*?)<\/tag>/g;
    let tagMatch;
    while ((tagMatch = tagRegex.exec(noteXml)) !== null) {
      tags.push(tagMatch[1]);
    }

    // Extract resources (attachments)
    const resources: EvernoteResource[] = [];
    const resourceRegex = /<resource>([\s\S]*?)<\/resource>/g;
    let resourceMatch;
    while ((resourceMatch = resourceRegex.exec(noteXml)) !== null) {
      const resourceXml = resourceMatch[1];

      const dataMatch = resourceXml.match(/<data encoding="base64">([\s\S]*?)<\/data>/);
      const mimeMatch = resourceXml.match(/<mime>(.*?)<\/mime>/);
      const filenameMatch = resourceXml.match(/<file-name>(.*?)<\/file-name>/);

      if (dataMatch && mimeMatch) {
        resources.push({
          data: dataMatch[1].replace(/\s+/g, ""), // Remove whitespace from base64
          mime: mimeMatch[1],
          filename: filenameMatch ? filenameMatch[1] : undefined,
        });
      }
    }

    notes.push({
      title,
      content: cleanEvernoteHtml(content),
      created,
      updated,
      tags,
      resources,
    });
  }

  return notes;
}

/**
 * Clean Evernote HTML to standard HTML
 */
function cleanEvernoteHtml(html: string): string {
  // Remove Evernote-specific tags and attributes
  let cleaned = html
    .replace(/<en-note>/gi, "")
    .replace(/<\/en-note>/gi, "")
    .replace(/<en-media[^>]*\/>/gi, "") // Remove media references (will be handled separately)
    .replace(/\s+style="[^"]*"/gi, "") // Remove inline styles
    .replace(/\s+class="[^"]*"/gi, ""); // Remove classes

  return cleaned.trim();
}

// ============================================
// PDF EXPORT UTILITIES
// ============================================

/**
 * Generate PDF-ready HTML with styling
 */
export function entryToPdfHtml(entry: ExportedEntry): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${entry.title}</title>
  <style>
    @page {
      margin: 2cm;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      font-size: 12pt;
      line-height: 1.6;
      color: #333;
      max-width: 800px;
      margin: 0 auto;
    }
    h1 { font-size: 24pt; margin-bottom: 0.5em; border-bottom: 2px solid #333; }
    h2 { font-size: 20pt; margin-top: 1em; }
    h3 { font-size: 16pt; margin-top: 0.8em; }
    code {
      background: #f5f5f5;
      padding: 2px 4px;
      border-radius: 3px;
      font-family: "Courier New", monospace;
    }
    pre {
      background: #f5f5f5;
      padding: 1em;
      border-radius: 5px;
      overflow-x: auto;
    }
    blockquote {
      border-left: 4px solid #ddd;
      margin-left: 0;
      padding-left: 1em;
      color: #666;
    }
    .metadata {
      color: #666;
      font-size: 10pt;
      margin-bottom: 2em;
      padding-bottom: 1em;
      border-bottom: 1px solid #ddd;
    }
    .footer {
      margin-top: 3em;
      padding-top: 1em;
      border-top: 1px solid #ddd;
      color: #666;
      font-size: 10pt;
    }
  </style>
</head>
<body>
  <h1>${entry.title}</h1>
  <div class="metadata">
    <p>
      <strong>Created:</strong> ${new Date(entry.createdAt).toLocaleDateString()}<br>
      <strong>Updated:</strong> ${new Date(entry.updatedAt).toLocaleDateString()}<br>
      ${entry.categories.length > 0 ? `<strong>Categories:</strong> ${entry.categories.join(", ")}<br>` : ""}
      ${entry.workspace ? `<strong>Workspace:</strong> ${entry.workspace}<br>` : ""}
      <strong>Words:</strong> ${entry.wordCount} | <strong>Characters:</strong> ${entry.charCount}
    </p>
  </div>

  ${entry.content}

  ${entry.attachments.length > 0 ? `
  <div class="footer">
    <strong>Attachments (${entry.attachments.length}):</strong>
    <ul>
      ${entry.attachments.map((att) => `<li>${att.originalName} (${(att.size / 1024).toFixed(2)} KB)</li>`).join("")}
    </ul>
  </div>
  ` : ""}
</body>
</html>`;
}

// ============================================
// JSON EXPORT UTILITIES
// ============================================

/**
 * Create a complete JSON export of all data
 */
export function createFullExport(
  entries: ExportedEntry[],
  categories: ExportedCategory[],
  workspaces: ExportedWorkspace[]
): FullExport {
  return {
    version: "1.0",
    exportDate: new Date().toISOString(),
    entries,
    categories,
    workspaces,
  };
}

/**
 * Parse and validate JSON import
 */
export function parseFullExport(jsonString: string): FullExport {
  const data = JSON.parse(jsonString);

  if (!data.version || !data.entries || !Array.isArray(data.entries)) {
    throw new Error("Invalid export format");
  }

  return data as FullExport;
}

// ============================================
// HTML EXPORT UTILITIES
// ============================================

/**
 * Convert entry to standalone HTML file
 */
export function entryToStandaloneHtml(entry: ExportedEntry): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${entry.title}</title>
  <style>
    :root {
      --bg-color: #ffffff;
      --text-color: #1a1a1a;
      --border-color: #e5e7eb;
      --accent-color: #3b82f6;
    }
    @media (prefers-color-scheme: dark) {
      :root {
        --bg-color: #1a1a1a;
        --text-color: #f3f4f6;
        --border-color: #374151;
      }
    }
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      line-height: 1.6;
      color: var(--text-color);
      background-color: var(--bg-color);
      padding: 2rem;
    }
    .container {
      max-width: 800px;
      margin: 0 auto;
    }
    header {
      margin-bottom: 2rem;
      padding-bottom: 1rem;
      border-bottom: 2px solid var(--border-color);
    }
    h1 {
      font-size: 2.5rem;
      margin-bottom: 1rem;
    }
    .metadata {
      display: flex;
      flex-wrap: wrap;
      gap: 1rem;
      font-size: 0.875rem;
      color: #6b7280;
    }
    .metadata-item {
      display: flex;
      align-items: center;
      gap: 0.25rem;
    }
    .tag {
      display: inline-block;
      padding: 0.25rem 0.75rem;
      background-color: var(--accent-color);
      color: white;
      border-radius: 9999px;
      font-size: 0.75rem;
      margin-right: 0.5rem;
    }
    .content {
      margin: 2rem 0;
    }
    .content img {
      max-width: 100%;
      height: auto;
      border-radius: 0.5rem;
    }
    .content code {
      background-color: #f3f4f6;
      padding: 0.125rem 0.25rem;
      border-radius: 0.25rem;
      font-family: "Courier New", monospace;
      font-size: 0.875em;
    }
    .content pre {
      background-color: #f3f4f6;
      padding: 1rem;
      border-radius: 0.5rem;
      overflow-x: auto;
      margin: 1rem 0;
    }
    .content pre code {
      background-color: transparent;
      padding: 0;
    }
    footer {
      margin-top: 3rem;
      padding-top: 1rem;
      border-top: 1px solid var(--border-color);
      font-size: 0.875rem;
      color: #6b7280;
    }
    .attachments {
      margin-top: 2rem;
    }
    .attachment-list {
      list-style: none;
      padding: 0;
    }
    .attachment-item {
      padding: 0.5rem;
      margin: 0.5rem 0;
      background-color: #f9fafb;
      border-radius: 0.25rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <h1>${entry.title}</h1>
      <div class="metadata">
        <div class="metadata-item">
          <span>📅</span>
          <span>Created ${new Date(entry.createdAt).toLocaleDateString()}</span>
        </div>
        <div class="metadata-item">
          <span>✏️</span>
          <span>Updated ${new Date(entry.updatedAt).toLocaleDateString()}</span>
        </div>
        <div class="metadata-item">
          <span>📊</span>
          <span>${entry.wordCount} words, ${entry.charCount} characters</span>
        </div>
      </div>
      ${
        entry.categories.length > 0
          ? `
      <div style="margin-top: 1rem;">
        ${entry.categories.map((cat) => `<span class="tag">${cat}</span>`).join("")}
      </div>
      `
          : ""
      }
    </header>

    <article class="content">
      ${entry.content}
    </article>

    ${
      entry.attachments.length > 0
        ? `
    <section class="attachments">
      <h2>Attachments</h2>
      <ul class="attachment-list">
        ${entry.attachments
          .map(
            (att) => `
        <li class="attachment-item">
          <span>📎</span>
          <span>${att.originalName}</span>
          <span style="margin-left: auto; font-size: 0.75rem; color: #6b7280;">
            ${(att.size / 1024).toFixed(2)} KB
          </span>
        </li>
        `
          )
          .join("")}
      </ul>
    </section>
    `
        : ""
    }

    <footer>
      <p>Exported from OpenJournal on ${new Date().toLocaleDateString()}</p>
    </footer>
  </div>
</body>
</html>`;
}
