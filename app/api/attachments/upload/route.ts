import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  encryptFile,
  validateFileType,
  validateFileSize,
  getFileSizeLimit,
  formatFileSize,
} from "@/lib/file-encryption";
import { auditLogFromRequest, AuditAction, ResourceType } from "@/lib/audit-log";
import crypto from "crypto";

// POST /api/attachments/upload - Upload a file attachment
export async function POST(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const entryId = formData.get("entryId") as string | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file type
    if (!validateFileType(file.type)) {
      return NextResponse.json(
        { error: `File type not allowed: ${file.type}` },
        { status: 400 }
      );
    }

    // Validate file size
    if (!validateFileSize(file.size)) {
      return NextResponse.json(
        {
          error: `File size exceeds limit. Max: ${formatFileSize(getFileSizeLimit())}, Yours: ${formatFileSize(file.size)}`,
        },
        { status: 400 }
      );
    }

    // If entryId is provided, verify it belongs to the user
    if (entryId) {
      const entry = await prisma.entry.findFirst({
        where: {
          id: entryId,
          userId: session.user.id,
        },
      });

      if (!entry) {
        return NextResponse.json({ error: "Entry not found" }, { status: 404 });
      }
    }

    // Read file as buffer
    const arrayBuffer = await file.arrayBuffer();
    const fileBuffer = Buffer.from(arrayBuffer);

    // Encrypt file
    const encryptedBuffer = encryptFile(fileBuffer);

    // Generate unique filename
    const fileExtension = file.name.split(".").pop() || "";
    const uniqueFilename = `${crypto.randomUUID()}.${fileExtension}`;

    // Create attachment record
    const attachment = await prisma.attachment.create({
      data: {
        userId: session.user.id,
        entryId: entryId || null,
        filename: uniqueFilename,
        originalName: file.name,
        mimeType: file.type,
        size: file.size,
        data: encryptedBuffer,
      },
      select: {
        id: true,
        filename: true,
        originalName: true,
        mimeType: true,
        size: true,
        entryId: true,
        createdAt: true,
      },
    });

    // Audit log the upload
    await auditLogFromRequest(
      request,
      session.user.id,
      AuditAction.ATTACHMENT_UPLOAD,
      ResourceType.ATTACHMENT,
      attachment.id,
      {
        filename: attachment.originalName,
        size: attachment.size,
        mimeType: attachment.mimeType,
        entryId: attachment.entryId,
      }
    );

    return NextResponse.json(attachment, { status: 201 });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Failed to upload file" }, { status: 500 });
  }
}

// Configure Next.js API route for file uploads
export const config = {
  api: {
    bodyParser: false, // Disable body parsing to handle multipart/form-data
  },
};
