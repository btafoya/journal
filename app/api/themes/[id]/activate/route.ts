import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { themeManager } from "@/lib/themes/theme-manager";

/**
 * POST /api/themes/[id]/activate
 * Activate a theme
 */
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await themeManager.activate(session.user.id, params.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error activating theme:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to activate theme" },
      { status: 500 }
    );
  }
}
