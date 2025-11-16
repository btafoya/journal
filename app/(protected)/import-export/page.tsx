"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

type ImportFormat = "evernote" | "enex" | "markdown" | "md" | "html" | "json";
type ExportFormat = "markdown" | "pdf" | "html" | "json";

interface ImportResult {
  success: boolean;
  entriesImported: number;
  categoriesImported: number;
  attachmentsImported: number;
  errors: string[];
}

export default function ImportExportPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"import" | "export">("import");

  // Import state
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importFormat, setImportFormat] = useState<ImportFormat>("markdown");
  const [importWorkspaceId, setImportWorkspaceId] = useState<string>("");
  const [importProgress, setImportProgress] = useState<number>(0);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  // Export state
  const [exportFormat, setExportFormat] = useState<ExportFormat>("markdown");
  const [exportEntryIds, setExportEntryIds] = useState<string>("");
  const [exportWorkspaceId, setExportWorkspaceId] = useState<string>("");
  const [exportCategoryId, setExportCategoryId] = useState<string>("");
  const [isExporting, setIsExporting] = useState(false);

  const handleImport = async () => {
    if (!importFile) {
      alert("Please select a file to import");
      return;
    }

    setIsImporting(true);
    setImportProgress(0);
    setImportResult(null);

    try {
      const formData = new FormData();
      formData.append("file", importFile);
      formData.append("format", importFormat);
      if (importWorkspaceId) {
        formData.append("workspaceId", importWorkspaceId);
      }

      const response = await fetch("/api/import", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Import failed: ${response.statusText}`);
      }

      const result: ImportResult = await response.json();
      setImportResult(result);
      setImportProgress(100);

      if (result.success) {
        setTimeout(() => {
          router.push("/dashboard");
        }, 2000);
      }
    } catch (error: any) {
      setImportResult({
        success: false,
        entriesImported: 0,
        categoriesImported: 0,
        attachmentsImported: 0,
        errors: [error.message],
      });
    } finally {
      setIsImporting(false);
    }
  };

  const handleExport = async () => {
    setIsExporting(true);

    try {
      const params = new URLSearchParams();
      params.append("format", exportFormat);

      if (exportEntryIds) {
        params.append("entryIds", exportEntryIds);
      }
      if (exportWorkspaceId) {
        params.append("workspaceId", exportWorkspaceId);
      }
      if (exportCategoryId) {
        params.append("categoryId", exportCategoryId);
      }

      const response = await fetch(`/api/export?${params.toString()}`);

      if (!response.ok) {
        throw new Error(`Export failed: ${response.statusText}`);
      }

      // Get the filename from Content-Disposition header
      const contentDisposition = response.headers.get("Content-Disposition");
      let filename = `openjournal-export-${Date.now()}`;

      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?(.+)"?/);
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
      }

      // Download the file
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error: any) {
      alert(`Export failed: ${error.message}`);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8">Import/Export Data</h1>

      {/* Tab Navigation */}
      <div className="flex border-b mb-8">
        <button
          onClick={() => setActiveTab("import")}
          className={`px-6 py-3 font-medium transition-colors ${
            activeTab === "import"
              ? "border-b-2 border-blue-600 text-blue-600"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          Import
        </button>
        <button
          onClick={() => setActiveTab("export")}
          className={`px-6 py-3 font-medium transition-colors ${
            activeTab === "export"
              ? "border-b-2 border-blue-600 text-blue-600"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          Export
        </button>
      </div>

      {/* Import Tab */}
      {activeTab === "import" && (
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold mb-4">Import Journal Data</h2>
            <p className="text-gray-600 mb-6">
              Import your journal entries from various formats including Evernote, Markdown, HTML, and JSON.
            </p>
          </div>

          {/* Format Selection */}
          <div>
            <label className="block text-sm font-medium mb-2">Import Format</label>
            <select
              value={importFormat}
              onChange={(e) => setImportFormat(e.target.value as ImportFormat)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isImporting}
            >
              <option value="evernote">Evernote (.enex)</option>
              <option value="markdown">Markdown (.md)</option>
              <option value="html">HTML (.html)</option>
              <option value="json">JSON (.json)</option>
            </select>
          </div>

          {/* File Upload */}
          <div>
            <label className="block text-sm font-medium mb-2">Select File</label>
            <input
              type="file"
              onChange={(e) => setImportFile(e.target.files?.[0] || null)}
              accept={
                importFormat === "evernote" || importFormat === "enex"
                  ? ".enex"
                  : importFormat === "markdown" || importFormat === "md"
                  ? ".md,.txt"
                  : importFormat === "html"
                  ? ".html,.htm"
                  : ".json"
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isImporting}
            />
            {importFile && (
              <p className="mt-2 text-sm text-gray-600">
                Selected: {importFile.name} ({(importFile.size / 1024).toFixed(2)} KB)
              </p>
            )}
          </div>

          {/* Workspace Selection (Optional) */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Target Workspace (Optional)
            </label>
            <input
              type="text"
              value={importWorkspaceId}
              onChange={(e) => setImportWorkspaceId(e.target.value)}
              placeholder="Leave empty for default workspace"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isImporting}
            />
          </div>

          {/* Import Button */}
          <button
            onClick={handleImport}
            disabled={!importFile || isImporting}
            className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            {isImporting ? "Importing..." : "Import Data"}
          </button>

          {/* Progress Bar */}
          {isImporting && (
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${importProgress}%` }}
              />
            </div>
          )}

          {/* Import Results */}
          {importResult && (
            <div
              className={`p-6 rounded-lg ${
                importResult.success
                  ? "bg-green-50 border border-green-200"
                  : "bg-red-50 border border-red-200"
              }`}
            >
              <h3
                className={`font-semibold mb-3 ${
                  importResult.success ? "text-green-900" : "text-red-900"
                }`}
              >
                {importResult.success ? "✓ Import Successful" : "✗ Import Failed"}
              </h3>
              <div className="space-y-2 text-sm">
                <p>
                  <strong>Entries:</strong> {importResult.entriesImported}
                </p>
                <p>
                  <strong>Categories:</strong> {importResult.categoriesImported}
                </p>
                <p>
                  <strong>Attachments:</strong> {importResult.attachmentsImported}
                </p>
                {importResult.errors.length > 0 && (
                  <div className="mt-4">
                    <strong className="text-red-900">Errors:</strong>
                    <ul className="list-disc list-inside mt-2 text-red-800">
                      {importResult.errors.map((error, idx) => (
                        <li key={idx}>{error}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
              {importResult.success && (
                <p className="mt-4 text-sm text-green-800">
                  Redirecting to dashboard in 2 seconds...
                </p>
              )}
            </div>
          )}

          {/* Format Info */}
          <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">Format Information</h4>
            <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
              {importFormat === "evernote" || importFormat === "enex" ? (
                <>
                  <li>Supports Evernote .enex export files</li>
                  <li>Preserves creation/modification dates</li>
                  <li>Imports attachments (images, files)</li>
                  <li>Tags are converted to categories</li>
                </>
              ) : importFormat === "markdown" || importFormat === "md" ? (
                <>
                  <li>Supports standard Markdown with frontmatter</li>
                  <li>Multiple entries separated by "---"</li>
                  <li>Frontmatter for metadata (title, date, categories)</li>
                  <li>Plain text format, widely compatible</li>
                </>
              ) : importFormat === "html" ? (
                <>
                  <li>Imports HTML documents</li>
                  <li>Extracts title from &lt;title&gt; tag</li>
                  <li>Extracts content from &lt;body&gt; tag</li>
                  <li>Preserves HTML formatting</li>
                </>
              ) : (
                <>
                  <li>Complete backup format</li>
                  <li>Includes entries, categories, and workspaces</li>
                  <li>Preserves all metadata and relationships</li>
                  <li>Best for full data migration</li>
                </>
              )}
            </ul>
          </div>
        </div>
      )}

      {/* Export Tab */}
      {activeTab === "export" && (
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold mb-4">Export Journal Data</h2>
            <p className="text-gray-600 mb-6">
              Export your journal entries to various formats for backup or migration.
            </p>
          </div>

          {/* Format Selection */}
          <div>
            <label className="block text-sm font-medium mb-2">Export Format</label>
            <select
              value={exportFormat}
              onChange={(e) => setExportFormat(e.target.value as ExportFormat)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isExporting}
            >
              <option value="markdown">Markdown (.md)</option>
              <option value="pdf">PDF (via HTML)</option>
              <option value="html">HTML (.html)</option>
              <option value="json">JSON (.json)</option>
            </select>
          </div>

          {/* Filter Options */}
          <div className="bg-gray-50 border border-gray-200 p-4 rounded-lg space-y-4">
            <h3 className="font-medium text-gray-900">Export Filters (Optional)</h3>
            <p className="text-sm text-gray-600">
              Leave all filters empty to export all your entries.
            </p>

            <div>
              <label className="block text-sm font-medium mb-2">
                Specific Entry IDs (comma-separated)
              </label>
              <input
                type="text"
                value={exportEntryIds}
                onChange={(e) => setExportEntryIds(e.target.value)}
                placeholder="e.g., abc123,def456,ghi789"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={isExporting}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Workspace ID</label>
              <input
                type="text"
                value={exportWorkspaceId}
                onChange={(e) => setExportWorkspaceId(e.target.value)}
                placeholder="Export entries from a specific workspace"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={isExporting}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Category ID</label>
              <input
                type="text"
                value={exportCategoryId}
                onChange={(e) => setExportCategoryId(e.target.value)}
                placeholder="Export entries from a specific category"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={isExporting}
              />
            </div>
          </div>

          {/* Export Button */}
          <button
            onClick={handleExport}
            disabled={isExporting}
            className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            {isExporting ? "Exporting..." : "Export Data"}
          </button>

          {/* Format Info */}
          <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">Format Information</h4>
            <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
              {exportFormat === "markdown" ? (
                <>
                  <li>Plain text format with Markdown syntax</li>
                  <li>Frontmatter metadata for each entry</li>
                  <li>Multiple entries separated by "---"</li>
                  <li>Widely compatible and human-readable</li>
                </>
              ) : exportFormat === "pdf" ? (
                <>
                  <li>Generates HTML optimized for printing</li>
                  <li>Use browser's "Print to PDF" function</li>
                  <li>Professional formatting with page breaks</li>
                  <li>Includes all metadata and styling</li>
                </>
              ) : exportFormat === "html" ? (
                <>
                  <li>Standalone HTML documents</li>
                  <li>Can be opened in any web browser</li>
                  <li>Dark mode support included</li>
                  <li>Preserves formatting and styling</li>
                </>
              ) : (
                <>
                  <li>Complete backup in JSON format</li>
                  <li>Includes all entries, categories, workspaces</li>
                  <li>Preserves all metadata and relationships</li>
                  <li>Best for re-importing or data migration</li>
                </>
              )}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
