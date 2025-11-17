import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { themeManager } from "@/lib/themes/theme-manager";

/**
 * GET /api/themes
 * List installed themes for current user
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const themes = await themeManager.list(session.user.id);
    const activeTheme = await themeManager.getActiveTheme(session.user.id);

    return NextResponse.json({ themes, activeTheme });
  } catch (error) {
    console.error("Error listing themes:", error);
    return NextResponse.json({ error: "Failed to list themes" }, { status: 500 });
  }
}

/**
 * POST /api/themes
 * Install a new theme
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { manifest, config } = await request.json();

    if (!manifest) {
      return NextResponse.json({ error: "Manifest is required" }, { status: 400 });
    }

    const themeId = await themeManager.install(session.user.id, manifest, config || {});

    return NextResponse.json({ success: true, themeId }, { status: 201 });
  } catch (error) {
    console.error("Error installing theme:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to install theme" },
      { status: 500 }
    );
  }
}
