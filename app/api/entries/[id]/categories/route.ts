import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

interface RouteParams {
  params: {
    id: string;
  };
}

// GET /api/entries/[id]/categories - Get categories for an entry
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify entry belongs to user
    const entry = await prisma.entry.findFirst({
      where: {
        id: params.id,
        userId: session.user.id,
      },
      include: {
        categories: {
          include: {
            category: true,
          },
        },
      },
    });

    if (!entry) {
      return NextResponse.json({ error: "Entry not found" }, { status: 404 });
    }

    const categories = entry.categories.map((ec) => ec.category);

    return NextResponse.json({ categories });
  } catch (error) {
    console.error("GET entry categories error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/entries/[id]/categories - Add categories to an entry
export async function POST(request: Request, { params }: RouteParams) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify entry belongs to user
    const entry = await prisma.entry.findFirst({
      where: {
        id: params.id,
        userId: session.user.id,
      },
    });

    if (!entry) {
      return NextResponse.json({ error: "Entry not found" }, { status: 404 });
    }

    const body = await request.json();
    const { categoryIds } = body;

    if (!Array.isArray(categoryIds) || categoryIds.length === 0) {
      return NextResponse.json(
        { error: "Category IDs array is required" },
        { status: 400 }
      );
    }

    // Verify all categories belong to user
    const categories = await prisma.category.findMany({
      where: {
        id: { in: categoryIds },
        userId: session.user.id,
      },
    });

    if (categories.length !== categoryIds.length) {
      return NextResponse.json(
        { error: "One or more categories not found or unauthorized" },
        { status: 404 }
      );
    }

    // Create entry-category associations (ignore duplicates)
    await prisma.$transaction(
      categoryIds.map((categoryId: string) =>
        prisma.entryCategory.upsert({
          where: {
            entryId_categoryId: {
              entryId: params.id,
              categoryId,
            },
          },
          create: {
            entryId: params.id,
            categoryId,
          },
          update: {},
        })
      )
    );

    // Fetch updated entry with categories
    const updatedEntry = await prisma.entry.findUnique({
      where: { id: params.id },
      include: {
        categories: {
          include: {
            category: true,
          },
        },
      },
    });

    const resultCategories = updatedEntry?.categories.map((ec) => ec.category) || [];

    return NextResponse.json({ categories: resultCategories });
  } catch (error) {
    console.error("POST entry categories error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/entries/[id]/categories - Remove a category from an entry
export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify entry belongs to user
    const entry = await prisma.entry.findFirst({
      where: {
        id: params.id,
        userId: session.user.id,
      },
    });

    if (!entry) {
      return NextResponse.json({ error: "Entry not found" }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get("categoryId");

    if (!categoryId) {
      return NextResponse.json(
        { error: "Category ID is required" },
        { status: 400 }
      );
    }

    // Delete the association
    await prisma.entryCategory.delete({
      where: {
        entryId_categoryId: {
          entryId: params.id,
          categoryId,
        },
      },
    });

    return NextResponse.json({ message: "Category removed from entry successfully" });
  } catch (error) {
    console.error("DELETE entry category error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
