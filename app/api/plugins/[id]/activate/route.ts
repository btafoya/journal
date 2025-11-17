import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { pluginManager } from "@/lib/plugins/plugin-manager";

/**
 * POST /api/plugins/[id]/activate
 * Activate a plugin
 */
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await pluginManager.activate(session.user.id, params.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error activating plugin:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to activate plugin" },
      { status: 500 }
    );
  }
}
