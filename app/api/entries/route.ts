import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { encryptEntryContent, decryptEntryContent } from "@/lib/encryption";
import { auditLogFromRequest, AuditAction, ResourceType } from "@/lib/audit-log";

// GET /api/entries - List all entries for the authenticated user
export async function GET(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const search = searchParams.get("search") || "";
    const published = searchParams.get("published");
    const workspaceId = searchParams.get("workspaceId");

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {
      userId: session.user.id,
    };

    if (search) {
      where.OR = [{ title: { contains: search, mode: "insensitive" } }, { content: { contains: search, mode: "insensitive" } }];
    }

    if (published !== null && published !== undefined) {
      where.published = published === "true";
    }

    if (workspaceId) {
      where.workspaceId = workspaceId;
    }

    // Get entries with pagination
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
          workspace: {
            select: {
              id: true,
              name: true,
              type: true,
            },
          },
        },
        orderBy: {
          updatedAt: "desc",
        },
        skip,
        take: limit,
      }),
      prisma.entry.count({ where }),
    ]);

    // Decrypt entry content before returning
    const decryptedEntries = entries.map((entry) => ({
      ...entry,
      content: decryptEntryContent(entry.content),
    }));

    return NextResponse.json({
      entries: decryptedEntries,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("GET entries error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/entries - Create a new entry
export async function POST(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { title, content, templateId, workspaceId, published = false, categoryIds = [] } = body;

    if (!title || !content) {
      return NextResponse.json({ error: "Title and content are required" }, { status: 400 });
    }

    // If workspaceId is provided, verify it belongs to the user
    if (workspaceId) {
      const workspace = await prisma.workspace.findFirst({
        where: {
          id: workspaceId,
          userId: session.user.id,
        },
      });

      if (!workspace) {
        return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
      }
    } else {
      // If no workspace specified, try to use default workspace
      const defaultWorkspace = await prisma.workspace.findFirst({
        where: {
          userId: session.user.id,
          isDefault: true,
        },
      });

      // Use default workspace if it exists
      if (defaultWorkspace) {
        body.workspaceId = defaultWorkspace.id;
      }
    }

    // Calculate word and character counts (before encryption)
    const wordCount = content
      .replace(/<[^>]*>/g, "") // Remove HTML tags
      .split(/\s+/)
      .filter((word: string) => word.length > 0).length;
    const charCount = content.replace(/<[^>]*>/g, "").length;

    // Encrypt content before storing
    const encryptedContent = encryptEntryContent(content);

    const entry = await prisma.entry.create({
      data: {
        title,
        content: encryptedContent,
        userId: session.user.id,
        templateId: templateId || null,
        workspaceId: body.workspaceId || null,
        wordCount,
        charCount,
        published,
        categories: {
          create: categoryIds.map((categoryId: string) => ({
            category: {
              connect: { id: categoryId },
            },
          })),
        },
      },
      include: {
        template: {
          select: {
            id: true,
            name: true,
          },
        },
        workspace: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
        categories: {
          include: {
            category: true,
          },
        },
      },
    });

    // Decrypt content before returning
    const decryptedEntry = {
      ...entry,
      content: decryptEntryContent(entry.content),
    };

    // Audit log the entry creation
    await auditLogFromRequest(
      request,
      session.user.id,
      AuditAction.ENTRY_CREATE,
      ResourceType.ENTRY,
      entry.id,
      { title: entry.title, published: entry.published }
    );

    return NextResponse.json(decryptedEntry, { status: 201 });
  } catch (error) {
    console.error("POST entry error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
