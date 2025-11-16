import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { auditLogFromRequest, AuditAction, ResourceType } from "@/lib/audit-log";

interface RouteParams {
  params: {
    id: string;
  };
}

// GET /api/entries/[id]/share - Get all shares for an entry
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

    const shares = await prisma.sharedEntry.findMany({
      where: {
        entryId: params.id,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({ shares });
  } catch (error) {
    console.error("GET shares error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/entries/[id]/share - Share an entry with another user
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

    const body = await request.json();
    const { sharedWith, permission = "view", message, expiresAt } = body;

    if (!sharedWith || !sharedWith.trim()) {
      return NextResponse.json({ error: "Email address is required" }, { status: 400 });
    }

    // Validate permission level
    if (permission !== "view" && permission !== "comment") {
      return NextResponse.json(
        { error: "Permission must be 'view' or 'comment'" },
        { status: 400 }
      );
    }

    // Prevent sharing with self
    if (sharedWith.toLowerCase() === session.user.email?.toLowerCase()) {
      return NextResponse.json({ error: "Cannot share entry with yourself" }, { status: 400 });
    }

    // Create or update the share
    const share = await prisma.sharedEntry.upsert({
      where: {
        entryId_sharedWith: {
          entryId: params.id,
          sharedWith: sharedWith.toLowerCase().trim(),
        },
      },
      create: {
        entryId: params.id,
        userId: session.user.id,
        sharedWith: sharedWith.toLowerCase().trim(),
        permission,
        message: message?.trim() || null,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
      },
      update: {
        permission,
        message: message?.trim() || null,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
      },
    });

    // Audit log the share
    await auditLogFromRequest(
      request,
      session.user.id,
      AuditAction.ENTRY_SHARE,
      ResourceType.ENTRY,
      entry.id,
      { sharedWith: share.sharedWith, permission: share.permission }
    );

    return NextResponse.json(share, { status: 201 });
  } catch (error) {
    console.error("POST share error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/entries/[id]/share - Remove a share
export async function DELETE(request: Request, { params }: RouteParams) {
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
    const sharedWith = searchParams.get("sharedWith");

    if (!sharedWith) {
      return NextResponse.json({ error: "sharedWith parameter is required" }, { status: 400 });
    }

    const deletedShare = await prisma.sharedEntry.deleteMany({
      where: {
        entryId: params.id,
        sharedWith: sharedWith.toLowerCase(),
      },
    });

    if (deletedShare.count === 0) {
      return NextResponse.json({ error: "Share not found" }, { status: 404 });
    }

    // Audit log the unshare
    await auditLogFromRequest(
      request,
      session.user.id,
      AuditAction.ENTRY_UNSHARE,
      ResourceType.ENTRY,
      entry.id,
      { sharedWith }
    );

    return NextResponse.json({ message: "Share removed successfully" });
  } catch (error) {
    console.error("DELETE share error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
