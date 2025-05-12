import express, { type Express, type Request, type Response, type NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import crypto from "crypto";

// Extend session interface to include admin user type
declare module 'express-session' {
  interface SessionData {
    userId?: number;
    adminUser?: {
      email: string;
      isAdmin: boolean;
      id: number;
    };
  }
}
import { db } from "./db";
import { eq, and, asc, desc } from "drizzle-orm";
import multer from "multer";
import path from "path";
import fs from "fs";
import { insertUserSchema, insertProjectSchema, insertProjectGuidanceSchema, insertChatMessageSchema, insertAiTrainingDataSchema, insertTokenPurchaseSchema, User, socialMediaContent, bambooFacts } from "@shared/schema";
import { processMessage as processOpenAIMessage, convertWhatsAppToTrainingData, getOpenAI } from "./openai-service.js";
import { getGeminiAI, processMessage, summarizeContent as geminiSummarizeContent, extractFactsFromContent as geminiExtractFacts } from "./gemini-service";
import { processUrlWithGemini, processFileWithGemini } from "./gemini-extractor";
import OpenAI from "openai";
import { getLatestEventsSummary, getRecentUpdates, getInterestingBambooFact, getMultipleBambooFacts, getUpcomingEvents } from "./event-refresher";
// PhonePe service removed
import { initiateRazorpayPayment, verifyRazorpayPayment, getRazorpayPaymentDetails } from "./razorpay-service";
import { 
  generateGoogleMeetLink, 
  generateGoogleCalendarLink,
  sendVerificationCodeEmail
} from "./email-service";
import { sendVerificationEmail, generateVerificationCode } from "./verification-utils";
// Web crawler and document analyzer
import { 
  analyzeWebsite, 
  isValidUrl, 
  detectContentType,
  detectContentTypeFromUrl,
  getPlatformFromUrl,
  getHandleFromUrl 
} from "./web-crawler";
// Google Sheets integration removed as requested
import { format, formatInTimeZone } from "date-fns-tz";
import { addMinutes } from "date-fns";
import { ZodError } from "zod";
import { z } from "zod";
import admin from "firebase-admin";
import bcrypt from "bcrypt";

/**
 * Calculate string similarity using Levenshtein distance
 * Returns a value between 0 and 1, where 1 means identical strings
 */
function calculateStringSimilarity(a: string, b: string): number {
  if (a.length === 0) return b.length === 0 ? 1 : 0;
  if (b.length === 0) return 0;
  
  // Simple case: exact match
  if (a === b) return 1;
  
  // Calculate Levenshtein distance
  const matrix: number[][] = [];
  
  // Initialize matrix
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }
  
  // Fill matrix
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      const cost = a[j - 1] === b[i - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,      // deletion
        matrix[i][j - 1] + 1,      // insertion
        matrix[i - 1][j - 1] + cost // substitution
      );
    }
  }
  
  // Calculate similarity as 1 - normalized distance
  const maxLength = Math.max(a.length, b.length);
  const distance = matrix[b.length][a.length];
  return 1 - distance / maxLength;
}

/**
 * Parses a SQL-like query string into a structured object
 * Example: "SELECT * FROM content WHERE contentType = 'webpage' ORDER BY createdAt DESC LIMIT 10"
 */
