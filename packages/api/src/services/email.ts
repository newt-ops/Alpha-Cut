import { Resend } from "resend";
import dotenv from "dotenv";

dotenv.config();

const apiKey = process.env.RESEND_API_KEY;
const resend = apiKey ? new Resend(apiKey) : null;
const CLIENT_URL = process.env.CLIENT_URL || "https://alpha-cut.com";
const FROM_EMAIL = process.env.RESEND_FROM || "Alpha Cut Agency <onboarding@resend.dev>";

export async function sendEmailVerificationEmail(params: {
  to: string;
  name: string;
  code: string;
  token: string;
}): Promise<boolean> {
  const verifyUrl = `${CLIENT_URL}/verify-email?token=${params.token}&email=${encodeURIComponent(params.to)}`;

  if (!resend) {
    console.log(`[Email Mock Verification] Sent to ${params.to}: Code=${params.code}, URL=${verifyUrl}`);
    return true;
  }

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: params.to,
      subject: `Your Alpha Cut Verification Code: ${params.code}`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 36px 16px; background-color: #F5F5F7; color: #181818;">
          <div style="background-color: #FFFFFF; border-radius: 20px; padding: 36px 32px; border: 1px solid #E5E5EA; box-shadow: 0 1px 3px rgba(0,0,0,0.02);">
            
            <!-- Brand Badge -->
            <div style="margin-bottom: 24px;">
              <span style="display: inline-block; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1.5px; color: #451D13; background-color: #FBEFE1; padding: 4px 10px; border-radius: 6px; border: 1px solid #E4BCAE;">
                Alpha Cut Agency
              </span>
              <h1 style="font-size: 24px; font-weight: 800; margin: 16px 0 6px 0; color: #181818; letter-spacing: -0.5px;">
                Verify your email address
              </h1>
              <p style="font-size: 14px; color: #707070; margin: 0; line-height: 1.5;">
                Hello <strong>${params.name || "there"}</strong>, welcome to Alpha Cut. Confirm your email address to unlock your video editing workspace.
              </p>
            </div>

            <!-- OTP Highlight Card -->
            <div style="margin: 28px 0; background-color: #FBEFE1; border: 1px solid #E4BCAE; border-radius: 16px; padding: 24px; text-align: center;">
              <div style="font-size: 11px; text-transform: uppercase; font-weight: 700; color: #451D13; letter-spacing: 1.5px; margin-bottom: 6px;">
                Your 6-Digit Verification Code
              </div>
              <div style="font-size: 38px; font-weight: 800; letter-spacing: 10px; color: #181818; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; margin: 10px 0;">
                ${params.code}
              </div>
              <div style="font-size: 12px; color: #754637; font-weight: 600;">
                Expires in 15 minutes
              </div>
            </div>

            <!-- 1-Click Verification Action -->
            <div style="text-align: center; margin: 28px 0;">
              <p style="font-size: 13px; color: #868686; margin-bottom: 12px;">
                Or verify with a single tap:
              </p>
              <a href="${verifyUrl}" style="background-color: #181818; color: #FFFFFF; font-size: 14px; font-weight: 700; padding: 14px 32px; border-radius: 9999px; text-decoration: none; display: inline-block;">
                Verify Email Address &rarr;
              </a>
            </div>

            <!-- Security Footer -->
            <div style="margin-top: 36px; padding-top: 20px; border-top: 1px solid #E5E5EA; font-size: 12px; color: #868686; line-height: 1.6;">
              <p style="margin: 0 0 6px 0;">
                If you did not create an account on Alpha Cut, you can safely disregard this email.
              </p>
              <p style="margin: 0;">
                Alpha Cut Video Editing Agency &bull; <a href="https://alpha-cut.com" style="color: #868686; text-decoration: underline;">alpha-cut.com</a>
              </p>
            </div>

          </div>
        </div>
      `,
    });
    console.log(`[Email] Verification email sent to ${params.to}`);
    return true;
  } catch (error) {
    console.error(`[Email Error] Failed to send verification email to ${params.to}:`, error);
    return false;
  }
}

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

