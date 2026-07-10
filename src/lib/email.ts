import { Resend } from "resend";

interface ConfirmationEmail {
  to: string;
  volunteerName: string;
  listTitle: string;
  slotLabel: string;
  slotDateFormatted: string;
  location: string;
  contactName: string;
  contactEmail: string;
  manageUrl: string;
  publicUrl: string;
}

/**
 * Sends the signup confirmation with the volunteer's private edit/cancel
 * link. No-op when RESEND_API_KEY isn't configured so local dev and demo
 * environments still work.
 */
export async function sendConfirmationEmail(email: ConfirmationEmail) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.log(`[email skipped: no RESEND_API_KEY] manage link for ${email.to}: ${email.manageUrl}`);
    return;
  }

  const resend = new Resend(apiKey);
  const from = process.env.EMAIL_FROM ?? "SignupDingus <onboarding@resend.dev>";

  const contactLine =
    email.contactName || email.contactEmail
      ? `<p>Questions? Contact ${email.contactName || "the coordinator"}${
          email.contactEmail
            ? ` at <a href="mailto:${email.contactEmail}">${email.contactEmail}</a>`
            : ""
        }.</p>`
      : "";

  try {
    await resend.emails.send({
      from,
      to: email.to,
      subject: `You're signed up: ${email.slotLabel} on ${email.slotDateFormatted}`,
      html: `
        <div style="font-family: sans-serif; max-width: 560px; margin: 0 auto; color: #292524;">
          <h2 style="color: #047857;">Thanks for volunteering, ${email.volunteerName}!</h2>
          <p>You're confirmed for the following slot:</p>
          <table style="border-collapse: collapse; margin: 16px 0;">
            <tr><td style="padding: 4px 12px 4px 0; color: #78716c;">Signup</td><td style="padding: 4px 0;"><strong>${email.listTitle}</strong></td></tr>
            <tr><td style="padding: 4px 12px 4px 0; color: #78716c;">Role</td><td style="padding: 4px 0;">${email.slotLabel}</td></tr>
            <tr><td style="padding: 4px 12px 4px 0; color: #78716c;">Date</td><td style="padding: 4px 0;">${email.slotDateFormatted}</td></tr>
            ${email.location ? `<tr><td style="padding: 4px 12px 4px 0; color: #78716c;">Location</td><td style="padding: 4px 0;">${email.location}</td></tr>` : ""}
          </table>
          <p>
            Need to make a change? Use your private link to
            <a href="${email.manageUrl}">edit or cancel your signup</a>.
          </p>
          <p><a href="${email.publicUrl}">View the full signup list</a></p>
          ${contactLine}
          <hr style="border: none; border-top: 1px solid #e7e5e4; margin: 24px 0;" />
          <p style="font-size: 12px; color: #a8a29e;">Sent by SignupDingus</p>
        </div>
      `,
    });
  } catch (err) {
    // A failed email should never block the signup itself.
    console.error("Failed to send confirmation email:", err);
  }
}
