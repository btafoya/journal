"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useDebounce } from "@/hooks/useDebounce";
import { X, CheckSquare, Square, Tag, Trash2 } from "lucide-react";

interface Category {
  id: string;
  name: string;
  color: string | null;
  icon: string | null;
}

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
  categories?: Array<{
    category: Category;
  }>;
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
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedEntryIds, setSelectedEntryIds] = useState<Set<string>>(new Set());
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [bulkCategoryId, setBulkCategoryId] = useState<string>("");

  // Debounce search query to reduce API calls
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  // Fetch categories for filter dropdown
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch("/api/categories");
        if (response.ok) {
          const data = await response.json();
          // Flatten nested categories
          const flattenCategories = (cats: any[], result: Category[] = []): Category[] => {
            for (const cat of cats) {
              result.push({ id: cat.id, name: cat.name, color: cat.color, icon: cat.icon });
              if (cat.children && cat.children.length > 0) {
                flattenCategories(cat.children, result);
              }
            }
            return result;
          };
          setCategories(flattenCategories(data.categories));
        }
      } catch (error) {
        console.error("Error fetching categories:", error);
      }
    };
    fetchCategories();
  }, []);

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

      if (selectedCategoryId) {
        params.append("categoryId", selectedCategoryId);
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
  }, [currentPage, debouncedSearchQuery, showPublishedOnly, selectedCategoryId]);

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

  const toggleEntrySelection = (entryId: string) => {
    setSelectedEntryIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(entryId)) {
        newSet.delete(entryId);
      } else {
        newSet.add(entryId);
      }
      return newSet;
    });
  };

  const toggleSelectAll = () => {
    if (selectedEntryIds.size === entries.length) {
      setSelectedEntryIds(new Set());
    } else {
      setSelectedEntryIds(new Set(entries.map((e) => e.id)));
    }
  };

  const handleBulkAssignCategory = async () => {
    if (!bulkCategoryId || selectedEntryIds.size === 0) return;

    try {
      const response = await fetch("/api/entries/bulk-categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entryIds: Array.from(selectedEntryIds),
          categoryId: bulkCategoryId,
          action: "assign",
        }),
      });

      if (!response.ok) throw new Error("Failed to assign categories");

      fetchEntries();
      setSelectedEntryIds(new Set());
      setBulkCategoryId("");
      setShowBulkActions(false);
    } catch (error) {
      console.error("Error assigning categories:", error);
      alert("Failed to assign categories");
    }
  };

  const handleBulkRemoveCategory = async () => {
    if (!bulkCategoryId || selectedEntryIds.size === 0) return;

    try {
      const response = await fetch("/api/entries/bulk-categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entryIds: Array.from(selectedEntryIds),
          categoryId: bulkCategoryId,
          action: "remove",
        }),
      });

      if (!response.ok) throw new Error("Failed to remove categories");

      fetchEntries();
      setSelectedEntryIds(new Set());
      setBulkCategoryId("");
      setShowBulkActions(false);
    } catch (error) {
      console.error("Error removing categories:", error);
      alert("Failed to remove categories");
    }
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

      {/* Bulk Actions Bar */}
      {selectedEntryIds.size > 0 && (
        <div className="mb-4 p-4 bg-accent rounded-lg border border-border">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">
                {selectedEntryIds.size} {selectedEntryIds.size === 1 ? "entry" : "entries"} selected
              </span>
              <button
                onClick={() => setSelectedEntryIds(new Set())}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Clear
              </button>
            </div>
            <div className="flex gap-2 flex-1 w-full sm:w-auto">
              {!showBulkActions ? (
                <button
                  onClick={() => setShowBulkActions(true)}
                  className="flex items-center gap-2 px-3 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
                >
                  <Tag className="h-4 w-4" />
                  Manage Categories
                </button>
              ) : (
                <>
                  <select
                    value={bulkCategoryId}
                    onChange={(e) => setBulkCategoryId(e.target.value)}
                    className="flex-1 px-3 py-2 border border-input bg-background text-foreground rounded-md text-sm"
                  >
                    <option value="">Select category...</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.icon} {cat.name}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={handleBulkAssignCategory}
                    disabled={!bulkCategoryId}
                    className="px-3 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm whitespace-nowrap"
                  >
                    Assign
                  </button>
                  <button
                    onClick={handleBulkRemoveCategory}
                    disabled={!bulkCategoryId}
                    className="px-3 py-2 bg-destructive text-destructive-foreground rounded-md hover:bg-destructive/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm whitespace-nowrap"
                  >
                    Remove
                  </button>
                  <button
                    onClick={() => {
                      setShowBulkActions(false);
                      setBulkCategoryId("");
                    }}
                    className="px-3 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80 transition-colors text-sm"
                  >
                    Cancel
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

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

        <div className="flex flex-col sm:flex-row gap-2">
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

          <div className="flex gap-2 flex-1">
            <select
              value={selectedCategoryId || ""}
              onChange={(e) => {
                setSelectedCategoryId(e.target.value || null);
                setCurrentPage(1);
              }}
              className="flex-1 px-4 py-2 border border-input bg-background text-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">All Categories</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.icon} {cat.name}
                </option>
              ))}
            </select>
            {selectedCategoryId && (
              <button
                onClick={() => setSelectedCategoryId(null)}
                className="px-3 py-2 rounded-md bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors"
                title="Clear category filter"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
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
        <>
          {/* Select All */}
          {entries.length > 0 && (
            <div className="mb-3 flex items-center gap-2">
              <button
                onClick={toggleSelectAll}
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                {selectedEntryIds.size === entries.length ? (
                  <CheckSquare className="h-5 w-5" />
                ) : (
                  <Square className="h-5 w-5" />
                )}
                <span>
                  {selectedEntryIds.size === entries.length ? "Deselect all" : "Select all"}
                </span>
              </button>
            </div>
          )}

          <div className="space-y-3 sm:space-y-4">
            {entries.map((entry) => (
            <div
              key={entry.id}
              className={`border rounded-lg p-4 sm:p-6 hover:shadow-lg dark:hover:shadow-primary/10 transition-all bg-card ${
                selectedEntryIds.has(entry.id) ? "border-primary" : "border-border"
              }`}
            >
              <div className="flex flex-col sm:flex-row justify-between items-start gap-3 mb-3">
                <div className="flex gap-3 flex-1 min-w-0 w-full">
                  <button
                    onClick={() => toggleEntrySelection(entry.id)}
                    className="flex-shrink-0 mt-1"
                  >
                    {selectedEntryIds.has(entry.id) ? (
                      <CheckSquare className="h-5 w-5 text-primary" />
                    ) : (
                      <Square className="h-5 w-5 text-muted-foreground hover:text-foreground transition-colors" />
                    )}
                  </button>
                  <div className="flex-1 min-w-0">
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
                    {entry.categories && entry.categories.map(({ category }) => (
                      <span
                        key={category.id}
                        className="text-xs sm:text-sm px-2 py-1 rounded flex items-center gap-1"
                        style={{ backgroundColor: `${category.color}20`, color: category.color || undefined }}
                      >
                        {category.icon && <span>{category.icon}</span>}
                        {category.name}
                      </span>
                    ))}
                  </div>
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
        </>
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
