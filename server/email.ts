/**
 * Email Service using SendGrid
 * Handles order confirmations and contact form submissions
 */

import sgMail from "@sendgrid/mail";

// Initialize SendGrid with API key
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
const SENDGRID_FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL || "noreply@allenhenson.com";

if (SENDGRID_API_KEY) {
  sgMail.setApiKey(SENDGRID_API_KEY);
}

interface EmailOptions {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}

/**
 * Send an email using SendGrid
 */
export async function sendEmail(options: EmailOptions): Promise<boolean> {
  if (!SENDGRID_API_KEY) {
    console.error("[Email] SendGrid API key not configured");
    return false;
  }

  try {
    const msg: sgMail.MailDataRequired = {
      to: options.to,
      from: SENDGRID_FROM_EMAIL,
      subject: options.subject,
      text: options.text || options.subject, // Fallback to subject if no text
      html: options.html,
    };
    await sgMail.send(msg);
    console.log(`[Email] Sent to ${options.to}: ${options.subject}`);
    return true;
  } catch (error: any) {
    console.error("[Email] Failed to send:", error?.response?.body || error);
    return false;
  }
}

/**
 * Send order confirmation email to customer
 */
export async function sendOrderConfirmation(params: {
  customerEmail: string;
  customerName: string;
  productName: string;
  productSize: string;
  amountPaid: number;
  orderDate: Date;
  sessionId: string;
}): Promise<boolean> {
  const formattedAmount = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(params.amountPaid / 100);

  const formattedDate = params.orderDate.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Order Confirmation</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0a0a0a; font-family: 'Helvetica Neue', Arial, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0a0a0a; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #141414; border-radius: 8px; overflow: hidden;">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center; border-bottom: 1px solid #2a2a2a;">
              <h1 style="margin: 0; color: #c9a962; font-size: 24px; font-weight: 300; letter-spacing: 4px;">ALLEN HENSON</h1>
              <p style="margin: 8px 0 0; color: #888; font-size: 12px; letter-spacing: 2px;">PHOTOGRAPHY</p>
            </td>
          </tr>
          
          <!-- Main Content -->
          <tr>
            <td style="padding: 40px;">
              <h2 style="margin: 0 0 20px; color: #ffffff; font-size: 28px; font-weight: 300;">Thank You for Your Order</h2>
              <p style="margin: 0 0 30px; color: #aaaaaa; font-size: 16px; line-height: 1.6;">
                Dear ${params.customerName || "Valued Customer"},<br><br>
                Your order has been confirmed and is being prepared with care.
              </p>
              
              <!-- Order Details Box -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #1a1a1a; border-radius: 6px; margin-bottom: 30px;">
                <tr>
                  <td style="padding: 24px;">
                    <h3 style="margin: 0 0 16px; color: #c9a962; font-size: 14px; letter-spacing: 2px; font-weight: 400;">ORDER DETAILS</h3>
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding: 8px 0; color: #888; font-size: 14px;">Product:</td>
                        <td style="padding: 8px 0; color: #fff; font-size: 14px; text-align: right;">${params.productName}</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color: #888; font-size: 14px;">Size:</td>
                        <td style="padding: 8px 0; color: #fff; font-size: 14px; text-align: right;">${params.productSize}</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color: #888; font-size: 14px;">Amount Paid:</td>
                        <td style="padding: 8px 0; color: #c9a962; font-size: 14px; text-align: right; font-weight: 500;">${formattedAmount}</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color: #888; font-size: 14px;">Order Date:</td>
                        <td style="padding: 8px 0; color: #fff; font-size: 14px; text-align: right;">${formattedDate}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              
              <!-- What's Next -->
              <h3 style="margin: 0 0 16px; color: #c9a962; font-size: 14px; letter-spacing: 2px; font-weight: 400;">WHAT'S NEXT</h3>
              <ol style="margin: 0 0 30px; padding-left: 20px; color: #aaaaaa; font-size: 14px; line-height: 2;">
                <li>Allen will personally prepare your print with care</li>
                <li>You'll receive a shipping notification when your order is on its way</li>
                <li>Your print will arrive in protective packaging</li>
              </ol>
              
              <!-- Contact -->
              <p style="margin: 0; color: #888; font-size: 14px; line-height: 1.6;">
                Questions about your order?<br>
                <a href="mailto:allen@allenhenson.com" style="color: #c9a962; text-decoration: none;">allen@allenhenson.com</a>
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 30px 40px; background-color: #0f0f0f; text-align: center; border-top: 1px solid #2a2a2a;">
              <p style="margin: 0; color: #666; font-size: 12px;">
                © ${new Date().getFullYear()} Allen Henson Photography. All rights reserved.
              </p>
              <p style="margin: 10px 0 0; color: #666; font-size: 12px;">
                <a href="https://www.allenhenson.com" style="color: #888; text-decoration: none;">www.allenhenson.com</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  const text = `
ALLEN HENSON PHOTOGRAPHY
========================

Thank You for Your Order

Dear ${params.customerName || "Valued Customer"},

Your order has been confirmed and is being prepared with care.

ORDER DETAILS
-------------
Product: ${params.productName}
Size: ${params.productSize}
Amount Paid: ${formattedAmount}
Order Date: ${formattedDate}

WHAT'S NEXT
-----------
1. Allen will personally prepare your print with care
2. You'll receive a shipping notification when your order is on its way
3. Your print will arrive in protective packaging

Questions about your order?
Email: allen@allenhenson.com

© ${new Date().getFullYear()} Allen Henson Photography
www.allenhenson.com
  `;

  return sendEmail({
    to: params.customerEmail,
    subject: `Order Confirmation - ${params.productName}`,
    text,
    html,
  });
}

