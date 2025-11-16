import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { encryptEntryContent } from "@/lib/encryption";
import { encryptFile } from "@/lib/file-encryption";
import {
  markdownToEntry,
  parseEvernoteEnex,
  parseFullExport,
  type ImportResult,
  type EvernoteNote,
} from "@/lib/import-export";
import { auditLogFromRequest, AuditAction, ResourceType } from "@/lib/audit-log";

// POST /api/import
export async function POST(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const format = formData.get("format") as string;
    const workspaceId = formData.get("workspaceId") as string | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!format) {
      return NextResponse.json({ error: "Format not specified" }, { status: 400 });
    }

    const fileContent = await file.text();
    const result: ImportResult = {
      success: false,
      entriesImported: 0,
      categoriesImported: 0,
      attachmentsImported: 0,
      errors: [],
    };

    try {
      switch (format.toLowerCase()) {
        case "evernote":
        case "enex": {
          const notes = parseEvernoteEnex(fileContent);

          for (const note of notes) {
            try {
              await importEvernoteNote(note, session.user.id, workspaceId);
              result.entriesImported++;
              result.attachmentsImported += note.resources.length;
            } catch (error: any) {
              result.errors.push(`Failed to import "${note.title}": ${error.message}`);
            }
          }

          // Import tags as categories
          const allTags = Array.from(new Set(notes.flatMap((note) => note.tags)));
          for (const tag of allTags) {
            try {
              await prisma.category.upsert({
                where: {
                  userId_name: {
                    userId: session.user.id,
                    name: tag,
                  },
                },
                update: {},
                create: {
                  name: tag,
                  userId: session.user.id,
                  description: `Imported from Evernote`,
                },
              });
              result.categoriesImported++;
            } catch (error) {
              // Ignore duplicate category errors
            }
          }

          break;
        }

        case "markdown":
        case "md": {
          // Single markdown file or multiple entries separated by ---
          const sections = fileContent.split(/\n---\n/);

          for (const section of sections) {
            if (section.trim()) {
              try {
                const entryData = markdownToEntry(section);
                await importEntry(entryData, session.user.id, workspaceId);
                result.entriesImported++;
              } catch (error: any) {
                result.errors.push(`Failed to import markdown section: ${error.message}`);
              }
            }
          }

          break;
        }

        case "html": {
          // Simple HTML import - extract title and content
          const titleMatch = fileContent.match(/<title>(.*?)<\/title>/i);
          const title = titleMatch ? titleMatch[1] : file.name.replace(/\.html?$/i, "");

          // Extract body content
          const bodyMatch = fileContent.match(/<body[^>]*>([\s\S]*)<\/body>/i);
          const content = bodyMatch ? bodyMatch[1].trim() : fileContent;

          const entry = await prisma.entry.create({
            data: {
              title,
              content: encryptEntryContent(content),
              wordCount: content.split(/\s+/).length,
              charCount: content.length,
              userId: session.user.id,
              workspaceId: workspaceId || undefined,
            },
          });

          result.entriesImported++;
          break;
        }

        case "json": {
          const data = parseFullExport(fileContent);

          // Import workspaces first
          for (const workspace of data.workspaces || []) {
            try {
              await prisma.workspace.upsert({
                where: {
                  id: workspace.id,
                },
                update: {
                  name: workspace.name,
                  description: workspace.description,
                  type: workspace.type,
                },
                create: {
                  id: workspace.id,
                  name: workspace.name,
                  description: workspace.description,
                  type: workspace.type,
                  isDefault: false, // Don't override default workspace
                  userId: session.user.id,
                },
              });
            } catch (error: any) {
              result.errors.push(`Failed to import workspace "${workspace.name}": ${error.message}`);
            }
          }

          // Import categories
          for (const category of data.categories || []) {
            try {
              await prisma.category.upsert({
                where: {
                  id: category.id,
                },
                update: {
                  name: category.name,
                  description: category.description,
                  color: category.color,
                  icon: category.icon,
                  order: category.order,
                },
                create: {
                  id: category.id,
                  name: category.name,
                  description: category.description,
                  color: category.color,
                  icon: category.icon,
                  parentId: category.parentId,
                  order: category.order,
                  userId: session.user.id,
                },
              });
              result.categoriesImported++;
            } catch (error: any) {
              result.errors.push(`Failed to import category "${category.name}": ${error.message}`);
            }
          }

          // Import entries
          for (const entryData of data.entries) {
            try {
              await importEntry(entryData, session.user.id, null);
              result.entriesImported++;
              result.attachmentsImported += entryData.attachments?.length || 0;
            } catch (error: any) {
              result.errors.push(`Failed to import entry "${entryData.title}": ${error.message}`);
            }
          }

          break;
        }

        default:
          return NextResponse.json({ error: `Unsupported format: ${format}` }, { status: 400 });
      }

      result.success = result.errors.length === 0 || result.entriesImported > 0;

      // Create audit log
      await auditLogFromRequest(
        request,
        session.user.id,
        "data.import",
        ResourceType.ENTRY,
        null,
        {
          format,
          ...result,
        }
      );

      return NextResponse.json(result);
    } catch (error: any) {
      console.error("Import processing error:", error);
      result.errors.push(`Import failed: ${error.message}`);
      return NextResponse.json(result, { status: 500 });
    }
  } catch (error) {
    console.error("Import error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// Helper function to import an Evernote note
async function importEvernoteNote(note: EvernoteNote, userId: string, workspaceId: string | null) {
  const wordCount = note.content.split(/\s+/).length;
  const charCount = note.content.length;

  const entry = await prisma.entry.create({
    data: {
      title: note.title,
      content: encryptEntryContent(note.content),
      wordCount,
      charCount,
      userId,
      workspaceId: workspaceId || undefined,
      createdAt: note.created,
      updatedAt: note.updated,
    },
  });

  // Import attachments
  for (const resource of note.resources) {
    const fileData = Buffer.from(resource.data, "base64");
    const encryptedData = encryptFile(fileData);

    await prisma.attachment.create({
      data: {
        userId,
        entryId: entry.id,
        filename: resource.filename || `attachment-${Date.now()}`,
        originalName: resource.filename || "Unnamed",
        mimeType: resource.mime,
        size: fileData.length,
        data: encryptedData,
      },
    });
  }

  // Link categories (tags)
  for (const tag of note.tags) {
    const category = await prisma.category.findFirst({
      where: {
        userId,
        name: tag,
      },
    });

    if (category) {
      await prisma.entryCategory.create({
        data: {
          entryId: entry.id,
          categoryId: category.id,
        },
      });
    }
  }

  return entry;
}

// Helper function to import a generic entry
async function importEntry(entryData: any, userId: string, workspaceId: string | null) {
  const wordCount = entryData.wordCount || entryData.content.split(/\s+/).length;
  const charCount = entryData.charCount || entryData.content.length;

  const entry = await prisma.entry.create({
    data: {
      title: entryData.title || "Untitled",
      content: encryptEntryContent(entryData.content),
      wordCount,
      charCount,
      published: entryData.published || false,
      userId,
      workspaceId: workspaceId || entryData.workspaceId || undefined,
      createdAt: entryData.createdAt ? new Date(entryData.createdAt) : undefined,
      updatedAt: entryData.updatedAt ? new Date(entryData.updatedAt) : undefined,
    },
  });

  // Import attachments if present
  if (entryData.attachments && Array.isArray(entryData.attachments)) {
    for (const attData of entryData.attachments) {
      const fileData = Buffer.from(attData.data, "base64");
      const encryptedData = encryptFile(fileData);

      await prisma.attachment.create({
        data: {
          userId,
          entryId: entry.id,
          filename: attData.filename,
          originalName: attData.originalName,
          mimeType: attData.mimeType,
          size: attData.size,
          data: encryptedData,
        },
      });
    }
  }

  // Link categories if present
  if (entryData.categories && Array.isArray(entryData.categories)) {
    for (const categoryName of entryData.categories) {
      const category = await prisma.category.findFirst({
        where: {
          userId,
          name: categoryName,
        },
      });

      if (category) {
        await prisma.entryCategory.create({
          data: {
            entryId: entry.id,
            categoryId: category.id,
          },
        });
      }
    }
  }

  return entry;
}
