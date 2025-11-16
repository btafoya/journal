import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { decryptEntryContent } from "@/lib/encryption";

interface RouteParams {
  params: {
    id: string;
  };
}

// GET /api/entries/[id]/versions - Get all versions for an entry
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
    });

    if (!entry) {
      return NextResponse.json({ error: "Entry not found" }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const includeContent = searchParams.get("includeContent") === "true";

    const skip = (page - 1) * limit;

    // Get versions with optional content
    const [versions, total] = await Promise.all([
      prisma.entryVersion.findMany({
        where: {
          entryId: params.id,
        },
        select: {
          id: true,
          versionNumber: true,
          title: true,
          content: includeContent,
          wordCount: true,
          charCount: true,
          changeSummary: true,
          createdAt: true,
        },
        orderBy: {
          versionNumber: "desc",
        },
        skip,
        take: limit,
      }),
      prisma.entryVersion.count({
        where: { entryId: params.id },
      }),
    ]);

    // Decrypt content if included
    const decryptedVersions = versions.map((version) => ({
      ...version,
      ...(includeContent && version.content && { content: decryptEntryContent(version.content) }),
    }));

    return NextResponse.json({
      versions: decryptedVersions,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("GET versions error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
