// Owner notifications, delivered by email via the existing SendGrid setup.

export type NotificationPayload = {
  title: string;
  content: string;
};

const OWNER_EMAIL = process.env.OWNER_NOTIFICATION_EMAIL || "allen@allenhenson.com";

/**
 * Send a notification to the site owner. Returns true when the email was
 * accepted by SendGrid, false otherwise (missing config, send failure).
 */
export async function notifyOwner(payload: NotificationPayload): Promise<boolean> {
  const title = payload.title?.trim();
  const content = payload.content?.trim();
  if (!title || !content) return false;

  const { sendEmail, isEmailConfigured } = await import("../email");
  if (!isEmailConfigured()) {
    console.warn("[Notification] SendGrid not configured — cannot notify owner");
    return false;
  }

  return sendEmail({
    to: OWNER_EMAIL,
    subject: title,
    text: content,
    html: `<pre style="font-family: 'Helvetica Neue', Arial, sans-serif; white-space: pre-wrap;">${content
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")}</pre>`,
  });
}
