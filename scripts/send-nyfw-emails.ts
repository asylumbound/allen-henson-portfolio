/**
 * NYFW Feb 2026 Press Credential Email Campaign
 * Sends personalized emails to fashion designers/brands
 */

import sgMail from "@sendgrid/mail";
import "dotenv/config";

// Initialize SendGrid
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
const FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL || "allen@allenhenson.com";
const FROM_NAME = "Allen Henson";

if (!SENDGRID_API_KEY) {
  console.error("SENDGRID_API_KEY not set");
  process.exit(1);
}

sgMail.setApiKey(SENDGRID_API_KEY);

interface EmailTarget {
  to: string | string[];
  prNameOrTeam: string;
  designer: string;
  showDateTime: string;
  requiredFirstLine?: string;
  extraLine?: string;
  tier: string;
}

const emailTargets: EmailTarget[] = [
  // Tier A — High payoff
  {
    to: "press@proenzaschouler.com",
    prNameOrTeam: "Proenza Schouler Press Team",
    designer: "Proenza Schouler",
    showDateTime: "Wed Feb 11, 2026 — 12:00 PM",
    tier: "A"
  },
  {
    to: "press@khaite.com",
    prNameOrTeam: "Khaite Press Team",
    designer: "Khaite",
    showDateTime: "Sun Feb 15, 2026 — 7:00 PM",
    tier: "A"
  },
  {
    to: "request@kcdworldwide.com",
    prNameOrTeam: "KCD Team",
    designer: "Tory Burch",
    showDateTime: "Sat Feb 14, 2026 — 7:00 PM",
    requiredFirstLine: "NYFW invite request for Tory Burch — Sat Feb 14, 7:00 PM",
    tier: "A"
  },
  {
    to: "request@kcdworldwide.com",
    prNameOrTeam: "KCD Team",
    designer: "Michael Kors Collection",
    showDateTime: "Sat Feb 14, 2026 — 6:00 PM",
    requiredFirstLine: "NYFW invite request for Michael Kors Collection — Sat Feb 14, 6:00 PM",
    tier: "A"
  },
  {
    to: "aresnick@tapestry.com",
    prNameOrTeam: "Coach / Tapestry Communications Team",
    designer: "Coach",
    showDateTime: "Sat Feb 14, 2026 — 3:00 PM",
    extraLine: "If Coach runway invites are handled by a different PR contact, I'd appreciate a direct introduction or the correct credential inbox.",
    tier: "A"
  },
  {
    to: "communications@pvh.com",
    prNameOrTeam: "PVH / Calvin Klein Communications Team",
    designer: "Calvin Klein Collection",
    showDateTime: "Sat Feb 14, 2026 — 12:00 PM",
    tier: "A"
  },
  // Tier B — Strong yes-probability
  {
    to: "press@ullajohnson.com",
    prNameOrTeam: "Ulla Johnson Press Team",
    designer: "Ulla Johnson",
    showDateTime: "Wed Feb 11, 2026 — 4:00 PM",
    tier: "B"
  },
  {
    to: "press@prabalgurung.com",
    prNameOrTeam: "Prabal Gurung Press Team",
    designer: "Prabal Gurung",
    showDateTime: "Thu Feb 12, 2026 — 4:00 PM",
    tier: "B"
  },
  {
    to: "PR@ChristianSirianoCollection.com",
    prNameOrTeam: "Christian Siriano PR Team",
    designer: "Christian Siriano",
    showDateTime: "Wed Feb 11, 2026 — 4:00 PM",
    tier: "B"
  },
  {
    to: "press@sandyliang.info",
    prNameOrTeam: "Sandy Liang Press Team",
    designer: "Sandy Liang",
    showDateTime: "Fri Feb 13, 2026 — 1:00 PM",
    tier: "B"
  },
  {
    to: ["press@collinastrada.com", "collinastrada@lindsey.media"],
    prNameOrTeam: "Collina Strada Press Team",
    designer: "Collina Strada",
    showDateTime: "Wed Feb 11, 2026 — 5:00 PM",
    tier: "B"
  },
  {
    to: "requests@area.nyc",
    prNameOrTeam: "Area PR Team",
    designer: "Area",
    showDateTime: "Sat Feb 14, 2026 — 6:00 PM",
    tier: "B"
  },
  // Tier C — Emerging / access-friendly
  {
    to: "jcooper@laquansmith.com",
    prNameOrTeam: "LaQuan Smith Team",
    designer: "LaQuan Smith",
    showDateTime: "Sun Feb 15, 2026 — 9:00 PM",
    tier: "C"
  },
  {
    to: "hello@kimshui.net",
    prNameOrTeam: "Kim Shui Team",
    designer: "Kim Shui",
    showDateTime: "Fri Feb 13, 2026 — 8:00 PM",
    tier: "C"
  },
  {
    to: "press@fforme.com",
    prNameOrTeam: "Fforme Press Team",
    designer: "Fforme",
    showDateTime: "Sun Feb 15, 2026 — 2:00 PM",
    tier: "C"
  },
  {
    to: "info@privatepolicyny.com",
    prNameOrTeam: "Private Policy Team",
    designer: "Private Policy",
    showDateTime: "Fri Feb 13, 2026 — 5:00 PM",
    tier: "C"
  },
  {
    to: "press@adeamonline.com",
    prNameOrTeam: "Adeam Press Team",
    designer: "Adeam",
    showDateTime: "Fri Feb 13, 2026 — By appointment (time TBD)",
    tier: "C"
  },
  {
    to: "hello@dlx.co",
    prNameOrTeam: "DLX Team (Altuzarra PR)",
    designer: "Altuzarra",
    showDateTime: "Mon Feb 16, 2026 — 11:00 AM",
    tier: "C"
  }
];

