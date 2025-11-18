import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// POST /api/entries/bulk-categories - Bulk assign or remove categories from entries
export async function POST(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { entryIds, categoryId, action } = body;

    if (!entryIds || !Array.isArray(entryIds) || entryIds.length === 0) {
      return NextResponse.json({ error: "Entry IDs array is required" }, { status: 400 });
    }

    if (!categoryId) {
      return NextResponse.json({ error: "Category ID is required" }, { status: 400 });
    }

    if (!action || (action !== "assign" && action !== "remove")) {
      return NextResponse.json({ error: "Action must be 'assign' or 'remove'" }, { status: 400 });
    }

    // Verify all entries belong to the user
    const entries = await prisma.entry.findMany({
      where: {
        id: { in: entryIds },
        userId: session.user.id,
      },
    });

    if (entries.length !== entryIds.length) {
      return NextResponse.json({ error: "One or more entries not found or unauthorized" }, { status: 404 });
    }

    // Verify category belongs to the user
    const category = await prisma.category.findFirst({
      where: {
        id: categoryId,
        userId: session.user.id,
      },
    });

    if (!category) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }

    if (action === "assign") {
      // Assign category to all entries (skip if already assigned)
      await prisma.$transaction(
        entryIds.map((entryId) =>
          prisma.entryCategory.upsert({
            where: {
              entryId_categoryId: {
                entryId,
                categoryId,
              },
            },
            update: {}, // No update needed, just ensure it exists
            create: {
              entryId,
              categoryId,
            },
          })
        )
      );

      return NextResponse.json({
        message: `Category assigned to ${entryIds.length} ${entryIds.length === 1 ? "entry" : "entries"}`,
      });
    } else {
      // Remove category from all entries
      await prisma.entryCategory.deleteMany({
        where: {
          entryId: { in: entryIds },
          categoryId,
        },
      });

      return NextResponse.json({
        message: `Category removed from ${entryIds.length} ${entryIds.length === 1 ? "entry" : "entries"}`,
      });
    }
  } catch (error) {
    console.error("POST bulk categories error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
