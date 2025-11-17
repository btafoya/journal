import { NextRequest, NextResponse } from 'next/server';
import { csrfProtection } from './csrf';
import { rateLimit, getIdentifier, rateLimitResponse } from './rate-limit';

/**
 * Apply security middleware to API routes
 * @param request - Next.js request object
 * @param options - Security options
 * @returns Response if security check fails, null if passes
 */
export async function applySecurityMiddleware(
  request: NextRequest,
  options: {
    csrf?: boolean;
    rateLimit?: 'auth' | 'api' | 'read' | false;
    userId?: string;
  } = {}
): Promise<Response | null> {
  const { csrf = true, rateLimit: rateLimitType = 'api', userId } = options;

  // Apply CSRF protection for state-changing requests
  if (csrf && !['GET', 'HEAD', 'OPTIONS'].includes(request.method)) {
    const csrfError = await csrfProtection(request);
    if (csrfError) {
      return csrfError;
    }
  }

  // Apply rate limiting
  if (rateLimitType) {
    const identifier = getIdentifier(request, userId);
    const result = await rateLimit(identifier, rateLimitType);

    if (!result.success) {
      return rateLimitResponse(result.remaining, result.reset);
    }
  }

  return null;
}

/**
 * Wrapper for API route handlers with security middleware
 * @param handler - API route handler function
 * @param options - Security options
 * @returns Wrapped handler with security checks
 */
export function withSecurity(
  handler: (request: NextRequest, context?: any) => Promise<Response>,
  options: {
    csrf?: boolean;
    rateLimit?: 'auth' | 'api' | 'read' | false;
    getUserId?: (request: NextRequest) => Promise<string | undefined>;
  } = {}
) {
  return async (request: NextRequest, context?: any) => {
    // Get user ID if function provided
    const userId = options.getUserId ? await options.getUserId(request) : undefined;

    // Apply security middleware
    const securityError = await applySecurityMiddleware(request, {
      csrf: options.csrf,
      rateLimit: options.rateLimit,
      userId,
    });

    if (securityError) {
      return securityError;
    }

    // Call the original handler
    return handler(request, context);
  };
}
