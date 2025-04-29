import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserSchema, insertProjectSchema, insertCounselingSessionSchema, insertChatMessageSchema, insertAiTrainingDataSchema, insertTokenPurchaseSchema } from "@shared/schema";
import { processMessage } from "./openai-service";
import { ZodError } from "zod";

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

  // Counseling session routes
  app.post("/api/counseling", validateRequest(insertCounselingSessionSchema), async (req, res) => {
    try {
      const session = await storage.createCounselingSession(req.body);
      res.status(201).json(session);
    } catch (error) {
      res.status(500).json({ message: "Failed to book session", error: (error as Error).message });
    }
  });

  app.patch("/api/counseling/:id/payment", async (req, res) => {
    try {
      const { id } = req.params;
      const { paymentId } = req.body;
      
      if (!paymentId) {
        return res.status(400).json({ message: "Payment ID is required" });
      }
      
      const session = await storage.updateCounselingSessionPayment(parseInt(id), paymentId);
      if (!session) {
        return res.status(404).json({ message: "Counseling session not found" });
      }
      
      res.json(session);
    } catch (error) {
      res.status(500).json({ message: "Failed to update payment status", error: (error as Error).message });
    }
  });

  // AI Chat routes
  app.post("/api/chat", async (req, res) => {
    try {
      const userId = req.session.userId;
      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const { message } = req.body;
      
      if (!message || typeof message !== 'string') {
        return res.status(400).json({ message: "Valid message is required" });
      }
      
      // Get training data to enhance AI responses
      const trainingData = await storage.getAllAiTrainingData();
      
      // Process the message with OpenAI
      const { response, tokensUsed } = await processMessage(message, trainingData);
      
      // Check if user has enough tokens
      if (user.tokens < tokensUsed) {
        return res.status(403).json({ 
          message: "Insufficient tokens",
          requiredTokens: tokensUsed,
          availableTokens: user.tokens
        });
      }
      
      // Deduct tokens from user
      await storage.updateUserTokens(userId, user.tokens - tokensUsed);
      
      // Create chat message in storage
      const chatMessage = await storage.createChatMessage({
        userId,
        message,
        response,
        tokensUsed
      });
      
      res.status(201).json({
        id: chatMessage.id,
        message,
        response,
        tokensUsed,
        remainingTokens: user.tokens - tokensUsed
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

  const httpServer = createServer(app);
  return httpServer;
}
