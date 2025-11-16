import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { decryptEntryContent } from "@/lib/encryption";

// GET /api/search - Advanced search with filters
export async function GET(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q") || "";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const categoryId = searchParams.get("categoryId");
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");
    const published = searchParams.get("published");
    const fuzzy = searchParams.get("fuzzy") === "true";

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {
      userId: session.user.id,
    };

    // Search query - use fuzzy search if enabled
    if (query) {
      if (fuzzy) {
        // Use pg_trgm for fuzzy matching
        where.OR = [
          {
            title: {
              search: query,
            },
          },
          {
            content: {
              search: query,
            },
          },
        ];
      } else {
        // Use standard contains search
        where.OR = [
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
        ];
      }
    }

    // Category filter
    if (categoryId) {
      where.categories = {
        some: {
          categoryId: categoryId,
        },
      };
    }

    // Date range filter
    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) {
        where.createdAt.gte = new Date(dateFrom);
      }
      if (dateTo) {
        where.createdAt.lte = new Date(dateTo);
      }
    }

    // Published filter
    if (published !== null && published !== undefined) {
      where.published = published === "true";
    }

    // Execute search with pagination
    const [entries, total] = await Promise.all([
      prisma.entry.findMany({
        where,
        include: {
          template: {
            select: {
              id: true,
              name: true,
            },
          },
          categories: {
            include: {
              category: {
                select: {
                  id: true,
                  name: true,
                  color: true,
                  icon: true,
                },
              },
            },
          },
        },
        orderBy: [
          // Relevance-based ordering could be added here
          { updatedAt: "desc" },
        ],
        skip,
        take: limit,
      }),
      prisma.entry.count({ where }),
    ]);

    // Decrypt entry content
    const decryptedEntries = entries.map((entry) => ({
      ...entry,
      content: decryptEntryContent(entry.content),
      categories: entry.categories.map((ec) => ec.category),
    }));

    // Track search history (if query is provided)
    if (query) {
      await prisma.searchHistory.create({
        data: {
          userId: session.user.id,
          query,
          resultCount: total,
          filters: {
            fuzzy,
            categoryId,
            dateFrom,
            dateTo,
            published,
          },
        },
      });
    }

    return NextResponse.json({
      entries: decryptedEntries,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
      query: {
        q: query,
        fuzzy,
        categoryId,
        dateFrom,
        dateTo,
        published,
      },
    });
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
