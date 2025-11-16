import { describe, it, expect, beforeAll, afterAll } from "@jest/globals";
import {
  entryToMarkdown,
  markdownToEntry,
  parseEvernoteEnex,
  entryToPdfHtml,
  entryToStandaloneHtml,
  createFullExport,
  parseFullExport,
  type ExportedEntry,
  type ExportedCategory,
  type ExportedWorkspace,
  type EvernoteNote,
} from "@/lib/import-export";
import fs from "fs";
import path from "path";

describe("Import/Export Functionality", () => {
  const sampleEntry: ExportedEntry = {
    id: "test-entry-1",
    title: "Test Entry",
    content: "<p>This is a <strong>test</strong> entry with HTML content.</p>",
    wordCount: 7,
    charCount: 48,
    published: false,
    categories: ["personal", "testing"],
    workspace: "personal",
    attachments: [],
    createdAt: "2024-01-15T10:00:00Z",
    updatedAt: "2024-01-15T12:00:00Z",
  };

  describe("Markdown Export/Import", () => {
    it("should convert entry to markdown format", () => {
      const markdown = entryToMarkdown(sampleEntry);

      expect(markdown).toContain("---");
      expect(markdown).toContain("title: Test Entry");
      expect(markdown).toContain("date: 2024-01-15");
      expect(markdown).toContain("categories: [personal, testing]");
      expect(markdown).toContain("workspace: personal");
      expect(markdown).toContain("This is a **test** entry");
    });

    it("should parse markdown back to entry format", () => {
      const markdown = entryToMarkdown(sampleEntry);
      const parsed = markdownToEntry(markdown);

      expect(parsed.title).toBe("Test Entry");
      expect(parsed.categories).toEqual(["personal", "testing"]);
      expect(parsed.workspace).toBe("personal");
      expect(parsed.content).toContain("This is a **test** entry");
    });

    it("should handle entries without frontmatter", () => {
      const simpleMarkdown = "# Simple Entry\n\nJust some content.";
      const parsed = markdownToEntry(simpleMarkdown);

      expect(parsed.title).toBe("Untitled");
      expect(parsed.content).toContain("# Simple Entry");
    });

    it("should handle multiple entries separated by ---", () => {
      const multipleEntries = `---
title: Entry 1
date: 2024-01-01
---

Content 1

---

---
title: Entry 2
date: 2024-01-02
---

Content 2`;

      const sections = multipleEntries.split(/\n---\n/);
      expect(sections.length).toBeGreaterThanOrEqual(2);

      const entry1 = markdownToEntry(sections[0]);
      expect(entry1.title).toBe("Entry 1");
    });
  });

  describe("Evernote Import", () => {
    it("should parse Evernote ENEX format", () => {
      const enexPath = path.join(__dirname, "fixtures", "import-test.enex");
      if (!fs.existsSync(enexPath)) {
        console.warn("Skipping test: import-test.enex not found");
        return;
      }

      const enexContent = fs.readFileSync(enexPath, "utf-8");
      const notes = parseEvernoteEnex(enexContent);

      expect(notes.length).toBeGreaterThan(0);

      const firstNote = notes[0];
      expect(firstNote).toHaveProperty("title");
      expect(firstNote).toHaveProperty("content");
      expect(firstNote).toHaveProperty("created");
      expect(firstNote).toHaveProperty("updated");
      expect(firstNote).toHaveProperty("tags");
      expect(firstNote).toHaveProperty("resources");
    });

    it("should clean Evernote HTML content", () => {
      const enexPath = path.join(__dirname, "fixtures", "import-test.enex");
      if (!fs.existsSync(enexPath)) {
        console.warn("Skipping test: import-test.enex not found");
        return;
      }

      const enexContent = fs.readFileSync(enexPath, "utf-8");
      const notes = parseEvernoteEnex(enexContent);

      if (notes.length > 0) {
        const content = notes[0].content;
        expect(content).not.toContain("<?xml");
        expect(content).not.toContain("en-note");
      }
    });

    it("should extract tags from Evernote notes", () => {
      const enexPath = path.join(__dirname, "fixtures", "import-test.enex");
      if (!fs.existsSync(enexPath)) {
        console.warn("Skipping test: import-test.enex not found");
        return;
      }

      const enexContent = fs.readFileSync(enexPath, "utf-8");
      const notes = parseEvernoteEnex(enexContent);

      if (notes.length > 0) {
        expect(notes[0].tags.length).toBeGreaterThan(0);
      }
    });
  });

  describe("PDF Export", () => {
    it("should generate PDF-ready HTML", () => {
      const html = entryToPdfHtml(sampleEntry);

      expect(html).toContain("<html");
      expect(html).toContain("Test Entry");
      expect(html).toContain("page-break-after");
      expect(html).toContain("This is a <strong>test</strong> entry");
    });

    it("should include metadata in PDF HTML", () => {
      const html = entryToPdfHtml(sampleEntry);

      expect(html).toContain("7 words");
      expect(html).toContain("personal");
      expect(html).toContain("testing");
    });
  });

  describe("HTML Export", () => {
    it("should generate standalone HTML", () => {
      const html = entryToStandaloneHtml(sampleEntry);

      expect(html).toContain("<!DOCTYPE html>");
      expect(html).toContain("<title>Test Entry</title>");
      expect(html).toContain("This is a <strong>test</strong> entry");
    });

    it("should include dark mode support", () => {
      const html = entryToStandaloneHtml(sampleEntry);

      expect(html).toContain("prefers-color-scheme: dark");
    });

    it("should include categories in HTML", () => {
      const html = entryToStandaloneHtml(sampleEntry);

      expect(html).toContain("personal");
      expect(html).toContain("testing");
    });
  });

  describe("JSON Export/Import", () => {
    it("should create full JSON export", () => {
      const entries: ExportedEntry[] = [sampleEntry];
      const categories: ExportedCategory[] = [
        {
          id: "cat-1",
          name: "personal",
          description: "Personal entries",
          color: "#3b82f6",
          icon: "user",
          parentId: null,
          order: 0,
          createdAt: "2024-01-01T00:00:00Z",
          updatedAt: "2024-01-01T00:00:00Z",
        },
      ];
      const workspaces: ExportedWorkspace[] = [
        {
          id: "ws-1",
          name: "personal",
          description: "Personal workspace",
          type: "PERSONAL",
          isDefault: true,
          createdAt: "2024-01-01T00:00:00Z",
          updatedAt: "2024-01-01T00:00:00Z",
        },
      ];

      const fullExport = createFullExport(entries, categories, workspaces);

      expect(fullExport).toHaveProperty("version");
      expect(fullExport).toHaveProperty("exportDate");
      expect(fullExport).toHaveProperty("entries");
      expect(fullExport).toHaveProperty("categories");
      expect(fullExport).toHaveProperty("workspaces");
      expect(fullExport.entries).toHaveLength(1);
      expect(fullExport.categories).toHaveLength(1);
      expect(fullExport.workspaces).toHaveLength(1);
    });

    it("should parse JSON export", () => {
      const entries: ExportedEntry[] = [sampleEntry];
      const categories: ExportedCategory[] = [];
      const workspaces: ExportedWorkspace[] = [];

      const fullExport = createFullExport(entries, categories, workspaces);
      const jsonString = JSON.stringify(fullExport);
      const parsed = parseFullExport(jsonString);

      expect(parsed.entries).toHaveLength(1);
      expect(parsed.entries[0].title).toBe("Test Entry");
    });

    it("should maintain data integrity through export/import cycle", () => {
      const entries: ExportedEntry[] = [sampleEntry];
      const categories: ExportedCategory[] = [
        {
          id: "cat-1",
          name: "personal",
          description: null,
          color: "#3b82f6",
          icon: null,
          parentId: null,
          order: 0,
          createdAt: "2024-01-01T00:00:00Z",
          updatedAt: "2024-01-01T00:00:00Z",
        },
      ];
      const workspaces: ExportedWorkspace[] = [];

      const exported = createFullExport(entries, categories, workspaces);
      const jsonString = JSON.stringify(exported);
      const imported = parseFullExport(jsonString);

      expect(imported.entries[0].id).toBe(sampleEntry.id);
      expect(imported.entries[0].title).toBe(sampleEntry.title);
      expect(imported.entries[0].wordCount).toBe(sampleEntry.wordCount);
      expect(imported.categories[0].name).toBe("personal");
    });
  });

  describe("Edge Cases", () => {
    it("should handle empty content", () => {
      const emptyEntry: ExportedEntry = {
        ...sampleEntry,
        content: "",
        wordCount: 0,
        charCount: 0,
      };

      const markdown = entryToMarkdown(emptyEntry);
      expect(markdown).toContain("title: Test Entry");
    });

    it("should handle entries with attachments", () => {
      const entryWithAttachments: ExportedEntry = {
        ...sampleEntry,
        attachments: [
          {
            filename: "image.png",
            originalName: "photo.png",
            mimeType: "image/png",
            size: 1024,
            data: "base64encodeddata",
          },
        ],
      };

      const html = entryToStandaloneHtml(entryWithAttachments);
      expect(html).toContain("1 attachment");
    });

    it("should handle special characters in titles", () => {
      const specialEntry: ExportedEntry = {
        ...sampleEntry,
        title: 'Test "Entry" with <special> & characters',
      };

      const markdown = entryToMarkdown(specialEntry);
      expect(markdown).toContain('title: Test "Entry" with <special> & characters');
    });

    it("should handle null/undefined values gracefully", () => {
      const minimalEntry: ExportedEntry = {
        id: "minimal",
        title: "Minimal",
        content: "Content",
        wordCount: 1,
        charCount: 7,
        published: false,
        categories: [],
        workspace: null,
        attachments: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const markdown = entryToMarkdown(minimalEntry);
      expect(markdown).toBeTruthy();

      const html = entryToStandaloneHtml(minimalEntry);
      expect(html).toBeTruthy();
    });
  });

  describe("Performance", () => {
    it("should handle large content efficiently", () => {
      const largeContent = "<p>" + "Lorem ipsum ".repeat(10000) + "</p>";
      const largeEntry: ExportedEntry = {
        ...sampleEntry,
        content: largeContent,
        wordCount: 20000,
        charCount: largeContent.length,
      };

      const startTime = Date.now();
      const markdown = entryToMarkdown(largeEntry);
      const endTime = Date.now();

      expect(markdown).toBeTruthy();
      expect(endTime - startTime).toBeLessThan(1000); // Should complete in <1s
    });

    it("should handle many entries efficiently", () => {
      const entries: ExportedEntry[] = Array.from({ length: 100 }, (_, i) => ({
        ...sampleEntry,
        id: `entry-${i}`,
        title: `Entry ${i}`,
      }));

      const startTime = Date.now();
      const fullExport = createFullExport(entries, [], []);
      const endTime = Date.now();

      expect(fullExport.entries).toHaveLength(100);
      expect(endTime - startTime).toBeLessThan(1000); // Should complete in <1s
    });
  });
});
