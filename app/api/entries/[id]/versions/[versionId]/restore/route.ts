import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { auditLogFromRequest, AuditAction, ResourceType } from "@/lib/audit-log";

interface RouteParams {
  params: {
    id: string;
    versionId: string;
  };
}

// POST /api/entries/[id]/versions/[versionId]/restore - Restore a version
export async function POST(request: Request, { params }: RouteParams) {
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

    // Get the version to restore
    const versionToRestore = await prisma.entryVersion.findFirst({
      where: {
        id: params.versionId,
        entryId: params.id,
      },
    });

    if (!versionToRestore) {
      return NextResponse.json({ error: "Version not found" }, { status: 404 });
    }

    // Get the current version count
    const versionCount = await prisma.entryVersion.count({
      where: { entryId: params.id },
    });

    // Create a version snapshot of the current state before restoring
    await prisma.entryVersion.create({
      data: {
        entryId: params.id,
        versionNumber: versionCount + 1,
        title: entry.title,
        content: entry.content, // Already encrypted
        wordCount: entry.wordCount,
        charCount: entry.charCount,
        changeSummary: `Before restoring to version ${versionToRestore.versionNumber}`,
      },
    });

    // Restore the entry to the selected version
    const restoredEntry = await prisma.entry.update({
      where: {
        id: params.id,
      },
      data: {
        title: versionToRestore.title,
        content: versionToRestore.content, // Already encrypted
        wordCount: versionToRestore.wordCount,
        charCount: versionToRestore.charCount,
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

    // Audit log the restore operation
    await auditLogFromRequest(
      request,
      session.user.id,
      AuditAction.ENTRY_VERSION_RESTORE,
      ResourceType.ENTRY,
      entry.id,
      {
        restoredFromVersion: versionToRestore.versionNumber,
        versionId: versionToRestore.id,
      }
    );

    return NextResponse.json({
      message: "Entry restored successfully",
      entry: restoredEntry,
      restoredFromVersion: versionToRestore.versionNumber,
    });
  } catch (error) {
    console.error("Restore version error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
