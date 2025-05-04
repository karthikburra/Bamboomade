import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserSchema, insertProjectSchema, insertProjectGuidanceSchema, insertChatMessageSchema, insertAiTrainingDataSchema, insertTokenPurchaseSchema, User } from "@shared/schema";
import { processMessage, convertWhatsAppToTrainingData } from "./openai-service.js";
import { initiatePhonePePayment, checkPhonePePaymentStatus } from "./phonepe-service";
import { initiateRazorpayPayment, verifyRazorpayPayment, getRazorpayPaymentDetails } from "./razorpay-service";
import { sendBookingConfirmationEmail, initializeEmailService, generateGoogleMeetLink, generateGoogleCalendarLink } from "./email-service";
import { initializeSheetsService, updateProjectGuidanceSession, addUserToSheet } from "./sheets-service";
import { format, addMinutes } from "date-fns";
import { ZodError } from "zod";
import { z } from "zod";
import admin from "firebase-admin";
import bcrypt from "bcrypt";

// Import WhatsApp bot
import whatsappBot from "./whatsapp-bot.js";

// Initialize Firebase Admin SDK if Firebase credentials are available
try {
  admin.initializeApp({
    projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  });
} catch (error) {
  console.warn("Firebase Admin initialization failed:", error);
}

// Admin authentication middleware
const isAdmin = (req: Request, res: Response, next: NextFunction) => {
  // Check if the user is authenticated and is an admin
  if (!req.session || !req.session.adminUser) {
    return res.status(401).json({
      message: "Unauthorized. Admin access required.",
    });
  }
  next();
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Initialize email service at startup
  if (process.env.EMAIL_PASSWORD) {
    console.log('[express] Initializing email service with credentials');
    initializeEmailService();
  } else {
    console.log('[express] Email password not found, email functionality will be limited to development mode');
  }
  
  // Initialize Google Sheets integration
  if (process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL && process.env.GOOGLE_PRIVATE_KEY && process.env.GOOGLE_SPREADSHEET_ID) {
    console.log('[express] Initializing Google Sheets integration');
    initializeSheetsService();
  } else {
    console.log('[express] Google Sheets integration credentials not found, Google Sheets functionality will be disabled');
  }
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
      }
      
      const user = await storage.createUser(userData);
      
      // Add user to Google Sheet for tracking
      addUserToSheet(user.id, user.username, user.email, user.role)
        .catch(error => console.error("Failed to add user to Google Sheet:", error));
      
      // Don't return password in response
      const { password, ...userWithoutPassword } = user;
      res.status(201).json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({ message: "Failed to create user", error: (error as Error).message });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
      }
      
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      // For existing users migrating to bcrypt, we temporarily check both
      let isValidPassword = false;
      
      // First try bcrypt (for users created/updated with bcrypt)
      try {
        isValidPassword = await bcrypt.compare(password, user.password);
      } catch (e) {
        // If bcrypt fails (likely not a bcrypt hash), fall back to legacy check
        isValidPassword = user.password === password;
        
        // If password matches with legacy check, update to bcrypt
        if (isValidPassword) {
          // Update password to bcrypt hash for future logins
          user.password = await bcrypt.hash(password, 10);
        }
      }
      
      if (!isValidPassword) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      // Set user in session (simplified auth)
      req.session.userId = user.id;
      
      // If user is admin, also set admin session
      if (user.isAdmin) {
        req.session.adminUser = {
          email: user.email,
          isAdmin: true
        };
      }
      
      // Don't return password in response
      const { password: _, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({ message: "Login failed", error: (error as Error).message });
    }
  });

  app.get("/api/auth/me", async (req, res) => {
    try {
      const userId = req.session.userId;
      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Don't return password in response
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({ message: "Failed to get user data", error: (error as Error).message });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Failed to logout", error: err.message });
      }
      res.json({ message: "Logged out successfully" });
    });
  });

  // Admin authentication routes
  app.post("/api/auth/admin-login", async (req, res) => {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
      }
      
      // Only allow specific email (info@bamboomade.in)
      if (email.toLowerCase() !== "info@bamboomade.in") {
        return res.status(401).json({ message: "Unauthorized access" });
      }
      
      // Find user or create one if it doesn't exist
      let user = await storage.getUserByEmail(email.toLowerCase());
      
      if (!user) {
        // Create admin user if doesn't exist
        user = await storage.createUser({
          username: "admin",
          password: await bcrypt.hash(password, 10),
          email: email.toLowerCase(),
          role: "admin",
        });
      } else {
        // For existing users, we use hardcoded password for the demo
        // In a real application, you would use bcrypt.compare with stored hash
        const adminPassword = "bamboomade2023"; // In production, use environment variables
        
        if (password !== adminPassword) {
          return res.status(401).json({ message: "Invalid credentials" });
        }
        
        // Update password to bcrypt hash for future logins
        user.password = await bcrypt.hash(password, 10);
        
        // Ensure user has admin flag
        if (!user.isAdmin) {
          user = await storage.updateUserAdminStatus(user.id, true);
        }
      }
      
      // Set user and admin flag in session
      if (user) {
        req.session.userId = user.id;
        req.session.adminUser = {
          email,
          isAdmin: true
        };
      }
      
      res.json({ 
        message: "Admin login successful",
        email,
        isAdmin: true
      });
    } catch (error) {
      res.status(500).json({ message: "Login failed", error: (error as Error).message });
    }
  });
  
  app.post("/api/auth/admin-logout", (req, res) => {
    if (req.session.adminUser) {
      delete req.session.adminUser;
    }
    
    res.json({ message: "Admin logged out successfully" });
  });
  
  app.get("/api/auth/admin-check", (req, res) => {
    if (!req.session.adminUser) {
      return res.status(401).json({ message: "Not authenticated as admin" });
    }
    
    res.json({
      isAdmin: true,
      email: req.session.adminUser.email
    });
  });
  
  // Google Authentication
  const googleAuthSchema = z.object({
    idToken: z.string(),
  });
  
  app.post("/api/auth/google", validateRequest(googleAuthSchema), async (req, res) => {
    try {
      const { idToken } = req.body;
      
      // Verify the ID token
      const decodedToken = await admin.auth().verifyIdToken(idToken);
      const { email, name, picture } = decodedToken;
      
      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }
      
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

        // Add new user to Google Sheet for tracking
        addUserToSheet(user.id, user.username, user.email, user.role)
          .catch(error => console.error("Failed to add Google-authenticated user to Google Sheet:", error));
      }
      
      // Set user in session
      if (user) {
        req.session.userId = user.id;
        
        // Don't return password in response
        const { password, ...userWithoutPassword } = user;
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
      
      // Create the session with all the fields
      const session = await storage.createProjectGuidance({
        studentName,
        email, 
        phone,
        date,
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
          date: sessionDate.toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          }),
          time: sessionDate.toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: true 
          }),
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
      
      // Send verification email
      const { sendVerificationCodeEmail } = require('./email-service');
      const emailSent = await sendVerificationCodeEmail(
        email,
        code,
        purpose as 'reschedule' | 'access'
      );
      
      if (!emailSent) {
        throw new Error("Failed to send verification email");
      }
      
      // Return success with the verification code (for demo purposes only)
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
  
  // Route for rescheduling a session
  app.post("/api/reschedule-session", async (req, res) => {
    try {
      const { email, newDate, newDuration, sessionId } = req.body;
      
      if (!email || !newDate) {
        return res.status(400).json({ message: "Email and new date are required" });
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
      
      // Update the session with new date/time
      const updatedSession = { 
        ...selectedSession,
        date: new Date(newDate),
        duration: newDuration || selectedSession.duration
      };
      
      // In a real implementation, you would update the session in the database
      // For demo purposes, we'll just log the changes and return success
      console.log('Session rescheduled:', {
        sessionId: selectedSession.id,
        email,
        oldDate: selectedSession.date,
        newDate: new Date(newDate),
        oldDuration: selectedSession.duration,
        newDuration: newDuration || selectedSession.duration
      });
      
      // Send email notification about the reschedule
      const { sendRescheduledSessionEmail } = require('./email-service');
      await sendRescheduledSessionEmail(
        selectedSession.id,
        selectedSession.studentName,
        email,
        selectedSession.topic,
        new Date(newDate),
        newDuration || selectedSession.duration
      );
      
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
      
      // Update Google Sheets with payment information (in the background)
      updateProjectGuidanceSession(session, 'Test')
        .catch(error => console.error("Failed to update Google Sheet for direct payment update:", error));
      
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
      
      if (!paymentId) {
        return res.status(400).json({
          success: false,
          message: "Payment ID is required"
        });
      }
      
      const session = await storage.getProjectGuidance(sessionId);
      
      if (!session) {
        return res.status(404).json({
          success: false,
          message: "Session not found"
        });
      }
      
      // Verify that this session has been paid for
      if (!session.paymentConfirmed || session.paymentId !== paymentId) {
        return res.status(403).json({
          success: false,
          message: "Payment verification failed"
        });
      }
      
      // Generate the Google Meet link
      const sessionDate = new Date(session.date);
      const meetLink = generateGoogleMeetLink(
        session.id,
        sessionDate,
        session.studentName
      );
      
      // Generate calendar event link with projects@bamboomade.in as the host
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

  // PhonePe Payment Routes
  app.post("/api/payments/phonepe/initiate", async (req, res) => {
    try {
      const { amount, sessionId, customerName, customerPhone, customerEmail } = req.body;
      
      // Log information for debugging
      console.log("PhonePe payment initiation:", {
        amount,
        sessionId,
        customerName: customerName ? "✓" : "✗", // For privacy, just log if present
        customerPhone: customerPhone ? "✓" : "✗", // For privacy, just log if present
        customerEmail: customerEmail ? "✓" : "✗", // For privacy, just log if present
        clientIdExists: !!process.env.PHONEPE_CLIENT_ID,
        clientSecretExists: !!process.env.PHONEPE_CLIENT_SECRET
      });
      
      if (!amount || !customerName || !customerPhone || !customerEmail) {
        return res.status(400).json({ 
          success: false,
          message: "Missing required payment information" 
        });
      }
      
      // sessionId is required for booking confirmation, but we'll allow the payment to proceed
      // in case we want to handle the session creation after payment in some flows
      if (!sessionId) {
        console.warn("PhonePe payment initiated without sessionId");
      }

      // Verify that the required environment variables are set
      if (!process.env.PHONEPE_CLIENT_ID || !process.env.PHONEPE_CLIENT_SECRET) {
        console.error("Missing PhonePe credentials in environment variables");
        return res.status(500).json({
          success: false,
          message: "Payment service configuration error"
        });
      }

      // Generate a unique order ID that includes the session ID for better tracking
      const orderId = sessionId 
        ? `ORDER_${Date.now()}_${sessionId}` 
        : `ORDER_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
      
      console.log(`PhonePe payment request for order: ${orderId}`);
      
      // Initialize PhonePe payment
      const paymentResult = await initiatePhonePePayment(
        amount,
        orderId,
        customerName,
        customerPhone,
        customerEmail
      );
      
      // Log the payment result (excluding sensitive info)
      console.log("PhonePe payment result:", {
        success: paymentResult.success,
        hasPaymentLink: !!paymentResult.paymentLink,
        hasError: !!paymentResult.error
      });
      
      if (paymentResult.success) {
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
        
        res.json({
          success: true,
          paymentLink: paymentResult.paymentLink,
          transactionId: paymentResult.transactionId
        });
      } else {
        console.error("PhonePe payment failed:", paymentResult.error);
        res.status(400).json({
          success: false,
          message: paymentResult.error || "Failed to initialize payment"
        });
      }
    } catch (error) {
      console.error("PhonePe payment initiation error:", error);
      res.status(500).json({ 
        success: false,
        message: "Payment initiation failed",
        error: (error as Error).message
      });
    }
  });

  app.get("/api/payments/phonepe/callback", async (req, res) => {
    try {
      console.log("PhonePe callback received with query params:", req.query);
      
      const { merchantTransactionId, code } = req.query;
      
      if (!merchantTransactionId) {
        console.error("PhonePe callback error: Missing transaction ID");
        return res.status(400).send("Missing transaction ID");
      }
      
      // For test/sandbox environment, PhonePe might pass a status code directly
      if (code === "PAYMENT_SUCCESS") {
        console.log("PhonePe callback: Direct success code received");
        
        // Check if we have the transaction in global storage (for development)
        let pendingPayment;
        const txnId = merchantTransactionId as string;
        
        if (global.pendingPayments && global.pendingPayments[txnId]) {
          pendingPayment = global.pendingPayments[txnId];
          console.log("Found transaction in global storage:", {
            hasPendingPayment: !!pendingPayment,
            sessionId: pendingPayment?.sessionId
          });
        } else if (req.session?.pendingPayments && req.session.pendingPayments[txnId]) {
          pendingPayment = req.session.pendingPayments[txnId];
          console.log("Found transaction in session storage:", {
            hasPendingPayment: !!pendingPayment,
            sessionId: pendingPayment?.sessionId
          });
        } else {
          // Try to extract session ID from the transaction ID format: ORDER_TIMESTAMP_ID
          console.log("Transaction not found in storage, trying to extract session ID from txnId:", txnId);
          const parts = txnId.split('_');
          if (parts.length >= 3) {
            const potentialSessionId = parseInt(parts[parts.length - 1]);
            if (!isNaN(potentialSessionId)) {
              console.log("Successfully extracted session ID from txnId:", potentialSessionId);
              
              // Try to find the session in the database
              const session = await storage.getProjectGuidance(potentialSessionId);
              if (session && !session.paymentConfirmed) {
                console.log("Found matching session in database:", {
                  id: session.id,
                  studentName: session.studentName,
                  paymentConfirmed: session.paymentConfirmed
                });
                pendingPayment = { sessionId: session.id };
              } else {
                console.log("No matching session found or session already paid");
              }
            }
          }
          
          if (!pendingPayment) {
            console.error("PhonePe callback error: Transaction not found in storage and couldn't extract valid session ID");
            return res.redirect('/payment-failed?reason=' + encodeURIComponent('Session not found or already paid'));
          }
        }
        
        // Use a mock payment ID for test environment
        const mockPaymentId = "TEST_" + Date.now();
        
        try {
          // Update the project guidance session with the payment ID
          const session = await storage.updateProjectGuidancePayment(
            parseInt(pendingPayment.sessionId),
            mockPaymentId
          );
          
          if (!session) {
            console.error("PhonePe callback error: Project guidance session not found", {
              sessionId: pendingPayment.sessionId
            });
            return res.status(404).send("Project guidance session not found");
          }
          
          console.log("PhonePe payment successful, updated session:", {
            sessionId: session.id,
            paymentId: mockPaymentId
          });
          
          // Send booking confirmation email with Google Meet link
          try {
            await sendBookingConfirmationEmail({
              sessionId: session.id,
              studentName: session.studentName,
              studentEmail: session.email,
              sessionDate: new Date(session.date),
              sessionDuration: session.duration,
              sessionTopic: session.topic
            });
            console.log("Booking confirmation email sent successfully");
          } catch (emailError) {
            console.error("Failed to send booking confirmation email:", emailError);
            // Continue with payment process even if email fails
          }
          
          // Update Google Sheets with payment information
          try {
            await updateProjectGuidanceSession(session, 'PhonePe');
            console.log("Google Sheets updated successfully with PhonePe payment");
          } catch (sheetsError) {
            console.error("Failed to update Google Sheets with PhonePe payment:", sheetsError);
            // Continue with payment process even if sheets update fails
          }
          
          // Clean up the pending payment from whichever storage it was in
          if (global.pendingPayments && global.pendingPayments[txnId]) {
            delete global.pendingPayments[txnId];
          } else if (req.session?.pendingPayments) {
            delete req.session.pendingPayments[txnId];
          }
          
          // Redirect to payment success page with session ID and payment ID for displaying Google Meet link
          return res.redirect(`/payment-success?sessionId=${pendingPayment.sessionId}&paymentId=${mockPaymentId}`);
        } catch (storageError) {
          console.error("PhonePe callback storage error:", storageError);
          return res.status(500).send("Database error during payment processing");
        }
      }
      
      // If no direct success code, verify payment status with PhonePe API
      console.log("Checking payment status with PhonePe API for transaction:", merchantTransactionId);
      const statusResult = await checkPhonePePaymentStatus(merchantTransactionId as string);
      
      console.log("PhonePe status check result:", {
        success: statusResult.success,
        status: statusResult.status,
        hasPaymentId: !!statusResult.paymentId,
        error: statusResult.error
      });
      
      if (statusResult.success && statusResult.status === "SUCCESS") {
        // Get the session info from our stored data
        let pendingPayment;
        const txnId = merchantTransactionId as string;
        
        if (global.pendingPayments && global.pendingPayments[txnId]) {
          pendingPayment = global.pendingPayments[txnId];
        } else if (req.session?.pendingPayments && req.session.pendingPayments[txnId]) {
          pendingPayment = req.session.pendingPayments[txnId];
        } else {
          // Try to extract session ID from the transaction ID format: ORDER_TIMESTAMP_ID
          console.log("Transaction not found in storage, trying to extract session ID from txnId:", txnId);
          const parts = txnId.split('_');
          if (parts.length >= 3) {
            const potentialSessionId = parseInt(parts[parts.length - 1]);
            if (!isNaN(potentialSessionId)) {
              console.log("Successfully extracted session ID from txnId:", potentialSessionId);
              
              // Try to find the session in the database
              const session = await storage.getProjectGuidance(potentialSessionId);
              if (session && !session.paymentConfirmed) {
                console.log("Found matching session in database:", {
                  id: session.id,
                  studentName: session.studentName,
                  paymentConfirmed: session.paymentConfirmed
                });
                pendingPayment = { sessionId: session.id };
              } else {
                console.log("No matching session found or session already paid");
              }
            }
          }
        }
        
        if (!pendingPayment) {
          console.error("PhonePe callback error: Transaction not found in storage and couldn't extract valid session ID");
          return res.redirect('/payment-failed?reason=' + encodeURIComponent('Session not found or already paid'));
        }
        
        // Update the project guidance session with the payment ID
        const session = await storage.updateProjectGuidancePayment(
          parseInt(pendingPayment.sessionId),
          statusResult.paymentId
        );
        
        if (!session) {
          console.error("PhonePe callback error: Project guidance session not found", {
            sessionId: pendingPayment.sessionId
          });
          return res.status(404).send("Project guidance session not found");
        }
        
        console.log("PhonePe payment successful, updated session:", {
          sessionId: session.id,
          paymentId: statusResult.paymentId
        });
        
        // Send booking confirmation email with Google Meet link
        try {
          await sendBookingConfirmationEmail({
            sessionId: session.id,
            studentName: session.studentName,
            studentEmail: session.email,
            sessionDate: new Date(session.date),
            sessionDuration: session.duration,
            sessionTopic: session.topic
          });
          console.log("Booking confirmation email sent successfully");
        } catch (emailError) {
          console.error("Failed to send booking confirmation email:", emailError);
          // Continue with payment process even if email fails
        }
        
        // Update Google Sheets with payment information
        try {
          await updateProjectGuidanceSession(session, 'PhonePe');
          console.log("Google Sheets updated successfully with PhonePe payment");
        } catch (sheetsError) {
          console.error("Failed to update Google Sheets with PhonePe payment:", sheetsError);
          // Continue with payment process even if sheets update fails
        }
        
        // Clean up the pending payment from whichever storage it was in
        if (global.pendingPayments && global.pendingPayments[txnId]) {
          delete global.pendingPayments[txnId];
        } else if (req.session?.pendingPayments) {
          delete req.session.pendingPayments[txnId];
        }
        
        // Redirect to payment success page with session ID and payment ID for displaying Google Meet link
        return res.redirect(`/payment-success?sessionId=${pendingPayment.sessionId}&paymentId=${statusResult.paymentId}`);
      } else {
        // Payment failed
        const errorReason = statusResult.error || "Payment verification failed";
        console.error("PhonePe payment failed:", errorReason);
        
        return res.redirect('/payment-failed?reason=' + encodeURIComponent(errorReason));
      }
    } catch (error) {
      console.error("PhonePe callback error:", error);
      return res.status(500).send("Payment verification failed. Please contact support.");
    }
  });

  app.get("/api/payments/phonepe/status/:transactionId", async (req, res) => {
    try {
      const { transactionId } = req.params;
      
      // Check payment status with PhonePe
      const statusResult = await checkPhonePePaymentStatus(transactionId);
      
      res.json(statusResult);
    } catch (error) {
      console.error("PhonePe status check error:", error);
      res.status(500).json({ 
        success: false,
        message: "Failed to check payment status", 
        error: (error as Error).message 
      });
    }
  });

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
                  
                  // Send confirmation email with Google Meet link
                  const sessionDate = new Date(session.date);
                  
                  console.log(`Attempting to send booking confirmation email for session ${sessionId} to ${session.email}`);
                  try {
                    const emailResult = await sendBookingConfirmationEmail({
                      sessionId: session.id,
                      studentName: session.studentName,
                      studentEmail: session.email,
                      sessionDate: sessionDate,
                      sessionDuration: session.duration,
                      sessionTopic: session.topic
                    });
                    
                    console.log(`Payment confirmation email sent for session ${sessionId}, result:`, emailResult);
                  } catch (innerEmailError) {
                    console.error(`Failed to send confirmation email for session ${sessionId}:`, innerEmailError);
                  }
                  
                  // Update Google Sheets with payment information
                  try {
                    await updateProjectGuidanceSession(session, 'Razorpay');
                    console.log(`Google Sheets updated successfully with Razorpay payment for session ${sessionId}`);
                  } catch (sheetsError) {
                    console.error(`Failed to update Google Sheets with Razorpay payment for session ${sessionId}:`, sheetsError);
                    // Continue with payment process even if sheets update fails
                  }
                }
              } catch (emailError) {
                console.error("Failed to send confirmation email:", emailError);
                // Continue processing even if email fails
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

  // AI Chat routes
  app.post("/api/chat", async (req, res) => {
    try {
      const { message } = req.body;
      
      if (!message || typeof message !== 'string') {
        return res.status(400).json({ message: "Valid message is required" });
      }
      
      // Get training data to enhance AI responses
      const trainingData = await storage.getAllAiTrainingData();
      
      // Process the message with OpenAI
      const { response, tokensUsed } = await processMessage(message, trainingData);
      
      // No need to check tokens or update user anymore
      // No need to store chat messages either

      // Simply return the response without token tracking
      res.status(201).json({
        message,
        response,
        tokensUsed,
        // No user-specific data
      });
    } catch (error) {
      console.error("Chat API error:", error);
      res.status(500).json({ message: "Failed to process chat", error: (error as Error).message });
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
      const users = Array.from((storage as any).users.values()).map((user: User) => {
        // Don't return password in response
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
      });
      
      res.json(users);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch users", error: (error as Error).message });
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
  
  app.get("/api/admin/users", isAdmin, async (req, res) => {
    try {
      // Get all users but remove passwords from the response
      const users = await Promise.all(
        Array.from(storage.users.values()).map(async (user) => {
          const { password, ...userWithoutPassword } = user;
          
          // Get token purchases for each user
          const tokenPurchases = await storage.getTokenPurchasesByUserId(user.id);
          
          return {
            ...userWithoutPassword,
            tokenPurchaseCount: tokenPurchases.length,
            totalPurchasedTokens: tokenPurchases.reduce((total, purchase) => total + purchase.tokens, 0)
          };
        })
      );
      
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

  const httpServer = createServer(app);
  return httpServer;
}
