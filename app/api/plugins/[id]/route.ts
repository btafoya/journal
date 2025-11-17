import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { pluginManager } from "@/lib/plugins/plugin-manager";

/**
 * DELETE /api/plugins/[id]
 * Uninstall a plugin
 */
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await pluginManager.uninstall(session.user.id, params.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error uninstalling plugin:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to uninstall plugin" },
      { status: 500 }
    );
  }
}
