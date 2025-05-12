import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials. Make sure SUPABASE_URL and SUPABASE_SERVICE_KEY are set.");
}

export const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Send a verification code email to a user
 * @param email The user's email address
 * @param code The verification code to send
 * @returns True if the email was sent successfully, false otherwise
 */
export async function sendVerificationEmail(email: string, code: string): Promise<boolean> {
  try {
    const { error } = await supabase.auth.admin.createUser({
      email,
      email_confirm: false,
      user_metadata: { 
        verification_code: code,
        verification_created_at: new Date().toISOString(),
      },
    });

    if (error) {
      console.error("Error creating user for verification:", error);
      return false;
    }

    // Send a magic link that contains the verification code in the URL
    const { error: magicLinkError } = await supabase.auth.admin.inviteUserByEmail(email, {
      redirectTo: `${process.env.APP_URL || ''}/verify-email?code=${code}`,
    });

    if (magicLinkError) {
      console.error("Error sending verification email:", magicLinkError);
      return false;
    }

    return true;
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

/**
 * Verify a user's email verification code
 * @param email The user's email address
 * @param code The verification code to verify
 * @returns True if the code is valid, false otherwise
 */
export async function verifyEmailCode(email: string, code: string): Promise<boolean> {
  try {
    const { data, error } = await supabase.auth.admin.listUsers();
    
    if (error) {
      console.error("Error listing users:", error);
      return false;
    }

    // Find the user with the given email
    const user = data.users.find(u => u.email === email);
    
    if (!user) {
      console.error("User not found:", email);
      return false;
    }

    const storedCode = user.user_metadata?.verification_code;
    const createdAt = user.user_metadata?.verification_created_at;
    
    if (!storedCode || !createdAt) {
      console.error("No verification code found for user:", email);
      return false;
    }

    // Check if the code has expired (24 hours)
    const createdDate = new Date(createdAt);
    const now = new Date();
    const hoursDiff = (now.getTime() - createdDate.getTime()) / (1000 * 60 * 60);
    
    if (hoursDiff > 24) {
      console.error("Verification code expired for user:", email);
      return false;
    }

    // Verify the code
    if (storedCode === code) {
      // Update the user's metadata to mark them as verified
      const { error: updateError } = await supabase.auth.admin.updateUserById(
        user.id,
        { user_metadata: { email_verified: true } }
      );

      if (updateError) {
        console.error("Error updating user verification status:", updateError);
        return false;
      }

      return true;
    } else {
      console.error("Invalid verification code for user:", email);
      return false;
    }
  } catch (error) {
    console.error("Exception verifying email code:", error);
    return false;
  }
}