import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
if (!process.env.SUPABASE_URL) {
  throw new Error('Missing SUPABASE_URL environment variable');
}

if (!process.env.SUPABASE_ANON_KEY) {
  throw new Error('Missing SUPABASE_ANON_KEY environment variable');
}

// Create a Supabase client
export const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

/**
 * Send a magic link to the user's email for passwordless authentication
 * This is a more reliable way to handle email verification than custom verification codes
 */
export async function sendMagicLink(email: string): Promise<{
  success: boolean;
  message: string;
}> {
  try {
    console.log(`📧 Sending Supabase magic link to ${email}`);
    
    // Define the redirect URL - this will be where users are sent after clicking the magic link
    // In production, this should be your actual domain
    const redirectTo = process.env.NODE_ENV === 'production'
      ? 'https://bamboomade.in/verify'
      : 'http://localhost:5000/verify';
    
    // Send the magic link
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: redirectTo,
      }
    });

    if (error) {
      console.error(`❌ Failed to send magic link to ${email}:`, error.message);
      return {
        success: false,
        message: `Failed to send verification email: ${error.message}`
      };
    }

    console.log(`✅ Magic link sent successfully to ${email}`);
    return {
      success: true,
      message: 'Verification email sent. Please check your inbox.'
    };
  } catch (error) {
    console.error('❌ Exception sending magic link:', error);
    return {
      success: false,
      message: error instanceof Error 
        ? `Failed to send verification email: ${error.message}`
        : 'An unknown error occurred'
    };
  }
}

/**
 * Verify a one-time password (OTP) sent to the user's email
 */
export async function verifyOtp(email: string, otp: string): Promise<{
  success: boolean;
  message: string;
  session?: any;
}> {
  try {
    console.log(`🔐 Verifying OTP for ${email}`);
    
    // Verify the OTP
    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token: otp,
      type: 'email'
    });

    if (error) {
      console.error(`❌ Failed to verify OTP for ${email}:`, error.message);
      return {
        success: false,
        message: `Verification failed: ${error.message}`
      };
    }

    console.log(`✅ OTP verified successfully for ${email}`);
    return {
      success: true,
      message: 'Verification successful',
      session: data.session
    };
  } catch (error) {
    console.error('❌ Exception verifying OTP:', error);
    return {
      success: false,
      message: error instanceof Error 
        ? `Verification failed: ${error.message}`
        : 'An unknown error occurred'
    };
  }
}

/**
 * Exchange a Supabase JWT token for user information
 */
export async function getUserFromToken(token: string): Promise<{
  success: boolean;
  user?: any;
  message?: string;
}> {
  try {
    // Get user data from token
    const { data, error } = await supabase.auth.getUser(token);

    if (error) {
      return {
        success: false,
        message: error.message
      };
    }

    return {
      success: true,
      user: data.user
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}