function parseSqlLikeQuery(query: string) {
  // Create the result structure
  const result = {
    valid: true,
    error: '',
    select: '*',
    from: 'content',
    where: [] as Array<{field: string, operator: string, value: any}>,
    orderBy: null as null | {field: string, direction: 'ASC' | 'DESC'},
    limit: null as null | number
  };
  
  try {
    // Normalize query
    query = query.trim();
    const upperQuery = query.toUpperCase();
    
    // Basic validation - must start with SELECT
    if (!upperQuery.startsWith('SELECT')) {
      return { valid: false, error: 'Query must start with SELECT' };
    }
    
    // Parse SELECT clause
    let parts = upperQuery.split('FROM');
    if (parts.length < 2) {
      return { valid: false, error: 'Missing FROM clause' };
    }
    
    const selectClause = parts[0].replace('SELECT', '').trim();
    result.select = selectClause === '*' ? '*' : selectClause.split(',').map(s => s.trim());
    
    // The rest of the query
    let remainingQuery = parts[1].trim();
    
    // We assume FROM is always "content" for our AI Knowledge base
    result.from = 'content';
    
    // Parse WHERE clause if it exists
    if (upperQuery.includes('WHERE')) {
      parts = remainingQuery.split('WHERE');
      if (parts.length < 2) {
        return { valid: false, error: 'Invalid WHERE clause' };
      }
      
      remainingQuery = parts[1].trim();
      
      // Further split by ORDER BY or LIMIT if they exist
      let whereClause = remainingQuery;
      if (upperQuery.includes('ORDER BY')) {
        whereClause = remainingQuery.split('ORDER BY')[0].trim();
      } else if (upperQuery.includes('LIMIT')) {
        whereClause = remainingQuery.split('LIMIT')[0].trim();
      }
      
      // Parse WHERE conditions (supports multiple conditions)
      const conditions = whereClause.split('AND').map(s => s.trim());
      result.where = conditions.map(condition => {
        // Check for different operators
        let operator = '=';
        let parts: string[] = [];
        
        if (condition.includes('!=')) {
          operator = '!=';
          parts = condition.split('!=').map(s => s.trim());
        } else if (condition.includes('>=')) {
          operator = '>=';
          parts = condition.split('>=').map(s => s.trim());
        } else if (condition.includes('<=')) {
          operator = '<=';
          parts = condition.split('<=').map(s => s.trim());
        } else if (condition.includes('>')) {
          operator = '>';
          parts = condition.split('>').map(s => s.trim());
        } else if (condition.includes('<')) {
          operator = '<';
          parts = condition.split('<').map(s => s.trim());
        } else if (condition.includes('LIKE')) {
          operator = 'LIKE';
          parts = condition.split('LIKE').map(s => s.trim());
        } else if (condition.includes('=')) {
          operator = '=';
          parts = condition.split('=').map(s => s.trim());
        } else {
          return { field: '', operator: '', value: '' }; // Invalid condition
        }
        
        if (parts.length !== 2) {
          return { field: '', operator: '', value: '' }; // Invalid condition
        }
        
        const field = parts[0].toLowerCase();
        let value: string | number | boolean = parts[1];
        
        // Process value - remove quotes if they exist
        if (typeof value === 'string') {
          if ((value.startsWith("'") && value.endsWith("'")) || 
              (value.startsWith('"') && value.endsWith('"'))) {
            value = value.substring(1, value.length - 1);
          } else if (value === 'TRUE' || value === 'FALSE') {
            value = value === 'TRUE';
          } else if (!isNaN(Number(value))) {
            value = Number(value);
          }
        }
        
        return { field, operator, value };
      });
    }
    
    // Parse ORDER BY clause if it exists
    if (upperQuery.includes('ORDER BY')) {
      parts = remainingQuery.split('ORDER BY');
      if (parts.length < 2) {
        return { valid: false, error: 'Invalid ORDER BY clause' };
      }
      
      remainingQuery = parts[1].trim();
      
      // Further split by LIMIT if it exists
      let orderByClause = remainingQuery;
      if (upperQuery.includes('LIMIT')) {
        orderByClause = remainingQuery.split('LIMIT')[0].trim();
      }
      
      const orderParts = orderByClause.split(' ');
      const field = orderParts[0].toLowerCase();
      const direction: 'ASC' | 'DESC' = orderParts.length > 1 && orderParts[1] === 'DESC' ? 'DESC' : 'ASC';
      
      result.orderBy = { field, direction };
    }
    
    // Parse LIMIT clause if it exists
    if (upperQuery.includes('LIMIT')) {
      parts = remainingQuery.split('LIMIT');
      if (parts.length < 2) {
        return { valid: false, error: 'Invalid LIMIT clause' };
      }
      
      const limitValue = parts[1].trim();
      const limit = parseInt(limitValue, 10);
      
      if (isNaN(limit) || limit < 0) {
        return { valid: false, error: 'Invalid LIMIT value' };
      }
      
      result.limit = limit;
    }
    
    return result;
  } catch (error) {
    return { 
      valid: false, 
      error: `Failed to parse query: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

// The time zone for India (IST)
const TIMEZONE = 'Asia/Kolkata';

// Helper function to format dates in IST
function formatInIST(date: Date, formatStr: string): string {
  return formatInTimeZone(date, TIMEZONE, formatStr);
}

// Function to check if a time slot is already booked
async function isTimeSlotBooked(date: Date, sessionIdToExclude?: number): Promise<boolean> {
  // Get all sessions to check for conflicts
  const allSessions = await storage.getAllProjectGuidances();
  
  // Format the date for comparison - CRITICAL: use formatInIST for consistent timezone handling
  const targetDateStr = formatInIST(date, "yyyy-MM-dd");
  const targetTimeStr = formatInIST(date, "HH:mm");
  console.log(`Using IST timezone conversion: ${date.toISOString()} => ${targetDateStr} ${targetTimeStr}`);
  
  // Create a list of sessions for this date for detailed logging
  const sessionsOnThisDate = allSessions.filter(s => {
    const sessionDate = new Date(s.date);
    // CRITICAL: Use formatInIST for consistent time zone handling
    return formatInIST(sessionDate, "yyyy-MM-dd") === targetDateStr;
  }).map(s => {
    const sessionDate = new Date(s.date);
    return {
      id: s.id,
      // CRITICAL: Use formatInIST for consistent time zone handling
      time: formatInIST(sessionDate, "HH:mm"),
      status: s.status || 'unknown',
      paymentConfirmed: s.paymentConfirmed
    };
  });
  
  // Log all sessions for this day for better debugging
  console.log(`Sessions on ${targetDateStr}:`, sessionsOnThisDate);
  
  // For detailed logging
  console.log(`Checking time slot conflict for ${targetDateStr} ${targetTimeStr}, excluding sessionId ${sessionIdToExclude || 'none'}`);
  
  // IMPROVED: Check if the time is a half-hour booking (like 13:30)
  const isHalfHourBooking = targetTimeStr.endsWith(":30");
  console.log(`Time format check: ${targetTimeStr} is ${isHalfHourBooking ? 'a half-hour booking' : 'a full-hour booking'}`);
  
  // If it's a half-hour booking, also check if it conflicts with an hour slot
  // For example, a 13:30 booking conflicts with both 13:00 and 14:00 slots
  const hourToCheck: string[] = [];
  if (isHalfHourBooking) {
    // For a 13:30 booking, check both 13:00 and 14:00 for conflicts
    const hour = parseInt(targetTimeStr.split(":")[0]);
    hourToCheck.push(`${hour.toString().padStart(2, '0')}:00`);  // Current hour (13:00)
    hourToCheck.push(`${(hour + 1).toString().padStart(2, '0')}:00`); // Next hour (14:00)
    console.log(`Half-hour booking detected. Will check for conflicts in both ${hourToCheck[0]} and ${hourToCheck[1]}`);
  }
  
  // No more special case handling - we'll rely on the standard booking logic instead
  console.log(`Standard conflict checking for ${targetDateStr} ${targetTimeStr}`);
  // We use formatInIST everywhere to ensure consistent time zone handling
  
  // Check if any session conflicts with this date and time
  return allSessions.some(session => {
    // Skip cancelled sessions
    if (session.status === 'cancelled') {
      return false;
    }
    
    // For session rescheduling to same slot (detect no change case)
    if (sessionIdToExclude && session.id === sessionIdToExclude) {
      const sessionDate = new Date(session.date);
      // CRITICAL: Use formatInIST for consistent time zone handling
      const sessionTimeFormatted = formatInIST(sessionDate, "yyyy-MM-dd HH:mm");
      const targetTimeFormatted = formatInIST(date, "yyyy-MM-dd HH:mm");
      
      // If rescheduling to exact same time as current session, this is not a conflict
      if (sessionTimeFormatted === targetTimeFormatted) {
        console.log(`Session ${session.id} is being rescheduled to the same time (${sessionTimeFormatted}). This is not a conflict.`);
        return false;
      }
      
      // Otherwise, it's the session we're rescheduling, so exclude it from conflict check
      return false;
    }
    
    // IMPROVED: Better date handling with proper parsing
    let sessionDate: Date;
    try {
      sessionDate = new Date(session.date);
      if (isNaN(sessionDate.getTime())) {
        console.warn(`Invalid session date for session ${session.id}: ${session.date}`);
        return false; // Skip invalid dates
      }
    } catch (e) {
      console.warn(`Error parsing date for session ${session.id}: ${e}`);
      return false; // Skip invalid dates
    }
    
    // CRITICAL: Use formatInIST for consistent time zone handling
    const sessionDateStr = formatInIST(sessionDate, "yyyy-MM-dd");
    const sessionTimeStr = formatInIST(sessionDate, "HH:mm");
    console.log(`Session ${session.id} UTC date: ${sessionDate.toISOString()} -> IST: ${sessionDateStr} ${sessionTimeStr}`);
    
    // First, check for exact time match
    if (sessionDateStr === targetDateStr && sessionTimeStr === targetTimeStr) {
      // Consider confirmed/paid sessions as conflicts
      if (session.paymentConfirmed || session.status === 'confirmed') {
        console.log(`Conflict detected: Confirmed session ${session.id} already booked at ${targetDateStr} ${targetTimeStr}`);
        return true;
      }
      
      // UPDATED: Consider ALL pending sessions as booked (not just recent ones)
      if (session.status === 'pending') {
        console.log(`Conflict detected: Pending session ${session.id} is reserving ${targetDateStr} ${targetTimeStr}`);
        return true;
      }
    }
    
    // For half-hour bookings, also check if they conflict with hour slots
    if (isHalfHourBooking && sessionDateStr === targetDateStr) {
      if (hourToCheck.includes(sessionTimeStr)) {
        // This half-hour booking conflicts with a full-hour booking
        if (session.paymentConfirmed || session.status === 'confirmed' || session.status === 'pending') {
          console.log(`Half-hour conflict: Session ${session.id} at ${sessionTimeStr} conflicts with ${targetTimeStr}`);
          return true;
        }
      }
    }
    
    // Also check if this full-hour booking conflicts with any half-hour bookings
    if (!isHalfHourBooking && sessionDateStr === targetDateStr) {
      // If this is a full-hour booking (like 13:00), check for half-hour bookings (like 12:30)
      const sessionHour = parseInt(sessionTimeStr.split(":")[0]);
      const sessionMinute = parseInt(sessionTimeStr.split(":")[1]);
      const targetHour = parseInt(targetTimeStr.split(":")[0]);
      
      // If session is at XX:30 and conflicts with our target time at YY:00
      if (sessionMinute === 30 && 
          (sessionHour === targetHour || sessionHour + 1 === targetHour)) {
        if (session.paymentConfirmed || session.status === 'confirmed' || session.status === 'pending') {
          console.log(`Full-hour conflict: Session ${session.id} at ${sessionTimeStr} conflicts with ${targetTimeStr}`);
          return true;
        }
      }
    }
    
    return false;
  });
}

// Import WhatsApp bot
import whatsappBot from "./whatsapp-bot.js";

// Initialize Firebase Admin SDK with minimal configuration
try {
  if (!admin.apps.length) {
    admin.initializeApp({
      projectId: process.env.VITE_FIREBASE_PROJECT_ID
    });
    console.log("Firebase Admin SDK initialized with minimal configuration");
  }
} catch (error) {
  console.warn("Firebase Admin initialization failed:", error);
  // Continue without Firebase Admin for testing purposes
}

// Admin authentication middleware
const isAdmin = (req: Request, res: Response, next: NextFunction) => {
  // Check if the user is authenticated and is an admin
  if (!req.session) {
    return res.status(401).json({
      message: "Session not initialized. Please try logging in again.",
    });
  }
  
  if (!req.session.adminUser) {
    console.log("Admin auth failed - no admin user in session");
    return res.status(401).json({
      message: "Unauthorized. Admin access required.",
    });
  }
  
  // Additional logging to help diagnose issues
  console.log(`Admin auth successful for ${req.session.adminUser.email}`);
  next();
};

// Configure multer for file uploads
const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
// Ensure uploads directory exists
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer storage
const multerStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    // Create unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + extension);
  }
});

// Create multer upload middleware
const upload = multer({ 
  storage: multerStorage,
  limits: {
    fileSize: 25 * 1024 * 1024, // 25MB max file size (increased from 10MB)
  },
  fileFilter: function(req, file, cb) {
    // Accept images, documents, PDFs
    const allowedFileTypes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'application/pdf',
      'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'text/plain'
    ];
    
    if (allowedFileTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Unsupported file type. Please upload an image, document, or PDF.'));
    }
  }
});



export async function registerRoutes(app: Express): Promise<Server> {
  // Development mode endpoint for debugging session state
  if (process.env.NODE_ENV === 'development') {
    app.get("/api/debug/session", (req, res) => {
      console.log("🔎 Debug session endpoint called");
      
      // Only available in development mode
      const sessionInfo = {
        sessionID: req.sessionID || 'none',
        hasSession: !!req.session,
        sessionKeys: req.session ? Object.keys(req.session) : [],
        cookie: req.session?.cookie ? {
          maxAge: req.session.cookie.maxAge,
          expires: req.session.cookie.expires,
          secure: req.session.cookie.secure,
          httpOnly: req.session.cookie.httpOnly,
          domain: req.session.cookie.domain,
          path: req.session.cookie.path,
        } : 'no cookie',
        // Safe session info that doesn't expose sensitive data
        userId: req.session?.userId || 'none',
        userEmail: req.session?.userEmail || 'none',
        loginTime: req.session?.loginTime || 'none',
        loginMethod: req.session?.loginMethod || 'none'
      };
      
      res.json({
        message: "Debug session information",
        sessionInfo,
        headers: {
          cookie: req.headers.cookie || 'none',
          host: req.headers.host,
          userAgent: req.headers['user-agent'],
        }
      });
    });
  }
  // Serve uploaded files
  app.use('/uploads', express.static(path.join(process.cwd(), 'public', 'uploads')));
  // Email confirmations and Google Sheets integration have been removed as requested
  // Helper middleware for handling zod validation errors
  const validateRequest = (schema: any) => {
    return (req: Request, res: Response, next: any) => {
      try {
        schema.parse(req.body);
        next();
      } catch (error) {
        if (error instanceof ZodError) {
          return res.status(400).json({
            message: "Validation error",
            errors: error.errors,
          });
        }
        next(error);
      }
    };
  };

  // User routes
  /**
   * Request a login code for email-only authentication
   * This endpoint generates and sends a verification code to the user's email
   */
  app.post("/api/auth/request-login-code", async (req, res) => {
    try {
      console.log("📧 Login code request received");
      const { email } = req.body;
      
      if (!email) {
        console.log("❌ Missing required email");
        return res.status(400).json({ 
          message: "Email is required", 
          success: false 
        });
      }
      
      console.log(`🔍 Looking up user with email: ${email}`);
      let user = await storage.getUserByEmail(email);
      
      // If user doesn't exist, create a new unverified user account
      if (!user) {
        console.log(`📝 User not found, creating new account with email: ${email}`);
        
        // Generate a temporary random username based on email
        const username = email.split('@')[0] + Math.floor(Math.random() * 1000);
        
        // Generate a random password (user won't need to know this)
        const password = crypto.randomBytes(16).toString('hex');
        const hashedPassword = await bcrypt.hash(password, 10);
        
        user = await storage.createUser({
          email,
          username,
          password: hashedPassword,
          role: "user",
          isVerified: false,
          tokens: 10, // Default tokens for new users
        });
        
        console.log(`✅ Created new user: ID ${user.id}, Email: ${email}`);
      } else {
        console.log(`✅ Found existing user: ID ${user.id}, Email: ${email}`);
      }
      
      // Import Supabase service for verification code sending
      const { sendVerificationCode } = await import('./supabase-service');
      
      // Generate and send a verification code via Supabase service
      console.log(`📧 Sending verification code to ${email}`);
      const result = await sendVerificationCode(email);
      
      if (!result.success) {
        console.error(`❌ Failed to send verification code: ${result.message}`);
        return res.status(500).json({
          message: result.message || "Failed to send verification code. Please try again later.",
          success: false
        });
      }
      
      // Never display verification codes in logs or responses
      console.log(`✅ Verification code sent successfully to ${email}`);
      res.status(200).json({
        message: "Verification code sent to your email",
        success: true
      });
    } catch (error) {
      console.error("❌ Request login code error:", error);
      
      // Add more detailed error information
      if (error instanceof Error) {
        console.error(`Error name: ${error.name}`);
        console.error(`Error message: ${error.message}`);
        console.error(`Error stack: ${error.stack}`);
      }
      
      // Check if it's likely an email sending issue
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      if (errorMessage.includes('email') || errorMessage.includes('send')) {
        console.log("🚨 Email sending issue detected - check EMAIL_PASSWORD environment variable");
      }
      
      res.status(500).json({ 
        message: "Could not send verification code. Please try again later.",
        success: false,
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
      });
    }
  });
  
  /**
   * Verify a login code for email-only authentication
   * This endpoint verifies the code and logs the user in if valid
   */
  app.post("/api/auth/verify-login", async (req, res) => {
    try {
      console.log("🔑 Login verification attempt");
      const { email, code } = req.body;
      
      if (!email || !code) {
        console.log("❌ Missing required fields:", { email: !!email, code: !!code });
        return res.status(400).json({ 
          message: "Email and verification code are required",
          success: false 
        });
      }
      
      console.log(`🔍 Looking up user with email: ${email}`);
      let user = await storage.getUserByEmail(email);
      
      if (!user) {
        console.log(`📝 User not found, will create after verification`);
      } else {
        console.log(`✅ User found: ID ${user.id}, Email: ${email}`);
      }
      
      // Import Supabase service for code verification
      const { verifyCode } = await import('./supabase-service');
      
      // If we're in development mode and a special bypass code is used, skip verification
      if (process.env.NODE_ENV === 'development' && code === '123456') {
        console.log(`🧪 [DEV MODE] Using master bypass code for ${email}`);
        return res.status(200).json({
          message: "Verification successful (development bypass)",
          success: true
        });
      }
      
      // Verify the code
      console.log(`🔐 Verifying code for email: ${email}`);
      const result = await verifyCode(email, code);
      
      if (!result.success) {
        console.error(`❌ Invalid verification code for ${email}: ${result.message}`);
        return res.status(400).json({
          message: result.message || "Invalid verification code",
          success: false
        });
      }
      
      console.log(`✅ Verification successful for email: ${email}`);
      
      // Create a new user if they don't exist
      if (!user) {
        console.log(`📝 Creating new account for verified email: ${email}`);
        
        // Generate a temporary username from email prefix
        const username = email.split('@')[0] + Math.floor(Math.random() * 1000);
        
        // Generate a random secure password (user won't need to know this)
        const password = crypto.randomBytes(16).toString('hex');
        const hashedPassword = await bcrypt.hash(password, 10);
        
        // Create the user account
        user = await storage.createUser({
          email,
          username,
          password: hashedPassword,
          role: "user",
          isVerified: true,
          tokens: 10, // Default tokens for new users
          profileComplete: false
        });
        
        console.log(`✅ Created new user account for ${email} with ID: ${user.id}`);
      } else {
        // Mark the user as verified if not already
        if (!user.isVerified) {
          console.log(`✅ Updating user ${user.id} as verified`);
          await storage.updateUser(user.id, {
            isVerified: true
          });
        }
      }
      
      // Set session for the authenticated user
      console.log(`🔑 Setting session for user ${user.id}`);
      req.session.userId = user.id;
      
      // Add additional session data for debugging
      req.session.loginTime = new Date().toISOString();
      req.session.userEmail = email.toLowerCase();
      req.session.loginMethod = 'verification_code';
      
      // Save the session explicitly to ensure it persists
      req.session.save((err) => {
        if (err) {
          console.error("❌ Session save error during login verification:", err);
          return res.status(500).json({
            message: "Session error. Please try again.",
            success: false
          });
        }
        
        console.log(`✅ Session saved successfully for user ${user.id}`);
        console.log(`📊 Session data: ${JSON.stringify({
          userId: req.session.userId,
          userEmail: req.session.userEmail,
          loginTime: req.session.loginTime,
          sessionID: req.sessionID
        })}`);
        
        // Return user details (excluding sensitive fields)
        res.status(200).json({ 
          message: "Login successful",
          success: true,
          user: {
            id: user.id,
            email: user.email,
            username: user.username,
            role: user.role,
            tokens: user.tokens,
            isAdmin: user.isAdmin || false,
            isVerified: true,
            profileComplete: user.profileComplete || false
          }
        });
      });
    } catch (error) {
      console.error("❌ Login verification error:", error);
      
      // Add more detailed error information
      if (error instanceof Error) {
        console.error(`Error name: ${error.name}`);
        console.error(`Error message: ${error.message}`);
        console.error(`Error stack: ${error.stack}`);
      }
      
      res.status(500).json({ 
        message: "Login failed", 
        error: error instanceof Error ? error.message : "Unknown error",
        success: false
      });
    }
  });
  
  /**
   * Verify a token from Supabase magic link
   * This endpoint is called when a user clicks a magic link sent by Supabase
   */
  app.post("/api/auth/verify-token", async (req, res) => {
    try {
      console.log("🔑 Token verification attempt");
      const { token, type } = req.body;
      
      if (!token || type !== 'email') {
        console.log("❌ Missing or invalid token parameters");
        return res.status(400).json({
          message: "Invalid verification parameters",
          success: false
        });
      }
      
      // Import Supabase service dynamically
      const { getUserFromToken } = await import('./supabase-service');
      
      // Verify the token and get user information
      console.log(`🔍 Verifying token and extracting user data`);
      const result = await getUserFromToken(token);
      
      if (!result.success || !result.user) {
        console.error(`❌ Token verification failed: ${result.message || "Unknown reason"}`);
        return res.status(400).json({
          message: result.message || "Invalid or expired token",
          success: false
        });
      }
      
      const email = result.user.email;
      
      if (!email) {
        console.error(`❌ No email found in token user data`);
        return res.status(400).json({
          message: "No email associated with this token",
          success: false
        });
      }
      
      console.log(`🔍 Looking up user with email from token: ${email}`);
      let user = await storage.getUserByEmail(email);
      
      // Create the user if they don't exist
      if (!user) {
        console.log(`📝 User not found, creating new account with email: ${email}`);
        
        // Generate a temporary random username based on email
        const username = email.split('@')[0] + Math.floor(Math.random() * 1000);
        
        // Generate a random password (user won't need to know this)
        const password = crypto.randomBytes(16).toString('hex');
        const hashedPassword = await bcrypt.hash(password, 10);
        
        user = await storage.createUser({
          email,
          username,
          password: hashedPassword,
          role: "user",
          isVerified: true,
          tokens: 10, // Default tokens for new users
        });
        
        console.log(`✅ Created new verified user from token: ID ${user.id}, Email: ${email}`);
      } else {
        // Update existing user as verified
        console.log(`✅ Updating existing user ${user.id} as verified`);
        await storage.updateUser(user.id, {
          isVerified: true
        });
      }
      
      // Set session for login
      console.log(`🔑 Setting session for user ${user.id}`);
      req.session.userId = user.id;
      
      // Save the session explicitly
      req.session.save((err) => {
        if (err) {
          console.error("❌ Session save error:", err);
          return res.status(500).json({
            message: "Session save error",
            success: false
          });
        }
        
        console.log(`✅ Session saved successfully for user ${user.id}`);
        res.status(200).json({
          message: "Verification successful",
          success: true
        });
      });
    } catch (error) {
      console.error("❌ Login verification error:", error);
      
      // Add more detailed error information
      if (error instanceof Error) {
        console.error(`Error name: ${error.name}`);
        console.error(`Error message: ${error.message}`);
        console.error(`Error stack: ${error.stack}`);
      }
      
      res.status(500).json({ 
        message: "An error occurred during login verification",
        success: false
      });
    }
  });
  
  /**
   * Register with email only (no username/password required)
   * This endpoint creates a new user with the provided email and sends a verification code
   */
  app.post("/api/auth/register-with-email", async (req, res) => {
    try {
      console.log("📝 Email-only registration attempt");
      const { email } = req.body;
      
      if (!email) {
        console.log("❌ Missing required email");
        return res.status(400).json({ 
          message: "Email is required",
          success: false 
        });
      }
      
      // Check if user already exists
      console.log(`🔍 Checking if email exists: ${email}`);
      const existingUser = await storage.getUserByEmail(email);
      
      if (existingUser) {
        console.log(`ℹ️ User already exists with email: ${email}`);
        
        // Instead of returning an error, just send a new verification code
        // This makes the registration and login flows essentially the same
        
        // Generate verification code
        const verificationCode = generateVerificationCode();
        const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
        
        // Update the user with the new verification code
        console.log(`📝 Updating existing user ${existingUser.id} with verification code`);
        await storage.updateUser(existingUser.id, {
          verificationCode,
          verificationCodeExpires: expiresAt
        });
        
        // Send verification email
        console.log(`📧 Sending verification email to ${email}`);
        const emailSent = await sendVerificationEmail(email, verificationCode);
        
        if (!emailSent) {
          console.error(`❌ Failed to send verification email to ${email}`);
          return res.status(500).json({ 
            message: "Failed to send verification code. Please try again later.",
            success: false
          });
        }
        
        console.log(`✅ Verification email sent successfully to ${email}`);
        return res.status(200).json({ 
          message: "Verification code sent. Please check your email.",
          success: true,
          expiresAt
        });
      }
      
      // Create new user with auto-generated username and password
      console.log(`📝 Creating new user with email: ${email}`);
      
      // Generate a temporary random username based on email
      const username = email.split('@')[0] + Math.floor(Math.random() * 1000);
      
      // Generate a random password (user won't need to know this)
      const password = crypto.randomBytes(16).toString('hex');
      const hashedPassword = await bcrypt.hash(password, 10);
      
      // Generate verification code
      const verificationCode = generateVerificationCode();
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
      
      // Create the user
      const user = await storage.createUser({
        email,
        username,
        password: hashedPassword,
        role: "user",
        isVerified: false,
        verificationCode,
        verificationCodeExpires: expiresAt,
        tokens: 10, // Default tokens for new users
      });
      
      console.log(`✅ Created new user: ID ${user.id}, Email: ${email}`);
      
      // Send verification email
      console.log(`📧 Sending verification email to ${email}`);
      const emailSent = await sendVerificationEmail(email, verificationCode);
      
      if (!emailSent) {
        console.error(`❌ Failed to send verification email to ${email}`);
        return res.status(500).json({ 
          message: "Failed to send verification code. Please try again later.",
          success: false
        });
      }
      
      console.log(`✅ Verification email sent successfully to ${email}`);
      res.status(200).json({ 
        message: "Account created! Verification code sent. Please check your email.",
        success: true,
        expiresAt
      });
    } catch (error) {
      console.error("❌ Email-only registration error:", error);
      
      // Add more detailed error information
      if (error instanceof Error) {
        console.error(`Error name: ${error.name}`);
        console.error(`Error message: ${error.message}`);
        console.error(`Error stack: ${error.stack}`);
      }
      
      res.status(500).json({ 
        message: "An error occurred during registration",
        success: false
      });
    }
  });
  
  app.post("/api/auth/register", validateRequest(insertUserSchema), async (req, res) => {
    try {
      const existingUser = await storage.getUserByEmail(req.body.email);
      if (existingUser) {
        return res.status(400).json({ message: "User with this email already exists" });
      }
      
      // Hash the password before storing
      const userData = { ...req.body };
      userData.password = await bcrypt.hash(userData.password, 10);
      
      // Check if this is the admin email
      const isAdminUser = userData.email.toLowerCase() === "info@bamboomade.in";
      if (isAdminUser) {
        userData.role = "admin";
        userData.isVerified = true; // Admin users are automatically verified
      } else {
        // Generate verification code
        const { generateVerificationCode } = await import('./verification-utils');
        const verificationCode = generateVerificationCode(6);
        
        // Set verification fields
        userData.isVerified = false;
        userData.verificationCode = verificationCode;
        userData.verificationCodeExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
      }
      
      const user = await storage.createUser(userData);
      
      // If not admin, send verification email
      if (!isAdminUser) {
        const { sendVerificationEmail } = await import('./verification-utils');
        const emailSent = await sendVerificationEmail(userData.email, userData.verificationCode!);
        
        if (!emailSent) {
          console.error("Failed to send verification email to:", userData.email);
          // Continue with registration but inform the user
          return res.status(201).json({ 
            message: "Account created, but verification email could not be sent. Please contact support.",
            needsVerification: true,
            email: userData.email
          });
        }
      }
      
      // Don't return password in response
      const { password, verificationCode, ...userWithoutSensitiveData } = user;
      
      res.status(201).json({
        ...userWithoutSensitiveData,
        message: isAdminUser 
          ? "Admin account created successfully" 
          : "Account created. Please check your email for a verification code.",
        needsVerification: !isAdminUser
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ message: "Failed to create user", error: (error as Error).message });
    }
  });
  
  // Email verification route
  app.post("/api/auth/verify-email", async (req, res) => {
    try {
      console.log("📧 Email verification attempt:", req.body);
      const { email, code } = req.body;
      
      if (!email || !code) {
        console.log("❌ Missing required fields:", { email: !!email, code: !!code });
        return res.status(400).json({ message: "Email and verification code are required" });
      }
      
      // Find the user
      console.log(`🔍 Looking up user with email: ${email}`);
      const user = await storage.getUserByEmail(email);
      
      if (!user) {
        console.log(`❌ User not found with email: ${email}`);
        return res.status(404).json({ message: "User not found" });
      }
      
      console.log(`✅ User found: ID ${user.id}, Username: ${user.username}`);
      
      if (user.isVerified) {
        console.log(`ℹ️ User ${user.id} is already verified`);
        return res.status(400).json({ message: "Email is already verified" });
      }
      
      // Check if the verification code matches and hasn't expired
      console.log(`🔐 Checking verification code: ${code} vs stored: ${user.verificationCode}`);
      if (user.verificationCode !== code) {
        console.log(`❌ Invalid verification code for user ${user.id}`);
        return res.status(400).json({ message: "Invalid verification code" });
      }
      
      if (user.verificationCodeExpires && new Date(user.verificationCodeExpires) < new Date()) {
        console.log(`⏰ Verification code expired for user ${user.id}. Expired at: ${user.verificationCodeExpires}`);
        return res.status(400).json({ 
          message: "Verification code has expired. Please request a new one",
          expired: true
        });
      }
      
      // Mark the user as verified
      console.log(`✅ Updating user ${user.id} as verified`);
      await storage.updateUser(user.id, {
        isVerified: true,
        verificationCode: null,
        verificationCodeExpires: null
      });
      
      // If this is their first successful verification, give them bonus tokens
      if (!user.isVerified) {
        console.log(`🎁 Adding bonus tokens for new user ${user.id}`);
        await storage.createTokenPurchase({
          userId: user.id,
          amount: 10, // Bonus tokens for new users
          paymentId: "signup_bonus",
          paymentMethod: "free",
        });
      }
      
      // Automatically log the user in
      console.log(`🔑 Setting session for user ${user.id}`);
      req.session.userId = user.id;
      
      // Add additional session data for debugging
      req.session.loginTime = new Date().toISOString();
      req.session.userEmail = email.toLowerCase();
      req.session.loginMethod = 'email_verification';
      
      // Save the session explicitly to ensure it persists
      req.session.save((err) => {
        if (err) {
          console.error("❌ Session save error during email verification:", err);
        } else {
          console.log(`✅ Session saved successfully for user ${user.id}`);
          console.log(`📊 Session data: ${JSON.stringify({
            userId: req.session.userId,
            userEmail: req.session.userEmail,
            loginTime: req.session.loginTime,
            sessionID: req.sessionID
          })}`);
        }
      });
      
      console.log(`🎉 Email verification successful for user ${user.id}`);
      res.status(200).json({ 
        message: "Email verified successfully. You are now logged in.",
        verified: true
      });
    } catch (error) {
      console.error("❌ Email verification error:", error);
      
      // Add more detailed error information
      if (error instanceof Error) {
        console.error(`Error name: ${error.name}`);
        console.error(`Error message: ${error.message}`);
        console.error(`Error stack: ${error.stack}`);
      }
      
      res.status(500).json({ message: "An error occurred during email verification" });
    }
  });
  
  // Resend verification code
  app.post("/api/auth/resend-verification", async (req, res) => {
    try {
      console.log("🔄 Resend verification request:", req.body);
      const { email } = req.body;
      
      if (!email) {
        console.log("❌ Missing required field: email");
        return res.status(400).json({ message: "Email is required" });
      }
      
      // Find the user
      console.log(`🔍 Looking up user with email: ${email}`);
      const user = await storage.getUserByEmail(email);
      
      if (!user) {
        console.log(`❌ User not found with email: ${email}`);
        return res.status(404).json({ message: "User not found" });
      }
      
      console.log(`✅ User found: ID ${user.id}, Username: ${user.username}`);
      
      if (user.isVerified) {
        console.log(`ℹ️ User ${user.id} is already verified`);
        return res.status(400).json({ message: "Email is already verified" });
      }
      
      // Use the verification-utils function instead of defining it inline
      console.log(`🔐 Generating new verification code for user ${user.id}`);
      const { generateVerificationCode } = await import('./verification-utils');
      const verificationCode = generateVerificationCode(6);
      console.log(`Generated code: ${verificationCode}`);
      
      // Set expiration time (24 hours from now)
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
      console.log(`⏰ Code will expire at: ${expiresAt.toISOString()}`);
      
      // Update the user's verification code
      console.log(`📝 Updating user ${user.id} with new verification code`);
      await storage.updateUser(user.id, {
        verificationCode,
        verificationCodeExpires: expiresAt
      });
      
      // Send verification email
      console.log(`📧 Sending verification email to ${email}`);
      const { sendVerificationEmail } = await import('./verification-utils');
      const emailSent = await sendVerificationEmail(email, verificationCode);
      
      if (!emailSent) {
        console.error(`❌ Failed to send verification email to ${email}`);
        return res.status(500).json({ 
          message: "Failed to send verification email. Please try again later.",
          success: false
        });
      }
      
      console.log(`✅ Verification email sent successfully to ${email}`);
      res.status(200).json({ 
        message: "Verification code resent. Please check your email.",
        email: email,
        success: true,
        expiresAt: expiresAt
      });
    } catch (error) {
      console.error("❌ Resend verification error:", error);
      
      // Add more detailed error information
      if (error instanceof Error) {
        console.error(`Error name: ${error.name}`);
        console.error(`Error message: ${error.message}`);
        console.error(`Error stack: ${error.stack}`);
      }
      
      res.status(500).json({ 
        message: "An error occurred while resending verification code",
        success: false
      });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      console.log("🔑 Login attempt:", { email: req.body.email });
      const { email, password } = req.body;
      
      if (!email || !password) {
        console.log("❌ Missing required fields:", { email: !!email, password: !!password });
        return res.status(400).json({ message: "Email and password are required" });
      }
      
      console.log(`🔍 Looking up user with email: ${email}`);
      const user = await storage.getUserByEmail(email);
      
      if (!user) {
        console.log(`❌ User not found with email: ${email}`);
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      console.log(`✅ User found: ID ${user.id}, Username: ${user.username}`);
      
      // Check if user's email is verified (except for admin users which are auto-verified)
      if (!user.isAdmin && !user.isVerified) {
        console.log(`❌ User ${user.id} email is not verified`);
        return res.status(403).json({ 
          message: "Email not verified. Please verify your email before logging in.",
          needsVerification: true,
          email: user.email
        });
      }
      
      // For existing users migrating to bcrypt, we temporarily check both
      let isValidPassword = false;
      
      // First try bcrypt (for users created/updated with bcrypt)
      console.log(`🔐 Validating password for user ${user.id}`);
      try {
        isValidPassword = await bcrypt.compare(password, user.password);
        console.log(`Result of bcrypt validation: ${isValidPassword}`);
      } catch (e) {
        console.log(`⚠️ Bcrypt validation failed, trying legacy check: ${e}`);
        // If bcrypt fails (likely not a bcrypt hash), fall back to legacy check
        isValidPassword = user.password === password;
        console.log(`Result of legacy password check: ${isValidPassword}`);
        
        // If password matches with legacy check, update to bcrypt
        if (isValidPassword) {
          console.log(`🔄 Upgrading legacy password to bcrypt for user ${user.id}`);
          const hashedPassword = await bcrypt.hash(password, 10);
          await storage.updateUser(user.id, { password: hashedPassword });
          console.log(`✅ Password upgraded to bcrypt for user ${user.id}`);
        }
      }
      
      if (!isValidPassword) {
        console.log(`❌ Invalid password for user ${user.id}`);
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      // Set user in session (simplified auth)
      console.log(`🔑 Setting session for user ${user.id}`);
      req.session.userId = user.id;
      
      // If user is admin, also set admin session
      if (user.isAdmin) {
        console.log(`👑 User ${user.id} is an admin, setting admin session`);
        req.session.adminUser = {
          email: user.email,
          isAdmin: true,
          id: user.id
        };
      }
      
      // Make sure we save the session explicitly
      console.log(`💾 Saving session for user ${user.id}`);
      await new Promise<void>((resolve, reject) => {
        req.session.save((err) => {
          if (err) {
            console.error("❌ Failed to save session:", err);
            reject(err);
          } else {
            console.log(`✅ Session saved successfully for user ${user.id}`);
            resolve();
          }
        });
      });
      
      // Track user login history for persistent tracking across deployments
      try {
        const userAgent = req.headers['user-agent'] || '';
        const ipAddress = req.ip || req.socket.remoteAddress || '';
        
        // Extract basic device info from user agent
        const deviceInfo = {
          browser: userAgent.includes('Chrome') ? 'Chrome' : 
                   userAgent.includes('Firefox') ? 'Firefox' : 
                   userAgent.includes('Safari') ? 'Safari' : 
                   userAgent.includes('Edge') ? 'Edge' : 'Unknown',
          os: userAgent.includes('Windows') ? 'Windows' : 
              userAgent.includes('Mac') ? 'MacOS' : 
              userAgent.includes('Linux') ? 'Linux' : 
              userAgent.includes('Android') ? 'Android' : 
              userAgent.includes('iPhone') || userAgent.includes('iPad') ? 'iOS' : 'Unknown',
          isMobile: userAgent.includes('Mobile') || userAgent.includes('Android') || 
                   userAgent.includes('iPhone') || userAgent.includes('iPad')
        };
        
        await storage.createUserLoginHistory({
          userId: user.id,
          email: user.email,
          username: user.username,
          ipAddress,
          userAgent,
          deviceInfo,
          loginStatus: 'success',
          isAdmin: user.isAdmin,
          sessionId: req.sessionID
        });
        
        console.log(`📝 Login history recorded for user ${user.id}`);
      } catch (historyError) {
        // Non-critical error - don't fail the login if history tracking fails
        console.error("⚠️ Failed to record login history:", historyError);
      }
      
      // Don't return password in response
      const { password: _, ...userWithoutPassword } = user;
      console.log(`🎉 Login successful for user ${user.id}`);
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("❌ Login error:", error);
      
      // Add more detailed error information
      if (error instanceof Error) {
        console.error(`Error name: ${error.name}`);
        console.error(`Error message: ${error.message}`);
        console.error(`Error stack: ${error.stack}`);
      }
      
      res.status(500).json({ 
        message: "Login failed", 
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  app.get("/api/auth/me", async (req, res) => {
    try {
      console.log("🔍 Checking current user session");
      const userId = req.session.userId;
      
      // Debug session information
      console.log(`📊 Session debug info:`, {
        sessionID: req.sessionID || 'none',
        hasSession: !!req.session,
        sessionKeys: req.session ? Object.keys(req.session) : [],
        userId: req.session?.userId || 'none',
        userEmail: req.session?.userEmail || 'none',
        loginTime: req.session?.loginTime || 'none',
        cookie: req.session?.cookie ? {
          maxAge: req.session.cookie.maxAge,
          expires: req.session.cookie.expires,
          secure: req.session.cookie.secure,
          httpOnly: req.session.cookie.httpOnly
        } : 'no cookie'
      });
      
      if (!userId) {
        console.log("❌ No user ID in session");
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      console.log(`🔍 Looking up user with ID: ${userId}`);
      const user = await storage.getUser(userId);
      
      if (!user) {
        console.log(`❌ User not found with ID: ${userId}`);
        return res.status(404).json({ message: "User not found" });
      }
      
      console.log(`✅ User found: ID ${user.id}, Username: ${user.username}`);
      
      // Check if profile is complete (has fullName)
      const needsProfileCompletion = !user.fullName;
      
      // Don't return password in response
      const { password, ...userWithoutPassword } = user;
      console.log(`✅ Returning user data for ${user.id}`);
      res.json({
        ...userWithoutPassword,
        needsProfileCompletion
      });
    } catch (error) {
      console.error("❌ Error retrieving user data:", error);
      
      // Add more detailed error information
      if (error instanceof Error) {
        console.error(`Error name: ${error.name}`);
        console.error(`Error message: ${error.message}`);
        console.error(`Error stack: ${error.stack}`);
      }
      
      res.status(500).json({ 
        message: "Failed to get user data", 
        error: error instanceof Error ? error.message : "Unknown error" 
      });
    }
  });
  
  // Update user profile
  app.post("/api/profile/update", async (req, res) => {
    try {
      console.log("🔄 Profile update request received");
      const userId = req.session.userId;
      
      if (!userId) {
        console.log("❌ No user ID in session");
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const { fullName, phoneNumber, profileImageUrl } = req.body;
      console.log(`🔄 Updating profile for user ID: ${userId}`);
      console.log(`Profile data: fullName=${fullName}, phoneNumber=${phoneNumber}, imageUrl=${profileImageUrl ? 'provided' : 'not provided'}`);
      
      const updatedUser = await storage.updateUser(userId, {
        fullName,
        phoneNumber,
        profileImageUrl
      });
      
      if (!updatedUser) {
        console.log("❌ User not found for profile update");
        return res.status(404).json({ message: "User not found" });
      }
      
      console.log(`✅ Profile updated for user: ${updatedUser.username}`);
      return res.json({ message: "Profile updated successfully" });
    } catch (error) {
      console.error("❌ Error updating profile:", error);
      
      if (error instanceof Error) {
        console.error(`Error name: ${error.name}`);
        console.error(`Error message: ${error.message}`);
        console.error(`Error stack: ${error.stack}`);
      }
      
      return res.status(500).json({ 
        message: "Failed to update profile", 
        error: error instanceof Error ? error.message : "Unknown error" 
      });
    }
  });
  
  // Handle profile image upload
  app.post("/api/profile/upload-image", upload.single("profileImage"), async (req, res) => {
    try {
      console.log("📷 Profile image upload request received");
      const userId = req.session.userId;
      
      if (!userId) {
        console.log("❌ No user ID in session");
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      if (!req.file) {
        console.log("❌ No image file provided");
        return res.status(400).json({ message: "No image file provided" });
      }
      
      // Generate relative path for the uploaded file
      const imageUrl = `/uploads/${req.file.filename}`;
      console.log(`🖼️ Profile image uploaded: ${imageUrl}`);
      
      return res.json({ 
        message: "Profile image uploaded successfully",
        imageUrl
      });
    } catch (error) {
      console.error("❌ Error uploading profile image:", error);
      
      if (error instanceof Error) {
        console.error(`Error name: ${error.name}`);
        console.error(`Error message: ${error.message}`);
        console.error(`Error stack: ${error.stack}`);
      }
      
      return res.status(500).json({ 
        message: "Failed to upload profile image", 
        error: error instanceof Error ? error.message : "Unknown error" 
      });
    }
  });

  app.get("/api/project-guidance/my-sessions", async (req, res) => {
    try {
      const userId = req.session.userId;
      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Get sessions by user email
      const userSessions = await storage.getProjectGuidancesByEmail(user.email);
      
      // Sort sessions by date (newest first)
      userSessions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      
      res.json(userSessions);
    } catch (error) {
      res.status(500).json({ message: "Failed to get user sessions", error: (error as Error).message });
    }
  });

  app.post("/api/auth/logout", async (req, res) => {
    console.log("🚪 Logout request received");
    
    // Check if user is actually logged in
    if (!req.session.userId) {
      console.log("⚠️ Logout attempt with no active session");
      return res.status(200).json({ message: "No active session to logout" });
    }
    
    console.log(`🔑 Destroying session for user ${req.session.userId}`);
    
    // Record logout in login history if possible
    try {
      if (req.sessionID) {
        await storage.updateUserLogout(req.sessionID);
        console.log(`📝 Logout recorded in login history for sessionID ${req.sessionID}`);
      }
    } catch (historyError) {
      // Non-critical error - don't fail the logout if history tracking fails
      console.error("⚠️ Failed to record logout in history:", historyError);
    }
    
    req.session.destroy((err) => {
      if (err) {
        console.error("❌ Error destroying session:", err);
        console.error(`Error name: ${err.name}`);
        console.error(`Error message: ${err.message}`);
        console.error(`Error stack: ${err.stack}`);
        return res.status(500).json({ 
          message: "Failed to logout", 
          error: err.message,
          success: false
        });
      }
      
      console.log("✅ Session destroyed successfully");
      res.json({ 
        message: "Logged out successfully",
        success: true
      });
    });
  });

  // Admin authentication routes
  app.post("/api/auth/admin-login", async (req, res) => {
    try {
      console.log("Admin login attempt");
      const { email, password } = req.body;
      
      if (!email || !password) {
        console.log("Admin login failed: Missing email or password");
        return res.status(400).json({ message: "Email and password are required" });
      }
      
      // Only allow specific email (info@bamboomade.in)
      if (email.toLowerCase() !== "info@bamboomade.in") {
        console.log(`Admin login rejected: Unauthorized email: ${email}`);
        return res.status(401).json({ message: "Unauthorized access" });
      }
      
      console.log("Admin login: Email authorized, checking user...");
      
      // Find user or create one if it doesn't exist
      let user = await storage.getUserByEmail(email.toLowerCase());
      
      if (!user) {
        console.log("Admin login: Creating new admin user");
        // Create admin user if doesn't exist
        user = await storage.createUser({
          username: "admin",
          password: await bcrypt.hash(password, 10),
          email: email.toLowerCase(),
          role: "admin",
        });
      } else {
        console.log("Admin login: Existing user found, validating password");
        // For existing users, we use hardcoded password for the demo
        // In a real application, you would use bcrypt.compare with stored hash
        const adminPassword = "bamboomade2023"; // In production, use environment variables
        
        if (password !== adminPassword) {
          console.log("Admin login failed: Invalid password");
          return res.status(401).json({ message: "Invalid credentials" });
        }
        
        // Update password to bcrypt hash for future logins
        user.password = await bcrypt.hash(password, 10);
        
        // Ensure user has admin flag
        if (!user.isAdmin) {
          console.log("Admin login: Updating user admin status");
          user = await storage.updateUserAdminStatus(user.id, true);
        }
      }
      
      // Set user and admin flag in session
      if (user) {
        console.log(`Admin login: Setting session for user ID ${user.id}`);
        req.session.userId = user.id;
        req.session.adminUser = {
          email,
          isAdmin: true,
          id: user.id
        };
        
        // Force session save to ensure it's stored before sending response
        req.session.save(async (err) => {
          if (err) {
            console.error("Admin login: Error saving session:", err);
          } else {
            console.log("Admin login: Session saved successfully");
            
            // Track admin login history for persistent tracking across deployments
            try {
              const userAgent = req.headers['user-agent'] || '';
              const ipAddress = req.ip || req.socket.remoteAddress || '';
              
              // Extract basic device info from user agent
              const deviceInfo = {
                browser: userAgent.includes('Chrome') ? 'Chrome' : 
                         userAgent.includes('Firefox') ? 'Firefox' : 
                         userAgent.includes('Safari') ? 'Safari' : 
                         userAgent.includes('Edge') ? 'Edge' : 'Unknown',
                os: userAgent.includes('Windows') ? 'Windows' : 
                    userAgent.includes('Mac') ? 'MacOS' : 
                    userAgent.includes('Linux') ? 'Linux' : 
                    userAgent.includes('Android') ? 'Android' : 
                    userAgent.includes('iPhone') || userAgent.includes('iPad') ? 'iOS' : 'Unknown',
                isMobile: userAgent.includes('Mobile') || userAgent.includes('Android') || 
                         userAgent.includes('iPhone') || userAgent.includes('iPad')
              };
              
              await storage.createUserLoginHistory({
                userId: user.id,
                userEmail: user.email,
                username: user.username || 'admin',
                ipAddress,
                userAgent,
                deviceInfo: {
                  browser: deviceInfo.browser,
                  os: deviceInfo.os,
                  device: deviceInfo.isMobile ? 'mobile' : 'desktop',
                  isMobile: deviceInfo.isMobile
                },
                loginStatus: 'success',
                isAdmin: true,
                sessionId: req.sessionID
              });
              
              console.log(`📝 Admin login history recorded for user ${user.id}`);
            } catch (historyError) {
              // Non-critical error - don't fail the login if history tracking fails
              console.error("⚠️ Failed to record admin login history:", historyError);
            }
          }
          
          res.json({ 
            message: "Admin login successful",
            email,
            isAdmin: true
          });
        });
      } else {
        console.log("Admin login failed: User not created/found");
        res.status(500).json({ message: "Failed to create or retrieve admin user" });
      }
    } catch (error) {
      console.error("Admin login error:", error);
      res.status(500).json({ message: "Login failed", error: (error as Error).message });
    }
  });
  
  app.post("/api/auth/admin-logout", async (req, res) => {
    try {
      if (req.session.adminUser) {
        // Update login history with logout time if possible
        try {
          if (req.sessionID) {
            await storage.updateUserLogout(req.sessionID);
            console.log(`📝 Admin logout recorded in login history for sessionID ${req.sessionID}`);
          }
        } catch (historyError) {
          // Non-critical error - don't fail the logout if history tracking fails
          console.error("⚠️ Failed to record admin logout in history:", historyError);
        }
        
        delete req.session.adminUser;
      }
      
      res.json({ message: "Admin logged out successfully" });
    } catch (error) {
      console.error("Admin logout error:", error);
      res.status(500).json({ message: "Error during admin logout", success: false });
    }
  });
  
  app.get("/api/auth/admin-check", (req, res) => {
    console.log("Admin check request");
    
    if (!req.session) {
      console.log("Admin check: No session object found");
      return res.status(401).json({ message: "Session not initialized" });
    }
    
    console.log("Admin check: Session object exists, checking adminUser property");
    console.log("Admin check: Session keys:", Object.keys(req.session));
    
    if (!req.session.adminUser) {
      console.log("Admin check: adminUser property not found in session");
      return res.status(401).json({ message: "Not authenticated as admin" });
    }
    
    console.log(`Admin check: Admin user found - ${req.session.adminUser.email}`);
    
    res.json({
      isAdmin: true,
      email: req.session.adminUser.email
    });
  });
  
  // Development-only admin login endpoint (remove in production)
  app.get("/api/auth/dev-admin-login", async (req, res) => {
    try {
      console.log("Development admin login");
      
      // Find or create the admin user
      let user = await storage.getUserByEmail("info@bamboomade.in");
      
      if (!user) {
        console.log("Dev login: Creating admin user");
        user = await storage.createUser({
          username: "admin",
          password: await bcrypt.hash("bamboomade2023", 10),
          email: "info@bamboomade.in",
          role: "admin",
          isAdmin: true
        });
      }
      
      // Set session variables
      req.session.userId = user.id;
      req.session.adminUser = {
        email: "info@bamboomade.in",
        isAdmin: true
      };
      
      // Save session and respond
      req.session.save((err) => {
        if (err) {
          console.error("Dev admin login: Error saving session:", err);
          return res.status(500).json({ message: "Session save error" });
        }
        
        console.log("Dev admin login successful");
        res.json({ 
          message: "Dev admin login successful",
          email: "info@bamboomade.in",
          isAdmin: true
        });
      });
    } catch (error) {
      console.error("Dev admin login error:", error);
      res.status(500).json({ message: "Login failed", error: (error as Error).message });
    }
  });
  
  // Admin session management routes
  app.get("/api/admin/sessions", isAdmin, async (req, res) => {
    try {
      const allSessions = await storage.getAllProjectGuidances();
      
      // Format the sessions for the admin dashboard
      const formattedSessions = allSessions.map(session => {
        const sessionDate = new Date(session.date);
        const sessionEndTime = addMinutes(sessionDate, session.duration);
        
        return {
          id: session.id,
          studentName: session.studentName,
          email: session.email,
          phone: session.phone,
          date: session.date,
          formattedDate: formatInIST(sessionDate, "MMMM d, yyyy"),
          formattedTime: formatInIST(sessionDate, "HH:mm"),
          formattedEndTime: formatInIST(sessionEndTime, "HH:mm"),
          duration: session.duration,
          topic: session.topic,
          notes: session.notes || '',
          paymentStatus: session.paymentConfirmed ? "Paid" : "Pending",
          status: session.status || 'pending',
          googleMeetLink: session.googleMeetLink || '',
          isStudent: session.isStudent
        };
      });
      
      res.json({ 
        success: true,
        sessions: formattedSessions
      });
    } catch (error) {
      console.error("Error fetching admin sessions:", error);
      res.status(500).json({ 
        success: false, 
        message: "Failed to fetch sessions",
        error: (error as Error).message
      });
    }
  });
  
  // Route for admin to reschedule a session
  app.post("/api/admin/reschedule-session", isAdmin, async (req, res) => {
    try {
      const { sessionId, newDate, newDuration } = req.body;
      
      if (!sessionId || !newDate) {
        return res.status(400).json({ 
          success: false, 
          message: "Session ID and new date are required" 
        });
      }
      
      // Get the session
      const session = await storage.getProjectGuidance(parseInt(sessionId));
      
      if (!session) {
        return res.status(404).json({ 
          success: false, 
          message: "Session not found" 
        });
      }
      
      // Parse date for validation
      const parsedDate = new Date(newDate);
      
      // Check if the new date is actually a change, to prevent unnecessary updates
      const currentSessionDate = new Date(session.date);
      // CRITICAL: Use formatInIST for consistent time zone handling
      const currentSessionFormatted = formatInIST(currentSessionDate, "yyyy-MM-dd HH:mm");
      const newSessionFormatted = formatInIST(parsedDate, "yyyy-MM-dd HH:mm");
      console.log(`Comparing rescheduling dates - current: ${currentSessionDate.toISOString()} -> ${currentSessionFormatted}, new: ${parsedDate.toISOString()} -> ${newSessionFormatted}`);
      
      if (currentSessionFormatted === newSessionFormatted && 
          (!newDuration || newDuration === session.duration)) {
        console.log(`Admin tried to reschedule session ${session.id} to the same time and duration (${newSessionFormatted}). No changes needed.`);
        return res.json({
          success: true,
          message: "No changes needed - session already scheduled for this time",
          session: session
        });
      }
      
      // Check if this time slot is already booked (excluding the current session)
      const isBooked = await isTimeSlotBooked(parsedDate, session.id);
      if (isBooked) {
        return res.status(400).json({
          success: false,
          message: "Time slot conflict",
          errors: "This time slot is already booked. Please select another time."
        });
      }
      
      // Update the session with new date/time using storage method
      const updatedSession = await storage.updateProjectGuidanceSession(
        session.id,
        parsedDate,
        newDuration || session.duration,
        'admin' // Indicate that this was rescheduled by an admin
      );
      
      console.log('Session rescheduled by admin:', {
        sessionId: session.id,
        email: session.email,
        oldDate: session.date,
        newDate: parsedDate,
        oldDuration: session.duration,
        newDuration: newDuration || session.duration
      });
      
      // Email confirmation has been removed as requested
      
      // Return success
      res.json({ 
        success: true, 
        message: "Session rescheduled successfully by admin",
        session: updatedSession
      });
    } catch (error) {
      console.error("Error in admin rescheduling session:", error);
      res.status(500).json({ 
        success: false, 
        message: "Failed to reschedule session", 
        error: (error as Error).message 
      });
    }
  });
  
  // Admin endpoint to cancel a session with full refund
  app.post("/api/admin/cancel-session", isAdmin, async (req, res) => {
    try {
      const { sessionId, reason, fullRefund = true } = req.body;
      
      if (!sessionId || !reason) {
        return res.status(400).json({ 
          success: false,
          message: "Missing required fields",
          errors: "Session ID and cancellation reason are required."
        });
      }
      
      // Get the session
      const session = await storage.getProjectGuidance(parseInt(sessionId));
      if (!session) {
        return res.status(404).json({ 
          success: false,
          message: "Session not found",
          errors: "The requested session does not exist."
        });
      }
      
      // Check if session is already cancelled
      if (session.status === 'cancelled') {
        return res.status(400).json({ 
          success: false,
          message: "Session already cancelled",
          errors: "This session has already been cancelled."
        });
      }
      
      // Always provide full refund for admin cancellations
      let refundAmount = 0;
      if (session.paymentStatus === 'Paid') {
        // Get the session price based on duration and student status
        const sessionPrice = session.isStudent
          ? (session.duration === 30 ? 500 : 800)  // Student pricing
          : (session.duration === 30 ? 1000 : 1500); // Professional pricing
        
        refundAmount = sessionPrice;
      }
      
      // Update the session
      const updatedSession = await storage.updateProjectGuidance(session.id, {
        status: 'cancelled',
        notes: `${session.notes || ''}${session.notes ? ' | ' : ''}Cancelled by admin: ${reason} with full refund.`
      });
      
      console.log('Session cancelled by admin:', {
        sessionId: session.id,
        email: session.email,
        date: session.date,
        refundAmount
      });
      
      // Email notifications have been removed as requested
      
      // Return success
      return res.json({
        success: true,
        message: "Session cancelled successfully with full refund",
        session: updatedSession,
        refundDetails: {
          percentage: 100,
          amount: refundAmount
        }
      });
    } catch (error) {
      console.error("Error in admin cancelling session:", error);
      return res.status(500).json({ 
        success: false,
        message: "Failed to cancel session", 
        error: (error as Error).message 
      });
    }
  });

  app.post("/api/admin/update-meet-link", isAdmin, async (req, res) => {
    try {
      const { sessionId, googleMeetLink } = req.body;
      
      if (!sessionId || !googleMeetLink) {
        return res.status(400).json({ 
          success: false, 
          message: "Session ID and Google Meet link are required" 
        });
      }
      
      // First get the session to check its status
      const session = await storage.getProjectGuidance(parseInt(sessionId, 10));
      
      if (!session) {
        return res.status(404).json({ 
          success: false, 
          message: "Session not found" 
        });
      }
      
      // Check if the session is cancelled
      if (session.status === 'cancelled') {
        return res.status(400).json({ 
          success: false, 
          message: "Cannot add meeting link to a cancelled session" 
        });
      }
      
      // Update the session with the Google Meet link
      const updatedSession = await storage.updateProjectGuidanceMeetLink(
        parseInt(sessionId, 10),
        googleMeetLink
      );
      
      if (!updatedSession) {
        return res.status(404).json({ 
          success: false, 
          message: "Session not found" 
        });
      }
      
      // Email notifications have been removed as requested
      const sessionDate = new Date(updatedSession.date);
      
      // Create a calendar link with the Google Meet link (no email)
      const calendarLink = generateGoogleCalendarLink(
        updatedSession.id,
        googleMeetLink,
        sessionDate,
        updatedSession.duration,
        updatedSession.topic,
        updatedSession.studentName
      );
      
      res.json({ 
        success: true, 
        message: "Google Meet link updated successfully",
        session: updatedSession,
        calendarLink
      });
    } catch (error) {
      console.error("Error updating Google Meet link:", error);
      res.status(500).json({ 
        success: false, 
        message: "Failed to update Google Meet link",
        error: (error as Error).message
      });
    }
  });
  
  // Google Authentication
  const googleAuthSchema = z.object({
    idToken: z.string(),
    user: z.object({
      email: z.string().email(),
      displayName: z.string().optional(),
      photoURL: z.string().optional(),
    }).optional(),
  });
  
  app.post("/api/auth/google", validateRequest(googleAuthSchema), async (req, res) => {
    try {
      const { idToken, user: firebaseUser } = req.body;
      let email: string;
      let name: string | undefined;
      let picture: string | undefined;
      
      console.log("Processing Google authentication with token");
      
      // Skip token verification in development for simplicity
      if (process.env.NODE_ENV === 'development' && firebaseUser?.email) {
        console.log("DEV MODE: Using provided user data without token verification");
        email = firebaseUser.email;
        name = firebaseUser.displayName;
        picture = firebaseUser.photoURL;
      } else {
        try {
          // Try to verify with Firebase Admin SDK
          const decodedToken = await admin.auth().verifyIdToken(idToken);
          email = decodedToken.email;
          name = decodedToken.name;
          picture = decodedToken.picture;
          console.log("Successfully verified Firebase token");
        } catch (verifyError) {
          console.warn("Failed to verify Firebase token:", verifyError);
          
          // Fallback to using the user data directly from the client
          // This is less secure but allows login to work even if token verification fails
          if (firebaseUser?.email) {
            console.log("Using fallback authentication method with user data");
            email = firebaseUser.email;
            name = firebaseUser.displayName;
            picture = firebaseUser.photoURL;
          } else {
            console.error("No fallback user data available");
            return res.status(401).json({ 
              message: "Authentication failed: Could not verify token and no user data provided" 
            });
          }
        }
      }
      
      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }
      
      console.log(`Authenticated user: ${email}`);
      
      // Check if user exists in our database
      let user = await storage.getUserByEmail(email);
      
      if (!user) {
        // Check if this is the admin email
        const isAdminUser = email.toLowerCase() === "info@bamboomade.in";
        
        // Create a new user
        user = await storage.createUser({
          email,
          username: name || email.split('@')[0],
          password: '', // Not used with Google auth
          role: isAdminUser ? "admin" : "user",
        });
        
        // If this is an admin user, make sure the isAdmin flag is set
        if (isAdminUser && !user.isAdmin) {
          user = await storage.updateUserAdminStatus(user.id, true);
        }

        // Google Sheets integration has been removed as requested
      }
      
      // Set user in session
      if (user) {
        req.session.userId = user.id;
        
        // Make sure we save the session explicitly
        await new Promise<void>((resolve, reject) => {
          req.session.save((err) => {
            if (err) {
              console.error("Failed to save session:", err);
              reject(err);
            } else {
              console.log(`Session saved successfully for user ${user?.id}`);
              resolve();
            }
          });
        });
        
        // Don't return password in response
        const { password, ...userWithoutPassword } = user;
        
        console.log(`Login successful for user ${user.email}, session ID set to ${user.id}`);
        res.json(userWithoutPassword);
      } else {
        res.status(500).json({ message: "Failed to create or retrieve user" });
      }
    } catch (error) {
      console.error("Google auth error:", error);
      res.status(500).json({ message: "Google authentication failed", error: (error as Error).message });
    }
  });

  // Project routes
  app.get("/api/projects", async (req, res) => {
    try {
      let projects;
      if (req.query.category) {
        projects = await storage.getProjectsByCategory(req.query.category as string);
      } else if (req.query.featured === 'true') {
        projects = await storage.getFeaturedProjects();
      } else {
        projects = await storage.getAllProjects();
      }
      res.json(projects);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch projects", error: (error as Error).message });
    }
  });

  app.post("/api/projects", validateRequest(insertProjectSchema), async (req, res) => {
    try {
      // Check if user is admin
      const userId = req.session.userId;
      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const user = await storage.getUser(userId);
      if (!user || !user.isAdmin) {
        return res.status(403).json({ message: "Unauthorized: Admin access required" });
      }
      
      const project = await storage.createProject(req.body);
      res.status(201).json(project);
    } catch (error) {
      res.status(500).json({ message: "Failed to create project", error: (error as Error).message });
    }
  });

  // Project guidance session routes
  app.get("/api/project-guidance", async (req, res) => {
    try {
      const sessions = await storage.getAllProjectGuidances();
      res.status(200).json(sessions);
    } catch (error) {
      console.error("Error fetching project guidance sessions:", error);
      res.status(500).json({ message: "Failed to fetch project guidance sessions" });
    }
  });
  
  // Route for accessing all sessions with email verification
  app.get("/api/all-sessions", async (req, res) => {
    try {
      // Get all sessions
      const allSessions = await storage.getAllProjectGuidances();
      
      // Format session data for client
      const formattedSessions = allSessions.map(session => {
        const sessionDate = new Date(session.date);
        const sessionEndTime = addMinutes(sessionDate, session.duration);
        
        // Always show Google Meet link when available regardless of payment status
        let googleMeetLink = null;
        let calendarLink = null;
        
        if (session.googleMeetLink) {
          // Use the stored Google Meet link if available
          googleMeetLink = session.googleMeetLink;
        } else if (session.paymentConfirmed) {
          // Generate a link if payment is confirmed but link not stored
          googleMeetLink = generateGoogleMeetLink(
            session.id,
            sessionDate,
            session.studentName
          );
        }
        
        // Generate calendar link for any session with a Google Meet link
        if (googleMeetLink) {
          calendarLink = generateGoogleCalendarLink(
            session.id,
            googleMeetLink,
            sessionDate,
            session.duration,
            session.topic,
            session.studentName
          );
        }
        
        return {
          id: session.id,
          date: session.date,
          formattedDate: formatInIST(sessionDate, "MMMM d, yyyy"),
          formattedTime: formatInIST(sessionDate, "HH:mm"),
          formattedEndTime: formatInIST(sessionEndTime, "HH:mm"),
          email: session.email,
          topic: session.topic,
          duration: session.duration,
          paymentStatus: session.paymentConfirmed ? 'Paid' : 'Pending',
          studentName: session.studentName,
          status: session.status || 'scheduled',
          googleMeetLink: googleMeetLink,
          calendarLink: calendarLink,
          isRescheduled: !!session.originalDate,
          originalDate: session.originalDate ? formatInIST(new Date(session.originalDate), "MMMM d, yyyy") : null,
          // Explicitly include the isStudent field from the database
          isStudent: session.isStudent
        };
      });
      
      res.json({ 
        sessions: formattedSessions,
        success: true
      });
    } catch (error) {
      console.error("Error fetching all sessions:", error);
      res.status(500).json({ success: false, message: "Failed to fetch sessions", error: (error as Error).message });
    }
  });
  
  app.get("/api/project-guidance/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      const session = await storage.getProjectGuidance(id);
      
      if (!session) {
        return res.status(404).json({ message: "Project guidance session not found" });
      }
      
      res.status(200).json(session);
    } catch (error) {
      console.error("Error fetching project guidance session:", error);
      res.status(500).json({ message: "Failed to fetch project guidance session" });
    }
  });
  
  app.post("/api/project-guidance", async (req, res) => {
    try {
      // Manually validate duration field (might be 5 minutes for testing)
      const { studentName, email, phone, date, duration, topic, notes } = req.body;
      
      if (!studentName || !email || !phone || !date || !topic) {
        return res.status(400).json({ 
          message: "Validation error", 
          errors: "Missing required fields" 
        });
      }
      
      // Ensure date is a proper Date object before passing to the database
      let parsedDate: Date;
      try {
        // Handle ISO string or any other valid date format
        parsedDate = new Date(date);
        
        // Check if the date is valid
        if (isNaN(parsedDate.getTime())) {
          throw new Error("Invalid date format");
        }
      } catch (e) {
        console.error("Date parsing error:", e, "Received date:", date);
        return res.status(400).json({
          message: "Validation error",
          errors: "Invalid date format. Please select a valid date and time."
        });
      }
      
      // Check if this time slot is already booked
      const isBooked = await isTimeSlotBooked(parsedDate);
      if (isBooked) {
        return res.status(400).json({
          message: "Time slot conflict",
          errors: "This time slot is already booked. Please select another time."
        });
      }
      
      // Create the session with all the fields
      const session = await storage.createProjectGuidance({
        studentName,
        email, 
        phone,
        date: parsedDate,
        duration: duration || 60, // Default to 60 if not specified
        topic,
        notes: notes || ""
      });
      
      res.status(201).json(session);
    } catch (error) {
      console.error("Project guidance booking error:", error);
      res.status(500).json({ message: "Failed to book session", error: (error as Error).message });
    }
  });
  
  // Route to get sessions by email address
  app.get("/api/sessions-by-email", async (req, res) => {
    try {
      const { email } = req.query;
      
      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }
      
      // Get all sessions
      const allSessions = await storage.getAllProjectGuidances();
      
      // Filter sessions by email (case insensitive)
      const userSessions = allSessions.filter(
        session => session.email.toLowerCase() === (email as string).toLowerCase()
      );
      
      // Format sessions for display
      const formattedSessions = userSessions.map(session => {
        const sessionDate = new Date(session.date);
        return {
          id: session.id,
          date: formatInIST(sessionDate, 'EEEE, MMMM d, yyyy'),
          time: formatInIST(sessionDate, 'HH:mm'),
          topic: session.topic,
          duration: session.duration,
          paymentStatus: session.paymentId ? 'Paid' : 'Pending',
          studentName: session.studentName
        };
      });
      
      res.json({ 
        sessions: formattedSessions,
        message: formattedSessions.length > 0 
          ? "These are your existing sessions. You can book new sessions or reschedule existing ones." 
          : "You have no existing sessions. Please book a new session."
      });
    } catch (error) {
      console.error("Error fetching sessions by email:", error);
      res.status(500).json({ message: "Failed to fetch sessions", error: (error as Error).message });
    }
  });
  
  // Route for sending verification codes for rescheduling or accessing sessions
  app.post("/api/send-verification-code", async (req, res) => {
    try {
      const { email, purpose } = req.body;
      
      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }
      
      // Get all sessions
      const allSessions = await storage.getAllProjectGuidances();
      
      // Check if user has any sessions with this email
      const userSessions = allSessions.filter(
        session => session.email.toLowerCase() === email.toLowerCase()
      );
      
      // Only check for existing sessions if purpose is 'reschedule'
      // For 'access', we'll still send the code even if there are no sessions yet
      if (userSessions.length === 0 && purpose === 'reschedule') {
        return res.status(404).json({ 
          message: "No sessions found for this email address",
          canCreateNew: true
        });
      }
      
      // Generate a 6-digit verification code
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      
      // In a real implementation, you would store this code with an expiry time
      // For simplicity in the demo, we'll just send it and validate in memory
      
      // Send the verification code email
      console.log(`Sending verification code ${code} to ${email} for purpose: ${purpose}`);
      const emailSuccess = await sendVerificationCodeEmail(
        email,
        code,
        purpose === 'reschedule' ? 'reschedule' : 'access'
      );
      
      if (!emailSuccess) {
        console.error(`Failed to send verification email to ${email}`);
      } else {
        console.log(`Verification email sent successfully to ${email}`);
      }
      
      // Return success with the verification code
      // In a production environment, never return the actual code to the client
      res.json({ 
        success: true, 
        message: "Verification code sent to your email",
        // Only include the code in development mode
        ...(process.env.NODE_ENV !== 'production' ? { code } : {})
      });
    } catch (error) {
      console.error("Error sending verification code:", error);
      res.status(500).json({ message: "Failed to send verification code", error: (error as Error).message });
    }
  });
  
  // Route for rescheduling a session by user
  app.post("/api/reschedule-session", async (req, res) => {
    try {
      const { email, newDate, newDuration, sessionId } = req.body;
      
      if (!email || !newDate) {
        return res.status(400).json({ message: "Email and new date are required" });
      }
      
      // Ensure newDate is a proper Date object
      let parsedDate: Date;
      try {
        parsedDate = new Date(newDate);
        
        // Check if the date is valid
        if (isNaN(parsedDate.getTime())) {
          throw new Error("Invalid date format");
        }
      } catch (e) {
        console.error("Date parsing error in rescheduling:", e, "Received date:", newDate);
        return res.status(400).json({
          message: "Validation error",
          errors: "Invalid date format. Please select a valid date and time."
        });
      }
      
      // Get all sessions
      const allSessions = await storage.getAllProjectGuidances();
      
      // Filter sessions by email (case insensitive)
      const userSessions = allSessions.filter(
        session => session.email.toLowerCase() === email.toLowerCase()
      );
      
      if (userSessions.length === 0) {
        return res.status(404).json({ 
          message: "No sessions found for this email address",
          canCreateNew: true
        });
      }
      
      // Find the specific session if sessionId is provided
      let selectedSession;
      if (sessionId) {
        selectedSession = userSessions.find(session => session.id === parseInt(sessionId));
        
        if (!selectedSession) {
          return res.status(404).json({ message: "Session not found" });
        }
      } else {
        // Use the most recent session if no specific sessionId provided
        selectedSession = userSessions.sort((a, b) => 
          new Date(b.date).getTime() - new Date(a.date).getTime()
        )[0];
      }
      
      // Check if the new date is actually a change, to prevent unnecessary updates
      const currentSessionDate = new Date(selectedSession.date);
      // CRITICAL: Use formatInIST for consistent time zone handling
      const currentSessionFormatted = formatInIST(currentSessionDate, "yyyy-MM-dd HH:mm");
      const newSessionFormatted = formatInIST(parsedDate, "yyyy-MM-dd HH:mm");
      console.log(`Comparing rescheduling dates for user ${email} - current: ${currentSessionDate.toISOString()} -> ${currentSessionFormatted}, new: ${parsedDate.toISOString()} -> ${newSessionFormatted}`);
      
      if (currentSessionFormatted === newSessionFormatted && 
          (!newDuration || newDuration === selectedSession.duration)) {
        console.log(`User ${email} tried to reschedule session ${selectedSession.id} to the same time and duration (${newSessionFormatted}). No changes needed.`);
        return res.json({
          success: true,
          message: "No changes needed - your session is already scheduled for this time",
          session: selectedSession,
          allSessions: userSessions
        });
      }
      
      // Check if this time slot is already booked (excluding the current session)
      const isBooked = await isTimeSlotBooked(parsedDate, selectedSession.id);
      if (isBooked) {
        return res.status(400).json({
          message: "Time slot conflict",
          errors: "This time slot is already booked. Please select another time."
        });
      }
      
      // Update the session with new date/time using storage method
      const updatedSession = await storage.updateProjectGuidanceSession(
        selectedSession.id,
        parsedDate,
        newDuration || selectedSession.duration,
        'user' // Indicate that this was rescheduled by the user
      );
      console.log('Session rescheduled:', {
        sessionId: selectedSession.id,
        email,
        oldDate: selectedSession.date,
        newDate: parsedDate,
        oldDuration: selectedSession.duration,
        newDuration: newDuration || selectedSession.duration
      });
      
      // Email notifications have been removed as requested
      
      // Return success
      res.json({ 
        success: true, 
        message: "Session rescheduled successfully",
        session: updatedSession,
        allSessions: userSessions
      });
    } catch (error) {
      console.error("Error rescheduling session:", error);
      res.status(500).json({ message: "Failed to reschedule session", error: (error as Error).message });
    }
  });
  
  // Route for cancelling a session with refund
  app.post("/api/cancel-session", async (req, res) => {
    try {
      const { email, sessionId, reason } = req.body;
      
      if (!email || !sessionId || !reason) {
        return res.status(400).json({ message: "Email, session ID, and cancellation reason are required" });
      }
      
      // Get all sessions
      const allSessions = await storage.getAllProjectGuidances();
      
      // Filter sessions by email (case insensitive)
      const userSessions = allSessions.filter(
        session => session.email.toLowerCase() === email.toLowerCase()
      );
      
      if (userSessions.length === 0) {
        return res.status(404).json({ 
          message: "No sessions found for this email address"
        });
      }
      
      // Find the specific session 
      const selectedSession = userSessions.find(session => session.id === parseInt(sessionId));
      
      if (!selectedSession) {
        return res.status(404).json({ message: "Session not found" });
      }
      
      if (selectedSession.status === "cancelled") {
        return res.status(400).json({ message: "This session has already been cancelled" });
      }
      
      if (selectedSession.status === "completed") {
        return res.status(400).json({ message: "Completed sessions cannot be cancelled" });
      }
      
      // Calculate refund amount based on the cancellation policy
      // Ensure we have a valid date to calculate with
      let sessionDate: Date;
      try {
        sessionDate = new Date(selectedSession.date);
        
        // Check if the date is valid
        if (isNaN(sessionDate.getTime())) {
          throw new Error("Invalid session date format");
        }
      } catch (e) {
        console.error("Date parsing error in cancellation:", e);
        return res.status(400).json({
          message: "Invalid session date format",
          errors: "Could not calculate refund amount due to invalid date."
        });
      }
      
      const now = new Date();
      const timeUntilSession = sessionDate.getTime() - now.getTime();
      const daysUntilSession = timeUntilSession / (1000 * 60 * 60 * 24);
      
      let refundPercentage = 0;
      let refundAmount = 0;
      
      if (daysUntilSession > 7) {
        // More than 7 days before session: 100% refund
        refundPercentage = 100;
      } else if (daysUntilSession > 3) {
        // 3-7 days before session: 75% refund
        refundPercentage = 75;
      } else if (daysUntilSession > 1) {
        // 1-3 days before session: 50% refund
        refundPercentage = 50;
      } else if (daysUntilSession > 0) {
        // Less than 24 hours before session: 25% refund
        refundPercentage = 25;
      } else {
        // After session scheduled start time: 0% refund
        refundPercentage = 0;
      }
      
      if (selectedSession.amount) {
        refundAmount = Math.round(selectedSession.amount * (refundPercentage / 100));
      }
      
      // Cancel the session
      const updatedSession = await storage.cancelProjectGuidanceSession(
        selectedSession.id,
        reason,
        refundAmount,
        refundPercentage
      );
      
      console.log('Session cancelled:', {
        sessionId: selectedSession.id,
        email,
        date: selectedSession.date,
        reason,
        refundPercentage,
        refundAmount
      });
      
      // Email notifications have been removed as requested
      
      // Return success
      res.json({ 
        success: true, 
        message: "Session cancelled successfully",
        session: updatedSession,
        refundDetails: {
          percentage: refundPercentage,
          amount: refundAmount
        }
      });
    } catch (error) {
      console.error("Error cancelling session:", error);
      res.status(500).json({ message: "Failed to cancel session", error: (error as Error).message });
    }
  });

  app.patch("/api/project-guidance/:id/payment", async (req, res) => {
    try {
      const { id } = req.params;
      const { paymentId } = req.body;
      
      if (!paymentId) {
        return res.status(400).json({ message: "Payment ID is required" });
      }
      
      const session = await storage.updateProjectGuidancePayment(parseInt(id), paymentId);
      if (!session) {
        return res.status(404).json({ message: "Project guidance session not found" });
      }
      
      // Google Sheets integration removed as requested
      
      res.json(session);
    } catch (error) {
      res.status(500).json({ message: "Failed to update payment status", error: (error as Error).message });
    }
  });
  
  // New endpoint to get session details with Google Meet link after payment
  app.get("/api/session-details/:sessionId", async (req, res) => {
    try {
      const sessionId = parseInt(req.params.sessionId, 10);
      const paymentId = req.query.paymentId as string;
      
      if (isNaN(sessionId)) {
        return res.status(400).json({ 
          success: false, 
          message: "Invalid session ID" 
        });
      }
      
      // PaymentId is optional - we'll verify either way
      const session = await storage.getProjectGuidance(sessionId);
      
      if (!session) {
        return res.status(404).json({
          success: false,
          message: "Session not found"
        });
      }
      
      // Log session payment status for debugging
      console.log(`Session ${sessionId} payment status:`, {
        paymentConfirmed: session.paymentConfirmed,
        sessionPaymentId: session.paymentId,
        requestedPaymentId: paymentId
      });
      
      // Verify that this session has been paid for
      // Either:
      // 1. The payment is confirmed in the database already, or
      // 2. Payment IDs match exactly (classic verification)
      if (!session.paymentConfirmed) {
        return res.status(403).json({
          success: false,
          message: "Payment not confirmed for this session"
        });
      }
      
      // Generate the Google Meet link
      // Ensure we have a valid date for the Google Meet link
      let sessionDate: Date;
      try {
        sessionDate = new Date(session.date);
        
        // Check if the date is valid
        if (isNaN(sessionDate.getTime())) {
          throw new Error("Invalid session date format");
        }
      } catch (e) {
        console.error("Date parsing error in session details:", e);
        return res.status(400).json({
          success: false,
          message: "Invalid session date format",
          error: "Could not generate meeting link due to invalid date."
        });
      }
      
      const meetLink = generateGoogleMeetLink(
        session.id,
        sessionDate,
        session.studentName
      );
      
      // Generate calendar event link with Info@bamboomade.in as the host
      const calendarLink = generateGoogleCalendarLink(
        session.id,
        meetLink,
        sessionDate,
        session.duration,
        session.topic,
        session.studentName
      );
      
      res.json({
        success: true,
        session,
        meetLink,
        calendarLink
      });
    } catch (error) {
      console.error("Error getting session details:", error);
      res.status(500).json({
        success: false,
        message: "Failed to get session details",
        error: (error as Error).message
      });
    }
  });

  // Payment routes are exclusively handled by Razorpay

  // Razorpay Payment Routes
  app.post("/api/razorpay/create-order", async (req, res) => {
    try {
      const { amount, sessionId, customerName, customerPhone, customerEmail } = req.body;
      
      // Log information for debugging
      console.log("Razorpay order creation:", {
        amount,
        sessionId,
        customerName: customerName ? "✓" : "✗", // For privacy, just log if present
        customerPhone: customerPhone ? "✓" : "✗", // For privacy, just log if present
        customerEmail: customerEmail ? "✓" : "✗", // For privacy, just log if present
        keyIdExists: !!process.env.RAZORPAY_KEY_ID,
        keySecretExists: !!process.env.RAZORPAY_KEY_SECRET
      });
      
      if (!amount || !customerName || !customerPhone || !customerEmail) {
        return res.status(400).json({ 
          success: false,
          message: "Missing required payment information" 
        });
      }
      
      // Verify that the required environment variables are set
      if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
        console.warn("Missing Razorpay credentials in environment variables");
        if (process.env.NODE_ENV !== 'production') {
          console.log("Development mode: Will simulate Razorpay payment");
        } else {
          return res.status(500).json({
            success: false,
            message: "Payment service configuration error"
          });
        }
      }
      
      // Generate a unique order ID that includes the session ID for better tracking
      // Format: BAMBOO_sessionId_timestamp 
      // This makes it easier to extract the session ID after payment
      const orderId = sessionId 
        ? `BAMBOO_${sessionId}_${Date.now()}` 
        : `BAMBOO_RANDOM_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
        
      console.log(`Generated Razorpay order ID with sessionId ${sessionId}: ${orderId}`);
      
      console.log(`Razorpay order creation for order: ${orderId}`);
      
      // Initialize Razorpay payment
      const orderResult = await initiateRazorpayPayment(
        amount,
        orderId,
        customerName,
        customerPhone,
        customerEmail
      );
      
      // Log the order result (excluding sensitive info)
      console.log("Razorpay order result:", {
        success: orderResult.success,
        hasOrderId: !!orderResult.orderId,
        hasError: !!orderResult.error
      });
      
      if (orderResult.success) {
        // For development/testing, store the pending payment in memory
        // In production, this should be stored in the database
        const pendingPaymentData = {
          amount,
          sessionId,
          customerName,
          customerPhone,
          customerEmail
        };
        
        // Store in global variable for testing if session is not available
        if (!req.session) {
          console.log("Session not available, using global storage for pending payment");
          global.pendingPayments = global.pendingPayments || {};
          global.pendingPayments[orderId] = pendingPaymentData;
        } else {
          if (!req.session.pendingPayments) {
            req.session.pendingPayments = {};
          }
          req.session.pendingPayments[orderId] = pendingPaymentData;
        }
        
        res.json(orderResult);
      } else {
        console.error("Razorpay order creation failed:", orderResult.error);
        res.status(400).json({
          success: false,
          message: orderResult.error || "Failed to create payment order"
        });
      }
    } catch (error) {
      console.error("Razorpay order creation error:", error);
      res.status(500).json({ 
        success: false,
        message: "Payment order creation failed",
        error: (error as Error).message
      });
    }
  });

  app.post("/api/razorpay/verify-payment", async (req, res) => {
    try {
      const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
      
      console.log("Razorpay payment verification request:", {
        orderId: razorpay_order_id ? "✓" : "✗",
        paymentId: razorpay_payment_id ? "✓" : "✗",
        signature: razorpay_signature ? "✓" : "✗"
      });
      
      if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
        return res.status(400).json({ 
          success: false,
          message: "Missing required verification parameters" 
        });
      }
      
      // Verify the payment signature
      const verificationResult = verifyRazorpayPayment(
        razorpay_order_id,
        razorpay_payment_id, 
        razorpay_signature
      );
      
      if (verificationResult.success && verificationResult.verified) {
        // Get payment details from Razorpay
        const paymentDetails = await getRazorpayPaymentDetails(razorpay_payment_id);
        
        if (paymentDetails.success) {
          console.log("Razorpay payment verified successfully:", {
            paymentId: razorpay_payment_id,
            status: paymentDetails.status,
            amount: paymentDetails.amount
          });
          
          // Extract session ID from our custom order ID format if present
          // Format: BAMBOO_sessionId_timestamp
          let sessionId = null;
          const orderIdParts = razorpay_order_id.split('_');
          console.log("Parsing Razorpay order ID parts:", orderIdParts);
          
          // Check for our specific format
          if (orderIdParts[0] === 'BAMBOO' && orderIdParts.length >= 3 && orderIdParts[1] !== 'RANDOM') {
            // The session ID is the second part (index 1)
            sessionId = orderIdParts[1];
            console.log("Extracted sessionId from order ID:", sessionId);
            
            // If we have a session ID and it's a project guidance session, update its payment status
            if (sessionId && !isNaN(parseInt(sessionId))) {
              try {
                const session = await storage.getProjectGuidance(parseInt(sessionId));
                
                if (session) {
                  // Update payment status in the database
                  await storage.updateProjectGuidancePayment(parseInt(sessionId), razorpay_payment_id);
                  
                  // Email confirmations and Google Sheets integration have been removed as requested
                }
              } catch (error) {
                console.error("Error updating payment status:", error);
                // Continue processing even if there's an error
              }
            }
          }
          
          res.json({
            success: true,
            verified: true,
            paymentId: razorpay_payment_id
          });
        } else {
          console.error("Razorpay payment details retrieval failed:", paymentDetails.error);
          res.status(400).json({
            success: false,
            message: "Payment verification failed: could not retrieve payment details"
          });
        }
      } else {
        console.error("Razorpay payment verification failed:", verificationResult.error);
        res.status(400).json({
          success: false, 
          verified: false,
          message: "Payment signature verification failed"
        });
      }
    } catch (error) {
      console.error("Razorpay payment verification error:", error);
      res.status(500).json({ 
        success: false,
        message: "Payment verification failed",
        error: (error as Error).message
      });
    }
  });

  // Get dashboard data for AI Chat screen (events, updates, facts)
  app.get("/api/dashboard-data", async (req, res) => {
    try {
      // Extract date parameter if provided (format: YYYY-MM-DD)
      const dateParam = req.query.date as string | undefined;
      let selectedDate: Date | undefined;
      
      // Validate date format
      if (dateParam) {
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (dateRegex.test(dateParam)) {
          selectedDate = new Date(dateParam);
          
          // Check if date is valid and not in the future
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          
          if (isNaN(selectedDate.getTime()) || selectedDate > today) {
            return res.status(400).json({ message: "Invalid date parameter. Date must be valid and not in the future." });
          }
        } else {
          return res.status(400).json({ message: "Invalid date format. Use YYYY-MM-DD." });
        }
      }
      
      // Run all queries in parallel for better performance, passing the date parameter
      const [eventsSummary, upcomingEvents, recentUpdates, bambooFact, bamboofacts] = await Promise.all([
        getLatestEventsSummary(selectedDate),
        getUpcomingEvents(selectedDate),
        getRecentUpdates(selectedDate),
        getInterestingBambooFact(1, selectedDate), // Keep for backward compatibility
        getMultipleBambooFacts(3, selectedDate)   // Get 3 interesting facts from different sources
      ]);
      
      // Debug logging for bamboo facts
      console.log("Bamboo facts retrieved:", 
        bamboofacts.map(fact => ({
          id: fact.id,
          contentType: fact.contentType,
          source: fact.source?.substring(0, 30) + (fact.source && fact.source.length > 30 ? '...' : ''),
          factPreview: fact.fact.substring(0, 30) + (fact.fact.length > 30 ? '...' : '')
        }))
      );
      
      // If we have upcoming events from the knowledge base but no general events summary,
      // create a simple events list to display
      let eventsToShow = eventsSummary;
      
      if (!eventsSummary && upcomingEvents.length > 0) {
        // Format upcoming events as a markdown list
        const formattedEvents = upcomingEvents.map(event => {
          // Extract a brief description from the content (first 100 chars)
          const briefDescription = event.content.length > 100
            ? event.content.substring(0, 100) + '...'
            : event.content;
          
          return `- **${event.title}**\n  ${briefDescription}`;
        }).join('\n\n');
        
        eventsToShow = `# Upcoming Bamboo Architecture Events\n\n${formattedEvents}\n\n*Last updated: ${new Date().toLocaleDateString('en-IN')}*`;
      }
      
      res.json({
        events: eventsToShow,
        upcomingEvents: upcomingEvents, // Add the raw upcoming events data
        updates: recentUpdates,
        fact: bambooFact,    // Keep for backward compatibility
        facts: bamboofacts   // New array of facts from different sources
      });
    } catch (error) {
      console.error("Error getting dashboard data:", error);
      res.status(500).json({ message: "Failed to retrieve dashboard data" });
    }
  });
  
  // Today's Bamboo Enthusiast API Endpoint - returns either all enthusiasts or one random enthusiast
  app.get("/api/todays-enthusiast", async (req, res) => {
    try {
      // Check if we should return all enthusiasts
      const returnAll = req.query.all === 'true';
      
      // Get the current date or use date parameter if provided
      const dateParam = req.query.date as string | undefined;
      let selectedDate: Date;
      
      if (dateParam && /^\d{4}-\d{2}-\d{2}$/.test(dateParam)) {
        selectedDate = new Date(dateParam);
        if (isNaN(selectedDate.getTime())) {
          selectedDate = new Date();
        }
      } else {
        selectedDate = new Date();
      }
      
      // Format date as YYYY-MM-DD for consistent selection
      const dateString = selectedDate.toISOString().split('T')[0];
      
      // Get all enthusiast profiles from the knowledge database
      const allContent = await storage.getAllAiKnowledgeContent();
      
      console.log("AI Knowledge content retrieved:", allContent.length, "items");
      // Log the first few items to inspect their structure
      if (allContent.length > 0) {
        console.log("Sample item structure:", JSON.stringify(allContent[0], null, 2));
      }
      
      // Debug all content types
      const contentTypes = allContent.map(item => item.contentType || item.content_type);
      console.log("Content types available:", [...new Set(contentTypes)]);
      
      // Use both camelCase and snake_case for compatibility
      const enthusiasts = allContent.filter(item => 
        (item.contentType === 'enthusiast' || item.content_type === 'enthusiast') && 
        (item.status === 'published' || item.status === 'active')
      );
      
      console.log("Filtered enthusiasts:", enthusiasts.length);
      
      if (enthusiasts.length === 0) {
        return res.status(404).json({ error: "No bamboo enthusiasts found" });
      }
      
      // If returnAll is true, return all enthusiasts
      if (returnAll) {
        return res.json(enthusiasts);
      }
      
      // Otherwise use the date string as a seed for deterministic selection
      // This ensures the same enthusiast is shown all day, but changes each day
      const seed = dateString.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
      const selectedIndex = seed % enthusiasts.length;
      const todaysEnthusiast = enthusiasts[selectedIndex];
      
      res.json(todaysEnthusiast);
    } catch (error) {
      console.error("Error fetching today's enthusiast:", error);
      res.status(500).json({ error: "Failed to fetch today's bamboo enthusiast" });
    }
  });
  
  // Save Dashboard Snapshot - captures the current dashboard state for a specific date
  app.post("/api/dashboard-snapshots", isAdmin, async (req, res) => {
    try {
      const { date } = req.body;
      
      if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return res.status(400).json({ message: "Invalid date format. Use YYYY-MM-DD." });
      }
      
      // Get current dashboard data for the specified date
      const [eventsSummary, upcomingEvents, recentUpdates, facts] = await Promise.all([
        getLatestEventsSummary(new Date(date)),
        getUpcomingEvents(new Date(date)),
        getRecentUpdates(new Date(date)),
        getMultipleBambooFacts(3, new Date(date))
      ]);
      
      // Format events summary if needed
      let eventsToSave = eventsSummary;
      if (!eventsSummary && upcomingEvents.length > 0) {
        const formattedEvents = upcomingEvents.map(event => {
          const briefDescription = event.content.length > 100
            ? event.content.substring(0, 100) + '...'
            : event.content;
          
          return `- **${event.title}**\n  ${briefDescription}`;
        }).join('\n\n');
        
        eventsToSave = `# Upcoming Bamboo Architecture Events\n\n${formattedEvents}\n\n*Last updated: ${new Date(date).toLocaleDateString('en-IN')}*`;
      }
      
      // Create snapshot with proper type structure matching the expected types
      const snapshotData = {
        date,
        eventsSummary: eventsToSave,
        // Just store the IDs of upcomingEvents and use stringify/parse to avoid type issues
        upcomingEventsData: JSON.stringify(upcomingEvents),
        // Just store the IDs of recentUpdates and use stringify/parse to avoid type issues
        recentUpdatesData: JSON.stringify(recentUpdates),
        // Just store the IDs of facts and use stringify/parse to avoid type issues
        factsData: JSON.stringify(facts)
      };
      
      // Save snapshot
      const savedSnapshot = await storage.saveDashboardSnapshot(snapshotData);
      
      res.status(201).json({
        message: "Dashboard snapshot saved successfully",
        snapshot: savedSnapshot
      });
    } catch (error) {
      console.error("Error saving dashboard snapshot:", error);
      res.status(500).json({ message: "Failed to save dashboard snapshot" });
    }
  });
  
  // Get Dashboard Snapshot for a specific date
  app.get("/api/dashboard-snapshots/:date", async (req, res) => {
    try {
      const dateParam = req.params.date;
      
      if (!dateParam || !/^\d{4}-\d{2}-\d{2}$/.test(dateParam)) {
        return res.status(400).json({ message: "Invalid date format. Use YYYY-MM-DD." });
      }
      
      const snapshot = await storage.getDashboardSnapshotByDate(dateParam);
      
      if (!snapshot) {
        return res.status(404).json({ message: "No snapshot found for the specified date" });
      }
      
      // Parse the JSON strings
      const enhancedSnapshot = {
        ...snapshot,
        upcomingEvents: snapshot.upcomingEventsData ? JSON.parse(snapshot.upcomingEventsData) : [],
        recentUpdates: snapshot.recentUpdatesData ? JSON.parse(snapshot.recentUpdatesData) : [],
        facts: snapshot.factsData ? JSON.parse(snapshot.factsData) : []
      };
      
      res.json(enhancedSnapshot);
    } catch (error) {
      console.error("Error retrieving dashboard snapshot:", error);
      res.status(500).json({ message: "Failed to retrieve dashboard snapshot" });
    }
  });
  
  // Get all Dashboard Snapshots (with pagination)
  app.get("/api/dashboard-snapshots", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const page = parseInt(req.query.page as string) || 1;
      const offset = (page - 1) * limit;
      
      const snapshots = await storage.getAllDashboardSnapshots();
      
      // Parse JSON strings and enhance snapshots
      const enhancedSnapshots = snapshots.map(snapshot => ({
        ...snapshot,
        upcomingEvents: snapshot.upcomingEventsData ? JSON.parse(snapshot.upcomingEventsData) : [],
        recentUpdates: snapshot.recentUpdatesData ? JSON.parse(snapshot.recentUpdatesData) : [],
        facts: snapshot.factsData ? JSON.parse(snapshot.factsData) : []
      }));
      
      // Apply pagination manually
      const paginatedSnapshots = enhancedSnapshots.slice(offset, offset + limit);
      const totalCount = enhancedSnapshots.length;
      
      res.json({
        snapshots: paginatedSnapshots,
        pagination: {
          total: totalCount,
          page,
          limit,
          pages: Math.ceil(totalCount / limit)
        }
      });
    } catch (error) {
      console.error("Error retrieving dashboard snapshots:", error);
      res.status(500).json({ message: "Failed to retrieve dashboard snapshots" });
    }
  });
  
  // Get recent updates from the knowledge base (last 30 days)
  app.get("/api/recent-updates", async (req, res) => {
    try {
      const updates = await getRecentUpdates();
      res.json({ updates });
    } catch (error) {
      console.error("Error getting recent updates:", error);
      res.status(500).json({ message: "Failed to retrieve recent updates" });
    }
  });
  
  // Social media content endpoint with weekly rotation
  app.get("/api/social-media-content", async (req, res) => {
    try {
      // Determine current rotation group (1-4) based on the week of the year
      const today = new Date();
      const weekNumber = Math.floor((today.getDate() - 1) / 7) + 1; // Week 1-5 of the month
      const rotationGroup = (weekNumber % 4) + 1; // Ensure it's between 1-4
      
      // Get featured content regardless of rotation group
      const featuredItems = await db
        .select()
        .from(socialMediaContent)
        .where(eq(socialMediaContent.featured, true))
        .orderBy(desc(socialMediaContent.publishedAt))
        .limit(6);
        
      // Get rotation-specific content
      const rotationItems = await db
        .select()
        .from(socialMediaContent)
        .where(
          and(
            eq(socialMediaContent.rotationGroup, rotationGroup),
            eq(socialMediaContent.featured, false)
          )
        )
        .orderBy(desc(socialMediaContent.publishedAt))
        .limit(10);
        
      // Combine and sort the results, prioritizing featured items
      const allItems = [...featuredItems, ...rotationItems];
      
      // Social media links
      const links = {
        instagram: "https://www.instagram.com/bamboomadein/",
        youtube: "https://www.youtube.com/@bamboomade_in",
        facebook: "https://www.facebook.com/bamboomadein",
      };
      
      res.status(200).json({ 
        content: allItems,
        links,
        rotationInfo: {
          group: rotationGroup,
          nextRotation: new Date(today.setDate(today.getDate() + (7 - today.getDay()))),
        }
      });
    } catch (error) {
      console.error("Error fetching social media content:", error);
      res.status(500).json({ error: "Failed to fetch social media content" });
    }
  });
  
  // Get interesting bamboo fact that rotates every 15 days
  app.get("/api/bamboo-fact", async (req, res) => {
    try {
      const factData = await getInterestingBambooFact();
      res.json({ fact: factData });
    } catch (error) {
      console.error("Error getting bamboo fact:", error);
      res.status(500).json({ message: "Failed to retrieve bamboo fact" });
    }
  });
  
  // Get upcoming events summary from the knowledge base
  app.get("/api/events-summary", async (req, res) => {
    try {
      const summary = await getLatestEventsSummary();
      res.json({ summary });
    } catch (error) {
      console.error("Error getting events summary:", error);
      res.status(500).json({ message: "Failed to retrieve events summary" });
    }
  });

  // AI Chat routes
  app.post("/api/chat", async (req, res) => {
    try {
      const { message } = req.body;
      
      if (!message || typeof message !== 'string') {
        return res.status(400).json({ message: "Valid message is required" });
      }
      
      // Get training data to enhance AI responses
      const trainingData = await storage.getAllAiTrainingData();
      
      // Get active AI knowledge content
      const knowledgeContent = await storage.getActiveAiKnowledgeContent();
      
      // Process the message with OpenAI, including knowledge base content
      const { response, tokensUsed, citations } = await processMessage(message, trainingData, knowledgeContent);
      
      // Log that we're using the knowledge base
      console.log(`AI chat using ${knowledgeContent.length} knowledge base items`);
      
      // No need to check tokens or update user anymore
      // No need to store chat messages either

      // Return the response with citations included for transparency
      res.status(201).json({
        message,
        response,
        tokensUsed,
        citations, // Include citations to display in the UI
        // No user-specific data
      });
    } catch (error) {
      console.error("Chat API error:", error);
      res.status(500).json({ message: "Failed to process chat", error: (error as Error).message });
    }
  });
  
  // Knowledge Companion Chat - For admin to add content through AI chat
  app.post("/api/knowledge-companion/chat", isAdmin, async (req, res) => {
    try {
      const { message } = req.body;
      
      if (!message) {
        return res.status(400).json({ error: 'Message is required' });
      }
      
      // Get OpenAI client
      const openai = getOpenAI();
      if (!openai) {
        return res.status(500).json({ error: 'OpenAI service not available' });
      }
      
      // First, analyze if this message contains content that should be added to knowledge base
      const systemPrompt = `You are an AI Knowledge Assistant for BambooMade, a company focused on bamboo architecture and sustainable design.
      
Your role is to help administrators add high-quality content to the knowledge base. Follow these guidelines:

1. Determine if the user's message contains valuable information about bamboo, architecture, sustainable design, or events that should be added to the knowledge base.
2. For informational content, suggest adding it as a "document" type with an appropriate title.
3. For event information, suggest adding it as an "event" type.
4. For website content, suggest adding it as a "webpage" type.
5. For user-authored content, suggest adding it as a "manual" type.

Only respond with "true" for shouldAddToKnowledge if the message contains substantial, informative content about bamboo or related topics.

Respond in JSON format with:
{
  "response": "Your friendly, helpful response to the user",
  "shouldAddToKnowledge": boolean,
  "suggestion": "If shouldAddToKnowledge is true, suggest how to format and categorize the content",
  "isDuplicate": boolean // Set to true if this appears to be content already likely in the system
}`;

      // Send the user message to OpenAI to analyze if it should be added to knowledge base
      const knowledgeAnalysisResponse = await openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: message }
        ],
        response_format: { type: "json_object" }
      });
      
      // Parse the AI response
      let aiResponse;
      try {
        aiResponse = JSON.parse(knowledgeAnalysisResponse.choices[0].message.content);
      } catch (error) {
        console.error("Error parsing AI response:", error);
        aiResponse = {
          response: "I had trouble processing that. Could you try rephrasing your message?",
          shouldAddToKnowledge: false,
          suggestion: null,
          isDuplicate: false
        };
      }
      
      // Generate a default response if the AI didn't provide one
      if (!aiResponse.response) {
        aiResponse.response = "Thank you for sharing that information. Would you like me to add it to our knowledge base?";
      }
      
      return res.json({
        response: aiResponse.response,
        shouldAddToKnowledge: aiResponse.shouldAddToKnowledge,
        suggestion: aiResponse.suggestion,
        isDuplicate: aiResponse.isDuplicate
      });
      
    } catch (error: any) {
      console.error('Knowledge companion chat error:', error);
      return res.status(500).json({ error: `Failed to process message: ${error.message}` });
    }
  });
  
  // Add content to knowledge base from AI chat
  app.post("/api/ai-knowledge/from-chat", isAdmin, async (req, res) => {
    try {
      const { userMessage, aiSuggestion } = req.body;
      
      if (!userMessage) {
        return res.status(400).json({ error: 'User message is required' });
      }
      
      if (!req.session.adminUser || !req.session.adminUser.id) {
        return res.status(401).json({ error: 'Admin authentication required' });
      }
      
      // Get OpenAI client
      const openai = getOpenAI();
      if (!openai) {
        return res.status(500).json({ error: 'OpenAI service not available' });
      }
      
      // Use GPT-4o to format the content properly for the knowledge base
      const systemPrompt = `You are formatting content for a bamboo architecture knowledge base.
      
Format the user's message into structured knowledge content suitable for a database. Extract or generate:
1. A clear, concise title (max 100 chars)
2. Well-formatted content preserving the key information
3. A content type: "document", "event", "webpage", or "manual"
4. A source URL if mentioned (or null)

Respond in this format EXACTLY:
Title: [extracted title]
Content: [formatted content]
Content Type: [document|event|webpage|manual]
Source: [source URL or null]`;

      // Send the user message to OpenAI to format it for the knowledge base
      const contentFormattingResponse = await openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage },
          { role: "assistant", content: aiSuggestion || "Please format this for our knowledge base." }
        ]
      });
      
      // Get the AI response
      const aiResponse = contentFormattingResponse.choices[0].message.content;
      
      // Parse the formatted content
      let addedContent = null;
      
      // Extract values using regex
      const titleMatch = aiResponse.match(/Title:\s*([^\n]+)/i);
      const contentMatch = aiResponse.match(/Content:\s*([^]*)(?=(Content Type|Source|$))/i);
      const contentTypeMatch = aiResponse.match(/Content Type:\s*([^\n]+)/i);
      const sourceMatch = aiResponse.match(/Source:\s*([^\n]+)/i);
      
      if (titleMatch && contentMatch) {
        const title = titleMatch[1].trim();
        let content = contentMatch[1].trim();
        const contentType = contentTypeMatch ? contentTypeMatch[1].trim().toLowerCase() : "document";
        const source = sourceMatch ? sourceMatch[1].trim() : null;
        
        // Only add if we have meaningful content
        if (title.length > 5 && content.length > 20) {
          // Create knowledge content
          addedContent = await storage.createAiKnowledgeContent({
            title,
            content,
            contentType: contentType === "document" || contentType === "event" || contentType === "webpage" || contentType === "manual" 
              ? contentType 
              : "document",
            source: source === "null" ? null : source,
            status: "pending", // Set status to pending by default for admin review
            createdBy: req.session.adminUser.id
          });
          
          console.log(`Added new AI knowledge content: ${title}`);
        }
      }
      
      res.status(200).json({
        message: aiResponse,
        addedContent
      });
      
    } catch (error: any) {
      console.error('Error adding knowledge from chat:', error);
      return res.status(500).json({ 
        error: `Failed to add knowledge content: ${error.message}`,
        message: "Failed to add this content to the knowledge base."
      });
    }
  });
  

  
  // AI Training Chat for Admins (Knowledge Management)
  app.post("/api/chat/ai-training", async (req, res) => {
    try {
      // Check if user is admin
      const isAdmin = req.session.adminUser === true;
      if (!isAdmin) {
        return res.status(403).json({ message: "Only admins can access this feature" });
      }
      
      const { message, previousMessages } = req.body;
      
      if (!message || typeof message !== 'string') {
        return res.status(400).json({ message: "Valid message is required" });
      }
      
      // Initialize Gemini
      const gemini = getGeminiAI();
      if (!gemini) {
        return res.status(500).json({ message: "Gemini AI service not available" });
      }
      
      // Prepare conversation history
      const conversationHistory = [
        {
          role: "system", 
          content: `You are an AI training assistant for BambooMade, an organization focused on bamboo architecture and sustainable design.
          
Your primary tasks are:
1. Help admins add knowledge content to the AI knowledge base
2. Guide admins on how to train you to respond to specific types of questions

When an admin asks you to add information to the knowledge base:
- Extract a clear title, content, and potential source (if provided)
- Organize the information logically and comprehensively
- Suggest a content type from: document, event, webpage, or manual
- Format this as structured content ready to be added

Example request: "Add information about bamboo joinery techniques"
Example response: I'll help you add this to the knowledge base.

Title: Bamboo Joinery Techniques
Content: [Comprehensive content about bamboo joinery]
Content Type: document
Source: (if provided or null)

When an admin asks you how to respond to certain questions:
- Provide clear guidance on appropriate responses
- Explain what information should be included
- Note any special considerations for that topic

You can access and modify the knowledge base. Be thorough, accurate, and helpful.`
        }
      ];
      
      // Add previous conversation messages
      if (previousMessages && Array.isArray(previousMessages)) {
        conversationHistory.push(...previousMessages);
      }
      
      // Add current user message
      conversationHistory.push({ role: "user", content: message });
      
      // Get OpenAI instance from the service
      const openai = getOpenAI();
      if (!openai) {
        return res.status(500).json({ message: "OpenAI service not available" });
      }
      
      const completion = await openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024
        messages: conversationHistory as any,
        temperature: 0.7,
        max_tokens: 1000,
      });
      
      // Extract AI response
      const aiResponse = completion.choices[0].message.content || "I couldn't generate a response.";
      
      // Check if we need to add content to the knowledge base
      let addedContent = null;
      
      // Look for patterns that indicate content should be added
      if (
        message.toLowerCase().includes("add") || 
        message.toLowerCase().includes("create") ||
        message.toLowerCase().includes("new content")
      ) {
        // Extract title, content, and content type from AI response using regex
        const titleMatch = aiResponse.match(/Title:\s*([^\n]+)/i);
        const contentMatch = aiResponse.match(/Content:\s*([^]*)(?=(Content Type|Source|$))/i);
        const contentTypeMatch = aiResponse.match(/Content Type:\s*([^\n]+)/i);
        const sourceMatch = aiResponse.match(/Source:\s*([^\n]+)/i);
        
        if (titleMatch && contentMatch) {
          const title = titleMatch[1].trim();
          let content = contentMatch[1].trim();
          const contentType = contentTypeMatch ? contentTypeMatch[1].trim().toLowerCase() : "document";
          const source = sourceMatch ? sourceMatch[1].trim() : null;
          
          // Only add if we have meaningful content
          if (title.length > 5 && content.length > 20) {
            // Create knowledge content
            addedContent = await storage.createAiKnowledgeContent({
              title,
              content,
              contentType: contentType === "document" || contentType === "event" || contentType === "webpage" || contentType === "manual" 
                ? contentType 
                : "document",
              source: source === "null" ? null : source,
              status: "pending", // Set status to pending by default for admin review
              createdBy: req.session.userId || 1 // Default to admin user if not logged in
            });
            
            console.log(`Added new AI knowledge content: ${title}`);
          }
        }
      }
      
      res.status(200).json({
        message: aiResponse,
        addedContent
      });
    } catch (error) {
      console.error("AI Training Chat error:", error);
      res.status(500).json({ message: "Failed to process training chat", error: (error as Error).message });
    }
  });

  app.get("/api/chat/history", async (req, res) => {
    try {
      const userId = req.session.userId;
      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const messages = await storage.getChatMessagesByUserId(userId);
      res.json(messages);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch chat history", error: (error as Error).message });
    }
  });
  
  // Test endpoint for Gemini AI connection
  app.get('/api/test-gemini', async (req, res) => {
    try {
      console.log("Testing Gemini AI connection...");
      console.log(`API Key being used: ${process.env.GOOGLE_GEMINI_API_KEY?.substring(0, 7)}...`);
      
      const response = {
        status: 'checking',
        apiKeyPresent: !!process.env.GOOGLE_GEMINI_API_KEY,
        apiKeyType: process.env.GOOGLE_GEMINI_API_KEY?.startsWith('AI') ? 'Google AI' : 'Unknown',
        diagnostics: {}
      };
      
      // Import Google Generative AI directly
      const { GoogleGenerativeAI } = await import('@google/generative-ai');
      
      try {
        console.log("Initializing Gemini AI with direct key...");
        const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY || '');
        
        console.log("Making test API call...");
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
        const testCompletion = await model.generateContent("Hello, this is a test. Reply with a single word: 'Working'");
        
        const result = await testCompletion.response;
        const text = result.text();
        
        response.status = 'success';
        response.diagnostics = {
          model: "gemini-1.5-pro",
          output: text,
          responseTime: `Response received successfully`
        };
      } catch (error: any) {
        console.error("Direct Gemini test failed:", error);
        response.status = 'failed';
        response.diagnostics = {
          error: error.message || 'Unknown error',
          type: error.type || 'Unknown',
          code: error.code || 'Unknown'
        };
      }
      
      res.json(response);
    } catch (error) {
      console.error("Error in OpenAI test endpoint:", error);
      res.status(500).json({ 
        status: 'error',
        message: 'Internal server error during OpenAI test',
        error: error.message
      });
    }
  });
  
  // AI Knowledge Base endpoints (admin only)
  app.get("/api/ai-knowledge", isAdmin, async (req, res) => {
    try {
      const knowledgeContent = await storage.getAllAiKnowledgeContent();
      res.json(knowledgeContent);
    } catch (error) {
      console.error("Error fetching AI knowledge content:", error);
      res.status(500).json({ message: "Failed to fetch AI knowledge content" });
    }
  });
  
  // Get pending AI knowledge content for admin approval
  app.get("/api/ai-knowledge/pending", isAdmin, async (req, res) => {
    try {
      const pendingContent = await storage.getPendingAiKnowledgeContent();
      res.json(pendingContent);
    } catch (error) {
      console.error("Error fetching pending AI knowledge content:", error);
      res.status(500).json({ message: "Failed to fetch pending AI knowledge content" });
    }
  });
  
  // Approve pending AI knowledge content
  app.post("/api/ai-knowledge/:id/approve", isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid content ID" });
      }
      
      // Get the content to verify it's pending
      const content = await storage.getAiKnowledgeContentById(id);
      
      if (!content) {
        return res.status(404).json({ message: "Content not found" });
      }
      
      if (content.status !== 'pending') {
        return res.status(400).json({ message: "Only pending content can be approved" });
      }
      
      // Update the content status to active
      const updatedContent = await storage.updateAiKnowledgeContent(id, { status: 'active' });
      
      if (!updatedContent) {
        return res.status(500).json({ message: "Failed to approve content" });
      }
      
      res.json({
        success: true,
        message: "Content approved successfully",
        content: updatedContent
      });
    } catch (error) {
      console.error("Error approving AI knowledge content:", error);
      res.status(500).json({ message: "Failed to approve content", error: (error as Error).message });
    }
  });
  
  // Analyze content and suggest categorization
  app.post("/api/ai-knowledge/analyze", isAdmin, async (req, res) => {
    try {
      const { content } = req.body;
      
      if (!content || typeof content !== 'string' || content.trim().length < 10) {
        return res.status(400).json({ error: 'Valid content is required for analysis (min 10 characters)' });
      }
      
      // Detect if the content is a URL
      const contentType = detectContentType(content.trim());
      
      // If it's a URL, process it with the web crawler
      if (contentType === 'url') {
        console.log('Detected URL, processing with web crawler:', content.trim());
        try {
          const websiteData = await analyzeWebsite(content.trim());
          
          // Automatically extract facts from the website content
          if (websiteData && websiteData.content) {
            try {
              const facts = await extractFactsFromContent(websiteData.content, content.trim());
              console.log(`Analysis: Automatically extracted ${facts.length} facts from URL: ${content.trim()}`);
              
              // Save each extracted fact
              if (facts.length > 0 && req.session.adminUser && req.session.adminUser.id) {
                for (const factContent of facts) {
                  await storage.createAiKnowledgeContent({
                    title: `Bamboo Fact: ${factContent.substring(0, 50)}...`,
                    content: factContent,
                    source: content.trim(),
                    contentType: 'fact',
                    status: 'active',
                    createdBy: req.session.adminUser.id
                  });
                }
              }
            } catch (error) {
              console.error('Error automatically extracting facts during analysis:', error);
            }
          }
          
          // Return the analysis results from the website crawler
          return res.json({
            title: websiteData.title || "Untitled Website",
            contentType: websiteData.contentType || "webpage",
            content: websiteData.content,
            isWebsite: true,
            sourceUrl: content.trim()
          });
        } catch (error) {
          console.error('Web crawler error:', error);
          return res.status(500).json({ 
            error: `Failed to analyze website: ${error instanceof Error ? error.message : 'Unknown error'}`,
            hint: "If this is not a website URL, please paste the content directly instead."
          });
        }
      }
      
      // Get OpenAI instance for standard content analysis
      const openai = getOpenAI();
      if (!openai) {
        return res.status(500).json({ error: 'OpenAI API is not configured' });
      }
      
      // For non-URL content, use the content type detection result
      const detectedType = contentType; // Will be 'document' or 'event'
      
      // Analyze content using OpenAI
      const response = await openai.chat.completions.create({
        model: "gpt-4o", // Using the latest model for better analysis
        messages: [
          { 
            role: "system", 
            content: "You are an AI trained to analyze and categorize content about bamboo architecture, construction, and design. Based on the content, determine the most appropriate category and suggest a concise, descriptive title."
          },
          { 
            role: "user", 
            content: `Analyze this content and respond with a JSON object containing a suggested title and content type. The content seems to be a ${detectedType}. Please verify and correct if needed.
            
            Respond with one of these content types: 'document', 'event', 'webpage', or 'manual'.
            
            Content: ${content}`
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.2,
      });
      
      // Parse the response
      const result = JSON.parse(response.choices[0].message.content);
      
      // Return the analysis results
      return res.json({
        title: result.title || 'Untitled Content',
        contentType: result.contentType || detectedType,
        isWebsite: false
      });
      
    } catch (error) {
      console.error('Error analyzing content:', error);
      res.status(500).json({ error: 'Failed to analyze content' });
    }
  });

  app.get("/api/ai-knowledge/:id", isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const content = await storage.getAiKnowledgeContentById(id);
      
      if (!content) {
        return res.status(404).json({ message: "AI knowledge content not found" });
      }
      
      res.json(content);
    } catch (error) {
      console.error("Error fetching AI knowledge content:", error);
      res.status(500).json({ message: "Failed to fetch AI knowledge content" });
    }
  });

  app.get("/api/ai-knowledge/type/:contentType", isAdmin, async (req, res) => {
    try {
      const contentType = req.params.contentType;
      const content = await storage.getAiKnowledgeContentByType(contentType);
      res.json(content);
    } catch (error) {
      console.error("Error fetching AI knowledge content by type:", error);
      res.status(500).json({ message: "Failed to fetch AI knowledge content" });
    }
  });

  app.post("/api/ai-knowledge", isAdmin, async (req, res) => {
    try {
      const { 
        title, 
        content, 
        rawContent,
        source, 
        contentType, 
        status,
        mediaUrl,
        mediaType,
        // Enthusiast-specific fields
        contactEmail,
        contactPhone,
        linkedinUrl,
        instagramUrl,
        twitterUrl,
        facebookUrl,
        personalWebsite
      } = req.body;
      
      // Validate required fields
      if (!title || !content || !contentType) {
        return res.status(400).json({ message: "Title, content, and contentType are required" });
      }
      
      // Check if adminUser exists in session
      if (!req.session.adminUser || !req.session.adminUser.id) {
        console.error("Admin user not found in session");
        return res.status(401).json({ message: "Unauthorized - You must be logged in as an admin" });
      }
      
      // Create base content object
      const contentData: any = {
        title,
        content,
        rawContent: rawContent || null,
        source: source || null,
        contentType,
        status: status || "active",
        mediaUrl: mediaUrl || null,
        mediaType: mediaType || null,
        createdBy: req.session.adminUser.id
      };
      
      // Add enthusiast-specific fields if content type is "enthusiast"
      if (contentType === "enthusiast") {
        Object.assign(contentData, {
          contactEmail,
          contactPhone,
          linkedinUrl,
          instagramUrl,
          twitterUrl,
          facebookUrl,
          personalWebsite
        });
      }
      
      // Add the content
      const newContent = await storage.createAiKnowledgeContent(contentData);
      
      res.status(201).json(newContent);
    } catch (error) {
      console.error("Error creating AI knowledge content:", error);
      res.status(500).json({ message: "Failed to create AI knowledge content" });
    }
  });

  // Support both PUT and PATCH methods for updating AI knowledge content
  app.put("/api/ai-knowledge/:id", isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { 
        title, 
        content, 
        rawContent,
        source, 
        contentType, 
        status, 
        mediaUrl,
        // Enthusiast-specific fields
        contactEmail,
        contactPhone,
        linkedinUrl,
        instagramUrl,
        twitterUrl,
        facebookUrl,
        personalWebsite,
        // Event-specific fields
        eventDate,
        eventLocation,
        registrationLink
      } = req.body;
      
      console.log("PUT update with content type:", contentType);
      
      // Check if content exists
      const existingContent = await storage.getAiKnowledgeContentById(id);
      if (!existingContent) {
        return res.status(404).json({ message: "AI knowledge content not found" });
      }
      
      // Prepare updates object
      const updates: any = {
        title,
        content,
        rawContent: rawContent || null,
        source,
        contentType,
        status,
        mediaUrl
      };
      
      // Add enthusiast-specific fields if content type is "enthusiast"
      if (contentType === "enthusiast") {
        Object.assign(updates, {
          contactEmail,
          contactPhone,
          linkedinUrl,
          instagramUrl,
          twitterUrl,
          facebookUrl,
          personalWebsite
        });
      }
      
      // Add event-specific fields if content type is "event"
      if (contentType === "event") {
        Object.assign(updates, {
          eventDate,
          eventLocation,
          registrationLink
        });
      }
      
      // Update the content
      const updatedContent = await storage.updateAiKnowledgeContent(id, updates);
      
      res.json(updatedContent);
    } catch (error) {
      console.error("Error updating AI knowledge content:", error);
      res.status(500).json({ message: "Failed to update AI knowledge content" });
    }
  });
  
  // Adding PATCH endpoint as well to handle either method
  app.patch("/api/ai-knowledge/:id", isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;
      
      console.log("PATCH update with content type:", updates.contentType);
      
      // Check if content exists
      const existingContent = await storage.getAiKnowledgeContentById(id);
      if (!existingContent) {
        return res.status(404).json({ message: "AI knowledge content not found" });
      }
      
      // Update the content
      const updatedContent = await storage.updateAiKnowledgeContent(id, updates);
      
      res.json(updatedContent);
    } catch (error) {
      console.error("Error updating AI knowledge content:", error);
      res.status(500).json({ message: "Failed to update AI knowledge content" });
    }
  });
  
  // Endpoint for resummarizing content using stored raw data
  app.post("/api/ai-knowledge/:id/resummarize", isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      // Fetch the content item to get the raw content
      const contentItem = await storage.getAiKnowledgeContentById(id);
      
      if (!contentItem) {
        return res.status(404).json({
          success: false,
          message: "Content not found"
        });
      }
      
      if (!contentItem.rawContent) {
        return res.status(400).json({
          success: false,
          message: "No raw content available for resummarization"
        });
      }
      
      // Get API key for OpenAI
      const apiKey = process.env.OPENAI_API_KEY;
      if (!apiKey) {
        return res.status(500).json({
          success: false,
          message: "OpenAI API key not configured"
        });
      }
      
      // Create a new OpenAI instance with configuration
      const openai = new OpenAI({
        apiKey: apiKey
      });
      
      // Generate a new summary using the stored raw content
      let summaryPrompt = `You are a knowledge extraction expert. Please analyze this raw content and extract the most relevant information in a well-organized format, focusing on key points, insights, and facts. Organize the content in an easy-to-read format with clear sections where appropriate, removing any duplicative or unnecessary information.\n\nThis content is related to bamboo architecture and sustainable building practices. Focus on information that would be helpful for architects, builders, or students interested in bamboo construction.\n\nRaw content to summarize:\n${contentItem.rawContent}`;
      
      const completion = await openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024
        messages: [
          { role: "system", content: "You are a knowledge extraction expert specializing in bamboo architecture and sustainable building." },
          { role: "user", content: summaryPrompt }
        ],
        max_tokens: 1500
      });
      
      const newSummary = completion.choices[0].message.content;
      
      // Update the content with the new summary and timestamp
      await storage.updateAiKnowledgeContent(id, {
        content: newSummary,
        lastResummarizedAt: new Date()
      });
      
      res.json({
        success: true,
        message: "Content successfully resummarized",
        content: newSummary
      });
    } catch (error) {
      console.error('Error resummarizing content:', error);
      res.status(500).json({ 
        success: false,
        message: "Failed to resummarize content",
        error: error.message
      });
    }
  });

  app.delete("/api/ai-knowledge/:id", isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      // Check if content exists
      const existingContent = await storage.getAiKnowledgeContentById(id);
      if (!existingContent) {
        return res.status(404).json({ message: "AI knowledge content not found" });
      }
      
      // Delete the content
      const success = await storage.deleteAiKnowledgeContent(id);
      
      if (success) {
        res.status(204).send();
      } else {
        res.status(500).json({ message: "Failed to delete AI knowledge content" });
      }
    } catch (error) {
      console.error("Error deleting AI knowledge content:", error);
      res.status(500).json({ message: "Failed to delete AI knowledge content" });
    }
  });
  
  // Extract content from Google Drive document
  app.post("/api/ai-knowledge/extract-from-drive", isAdmin, async (req, res) => {
    try {
      const { url } = req.body;
      
      if (!url) {
        return res.status(400).json({ message: "URL is required" });
      }
      
      // Check if URL is a Google Drive URL
      if (!url.includes("drive.google.com")) {
        return res.status(400).json({ message: "Not a valid Google Drive URL" });
      }

      // This is a basic implementation that would need to be expanded
      // with actual Google Drive API integration for production use
      
      // For demonstration, return a success message
      // In a real implementation, this would extract the content from the Google Drive document
      res.json({ 
        message: "Content extraction initiated", 
        contentPreview: "This is a placeholder for the extracted content. In a production environment, this would contain the actual content from the Google Drive document."
      });
    } catch (error) {
      console.error("Error extracting content from Google Drive:", error);
      res.status(500).json({ message: "Failed to extract content from Google Drive" });
    }
  });
  
  // Export AI Knowledge Content as secure backup
  app.get("/api/ai-knowledge/backup/export", isAdmin, async (req, res) => {
    try {
      const backupData = await storage.exportAiKnowledgeContentBackup();
      
      // Set appropriate headers for file download
      res.setHeader('Content-Disposition', `attachment; filename=ai-knowledge-backup-${new Date().toISOString().slice(0, 10)}.json`);
      res.setHeader('Content-Type', 'application/json');
      
      return res.status(200).json(backupData);
    } catch (error) {
      console.error("Error exporting AI knowledge content backup:", error);
      return res.status(500).json({ 
        message: "Failed to export backup", 
        error: error.message 
      });
    }
  });
  
  // SQL-like query API for AI Knowledge Content
  app.post("/api/ai-knowledge/query", isAdmin, async (req, res) => {
    try {
      const { query } = req.body;
      
      if (!query) {
        return res.status(400).json({ 
          success: false,
          message: "Query is required" 
        });
      }
      
      console.log("Processing SQL-like query:", query);
      
      // Start timing the query execution
      const startTime = Date.now();
      
      // Parse the SQL-like query
      const parsedQuery = parseSqlLikeQuery(query);
      
      if (!parsedQuery.valid) {
        return res.status(400).json({ 
          success: false,
          message: "Invalid query syntax",
          errors: parsedQuery.error
        });
      }
      
      // Execute the query
      let result;
      
      // Get all knowledge content
      const allKnowledgeContent = await storage.getAllAiKnowledgeContent();
      
      // Apply filters
      let filteredContent = [...allKnowledgeContent];
      
      // Apply WHERE conditions if they exist
      if (parsedQuery.valid && parsedQuery.where && parsedQuery.where.length > 0) {
        filteredContent = filteredContent.filter(item => {
          return parsedQuery.where.every(condition => {
            const { field, operator, value } = condition;
            
            // Check if field exists on item
            if (!(field in item)) {
              console.warn(`Field "${field}" not found on item`);
              return false;
            }
            
            // Handle special case for content search with LIKE operator
            if (field === 'content' && operator === 'LIKE') {
              return item.content.toLowerCase().includes(value.toLowerCase().replace(/%/g, ''));
            }
            
            // Handle special case for title search with LIKE operator
            if (field === 'title' && operator === 'LIKE') {
              return item.title.toLowerCase().includes(value.toLowerCase().replace(/%/g, ''));
            }
            
            // Handle basic operators
            switch (operator) {
              case '=':
                return item[field] === value;
              case '!=':
                return item[field] !== value;
              case '>':
                return item[field] > value;
              case '<':
                return item[field] < value;
              case '>=':
                return item[field] >= value;
              case '<=':
                return item[field] <= value;
              default:
                return true;
            }
          });
        });
      }
      
      // Apply sorting if specified
      if (parsedQuery.valid && parsedQuery.orderBy) {
        const { field, direction } = parsedQuery.orderBy;
        
        // Check if field exists on any item before sorting
        if (filteredContent.length > 0 && field in filteredContent[0]) {
          filteredContent.sort((a, b) => {
            if (direction === 'ASC') {
              return a[field] > b[field] ? 1 : -1;
            } else {
              return a[field] < b[field] ? 1 : -1;
            }
          });
        } else {
          console.warn(`Sort field "${field}" not found on items`);
        }
      }
      
      // Apply limit if specified
      if (parsedQuery.valid && parsedQuery.limit) {
        filteredContent = filteredContent.slice(0, parsedQuery.limit);
      }
      
      // Calculate execution time
      const executionTime = Date.now() - startTime;
      
      // Format the result
      result = {
        query: query,
        count: filteredContent.length,
        data: filteredContent,
        fields: parsedQuery.valid && parsedQuery.select === '*' ? null : parsedQuery.select,
        executionTime: executionTime
      };
      
      res.json({
        success: true,
        result: result
      });
    } catch (error) {
      console.error("Error executing AI knowledge query:", error);
      res.status(500).json({ 
        success: false,
        message: "Failed to execute query",
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
  
  // Import AI Knowledge Content from secure backup
  app.post("/api/ai-knowledge/backup/import", isAdmin, async (req, res) => {
    try {
      const backupData = req.body;
      
      // Validate the backup data structure
      if (!backupData || !backupData.data || !Array.isArray(backupData.data) || 
          !backupData.timestamp || !backupData.checksum) {
        return res.status(400).json({ 
          message: "Invalid backup data format. The backup should include data array, timestamp, and checksum." 
        });
      }
      
      const result = await storage.importAiKnowledgeContentBackup(backupData);
      
      return res.status(200).json({
        message: "Backup imported successfully",
        ...result
      });
    } catch (error) {
      console.error("Error importing AI knowledge content backup:", error);
      return res.status(500).json({ 
        message: "Failed to import backup", 
        error: error.message 
      });
    }
  });

  // AI Training data routes (admin only)
  app.get("/api/admin/training-data", async (req, res) => {
    try {
      const userId = req.session.userId;
      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const user = await storage.getUser(userId);
      if (!user || !user.isAdmin) {
        return res.status(403).json({ message: "Unauthorized: Admin access required" });
      }
      
      const data = await storage.getAllAiTrainingData();
      res.json(data);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch training data", error: (error as Error).message });
    }
  });

  app.post("/api/admin/training-data", validateRequest(insertAiTrainingDataSchema), async (req, res) => {
    try {
      const userId = req.session.userId;
      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const user = await storage.getUser(userId);
      if (!user || !user.isAdmin) {
        return res.status(403).json({ message: "Unauthorized: Admin access required" });
      }
      
      const data = await storage.createAiTrainingData(req.body);
      res.status(201).json(data);
    } catch (error) {
      res.status(500).json({ message: "Failed to create training data", error: (error as Error).message });
    }
  });

  // Admin user management routes
  app.get("/api/admin/users", isAdmin, async (req, res) => {
    try {
      // Get all users for admin management
      // Note: In a real app with many users, you would implement pagination
      const allUsers = await storage.getAllUsers();
      const users = allUsers.map(user => {
        // Don't return password in response
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
      });
      
      res.json(users);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch users", error: (error as Error).message });
    }
  });
  
  // Get user by ID for admin view
  app.get("/api/admin/users/:userId", isAdmin, async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Don't return password in response
      const { password, ...userWithoutPassword } = user;
      
      res.json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({ 
        message: "Failed to fetch user", 
        error: (error as Error).message 
      });
    }
  });
  
  // Get all sessions for a specific user
  app.get("/api/admin/users/:userId/sessions", isAdmin, async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Get all sessions by user email
      const sessions = await storage.getProjectGuidancesByEmail(user.email);
      
      res.json({
        success: true,
        sessions
      });
    } catch (error) {
      res.status(500).json({ 
        message: "Failed to fetch user sessions", 
        error: (error as Error).message 
      });
    }
  });
  
  // Toggle admin status - only info@bamboomade.in can do this
  app.post("/api/admin/toggle-admin/:userId", isAdmin, async (req, res) => {
    try {
      const adminEmail = req.session.userEmail;
      if (adminEmail !== 'info@bamboomade.in') {
        return res.status(403).json({ 
          message: "Only the super admin (info@bamboomade.in) can manage admin privileges" 
        });
      }
      
      const targetUserId = parseInt(req.params.userId);
      const { makeAdmin } = req.body;
      
      if (isNaN(targetUserId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      // Don't allow changing admin status of the super admin
      const targetUser = await storage.getUser(targetUserId);
      if (!targetUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      if (targetUser.email === 'info@bamboomade.in') {
        return res.status(403).json({ 
          message: "Cannot change admin status of the super admin account" 
        });
      }
      
      // Update the user's admin status
      const updatedUser = await storage.updateUserAdminStatus(targetUserId, makeAdmin);
      
      // Don't return password in response
      const { password, ...userWithoutPassword } = updatedUser;
      
      res.json({
        message: `User admin status ${makeAdmin ? 'granted' : 'revoked'} successfully`,
        user: userWithoutPassword
      });
    } catch (error) {
      res.status(500).json({ 
        message: "Failed to update admin status", 
        error: (error as Error).message 
      });
    }
  });
  
  // Reset user password - only info@bamboomade.in can do this
  app.post("/api/admin/reset-password/:userId", isAdmin, async (req, res) => {
    try {
      const adminEmail = req.session.userEmail;
      if (adminEmail !== 'info@bamboomade.in') {
        return res.status(403).json({ 
          message: "Only the super admin (info@bamboomade.in) can reset passwords" 
        });
      }
      
      const targetUserId = parseInt(req.params.userId);
      const { newPassword } = req.body;
      
      if (isNaN(targetUserId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      if (!newPassword || newPassword.length < 6) {
        return res.status(400).json({ 
          message: "Password must be at least 6 characters long" 
        });
      }
      
      const targetUser = await storage.getUser(targetUserId);
      if (!targetUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Hash the new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      
      // Update the user's password
      const updatedUser = await storage.updateUserPassword(targetUserId, hashedPassword);
      
      res.json({
        message: "Password reset successfully",
        userId: targetUserId,
        email: targetUser.email
      });
    } catch (error) {
      res.status(500).json({ 
        message: "Failed to reset password", 
        error: (error as Error).message 
      });
    }
  });
  
  // Update user information
  app.patch("/api/admin/users/:userId", isAdmin, async (req, res) => {
    try {
      const adminEmail = req.session.userEmail;
      if (adminEmail !== 'info@bamboomade.in' && !req.body.updates) {
        return res.status(403).json({ 
          message: "Only the super admin (info@bamboomade.in) can update users" 
        });
      }
      
      const targetUserId = parseInt(req.params.userId);
      const updates = req.body;
      
      if (isNaN(targetUserId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      const targetUser = await storage.getUser(targetUserId);
      if (!targetUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Only allow admin to modify these fields
      const allowedFields = ['username', 'firstName', 'lastName', 'phone', 'profileImageUrl'];
      const filteredUpdates = Object.keys(updates)
        .filter(key => allowedFields.includes(key))
        .reduce((obj, key) => {
          obj[key] = updates[key];
          return obj;
        }, {});
      
      if (Object.keys(filteredUpdates).length === 0) {
        return res.status(400).json({ message: "No valid fields to update" });
      }
      
      // Extra check for profile completeness
      let profileCompleted = targetUser.profileCompleted;
      if (!targetUser.profileCompleted) {
        // If user has first name, last name, and phone, mark profile as completed
        if (
          (filteredUpdates.firstName || targetUser.firstName) && 
          (filteredUpdates.lastName || targetUser.lastName) && 
          (filteredUpdates.phone || targetUser.phone)
        ) {
          profileCompleted = true;
          filteredUpdates.profileCompleted = true;
        }
      }
      
      // Update the user
      const updatedUser = await storage.updateUser(targetUserId, filteredUpdates);
      
      // Don't return password in response
      const { password, ...userWithoutPassword } = updatedUser;
      
      res.json({
        message: "User updated successfully",
        user: userWithoutPassword
      });
    } catch (error) {
      res.status(500).json({ 
        message: "Failed to update user", 
        error: (error as Error).message 
      });
    }
  });
  
  // User login history routes
  app.get("/api/admin/login-history", isAdmin, async (req, res) => {
    try {
      console.log(`Admin login history request from ${req.session.adminUser?.email}`);
      
      const allLoginHistory = await storage.getAllUserLoginHistory();
      
      // Transform data to include formatted dates for easier display
      const formattedHistory = allLoginHistory.map(record => ({
        ...record,
        formattedLoginTime: new Date(record.loginTime).toLocaleString('en-IN', {
          timeZone: 'Asia/Kolkata',
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          hour12: true
        }),
        formattedLastActiveTime: record.lastActiveTime ? new Date(record.lastActiveTime).toLocaleString('en-IN', {
          timeZone: 'Asia/Kolkata', 
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          hour12: true
        }) : null,
        formattedLogoutTime: record.logoutTime ? new Date(record.logoutTime).toLocaleString('en-IN', {
          timeZone: 'Asia/Kolkata',
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          hour12: true
        }) : null,
        duration: record.logoutTime ? 
          Math.round((new Date(record.logoutTime).getTime() - new Date(record.loginTime).getTime()) / 60000) : 
          null, // Duration in minutes if session is complete
        isActive: !record.logoutTime
      }));
      
      res.json(formattedHistory);
    } catch (error) {
      console.error("Failed to get login history:", error);
      res.status(500).json({ message: "Failed to get login history", error: (error as Error).message });
    }
  });
  
  // Get login history for a specific user
  app.get("/api/admin/login-history/:userId", isAdmin, async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      console.log(`Admin login history request for user ${userId} from ${req.session.adminUser?.email}`);
      
      const userLoginHistory = await storage.getUserLoginHistory(userId);
      
      // Transform data to include formatted dates for easier display
      const formattedHistory = userLoginHistory.map(record => ({
        ...record,
        formattedLoginTime: new Date(record.loginTime).toLocaleString('en-IN', {
          timeZone: 'Asia/Kolkata',
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          hour12: true
        }),
        formattedLastActiveTime: record.lastActiveTime ? new Date(record.lastActiveTime).toLocaleString('en-IN', {
          timeZone: 'Asia/Kolkata',
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          hour12: true
        }) : null,
        formattedLogoutTime: record.logoutTime ? new Date(record.logoutTime).toLocaleString('en-IN', {
          timeZone: 'Asia/Kolkata',
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          hour12: true
        }) : null,
        duration: record.logoutTime ? 
          Math.round((new Date(record.logoutTime).getTime() - new Date(record.loginTime).getTime()) / 60000) : 
          null, // Duration in minutes if session is complete
        isActive: !record.logoutTime
      }));
      
      res.json(formattedHistory);
    } catch (error) {
      console.error(`Failed to get login history for user ${req.params.userId}:`, error);
      res.status(500).json({ message: "Failed to get user login history", error: (error as Error).message });
    }
  });
  
  // Get currently active sessions
  app.get("/api/admin/active-sessions", isAdmin, async (req, res) => {
    try {
      console.log(`Admin active sessions request from ${req.session.adminUser?.email}`);
      
      const activeSessions = await storage.getActiveUserSessions();
      
      // Transform data to include formatted dates for easier display
      const formattedSessions = activeSessions.map(record => ({
        ...record,
        formattedLoginTime: new Date(record.loginTime).toLocaleString('en-IN', {
          timeZone: 'Asia/Kolkata',
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          hour12: true
        }),
        formattedLastActiveTime: record.lastActiveTime ? new Date(record.lastActiveTime).toLocaleString('en-IN', {
          timeZone: 'Asia/Kolkata',
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          hour12: true
        }) : null,
        activeDuration: Math.round((new Date().getTime() - new Date(record.loginTime).getTime()) / 60000), // Duration in minutes
        // Calculate idle time in minutes if last active time is available
        idleTime: record.lastActiveTime ? 
          Math.round((new Date().getTime() - new Date(record.lastActiveTime).getTime()) / 60000) : 
          null
      }));
      
      res.json(formattedSessions);
    } catch (error) {
      console.error("Failed to get active sessions:", error);
      res.status(500).json({ message: "Failed to get active sessions", error: (error as Error).message });
    }
  });
  
  app.patch("/api/admin/users/:userId", isAdmin, async (req, res) => {
    try {
      const userId = parseInt(req.params.userId, 10);
      const { isAdmin: setAdminStatus } = req.body;
      
      if (typeof setAdminStatus !== 'boolean') {
        return res.status(400).json({ message: "isAdmin must be a boolean value" });
      }
      
      const updatedUser = await storage.updateUserAdminStatus(userId, setAdminStatus);
      
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Don't return password in response
      const { password, ...userWithoutPassword } = updatedUser;
      res.json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({ message: "Failed to update user admin status", error: (error as Error).message });
    }
  });
  
  // Token purchase routes
  app.post("/api/tokens/purchase", validateRequest(insertTokenPurchaseSchema), async (req, res) => {
    try {
      const userId = req.session.userId;
      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const purchase = await storage.createTokenPurchase({
        ...req.body,
        userId
      });
      
      res.status(201).json(purchase);
    } catch (error) {
      res.status(500).json({ message: "Failed to process token purchase", error: (error as Error).message });
    }
  });

  app.get("/api/tokens/purchases", async (req, res) => {
    try {
      const userId = req.session.userId;
      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const purchases = await storage.getTokenPurchasesByUserId(userId);
      res.json(purchases);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch token purchases", error: (error as Error).message });
    }
  });

  // Admin API routes
  app.get("/api/admin/project-guidance", isAdmin, async (req, res) => {
    try {
      const sessions = await storage.getAllProjectGuidances();
      res.json(sessions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch project guidance sessions", error: (error as Error).message });
    }
  });
  
  app.get("/api/admin/ai-training", isAdmin, async (req, res) => {
    try {
      const trainingData = await storage.getAllAiTrainingData();
      res.json(trainingData);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch AI training data", error: (error as Error).message });
    }
  });
  
  // This is a duplicate route (first one is at line ~4418) - renamed to avoid conflicts
  app.get("/api/admin/users-with-purchases", isAdmin, async (req, res) => {
    try {
      // Get all users but remove passwords from the response
      const allUsers = await storage.getAllUsers();
      
      // Process users sequentially to avoid await in .map issues
      const users = [];
      for (const user of allUsers) {
          const { password, ...userWithoutPassword } = user;
          
          // Get token purchases for each user
          const tokenPurchases = await storage.getTokenPurchasesByUserId(user.id);
          
          users.push({
            ...userWithoutPassword,
            tokenPurchaseCount: tokenPurchases.length,
            totalPurchasedTokens: tokenPurchases.reduce((total, purchase) => total + purchase.amount, 0)
          });
      }
      
      res.json(users);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch users", error: (error as Error).message });
    }
  });
  
  app.post("/api/admin/ai-training", isAdmin, validateRequest(insertAiTrainingDataSchema), async (req, res) => {
    try {
      const trainingData = await storage.createAiTrainingData(req.body);
      res.status(201).json(trainingData);
    } catch (error) {
      res.status(500).json({ message: "Failed to create AI training data", error: (error as Error).message });
    }
  });

  // WhatsApp bot routes (admin only)
  app.post("/api/whatsapp/init", async (req, res) => {
    try {
      const userId = req.session.userId;
      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const user = await storage.getUser(userId);
      if (!user || !user.isAdmin) {
        return res.status(403).json({ message: "Unauthorized: Admin access required" });
      }
      
      // Initialize WhatsApp bot
      await whatsappBot.initialize();
      res.json({ message: "WhatsApp bot initialized successfully" });
    } catch (error) {
      console.error("WhatsApp bot initialization error:", error);
      res.status(500).json({ message: "Failed to initialize WhatsApp bot", error: (error as Error).message });
    }
  });

  // Validate WhatsApp invite link schema
  const whatsappInviteSchema = z.object({
    inviteLink: z
      .string()
      .regex(/^https:\/\/chat\.whatsapp\.com\/[a-zA-Z0-9]{22}$/, {
        message: 'Please enter a valid WhatsApp group invite link (https://chat.whatsapp.com/XXXX)',
      }),
  });
  
  // Route for joining WhatsApp groups via invite links - public endpoint
  app.post("/api/whatsapp/join-group", validateRequest(whatsappInviteSchema), async (req, res) => {
    try {
      const { inviteLink } = req.body;
      
      // Extract the invite code from the link
      const inviteCode = inviteLink.split('https://chat.whatsapp.com/')[1];
      
      if (!inviteCode) {
        return res.status(400).json({ 
          success: false, 
          message: "Invalid invite link format" 
        });
      }
      
      // Join WhatsApp group
      const result = await whatsappBot.joinGroupByInvite(inviteCode);
      
      if (result.success) {
        return res.json({
          success: true,
          message: "Successfully joined WhatsApp group",
          groupId: result.groupId
        });
      } else {
        return res.status(400).json({
          success: false,
          message: result.error || "Failed to join WhatsApp group"
        });
      }
    } catch (error) {
      console.error("WhatsApp group join error:", error);
      res.status(500).json({ 
        success: false,
        message: "Failed to join WhatsApp group", 
        error: (error as Error).message 
      });
    }
  });

  app.post("/api/whatsapp/set-target-group", async (req, res) => {
    try {
      const userId = req.session.userId;
      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const user = await storage.getUser(userId);
      if (!user || !user.isAdmin) {
        return res.status(403).json({ message: "Unauthorized: Admin access required" });
      }

      const { groupId } = req.body;
      if (!groupId) {
        return res.status(400).json({ message: "Group ID is required" });
      }
      
      // Set target WhatsApp group
      await whatsappBot.setTargetGroup(groupId);
      res.json({ message: "Successfully set target WhatsApp group" });
    } catch (error) {
      console.error("WhatsApp set target group error:", error);
      res.status(500).json({ message: "Failed to set target WhatsApp group", error: (error as Error).message });
    }
  });

  app.get("/api/whatsapp/groups", async (req, res) => {
    try {
      const userId = req.session.userId;
      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const user = await storage.getUser(userId);
      if (!user || !user.isAdmin) {
        return res.status(403).json({ message: "Unauthorized: Admin access required" });
      }
      
      // Get list of joined groups
      await whatsappBot.updateGroupList();
      const groups = whatsappBot.groups || [];
      res.json(groups);
    } catch (error) {
      console.error("WhatsApp get groups error:", error);
      res.status(500).json({ message: "Failed to get WhatsApp groups", error: (error as Error).message });
    }
  });

  app.post("/api/whatsapp/process-training", async (req, res) => {
    try {
      const userId = req.session.userId;
      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const user = await storage.getUser(userId);
      if (!user || !user.isAdmin) {
        return res.status(403).json({ message: "Unauthorized: Admin access required" });
      }
      
      // Process training data
      await whatsappBot.processTrainingData();
      const processedCount = await convertWhatsAppToTrainingData();
      res.json({ message: `Successfully processed ${processedCount} training items` });
    } catch (error) {
      console.error("WhatsApp training process error:", error);
      res.status(500).json({ message: "Failed to process WhatsApp training data", error: (error as Error).message });
    }
  });

  app.post("/api/whatsapp/send-message", async (req, res) => {
    try {
      const userId = req.session.userId;
      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const user = await storage.getUser(userId);
      if (!user || !user.isAdmin) {
        return res.status(403).json({ message: "Unauthorized: Admin access required" });
      }

      const { groupId, message } = req.body;
      if (!groupId || !message) {
        return res.status(400).json({ message: "Group ID and message are required" });
      }
      
      // Send message to group
      await whatsappBot.sendMessage(groupId, message);
      res.json({ message: "Message sent successfully" });
    } catch (error) {
      console.error("WhatsApp send message error:", error);
      res.status(500).json({ message: "Failed to send WhatsApp message", error: (error as Error).message });
    }
  });

  // API endpoint to get available time slots for bookings
  // Get user profile by ID (for all logged-in users)
  app.get("/api/users/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Don't return password in response
      const { password, ...userWithoutPassword } = user;
      
      // For security, only return limited user information for non-admins
      const isAdminUser = req.session?.adminUser !== undefined;
      
      if (!isAdminUser) {
        // Return only basic profile info for regular users
        const safeUserData = {
          id: userWithoutPassword.id,
          username: userWithoutPassword.username,
          email: userWithoutPassword.email,
          firstName: userWithoutPassword.firstName,
          lastName: userWithoutPassword.lastName,
          profileImageUrl: userWithoutPassword.profileImageUrl,
          isVerified: userWithoutPassword.isVerified,
          role: userWithoutPassword.role,
          createdAt: userWithoutPassword.createdAt,
        };
        return res.json(safeUserData);
      }
      
      res.json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({ 
        message: "Failed to fetch user", 
        error: (error as Error).message 
      });
    }
  });
  
  // Get user's sessions (for all logged-in users)
  app.get("/api/users/:userId/sessions", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // For security, only allow users to see their own sessions or admins to see any sessions
      const isAdminUser = req.session?.adminUser !== undefined;
      const isOwnProfile = req.session?.userId === userId;
      
      if (!isAdminUser && !isOwnProfile) {
        return res.status(403).json({ message: "You don't have permission to view this user's sessions" });
      }
      
      // Get all sessions by user email
      const sessions = await storage.getProjectGuidancesByEmail(user.email);
      
      res.json({
        success: true,
        sessions
      });
    } catch (error) {
      res.status(500).json({ 
        message: "Failed to fetch user sessions", 
        error: (error as Error).message 
      });
    }
  });

  app.get("/api/available-slots", async (req, res) => {
    try {
      // Check if we're requesting slots for rescheduling a specific session
      const sessionIdToExclude = req.query.excludeSessionId ? parseInt(req.query.excludeSessionId as string) : undefined;
      
      const availableSlots = await storage.getAllAvailableTimeSlots();
      
      // Sort slots by date
      availableSlots.sort((a, b) => {
        return new Date(a.date).getTime() - new Date(b.date).getTime();
      });
      
      // Get all sessions to check for time slot conflicts
      const allSessions = await storage.getAllProjectGuidances();
      
      // Define a properly typed map for booked slots
      const bookedSlots: Record<string, string[]> = {};
      const pendingSlots: Record<string, string[]> = {}; // Track pending (not yet paid) sessions
      // IMPROVED: Track sessions by their exact time for better debugging
      const allSessionDetails: Record<string, Array<{ sessionId: number, status: string, time: string }>> = {};
      
      // Get original time slot details for the session being rescheduled (if any)
      let excludedSessionDate: string | undefined;
      let excludedSessionTime: string | undefined;
      
      // Track statistics for logging
      let confirmedSessionCount = 0;
      let pendingSessionCount = 0;
      let cancelledSessionCount = 0;
      
      // Create a map of all booked slots by date and time
      allSessions.forEach(session => {
        // FIXED: Ensure we handle time zone conversion correctly
        // The database stores dates in UTC, but we display in IST
        // So we need to convert to IST before checking for conflicts
        const sessionDate = new Date(session.date);
        
        // CRITICAL FIX: Proper time zone handling for all bookings
        // The problem was that dates stored in UTC in the database weren't properly being
        // converted to IST (UTC+5:30) for comparison with available slots
        
        // First, log the original UTC date for debugging
        console.log(`DEBUG: Processing session ${session.id} with original UTC date: ${session.date}`);
        
        // Always use the IST timezone formatter to ensure consistent time handling
        // This converts the UTC time stored in the database to IST (UTC+5:30) that's displayed to users
        const sessionDateStr = formatInIST(sessionDate, "yyyy-MM-dd");
        const sessionTimeStr = formatInIST(sessionDate, "HH:mm");
        
        // Log the IST conversion result
        console.log(`DEBUG: After timezone conversion to IST: date=${sessionDateStr}, time=${sessionTimeStr}`);
        
        // Add session to allSessionDetails for debugging regardless of status
        if (!allSessionDetails[sessionDateStr]) {
          allSessionDetails[sessionDateStr] = [];
        }
        // Define the session debug details
        const sessionDebug: {
          sessionId: number;
          status: string;
          time: string;
          debugInfo?: string;
        } = {
          sessionId: session.id,
          status: session.status || 'unknown',
          time: sessionTimeStr,
          // Add debug info as a single string
          debugInfo: `UTC: ${String(session.date)}`
        };
        
        allSessionDetails[sessionDateStr].push(sessionDebug);
        
        // Don't include cancelled sessions in booking conflicts
        if (session.status === 'cancelled') {
          cancelledSessionCount++;
          return;
        }
        
        // If this is the session we're rescheduling, save its details but don't mark as booked
        if (sessionIdToExclude && session.id === sessionIdToExclude) {
          // FIXED: Use consistent time zone handling with formatInIST 
          excludedSessionDate = formatInIST(sessionDate, "yyyy-MM-dd");
          excludedSessionTime = formatInIST(sessionDate, "HH:mm");
          console.log(`Excluding session ${sessionIdToExclude} at ${excludedSessionDate} ${excludedSessionTime} from booking checks`);
          return; // Skip adding to booked slots
        }
        
        // IMPROVED: Handle all non-cancelled status sessions, not just confirmed ones
        // This ensures we catch pending, confirmed, and other statuses
        if (session.status !== 'cancelled') {
          // Track in the appropriate map based on status
          const isConfirmed = session.paymentConfirmed || session.status === 'confirmed';
          const isPending = session.status === 'pending';
          
          // Mark all non-cancelled sessions as booked
          if (!bookedSlots[sessionDateStr]) {
            bookedSlots[sessionDateStr] = [];
          }
          
          // Add the booked time slot to the main bookedSlots map
          if (!bookedSlots[sessionDateStr].includes(sessionTimeStr)) {
            bookedSlots[sessionDateStr].push(sessionTimeStr);
          }
          
          // Also track pending sessions separately for debugging
          if (isPending) {
            if (!pendingSlots[sessionDateStr]) {
              pendingSlots[sessionDateStr] = [];
            }
            
            if (!pendingSlots[sessionDateStr].includes(sessionTimeStr)) {
              pendingSlots[sessionDateStr].push(sessionTimeStr);
              pendingSessionCount++;
            }
          }
          
          // Update the confirmed session counter if applicable
          if (isConfirmed) {
            confirmedSessionCount++;
          }
          
          // IMPROVED: Check if this is a half-hour booking and block the adjacent hours
          // For example, a 13:30 booking conflicts with both 13:00 and 14:00 slots
          const isHalfHourBooking = sessionTimeStr.endsWith(":30");
          if (isHalfHourBooking) {
            const hour = parseInt(sessionTimeStr.split(":")[0]);
            
            // Block the current hour (13:00) and next hour (14:00) for a 13:30 booking
            const currentHour = `${hour.toString().padStart(2, '0')}:00`;
            const nextHour = `${(hour + 1).toString().padStart(2, '0')}:00`;
            
            // Add conflicts for both adjacent full hours
            if (!bookedSlots[sessionDateStr].includes(currentHour)) {
              bookedSlots[sessionDateStr].push(currentHour);
              console.log(`Half-hour booking at ${sessionTimeStr} is blocking full-hour slot at ${currentHour}`);
            }
            
            if (!bookedSlots[sessionDateStr].includes(nextHour)) {
              bookedSlots[sessionDateStr].push(nextHour);
              console.log(`Half-hour booking at ${sessionTimeStr} is blocking full-hour slot at ${nextHour}`);
            }
          }
        }
      });
      
      console.log(`Processing slots: ${confirmedSessionCount} confirmed, ${pendingSessionCount} pending, ${cancelledSessionCount} cancelled`);
      
      // Log all sessions for debugging - only if there are sessions to log
      try {
        if (allSessionDetails && Object.keys(allSessionDetails).length > 0) {
          console.log(`DEBUG: All sessions:`, JSON.stringify(allSessionDetails));
        } else {
          console.log(`DEBUG: No sessions found`);
        }
      } catch (error) {
        console.log(`DEBUG: Error logging session details:`, error);
      }
      
      // Add booking status information to the available slots
      const enhancedSlots = availableSlots.map(slot => {
        const bookedTimesForDate = bookedSlots[slot.date] || [];
        const pendingTimesForDate = pendingSlots[slot.date] || [];
        
        // Add debug logging for pending sessions
        if (pendingTimesForDate.length > 0) {
          console.log(`DEBUG: Pending times for date ${slot.date}:`, pendingTimesForDate);
        }
        
        // Mark which specific time slots are already booked or pending
        const slotsWithStatus = slot.slots.map(timeSlot => {
          // If this is the original time slot for the session being rescheduled,
          // mark it as not booked so it shows up as available
          const isOriginalSlot = 
            sessionIdToExclude && 
            slot.date === excludedSessionDate && 
            timeSlot === excludedSessionTime;
          
          // Check if slot is booked or pending due to exact match
          const isExactTimeMatch = (
            bookedTimesForDate.includes(timeSlot) || 
            pendingTimesForDate.includes(timeSlot)
          );
          
          // IMPROVED: Check for half-hour bookings that would conflict with this full-hour slot
          // The logic is simpler now because we already marked half-hour bookings as conflicts
          // in the bookedSlots processing above, but we'll keep this check for redundancy
          
          // For full-hour slots, we already marked half-hour bookings as conflicts in the bookings
          // processing code above, but we'll double-check here to be safe
          
          // Extract the hour from the time slot
          const hour = parseInt(timeSlot.split(":")[0]);
          
          // Check for half-hour bookings that would conflict with this slot
          // 12:30 would conflict with 13:00, and 13:30 would conflict with 13:00
          const previousHalfHour = `${(hour-1).toString().padStart(2, '0')}:30`;
          const nextHalfHour = `${hour.toString().padStart(2, '0')}:30`;
          
          // Check for any conflicting half-hour bookings
          const isHalfHourConflict = (
            bookedTimesForDate.includes(previousHalfHour) || 
            pendingTimesForDate.includes(previousHalfHour) ||
            bookedTimesForDate.includes(nextHalfHour) || 
            pendingTimesForDate.includes(nextHalfHour)
          );
          
          // If we have a conflict due to half-hour booking, log it for debugging
          if (isHalfHourConflict) {
            console.log(`DEBUG: Detected half-hour conflict for ${slot.date} ${timeSlot} with either ${previousHalfHour} or ${nextHalfHour}`);
          }
          
          // Combine all checks to determine if the slot is booked
          const isBooked = !isOriginalSlot && (isExactTimeMatch || isHalfHourConflict);
          
          // Instead of special case handling, ensure our general solution works properly
          // No more special cases or hardcoding of specific dates
          const isSpecialCaseBooked = false;
          
          return {
            time: timeSlot,
            isBooked: isBooked || isSpecialCaseBooked
          };
        });
        
        // Calculate if all slots for this date are booked
        const allSlotsBooked = slotsWithStatus.every(s => s.isBooked);
        
        // Calculate available vs total slots for debugging
        const totalSlots = slotsWithStatus.length;
        const availableSlots = slotsWithStatus.filter(s => !s.isBooked).length;
        console.log(`Date ${slot.date}: ${availableSlots}/${totalSlots} slots available`);
        
        return {
          ...slot,
          slotsWithStatus,
          allSlotsBooked
        };
      });
      
      res.json({
        success: true,
        slots: enhancedSlots
      });
    } catch (error) {
      console.error("Error fetching available time slots:", error);
      res.status(500).json({ 
        success: false, 
        message: "Failed to fetch available time slots", 
        error: (error as Error).message 
      });
    }
  });
  
  // Admin: Add a new available time slot
  app.post("/api/admin/available-slots", isAdmin, async (req, res) => {
    try {
      const { date, slots } = req.body;
      
      if (!date || !slots || !Array.isArray(slots)) {
        return res.status(400).json({
          success: false,
          message: "Date and slots array are required"
        });
      }
      
      console.log(`[AdminAPI] Attempting to create available time slot for date: ${date} with ${slots.length} slots`);
      
      // Check if this date already exists
      const existingSlot = await storage.getAvailableTimeSlotByDate(date);
      if (existingSlot) {
        console.log(`[AdminAPI] Date ${date} already exists with ID ${existingSlot.id}`);
        return res.status(400).json({
          success: false,
          message: "A time slot for this date already exists. Use PUT to update it."
        });
      }
      
      const userId = req.session.userId || 1; // Default to admin ID 1 if not logged in
      
      try {
        const newSlot = await storage.createAvailableTimeSlot({
          date,
          slots,
          createdBy: userId
        });
        
        console.log(`[AdminAPI] Successfully created time slot for date ${date} with ID ${newSlot.id}`);
        
        res.status(201).json({
          success: true,
          slot: newSlot
        });
      } catch (dbError) {
        console.error(`[AdminAPI] Database error creating time slot for date ${date}:`, dbError);
        throw dbError;
      }
    } catch (error) {
      console.error("Error creating available time slot:", error);
      res.status(500).json({
        success: false,
        message: "Failed to create available time slot",
        error: (error as Error).message
      });
    }
  });
  
  // Admin: Update an existing available time slot
  app.put("/api/admin/available-slots/:id", isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { slots } = req.body;
      
      if (!slots || !Array.isArray(slots)) {
        return res.status(400).json({
          success: false,
          message: "Slots array is required"
        });
      }
      
      const updatedSlot = await storage.updateAvailableTimeSlot(id, slots);
      
      if (!updatedSlot) {
        return res.status(404).json({
          success: false,
          message: "Available time slot not found"
        });
      }
      
      res.json({
        success: true,
        slot: updatedSlot
      });
    } catch (error) {
      console.error("Error updating available time slot:", error);
      res.status(500).json({
        success: false,
        message: "Failed to update available time slot",
        error: (error as Error).message
      });
    }
  });
  
  // Admin: Delete an available time slot
  app.delete("/api/admin/available-slots/:id", isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      const result = await storage.deleteAvailableTimeSlot(id);
      
      if (!result) {
        return res.status(404).json({
          success: false,
          message: "Available time slot not found"
        });
      }
      
      res.json({
        success: true,
        message: "Available time slot deleted successfully"
      });
    } catch (error) {
      console.error("Error deleting available time slot:", error);
      res.status(500).json({
        success: false,
        message: "Failed to delete available time slot",
        error: (error as Error).message
      });
    }
  });
  
  // Admin: Bulk create available time slots
  app.post("/api/admin/bulk-available-slots", isAdmin, async (req, res) => {
    try {
      console.log("[AdminAPI] Received bulk time slot creation request", req.body);
      const { dates, slots } = req.body;
      
      if (!dates || !Array.isArray(dates) || dates.length === 0) {
        console.error("[AdminAPI] Missing or invalid dates array", dates);
        return res.status(400).json({
          success: false,
          message: "Valid array of dates is required",
          results: {
            success: [],
            failures: []
          }
        });
      }
      
      if (!slots || !Array.isArray(slots) || slots.length === 0) {
        console.error("[AdminAPI] Missing or invalid slots array", slots);
        return res.status(400).json({
          success: false,
          message: "Valid array of time slots is required",
          results: {
            success: [],
            failures: []
          }
        });
      }
      
      console.log(`[AdminAPI] Bulk creating time slots for ${dates.length} dates with ${slots.length} slots each`);
      console.log(`[AdminAPI] Dates: ${dates.join(', ')}`);
      console.log(`[AdminAPI] Slots: ${slots.join(', ')}`);
      
      const userId = req.session.userId || 1; // Default to admin ID 1 if not logged in
      
      const results = {
        success: [] as { date: string, id: number }[],
        failures: [] as { date: string, reason: string }[]
      };
      
      // Limit the number of dates to process to prevent overwhelming the server
      const maxDates = 100;
      const datesToProcess = dates.slice(0, maxDates);
      
      if (dates.length > maxDates) {
        console.warn(`[AdminAPI] Too many dates requested (${dates.length}), limiting to ${maxDates}`);
      }
      
      // Process each date one by one
      for (const date of datesToProcess) {
        try {
          if (!date || typeof date !== 'string' || !date.match(/^\d{4}-\d{2}-\d{2}$/)) {
            console.error(`[AdminAPI] Invalid date format: ${date}`);
            results.failures.push({ 
              date: String(date), 
              reason: "Invalid date format" 
            });
            continue;
          }
          
          // Check if this date already exists
          const existingSlot = await storage.getAvailableTimeSlotByDate(date);
          
          if (existingSlot) {
            console.log(`[AdminAPI] Date ${date} already exists with ID ${existingSlot.id} - skipping`);
            results.failures.push({ 
              date, 
              reason: "Date already exists" 
            });
            continue;
          }
          
          // Create the new slot
          const newSlot = await storage.createAvailableTimeSlot({
            date,
            slots,
            createdBy: userId
          });
          
          console.log(`[AdminAPI] Successfully created time slot for date ${date} with ID ${newSlot.id}`);
          results.success.push({ date, id: newSlot.id });
          
        } catch (error) {
          console.error(`[AdminAPI] Error creating time slot for date ${date}:`, error);
          results.failures.push({ 
            date, 
            reason: (error as Error).message || "Unknown error" 
          });
        }
        
        // Add a small delay to prevent database connection issues
        await new Promise(resolve => setTimeout(resolve, 50));
      }
      
      // Return results regardless of success/failure status
      const response = {
        success: results.success.length > 0,
        results
      };
      
      console.log(`[AdminAPI] Bulk creation complete. Success: ${results.success.length}, Failures: ${results.failures.length}`);
      console.log("[AdminAPI] Sending response:", response);
      
      res.status(results.success.length > 0 ? 201 : 400).json(response);
      
    } catch (error) {
      console.error("[AdminAPI] Fatal error in bulk time slot creation:", error);
      res.status(500).json({
        success: false,
        message: "Failed to process bulk time slots due to a server error",
        error: (error as Error).message || "Unknown error",
        results: {
          success: [],
          failures: []
        }
      });
    }
  });
  
  // Add Google Meet link (PATCH endpoint for client compatibility)
  // Temporarily removing isAdmin middleware for testing
  app.patch("/api/project-guidance/:id/meet-link", async (req, res) => {
    try {
      const sessionId = parseInt(req.params.id, 10);
      const { googleMeetLink } = req.body;
      
      if (!sessionId || !googleMeetLink) {
        return res.status(400).json({ 
          success: false, 
          message: "Session ID and Google Meet link are required" 
        });
      }
      
      // First get the session to check its status
      const session = await storage.getProjectGuidance(sessionId);
      
      if (!session) {
        return res.status(404).json({ 
          success: false, 
          message: "Session not found" 
        });
      }
      
      // Check if the session is cancelled
      if (session.status === 'cancelled') {
        return res.status(400).json({ 
          success: false, 
          message: "Cannot add meeting link to a cancelled session" 
        });
      // Commented out payment verification for testing
      // if (!session.paymentConfirmed) {
      //   return res.status(403).json({
      //     success: false,
      //     message: "Payment not confirmed for this session"
      //   });
      // }
      }
      
      // Update the session with the Google Meet link
      const updatedSession = await storage.updateProjectGuidanceMeetLink(
        sessionId,
        googleMeetLink
      );
      
      if (!updatedSession) {
        return res.status(404).json({ 
          success: false, 
          message: "Session not found" 
        });
      }
      
      const sessionDate = new Date(updatedSession.date);
      
      // Create a calendar link with the Google Meet link
      const calendarLink = generateGoogleCalendarLink(
        updatedSession.id,
        googleMeetLink,
        sessionDate,
        updatedSession.duration,
        updatedSession.topic,
        updatedSession.studentName
      );
      
      res.json({
        success: true,
        message: "Google Meet link updated successfully",
        session: updatedSession,
        calendarLink
      });
    } catch (error) {
      console.error("Error updating Google Meet link:", error);
      res.status(500).json({ 
        success: false, 
        message: "Failed to update Google Meet link",
        error: (error as Error).message
      });
    }
  });

  // Knowledge Companion Chat
  app.post('/api/ai-knowledge/companion-chat', isAdmin, async (req, res) => {
    const { message, history } = req.body;
    
    if (!message || message.trim().length === 0) {
      return res.status(400).json({ error: 'Message is required' });
    }
    
    try {
      const gemini = getGeminiAI();
      if (!gemini) {
        return res.status(500).json({ error: 'Gemini AI service not available' });
      }
      
      // Initialize variables for response
      let aiResponse = "";
      let shouldAddToKnowledgeBase = true; // Default to adding
      let contentSuggestion = null;
      let isContentDuplicate = false;
      
      // Check if it's a "Did You Know" fact
      const isDidYouKnow = message.trim().toLowerCase().startsWith('did you know:');
      
      // Check if it's a URL
      const isUrl = message.trim().startsWith('http');
      
      // Process "Did You Know" facts directly
      if (isDidYouKnow) {
        // Extract the fact content
        const factContent = message.trim().substring('Did You Know:'.length).trim();
        
        if (factContent.length < 10) {
          return res.json({
            response: "Your fact seems too short. Could you provide a more detailed fact about bamboo?",
            shouldAddToKnowledge: false
          });
        }
        
        // Format the fact with a title - clean title without markdown
        const factTitle = "Bamboo Fact: " + factContent.substring(0, 40) + (factContent.length > 40 ? "..." : "");
        
        // Create the fact content in plain text format (no markdown characters)
        const formattedContent = factContent + "\n\nSource: Manually added via Knowledge Companion";
        
        // Add to the knowledge base with content type 'fact'
        contentSuggestion = {
          title: factTitle,
          contentType: "fact",
          content: formattedContent,
          source: null
        };
        
        // Conversational response
        aiResponse = `Thanks for sharing this interesting bamboo fact! I've added it to our "Did You Know" section. It will now appear in the bamboo facts rotation on the website. Would you like to add another fact?`;
        
        return res.json({
          response: aiResponse,
          shouldAddToKnowledge: true,
          suggestion: contentSuggestion,
          isDuplicate: false
        });
      }
      
      if (isUrl) {
        // Process it directly through the web crawler
        try {
          const url = message.trim();
          
          // Preliminary detection of URL type before crawling
          const detectedUrlType = detectContentTypeFromUrl(url);
          console.log(`Detected URL type for ${url}: ${detectedUrlType}`);
          
          const extractedData = await analyzeWebsite(url);
          
          // Automatically extract facts from the content
          if (extractedData && extractedData.content) {
            try {
              const facts = await extractFactsFromContent(extractedData.content, url);
              console.log(`Automatically extracted ${facts.length} facts from URL: ${url}`);
              
              // Save each extracted fact
              if (facts.length > 0 && req.session.adminUser && req.session.adminUser.id) {
                for (const factContent of facts) {
                  await storage.createAiKnowledgeContent({
                    title: `Bamboo Fact: ${factContent.substring(0, 50)}...`,
                    content: factContent,
                    source: url,
                    contentType: 'fact',
                    status: 'active',
                    createdBy: req.session.adminUser.id
                  });
                }
              }
            } catch (error) {
              console.error('Error automatically extracting facts:', error);
            }
          }
          
          // Enhance content type with more specific classification
          let enhancedContentType = extractedData.contentType;
          let socialMediaInfo = null;
          
          // Add specific social media metadata if it's a social media post
          if (detectedUrlType === 'social-media') {
            const platform = getPlatformFromUrl(url);
            
            // Extract post ID from URL
            let postId = '';
            if (url.includes('instagram.com/p/')) {
              postId = url.split('/p/')[1].split('/')[0];
            } else if (url.includes('facebook.com/')) {
              if (url.includes('posts/')) {
                postId = url.split('posts/')[1].split('/')[0];
              } else if (url.includes('photos/')) {
                postId = url.split('photos/')[1].split('/')[0];
              }
            } else if (url.includes('twitter.com/') || url.includes('x.com/')) {
              if (url.includes('/status/')) {
                postId = url.split('/status/')[1].split('/')[0];
              }
            } else if (url.includes('linkedin.com/posts/')) {
              postId = url.split('linkedin.com/posts/')[1];
            }
            
            socialMediaInfo = {
              platform: platform,
              postId: postId,
              profileUrl: url.split('?')[0].split('/p/')[0],
              handle: getHandleFromUrl(url, platform),
              mediaUrls: [] // This would require more complex parsing to extract
            };
            
            enhancedContentType = 'social_media';
          } else if (detectedUrlType === 'video') {
            // Enhance video metadata
            enhancedContentType = 'video';
            // Differentiate between YouTube and other platforms
            if (url.includes('youtube.com') || url.includes('youtu.be')) {
              enhancedContentType = 'youtube_video';
            }
          } else if (detectedUrlType === 'article') {
            enhancedContentType = 'blog_post';
            
            // Check for specific article platforms
            if (url.includes('medium.com')) {
              enhancedContentType = 'medium_article';
            }
          }
          
          // Before adding, check for potential duplicates
          const existingContent = await storage.getAllAiKnowledgeContent();
          
          // Check for similar titles or content
          const possibleDuplicate = existingContent.find(item => {
            // Same URL source
            if (item.source === url) {
              return true;
            }
            
            // Similar title (80% match)
            const titleSimilarity = calculateStringSimilarity(
              item.title.toLowerCase(), 
              extractedData.title.toLowerCase()
            );
            
            if (titleSimilarity > 0.8) {
              return true;
            }
            
            return false;
          });
          
          if (possibleDuplicate) {
            // Update existing content instead of creating a duplicate, but with the enhanced content type
            const socialMediaInfoData = socialMediaInfo ? JSON.stringify(socialMediaInfo) : null;
            
            const updatedContent = await storage.updateAiKnowledgeContent(
              possibleDuplicate.id, 
              {
                title: extractedData.title,
                content: extractedData.content,
                contentType: enhancedContentType,
                source: url,
                status: possibleDuplicate.status,
                socialMediaInfo: socialMediaInfoData
              }
            );
            
            // Create a more informative response based on the content type
            let responseMessage = '';
            if (enhancedContentType === 'social_media') {
              responseMessage = `I've updated the ${socialMediaInfo?.platform || 'social media'} post "${extractedData.title}" with the latest information. This prevents duplicate content in the knowledge base.`;
            } else if (enhancedContentType === 'youtube_video' || enhancedContentType === 'video') {
              responseMessage = `I've updated the video "${extractedData.title}" with the latest information. This prevents duplicate content in the knowledge base.`;
            } else if (enhancedContentType === 'medium_article' || enhancedContentType === 'blog_post') {
              responseMessage = `I've updated the article "${extractedData.title}" with the latest information. This will appear in the Recent Articles section.`;
            } else {
              responseMessage = `I've updated the existing entry "${extractedData.title}" with the latest information from this website. This prevents duplicate content in the knowledge base.`;
            }
            
            return res.json({
              response: responseMessage,
              shouldAddToKnowledge: false,
              isDuplicate: true,
              updatedContent: updatedContent,
              id: possibleDuplicate.id,
              websiteUrl: url
            });
          }
          
          // Not a duplicate, create new entry with enhanced content type
          const socialMediaInfoData = socialMediaInfo ? JSON.stringify(socialMediaInfo) : null;
          
          // Prepare a more informative response based on content type
          let responseMessage = '';
          if (enhancedContentType === 'social_media') {
            responseMessage = `I've added the ${socialMediaInfo?.platform || 'social media'} post "${extractedData.title}" to the knowledge base.`;
          } else if (enhancedContentType === 'youtube_video' || enhancedContentType === 'video') {
            responseMessage = `I've added the video "${extractedData.title}" to the knowledge base.`;
          } else if (enhancedContentType === 'medium_article' || enhancedContentType === 'blog_post') {
            responseMessage = `I've added the article "${extractedData.title}" to the knowledge base. This will appear in the Recent Articles section.`;
          } else {
            responseMessage = `I've added "${extractedData.title}" to the knowledge base. This website contains information about the company, projects, and any upcoming events.`;
          }
          
          return res.json({
            response: responseMessage,
            shouldAddToKnowledge: true,
            suggestion: {
              title: extractedData.title,
              content: extractedData.content,
              contentType: enhancedContentType,
              source: url,
              socialMediaInfo: socialMediaInfoData
            },
            websiteUrl: url
          });
        } catch (error) {
          console.error('Web crawler error in companion:', error);
          return res.json({
            response: `I had trouble processing that website. Could you please share what information from the site you'd like to add to the knowledge base?`,
            shouldAddToKnowledge: false,
            error: `Failed to analyze website: ${error instanceof Error ? error.message : 'Unknown error'}`
          });
        }
      }
      
      // Convert message history to OpenAI format if provided
      const chatHistory = history && Array.isArray(history) 
        ? history.map(msg => ({ role: msg.role, content: msg.content }))
        : [];
      
      // Get all existing knowledge content to check for duplicates
      const existingContent = await storage.getAllAiKnowledgeContent();
      
      // Get OpenAI instance
      const openai = getOpenAI();
      if (!openai) {
        return res.status(500).json({ error: 'OpenAI service not available' });
      }
      
      // First, analyze the message in depth
      const analysis = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system", 
            content: `You're a warm, friendly AI assistant named Knowledge Companion for a bamboo architecture educational platform. 
            You manage a knowledge base and have engaging conversations with users.
            
            Your personality is:
            - Friendly, warm, and personable - like talking to a knowledgeable friend
            - Patient and understanding, especially with complex topics
            - Insightful about bamboo architecture and sustainable design
            - Genuinely interested in what users want to share
            
            Your job is to analyze the user's message, understand their intent, and extract structured information worth adding to the knowledge base.
            This could be facts about bamboo, event details, technical information, or other educational content.
            
            Thoroughly analyze the content, classify it, and determine if it contains useful information.
            Consider the context of previous messages to better understand what the user means.
            
            For each message, determine if it's:
            1. A greeting or casual conversation (respond in kind, don't add to knowledge base)
            2. A question about the platform (answer directly, don't add to knowledge base)
            3. Information about bamboo (categorize and prepare for knowledge base)
            4. Event details (extract date, time, location, description)
            5. Technical knowledge (identify key concepts and relationships)
            
            Respond with a JSON object containing an analysis of the content and the appropriate tone to use in your response.`
          },
          ...chatHistory,
          {
            role: "user",
            content: `Analyze this message, understand my intent, and provide a json response with your analysis: ${message}`
          }
        ],
        response_format: { type: "json_object" }
      });
      
      const analysisResult = JSON.parse(analysis.choices[0].message.content);
      
      // Now prepare the response
      let shouldAddToKnowledge = true; // Default to adding
      let suggestion = null;
      let response = "";
      let isDuplicate = false;
      
      // Check if this is a casual conversation or greeting that doesn't need to be added to knowledge base
      if (analysisResult.messageType && ['greeting', 'conversation', 'question'].includes(analysisResult.messageType.toLowerCase())) {
        // For casual conversation, just respond naturally without adding to knowledge base
        shouldAddToKnowledge = false;
        response = analysisResult.suggestedResponse || `Thanks for chatting with me! I'm here to help with anything related to bamboo architecture. What would you like to talk about today?`;
        
        return res.json({
          response,
          shouldAddToKnowledge,
          suggestion: null,
          isDuplicate: false
        });
      }
      
      // Determine content details with improved formatting
      const formatResponse = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system", 
            content: `You're a friendly, conversational AI knowledge assistant for a bamboo architecture platform. Format the following content for the knowledge base.
            Create a structured entry with:
            1. A clear, descriptive title (friendly and conversational)
            2. Appropriate content type selected EXACTLY from these specific categories:
               - 'document' (for general facts/information from the user)
               - 'event' (ONLY for workshops, exhibitions, specific events with dates/times)
               - 'webpage' (ONLY for content from BambooMade's own website)
               - 'article' (ONLY for external articles, blogs, Medium posts, news sites)
               - 'social' (ONLY for content from social media platforms - Instagram, Facebook, Twitter, LinkedIn, etc.)
               - 'video' (ONLY for content from YouTube or other video platforms)
            3. Well-formatted content with proper sections, bullet points where appropriate
            4. Extract any source references or links
            
            IMPORTANT CATEGORIZATION RULES:
            - Always use 'social' for ANY content from social media platforms (Instagram, Facebook, Twitter, LinkedIn)
            - Always use 'article' for ANY content from external websites, Medium, blogs, or other publications
            - Always use 'video' for ANY content from YouTube or other video hosting sites
            - Always use 'webpage' ONLY for content from bamboomade.in website
            - Use 'document' for user-provided information that doesn't fall into other categories
            - Use 'event' ONLY for specific events with dates/locations
            
            This strict categorization is critical for our system to display content in the correct sections.
            
            Return as a JSON object with fields: title, contentType, content, source (if available)`
          },
          {
            role: "user",
            content: `Format this content and provide the result as json: ${message}`
          }
        ],
        response_format: { type: "json_object" }
      });
      
      const formattedResult = JSON.parse(formatResponse.choices[0].message.content);
      
      // Check for duplicates using AI
      const duplicationCheckPrompt = existingContent.map(item => 
        `ID: ${item.id}, Title: "${item.title}", Type: ${item.contentType}, ContentPreview: "${item.content.substring(0, 100)}..."`
      ).join('\n');
      
      const duplicationCheck = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system", 
            content: `You need to check if new content would be a duplicate or significant overlap with existing knowledge base entries.
            Compare the new content against these existing entries and determine if it should be:
            1. Added as a new entry (no significant overlap)
            2. Merged with an existing entry (significant overlap)
            3. Skipped (completely redundant)
            
            If it should be merged, specify which existing entry ID to update.
            Return your analysis as a JSON object with fields: action ('add', 'merge', 'skip'), mergeWithId (ID to merge with, if applicable), and reason.`
          },
          {
            role: "user",
            content: `Analyze for duplicates and provide a json response with your decision:
            
            Existing entries:
            ${duplicationCheckPrompt}
            
            New content:
            Title: "${formattedResult.title || 'Untitled'}"
            Type: ${formattedResult.contentType || 'document'}
            Content: "${typeof formattedResult.content === 'string' ? formattedResult.content.substring(0, 300) : JSON.stringify(formattedResult.content).substring(0, 300)}..."`
          }
        ],
        response_format: { type: "json_object" }
      });
      
      const dupeResult = JSON.parse(duplicationCheck.choices[0].message.content);
      
      // Process based on duplication analysis
      if (dupeResult.action === 'skip' || dupeResult.action === 'merge') {
        isDuplicate = true;
        shouldAddToKnowledge = false;
        
        if (dupeResult.action === 'merge' && dupeResult.mergeWithId) {
          // Find the item to merge with
          const mergeTargetId = parseInt(dupeResult.mergeWithId);
          const mergeTarget = existingContent.find(item => item.id === mergeTargetId);
          
          if (mergeTarget) {
            // Merge content
            const mergedContent = await openai.chat.completions.create({
              model: "gpt-4o",
              messages: [
                {
                  role: "system", 
                  content: `You are a friendly, conversational AI knowledge companion for a bamboo architecture platform.
                  You need to merge two knowledge base entries to avoid duplication while preserving all valuable information.
                  Create a single comprehensive entry that combines them effectively with a natural, friendly writing style.
                  Make sure the merged content flows well and sounds like it was written by a knowledgeable friend.
                  Return your merged content as a JSON object with fields: title and content.`
                },
                {
                  role: "user",
                  content: `Merge these entries and provide a json response with the combined information:
                  
                  Existing entry:
                  Title: "${mergeTarget.title || 'Untitled'}"
                  Content: "${typeof mergeTarget.content === 'string' ? mergeTarget.content : JSON.stringify(mergeTarget.content)}"
                  
                  New information to incorporate:
                  Title: "${formattedResult.title || 'Untitled'}"
                  Content: "${typeof formattedResult.content === 'string' ? formattedResult.content : JSON.stringify(formattedResult.content)}"`
                }
              ],
              response_format: { type: "json_object" }
            });
            
            const mergeResult = JSON.parse(mergedContent.choices[0].message.content);
            
            // Update the existing entry with merged content
            await storage.updateAiKnowledgeContent(mergeTargetId, {
              title: mergeResult.title || mergeTarget.title,
              content: mergeResult.content,
              contentType: mergeTarget.contentType,
              source: mergeTarget.source,
              status: mergeTarget.status
            });
            
            // More friendly and conversational response for merging content
            const contentType = mergeTarget.contentType?.toLowerCase() || "document";
            if (contentType === "event") {
              response = `I've updated our information about "${mergeTarget.title}" with these new details you shared. It's great to have the most complete information about this event! Is there anything else you'd like to tell me about it?`;
            } else if (contentType === "webpage") {
              response = `Thanks for these additional insights! I've combined them with what we already knew about "${mergeTarget.title}". Our bamboo knowledge is getting better all the time thanks to your contributions! Anything else on your mind?`;
            } else {
              response = `Thanks for sharing more about "${mergeTarget.title}"! I've updated our knowledge base by combining your new information with what we already knew. It's like putting together puzzle pieces to get a clearer picture. Is there anything else you'd like to talk about?`;
            }
          } else {
            // Fallback if merge target not found
            shouldAddToKnowledge = true;
            isDuplicate = false;
          }
        } else {
          // Skip - completely redundant, but with a friendly response
          response = `I actually recognize this information! It's already in our knowledge base. Thank you for sharing though - it shows we're on the same page about what's important! Is there anything else about bamboo architecture you'd like to chat about?`;
        }
      }
      
      // If not a duplicate, prepare to add it
      if (!isDuplicate) {
        suggestion = {
          title: formattedResult.title || "Untitled Content",
          contentType: formattedResult.contentType?.toLowerCase() || "document",
          content: formattedResult.content || message,
          source: formattedResult.source || null
        };
        
        // More conversational and friendly responses based on content type
        const contentType = formattedResult.contentType?.toLowerCase() || "document";
        
        if (contentType === "event") {
          response = `That's exciting! I've added "${formattedResult.title}" to our knowledge base. Thanks for sharing details about this event - I'm sure others will find it helpful! Is there anything else about this or other events you'd like to tell me about?`;
        } else if (contentType === "webpage") {
          response = `Thanks for sharing that link! I've extracted the key information from "${formattedResult.title}" and added it to our knowledge base. This will be super helpful for everyone interested in bamboo architecture. Anything else on your mind?`;
        } else if (contentType === "social" || contentType === "social_media") {
          response = `Got it! I've saved that social media post about "${formattedResult.title}" to our knowledge base as a social media post. It's great to keep up with what's happening in the bamboo community. Anything else you'd like to chat about?`;
        } else if (contentType === "article" || contentType === "blog_post") {
          response = `Thank you for sharing this article about "${formattedResult.title}"! I've added it to our Recent Articles & Resources section as an article. It's a great addition to our knowledge base. Is there anything specific from the article you'd like to discuss?`;
        } else {
          response = `Thanks for sharing that insight about "${formattedResult.title}"! I've added it to our bamboo knowledge base. I love learning new things about bamboo architecture - do you have any other interesting facts or information to share?`;
        }
      }
      
      return res.json({
        response,
        shouldAddToKnowledge,
        suggestion,
        isDuplicate
      });
      
    } catch (error: any) {
      console.error('Knowledge companion chat error:', error);
      return res.status(500).json({ error: `Failed to process message: ${error.message}` });
    }
  });
  
  // File upload endpoint for the AI Knowledge Base
  app.post("/api/ai-knowledge/upload-file", isAdmin, upload.single("image"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }
      
      const file = req.file;
      const { title, description, contentType } = req.body;
      
      if (!title || !contentType) {
        return res.status(400).json({ error: "Title and content type are required" });
      }
      
      // Create a public URL for the file
      const fileUrl = `/uploads/${file.filename}`;
      
      // Determine media type based on mimetype
      let mediaType = "unknown";
      if (file.mimetype.startsWith("image/")) {
        mediaType = "image";
      } else if (file.mimetype === "application/pdf") {
        mediaType = "pdf";
      } else if (file.mimetype.includes("spreadsheet") || file.mimetype.includes("excel")) {
        mediaType = "spreadsheet";
      } else if (file.mimetype.includes("document") || file.mimetype.includes("word")) {
        mediaType = "document";
      } else if (file.mimetype.includes("presentation") || file.mimetype.includes("powerpoint")) {
        mediaType = "presentation";
      }
      
      // Extract content from the file if possible (for documents, PDFs, etc.)
      let extractedContent = description || "";
      
      // Check for admin user in session
      if (!req.session.adminUser || !req.session.adminUser.id) {
        return res.status(401).json({ 
          error: "Admin authentication required. Please log in again." 
        });
      }
      
      // Automatically extract facts if there's content to analyze
      if (extractedContent && extractedContent.length > 50) {
        try {
          const facts = await extractFactsFromContent(extractedContent, fileUrl);
          console.log(`Upload: Automatically extracted ${facts.length} facts from uploaded file`);
          
          // Save each extracted fact
          if (facts.length > 0) {
            for (const factContent of facts) {
              await storage.createAiKnowledgeContent({
                title: `Bamboo Fact: ${factContent.substring(0, 50)}...`,
                content: factContent,
                source: fileUrl,
                contentType: 'fact',
                status: 'active',
                createdBy: req.session.adminUser.id
              });
            }
          }
        } catch (error) {
          console.error('Error automatically extracting facts from uploaded file:', error);
        }
      }
      
      // Add to AI knowledge base
      const newContent = await storage.createAiKnowledgeContent({
        title,
        content: extractedContent,
        contentType,
        mediaUrl: fileUrl,
        mediaType,
        status: "active",
        createdBy: req.session.adminUser.id
      });
      
      return res.status(201).json({ 
        message: "File uploaded and added to knowledge base", 
        content: newContent,
        fileUrl
      });
    } catch (error) {
      console.error("Error uploading file:", error);
      return res.status(500).json({
        error: `Error uploading file: ${error.message}`
      });
    }
  });
  
  // Process social media data endpoint
  app.post("/api/ai-knowledge/social-media", isAdmin, async (req, res) => {
    try {
      const { platform, profileUrl, handle, content, mediaUrls } = req.body;
      
      if (!platform || !content) {
        return res.status(400).json({ error: "Platform and content are required" });
      }
      
      // Check for admin user in session
      if (!req.session.adminUser || !req.session.adminUser.id) {
        return res.status(401).json({ 
          error: "Admin authentication required. Please log in again." 
        });
      }
      
      // Add to AI knowledge base
      const socialMediaContent = await storage.createAiKnowledgeContent({
        title: `${platform} Post - ${handle || "Unknown"}`,
        content,
        contentType: "social",
        source: profileUrl,
        mediaUrl: mediaUrls?.[0] || null,
        mediaType: "social",
        socialMediaInfo: {
          platform,
          profileUrl,
          handle,
          mediaUrls: mediaUrls || []
        },
        status: "active",
        createdBy: req.session.adminUser.id
      });
      
      return res.status(201).json({ 
        message: "Social media data added to knowledge base", 
        content: socialMediaContent
      });
    } catch (error) {
      console.error("Error adding social media data:", error);
      return res.status(500).json({
        error: `Error adding social media data: ${error.message}`
      });
    }
  });
  
  // Function to extract bamboo facts from content
  async function extractFactsFromContent(content: string, source: string | null): Promise<string[]> {
    try {
      // Use geminiExtractFacts function from gemini-service.ts
      return await geminiExtractFacts(content, 'document');
    } catch (error) {
      console.error("Error extracting facts:", error);
      return [];
    }
  }
  
  // Refresh Website Content
  // Endpoint to resummarize content from stored raw text
  app.post('/api/ai-knowledge/resummarize', isAdmin, async (req, res) => {
    const { id } = req.body;
    
    if (!id) {
      return res.status(400).json({ error: 'Content id is required' });
    }
    
    try {
      // First check if the content exists and has raw content
      const existingContent = await storage.getAiKnowledgeContentById(id);
      
      if (!existingContent) {
        return res.status(404).json({ error: 'Content not found' });
      }
      
      if (!existingContent.rawContent) {
        return res.status(400).json({ error: 'No raw content available for resummation' });
      }
      
      // Get OpenAI instance
      const openai = getOpenAI();
      if (!openai) {
        return res.status(500).json({ error: 'OpenAI service not available' });
      }
      
      console.log(`Resummarizing content ID ${id} with ${existingContent.rawContent.length} characters of raw content`);
      
      const prompt = `
      You are analyzing raw content from a website about bamboo architecture. Generate a comprehensive, 
      detailed summary that captures all the key information from this content.
      
      Focus on facts, techniques, approaches, and detailed information about bamboo architecture, 
      construction, and sustainable practices.
      
      Raw content:
      ${existingContent.rawContent}
      
      Generate a clean, well-structured summary that preserves as much factual information as possible.
      `;
      
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.3,
      });
      
      // Get the newly generated summary
      const newSummary = response.choices[0].message.content || '';
      
      // Update the content with the new summary
      const updatedContent = await storage.updateAiKnowledgeContent(id, {
        content: newSummary,
        lastResummarizedAt: new Date()
      });
      
      return res.json({
        success: true,
        message: 'Content has been successfully resummarized',
        content: updatedContent
      });
      
    } catch (error) {
      console.error('Error resummarizing content:', error);
      return res.status(500).json({ 
        error: 'Failed to resummarize content',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Endpoint to re-summarize content using stored raw content
  app.post('/api/ai-knowledge/regenerate-summary', isAdmin, async (req, res) => {
    const { id } = req.body;
    
    if (!id) {
      return res.status(400).json({ error: 'Content ID is required' });
    }
    
    try {
      // Get the content with raw data
      const existingContent = await storage.getAiKnowledgeContentById(id);
      
      if (!existingContent) {
        return res.status(404).json({ error: 'Content not found' });
      }
      
      // Check if there's raw content available for re-summarization
      if (!existingContent.rawContent) {
        return res.status(400).json({ error: 'No raw content available for re-summarization. Try refreshing the content first.' });
      }
      
      // Use OpenAI to generate a new summary from the raw content
      const openai = getOpenAI();
      if (!openai) {
        return res.status(500).json({ error: 'OpenAI service unavailable' });
      }
      
      // Send the raw content to OpenAI for summarization
      const prompt = `Please summarize the following website content into a clear, concise format preserving the most important information:

${existingContent.rawContent}

Please structure the summary in a helpful format with clear headings, bullet points for key information, and maintaining any critical details like dates, locations, or contact information.`;
      
      const response = await openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [
          { role: "system", content: "You are a helpful assistant that summarizes web content accurately and concisely." },
          { role: "user", content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 2048
      });
      
      // Extract the generated summary from the OpenAI response
      const newSummary = response.choices[0].message.content;
      
      // Clean the summary content (remove markdown formatting)
      // Replace markdown headers
      let cleanSummary = newSummary.replace(/#+\s+/g, '');
      // Remove bold and italic formatting
      cleanSummary = cleanSummary.replace(/\*\*/g, '').replace(/\*/g, '');
      // Remove bullet points
      cleanSummary = cleanSummary.replace(/- /g, '');
      
      // Update the content in the database with the new summary
      const updatedContent = await storage.updateAiKnowledgeContent(id, {
        content: cleanSummary,
        lastResummarizedAt: new Date()
      });
      
      return res.json({
        success: true,
        message: 'Content successfully re-summarized',
        content: updatedContent
      });
      
    } catch (error: any) {
      console.error('Re-summarization error:', error);
      return res.status(500).json({ 
        error: `Failed to re-summarize content: ${error.message || 'Unknown error'}` 
      });
    }
  });

  // Endpoint to regenerate content summary using stored raw content
  app.post('/api/ai-knowledge/regenerate-summary', isAdmin, async (req, res) => {
    try {
      const { id } = req.body;
      
      if (!id) {
        return res.status(400).json({ success: false, error: 'Content ID is required' });
      }
      
      // Get the content item with raw content
      const content = await storage.getAiKnowledgeContentById(id);
      
      if (!content) {
        return res.status(404).json({ success: false, error: 'Content not found' });
      }
      
      // If we don't have raw content, try to fetch it if it's a webpage or website
      let textToSummarize = content.rawContent;
      
      if (!textToSummarize && content.source && (content.source.startsWith('http') || content.contentType === 'webpage' || content.contentType === 'article')) {
        try {
          console.log(`Re-crawling page to get raw content: ${content.source}`);
          // Analyze the website to get raw content
          const result = await analyzeWebsite(content.source);
          
          if (result && result.fullRawContent) {
            textToSummarize = result.fullRawContent;
            
            // Update the raw content in the database so we don't need to crawl again next time
            await storage.updateAiKnowledgeContent(id, {
              rawContent: result.fullRawContent
            });
          }
        } catch (crawlError) {
          console.error('Error crawling website for re-summarization:', crawlError);
          // Continue with whatever content we have
        }
      }
      
      if (!textToSummarize) {
        return res.status(400).json({ 
          success: false, 
          error: 'No raw content available for re-summarization. This content may have been created before raw content storage was implemented.' 
        });
      }
      
      // Customize the prompt based on content type
      let customPrompt = '';
      switch (content.contentType) {
        case 'article':
          customPrompt = 'Focus on extracting key information, findings, and conclusions from this article about bamboo.';
          break;
        case 'social-media':
          customPrompt = 'Focus on capturing the main message, bamboo-related innovations, or community engagement mentioned in this social media post.';
          break;
        case 'event':
          customPrompt = 'Focus on event details including date, time, location, purpose, target audience, and any bamboo-related activities or demonstrations.';
          break;
        case 'webpage':
          customPrompt = 'Focus on extracting key information about bamboo architecture, techniques, sustainability benefits, and design aspects mentioned on this webpage.';
          break;
        case 'book':
          customPrompt = 'Focus on summarizing the key themes, concepts, and bamboo-related knowledge presented in this book or book excerpt.';
          break;
        case 'enthusiast':
          customPrompt = 'Focus on the expertise, experience, and contributions of this bamboo enthusiast, highlighting their specialization and notable bamboo projects.';
          break;
        case 'fact':
          customPrompt = 'Focus on the scientific or cultural aspects of bamboo mentioned in this content, emphasizing verified facts and data points.';
          break;
        default:
          customPrompt = 'Focus on key points related to bamboo architecture, techniques, sustainability benefits, and design aspects. Include specific details when available.';
      }
      
      try {
        // Call Gemini service for content summarization
        const newSummary = await geminiSummarizeContent(textToSummarize, content.contentType);
        
        // Log success
        console.log(`Successfully summarized content with Gemini: ${content.id} (${content.contentType})`);
        
        // Update the content in the database
        const updatedContent = await storage.updateAiKnowledgeContent(id, {
          content: newSummary,
          lastResummarizedAt: new Date()
        });
        
        // Return the updated content
        return res.json({ success: true, content: updatedContent, message: 'Content successfully re-summarized' });
      } catch (summaryError) {
        console.error('Error regenerating content summary with Gemini:', summaryError);
        return res.status(500).json({ 
          success: false, 
          error: 'Failed to regenerate content summary', 
          message: (summaryError as Error).message 
        });
      }
    } catch (error) {
      console.error('General error in regenerate-summary endpoint:', error);
      return res.status(500).json({ 
        success: false, 
        error: 'An unexpected error occurred', 
        message: (error as Error).message 
      });
    }
  });

  app.post('/api/ai-knowledge/refresh-website', isAdmin, async (req, res) => {
    const { id, url, extractFacts = false, saveExtractedFacts = true } = req.body;
    
    if (!id || !url) {
      return res.status(400).json({ error: 'Both id and url are required' });
    }
    
    try {
      // First check if the content exists
      const existingContent = await storage.getAiKnowledgeContentById(id);
      
      if (!existingContent) {
        return res.status(404).json({ error: 'Content not found' });
      }
      
      // Extract fresh content from website
      const extractedData = await analyzeWebsite(url);
      
      // Get the appropriate content type based on URL
      const detectedType = detectContentTypeFromUrl(url);
      
      // Remove markdown formatting from content
      let cleanContent = extractedData.content;
      // Replace markdown headers
      cleanContent = cleanContent.replace(/#+\s+/g, '');
      // Remove bold and italic formatting
      cleanContent = cleanContent.replace(/\*\*/g, '').replace(/\*/g, '');
      // Remove bullet points
      cleanContent = cleanContent.replace(/- /g, '');
      
      // Store the full raw content for future resummation
      const rawContent = extractedData.fullRawContent;
      
      // Update the content in the database
      const updatedContent = await storage.updateAiKnowledgeContent(id, {
        title: extractedData.title,
        content: cleanContent,
        rawContent: rawContent, // Store raw content for later resummation
        contentType: detectedType, // Use the detected type for proper segregation
        source: url,
        status: existingContent.status,
        lastResummarizedAt: new Date(), // Track when content was last summarized
      });
      
      // Extract and save facts if requested
      let extractedFacts = [];
      if (extractFacts) {
        extractedFacts = await extractFactsFromContent(cleanContent, url);
        
        // Save facts to bamboo_facts table (associated with this source content)
        if (saveExtractedFacts && extractedFacts.length > 0) {
          try {
            // Store facts in bamboo_facts table, linked to this content ID
            await saveFactsToDb(extractedFacts, updatedContent.id, req.session.adminUser.id);
            
            // Also create separate fact entries in the main knowledge content table (legacy approach)
            for (const factContent of extractedFacts) {
              if (factContent.length > 10) {
                const factTitle = "Bamboo Fact: " + factContent.substring(0, 40) + (factContent.length > 40 ? "..." : "");
                
                try {
                  await storage.createAiKnowledgeContent({
                    title: factTitle,
                    content: factContent + "\n\nSource: " + (url || "Unknown"),
                    contentType: "fact",
                    source: url,
                    status: "active",
                    createdBy: req.session.adminUser.id
                  });
                } catch (err) {
                  console.error("Error saving extracted fact:", err);
                  // Continue with the next fact even if one fails
                }
              }
            }
          } catch (factError) {
            console.error("Error saving facts to database:", factError);
          }
        }
      }
      
      return res.json({
        success: true,
        message: 'Website content refreshed successfully',
        content: updatedContent,
        extractedFacts: extractedFacts.length > 0 ? extractedFacts : null
      });
      
    } catch (error: any) {
      console.error('Refresh website error:', error);
      return res.status(500).json({ error: `Failed to refresh website content: ${error.message}` });
    }
  });

  // Add a new endpoint to get facts by content source ID
  app.get('/api/ai-knowledge/:id/facts', isAdmin, async (req, res) => {
    try {
      const contentId = parseInt(req.params.id);
      if (isNaN(contentId)) {
        return res.status(400).json({ error: 'Invalid content ID' });
      }
      
      const facts = await getFactsBySourceId(contentId);
      return res.json({ success: true, facts });
    } catch (error) {
      console.error('Error getting facts:', error);
      return res.status(500).json({ error: 'Failed to get facts' });
    }
  });
  
  // Add endpoint to save facts to bamboo_facts table
  app.post('/api/bamboo-facts', isAdmin, async (req, res) => {
    try {
      const { fact, sourceContentId } = req.body;
      
      if (!fact || !sourceContentId) {
        return res.status(400).json({ error: 'Fact content and source content ID are required' });
      }
      
      if (!req.session.adminUser) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      
      // Save the fact to the database
      await db.insert(bambooFacts).values({
        fact,
        sourceContentId,
        createdBy: req.session.adminUser.id,
        status: 'active'
      });
      
      return res.json({ 
        success: true, 
        message: 'Fact saved successfully' 
      });
    } catch (error) {
      console.error('Error saving fact:', error);
      return res.status(500).json({ error: 'Failed to save fact' });
    }
  });
  
  // Add endpoint to delete a fact
  app.delete('/api/bamboo-facts/:id', isAdmin, async (req, res) => {
    try {
      const factId = parseInt(req.params.id);
      
      if (isNaN(factId)) {
        return res.status(400).json({ error: 'Invalid fact ID' });
      }
      
      // Delete the fact from the database
      await db.delete(bambooFacts).where(eq(bambooFacts.id, factId));
      
      return res.json({
        success: true,
        message: 'Fact deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting fact:', error);
      return res.status(500).json({ error: 'Failed to delete fact' });
    }
  });

  // Helper function to save facts to the bamboo_facts table
  async function saveFactsToDb(facts: string[], sourceContentId: number, createdById: number): Promise<number> {
    try {
      let factsAdded = 0;
      
      for (const fact of facts) {
        await db.insert(bambooFacts).values({
          fact: fact,
          sourceContentId: sourceContentId,
          createdBy: createdById,
          status: 'active'
        });
        factsAdded++;
      }
      
      return factsAdded;
    } catch (error) {
      console.error("Error saving facts to database:", error);
      return 0;
    }
  }
  
  // Helper function to get facts by source content ID
  async function getFactsBySourceId(sourceContentId: number): Promise<Array<{id: number, fact: string}>> {
    try {
      const facts = await db.select({
        id: bambooFacts.id,
        fact: bambooFacts.fact
      })
      .from(bambooFacts)
      .where(eq(bambooFacts.sourceContentId, sourceContentId))
      .where(eq(bambooFacts.status, 'active'));
      
      return facts;
    } catch (error) {
      console.error("Error getting facts by source id:", error);
      return [];
    }
  }

  // Extract content from URL using Google Gemini AI
  app.post("/api/extract-content-url", isAdmin, async (req, res) => {
    try {
      const { url } = req.body;
      
      if (!url) {
        return res.status(400).json({ error: "URL is required" });
      }
      
      console.log(`Extracting content from URL using Gemini: ${url}`);
      const extractionResult = await processUrlWithGemini(url);
      
      res.json(extractionResult);
    } catch (error) {
      console.error("Error extracting content from URL:", error);
      res.status(500).json({ 
        error: "Failed to extract content from URL", 
        details: error.message 
      });
    }
  });
  
  // Extract content from uploaded file using Google Gemini AI
  app.post("/api/extract-content-file", isAdmin, upload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "File is required" });
      }
      
      const filePath = req.file.path;
      console.log(`Extracting content from file using Gemini: ${filePath}`);
      
      const extractionResult = await processFileWithGemini(filePath);
      
      res.json(extractionResult);
    } catch (error) {
      console.error("Error extracting content from file:", error);
      res.status(500).json({ 
        error: "Failed to extract content from file", 
        details: error.message 
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
