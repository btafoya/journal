"use client";

import { useState, useEffect } from "react";
import { Plus, AlertCircle } from "lucide-react";
import { SortableCategoryTree } from "@/components/categories/sortable-category-tree";
import { Category } from "@/components/categories/category-tree";
import { CategoryDialog } from "@/components/categories/category-dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [parentId, setParentId] = useState<string | null>(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await fetch("/api/categories");
      if (!response.ok) throw new Error("Failed to fetch categories");

      const data = await response.json();
      setCategories(data.categories);
    } catch (error) {
      console.error("Error fetching categories:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = (parentCategoryId?: string) => {
    setEditingCategory(null);
    setParentId(parentCategoryId || null);
    setDialogOpen(true);
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setParentId(null);
    setDialogOpen(true);
  };

  const handleDelete = async (category: Category) => {
    if (!confirm(`Are you sure you want to delete "${category.name}"? This cannot be undone.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/categories/${category.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete category");
      }

      fetchCategories();
    } catch (error) {
      console.error("Error deleting category:", error);
      alert("Failed to delete category. Please try again.");
    }
  };

  const handleSuccess = () => {
    fetchCategories();
  };

  const handleReorder = async (updates: Array<{ id: string; order: number; parentId?: string | null }>) => {
    try {
      const response = await fetch("/api/categories/reorder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ updates }),
      });

      if (!response.ok) {
        throw new Error("Failed to reorder categories");
      }

      // Refresh categories to get updated order
      fetchCategories();
    } catch (error) {
      console.error("Error reordering categories:", error);
      throw error; // Re-throw to trigger revert in component
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3" />
          <div className="h-4 bg-muted rounded w-2/3" />
          <div className="h-10 bg-muted rounded w-32" />
          <div className="space-y-2 mt-8">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-10 bg-muted rounded" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Categories</h1>
        <p className="text-muted-foreground">
          Organize your journal entries with nested categories. Create, edit, and manage your category structure.
        </p>
      </div>

      {/* Info Alert */}
      <Alert className="mb-6">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Categories can be nested to create hierarchies. You can assign multiple categories to each entry
          for flexible organization.
        </AlertDescription>
      </Alert>

      {/* Add Category Button */}
      <div className="mb-6">
        <Button onClick={() => handleAdd()}>
          <Plus className="h-4 w-4 mr-2" />
          New Category
        </Button>
      </div>

      {/* Categories Tree */}
      <div className="bg-card border rounded-lg p-6">
        <SortableCategoryTree
          categories={categories}
          onReorder={handleReorder}
          onAdd={handleAdd}
          onEdit={handleEdit}
          onDelete={handleDelete}
          showCounts={true}
        />
      </div>

      {/* Category Dialog */}
      <CategoryDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        category={editingCategory}
        parentId={parentId}
        onSuccess={handleSuccess}
      />
    </div>
  );
}
