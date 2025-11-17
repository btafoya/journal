import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { themeManager } from "@/lib/themes/theme-manager";

/**
 * DELETE /api/themes/[id]
 * Uninstall a theme
 */
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await themeManager.uninstall(session.user.id, params.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error uninstalling theme:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to uninstall theme" },
      { status: 500 }
    );
  }
}
