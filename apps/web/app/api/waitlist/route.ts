import { NextResponse } from "next/server";
import { Resend } from "resend";

// Waitlist signup. On submit we send two emails:
//   1. A notification to the Tael team ("someone is interested").
//   2. A welcome/confirmation to the person who signed up.
// Nothing is persisted. Configure via env (see .env.example):
//   RESEND_API_KEY        : Resend API key (required to send)
//   WAITLIST_NOTIFY_EMAIL : inbox that receives signup notifications (required)
//   WAITLIST_FROM_EMAIL   : verified sender, e.g. "Tael <hello@taelprotocol.xyz>"
// NOTE: sending to arbitrary recipients (the welcome email, or a notify inbox
// other than your Resend account email) requires a VERIFIED domain in Resend.

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  let email: unknown;
  try {
    ({ email } = await request.json());
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (typeof email !== "string" || !EMAIL_RE.test(email.trim())) {
    return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
  }
  const address = email.trim();

  const apiKey = process.env.RESEND_API_KEY;
  const notify = process.env.WAITLIST_NOTIFY_EMAIL;
  const from = process.env.WAITLIST_FROM_EMAIL ?? "Tael <onboarding@resend.dev>";

  if (!apiKey || !notify) {
    console.error("[waitlist] Missing RESEND_API_KEY or WAITLIST_NOTIFY_EMAIL env var.");
    return NextResponse.json({ error: "Waitlist is not configured yet." }, { status: 500 });
  }

  const resend = new Resend(apiKey);

  // 1) Notify the team. This is our record of the lead, so it must succeed.
  const teamResult = await resend.emails.send({
    from,
    to: notify,
    replyTo: address,
    subject: `New Tael waitlist signup: ${address}`,
    text: `New waitlist signup: ${address}\n\nReply to this email to reach them directly.`,
  });

  if (teamResult.error) {
    console.error("[waitlist] Team notification failed:", teamResult.error);
    return NextResponse.json({ error: "Could not submit right now. Try again." }, { status: 502 });
  }

  // 2) Welcome the signup. Best-effort: don't fail the request if this bounces
  // (e.g. before the sending domain is verified). The lead is already captured.
  const welcomeResult = await resend.emails.send({
    from,
    to: address,
    subject: "You're on the Tael waitlist",
    text: [
      "Hi,",
      "",
      "Thanks for your interest in Tael. You're on the waitlist.",
      "",
      "Tael is the payment layer for autonomous AI agents. We'll email you as soon",
      "as early access is available.",
      "",
      "The Tael team",
    ].join("\n"),
    html: `
      <div style="font-family:Inter,Arial,sans-serif;color:#27272A;line-height:1.6;font-size:15px">
        <p style="margin:0 0 16px">Hi,</p>
        <p style="margin:0 0 16px">Thanks for your interest in Tael. You're on the waitlist.</p>
        <p style="margin:0 0 16px">Tael is the payment layer for autonomous AI agents. We'll email you as soon as early access is available.</p>
        <p style="margin:24px 0 0">The Tael team</p>
      </div>
    `,
  });

  if (welcomeResult.error) {
    console.error("[waitlist] Welcome email failed (lead still captured):", welcomeResult.error);
  }

  return NextResponse.json({ ok: true });
}
