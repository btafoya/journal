"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Category } from "./category-tree";

const PRESET_COLORS = [
  "#ef4444", // red
  "#f97316", // orange
  "#f59e0b", // amber
  "#eab308", // yellow
  "#84cc16", // lime
  "#22c55e", // green
  "#10b981", // emerald
  "#14b8a6", // teal
  "#06b6d4", // cyan
  "#0ea5e9", // sky
  "#3b82f6", // blue
  "#6366f1", // indigo
  "#8b5cf6", // violet
  "#a855f7", // purple
  "#d946ef", // fuchsia
  "#ec4899", // pink
  "#f43f5e", // rose
  "#6b7280", // gray
];

const PRESET_ICONS = ["📁", "📂", "📄", "📝", "📚", "🗂️", "💼", "🎯", "⭐", "🏷️", "📌", "🔖", "💡", "🎨", "🔧", "⚙️"];

interface CategoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category?: Category | null;
  parentId?: string | null;
  onSuccess: () => void;
}

export function CategoryDialog({
  open,
  onOpenChange,
  category,
  parentId,
  onSuccess,
}: CategoryDialogProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState("#6b7280");
  const [icon, setIcon] = useState("📁");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (category) {
      setName(category.name);
      setDescription(category.description || "");
      setColor(category.color || "#6b7280");
      setIcon(category.icon || "📁");
    } else {
      setName("");
      setDescription("");
      setColor("#6b7280");
      setIcon("📁");
    }
  }, [category, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      alert("Please enter a category name");
      return;
    }

    setLoading(true);
    try {
      const url = category ? `/api/categories/${category.id}` : "/api/categories";
      const method = category ? "PATCH" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description: description || null,
          color,
          icon,
          parentId: parentId || null,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to ${category ? "update" : "create"} category`);
      }

      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error("Error saving category:", error);
      alert(`Failed to ${category ? "update" : "create"} category. Please try again.`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {category ? "Edit Category" : "Create Category"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div>
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Work, Personal, Ideas"
              required
            />
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what this category is for..."
              rows={2}
            />
          </div>

          {/* Icon Picker */}
          <div>
            <Label>Icon</Label>
            <div className="grid grid-cols-8 gap-2 mt-2">
              {PRESET_ICONS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setIcon(preset)}
                  className={`h-10 w-10 rounded-md flex items-center justify-center text-lg hover:bg-accent transition-colors ${
                    icon === preset ? "bg-accent ring-2 ring-primary" : "bg-muted"
                  }`}
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>

          {/* Color Picker */}
          <div>
            <Label>Color</Label>
            <div className="grid grid-cols-9 gap-2 mt-2">
              {PRESET_COLORS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setColor(preset)}
                  className={`h-10 w-10 rounded-md transition-all ${
                    color === preset ? "ring-2 ring-offset-2 ring-primary scale-110" : ""
                  }`}
                  style={{ backgroundColor: preset }}
                  title={preset}
                />
              ))}
            </div>
          </div>

          {/* Preview */}
          <div>
            <Label>Preview</Label>
            <div className="mt-2 p-4 bg-muted rounded-md flex items-center gap-3">
              <div
                className="w-8 h-8 rounded flex items-center justify-center text-lg"
                style={{ backgroundColor: color }}
              >
                {icon}
              </div>
              <div>
                <div className="font-medium">{name || "Category Name"}</div>
                {description && (
                  <div className="text-sm text-muted-foreground">{description}</div>
                )}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : category ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
