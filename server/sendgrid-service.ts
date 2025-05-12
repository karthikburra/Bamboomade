import { MailService } from '@sendgrid/mail';

if (!process.env.SENDGRID_API_KEY) {
  throw new Error("SENDGRID_API_KEY environment variable must be set");
}

const mailService = new MailService();
mailService.setApiKey(process.env.SENDGRID_API_KEY);

/**
 * SendGrid email service for reliable email delivery
 * This provides a more reliable alternative to the SMTP-based email service
 */
export async function sendEmailWithSendGrid({
  to,
  from = "Info@bamboomade.in",
  subject,
  text,
  html
}: {
  to: string;
  from?: string;
  subject: string;
  text?: string;
  html?: string;
}): Promise<boolean> {
  try {
    console.log(`📧 [SendGrid] Sending email to ${to}`);
    
    await mailService.send({
      to,
      from,
      subject,
      text,
      html
    });
    
    console.log(`✅ [SendGrid] Email sent successfully to ${to}`);
    return true;
  } catch (error) {
    console.error(`❌ [SendGrid] Error sending email:`, error);
    if (error instanceof Error) {
      console.error(`Error name: ${error.name}`);
      console.error(`Error message: ${error.message}`);
      
      // Log detailed SendGrid error information if available
      if (error.hasOwnProperty('response')) {
        // @ts-ignore
        console.error(`Error response: ${JSON.stringify(error.response?.body || {})}`);
      }
    }
    return false;
  }
}

/**
 * Sends a verification code email using SendGrid
 */
export async function sendVerificationCodeEmailWithSendGrid(
  email: string,
  code: string
): Promise<boolean> {
  const subject = "Your BambooMade Login Code";
  
  // Create the HTML content for the email
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
      <div style="text-align: center; margin-bottom: 20px;">
        <img src="https://bamboomade.in/logo-dark.png" alt="BambooMade Logo" style="max-width: 200px;">
      </div>
      
      <div style="background-color: #f9f9f9; border-radius: 5px; padding: 20px; margin-bottom: 20px;">
        <h2 style="color: #2e7d32; margin-top: 0;">Verification Code</h2>
        <p>Hello,</p>
        <p>Your verification code for BambooMade is:</p>
        
        <div style="background-color: #2e7d32; color: white; font-size: 24px; font-weight: bold; text-align: center; padding: 15px; border-radius: 5px; letter-spacing: 5px; margin: 20px 0;">
          ${code}
        </div>
        
        <p>This code will expire in 15 minutes.</p>
        <p>If you didn't request this code, please ignore this email.</p>
      </div>
      
      <div style="font-size: 12px; color: #666; text-align: center;">
        <p>© ${new Date().getFullYear()} BambooMade. All rights reserved.</p>
        <p>Info@bamboomade.in | Banjara Hills, Hyderabad</p>
      </div>
    </div>
  `;
  
  // Create plain text version as a fallback
  const text = `
    Your BambooMade Verification Code
    
    Hello,
    
    Your verification code for BambooMade is: ${code}
    
    This code will expire in 15 minutes.
    
    If you didn't request this code, please ignore this email.
    
    © ${new Date().getFullYear()} BambooMade. All rights reserved.
    Info@bamboomade.in | Banjara Hills, Hyderabad
  `;
  
  return await sendEmailWithSendGrid({
    to: email,
    subject,
    html,
    text
  });
}