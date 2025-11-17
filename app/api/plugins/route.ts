import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { pluginManager } from "@/lib/plugins/plugin-manager";

/**
 * GET /api/plugins
 * List installed plugins for current user
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const plugins = await pluginManager.list(session.user.id);
    return NextResponse.json({ plugins });
  } catch (error) {
    console.error("Error listing plugins:", error);
    return NextResponse.json({ error: "Failed to list plugins" }, { status: 500 });
  }
}

/**
 * POST /api/plugins
 * Install a new plugin
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { manifest, permissions } = await request.json();

    if (!manifest) {
      return NextResponse.json({ error: "Manifest is required" }, { status: 400 });
    }

    const pluginId = await pluginManager.install(session.user.id, manifest, permissions || []);

    return NextResponse.json({ success: true, pluginId }, { status: 201 });
  } catch (error) {
    console.error("Error installing plugin:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to install plugin" },
      { status: 500 }
    );
  }
}
