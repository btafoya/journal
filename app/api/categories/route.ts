import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { auditLogFromRequest, AuditAction, ResourceType } from "@/lib/audit-log";

// GET /api/categories - List all categories for the authenticated user
export async function GET(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch all categories with nested children
    const categories = await prisma.category.findMany({
      where: {
        userId: session.user.id,
      },
      include: {
        children: {
          include: {
            children: {
              include: {
                children: true, // Support up to 3 levels of nesting
              },
            },
          },
        },
        _count: {
          select: {
            entries: true,
          },
        },
      },
      orderBy: {
        order: "asc",
      },
    });

    // Filter to get only top-level categories (no parent)
    const topLevelCategories = categories.filter((cat) => !cat.parentId);

    return NextResponse.json({ categories: topLevelCategories });
  } catch (error) {
    console.error("GET categories error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/categories - Create a new category
export async function POST(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, description, color, icon, parentId } = body;

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    // If parentId is provided, verify it exists and belongs to user
    if (parentId) {
      const parentCategory = await prisma.category.findFirst({
        where: {
          id: parentId,
          userId: session.user.id,
        },
      });

      if (!parentCategory) {
        return NextResponse.json(
          { error: "Parent category not found" },
          { status: 404 }
        );
      }
    }

    // Get the current max order for categories at this level
    const maxOrder = await prisma.category.findFirst({
      where: {
        userId: session.user.id,
        parentId: parentId || null,
      },
      orderBy: {
        order: "desc",
      },
      select: {
        order: true,
      },
    });

    const category = await prisma.category.create({
      data: {
        name,
        description: description || null,
        color: color || null,
        icon: icon || null,
        userId: session.user.id,
        parentId: parentId || null,
        order: (maxOrder?.order ?? -1) + 1,
      },
      include: {
        _count: {
          select: {
            entries: true,
          },
        },
      },
    });

    // Audit log the category creation
    await auditLogFromRequest(
      request,
      session.user.id,
      AuditAction.TEMPLATE_CREATE, // Reusing template action for now
      "category",
      category.id,
      { name: category.name, parentId: category.parentId }
    );

    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    console.error("POST category error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