function generateEmailBody(target: EmailTarget): string {
  let body = `Hi ${target.prNameOrTeam} —\n\n`;
  
  if (target.requiredFirstLine) {
    body += `${target.requiredFirstLine}\n\n`;
  }
  
  body += `I'm Allen Henson (allenhenson.com), a photographer covering NYFW this season. I'd like to request a press invite/credential for ${target.designer} on ${target.showDateTime}.\n\n`;
  
  body += `I shoot clean runway coverage + backstage detail with fast turnaround: 20 selects within 2 hours of show end, full edited gallery same day. Portfolio + recent event work: https://www.allenhenson.com/product-photography.\n\n`;
  
  body += `If you're not the right contact for invites, could you point me to the correct RSVP/press inbox?\n\n`;
  
  if (target.extraLine) {
    body += `${target.extraLine}\n\n`;
  }
  
  body += `Thank you,\nAllen Henson\n+1.347.764.9642 | https://www.instagram.com/_allenhenson/`;
  
  return body;
}

function generateSubject(target: EmailTarget): string {
  return `NYFW Feb 2026 — Photo Credential Request — ${target.designer} (${target.showDateTime}) — Allen Henson`;
}

interface EmailResult {
  to: string | string[];
  subject: string;
  body: string;
  timestamp: string;
  status: "sent" | "failed";
  error?: string;
}

async function sendEmail(target: EmailTarget): Promise<EmailResult> {
  const subject = generateSubject(target);
  const body = generateEmailBody(target);
  const timestamp = new Date().toISOString();
  
  const toAddresses = Array.isArray(target.to) ? target.to : [target.to];
  
  try {
    // Send to each recipient
    for (const toAddr of toAddresses) {
      const msg: sgMail.MailDataRequired = {
        to: toAddr,
        from: {
          email: FROM_EMAIL,
          name: FROM_NAME
        },
        subject: subject,
        text: body,
      };
      
      await sgMail.send(msg);
      console.log(`✓ Sent to ${toAddr}`);
    }
    
    return {
      to: target.to,
      subject,
      body,
      timestamp,
      status: "sent"
    };
  } catch (error: any) {
    const errorMsg = error?.response?.body?.errors?.[0]?.message || error?.message || "Unknown error";
    console.error(`✗ Failed to send to ${target.to}: ${errorMsg}`);
    
    return {
      to: target.to,
      subject,
      body,
      timestamp,
      status: "failed",
      error: errorMsg
    };
  }
}

async function main() {
  console.log("=".repeat(60));
  console.log("NYFW Feb 2026 — Press Credential Email Campaign");
  console.log("=".repeat(60));
  console.log(`Sending ${emailTargets.length} emails...\n`);
  
  const results: EmailResult[] = [];
  
  for (let i = 0; i < emailTargets.length; i++) {
    const target = emailTargets[i];
    console.log(`[${i + 1}/${emailTargets.length}] ${target.designer} (Tier ${target.tier})`);
    
    const result = await sendEmail(target);
    results.push(result);
    
    // Small delay between emails to avoid rate limiting
    if (i < emailTargets.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  // Summary
  console.log("\n" + "=".repeat(60));
  console.log("SUMMARY");
  console.log("=".repeat(60));
  
  const sent = results.filter(r => r.status === "sent").length;
  const failed = results.filter(r => r.status === "failed").length;
  
  console.log(`Total: ${results.length}`);
  console.log(`Sent: ${sent}`);
  console.log(`Failed: ${failed}`);
  
  if (failed > 0) {
    console.log("\nFailed emails:");
    results.filter(r => r.status === "failed").forEach(r => {
      console.log(`  - ${r.to}: ${r.error}`);
    });
  }
  
  // Output full log as JSON for record keeping
  const logFile = `/home/ubuntu/nyfw-email-log-${Date.now()}.json`;
  const fs = await import("fs");
  fs.writeFileSync(logFile, JSON.stringify(results, null, 2));
  console.log(`\nFull log saved to: ${logFile}`);
  
  return results;
}

main().catch(console.error);
