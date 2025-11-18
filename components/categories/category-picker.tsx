"use client";

import { useState, useEffect } from "react";
import { Check, X, FolderIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Category } from "./category-tree";

interface CategoryPickerProps {
  selectedIds: string[];
  onChange: (categoryIds: string[]) => void;
  className?: string;
}

interface FlatCategory {
  id: string;
  name: string;
  color?: string | null;
  icon?: string | null;
  path: string; // Full path like "Work > Projects > Client A"
}

export function CategoryPicker({ selectedIds, onChange, className }: CategoryPickerProps) {
  const [categories, setCategories] = useState<FlatCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await fetch("/api/categories");
      if (!response.ok) throw new Error("Failed to fetch categories");

      const data = await response.json();
      const flatList = flattenCategories(data.categories);
      setCategories(flatList);
    } catch (error) {
      console.error("Error fetching categories:", error);
    } finally {
      setLoading(false);
    }
  };

  const flattenCategories = (cats: Category[], path: string = ""): FlatCategory[] => {
    let result: FlatCategory[] = [];

    for (const cat of cats) {
      const currentPath = path ? `${path} > ${cat.name}` : cat.name;
      result.push({
        id: cat.id,
        name: cat.name,
        color: cat.color,
        icon: cat.icon,
        path: currentPath,
      });

      if (cat.children && cat.children.length > 0) {
        result = result.concat(flattenCategories(cat.children, currentPath));
      }
    }

    return result;
  };

  const toggleCategory = (categoryId: string) => {
    if (selectedIds.includes(categoryId)) {
      onChange(selectedIds.filter((id) => id !== categoryId));
    } else {
      onChange([...selectedIds, categoryId]);
    }
  };

  const removeCategory = (categoryId: string) => {
    onChange(selectedIds.filter((id) => id !== categoryId));
  };

  const selectedCategories = categories.filter((cat) =>
    selectedIds.includes(cat.id)
  );

  if (loading) {
    return (
      <div className={className}>
        <div className="animate-pulse bg-muted h-10 rounded-md" />
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Selected Categories Display */}
      <div className="flex flex-wrap gap-2 mb-2">
        {selectedCategories.map((cat) => (
          <Badge
            key={cat.id}
            variant="secondary"
            className="flex items-center gap-1.5 pr-1"
          >
            <div
              className="w-3 h-3 rounded flex items-center justify-center"
              style={{ backgroundColor: cat.color || "#6b7280" }}
            >
              {cat.icon ? (
                <span className="text-[8px]">{cat.icon}</span>
              ) : (
                <FolderIcon className="h-2 w-2 text-white" />
              )}
            </div>
            <span className="text-xs">{cat.path}</span>
            <button
              onClick={() => removeCategory(cat.id)}
              className="ml-1 hover:bg-accent rounded-full p-0.5"
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}
      </div>

      {/* Category Selector */}
      <div className="relative">
        <Button
          type="button"
          variant="outline"
          className="w-full justify-start"
          onClick={() => setIsOpen(!isOpen)}
        >
          {selectedIds.length > 0
            ? `${selectedIds.length} categor${selectedIds.length === 1 ? "y" : "ies"} selected`
            : "Select categories..."}
        </Button>

        {isOpen && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />

            {/* Dropdown */}
            <div className="absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-lg max-h-60 overflow-y-auto">
              {categories.length === 0 ? (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  No categories available. Create categories to organize your entries.
                </div>
              ) : (
                categories.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => toggleCategory(cat.id)}
                    className="w-full flex items-center gap-2 px-3 py-2 hover:bg-accent transition-colors text-left"
                  >
                    <div className="flex-shrink-0">
                      {selectedIds.includes(cat.id) ? (
                        <div className="w-4 h-4 rounded bg-primary flex items-center justify-center">
                          <Check className="h-3 w-3 text-primary-foreground" />
                        </div>
                      ) : (
                        <div className="w-4 h-4 rounded border" />
                      )}
                    </div>
                    <div
                      className="flex-shrink-0 w-4 h-4 rounded flex items-center justify-center"
                      style={{ backgroundColor: cat.color || "#6b7280" }}
                    >
                      {cat.icon ? (
                        <span className="text-[10px]">{cat.icon}</span>
                      ) : (
                        <FolderIcon className="h-2.5 w-2.5 text-white" />
                      )}
                    </div>
                    <span className="text-sm truncate">{cat.path}</span>
                  </button>
                ))
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
