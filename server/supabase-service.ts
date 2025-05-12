import { sendRegistrationVerificationEmail } from './email-service';

/**
 * Send a verification code email to a user
 * @param email The user's email address
 * @param code The verification code to send
 * @returns True if the email was sent successfully, false otherwise
 */
export async function sendVerificationEmail(email: string, code: string): Promise<boolean> {
  try {
    const result = await sendRegistrationVerificationEmail(email, code);
    
    if (result) {
      console.log(`Verification email sent successfully to ${email}`);
    } else {
      console.error(`Failed to send verification email to ${email}`);
    }
    
    return result;
  } catch (error) {
    console.error("Exception sending verification email:", error);
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