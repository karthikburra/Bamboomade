import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserSchema, insertProjectSchema, insertProjectGuidanceSchema, insertChatMessageSchema, insertAiTrainingDataSchema, insertTokenPurchaseSchema, User } from "@shared/schema";
import { processMessage, convertWhatsAppToTrainingData } from "./openai-service.js";
// PhonePe service removed
import { initiateRazorpayPayment, verifyRazorpayPayment, getRazorpayPaymentDetails } from "./razorpay-service";
import { 
  sendBookingConfirmationEmail, 
  initializeEmailService, 
  generateGoogleMeetLink, 
  generateGoogleCalendarLink,
  sendVerificationCodeEmail,
  sendRescheduledSessionEmail,
  sendCancellationEmail
} from "./email-service";
import { initializeSheetsService, updateProjectGuidanceSession, addUserToSheet } from "./sheets-service";
import { format, formatInTimeZone } from "date-fns-tz";
import { addMinutes } from "date-fns";
import { ZodError } from "zod";
import { z } from "zod";
import admin from "firebase-admin";
import bcrypt from "bcrypt";

// The time zone for India (IST)
const TIMEZONE = 'Asia/Kolkata';

// Helper function to format dates in IST
function formatInIST(date: Date, formatStr: string): string {
  return formatInTimeZone(date, TIMEZONE, formatStr);
}

