import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/templates - List all templates (user's own + public)
export async function GET(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const includePublic = searchParams.get("public") !== "false";

    const where: any = includePublic
      ? {
          OR: [{ userId: session.user.id }, { isPublic: true }],
        }
      : {
          userId: session.user.id,
        };

    const templates = await prisma.entryTemplate.findMany({
      where,
      select: {
        id: true,
        name: true,
        description: true,
        content: true,
        isPublic: true,
        userId: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            entries: true,
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    });

    return NextResponse.json({ templates });
  } catch (error) {
    console.error("GET templates error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/templates - Create a new template
export async function POST(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, description, content, isPublic = false } = body;

    if (!name || !content) {
      return NextResponse.json({ error: "Name and content are required" }, { status: 400 });
    }

    const template = await prisma.entryTemplate.create({
      data: {
        name,
        description: description || null,
        content,
        userId: session.user.id,
        isPublic,
      },
    });

    return NextResponse.json(template, { status: 201 });
  } catch (error) {
    console.error("POST template error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
