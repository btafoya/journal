"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useDebounce } from "@/hooks/useDebounce";

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

  // Debounce search query to reduce API calls
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  const fetchEntries = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: "10",
      });

      if (debouncedSearchQuery) {
        params.append("search", debouncedSearchQuery);
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
  }, [currentPage, debouncedSearchQuery, showPublishedOnly]);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    // No need to call fetchEntries - useEffect will trigger from debouncedSearchQuery
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
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8 max-w-6xl">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold dark:text-foreground">My Journal Entries</h1>
        <Link
          href="/entries/new"
          className="w-full sm:w-auto text-center bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-md transition-colors"
        >
          New Entry
        </Link>
      </div>

      {/* Search and Filter Bar */}
      <div className="mb-6 space-y-3 sm:space-y-4">
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            placeholder="Search entries..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 px-4 py-2 border border-input bg-background text-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-ring transition-shadow"
          />
          <button
            type="submit"
            className="bg-secondary hover:bg-secondary/80 text-secondary-foreground px-4 py-2 rounded-md transition-colors whitespace-nowrap"
          >
            Search
          </button>
        </form>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setShowPublishedOnly(null)}
            className={`flex-1 sm:flex-initial px-4 py-2 rounded-md transition-colors ${
              showPublishedOnly === null
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
            }`}
          >
            All
          </button>
          <button
            onClick={() => setShowPublishedOnly(true)}
            className={`flex-1 sm:flex-initial px-4 py-2 rounded-md transition-colors ${
              showPublishedOnly === true
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
            }`}
          >
            Published
          </button>
          <button
            onClick={() => setShowPublishedOnly(false)}
            className={`flex-1 sm:flex-initial px-4 py-2 rounded-md transition-colors ${
              showPublishedOnly === false
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
            }`}
          >
            Drafts
          </button>
        </div>
      </div>

      {/* Entries List */}
      {loading ? (
        <div className="text-center py-12 text-muted-foreground">
          <div className="animate-pulse">Loading entries...</div>
        </div>
      ) : entries.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p className="text-lg mb-4">No entries found</p>
          <Link
            href="/entries/new"
            className="text-primary hover:text-primary/80 underline"
          >
            Create your first entry
          </Link>
        </div>
      ) : (
        <div className="space-y-3 sm:space-y-4">
          {entries.map((entry) => (
            <div
              key={entry.id}
              className="border border-border rounded-lg p-4 sm:p-6 hover:shadow-lg dark:hover:shadow-primary/10 transition-shadow bg-card"
            >
              <div className="flex flex-col sm:flex-row justify-between items-start gap-3 mb-3">
                <div className="flex-1 min-w-0 w-full">
                  <Link
                    href={`/entries/${entry.id}`}
                    className="text-lg sm:text-xl font-semibold hover:text-primary transition-colors block truncate"
                  >
                    {entry.title}
                  </Link>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {entry.template && (
                      <span className="text-xs sm:text-sm text-muted-foreground bg-muted px-2 py-1 rounded">
                        {entry.template.name}
                      </span>
                    )}
                    {!entry.published && (
                      <span className="text-xs sm:text-sm text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-950 px-2 py-1 rounded">
                        Draft
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                  <Link
                    href={`/entries/${entry.id}/edit`}
                    className="flex-1 sm:flex-initial text-center text-primary hover:text-primary/80 px-3 py-1.5 sm:py-1 rounded-md border border-primary hover:bg-primary/10 transition-colors text-sm"
                  >
                    Edit
                  </Link>
                  <button
                    onClick={() => handleDelete(entry.id)}
                    className="flex-1 sm:flex-initial text-destructive hover:text-destructive/80 px-3 py-1.5 sm:py-1 rounded-md border border-destructive hover:bg-destructive/10 transition-colors text-sm"
                  >
                    Delete
                  </button>
                </div>
              </div>

              <p className="text-muted-foreground mb-3 line-clamp-2 sm:line-clamp-3">{getExcerpt(entry.content)}</p>

              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs sm:text-sm text-muted-foreground">
                <span>{entry.wordCount} words</span>
                <span className="hidden sm:inline">{entry.charCount} characters</span>
                <span className="truncate">Updated {formatDate(entry.updatedAt)}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.pages > 1 && (
        <div className="flex flex-col sm:flex-row justify-center items-center gap-2 sm:gap-4 mt-6 sm:mt-8">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="w-full sm:w-auto px-4 py-2 rounded-md border border-border bg-background disabled:opacity-50 disabled:cursor-not-allowed hover:bg-accent transition-colors"
          >
            Previous
          </button>
          <span className="px-4 py-2 text-sm sm:text-base text-muted-foreground">
            Page {pagination.page} of {pagination.pages}
          </span>
          <button
            onClick={() => setCurrentPage((p) => Math.min(pagination.pages, p + 1))}
            disabled={currentPage === pagination.pages}
            className="w-full sm:w-auto px-4 py-2 rounded-md border border-border bg-background disabled:opacity-50 disabled:cursor-not-allowed hover:bg-accent transition-colors"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
