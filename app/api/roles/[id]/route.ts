import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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
 * DELETE /api/roles/[id]
 * Remove a role assignment (ADMIN only)
 */
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
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

    const { id } = params;

    // Verify role assignment exists
    const roleAssignment = await prisma.userRoleAssignment.findUnique({
      where: { id },
    });

    if (!roleAssignment) {
      return NextResponse.json({ error: "Role assignment not found" }, { status: 404 });
    }

    // Prevent removing own admin role
    if (roleAssignment.userId === session.user.id && roleAssignment.role === "ADMIN" && !roleAssignment.workspaceId) {
      return NextResponse.json(
        { error: "You cannot remove your own global admin role" },
        { status: 400 }
      );
    }

    // Delete role assignment
    await prisma.userRoleAssignment.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting role:", error);
    return NextResponse.json({ error: "Failed to delete role" }, { status: 500 });
  }
}
