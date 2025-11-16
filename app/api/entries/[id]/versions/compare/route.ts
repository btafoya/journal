import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { decryptEntryContent } from "@/lib/encryption";

interface RouteParams {
  params: {
    id: string;
  };
}

// GET /api/entries/[id]/versions/compare - Compare two versions
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
    const version1Id = searchParams.get("version1");
    const version2Id = searchParams.get("version2");

    if (!version1Id || !version2Id) {
      return NextResponse.json(
        { error: "Both version1 and version2 parameters are required" },
        { status: 400 }
      );
    }

    // Get both versions
    const [version1, version2] = await Promise.all([
      prisma.entryVersion.findFirst({
        where: {
          id: version1Id,
          entryId: params.id,
        },
      }),
      prisma.entryVersion.findFirst({
        where: {
          id: version2Id,
          entryId: params.id,
        },
      }),
    ]);

    if (!version1 || !version2) {
      return NextResponse.json({ error: "One or both versions not found" }, { status: 404 });
    }

    // Decrypt content before returning
    const comparison = {
      version1: {
        ...version1,
        content: decryptEntryContent(version1.content),
      },
      version2: {
        ...version2,
        content: decryptEntryContent(version2.content),
      },
      metadata: {
        timeBetween: version2.createdAt.getTime() - version1.createdAt.getTime(),
        wordCountDiff: version2.wordCount - version1.wordCount,
        charCountDiff: version2.charCount - version1.charCount,
      },
    };

    return NextResponse.json(comparison);
  } catch (error) {
    console.error("Compare versions error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
