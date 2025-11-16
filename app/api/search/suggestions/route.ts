import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/search/suggestions - Get search suggestions
export async function GET(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q") || "";

    if (!query || query.length < 2) {
      return NextResponse.json({ suggestions: [] });
    }

    // Find entries with titles that match the query (fuzzy)
    const titleSuggestions = await prisma.$queryRaw<Array<{ title: string; id: string }>>`
      SELECT DISTINCT title, id
      FROM entries
      WHERE user_id = ${session.user.id}
        AND similarity(title, ${query}) > 0.3
      ORDER BY similarity(title, ${query}) DESC
      LIMIT 5
    `;

    // Find frequently used words in content (for content suggestions)
    const entries = await prisma.entry.findMany({
      where: {
        userId: session.user.id,
        OR: [
          {
            title: {
              contains: query,
              mode: "insensitive",
            },
          },
          {
            content: {
              contains: query,
              mode: "insensitive",
            },
          },
        ],
      },
      select: {
        id: true,
        title: true,
      },
      take: 5,
      orderBy: {
        updatedAt: "desc",
      },
    });

    // Combine title suggestions with recent matches
    const allSuggestions = [
      ...titleSuggestions.map((s) => ({
        id: s.id,
        text: s.title,
        type: "title" as const,
      })),
      ...entries
        .filter((e) => !titleSuggestions.find((ts) => ts.id === e.id))
        .map((e) => ({
          id: e.id,
          text: e.title,
          type: "recent" as const,
        })),
    ];

    return NextResponse.json({
      suggestions: allSuggestions.slice(0, 8),
    });
  } catch (error) {
    console.error("Search suggestions error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
