import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserSchema, insertProjectSchema, insertProjectGuidanceSchema, insertChatMessageSchema, insertAiTrainingDataSchema, insertTokenPurchaseSchema } from "@shared/schema";
import { processMessage, convertWhatsAppToTrainingData } from "./openai-service.js";
import { initiatePhonePePayment, checkPhonePePaymentStatus } from "./phonepe-service";
import { sendBookingConfirmationEmail } from "./email-service";
import { ZodError } from "zod";
import { z } from "zod";
import admin from "firebase-admin";

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

export async function registerRoutes(app: Express): Promise<Server> {
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
      
      const user = await storage.createUser(req.body);
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
      if (!user || user.password !== password) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      // Set user in session (simplified auth)
      req.session.userId = user.id;
      
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
        // Create a new user
        user = await storage.createUser({
          email,
          username: name || email.split('@')[0],
          password: '', // Not used with Google auth
          isAdmin: false,
          tokens: 10, // Start with some free tokens
        });
      }
      
      // Set user in session
      req.session.userId = user.id;
      
      // Don't return password in response
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
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
      
      res.json(session);
    } catch (error) {
      res.status(500).json({ message: "Failed to update payment status", error: (error as Error).message });
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
      
      if (!amount || !sessionId || !customerName || !customerPhone || !customerEmail) {
        return res.status(400).json({ 
          success: false,
          message: "Missing required payment information" 
        });
      }

      // Verify that the required environment variables are set
      if (!process.env.PHONEPE_CLIENT_ID || !process.env.PHONEPE_CLIENT_SECRET) {
        console.error("Missing PhonePe credentials in environment variables");
        return res.status(500).json({
          success: false,
          message: "Payment service configuration error"
        });
      }

      // Generate a unique order ID
      const orderId = `ORDER_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
      
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
          console.error("PhonePe callback error: Transaction not found in storage");
          return res.status(404).send("Transaction not found");
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
          
          // Clean up the pending payment from whichever storage it was in
          if (global.pendingPayments && global.pendingPayments[txnId]) {
            delete global.pendingPayments[txnId];
          } else if (req.session?.pendingPayments) {
            delete req.session.pendingPayments[txnId];
          }
          
          // Redirect to success page
          return res.redirect('/payment-success?sessionId=' + pendingPayment.sessionId);
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
        } else if (req.session?.pendingPayments) {
          pendingPayment = req.session.pendingPayments[txnId];
        }
        
        if (!pendingPayment) {
          console.error("PhonePe callback error: Transaction not found in storage");
          return res.status(404).send("Transaction not found");
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
        
        // Clean up the pending payment from whichever storage it was in
        if (global.pendingPayments && global.pendingPayments[txnId]) {
          delete global.pendingPayments[txnId];
        } else if (req.session?.pendingPayments) {
          delete req.session.pendingPayments[txnId];
        }
        
        // Redirect to success page
        return res.redirect('/payment-success?sessionId=' + pendingPayment.sessionId);
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
