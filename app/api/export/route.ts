import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { decryptEntryContent } from "@/lib/encryption";
import { decryptFile } from "@/lib/file-encryption";
import {
  entryToMarkdown,
  entryToPdfHtml,
  entryToStandaloneHtml,
  createFullExport,
  type ExportedEntry,
  type ExportedCategory,
  type ExportedWorkspace,
} from "@/lib/import-export";
import { auditLogFromRequest, AuditAction, ResourceType } from "@/lib/audit-log";

// GET /api/export?format=markdown|pdf|html|json&entryIds=id1,id2
export async function GET(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const format = searchParams.get("format") || "json";
    const entryIdsParam = searchParams.get("entryIds");
    const workspaceId = searchParams.get("workspaceId");
    const categoryId = searchParams.get("categoryId");

    // Build where clause
    const where: any = {
      userId: session.user.id,
    };

    if (entryIdsParam) {
      const entryIds = entryIdsParam.split(",");
      where.id = { in: entryIds };
    }

    if (workspaceId) {
      where.workspaceId = workspaceId;
    }

    if (categoryId) {
      where.categories = {
        some: {
          categoryId: categoryId,
        },
      };
    }

    // Fetch entries with relations
    const entries = await prisma.entry.findMany({
      where,
      include: {
        categories: {
          include: {
            category: true,
          },
        },
        workspace: true,
        attachments: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    if (entries.length === 0) {
      return NextResponse.json({ error: "No entries found" }, { status: 404 });
    }

    // Transform entries to exported format
    const exportedEntries: ExportedEntry[] = await Promise.all(
      entries.map(async (entry) => {
        const attachments = await Promise.all(
          entry.attachments.map(async (att) => {
            const decryptedData = decryptFile(att.data);
            return {
              filename: att.filename,
              originalName: att.originalName,
              mimeType: att.mimeType,
              size: att.size,
              data: decryptedData.toString("base64"),
            };
          })
        );

        return {
          id: entry.id,
          title: entry.title,
          content: decryptEntryContent(entry.content),
          wordCount: entry.wordCount,
          charCount: entry.charCount,
          published: entry.published,
          categories: entry.categories.map((ec) => ec.category.name),
          workspace: entry.workspace?.name || null,
          attachments,
          createdAt: entry.createdAt.toISOString(),
          updatedAt: entry.updatedAt.toISOString(),
        };
      })
    );

    // Create audit log
    await auditLogFromRequest(
      request,
      session.user.id,
      AuditAction.ACCOUNT_EXPORT,
      ResourceType.ENTRY,
      null,
      { format, entryCount: entries.length }
    );

    // Generate export based on format
    switch (format.toLowerCase()) {
      case "markdown": {
        const markdown = exportedEntries.map((entry) => entryToMarkdown(entry)).join("\n\n---\n\n");

        return new NextResponse(markdown, {
          headers: {
            "Content-Type": "text/markdown",
            "Content-Disposition": `attachment; filename="openjournal-export-${Date.now()}.md"`,
          },
        });
      }

      case "pdf": {
        // For PDF, we'll return HTML that can be printed to PDF by the browser
        const html = exportedEntries.map((entry) => entryToPdfHtml(entry)).join('\n<div style="page-break-after: always;"></div>\n');

        return new NextResponse(html, {
          headers: {
            "Content-Type": "text/html",
            "Content-Disposition": `inline; filename="openjournal-export-${Date.now()}.html"`,
          },
        });
      }

      case "html": {
        if (exportedEntries.length === 1) {
          // Single entry - return standalone HTML
          const html = entryToStandaloneHtml(exportedEntries[0]);

          return new NextResponse(html, {
            headers: {
              "Content-Type": "text/html",
              "Content-Disposition": `attachment; filename="${exportedEntries[0].title.replace(/[^a-z0-9]/gi, "-")}.html"`,
            },
          });
        } else {
          // Multiple entries - create index
          const indexHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>OpenJournal Export</title>
  <style>
    body { font-family: system-ui; max-width: 800px; margin: 2rem auto; padding: 0 1rem; }
    h1 { border-bottom: 2px solid #333; padding-bottom: 1rem; }
    .entry { margin: 2rem 0; padding: 1.5rem; border: 1px solid #ddd; border-radius: 8px; }
    .entry h2 { margin-top: 0; }
    .metadata { color: #666; font-size: 0.875rem; }
  </style>
</head>
<body>
  <h1>OpenJournal Export</h1>
  <p>Exported ${exportedEntries.length} entries on ${new Date().toLocaleDateString()}</p>
  ${exportedEntries
    .map(
      (entry) => `
  <article class="entry">
    <h2>${entry.title}</h2>
    <div class="metadata">
      ${new Date(entry.createdAt).toLocaleDateString()} | ${entry.wordCount} words
      ${entry.categories.length > 0 ? `| ${entry.categories.join(", ")}` : ""}
    </div>
    <div style="margin-top: 1rem;">
      ${entry.content}
    </div>
  </article>
  `
    )
    .join("")}
</body>
</html>`;

          return new NextResponse(indexHtml, {
            headers: {
              "Content-Type": "text/html",
              "Content-Disposition": `attachment; filename="openjournal-export-${Date.now()}.html"`,
            },
          });
        }
      }

      case "json":
      default: {
        // Fetch categories and workspaces for full export
        const categories = await prisma.category.findMany({
          where: { userId: session.user.id },
        });

        const workspaces = await prisma.workspace.findMany({
          where: { userId: session.user.id },
        });

        const exportedCategories: ExportedCategory[] = categories.map((cat) => ({
          id: cat.id,
          name: cat.name,
          description: cat.description,
          color: cat.color,
          icon: cat.icon,
          parentId: cat.parentId,
          order: cat.order,
          createdAt: cat.createdAt.toISOString(),
          updatedAt: cat.updatedAt.toISOString(),
        }));

        const exportedWorkspaces: ExportedWorkspace[] = workspaces.map((ws) => ({
          id: ws.id,
          name: ws.name,
          description: ws.description,
          type: ws.type,
          isDefault: ws.isDefault,
          createdAt: ws.createdAt.toISOString(),
          updatedAt: ws.updatedAt.toISOString(),
        }));

        const fullExport = createFullExport(exportedEntries, exportedCategories, exportedWorkspaces);

        return new NextResponse(JSON.stringify(fullExport, null, 2), {
          headers: {
            "Content-Type": "application/json",
            "Content-Disposition": `attachment; filename="openjournal-export-${Date.now()}.json"`,
          },
        });
      }
    }
  } catch (error) {
    console.error("Export error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
