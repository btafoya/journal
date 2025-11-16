import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/attachments - List all attachments for the user
export async function GET(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const entryId = searchParams.get("entryId");
    const mimeType = searchParams.get("mimeType");

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {
      userId: session.user.id,
    };

    if (entryId) {
      where.entryId = entryId;
    }

    if (mimeType) {
      where.mimeType = {
        startsWith: mimeType, // e.g., "image/" matches all images
      };
    }

    const [attachments, total] = await Promise.all([
      prisma.attachment.findMany({
        where,
        select: {
          id: true,
          filename: true,
          originalName: true,
          mimeType: true,
          size: true,
          entryId: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: {
          createdAt: "desc",
        },
        skip,
        take: limit,
      }),
      prisma.attachment.count({ where }),
    ]);

    return NextResponse.json({
      attachments,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("GET attachments error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
