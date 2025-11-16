import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { decryptEntryContent } from "@/lib/encryption";
import { encryptEntryContent } from "@/lib/encryption";

/**
 * Create and configure the OpenJournal MCP Server
 * Provides AI assistants with tools to interact with journal entries
 */
export function createMcpServer() {
  const server = new McpServer({
    name: "openjournal-mcp-server",
    version: "1.0.0",
  });

  // ============================================================================
  // TOOL: List Entries
  // ============================================================================
  server.registerTool(
    "listEntries",
    {
      title: "List Journal Entries",
      description: "List all journal entries for the authenticated user with optional filtering",
      inputSchema: {
        userId: z.string().describe("User ID to fetch entries for"),
        limit: z.number().optional().default(10).describe("Maximum number of entries to return"),
        offset: z.number().optional().default(0).describe("Number of entries to skip"),
        workspaceId: z.string().optional().describe("Filter by workspace ID"),
        categoryId: z.string().optional().describe("Filter by category ID"),
        searchQuery: z.string().optional().describe("Search in title and content"),
      },
      outputSchema: {
        entries: z.array(
          z.object({
            id: z.string(),
            title: z.string(),
            excerpt: z.string(),
            wordCount: z.number(),
            published: z.boolean(),
            createdAt: z.string(),
            updatedAt: z.string(),
            categories: z.array(z.string()),
            workspace: z.string().nullable(),
          })
        ),
        total: z.number(),
        hasMore: z.boolean(),
      },
    },
    async ({ userId, limit = 10, offset = 0, workspaceId, categoryId, searchQuery }) => {
      try {
        // Build where clause
        const where: any = { userId };

        if (workspaceId) {
          where.workspaceId = workspaceId;
        }

        if (categoryId) {
          where.categories = {
            some: { categoryId },
          };
        }

        if (searchQuery) {
          where.OR = [
            { title: { contains: searchQuery, mode: "insensitive" } },
            { searchVector: { search: searchQuery } },
          ];
        }

        // Get total count
        const total = await prisma.entry.count({ where });

        // Fetch entries
        const entries = await prisma.entry.findMany({
          where,
          take: limit,
          skip: offset,
          orderBy: { createdAt: "desc" },
          include: {
            categories: {
              include: {
                category: true,
              },
            },
            workspace: true,
          },
        });

        // Transform to response format
        const transformedEntries = entries.map((entry) => {
          const content = decryptEntryContent(entry.content);
          const excerpt = content.replace(/<[^>]*>/g, "").slice(0, 200);

          return {
            id: entry.id,
            title: entry.title,
            excerpt,
            wordCount: entry.wordCount,
            published: entry.published,
            createdAt: entry.createdAt.toISOString(),
            updatedAt: entry.updatedAt.toISOString(),
            categories: entry.categories.map((ec) => ec.category.name),
            workspace: entry.workspace?.name || null,
          };
        });

        const output = {
          entries: transformedEntries,
          total,
          hasMore: offset + limit < total,
        };

        return {
          content: [{ type: "text", text: JSON.stringify(output, null, 2) }],
          structuredContent: output,
        };
      } catch (error: any) {
        return {
          content: [{ type: "text", text: `Error listing entries: ${error.message}` }],
          isError: true,
        };
      }
    }
  );

  // ============================================================================
  // TOOL: Get Entry
  // ============================================================================
  server.registerTool(
    "getEntry",
    {
      title: "Get Journal Entry",
      description: "Get a specific journal entry by ID with full content",
      inputSchema: {
        userId: z.string().describe("User ID requesting the entry"),
        entryId: z.string().describe("Entry ID to fetch"),
      },
      outputSchema: {
        id: z.string(),
        title: z.string(),
        content: z.string(),
        wordCount: z.number(),
        charCount: z.number(),
        published: z.boolean(),
        createdAt: z.string(),
        updatedAt: z.string(),
        categories: z.array(z.string()),
        workspace: z.string().nullable(),
        attachments: z.array(
          z.object({
            id: z.string(),
            filename: z.string(),
            mimeType: z.string(),
            size: z.number(),
          })
        ),
      },
    },
    async ({ userId, entryId }) => {
      try {
        const entry = await prisma.entry.findFirst({
          where: {
            id: entryId,
            userId,
          },
          include: {
            categories: {
              include: {
                category: true,
              },
            },
            workspace: true,
            attachments: true,
          },
        });

        if (!entry) {
          return {
            content: [{ type: "text", text: "Entry not found or access denied" }],
            isError: true,
          };
        }

        const output = {
          id: entry.id,
          title: entry.title,
          content: decryptEntryContent(entry.content),
          wordCount: entry.wordCount,
          charCount: entry.charCount,
          published: entry.published,
          createdAt: entry.createdAt.toISOString(),
          updatedAt: entry.updatedAt.toISOString(),
          categories: entry.categories.map((ec) => ec.category.name),
          workspace: entry.workspace?.name || null,
          attachments: entry.attachments.map((att) => ({
            id: att.id,
            filename: att.filename,
            mimeType: att.mimeType,
            size: att.size,
          })),
        };

        return {
          content: [{ type: "text", text: JSON.stringify(output, null, 2) }],
          structuredContent: output,
        };
      } catch (error: any) {
        return {
          content: [{ type: "text", text: `Error fetching entry: ${error.message}` }],
          isError: true,
        };
      }
    }
  );

  // ============================================================================
  // TOOL: Create Entry
  // ============================================================================
  server.registerTool(
    "createEntry",
    {
      title: "Create Journal Entry",
      description: "Create a new journal entry",
      inputSchema: {
        userId: z.string().describe("User ID creating the entry"),
        title: z.string().describe("Entry title"),
        content: z.string().describe("Entry content (HTML)"),
        published: z.boolean().optional().default(false).describe("Whether entry is published"),
        workspaceId: z.string().optional().describe("Workspace ID to create entry in"),
        categories: z.array(z.string()).optional().describe("Category names to assign"),
      },
      outputSchema: {
        id: z.string(),
        title: z.string(),
        createdAt: z.string(),
        success: z.boolean(),
      },
    },
    async ({ userId, title, content, published = false, workspaceId, categories = [] }) => {
      try {
        // Calculate word and character counts
        const plainText = content.replace(/<[^>]*>/g, "");
        const wordCount = plainText.split(/\s+/).filter((word) => word.length > 0).length;
        const charCount = plainText.length;

        // Create entry
        const entry = await prisma.entry.create({
          data: {
            title,
            content: encryptEntryContent(content),
            wordCount,
            charCount,
            published,
            userId,
            workspaceId: workspaceId || undefined,
          },
        });

        // Link categories if provided
        if (categories.length > 0) {
          for (const categoryName of categories) {
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

        const output = {
          id: entry.id,
          title: entry.title,
          createdAt: entry.createdAt.toISOString(),
          success: true,
        };

        return {
          content: [{ type: "text", text: JSON.stringify(output, null, 2) }],
          structuredContent: output,
        };
      } catch (error: any) {
        return {
          content: [{ type: "text", text: `Error creating entry: ${error.message}` }],
          isError: true,
        };
      }
    }
  );

  // ============================================================================
  // TOOL: Update Entry
  // ============================================================================
  server.registerTool(
    "updateEntry",
    {
      title: "Update Journal Entry",
      description: "Update an existing journal entry",
      inputSchema: {
        userId: z.string().describe("User ID updating the entry"),
        entryId: z.string().describe("Entry ID to update"),
        title: z.string().optional().describe("New title"),
        content: z.string().optional().describe("New content (HTML)"),
        published: z.boolean().optional().describe("Update published status"),
      },
      outputSchema: {
        id: z.string(),
        title: z.string(),
        updatedAt: z.string(),
        success: z.boolean(),
      },
    },
    async ({ userId, entryId, title, content, published }) => {
      try {
        // Verify ownership
        const existing = await prisma.entry.findFirst({
          where: { id: entryId, userId },
        });

        if (!existing) {
          return {
            content: [{ type: "text", text: "Entry not found or access denied" }],
            isError: true,
          };
        }

        // Build update data
        const updateData: any = {};

        if (title !== undefined) {
          updateData.title = title;
        }

        if (content !== undefined) {
          const plainText = content.replace(/<[^>]*>/g, "");
          updateData.content = encryptEntryContent(content);
          updateData.wordCount = plainText.split(/\s+/).filter((word) => word.length > 0).length;
          updateData.charCount = plainText.length;
        }

        if (published !== undefined) {
          updateData.published = published;
        }

        // Update entry
        const entry = await prisma.entry.update({
          where: { id: entryId },
          data: updateData,
        });

        const output = {
          id: entry.id,
          title: entry.title,
          updatedAt: entry.updatedAt.toISOString(),
          success: true,
        };

        return {
          content: [{ type: "text", text: JSON.stringify(output, null, 2) }],
          structuredContent: output,
        };
      } catch (error: any) {
        return {
          content: [{ type: "text", text: `Error updating entry: ${error.message}` }],
          isError: true,
        };
      }
    }
  );

  // ============================================================================
  // TOOL: Delete Entry
  // ============================================================================
  server.registerTool(
    "deleteEntry",
    {
      title: "Delete Journal Entry",
      description: "Delete a journal entry",
      inputSchema: {
        userId: z.string().describe("User ID deleting the entry"),
        entryId: z.string().describe("Entry ID to delete"),
      },
      outputSchema: {
        success: z.boolean(),
        deletedId: z.string(),
      },
    },
    async ({ userId, entryId }) => {
      try {
        // Verify ownership
        const existing = await prisma.entry.findFirst({
          where: { id: entryId, userId },
        });

        if (!existing) {
          return {
            content: [{ type: "text", text: "Entry not found or access denied" }],
            isError: true,
          };
        }

        // Delete entry (cascade will handle relations)
        await prisma.entry.delete({
          where: { id: entryId },
        });

        const output = {
          success: true,
          deletedId: entryId,
        };

        return {
          content: [{ type: "text", text: JSON.stringify(output, null, 2) }],
          structuredContent: output,
        };
      } catch (error: any) {
        return {
          content: [{ type: "text", text: `Error deleting entry: ${error.message}` }],
          isError: true,
        };
      }
    }
  );

  // ============================================================================
  // TOOL: Search Entries
  // ============================================================================
  server.registerTool(
    "searchEntries",
    {
      title: "Search Journal Entries",
      description: "Full-text search across journal entries",
      inputSchema: {
        userId: z.string().describe("User ID to search entries for"),
        query: z.string().describe("Search query"),
        limit: z.number().optional().default(20).describe("Maximum results"),
      },
      outputSchema: {
        results: z.array(
          z.object({
            id: z.string(),
            title: z.string(),
            excerpt: z.string(),
            relevance: z.number(),
            createdAt: z.string(),
          })
        ),
        total: z.number(),
      },
    },
    async ({ userId, query, limit = 20 }) => {
      try {
        // Use PostgreSQL full-text search
        const entries = await prisma.entry.findMany({
          where: {
            userId,
            OR: [
              { title: { contains: query, mode: "insensitive" } },
              { searchVector: { search: query } },
            ],
          },
          take: limit,
          orderBy: [{ createdAt: "desc" }],
        });

        const results = entries.map((entry, index) => {
          const content = decryptEntryContent(entry.content);
          const plainText = content.replace(/<[^>]*>/g, "");

          // Simple relevance scoring
          const titleMatch = entry.title.toLowerCase().includes(query.toLowerCase()) ? 0.5 : 0;
          const contentMatch = plainText.toLowerCase().includes(query.toLowerCase()) ? 0.3 : 0;
          const recency = 0.2 * (1 - index / entries.length);
          const relevance = titleMatch + contentMatch + recency;

          // Extract excerpt around search term
          let excerpt = plainText.slice(0, 200);
          const queryIndex = plainText.toLowerCase().indexOf(query.toLowerCase());
          if (queryIndex > -1) {
            const start = Math.max(0, queryIndex - 50);
            const end = Math.min(plainText.length, queryIndex + 150);
            excerpt = plainText.slice(start, end);
            if (start > 0) excerpt = "..." + excerpt;
            if (end < plainText.length) excerpt = excerpt + "...";
          }

          return {
            id: entry.id,
            title: entry.title,
            excerpt,
            relevance: Math.round(relevance * 100) / 100,
            createdAt: entry.createdAt.toISOString(),
          };
        });

        const output = {
          results,
          total: results.length,
        };

        return {
          content: [{ type: "text", text: JSON.stringify(output, null, 2) }],
          structuredContent: output,
        };
      } catch (error: any) {
        return {
          content: [{ type: "text", text: `Error searching entries: ${error.message}` }],
          isError: true,
        };
      }
    }
  );

  // ============================================================================
  // TOOL: List Categories
  // ============================================================================
  server.registerTool(
    "listCategories",
    {
      title: "List Categories",
      description: "List all categories for the authenticated user",
      inputSchema: {
        userId: z.string().describe("User ID to fetch categories for"),
      },
      outputSchema: {
        categories: z.array(
          z.object({
            id: z.string(),
            name: z.string(),
            description: z.string().nullable(),
            color: z.string().nullable(),
            entryCount: z.number(),
          })
        ),
      },
    },
    async ({ userId }) => {
      try {
        const categories = await prisma.category.findMany({
          where: { userId },
          include: {
            _count: {
              select: { entries: true },
            },
          },
          orderBy: { order: "asc" },
        });

        const output = {
          categories: categories.map((cat) => ({
            id: cat.id,
            name: cat.name,
            description: cat.description,
            color: cat.color,
            entryCount: cat._count.entries,
          })),
        };

        return {
          content: [{ type: "text", text: JSON.stringify(output, null, 2) }],
          structuredContent: output,
        };
      } catch (error: any) {
        return {
          content: [{ type: "text", text: `Error listing categories: ${error.message}` }],
          isError: true,
        };
      }
    }
  );

  // ============================================================================
  // TOOL: List Workspaces
  // ============================================================================
  server.registerTool(
    "listWorkspaces",
    {
      title: "List Workspaces",
      description: "List all workspaces for the authenticated user",
      inputSchema: {
        userId: z.string().describe("User ID to fetch workspaces for"),
      },
      outputSchema: {
        workspaces: z.array(
          z.object({
            id: z.string(),
            name: z.string(),
            description: z.string().nullable(),
            type: z.string(),
            isDefault: z.boolean(),
            entryCount: z.number(),
          })
        ),
      },
    },
    async ({ userId }) => {
      try {
        const workspaces = await prisma.workspace.findMany({
          where: { userId },
          include: {
            _count: {
              select: { entries: true },
            },
          },
          orderBy: { createdAt: "asc" },
        });

        const output = {
          workspaces: workspaces.map((ws) => ({
            id: ws.id,
            name: ws.name,
            description: ws.description,
            type: ws.type,
            isDefault: ws.isDefault,
            entryCount: ws._count.entries,
          })),
        };

        return {
          content: [{ type: "text", text: JSON.stringify(output, null, 2) }],
          structuredContent: output,
        };
      } catch (error: any) {
        return {
          content: [{ type: "text", text: `Error listing workspaces: ${error.message}` }],
          isError: true,
        };
      }
    }
  );

  return server;
}
