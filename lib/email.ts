import { ServerClient } from "postmark";
import { prisma } from "@/lib/prisma";

// Initialize Postmark client
const postmarkClient = new ServerClient(process.env.POSTMARK_API_KEY || "");
const fromEmail = process.env.POSTMARK_FROM_EMAIL || "noreply@openjournal.app";

export interface EmailOptions {
  to: string;
  subject: string;
  htmlBody: string;
  textBody?: string;
  userId?: string;
  type: string;
  metadata?: Record<string, any>;
}

/**
 * Send an email via Postmark and log to database
 */
export async function sendEmail(options: EmailOptions): Promise<boolean> {
  try {
    // Create email notification record
    const notification = await prisma.emailNotification.create({
      data: {
        userId: options.userId || "system",
        type: options.type,
        subject: options.subject,
        content: options.htmlBody,
        recipientEmail: options.to,
        metadata: options.metadata,
        sent: false,
      },
    });

    // Send via Postmark
    const result = await postmarkClient.sendEmail({
      From: fromEmail,
      To: options.to,
      Subject: options.subject,
      HtmlBody: options.htmlBody,
      TextBody: options.textBody || stripHtml(options.htmlBody),
      MessageStream: "outbound",
    });

    // Update notification as sent
    await prisma.emailNotification.update({
      where: { id: notification.id },
      data: {
        sent: true,
        sentAt: new Date(),
      },
    });

    return true;
  } catch (error) {
    console.error("Failed to send email:", error);

    // Log error to database if notification exists
    try {
      await prisma.emailNotification.updateMany({
        where: {
          recipientEmail: options.to,
          sent: false,
          type: options.type,
        },
        data: {
          error: error instanceof Error ? error.message : String(error),
        },
      });
    } catch (dbError) {
      console.error("Failed to log email error:", dbError);
    }

    return false;
  }
}

/**
 * Send comment notification email
 */
