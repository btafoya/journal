import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// POST /api/categories/reorder - Reorder categories
export async function POST(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { updates } = body;

    if (!Array.isArray(updates) || updates.length === 0) {
      return NextResponse.json(
        { error: "Updates array is required" },
        { status: 400 }
      );
    }

    // Verify all categories belong to user before updating
    const categoryIds = updates.map((u: any) => u.id);
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

    // Perform batch update using transaction
    await prisma.$transaction(
      updates.map((update: { id: string; order: number; parentId?: string | null }) =>
        prisma.category.update({
          where: { id: update.id },
          data: {
            order: update.order,
            ...(update.parentId !== undefined && { parentId: update.parentId }),
          },
        })
      )
    );

    return NextResponse.json({ message: "Categories reordered successfully" });
  } catch (error) {
    console.error("POST reorder categories error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
