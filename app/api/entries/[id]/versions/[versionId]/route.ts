import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { decryptEntryContent } from "@/lib/encryption";

interface RouteParams {
  params: {
    id: string;
    versionId: string;
  };
}

// GET /api/entries/[id]/versions/[versionId] - Get a specific version
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

    // Get the specific version
    const version = await prisma.entryVersion.findFirst({
      where: {
        id: params.versionId,
        entryId: params.id,
      },
    });

    if (!version) {
      return NextResponse.json({ error: "Version not found" }, { status: 404 });
    }

    // Decrypt content before returning
    const decryptedVersion = {
      ...version,
      content: decryptEntryContent(version.content),
    };

    return NextResponse.json(decryptedVersion);
  } catch (error) {
    console.error("GET version error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
