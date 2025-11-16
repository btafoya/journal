"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

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
  };
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export default function EntriesPage() {
  const router = useRouter();
  const [entries, setEntries] = useState<Entry[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [showPublishedOnly, setShowPublishedOnly] = useState<boolean | null>(null);

  const fetchEntries = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: "10",
      });

      if (searchQuery) {
        params.append("search", searchQuery);
      }

      if (showPublishedOnly !== null) {
        params.append("published", showPublishedOnly.toString());
      }

      const response = await fetch(`/api/entries?${params.toString()}`);

      if (!response.ok) {
        throw new Error("Failed to fetch entries");
      }

      const data = await response.json();
      setEntries(data.entries);
      setPagination(data.pagination);
    } catch (error) {
      console.error("Error fetching entries:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEntries();
  }, [currentPage, searchQuery, showPublishedOnly]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchEntries();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this entry?")) {
      return;
    }

    try {
      const response = await fetch(`/api/entries/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete entry");
      }

      fetchEntries();
    } catch (error) {
      console.error("Error deleting entry:", error);
      alert("Failed to delete entry");
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getExcerpt = (content: string, maxLength: number = 150) => {
    const text = content.replace(/<[^>]*>/g, "");
    return text.length > maxLength ? text.slice(0, maxLength) + "..." : text;
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">My Journal Entries</h1>
        <Link
          href="/entries/new"
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition"
        >
          New Entry
        </Link>
      </div>

      {/* Search and Filter Bar */}
      <div className="mb-6 space-y-4">
        <form onSubmit={handleSearch} className="flex gap-2">
          <input
            type="text"
            placeholder="Search entries..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            className="bg-gray-200 hover:bg-gray-300 px-4 py-2 rounded-md transition"
          >
            Search
          </button>
        </form>

        <div className="flex gap-2">
          <button
            onClick={() => setShowPublishedOnly(null)}
            className={`px-4 py-2 rounded-md transition ${
              showPublishedOnly === null
                ? "bg-blue-600 text-white"
                : "bg-gray-200 hover:bg-gray-300"
            }`}
          >
            All
          </button>
          <button
            onClick={() => setShowPublishedOnly(true)}
            className={`px-4 py-2 rounded-md transition ${
              showPublishedOnly === true
                ? "bg-blue-600 text-white"
                : "bg-gray-200 hover:bg-gray-300"
            }`}
          >
            Published
          </button>
          <button
            onClick={() => setShowPublishedOnly(false)}
            className={`px-4 py-2 rounded-md transition ${
              showPublishedOnly === false
                ? "bg-blue-600 text-white"
                : "bg-gray-200 hover:bg-gray-300"
            }`}
          >
            Drafts
          </button>
        </div>
      </div>

      {/* Entries List */}
      {loading ? (
        <div className="text-center py-12">Loading entries...</div>
      ) : entries.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p className="text-lg mb-4">No entries found</p>
          <Link
            href="/entries/new"
            className="text-blue-600 hover:text-blue-700 underline"
          >
            Create your first entry
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {entries.map((entry) => (
            <div
              key={entry.id}
              className="border rounded-lg p-6 hover:shadow-md transition"
            >
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                  <Link
                    href={`/entries/${entry.id}`}
                    className="text-xl font-semibold hover:text-blue-600 transition"
                  >
                    {entry.title}
                  </Link>
                  {entry.template && (
                    <span className="ml-3 text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
                      {entry.template.name}
                    </span>
                  )}
                  {!entry.published && (
                    <span className="ml-2 text-sm text-yellow-600 bg-yellow-50 px-2 py-1 rounded">
                      Draft
                    </span>
                  )}
                </div>
                <div className="flex gap-2">
                  <Link
                    href={`/entries/${entry.id}/edit`}
                    className="text-blue-600 hover:text-blue-700 px-3 py-1 rounded-md border border-blue-600 hover:bg-blue-50 transition"
                  >
                    Edit
                  </Link>
                  <button
                    onClick={() => handleDelete(entry.id)}
                    className="text-red-600 hover:text-red-700 px-3 py-1 rounded-md border border-red-600 hover:bg-red-50 transition"
                  >
                    Delete
                  </button>
                </div>
              </div>

              <p className="text-gray-600 mb-3">{getExcerpt(entry.content)}</p>

              <div className="flex justify-between items-center text-sm text-gray-500">
                <div className="space-x-4">
                  <span>{entry.wordCount} words</span>
                  <span>{entry.charCount} characters</span>
                  <span>Updated {formatDate(entry.updatedAt)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.pages > 1 && (
        <div className="flex justify-center gap-2 mt-8">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="px-4 py-2 rounded-md border disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
          >
            Previous
          </button>
          <span className="px-4 py-2">
            Page {pagination.page} of {pagination.pages}
          </span>
          <button
            onClick={() => setCurrentPage((p) => Math.min(pagination.pages, p + 1))}
            disabled={currentPage === pagination.pages}
            className="px-4 py-2 rounded-md border disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
