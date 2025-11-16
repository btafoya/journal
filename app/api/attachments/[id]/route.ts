import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { decryptFile } from "@/lib/file-encryption";
import { auditLogFromRequest, AuditAction, ResourceType } from "@/lib/audit-log";

interface RouteParams {
  params: {
    id: string;
  };
}

// GET /api/attachments/[id] - Get attachment metadata
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const download = searchParams.get("download") === "true";

    const attachment = await prisma.attachment.findFirst({
      where: {
        id: params.id,
        userId: session.user.id,
      },
    });

    if (!attachment) {
      return NextResponse.json({ error: "Attachment not found" }, { status: 404 });
    }

    // If download flag is set, decrypt and return file
    if (download) {
      try {
        const decryptedBuffer = decryptFile(attachment.data);

        return new NextResponse(decryptedBuffer, {
          headers: {
            "Content-Type": attachment.mimeType,
            "Content-Disposition": `attachment; filename="${attachment.originalName}"`,
            "Content-Length": decryptedBuffer.length.toString(),
          },
        });
      } catch (error) {
        console.error("Decryption error:", error);
        return NextResponse.json({ error: "Failed to decrypt file" }, { status: 500 });
      }
    }

    // Return metadata only
    const { data, thumbnail, ...metadata } = attachment;

    return NextResponse.json(metadata);
  } catch (error) {
    console.error("GET attachment error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/attachments/[id] - Delete an attachment
export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const attachment = await prisma.attachment.findFirst({
      where: {
        id: params.id,
        userId: session.user.id,
      },
    });

    if (!attachment) {
      return NextResponse.json({ error: "Attachment not found" }, { status: 404 });
    }

    await prisma.attachment.delete({
      where: {
        id: params.id,
      },
    });

    // Audit log the deletion
    await auditLogFromRequest(
      request,
      session.user.id,
      AuditAction.ATTACHMENT_DELETE,
      ResourceType.ATTACHMENT,
      params.id,
      { filename: attachment.originalName }
    );

    return NextResponse.json({ message: "Attachment deleted successfully" });
  } catch (error) {
    console.error("DELETE attachment error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
