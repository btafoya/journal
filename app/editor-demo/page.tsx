"use client";

import { useState } from "react";
import { TiptapEditor } from "@/components/editor/tiptap-editor";

export default function EditorDemoPage() {
  const [content, setContent] = useState(`
<h1>Welcome to OpenJournal Editor</h1>

<p>This is a <strong>rich text editor</strong> built with <em>Tiptap</em>. Try out the features:</p>

<h2>Text Formatting</h2>
<p>You can make text <strong>bold</strong>, <em>italic</em>, or <s>strikethrough</s>. You can also use <code>inline code</code> for technical terms.</p>

<h2>Lists</h2>
<ul>
  <li>Unordered list item 1</li>
  <li>Unordered list item 2</li>
  <li>Unordered list item 3</li>
</ul>

<ol>
  <li>Ordered list item 1</li>
  <li>Ordered list item 2</li>
  <li>Ordered list item 3</li>
</ol>

<h2>Code Blocks</h2>
<p>Perfect for documenting code snippets:</p>

<pre><code class="language-typescript">function greet(name: string): string {
  return \`Hello, \${name}!\`;
}

console.log(greet("World"));
</code></pre>

<h2>Blockquotes</h2>
<blockquote>
  <p>"The only way to do great work is to love what you do." - Steve Jobs</p>
</blockquote>

<h2>Horizontal Rules</h2>
<p>Use horizontal rules to separate sections:</p>
<hr>
<p>Content continues here...</p>

<h3>Keyboard Shortcuts</h3>
<p>Try these markdown-style shortcuts:</p>
<ul>
  <li><strong>Bold:</strong> Ctrl+B</li>
  <li><strong>Italic:</strong> Ctrl+I</li>
  <li><strong>Undo:</strong> Ctrl+Z</li>
  <li><strong>Redo:</strong> Ctrl+Shift+Z</li>
</ul>
  `);

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Rich Text Editor Demo</h1>
          <p className="mt-2 text-sm text-gray-600">Test the Tiptap editor with all its features</p>
        </div>

        <div className="rounded-lg bg-white p-6 shadow">
          <TiptapEditor
            content={content}
            onChange={setContent}
            placeholder="Start writing your journal entry..."
          />
        </div>

        <div className="mt-8 rounded-lg bg-white p-6 shadow">
          <h2 className="mb-4 text-lg font-medium text-gray-900">HTML Output</h2>
          <div className="overflow-auto rounded bg-gray-900 p-4">
            <pre className="text-xs text-gray-100">
              <code>{content}</code>
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
