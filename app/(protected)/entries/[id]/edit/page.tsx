"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import dynamic from "next/dynamic";

// Dynamically import the TiptapEditor to avoid SSR issues
const TiptapEditor = dynamic(
  () => import("@/components/editor/tiptap-editor"),
  { ssr: false }
);

interface Entry {
  id: string;
  title: string;
  content: string;
  templateId: string | null;
  published: boolean;
}

interface EntryTemplate {
  id: string;
  name: string;
  description: string | null;
  content: string;
}

export default function EditEntryPage() {
  const router = useRouter();
  const params = useParams();
  const [entry, setEntry] = useState<Entry | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [templateId, setTemplateId] = useState<string>("");
  const [published, setPublished] = useState(false);
  const [templates, setTemplates] = useState<EntryTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (params.id) {
      fetchEntry();
      fetchTemplates();
    }
  }, [params.id]);

  const fetchEntry = async () => {
    try {
      const response = await fetch(`/api/entries/${params.id}`);
      if (!response.ok) {
        throw new Error("Failed to fetch entry");
      }
      const data = await response.json();
      setEntry(data);
      setTitle(data.title);
      setContent(data.content);
      setTemplateId(data.templateId || "");
      setPublished(data.published);
    } catch (error) {
      console.error("Error fetching entry:", error);
      alert("Failed to load entry");
      router.push("/entries");
    } finally {
      setLoading(false);
    }
  };

  const fetchTemplates = async () => {
    try {
      const response = await fetch("/api/templates");
      if (!response.ok) {
        throw new Error("Failed to fetch templates");
      }
      const data = await response.json();
      setTemplates(data.templates);
    } catch (error) {
      console.error("Error fetching templates:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
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
      const response = await fetch(`/api/entries/${params.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          content,
          templateId: templateId || null,
          published,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update entry");
      }

      router.push(`/entries/${params.id}`);
    } catch (error) {
      console.error("Error updating entry:", error);
      alert("Failed to update entry. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="text-center py-12">Loading entry...</div>
      </div>
    );
  }

  if (!entry) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="text-center py-12">
          <p className="text-lg text-gray-600 mb-4">Entry not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Edit Journal Entry</h1>
        <p className="text-gray-600">Make changes to your entry</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Template Selection */}
        <div>
          <label htmlFor="template" className="block text-sm font-medium mb-2">
            Template (Optional)
          </label>
          <select
            id="template"
            value={templateId}
            onChange={(e) => setTemplateId(e.target.value)}
            className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
            {saving ? "Saving..." : "Save Changes"}
          </button>
          <button
            type="button"
            onClick={() => router.push(`/entries/${params.id}`)}
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