/**
 * Send contact form submission to Allen
 */
export async function sendContactFormEmail(params: {
  name: string;
  email: string;
  subject: string;
  message: string;
  projectType?: string;
}): Promise<boolean> {
  const recipientEmail = "allen@allenhenson.com";

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>New Contact Form Submission</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f5f5f5; font-family: 'Helvetica Neue', Arial, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="padding: 30px 40px; background-color: #0a0a0a; text-align: center;">
              <h1 style="margin: 0; color: #c9a962; font-size: 20px; font-weight: 300; letter-spacing: 3px;">NEW CONTACT FORM SUBMISSION</h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #eee;">
                    <strong style="color: #333; font-size: 14px;">From:</strong>
                    <span style="color: #666; font-size: 14px; margin-left: 10px;">${params.name}</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #eee;">
                    <strong style="color: #333; font-size: 14px;">Email:</strong>
                    <a href="mailto:${params.email}" style="color: #c9a962; font-size: 14px; margin-left: 10px; text-decoration: none;">${params.email}</a>
                  </td>
                </tr>
                ${params.projectType ? `
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #eee;">
                    <strong style="color: #333; font-size: 14px;">Project Type:</strong>
                    <span style="color: #666; font-size: 14px; margin-left: 10px;">${params.projectType}</span>
                  </td>
                </tr>
                ` : ""}
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #eee;">
                    <strong style="color: #333; font-size: 14px;">Subject:</strong>
                    <span style="color: #666; font-size: 14px; margin-left: 10px;">${params.subject}</span>
                  </td>
                </tr>
              </table>
              
              <div style="margin-top: 24px; padding: 20px; background-color: #f9f9f9; border-radius: 6px;">
                <strong style="color: #333; font-size: 14px; display: block; margin-bottom: 12px;">Message:</strong>
                <p style="margin: 0; color: #555; font-size: 14px; line-height: 1.8; white-space: pre-wrap;">${params.message}</p>
              </div>
              
              <div style="margin-top: 30px; text-align: center;">
                <a href="mailto:${params.email}?subject=Re: ${encodeURIComponent(params.subject)}" 
                   style="display: inline-block; padding: 12px 30px; background-color: #c9a962; color: #000; text-decoration: none; font-size: 14px; font-weight: 500; border-radius: 4px;">
                  Reply to ${params.name}
                </a>
              </div>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 20px 40px; background-color: #f5f5f5; text-align: center;">
              <p style="margin: 0; color: #999; font-size: 12px;">
                This message was sent from the contact form at allenhenson.com
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  const text = `
NEW CONTACT FORM SUBMISSION
===========================

From: ${params.name}
Email: ${params.email}
${params.projectType ? `Project Type: ${params.projectType}\n` : ""}Subject: ${params.subject}

Message:
--------
${params.message}

---
This message was sent from the contact form at allenhenson.com
  `;

  return sendEmail({
    to: recipientEmail,
    subject: `[Contact Form] ${params.subject} - from ${params.name}`,
    text,
    html,
  });
}

/**
 * Send auto-reply to contact form submitter
 */
export async function sendContactAutoReply(params: {
  name: string;
  email: string;
}): Promise<boolean> {
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Thank You for Reaching Out</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0a0a0a; font-family: 'Helvetica Neue', Arial, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0a0a0a; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #141414; border-radius: 8px; overflow: hidden;">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center; border-bottom: 1px solid #2a2a2a;">
              <h1 style="margin: 0; color: #c9a962; font-size: 24px; font-weight: 300; letter-spacing: 4px;">ALLEN HENSON</h1>
              <p style="margin: 8px 0 0; color: #888; font-size: 12px; letter-spacing: 2px;">PHOTOGRAPHY</p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <h2 style="margin: 0 0 20px; color: #ffffff; font-size: 24px; font-weight: 300;">Thank You for Reaching Out</h2>
              <p style="margin: 0 0 20px; color: #aaaaaa; font-size: 16px; line-height: 1.8;">
                Dear ${params.name},
              </p>
              <p style="margin: 0 0 20px; color: #aaaaaa; font-size: 16px; line-height: 1.8;">
                Thank you for contacting me. I've received your message and will get back to you as soon as possible, typically within 24-48 hours.
              </p>
              <p style="margin: 0 0 20px; color: #aaaaaa; font-size: 16px; line-height: 1.8;">
                In the meantime, feel free to explore my portfolio at <a href="https://www.allenhenson.com" style="color: #c9a962; text-decoration: none;">www.allenhenson.com</a>.
              </p>
              <p style="margin: 0; color: #aaaaaa; font-size: 16px; line-height: 1.8;">
                Best regards,<br>
                <span style="color: #c9a962;">Allen Henson</span>
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 30px 40px; background-color: #0f0f0f; text-align: center; border-top: 1px solid #2a2a2a;">
              <p style="margin: 0; color: #666; font-size: 12px;">
                © ${new Date().getFullYear()} Allen Henson Photography. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  return sendEmail({
    to: params.email,
    subject: "Thank You for Contacting Allen Henson Photography",
    html,
  });
}

/**
 * Validate SendGrid configuration by checking API key format
 */
export function isEmailConfigured(): boolean {
  return !!SENDGRID_API_KEY && SENDGRID_API_KEY.startsWith("SG.");
}