export async function sendCommentNotification(params: {
  recipientEmail: string;
  recipientName: string;
  commenterName: string;
  entryTitle: string;
  commentContent: string;
  entryId: string;
  commentId: string;
  userId: string;
}) {
  const { recipientEmail, recipientName, commenterName, entryTitle, commentContent, entryId, commentId, userId } =
    params;

  const htmlBody = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #3b82f6; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; }
          .comment { background: white; padding: 15px; margin: 20px 0; border-left: 4px solid #3b82f6; }
          .button { display: inline-block; padding: 12px 24px; background: #3b82f6; color: white; text-decoration: none; border-radius: 6px; margin-top: 20px; }
          .footer { color: #6b7280; font-size: 12px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0;">New Comment on Your Entry</h1>
          </div>
          <div class="content">
            <p>Hi ${recipientName},</p>
            <p><strong>${commenterName}</strong> commented on your entry "<strong>${entryTitle}</strong>":</p>
            <div class="comment">
              ${commentContent}
            </div>
            <a href="${process.env.NEXTAUTH_URL}/entries/${entryId}#comment-${commentId}" class="button">
              View Comment
            </a>
            <div class="footer">
              <p>You're receiving this email because you have notifications enabled for OpenJournal.</p>
              <p>To unsubscribe, visit your account settings.</p>
            </div>
          </div>
        </div>
      </body>
    </html>
  `;

  return sendEmail({
    to: recipientEmail,
    subject: `New comment on "${entryTitle}"`,
    htmlBody,
    userId,
    type: "comment.new",
    metadata: {
      entryId,
      commentId,
      commenterName,
    },
  });
}

/**
 * Send role assignment notification email
 */
export async function sendRoleAssignmentNotification(params: {
  recipientEmail: string;
  recipientName: string;
  role: string;
  workspaceName?: string;
  assignedByName: string;
  userId: string;
}) {
  const { recipientEmail, recipientName, role, workspaceName, assignedByName, userId } = params;

  const roleLabel = role.charAt(0) + role.slice(1).toLowerCase();
  const workspaceContext = workspaceName ? ` in workspace "${workspaceName}"` : "";

  const htmlBody = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #10b981; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; }
          .role-badge { display: inline-block; padding: 8px 16px; background: #10b981; color: white; border-radius: 4px; font-weight: bold; margin: 10px 0; }
          .button { display: inline-block; padding: 12px 24px; background: #10b981; color: white; text-decoration: none; border-radius: 6px; margin-top: 20px; }
          .footer { color: #6b7280; font-size: 12px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0;">Role Assignment</h1>
          </div>
          <div class="content">
            <p>Hi ${recipientName},</p>
            <p><strong>${assignedByName}</strong> has assigned you the following role${workspaceContext}:</p>
            <div class="role-badge">${roleLabel}</div>
            <p><strong>What this means:</strong></p>
            <ul>
              ${
                role === "ADMIN"
                  ? "<li>Full system access including user management</li><li>Can create, edit, and delete all content</li><li>Can manage roles and permissions</li>"
                  : role === "EDITOR"
                    ? "<li>Can create and edit entries</li><li>Can manage your own content</li><li>Cannot manage users or system settings</li>"
                    : "<li>Read-only access to shared content</li><li>Can view and comment on entries</li><li>Cannot create or edit content</li>"
              }
            </ul>
            <a href="${process.env.NEXTAUTH_URL}/settings/security" class="button">
              View Your Settings
            </a>
            <div class="footer">
              <p>You're receiving this email because your role was updated in OpenJournal.</p>
              <p>If you have questions, please contact ${assignedByName}.</p>
            </div>
          </div>
        </div>
      </body>
    </html>
  `;

  return sendEmail({
    to: recipientEmail,
    subject: `Your role has been updated${workspaceContext}`,
    htmlBody,
    userId,
    type: "role.assigned",
    metadata: {
      role,
      workspaceName,
      assignedByName,
    },
  });
}

/**
 * Send entry shared notification email
 */
export async function sendEntrySharedNotification(params: {
  recipientEmail: string;
  sharedByName: string;
  entryTitle: string;
  entryId: string;
  message?: string;
  permission: string;
  userId: string;
}) {
  const { recipientEmail, sharedByName, entryTitle, entryId, message, permission, userId } = params;

  const permissionLabel = permission === "comment" ? "can view and comment" : "can view";

  const htmlBody = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #8b5cf6; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; }
          .message { background: white; padding: 15px; margin: 20px 0; border-left: 4px solid #8b5cf6; }
          .button { display: inline-block; padding: 12px 24px; background: #8b5cf6; color: white; text-decoration: none; border-radius: 6px; margin-top: 20px; }
          .footer { color: #6b7280; font-size: 12px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0;">Entry Shared With You</h1>
          </div>
          <div class="content">
            <p><strong>${sharedByName}</strong> has shared an entry with you: "<strong>${entryTitle}</strong>"</p>
            <p>You ${permissionLabel}.</p>
            ${
              message
                ? `<div class="message"><strong>Message from ${sharedByName}:</strong><br>${message}</div>`
                : ""
            }
            <a href="${process.env.NEXTAUTH_URL}/entries/${entryId}" class="button">
              View Entry
            </a>
            <div class="footer">
              <p>You're receiving this email because ${sharedByName} shared content with you on OpenJournal.</p>
            </div>
          </div>
        </div>
      </body>
    </html>
  `;

  return sendEmail({
    to: recipientEmail,
    subject: `${sharedByName} shared "${entryTitle}" with you`,
    htmlBody,
    userId,
    type: "entry.shared",
    metadata: {
      entryId,
      sharedByName,
      permission,
    },
  });
}

/**
 * Basic HTML stripping for text fallback
 */
function stripHtml(html: string): string {
  return html
    .replace(/<style[^>]*>.*?<\/style>/gis, "")
    .replace(/<script[^>]*>.*?<\/script>/gis, "")
    .replace(/<[^>]+>/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Get unsent email notifications for retry
 */
export async function getUnsentNotifications(limit: number = 100) {
  return prisma.emailNotification.findMany({
    where: {
      sent: false,
      error: null, // Only retry ones that haven't errored yet
    },
    take: limit,
    orderBy: {
      createdAt: "asc",
    },
  });
}

/**
 * Retry sending failed notifications
 */
export async function retryFailedNotifications() {
  const unsent = await getUnsentNotifications();

  for (const notification of unsent) {
    try {
      await postmarkClient.sendEmail({
        From: fromEmail,
        To: notification.recipientEmail,
        Subject: notification.subject,
        HtmlBody: notification.content,
        TextBody: stripHtml(notification.content),
        MessageStream: "outbound",
      });

      await prisma.emailNotification.update({
        where: { id: notification.id },
        data: {
          sent: true,
          sentAt: new Date(),
          error: null,
        },
      });
    } catch (error) {
      await prisma.emailNotification.update({
        where: { id: notification.id },
        data: {
          error: error instanceof Error ? error.message : String(error),
        },
      });
    }
  }
}
