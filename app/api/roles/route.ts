import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendRoleAssignmentNotification } from "@/lib/email";
import { z } from "zod";
import { UserRole } from "@prisma/client";

// Validation schema
const assignRoleSchema = z.object({
  userId: z.string().cuid(),
  role: z.enum(["ADMIN", "EDITOR", "VIEWER"]),
  workspaceId: z.string().cuid().optional(),
});

/**
 * Helper to check if user has ADMIN role
 */
async function isAdmin(userId: string): Promise<boolean> {
  const adminRole = await prisma.userRoleAssignment.findFirst({
    where: {
      userId,
      role: "ADMIN",
      workspaceId: null, // Global admin
    },
  });

  return !!adminRole;
}

/**
 * GET /api/roles
 * Get all role assignments (ADMIN only)
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin
    const hasAdminAccess = await isAdmin(session.user.id);
    if (!hasAdminAccess) {
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
    }

    const searchParams = request.nextUrl.searchParams;
    const workspaceId = searchParams.get("workspaceId");

    // Get role assignments
    const roles = await prisma.userRoleAssignment.findMany({
      where: workspaceId ? { workspaceId } : {},
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        workspace: {
          select: {
            id: true,
            name: true,
          },
        },
        assignedByUser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({ roles });
  } catch (error) {
    console.error("Error fetching roles:", error);
    return NextResponse.json({ error: "Failed to fetch roles" }, { status: 500 });
  }
}

/**
 * POST /api/roles
 * Assign a role to a user (ADMIN only)
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin
    const hasAdminAccess = await isAdmin(session.user.id);
    if (!hasAdminAccess) {
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
    }

    const body = await request.json();
    const validation = assignRoleSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ error: "Invalid input", details: validation.error }, { status: 400 });
    }

    const { userId, role, workspaceId } = validation.data;

    // Verify target user exists
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
      },
    });

    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // If workspace-specific, verify workspace exists
    let workspace = null;
    if (workspaceId) {
      workspace = await prisma.workspace.findUnique({
        where: { id: workspaceId },
        select: {
          id: true,
          name: true,
        },
      });

      if (!workspace) {
        return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
      }
    }

    // Create or update role assignment
    const roleAssignment = await prisma.userRoleAssignment.upsert({
      where: {
        userId_workspaceId: {
          userId,
          workspaceId: workspaceId || null,
        },
      },
      create: {
        userId,
        role: role as UserRole,
        workspaceId,
        assignedBy: session.user.id,
      },
      update: {
        role: role as UserRole,
        assignedBy: session.user.id,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        workspace: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Send email notification
    if (targetUser.email) {
      await sendRoleAssignmentNotification({
        recipientEmail: targetUser.email,
        recipientName: targetUser.name || "User",
        role,
        workspaceName: workspace?.name,
        assignedByName: session.user.name || session.user.email || "Admin",
        userId: targetUser.id,
      });
    }

    return NextResponse.json({ roleAssignment }, { status: 201 });
  } catch (error) {
    console.error("Error assigning role:", error);
    return NextResponse.json({ error: "Failed to assign role" }, { status: 500 });
  }
}
