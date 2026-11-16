import "server-only";
export type Attachment = { filename: string; content: Buffer };
export type Mail = { to: string; subject: string; html: string; attachments?: Attachment[] };
export interface EmailProvider { send(m: Mail): Promise<void> }
class ConsoleProvider implements EmailProvider {
  async send(m: Mail) { console.log(`[email:dev] recipient redacted, subject="${m.subject}"`);
    // Dev only: show the message text so one-time codes can be used locally. Never in production.
    if (process.env.NODE_ENV !== "production") console.log(`[email:dev:body] ${m.html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()}`); }
}
class ResendProvider implements EmailProvider {
  async send(m: Mail) {
    const { Resend } = await import("resend");
    const r = await new Resend(process.env.EMAIL_API_KEY).emails.send({
      from: process.env.EMAIL_FROM!, to: m.to, subject: m.subject, html: m.html,
      attachments: m.attachments?.map((a) => ({ filename: a.filename, content: a.content })),
    });
    if (r.error) throw new Error(r.error.message);
  }
}
export function emailProvider(): EmailProvider {
  return process.env.EMAIL_PROVIDER === "resend" && process.env.EMAIL_API_KEY ? new ResendProvider() : new ConsoleProvider();
}

/** Convenience wrapper used by other modules (OTP, admin resend). */
export async function sendEmail(m: Mail) { await emailProvider().send(m); }
