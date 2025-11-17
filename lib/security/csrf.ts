import { doubleCsrf } from 'csrf-csrf';
import { cookies } from 'next/headers';

// Create CSRF protection instance
const { generateToken, validateRequest } = doubleCsrf({
  getSecret: () => process.env.CSRF_SECRET || 'your-csrf-secret-change-this-in-production',
  cookieName: '__Host-csrf-token',
  cookieOptions: {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    secure: process.env.NODE_ENV === 'production',
  },
  size: 64,
  ignoredMethods: ['GET', 'HEAD', 'OPTIONS'],
  getTokenFromRequest: (req) => {
    return req.headers.get('x-csrf-token') || '';
  },
});

/**
 * Generate a CSRF token for the current session
 * @returns CSRF token string
 */
export async function generateCsrfToken(): Promise<string> {
  const cookieStore = await cookies();
  const token = generateToken(
    {
      overwrite: true,
    },
    cookieStore as any
  );
  return token;
}

/**
 * Validate CSRF token from request
 * @param request - Next.js request object
 * @returns true if valid, false otherwise
 */
export async function validateCsrfToken(request: Request): Promise<boolean> {
  try {
    const cookieStore = await cookies();
    validateRequest(request as any, cookieStore as any);
    return true;
  } catch (error) {
    console.error('CSRF validation failed:', error);
    return false;
  }
}

/**
 * Middleware to check CSRF token for state-changing requests
 * @param request - Next.js request object
 * @returns Response if invalid, null if valid
 */
export async function csrfProtection(request: Request): Promise<Response | null> {
  const method = request.method;

  // Skip CSRF for safe methods
  if (['GET', 'HEAD', 'OPTIONS'].includes(method)) {
    return null;
  }

  const isValid = await validateCsrfToken(request);

  if (!isValid) {
    return new Response(
      JSON.stringify({
        error: 'Invalid CSRF token',
        code: 'CSRF_VALIDATION_FAILED',
      }),
      {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  return null;
}
