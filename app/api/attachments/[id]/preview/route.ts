import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { decryptFile } from "@/lib/file-encryption";

interface RouteParams {
  params: {
    id: string;
  };
}

// GET /api/attachments/[id]/preview - Get inline preview of attachment
export async function GET(request: Request, { params }: RouteParams) {
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

    // Only allow preview for certain file types
    const previewableTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/gif",
      "image/webp",
      "application/pdf",
      "text/plain",
    ];

    if (!previewableTypes.includes(attachment.mimeType)) {
      return NextResponse.json(
        { error: "File type not previewable. Use download instead." },
        { status: 400 }
      );
    }

    try {
      const decryptedBuffer = decryptFile(attachment.data);

      return new NextResponse(decryptedBuffer, {
        headers: {
          "Content-Type": attachment.mimeType,
          "Content-Disposition": `inline; filename="${attachment.originalName}"`,
          "Content-Length": decryptedBuffer.length.toString(),
          "Cache-Control": "private, max-age=3600",
        },
      });
    } catch (error) {
      console.error("Decryption error:", error);
      return NextResponse.json({ error: "Failed to decrypt file" }, { status: 500 });
    }
  } catch (error) {
    console.error("Preview error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
