import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { decryptEntryContent } from "@/lib/encryption";

// GET /api/entries/shared-with-me - Get entries shared with the current user
export async function GET(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id || !session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");

    const skip = (page - 1) * limit;

    // Find all shares for this user's email
    const [shares, total] = await Promise.all([
      prisma.sharedEntry.findMany({
        where: {
          sharedWith: session.user.email.toLowerCase(),
          OR: [
            { expiresAt: null },
            { expiresAt: { gt: new Date() } },
          ],
        },
        include: {
          entry: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
              workspace: {
                select: {
                  id: true,
                  name: true,
                  type: true,
                },
              },
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        skip,
        take: limit,
      }),
      prisma.sharedEntry.count({
        where: {
          sharedWith: session.user.email.toLowerCase(),
          OR: [
            { expiresAt: null },
            { expiresAt: { gt: new Date() } },
          ],
        },
      }),
    ]);

    // Decrypt entry content and format response
    const sharedEntries = shares.map((share) => ({
      shareId: share.id,
      permission: share.permission,
      message: share.message,
      sharedAt: share.createdAt,
      expiresAt: share.expiresAt,
      entry: {
        ...share.entry,
        content: decryptEntryContent(share.entry.content),
      },
    }));

    return NextResponse.json({
      entries: sharedEntries,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("GET shared entries error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
