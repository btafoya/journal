"use client";

import { useState } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ChevronDown, ChevronRight, FolderIcon, Plus, Edit2, Trash2, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Category } from "./category-tree";

interface SortableCategoryTreeProps {
  categories: Category[];
  onReorder: (updates: Array<{ id: string; order: number; parentId?: string | null }>) => Promise<void>;
  onAdd?: (parentId?: string) => void;
  onEdit?: (category: Category) => void;
  onDelete?: (category: Category) => void;
  showCounts?: boolean;
}

interface SortableCategoryNodeProps {
  category: Category;
  level: number;
  onAdd?: (parentId?: string) => void;
  onEdit?: (category: Category) => void;
  onDelete?: (category: Category) => void;
  showCounts?: boolean;
}

function SortableCategoryNode({
  category,
  level,
  onAdd,
  onEdit,
  onDelete,
  showCounts = true,
}: SortableCategoryNodeProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const hasChildren = category.children && category.children.length > 0;

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: category.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <div
        className={`group flex items-center gap-2 py-1.5 px-2 rounded-md hover:bg-accent transition-colors ${
          isDragging ? "bg-accent" : ""
        }`}
        style={{ paddingLeft: `${level * 16 + 8}px` }}
      >
        {/* Drag Handle */}
        <button
          {...attributes}
          {...listeners}
          className="p-0.5 hover:bg-accent-foreground/10 rounded cursor-grab active:cursor-grabbing"
        >
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </button>

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
        <div className="flex-1 min-w-0 flex items-center gap-2">
          <span className="truncate text-sm font-medium">{category.name}</span>
          {showCounts && category._count && (
            <span className="text-xs text-muted-foreground">
              ({category._count.entries})
            </span>
          )}
        </div>

        {/* Actions */}
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
      </div>

      {/* Children */}
      {hasChildren && isExpanded && category.children && (
        <div>
          <SortableCategoryTree
            categories={category.children}
            onReorder={async () => {}}
            onAdd={onAdd}
            onEdit={onEdit}
            onDelete={onDelete}
            showCounts={showCounts}
          />
        </div>
      )}
    </div>
  );
}

export function SortableCategoryTree({
  categories,
  onReorder,
  onAdd,
  onEdit,
  onDelete,
  showCounts = true,
}: SortableCategoryTreeProps) {
  const [items, setItems] = useState(categories);
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Update items when categories prop changes
  useState(() => {
    setItems(categories);
  });

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = items.findIndex((item) => item.id === active.id);
    const newIndex = items.findIndex((item) => item.id === over.id);

    const newItems = arrayMove(items, oldIndex, newIndex);
    setItems(newItems);

    // Create updates array with new order values
    const updates = newItems.map((item, index) => ({
      id: item.id,
      order: index,
      parentId: item.parentId,
    }));

    try {
      await onReorder(updates);
    } catch (error) {
      console.error("Failed to reorder categories:", error);
      // Revert on error
      setItems(categories);
    }
  };

  if (categories.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground text-sm">
        No categories yet. Create your first category to organize your entries.
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={items.map((cat) => cat.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="space-y-1">
          {items.map((category) => (
            <SortableCategoryNode
              key={category.id}
              category={category}
              level={0}
              onAdd={onAdd}
              onEdit={onEdit}
              onDelete={onDelete}
              showCounts={showCounts}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
