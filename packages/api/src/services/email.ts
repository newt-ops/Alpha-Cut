import { Resend } from "resend";
import dotenv from "dotenv";

dotenv.config();

const apiKey = process.env.RESEND_API_KEY;
const resend = apiKey ? new Resend(apiKey) : null;

export async function sendInquiryConfirmationEmail(params: {
  to: string;
  name: string;
  style: string;
  format: string;
}): Promise<void> {
  if (!resend) {
    console.log(`[Email Mock] Inquiry confirmation email to ${params.to} (${params.name})`);
    return;
  }

  try {
    await resend.emails.send({
      from: "Alpha Cut Agency <onboarding@resend.dev>",
      to: params.to,
      subject: "We received your video brief — Alpha Cut Agency",
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px; background-color: #F5F5F7; color: #181818;">
          <div style="background-color: #FFFFFF; border-radius: 20px; padding: 32px; border: 1px solid #E5E5EA;">
            <div style="margin-bottom: 24px;">
              <span style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #451D13;">Alpha Cut Agency</span>
              <h1 style="font-size: 24px; font-weight: 800; margin: 8px 0 0 0; color: #181818;">Brief Received, ${params.name}</h1>
            </div>
            <p style="font-size: 15px; line-height: 1.6; color: #404040;">
              Thank you for reaching out to Alpha Cut. We've received your video editing request for <strong>${params.style}</strong> (${params.format}).
            </p>
            <p style="font-size: 15px; line-height: 1.6; color: #404040;">
              Amir and Aymen are currently reviewing your project details and footage links. You will receive an initial proposal and scope breakdown within <strong>24 hours</strong>.
            </p>
            <div style="margin: 32px 0; padding: 20px; border-radius: 16px; background-color: #FBEFE1; border: 1px solid #E4BCAE;">
              <p style="margin: 0; font-size: 13px; font-weight: 600; color: #451D13;">
                Need an immediate update?
              </p>
              <p style="margin: 4px 0 0 0; font-size: 13px; color: #451D13;">
                Connect with us directly on Telegram: <a href="https://t.me/alpha_cut_bot" style="color: #451D13; font-weight: 700;">@alpha_cut_bot</a>
              </p>
            </div>
            <p style="font-size: 13px; color: #868686; margin-top: 32px; border-top: 1px solid #E5E5EA; padding-top: 16px;">
              Alpha Cut Video Editing Agency &bull; alphacutagency@gmail.com
            </p>
          </div>
        </div>
      `,
    });
    console.log(`[Email] Confirmation email sent to ${params.to}`);
  } catch (error) {
    console.error(`[Email Error] Failed to send email to ${params.to}:`, error);
  }
}
