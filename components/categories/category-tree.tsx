"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, FolderIcon, Plus, Edit2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface Category {
  id: string;
  name: string;
  description?: string | null;
  color?: string | null;
  icon?: string | null;
  parentId?: string | null;
  order: number;
  children?: Category[];
  _count?: {
    entries: number;
  };
}

interface CategoryTreeProps {
  categories: Category[];
  selectedId?: string;
  onSelect?: (categoryId: string) => void;
  onAdd?: (parentId?: string) => void;
  onEdit?: (category: Category) => void;
  onDelete?: (category: Category) => void;
  showActions?: boolean;
  showCounts?: boolean;
}

interface CategoryNodeProps {
  category: Category;
  level: number;
  selectedId?: string;
  onSelect?: (categoryId: string) => void;
  onAdd?: (parentId?: string) => void;
  onEdit?: (category: Category) => void;
  onDelete?: (category: Category) => void;
  showActions?: boolean;
  showCounts?: boolean;
}

function CategoryNode({
  category,
  level,
  selectedId,
  onSelect,
  onAdd,
  onEdit,
  onDelete,
  showActions = false,
  showCounts = true,
}: CategoryNodeProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const hasChildren = category.children && category.children.length > 0;
  const isSelected = selectedId === category.id;

  return (
    <div>
      <div
        className={`group flex items-center gap-2 py-1.5 px-2 rounded-md cursor-pointer hover:bg-accent transition-colors ${
          isSelected ? "bg-accent" : ""
        }`}
        style={{ paddingLeft: `${level * 16 + 8}px` }}
      >
        {/* Expand/Collapse Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsExpanded(!isExpanded);
          }}
          className="p-0.5 hover:bg-accent-foreground/10 rounded"
        >
          {hasChildren ? (
            isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )
          ) : (
            <div className="w-4 h-4" />
          )}
        </button>

        {/* Category Icon */}
        <div
          className="flex-shrink-0 w-5 h-5 rounded flex items-center justify-center text-xs"
          style={{ backgroundColor: category.color || "#6b7280" }}
        >
          {category.icon || <FolderIcon className="h-3 w-3 text-white" />}
        </div>

        {/* Category Name */}
        <div
          className="flex-1 min-w-0 flex items-center gap-2"
          onClick={() => onSelect?.(category.id)}
        >
          <span className="truncate text-sm font-medium">{category.name}</span>
          {showCounts && category._count && (
            <span className="text-xs text-muted-foreground">
              ({category._count.entries})
            </span>
          )}
        </div>

        {/* Actions */}
        {showActions && (
          <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={(e) => {
                e.stopPropagation();
                onAdd?.(category.id);
              }}
            >
              <Plus className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={(e) => {
                e.stopPropagation();
                onEdit?.(category);
              }}
            >
              <Edit2 className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={(e) => {
                e.stopPropagation();
                onDelete?.(category);
              }}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        )}
      </div>

      {/* Children */}
      {hasChildren && isExpanded && (
        <div>
          {category.children?.map((child) => (
            <CategoryNode
              key={child.id}
              category={child}
              level={level + 1}
              selectedId={selectedId}
              onSelect={onSelect}
              onAdd={onAdd}
              onEdit={onEdit}
              onDelete={onDelete}
              showActions={showActions}
              showCounts={showCounts}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function CategoryTree({
  categories,
  selectedId,
  onSelect,
  onAdd,
  onEdit,
  onDelete,
  showActions = false,
  showCounts = true,
}: CategoryTreeProps) {
  return (
    <div className="space-y-1">
      {categories.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground text-sm">
          No categories yet. Create your first category to organize your entries.
        </div>
      ) : (
        categories.map((category) => (
          <CategoryNode
            key={category.id}
            category={category}
            level={0}
            selectedId={selectedId}
            onSelect={onSelect}
            onAdd={onAdd}
            onEdit={onEdit}
            onDelete={onDelete}
            showActions={showActions}
            showCounts={showCounts}
          />
        ))
      )}
    </div>
  );
}