// Function to check if a time slot is already booked
async function isTimeSlotBooked(date: Date, sessionIdToExclude?: number): Promise<boolean> {
  // Get all confirmed sessions to check for conflicts
  const allSessions = await storage.getAllProjectGuidances();
  
  // Format the date for comparison
  const targetDateStr = format(date, "yyyy-MM-dd");
  const targetTimeStr = format(date, "HH:mm");
  
  // Check if any session conflicts with this date and time
  return allSessions.some(session => {
    // Skip cancelled sessions and the session we're currently updating (if provided)
    if (session.status === 'cancelled' || (sessionIdToExclude && session.id === sessionIdToExclude)) {
      return false;
    }
    
    const sessionDate = new Date(session.date);
    const sessionDateStr = format(sessionDate, "yyyy-MM-dd");
    const sessionTimeStr = format(sessionDate, "HH:mm");
    
    // Check if date and time match
    return sessionDateStr === targetDateStr && sessionTimeStr === targetTimeStr;
  });
}

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
          isAdmin: true
        };
        
        // Force session save to ensure it's stored before sending response
        req.session.save((err) => {
          if (err) {
            console.error("Admin login: Error saving session:", err);
          } else {
            console.log("Admin login: Session saved successfully");
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
  
  app.post("/api/auth/admin-logout", (req, res) => {
    if (req.session.adminUser) {
      delete req.session.adminUser;
    }
    
    res.json({ message: "Admin logged out successfully" });
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
          formattedTime: formatInIST(sessionDate, "h:mm a"),
          formattedEndTime: formatInIST(sessionEndTime, "h:mm a"),
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
      
      // Send email notification about the reschedule
      await sendRescheduledSessionEmail(
        session.id,
        session.studentName,
        session.email,
        session.topic,
        parsedDate,
        newDuration || session.duration
      ).catch(err => console.error("Failed to send admin reschedule email:", err));
      
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
  
  app.post("/api/admin/update-meet-link", isAdmin, async (req, res) => {
    try {
      const { sessionId, googleMeetLink } = req.body;
      
      if (!sessionId || !googleMeetLink) {
        return res.status(400).json({ 
          success: false, 
          message: "Session ID and Google Meet link are required" 
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
      
      // Send email notification to the student with the Google Meet link
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
      
      // Send email with the updated information
      await sendBookingConfirmationEmail({
        sessionId: updatedSession.id,
        studentName: updatedSession.studentName,
        studentEmail: updatedSession.email,
        sessionDate,
        sessionDuration: updatedSession.duration,
        sessionTopic: updatedSession.topic
      });
      
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
          formattedTime: formatInIST(sessionDate, "h:mm a"),
          formattedEndTime: formatInIST(sessionEndTime, "h:mm a"),
          email: session.email,
          topic: session.topic,
          duration: session.duration,
          paymentStatus: session.paymentConfirmed ? 'Paid' : 'Pending',
          studentName: session.studentName,
          status: session.status || 'scheduled',
          googleMeetLink: googleMeetLink,
          calendarLink: calendarLink,
          isRescheduled: !!session.originalDate,
          originalDate: session.originalDate ? formatInIST(new Date(session.originalDate), "MMMM d, yyyy") : null
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
          time: formatInIST(sessionDate, 'h:mm a'),
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
      
      // Send verification email
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
      
      // Send email notification about the reschedule
      await sendRescheduledSessionEmail(
        selectedSession.id,
        selectedSession.studentName,
        email,
        selectedSession.topic,
        parsedDate, // Use the parsed date that we already validated
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
      
      // Send cancellation confirmation email
      await sendCancellationEmail(
        selectedSession.id,
        selectedSession.studentName,
        email,
        selectedSession.topic,
        sessionDate, // Use the parsed date that we already validated
        reason,
        refundPercentage,
        refundAmount
      ).catch(err => console.error("Failed to send cancellation email:", err));
      
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
                  
                  // Send confirmation email with Google Meet link
                  // Parse the session date
                  let sessionDate: Date;
                  try {
                    sessionDate = new Date(session.date);
                    
                    // Check if the date is valid
                    if (isNaN(sessionDate.getTime())) {
                      throw new Error("Invalid session date format");
                    }
                  } catch (e) {
                    console.error("Date parsing error in payment verification:", e);
                    // Continue with a fallback date rather than failing completely
                    sessionDate = new Date(); // Fallback to current date
                  }
                  
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

  // API endpoint to get available time slots for bookings
  app.get("/api/available-slots", async (req, res) => {
    try {
      const availableSlots = await storage.getAllAvailableTimeSlots();
      
      // Sort slots by date
      availableSlots.sort((a, b) => {
        return new Date(a.date).getTime() - new Date(b.date).getTime();
      });
      
      // Get all confirmed sessions to check for time slot conflicts
      const allSessions = await storage.getAllProjectGuidances();
      
      // Define a properly typed map for booked slots
      const bookedSlots: Record<string, string[]> = {};
      
      // Create a map of all booked slots by date and time
      allSessions.forEach(session => {
        if (session.paymentConfirmed && session.status !== 'cancelled') {
          const sessionDate = new Date(session.date);
          const sessionDateStr = format(sessionDate, "yyyy-MM-dd");
          const sessionTimeStr = format(sessionDate, "HH:mm");
          
          if (!bookedSlots[sessionDateStr]) {
            bookedSlots[sessionDateStr] = [];
          }
          
          // Add the booked time slot
          bookedSlots[sessionDateStr].push(sessionTimeStr);
        }
      });
      
      // Add booking status information to the available slots
      const enhancedSlots = availableSlots.map(slot => {
        const bookedTimesForDate = bookedSlots[slot.date] || [];
        
        // Mark which specific time slots are already booked
        const slotsWithStatus = slot.slots.map(timeSlot => {
          const isBooked = bookedTimesForDate.includes(timeSlot);
          return {
            time: timeSlot,
            isBooked
          };
        });
        
        // Calculate if all slots for this date are booked
        const allSlotsBooked = slotsWithStatus.every(s => s.isBooked);
        
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
      
      // Check if this date already exists
      const existingSlot = await storage.getAvailableTimeSlotByDate(date);
      if (existingSlot) {
        return res.status(400).json({
          success: false,
          message: "A time slot for this date already exists. Use PUT to update it."
        });
      }
      
      const userId = req.session.userId || 1; // Default to admin ID 1 if not logged in
      
      const newSlot = await storage.createAvailableTimeSlot({
        date,
        slots,
        createdBy: userId
      });
      
      res.status(201).json({
        success: true,
        slot: newSlot
      });
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

  const httpServer = createServer(app);
  return httpServer;
}
