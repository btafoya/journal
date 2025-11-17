"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { CommentList } from "@/components/comments/comment-list";
import { sanitizeHtml } from "@/lib/security/sanitize";

interface Entry {
  id: string;
  title: string;
  content: string;
  wordCount: number;
  charCount: number;
  published: boolean;
  createdAt: string;
  updatedAt: string;
  template?: {
    id: string;
    name: string;
    description: string | null;
  };
}

export default function EntryPage() {
  const router = useRouter();
  const params = useParams();
  const { data: session } = useSession();
  const [entry, setEntry] = useState<Entry | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  // Sanitize entry content to prevent XSS attacks
  const sanitizedContent = useMemo(() => {
    return entry?.content ? sanitizeHtml(entry.content) : '';
  }, [entry?.content]);

  useEffect(() => {
    if (params.id) {
      fetchEntry();
    }
  }, [params.id]);

  const fetchEntry = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/entries/${params.id}`);

      if (!response.ok) {
        throw new Error("Failed to fetch entry");
      }

      const data = await response.json();
      setEntry(data);
    } catch (error) {
      console.error("Error fetching entry:", error);
      alert("Failed to load entry");
      router.push("/entries");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this entry? This action cannot be undone.")) {
      return;
    }

    setDeleting(true);
    try {
      const response = await fetch(`/api/entries/${params.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete entry");
      }

      router.push("/entries");
    } catch (error) {
      console.error("Error deleting entry:", error);
      alert("Failed to delete entry");
    } finally {
      setDeleting(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
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
          <Link href="/entries" className="text-blue-600 hover:text-blue-700 underline">
            Back to entries
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/entries"
          className="text-blue-600 hover:text-blue-700 mb-4 inline-block"
        >
          ← Back to entries
        </Link>

        <div className="flex justify-between items-start mt-4">
          <div className="flex-1">
            <h1 className="text-4xl font-bold mb-2">{entry.title}</h1>
            <div className="flex items-center gap-3 text-sm text-gray-600">
              {entry.template && (
                <span className="bg-gray-100 px-2 py-1 rounded">
                  Template: {entry.template.name}
                </span>
              )}
              {!entry.published && (
                <span className="bg-yellow-50 text-yellow-700 px-2 py-1 rounded">
                  Draft
                </span>
              )}
              {entry.published && (
                <span className="bg-green-50 text-green-700 px-2 py-1 rounded">
                  Published
                </span>
              )}
            </div>
          </div>

          <div className="flex gap-2">
            <Link
              href={`/entries/${entry.id}/edit`}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition"
            >
              Edit
            </Link>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {deleting ? "Deleting..." : "Delete"}
            </button>
          </div>
        </div>
      </div>

      {/* Metadata */}
      <div className="bg-gray-50 rounded-lg p-4 mb-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-gray-600">Word Count</span>
            <p className="font-semibold">{entry.wordCount}</p>
          </div>
          <div>
            <span className="text-gray-600">Characters</span>
            <p className="font-semibold">{entry.charCount}</p>
          </div>
          <div>
            <span className="text-gray-600">Created</span>
            <p className="font-semibold">{formatDate(entry.createdAt)}</p>
          </div>
          <div>
            <span className="text-gray-600">Last Updated</span>
            <p className="font-semibold">{formatDate(entry.updatedAt)}</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="prose max-w-none mb-12">
        <div
          className="entry-content"
          dangerouslySetInnerHTML={{ __html: sanitizedContent }}
        />
      </div>

      {/* Comments Section */}
      {session?.user?.id && (
        <div className="border-t border-gray-200 pt-12 mt-12">
          <CommentList entryId={entry.id} currentUserId={session.user.id} />
        </div>
      )}

      <style jsx global>{`
        .entry-content {
          line-height: 1.8;
        }
        .entry-content h1 {
          font-size: 2em;
          font-weight: bold;
          margin-top: 1em;
          margin-bottom: 0.5em;
        }
        .entry-content h2 {
          font-size: 1.5em;
          font-weight: bold;
          margin-top: 1em;
          margin-bottom: 0.5em;
        }
        .entry-content h3 {
          font-size: 1.25em;
          font-weight: bold;
          margin-top: 1em;
          margin-bottom: 0.5em;
        }
        .entry-content p {
          margin-bottom: 1em;
        }
        .entry-content ul,
        .entry-content ol {
          margin-left: 1.5em;
          margin-bottom: 1em;
        }
        .entry-content li {
          margin-bottom: 0.5em;
        }
        .entry-content blockquote {
          border-left: 4px solid #e5e7eb;
          padding-left: 1em;
          margin: 1em 0;
          font-style: italic;
          color: #6b7280;
        }
        .entry-content code {
          background-color: #f3f4f6;
          padding: 0.2em 0.4em;
          border-radius: 0.25em;
          font-size: 0.875em;
        }
        .entry-content pre {
          background-color: #1f2937;
          color: #f9fafb;
          padding: 1em;
          border-radius: 0.5em;
          overflow-x: auto;
          margin-bottom: 1em;
        }
        .entry-content pre code {
          background-color: transparent;
          padding: 0;
          color: inherit;
        }
      `}</style>
    </div>
  );
}
