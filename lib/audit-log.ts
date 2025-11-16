import { prisma } from "@/lib/prisma";

export interface AuditLogData {
  userId: string;
  action: string;
  resourceType: string;
  resourceId?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  metadata?: Record<string, any> | null;
  success?: boolean;
  errorMessage?: string | null;
}

/**
 * Create an audit log entry
 */
export async function createAuditLog(data: AuditLogData): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        userId: data.userId,
        action: data.action,
        resourceType: data.resourceType,
        resourceId: data.resourceId || null,
        ipAddress: data.ipAddress || null,
        userAgent: data.userAgent || null,
        metadata: data.metadata || null,
        success: data.success !== undefined ? data.success : true,
        errorMessage: data.errorMessage || null,
      },
    });
  } catch (error) {
    // Log error but don't throw - audit logging should not break the application
    console.error("Failed to create audit log:", error);
  }
}

/**
 * Helper to extract IP address from request
 */
export function getIpAddress(request: Request): string | null {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }

  const realIp = request.headers.get("x-real-ip");
  if (realIp) {
    return realIp;
  }

  return null;
}

/**
 * Helper to get user agent from request
 */
export function getUserAgent(request: Request): string | null {
  return request.headers.get("user-agent");
}

/**
 * Helper to create audit log from request context
 */
export async function auditLogFromRequest(
  request: Request,
  userId: string,
  action: string,
  resourceType: string,
  resourceId?: string | null,
  metadata?: Record<string, any> | null,
  success: boolean = true,
  errorMessage?: string | null
): Promise<void> {
  await createAuditLog({
    userId,
    action,
    resourceType,
    resourceId,
    ipAddress: getIpAddress(request),
    userAgent: getUserAgent(request),
    metadata,
    success,
    errorMessage,
  });
}

// Predefined action constants for consistency
export const AuditAction = {
  // Authentication
  AUTH_LOGIN_SUCCESS: "auth.login.success",
  AUTH_LOGIN_FAILURE: "auth.login.failure",
  AUTH_LOGOUT: "auth.logout",
  AUTH_REGISTER: "auth.register",
  AUTH_PASSWORD_CHANGE: "auth.password.change",
  AUTH_PASSWORD_RESET_REQUEST: "auth.password.reset.request",
  AUTH_PASSWORD_RESET_COMPLETE: "auth.password.reset.complete",
  AUTH_2FA_ENABLE: "auth.2fa.enable",
  AUTH_2FA_DISABLE: "auth.2fa.disable",
  AUTH_2FA_VERIFY: "auth.2fa.verify",

  // Entries
  ENTRY_CREATE: "entry.create",
  ENTRY_READ: "entry.read",
  ENTRY_UPDATE: "entry.update",
  ENTRY_DELETE: "entry.delete",
  ENTRY_PUBLISH: "entry.publish",
  ENTRY_UNPUBLISH: "entry.unpublish",
  ENTRY_VERSION_RESTORE: "entry.version.restore",
  ENTRY_SHARE: "entry.share",
  ENTRY_UNSHARE: "entry.unshare",

  // Templates
  TEMPLATE_CREATE: "template.create",
  TEMPLATE_READ: "template.read",
  TEMPLATE_UPDATE: "template.update",
  TEMPLATE_DELETE: "template.delete",

  // Attachments
  ATTACHMENT_UPLOAD: "attachment.upload",
  ATTACHMENT_DOWNLOAD: "attachment.download",
  ATTACHMENT_DELETE: "attachment.delete",

  // Account
  ACCOUNT_UPDATE: "account.update",
  ACCOUNT_DELETE: "account.delete",
  ACCOUNT_EXPORT: "account.export",

  // Security
  SECURITY_PERMISSION_DENIED: "security.permission.denied",
  SECURITY_RATE_LIMIT: "security.rate.limit",
  SECURITY_SUSPICIOUS_ACTIVITY: "security.suspicious.activity",
} as const;

// Resource type constants
export const ResourceType = {
  USER: "user",
  ENTRY: "entry",
  TEMPLATE: "template",
  SESSION: "session",
  ACCOUNT: "account",
  ATTACHMENT: "attachment",
} as const;
