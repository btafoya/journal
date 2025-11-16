import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { auditLogFromRequest, AuditAction } from "@/lib/audit-log";

interface RouteParams {
  params: {
    id: string;
  };
}

// GET /api/categories/[id] - Get a single category
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const category = await prisma.category.findFirst({
      where: {
        id: params.id,
        userId: session.user.id,
      },
      include: {
        children: true,
        _count: {
          select: {
            entries: true,
          },
        },
      },
    });

    if (!category) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }

    return NextResponse.json(category);
  } catch (error) {
    console.error("GET category error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PUT /api/categories/[id] - Update a category
export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify category belongs to user
    const existingCategory = await prisma.category.findFirst({
      where: {
        id: params.id,
        userId: session.user.id,
      },
    });

    if (!existingCategory) {
      return NextResponse.json(
        { error: "Category not found or not authorized" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { name, description, color, icon, parentId, order } = body;

    // If changing parent, verify new parent exists and belongs to user
    if (parentId !== undefined && parentId !== null) {
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

      // Prevent circular references
      if (parentId === params.id) {
        return NextResponse.json(
          { error: "Category cannot be its own parent" },
          { status: 400 }
        );
      }
    }

    const category = await prisma.category.update({
      where: {
        id: params.id,
      },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description: description || null }),
        ...(color !== undefined && { color: color || null }),
        ...(icon !== undefined && { icon: icon || null }),
        ...(parentId !== undefined && { parentId: parentId || null }),
        ...(order !== undefined && { order }),
      },
      include: {
        _count: {
          select: {
            entries: true,
          },
        },
      },
    });

    // Audit log the category update
    await auditLogFromRequest(
      request,
      session.user.id,
      AuditAction.TEMPLATE_UPDATE,
      "category",
      category.id,
      { name: category.name }
    );

    return NextResponse.json(category);
  } catch (error) {
    console.error("PUT category error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/categories/[id] - Delete a category
export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify category belongs to user
    const existingCategory = await prisma.category.findFirst({
      where: {
        id: params.id,
        userId: session.user.id,
      },
      include: {
        children: true,
      },
    });

    if (!existingCategory) {
      return NextResponse.json(
        { error: "Category not found or not authorized" },
        { status: 404 }
      );
    }

    // Note: Children will be cascade deleted due to onDelete: Cascade
    // Entry-category associations will also be cascade deleted
    await prisma.category.delete({
      where: {
        id: params.id,
      },
    });

    // Audit log the category deletion
    await auditLogFromRequest(
      request,
      session.user.id,
      AuditAction.TEMPLATE_DELETE,
      "category",
      params.id,
      { name: existingCategory.name, childrenCount: existingCategory.children.length }
    );

    return NextResponse.json({ message: "Category deleted successfully" });
  } catch (error) {
    console.error("DELETE category error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
