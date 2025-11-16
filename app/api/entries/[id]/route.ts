import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { encryptEntryContent, decryptEntryContent } from "@/lib/encryption";
import { auditLogFromRequest, AuditAction, ResourceType } from "@/lib/audit-log";

interface RouteParams {
  params: {
    id: string;
  };
}

// GET /api/entries/[id] - Get a single entry
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const entry = await prisma.entry.findFirst({
      where: {
        id: params.id,
        userId: session.user.id,
      },
      include: {
        template: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
      },
    });

    if (!entry) {
      return NextResponse.json({ error: "Entry not found" }, { status: 404 });
    }

    // Decrypt content before returning
    const decryptedEntry = {
      ...entry,
      content: decryptEntryContent(entry.content),
    };

    return NextResponse.json(decryptedEntry);
  } catch (error) {
    console.error("GET entry error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PUT /api/entries/[id] - Update an entry
export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify entry belongs to user
    const existingEntry = await prisma.entry.findFirst({
      where: {
        id: params.id,
        userId: session.user.id,
      },
    });

    if (!existingEntry) {
      return NextResponse.json({ error: "Entry not found" }, { status: 404 });
    }

    const body = await request.json();
    const { title, content, templateId, published, changeSummary } = body;

    // Calculate word and character counts if content is updated
    let wordCount = existingEntry.wordCount;
    let charCount = existingEntry.charCount;
    let encryptedContent: string | undefined;

    if (content !== undefined) {
      wordCount = content
        .replace(/<[^>]*>/g, "") // Remove HTML tags
        .split(/\s+/)
        .filter((word: string) => word.length > 0).length;
      charCount = content.replace(/<[^>]*>/g, "").length;
      encryptedContent = encryptEntryContent(content);
    }

    // Get the current version count for this entry
    const versionCount = await prisma.entryVersion.count({
      where: { entryId: params.id },
    });

    // Create a new version before updating (snapshot of current state)
    await prisma.entryVersion.create({
      data: {
        entryId: params.id,
        versionNumber: versionCount + 1,
        title: existingEntry.title,
        content: existingEntry.content, // Already encrypted
        wordCount: existingEntry.wordCount,
        charCount: existingEntry.charCount,
        changeSummary: changeSummary || "Entry updated",
      },
    });

    const entry = await prisma.entry.update({
      where: {
        id: params.id,
      },
      data: {
        ...(title !== undefined && { title }),
        ...(content !== undefined && { content: encryptedContent, wordCount, charCount }),
        ...(templateId !== undefined && { templateId: templateId || null }),
        ...(published !== undefined && { published }),
      },
      include: {
        template: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Decrypt content before returning
    const decryptedEntry = {
      ...entry,
      content: decryptEntryContent(entry.content),
    };

    // Audit log the entry update
    await auditLogFromRequest(
      request,
      session.user.id,
      AuditAction.ENTRY_UPDATE,
      ResourceType.ENTRY,
      entry.id,
      { title: entry.title, updated: true }
    );

    return NextResponse.json(decryptedEntry);
  } catch (error) {
    console.error("PUT entry error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/entries/[id] - Delete an entry
export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify entry belongs to user
    const existingEntry = await prisma.entry.findFirst({
      where: {
        id: params.id,
        userId: session.user.id,
      },
    });

    if (!existingEntry) {
      return NextResponse.json({ error: "Entry not found" }, { status: 404 });
    }

    await prisma.entry.delete({
      where: {
        id: params.id,
      },
    });

    // Audit log the entry deletion
    await auditLogFromRequest(
      request,
      session.user.id,
      AuditAction.ENTRY_DELETE,
      ResourceType.ENTRY,
      params.id,
      { title: existingEntry.title }
    );

    return NextResponse.json({ message: "Entry deleted successfully" });
  } catch (error) {
    console.error("DELETE entry error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
