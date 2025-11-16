import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

interface RouteParams {
  params: {
    id: string;
  };
}

// GET /api/templates/[id] - Get a single template
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const template = await prisma.entryTemplate.findFirst({
      where: {
        id: params.id,
        OR: [{ userId: session.user.id }, { isPublic: true }],
      },
      include: {
        _count: {
          select: {
            entries: true,
          },
        },
      },
    });

    if (!template) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 });
    }

    return NextResponse.json(template);
  } catch (error) {
    console.error("GET template error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PUT /api/templates/[id] - Update a template
export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify template belongs to user
    const existingTemplate = await prisma.entryTemplate.findFirst({
      where: {
        id: params.id,
        userId: session.user.id,
      },
    });

    if (!existingTemplate) {
      return NextResponse.json({ error: "Template not found or not authorized" }, { status: 404 });
    }

    const body = await request.json();
    const { name, description, content, isPublic } = body;

    const template = await prisma.entryTemplate.update({
      where: {
        id: params.id,
      },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description: description || null }),
        ...(content !== undefined && { content }),
        ...(isPublic !== undefined && { isPublic }),
      },
    });

    return NextResponse.json(template);
  } catch (error) {
    console.error("PUT template error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/templates/[id] - Delete a template
export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify template belongs to user
    const existingTemplate = await prisma.entryTemplate.findFirst({
      where: {
        id: params.id,
        userId: session.user.id,
      },
    });

    if (!existingTemplate) {
      return NextResponse.json({ error: "Template not found or not authorized" }, { status: 404 });
    }

    // Note: Deleting a template will set templateId to null on entries due to onDelete: SetNull
    await prisma.entryTemplate.delete({
      where: {
        id: params.id,
      },
    });

    return NextResponse.json({ message: "Template deleted successfully" });
  } catch (error) {
    console.error("DELETE template error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
