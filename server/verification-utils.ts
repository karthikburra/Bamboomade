// Import dynamically to avoid circular dependencies

/**
 * Send a verification code email to a user
 * Uses SendGrid first, then falls back to regular email service if SendGrid fails
 * 
 * @param email The user's email address
 * @param code The verification code to send
 * @returns True if the email was sent successfully, false otherwise
 */
export async function sendVerificationEmail(email: string, code: string): Promise<boolean> {
  try {
    console.log(`Attempting to send verification email to ${email} with code ${code}`);
    
    // First try with SendGrid (more reliable)
    try {
      // Import SendGrid service dynamically to avoid circular dependencies
      const { sendVerificationCodeEmailWithSendGrid } = await import('./sendgrid-service');
      
      console.log(`🚀 Attempting to send verification email via SendGrid to: ${email}`);
      const sendgridResult = await sendVerificationCodeEmailWithSendGrid(email, code);
      
      if (sendgridResult) {
        console.log(`✅ SendGrid verification email sent successfully to: ${email}`);
        return true;
      }
    } catch (sendgridError) {
      console.error(`❌ SendGrid email error:`, sendgridError);
      // Continue to fallback if SendGrid fails
      console.log(`⚠️ SendGrid failed, falling back to standard email service`);
    }
    
    // Fallback to regular email service
    const { sendRegistrationVerificationEmail } = await import('./email-service');
    const result = await sendRegistrationVerificationEmail(email, code);
    
    if (result) {
      console.log(`✅ Verification email sent successfully to ${email} via fallback`);
    } else {
      console.error(`❌ Failed to send verification email to ${email} via fallback`);
    }
    
    return result;
  } catch (error) {
    console.error("❌ Exception sending verification email:", error);
    
    // Add more detailed error information
    if (error instanceof Error) {
      console.error(`Error name: ${error.name}`);
      console.error(`Error message: ${error.message}`);
      console.error(`Error stack: ${error.stack}`);
    }
    
    return false;
  }
}

/**
 * Generate a random verification code
 * @param length The length of the code (default: 6)
 * @returns A random alphanumeric code
 */
export function generateVerificationCode(length: number = 6): string {
  const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let code = '';
  for (let i = 0; i < length; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}