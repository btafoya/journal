import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

interface RouteParams {
  params: {
    id: string;
  };
}

// GET /api/workspaces/[id] - Get a specific workspace
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const workspace = await prisma.workspace.findFirst({
      where: {
        id: params.id,
        userId: session.user.id,
      },
      include: {
        _count: {
          select: {
            entries: true,
          },
        },
      },
    });

    if (!workspace) {
      return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
    }

    return NextResponse.json(workspace);
  } catch (error) {
    console.error("GET workspace error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PUT /api/workspaces/[id] - Update a workspace
export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify workspace belongs to user
    const existingWorkspace = await prisma.workspace.findFirst({
      where: {
        id: params.id,
        userId: session.user.id,
      },
    });

    if (!existingWorkspace) {
      return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
    }

    const body = await request.json();
    const { name, description, type, isDefault } = body;

    // If setting as default, unset all other defaults
    if (isDefault && !existingWorkspace.isDefault) {
      await prisma.workspace.updateMany({
        where: {
          userId: session.user.id,
          isDefault: true,
        },
        data: {
          isDefault: false,
        },
      });
    }

    const workspace = await prisma.workspace.update({
      where: {
        id: params.id,
      },
      data: {
        ...(name !== undefined && name.trim() && { name: name.trim() }),
        ...(description !== undefined && { description: description?.trim() || null }),
        ...(type !== undefined && { type }),
        ...(isDefault !== undefined && { isDefault }),
      },
      include: {
        _count: {
          select: {
            entries: true,
          },
        },
      },
    });

    return NextResponse.json(workspace);
  } catch (error) {
    console.error("PUT workspace error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/workspaces/[id] - Delete a workspace
export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify workspace belongs to user
    const existingWorkspace = await prisma.workspace.findFirst({
      where: {
        id: params.id,
        userId: session.user.id,
      },
      include: {
        _count: {
          select: {
            entries: true,
          },
        },
      },
    });

    if (!existingWorkspace) {
      return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
    }

    // Prevent deletion of workspace with entries
    if (existingWorkspace._count.entries > 0) {
      return NextResponse.json(
        { error: "Cannot delete workspace with entries. Move or delete entries first." },
        { status: 400 }
      );
    }

    // Prevent deletion of default workspace
    if (existingWorkspace.isDefault) {
      return NextResponse.json(
        { error: "Cannot delete the default workspace. Set another workspace as default first." },
        { status: 400 }
      );
    }

    await prisma.workspace.delete({
      where: {
        id: params.id,
      },
    });

    return NextResponse.json({ message: "Workspace deleted successfully" });
  } catch (error) {
    console.error("DELETE workspace error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
