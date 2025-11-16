import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendCommentNotification } from "@/lib/email";
import { z } from "zod";

// Validation schema
const createCommentSchema = z.object({
  entryId: z.string().cuid(),
  content: z.string().min(1).max(10000),
  parentId: z.string().cuid().optional(),
});

/**
 * GET /api/comments?entryId=xxx
 * Get all comments for an entry (with threading)
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const entryId = searchParams.get("entryId");

    if (!entryId) {
      return NextResponse.json({ error: "Entry ID is required" }, { status: 400 });
    }

    // Verify user has access to the entry
    const entry = await prisma.entry.findUnique({
      where: { id: entryId },
      include: {
        sharedWith: {
          where: {
            sharedWith: session.user.email!,
          },
        },
      },
    });

    if (!entry) {
      return NextResponse.json({ error: "Entry not found" }, { status: 404 });
    }

    // Check access: user owns entry OR entry is shared with user
    const hasAccess = entry.userId === session.user.id || entry.sharedWith.length > 0;

    if (!hasAccess) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get all comments with user information
    const comments = await prisma.comment.findMany({
      where: { entryId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        replies: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
              },
            },
          },
          orderBy: {
            createdAt: "asc",
          },
        },
      },
      where: {
        parentId: null, // Only get top-level comments
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({ comments });
  } catch (error) {
    console.error("Error fetching comments:", error);
    return NextResponse.json({ error: "Failed to fetch comments" }, { status: 500 });
  }
}

/**
 * POST /api/comments
 * Create a new comment
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validation = createCommentSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ error: "Invalid input", details: validation.error }, { status: 400 });
    }

    const { entryId, content, parentId } = validation.data;

    // Verify entry exists and user has permission to comment
    const entry = await prisma.entry.findUnique({
      where: { id: entryId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        sharedWith: {
          where: {
            sharedWith: session.user.email!,
            permission: "comment",
          },
        },
      },
    });

    if (!entry) {
      return NextResponse.json({ error: "Entry not found" }, { status: 404 });
    }

    // Check permission: owner can comment, or shared with comment permission
    const canComment = entry.userId === session.user.id || entry.sharedWith.length > 0;

    if (!canComment) {
      return NextResponse.json({ error: "You don't have permission to comment on this entry" }, { status: 403 });
    }

    // If replying to a comment, verify parent exists
    if (parentId) {
      const parentComment = await prisma.comment.findUnique({
        where: { id: parentId },
      });

      if (!parentComment || parentComment.entryId !== entryId) {
        return NextResponse.json({ error: "Parent comment not found" }, { status: 404 });
      }
    }

    // Create comment
    const comment = await prisma.comment.create({
      data: {
        entryId,
        userId: session.user.id,
        content,
        parentId,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
    });

    // Send email notification to entry owner (if not commenting on own entry)
    if (entry.userId !== session.user.id && entry.user.email) {
      await sendCommentNotification({
        recipientEmail: entry.user.email,
        recipientName: entry.user.name || "User",
        commenterName: session.user.name || session.user.email || "Anonymous",
        entryTitle: entry.title,
        commentContent: content,
        entryId: entry.id,
        commentId: comment.id,
        userId: entry.userId,
      });
    }

    return NextResponse.json({ comment }, { status: 201 });
  } catch (error) {
    console.error("Error creating comment:", error);
    return NextResponse.json({ error: "Failed to create comment" }, { status: 500 });
  }
}
