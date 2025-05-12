import { createClient } from '@supabase/supabase-js';
import nodemailer from 'nodemailer';
import { v4 as uuidv4 } from 'uuid';
import { storage } from './storage';

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
  console.warn('❗ Missing Supabase credentials. Email verification will use fallback methods.');
}

// Initialize Supabase client if credentials are available
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || '';

let supabase: any = null;

try {
  if (supabaseUrl && supabaseAnonKey) {
    supabase = createClient(supabaseUrl, supabaseAnonKey);
    console.log('✅ Supabase client initialized successfully');
  }
} catch (error) {
  console.error('❌ Failed to initialize Supabase client:', error);
}

/**
 * Track pending email verification requests
 * This is needed for the custom verification system as a fallback
 */
interface PendingVerification {
  email: string;
  code: string;
  createdAt: Date;
  attempts: number;
}

const pendingVerifications = new Map<string, PendingVerification>();

// Utility to clean up expired verification codes (older than 1 hour)
function cleanupExpiredVerifications() {
  const now = new Date();
  
  pendingVerifications.forEach((verification, email) => {
    const expirationTime = new Date(verification.createdAt.getTime() + 60 * 60 * 1000); // 1 hour expiration
    
    if (now > expirationTime) {
      pendingVerifications.delete(email);
      console.log(`🧹 Removed expired verification for: ${email}`);
    }
  });
}

// Run cleanup every 10 minutes
setInterval(cleanupExpiredVerifications, 10 * 60 * 1000);

/**
 * Generate and send a verification code via Supabase OTP if available
 * Falls back to custom verification system if Supabase is not configured
 */
export async function sendVerificationCode(email: string): Promise<{
  success: boolean;
  message: string;
  verificationCode?: string;
}> {
  if (!email) {
    return { success: false, message: 'Email is required' };
  }
  
  // Clean up any expired verifications first
  cleanupExpiredVerifications();
  
  // Generate a 6-digit verification code
  const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
  
  try {
    // Store the verification code for all emails
    pendingVerifications.set(email, {
      email,
      code: verificationCode,
      createdAt: new Date(),
      attempts: 0
    });
    
    // Skip Supabase OTP as it's not enabled for this project
    console.log(`📧 Using direct email verification for: ${email}`);
    
    // Import email service dynamically to avoid circular dependencies
    const { sendLoginVerificationEmail } = await import('./email-service');
    
    const emailSent = await sendLoginVerificationEmail(email, verificationCode);
    
    if (!emailSent) {
      throw new Error('Failed to send verification email');
    }
    
    // Store the verification code
    pendingVerifications.set(email, {
      email,
      code: verificationCode,
      createdAt: new Date(),
      attempts: 0
    });
    
    console.log(`✅ Custom verification email sent to: ${email}`);
    return { success: true, message: 'Verification code sent to your email' };
  } catch (error: any) {
    console.error(`❌ Failed to send verification:`, error);
    
    return {
      success: false,
      message: `Failed to send verification: ${error.message || 'Unknown error'}`
    };
  }
}

/**
 * Verify a code for the custom verification system
 */
export async function verifyCode(email: string, code: string): Promise<{
  success: boolean;
  message: string;
}> {
  if (!email || !code) {
    return { success: false, message: 'Email and verification code are required' };
  }
  
  console.log(`🔍 Verifying code for email: ${email}`);
  
  // Clean up any expired verifications first
  cleanupExpiredVerifications();
  
  // Check if there's a pending verification for this email
  const verification = pendingVerifications.get(email);
  
  if (!verification) {
    console.log(`❌ No pending verification found for: ${email}`);
    return { success: false, message: 'Verification code expired or not requested' };
  }
  
  // Increment attempt count
  verification.attempts += 1;
  
  // Check if too many attempts
  if (verification.attempts > 5) {
    pendingVerifications.delete(email);
    console.log(`❌ Too many verification attempts for: ${email}`);
    return { success: false, message: 'Too many verification attempts. Please request a new code.' };
  }
  
  // Check if code matches
  if (verification.code !== code) {
    console.log(`❌ Invalid verification code for: ${email}`);
    return { success: false, message: 'Invalid verification code' };
  }
  
  // Code is valid, clean up and return success
  pendingVerifications.delete(email);
  console.log(`✅ Verification code valid for: ${email}`);
  
  return { success: true, message: 'Verification successful' };
}

/**
 * Verify a token from Supabase magic link or OTP
 */
export async function verifyOTP(email: string, token: string): Promise<{
  success: boolean;
  message: string;
}> {
  if (!supabase) {
    return { success: false, message: 'Supabase client not initialized' };
  }
  
  try {
    console.log(`🔍 Verifying Supabase OTP for email: ${email}`);
    
    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: 'email'
    });
    
    if (error) {
      console.error(`❌ Supabase OTP verification error:`, error);
      return { success: false, message: error.message };
    }
    
    console.log(`✅ Supabase OTP verification successful for: ${email}`);
    return { success: true, message: 'Verification successful' };
  } catch (error: any) {
    console.error(`❌ Failed to verify OTP:`, error);
    
    return {
      success: false,
      message: `Failed to verify: ${error.message || 'Unknown error'}`
    };
  }
}

/**
 * Get user from a token (used for magic link verification)
 */
export async function getUserFromToken(token: string): Promise<{
  success: boolean;
  message?: string;
  user?: { email: string };
}> {
  if (!supabase) {
    return { success: false, message: 'Supabase client not initialized' };
  }
  
  try {
    console.log(`🔍 Getting user from token`);
    
    // Extract JWT from token
    const jwtToken = token;
    
    const { data: { user }, error } = await supabase.auth.getUser(jwtToken);
    
    if (error) {
      console.error(`❌ Error getting user from token:`, error);
      return { success: false, message: error.message };
    }
    
    if (!user || !user.email) {
      console.error(`❌ No user or email found in token`);
      return { success: false, message: 'Invalid token or no email associated' };
    }
    
    console.log(`✅ Successfully extracted user email from token: ${user.email}`);
    return { success: true, user: { email: user.email } };
  } catch (error: any) {
    console.error(`❌ Failed to get user from token:`, error);
    
    return {
      success: false,
      message: `Token verification failed: ${error.message || 'Unknown error'}`
    };
  }
}

/**
 * Send a magic link for email verification
 */
export async function sendMagicLink(email: string): Promise<{
  success: boolean;
  message: string;
}> {
  if (!supabase) {
    return { 
      success: false, 
      message: 'Supabase client not initialized, falling back to code verification'
    };
  }
  
  try {
    console.log(`🔗 Sending magic link to: ${email}`);
    
    const { data, error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: false,
        emailRedirectTo: `${process.env.PUBLIC_URL || 'http://localhost:3000'}/verify-email`
      }
    });
    
    if (error) {
      console.error(`❌ Supabase magic link error:`, error);
      return { success: false, message: error.message };
    }
    
    console.log(`✅ Magic link sent successfully to: ${email}`);
    return { success: true, message: 'Magic link sent to your email' };
  } catch (error: any) {
    console.error(`❌ Failed to send magic link:`, error);
    
    return {
      success: false,
      message: `Failed to send magic link: ${error.message || 'Unknown error'}`
    };
  }
}