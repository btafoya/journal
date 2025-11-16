import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { createMcpServer } from "@/lib/mcp-server";
import { auditLogFromRequest, ResourceType } from "@/lib/audit-log";

// Rate limiting storage (in-memory for simplicity, use Redis in production)
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

// Rate limit configuration
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 60; // 60 requests per minute

/**
 * Simple rate limiting implementation
 * Returns true if rate limit is exceeded
 */
function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const userLimit = rateLimitStore.get(userId);

  if (!userLimit || now > userLimit.resetAt) {
    // Reset or initialize rate limit
    rateLimitStore.set(userId, {
      count: 1,
      resetAt: now + RATE_LIMIT_WINDOW_MS,
    });
    return false;
  }

  if (userLimit.count >= RATE_LIMIT_MAX_REQUESTS) {
    return true; // Rate limit exceeded
  }

  userLimit.count++;
  return false;
}

/**
 * POST /api/mcp
 * Handle MCP (Model Context Protocol) requests
 * Provides AI assistants with tools to interact with journal entries
 */
export async function POST(request: NextRequest) {
  try {
    // Authentication check
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        {
          jsonrpc: "2.0",
          error: {
            code: -32001,
            message: "Authentication required",
          },
          id: null,
        },
        { status: 401 }
      );
    }

    // Rate limiting check
    if (checkRateLimit(session.user.id)) {
      return NextResponse.json(
        {
          jsonrpc: "2.0",
          error: {
            code: -32002,
            message: "Rate limit exceeded. Please try again later.",
          },
          id: null,
        },
        { status: 429 }
      );
    }

    // Parse request body
    const body = await request.json();

    // Create MCP server instance
    const server = createMcpServer();

    // Create HTTP transport for this request
    // Note: Using stateless mode (sessionIdGenerator: undefined) to prevent
    // request ID collisions when different clients use the same JSON-RPC IDs
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
      enableJsonResponse: true,
    });

    // Create synthetic Express-like request/response objects
    // The StreamableHTTPServerTransport expects Express req/res objects
    const req = {
      body,
      headers: Object.fromEntries(request.headers.entries()),
      method: "POST",
      url: "/api/mcp",
    } as any;

    const resChunks: any[] = [];
    let statusCode = 200;
    let responseHeaders: Record<string, string> = {};

    const res = {
      status: (code: number) => {
        statusCode = code;
        return res;
      },
      setHeader: (name: string, value: string) => {
        responseHeaders[name] = value;
        return res;
      },
      write: (chunk: any) => {
        resChunks.push(chunk);
        return true;
      },
      end: (chunk?: any) => {
        if (chunk) resChunks.push(chunk);
      },
      on: () => {},
      once: () => {},
      emit: () => false,
      headersSent: false,
    } as any;

    // Connect server to transport
    await server.connect(transport);

    // Handle the request
    await transport.handleRequest(req, res, body);

    // Combine response chunks
    const responseBody = resChunks.join("");
    let parsedResponse;

    try {
      parsedResponse = JSON.parse(responseBody);
    } catch {
      parsedResponse = responseBody;
    }

    // Create audit log for MCP requests
    await auditLogFromRequest(request, session.user.id, "mcp.request", ResourceType.ENTRY, null, {
      method: body.method,
      toolName: body.params?.name,
    });

    // Return response
    return NextResponse.json(parsedResponse, {
      status: statusCode,
      headers: responseHeaders,
    });
  } catch (error: any) {
    console.error("MCP request error:", error);

    return NextResponse.json(
      {
        jsonrpc: "2.0",
        error: {
          code: -32603,
          message: "Internal server error",
          data: error.message,
        },
        id: null,
      },
      { status: 500 }
    );
  }
}

/**
 * OPTIONS /api/mcp
 * Handle CORS preflight requests
 */
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Max-Age": "86400",
    },
  });
}
