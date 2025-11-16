"use client";

import { useState } from "react";
import { TiptapEditorWithAutosave } from "@/components/editor/tiptap-editor-with-autosave";

export default function AutosaveEditorDemoPage() {
  const [savedContent, setSavedContent] = useState("");
  const [saveCount, setSaveCount] = useState(0);

  const handleSave = async (content: string) => {
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 500));
    setSavedContent(content);
    setSaveCount((prev) => prev + 1);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Auto-Save Editor Demo</h1>
          <p className="mt-2 text-sm text-gray-600">
            Content automatically saves 2 seconds after you stop typing
          </p>
          <p className="mt-1 text-xs text-gray-500">
            Total saves: <span className="font-medium">{saveCount}</span>
          </p>
        </div>

        <div className="rounded-lg bg-white p-6 shadow">
          <h2 className="mb-4 text-lg font-medium text-gray-900">Editor with Auto-Save</h2>
          <TiptapEditorWithAutosave
            onSave={handleSave}
            placeholder="Start typing... Content will auto-save after 2 seconds of inactivity"
            autoSaveDelay={2000}
          />
        </div>

        <div className="mt-8 space-y-4">
          <div className="rounded-lg bg-white p-6 shadow">
            <h2 className="mb-4 text-lg font-medium text-gray-900">Markdown Shortcuts Reference</h2>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <h3 className="mb-2 font-medium text-gray-900">Text Formatting</h3>
                <ul className="space-y-1 text-sm text-gray-600">
                  <li>
                    <code className="rounded bg-gray-100 px-1 text-xs">**bold**</code> →{" "}
                    <strong>bold</strong>
                  </li>
                  <li>
                    <code className="rounded bg-gray-100 px-1 text-xs">*italic*</code> →{" "}
                    <em>italic</em>
                  </li>
                  <li>
                    <code className="rounded bg-gray-100 px-1 text-xs">~~strike~~</code> →{" "}
                    <s>strikethrough</s>
                  </li>
                  <li>
                    <code className="rounded bg-gray-100 px-1 text-xs">`code`</code> →{" "}
                    <code>inline code</code>
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="mb-2 font-medium text-gray-900">Headings</h3>
                <ul className="space-y-1 text-sm text-gray-600">
                  <li>
                    <code className="rounded bg-gray-100 px-1 text-xs"># Heading 1</code>
                  </li>
                  <li>
                    <code className="rounded bg-gray-100 px-1 text-xs">## Heading 2</code>
                  </li>
                  <li>
                    <code className="rounded bg-gray-100 px-1 text-xs">### Heading 3</code>
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="mb-2 font-medium text-gray-900">Lists</h3>
                <ul className="space-y-1 text-sm text-gray-600">
                  <li>
                    <code className="rounded bg-gray-100 px-1 text-xs">- item</code> → bullet list
                  </li>
                  <li>
                    <code className="rounded bg-gray-100 px-1 text-xs">1. item</code> → numbered
                    list
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="mb-2 font-medium text-gray-900">Blocks</h3>
                <ul className="space-y-1 text-sm text-gray-600">
                  <li>
                    <code className="rounded bg-gray-100 px-1 text-xs">```language</code> → code
                    block
                  </li>
                  <li>
                    <code className="rounded bg-gray-100 px-1 text-xs">&gt; quote</code> →
                    blockquote
                  </li>
                  <li>
                    <code className="rounded bg-gray-100 px-1 text-xs">---</code> → horizontal rule
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {savedContent && (
            <div className="rounded-lg bg-white p-6 shadow">
              <h2 className="mb-4 text-lg font-medium text-gray-900">Last Saved Content</h2>
              <div className="overflow-auto rounded bg-gray-900 p-4">
                <pre className="text-xs text-gray-100">
                  <code>{savedContent}</code>
                </pre>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
