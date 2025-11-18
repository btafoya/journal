"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { CategoryPicker } from "@/components/categories/category-picker";

// Dynamically import the TiptapEditor to avoid SSR issues
const TiptapEditor = dynamic(
  () => import("@/components/editor/tiptap-editor").then((mod) => mod.TiptapEditor),
  { ssr: false }
);

interface EntryTemplate {
  id: string;
  name: string;
  description: string | null;
  content: string;
}

export default function NewEntryPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [templateId, setTemplateId] = useState<string>("");
  const [published, setPublished] = useState(false);
  const [categoryIds, setCategoryIds] = useState<string[]>([]);
  const [templates, setTemplates] = useState<EntryTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/templates");
      if (!response.ok) {
        throw new Error("Failed to fetch templates");
      }
      const data = await response.json();
      setTemplates(data.templates);
    } catch (error) {
      console.error("Error fetching templates:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleTemplateChange = (selectedTemplateId: string) => {
    setTemplateId(selectedTemplateId);

    if (selectedTemplateId) {
      const template = templates.find((t) => t.id === selectedTemplateId);
      if (template) {
        setContent(template.content);
      }
    } else {
      setContent("");
    }
  };

  const handleSubmit = async (e: React.FormEvent, shouldPublish: boolean = false) => {
    e.preventDefault();

    if (!title.trim()) {
      alert("Please enter a title");
      return;
    }

    if (!content.trim()) {
      alert("Please enter some content");
      return;
    }

    setSaving(true);
    try {
      const response = await fetch("/api/entries", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          content,
          templateId: templateId || null,
          published: shouldPublish,
          categoryIds,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create entry");
      }

      const entry = await response.json();
      router.push(`/entries/${entry.id}`);
    } catch (error) {
      console.error("Error creating entry:", error);
      alert("Failed to create entry. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">New Journal Entry</h1>
        <p className="text-gray-600">Create a new entry in your journal</p>
      </div>

      <form onSubmit={(e) => handleSubmit(e, published)} className="space-y-6">
        {/* Template Selection */}
        <div>
          <label htmlFor="template" className="block text-sm font-medium mb-2">
            Template (Optional)
          </label>
          <select
            id="template"
            value={templateId}
            onChange={(e) => handleTemplateChange(e.target.value)}
            className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={loading}
          >
            <option value="">No template</option>
            {templates.map((template) => (
              <option key={template.id} value={template.id}>
                {template.name}
                {template.description && ` - ${template.description}`}
              </option>
            ))}
          </select>
        </div>

        {/* Title */}
        <div>
          <label htmlFor="title" className="block text-sm font-medium mb-2">
            Title *
          </label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter a title for your entry..."
            required
          />
        </div>

        {/* Content Editor */}
        <div>
          <label htmlFor="content" className="block text-sm font-medium mb-2">
            Content *
          </label>
          <div className="border rounded-md">
            <TiptapEditor
              content={content}
              onChange={setContent}
              placeholder="Start writing your entry..."
            />
          </div>
        </div>

        {/* Categories */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Categories (Optional)
          </label>
          <CategoryPicker
            selectedIds={categoryIds}
            onChange={setCategoryIds}
          />
        </div>

        {/* Published Status */}
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="published"
            checked={published}
            onChange={(e) => setPublished(e.target.checked)}
            className="w-4 h-4 rounded"
          />
          <label htmlFor="published" className="text-sm">
            Publish entry (make it visible to others if sharing is enabled)
          </label>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-4">
          <button
            type="submit"
            disabled={saving}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {saving ? "Saving..." : published ? "Publish Entry" : "Save Draft"}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            disabled={saving}
            className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-6 py-2 rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
