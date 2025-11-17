import { NextResponse } from 'next/server';
import { generateCsrfToken } from '@/lib/security/csrf';

/**
 * GET /api/csrf
 * Generate and return a CSRF token
 */
export async function GET() {
  try {
    const token = await generateCsrfToken();

    return NextResponse.json({
      token,
      message: 'CSRF token generated successfully'
    });
  } catch (error) {
    console.error('Error generating CSRF token:', error);
    return NextResponse.json(
      { error: 'Failed to generate CSRF token' },
      { status: 500 }
    );
  }
}
