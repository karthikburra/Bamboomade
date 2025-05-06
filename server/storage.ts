import { 
  users, type User, type InsertUser,
  projects, type Project, type InsertProject,
  projectGuidances, type ProjectGuidance, type InsertProjectGuidance,
  chatMessages, type ChatMessage, type InsertChatMessage,
  aiTrainingData, type AiTrainingData, type InsertAiTrainingData,
  tokenPurchases, type TokenPurchase, type InsertTokenPurchase,
  availableTimeSlots, type AvailableTimeSlot, type InsertAvailableTimeSlot
} from "@shared/schema";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserTokens(userId: number, tokens: number): Promise<User | undefined>;
  updateUserAdminStatus(userId: number, isAdmin: boolean): Promise<User | undefined>;
  
  // Project operations
  getAllProjects(): Promise<Project[]>;
  getProjectsByCategory(category: string): Promise<Project[]>;
  getFeaturedProjects(): Promise<Project[]>;
  createProject(project: InsertProject): Promise<Project>;
  
  // Project guidance operations
  getAllProjectGuidances(): Promise<ProjectGuidance[]>;
  getProjectGuidance(id: number): Promise<ProjectGuidance | undefined>;
  createProjectGuidance(session: InsertProjectGuidance): Promise<ProjectGuidance>;
  updateProjectGuidancePayment(id: number, paymentId: string, amount?: number): Promise<ProjectGuidance | undefined>;
  updateProjectGuidanceSession(id: number, newDate: Date, newDuration: number, rescheduledBy: 'admin' | 'user'): Promise<ProjectGuidance | undefined>;
  updateProjectGuidanceMeetLink(id: number, googleMeetLink: string): Promise<ProjectGuidance | undefined>;
  cancelProjectGuidanceSession(id: number, reason: string, refundAmount: number, refundPercentage: number): Promise<ProjectGuidance | undefined>;
  
  // Chat message operations
  getChatMessagesByUserId(userId: number): Promise<ChatMessage[]>;
  createChatMessage(message: InsertChatMessage): Promise<ChatMessage>;
  
  // AI training data operations
  getAllAiTrainingData(): Promise<AiTrainingData[]>;
  createAiTrainingData(data: InsertAiTrainingData): Promise<AiTrainingData>;
  
  // Token purchase operations
  getTokenPurchasesByUserId(userId: number): Promise<TokenPurchase[]>;
  createTokenPurchase(purchase: InsertTokenPurchase): Promise<TokenPurchase>;
  
  // Available time slots operations
  getAllAvailableTimeSlots(): Promise<AvailableTimeSlot[]>;
  getAvailableTimeSlotById(id: number): Promise<AvailableTimeSlot | undefined>;
  getAvailableTimeSlotByDate(date: string): Promise<AvailableTimeSlot | undefined>;
  createAvailableTimeSlot(slot: InsertAvailableTimeSlot): Promise<AvailableTimeSlot>;
  updateAvailableTimeSlot(id: number, slots: string[]): Promise<AvailableTimeSlot | undefined>;
  deleteAvailableTimeSlot(id: number): Promise<boolean>;
}

import { eq, and, asc, desc } from 'drizzle-orm';
import { db } from './db';

export class DatabaseStorage implements IStorage {
  constructor() {
    // Initialize database connection
    console.log("Initialized database storage");
  }
  
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    try {
      const [user] = await db.select().from(users).where(eq(users.id, id));
      return user;
    } catch (error) {
      console.error("Database error in getUser:", error);
      return undefined;
    }
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    try {
      const [user] = await db.select().from(users).where(eq(users.username, username));
      return user;
    } catch (error) {
      console.error("Database error in getUserByUsername:", error);
      return undefined;
    }
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    try {
      const [user] = await db.select().from(users).where(eq(users.email, email));
      return user;
    } catch (error) {
      console.error("Database error in getUserByEmail:", error);
      return undefined;
    }
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    try {
      const [user] = await db.insert(users).values({
        username: insertUser.username,
        password: insertUser.password,
        email: insertUser.email,
        role: insertUser.role || 'user',
        isAdmin: insertUser.role === 'admin'
      }).returning();
      return user;
    } catch (error) {
      console.error("Database error in createUser:", error);
      throw error;
    }
  }

  async updateUserTokens(userId: number, tokens: number): Promise<User | undefined> {
    try {
      const [updatedUser] = await db.update(users)
        .set({ tokens })
        .where(eq(users.id, userId))
        .returning();
      return updatedUser;
    } catch (error) {
      console.error("Database error in updateUserTokens:", error);
      return undefined;
    }
  }
  
  async updateUserAdminStatus(userId: number, isAdmin: boolean): Promise<User | undefined> {
    try {
      const [updatedUser] = await db.update(users)
        .set({ isAdmin })
        .where(eq(users.id, userId))
        .returning();
      return updatedUser;
    } catch (error) {
      console.error("Database error in updateUserAdminStatus:", error);
      return undefined;
    }
  }
  
  // Project operations
  async getAllProjects(): Promise<Project[]> {
    try {
      return await db.select().from(projects);
    } catch (error) {
      console.error("Database error in getAllProjects:", error);
      return [];
    }
  }

  async getProjectsByCategory(category: string): Promise<Project[]> {
    try {
      return await db.select().from(projects).where(eq(projects.category, category));
    } catch (error) {
      console.error("Database error in getProjectsByCategory:", error);
      return [];
    }
  }

  async getFeaturedProjects(): Promise<Project[]> {
    try {
      return await db.select().from(projects).where(eq(projects.featured, true));
    } catch (error) {
      console.error("Database error in getFeaturedProjects:", error);
      return [];
    }
  }

  async createProject(insertProject: InsertProject): Promise<Project> {
    try {
      const [project] = await db.insert(projects).values(insertProject).returning();
      return project;
    } catch (error) {
      console.error("Database error in createProject:", error);
      throw error;
    }
  }
  
  // Project guidance operations
  async getAllProjectGuidances(): Promise<ProjectGuidance[]> {
    try {
      return await db.select().from(projectGuidances);
    } catch (error) {
      console.error("Database error in getAllProjectGuidances:", error);
      return [];
    }
  }

  async getProjectGuidance(id: number): Promise<ProjectGuidance | undefined> {
    try {
      const [session] = await db.select().from(projectGuidances).where(eq(projectGuidances.id, id));
      return session;
    } catch (error) {
      console.error("Database error in getProjectGuidance:", error);
      return undefined;
    }
  }

  async createProjectGuidance(insertSession: InsertProjectGuidance): Promise<ProjectGuidance> {
    try {
      const [session] = await db.insert(projectGuidances).values({
        ...insertSession,
        // Add default values for any fields not in the insert schema
        status: "pending",
        paymentConfirmed: false,
        isStudent: true
      }).returning();
      return session;
    } catch (error) {
      console.error("Database error in createProjectGuidance:", error);
      throw error;
    }
  }

  async updateProjectGuidancePayment(id: number, paymentId: string, amount?: number): Promise<ProjectGuidance | undefined> {
    try {
      const [updatedSession] = await db.update(projectGuidances)
        .set({ 
          paymentConfirmed: true, 
          paymentId, 
          amount: amount || null,
          status: "active" 
        })
        .where(eq(projectGuidances.id, id))
        .returning();
      return updatedSession;
    } catch (error) {
      console.error("Database error in updateProjectGuidancePayment:", error);
      return undefined;
    }
  }
  
  async updateProjectGuidanceSession(id: number, newDate: Date, newDuration: number, rescheduledBy: 'admin' | 'user'): Promise<ProjectGuidance | undefined> {
    try {
      // First get the current session to preserve the original date if it exists
      const [currentSession] = await db.select().from(projectGuidances).where(eq(projectGuidances.id, id));
      if (!currentSession) return undefined;
      
      // Store the original date if this is the first time rescheduling
      const originalDate = currentSession.originalDate || currentSession.date;
      
      const [updatedSession] = await db.update(projectGuidances)
        .set({ 
          date: newDate,
          originalDate: originalDate,
          duration: newDuration,
          status: "rescheduled",
          rescheduledBy,
          rescheduledDate: new Date()
        })
        .where(eq(projectGuidances.id, id))
        .returning();
      return updatedSession;
    } catch (error) {
      console.error("Database error in updateProjectGuidanceSession:", error);
      return undefined;
    }
  }
  
  async cancelProjectGuidanceSession(id: number, reason: string, refundAmount: number, refundPercentage: number): Promise<ProjectGuidance | undefined> {
    try {
      const [updatedSession] = await db.update(projectGuidances)
        .set({ 
          status: "cancelled",
          cancellationReason: reason,
          cancellationDate: new Date(),
          refundAmount,
          refundPercentage
        })
        .where(eq(projectGuidances.id, id))
        .returning();
      return updatedSession;
    } catch (error) {
      console.error("Database error in cancelProjectGuidanceSession:", error);
      return undefined;
    }
  }
  
  async updateProjectGuidanceMeetLink(id: number, googleMeetLink: string): Promise<ProjectGuidance | undefined> {
    try {
      const [updatedSession] = await db.update(projectGuidances)
        .set({ 
          googleMeetLink,
          status: "confirmed"
        })
        .where(eq(projectGuidances.id, id))
        .returning();
      return updatedSession;
    } catch (error) {
      console.error("Database error in updateProjectGuidanceMeetLink:", error);
      return undefined;
    }
  }
  
  // Chat message operations
  async getChatMessagesByUserId(userId: number): Promise<ChatMessage[]> {
    try {
      return await db.select()
        .from(chatMessages)
        .where(eq(chatMessages.userId, userId));
    } catch (error) {
      console.error("Database error in getChatMessagesByUserId:", error);
      return [];
    }
  }

  async createChatMessage(message: InsertChatMessage): Promise<ChatMessage> {
    try {
      const [createdMessage] = await db.insert(chatMessages)
        .values(message)
        .returning();
      return createdMessage;
    } catch (error) {
      console.error("Database error in createChatMessage:", error);
      throw error;
    }
  }
  
  // AI training data operations
  async getAllAiTrainingData(): Promise<AiTrainingData[]> {
    try {
      return await db.select().from(aiTrainingData);
    } catch (error) {
      console.error("Database error in getAllAiTrainingData:", error);
      return [];
    }
  }

  async createAiTrainingData(data: InsertAiTrainingData): Promise<AiTrainingData> {
    try {
      const [trainingData] = await db.insert(aiTrainingData)
        .values(data)
        .returning();
      return trainingData;
    } catch (error) {
      console.error("Database error in createAiTrainingData:", error);
      throw error;
    }
  }
  
  // Token purchase operations
  async getTokenPurchasesByUserId(userId: number): Promise<TokenPurchase[]> {
    try {
      return await db.select()
        .from(tokenPurchases)
        .where(eq(tokenPurchases.userId, userId));
    } catch (error) {
      console.error("Database error in getTokenPurchasesByUserId:", error);
      return [];
    }
  }

  async createTokenPurchase(purchase: InsertTokenPurchase): Promise<TokenPurchase> {
    try {
      const [tokenPurchase] = await db.insert(tokenPurchases)
        .values(purchase)
        .returning();
      return tokenPurchase;
    } catch (error) {
      console.error("Database error in createTokenPurchase:", error);
      throw error;
    }
  }
  
  // Available time slots operations
  async getAllAvailableTimeSlots(): Promise<AvailableTimeSlot[]> {
    try {
      return await db.select().from(availableTimeSlots);
    } catch (error) {
      console.error("Database error in getAllAvailableTimeSlots:", error);
      return [];
    }
  }

  async getAvailableTimeSlotById(id: number): Promise<AvailableTimeSlot | undefined> {
    try {
      const [slot] = await db.select()
        .from(availableTimeSlots)
        .where(eq(availableTimeSlots.id, id));
      return slot;
    } catch (error) {
      console.error("Database error in getAvailableTimeSlotById:", error);
      return undefined;
    }
  }

  async getAvailableTimeSlotByDate(date: string): Promise<AvailableTimeSlot | undefined> {
    try {
      const [slot] = await db.select()
        .from(availableTimeSlots)
        .where(eq(availableTimeSlots.date, date));
      return slot;
    } catch (error) {
      console.error("Database error in getAvailableTimeSlotByDate:", error);
      return undefined;
    }
  }

  async createAvailableTimeSlot(slot: InsertAvailableTimeSlot): Promise<AvailableTimeSlot> {
    try {
      const [createdSlot] = await db.insert(availableTimeSlots)
        .values(slot)
        .returning();
      return createdSlot;
    } catch (error) {
      console.error("Database error in createAvailableTimeSlot:", error);
      throw error;
    }
  }

  async updateAvailableTimeSlot(id: number, slots: string[]): Promise<AvailableTimeSlot | undefined> {
    try {
      const [updatedSlot] = await db.update(availableTimeSlots)
        .set({ 
          slots,
          updatedAt: new Date()
        })
        .where(eq(availableTimeSlots.id, id))
        .returning();
      return updatedSlot;
    } catch (error) {
      console.error("Database error in updateAvailableTimeSlot:", error);
      return undefined;
    }
  }

  async deleteAvailableTimeSlot(id: number): Promise<boolean> {
    try {
      const result = await db.delete(availableTimeSlots)
        .where(eq(availableTimeSlots.id, id));
      return true;
    } catch (error) {
      console.error("Database error in deleteAvailableTimeSlot:", error);
      return false;
    }
  }

  private seedData() {
    // Create admin user
    this.createUser({
      username: "admin",
      password: "admin123",
      email: "admin@bamboomade.com",
      role: "admin",
    });

    // Create some projects
    const projectData = [
      {
        title: "Bamboo Pavilion",
        description: "A sustainable pavilion structure using bundled bamboo poles",
        imageUrl: "https://source.unsplash.com/featured/?bamboo,architecture",
        category: "architecture",
        featured: true
      },
      {
        title: "Eco-Resort Bungalows",
        description: "Series of bamboo bungalows designed for minimal environmental impact",
        imageUrl: "https://source.unsplash.com/featured/?bamboo,resort",
        category: "architecture",
        featured: true
      },
      {
        title: "Bamboo Mirror With Lights",
        description: "Handcrafted decorative mirror frame with integrated LED lighting, showcasing bamboo weaving techniques",
        imageUrl: "/img/projects/bamboo-mirror.png",
        category: "art-and-craft",
        featured: true
      },
      {
        title: "X-Frame Bamboo Table",
        description: "Innovative bamboo joinery table design featuring cross-braced supports and natural finish",
        imageUrl: "/img/projects/bamboo-joinery.png",
        category: "design",
        featured: true
      },
      {
        title: "Bamboo Joinery Workshop",
        description: "Hands-on workshop teaching traditional bamboo joinery techniques",
        imageUrl: "https://source.unsplash.com/featured/?bamboo,workshop",
        category: "workshop",
        featured: true
      },
      {
        title: "Bamboo Bridge Design",
        description: "Suspended footbridge using tensile bamboo construction",
        imageUrl: "https://source.unsplash.com/featured/?bamboo,bridge",
        category: "architecture",
        featured: false
      },
      {
        title: "Material Innovation Workshop",
        description: "Exploring new applications of bamboo in modern construction",
        imageUrl: "https://source.unsplash.com/featured/?bamboo,construction",
        category: "workshop",
        featured: false
      },
      {
        title: "Bamboo Chair Design",
        description: "A simple yet sturdy bamboo chair with plywood seat, showcasing practical joinery techniques",
        imageUrl: "/img/projects/bamboo-chair.png",
        category: "design",
        featured: false
      },
      {
        title: "Rural Artisan Workshop",
        description: "Training workshop for village artisans to master bamboo basket weaving and product design",
        imageUrl: "/img/projects/bamboo-workshop-training.png",
        category: "workshop",
        featured: false
      }
    ];

    projectData.forEach(project => this.createProject(project));
    
    // Create some AI training data
    const trainingData = [
      {
        question: "What are the benefits of bamboo as a building material?",
        answer: "Bamboo is sustainable, renewable, has high tensile strength, is lightweight yet durable, and has excellent flexibility. It's also carbon-negative during growth and can be harvested much faster than timber.",
        category: "materials"
      },
      {
        question: "How do you treat bamboo to prevent insects and decay?",
        answer: "Common treatment methods include boron solutions (borax and boric acid), lime washing, smoking, and modern pressure treatment. Each method has different applications and effectiveness depending on the bamboo's use case.",
        category: "techniques"
      },
      {
        question: "What types of bamboo are best for construction?",
        answer: "Dendrocalamus asper (Giant Bamboo), Guadua angustifolia, Phyllostachys bambusoides (Madake), and Bambusa balcooa are among the best species for construction due to their strength, thickness, and durability.",
        category: "materials"
      }
    ];

    trainingData.forEach(data => this.createAiTrainingData(data));
    
    // Create test project guidance sessions for development testing
    const testProjectGuidances = [
      {
        studentName: "Test User",
        email: "test@example.com",
        phone: "9876543210",
        date: new Date(new Date().getTime() + 7 * 24 * 60 * 60 * 1000), // One week from now
        duration: 60, // 60 minutes
        topic: "Bamboo Building Project - Test session",
        notes: "This is a test project guidance session for development"
      }
    ];
    
    testProjectGuidances.forEach(session => this.createProjectGuidance(session));
    
    // Create sample available time slots for demonstration
    const today = new Date();
    
    // Generate dates for the next 7 days
    for (let i = 1; i <= 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      
      // Skip weekends (Saturday and Sunday)
      if (date.getDay() === 0 || date.getDay() === 6) continue;
      
      // Format date as YYYY-MM-DD
      const formattedDate = date.toISOString().split('T')[0];
      
      // Default available time slots
      const timeSlots = ["09:00", "10:00", "11:00", "13:00", "14:00", "15:00"];
      
      this.createAvailableTimeSlot({
        date: formattedDate,
        slots: timeSlots,
        createdBy: 1 // Admin user ID
      });
    }
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username
    );
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email === email
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const role = insertUser.role || "user";
    const user: User = { 
      ...insertUser, 
      id, 
      role, 
      tokens: 10, 
      isAdmin: role === "admin" 
    };
    this.users.set(id, user);
    return user;
  }

  async updateUserTokens(userId: number, tokens: number): Promise<User | undefined> {
    const user = await this.getUser(userId);
    if (!user) return undefined;
    
    const updatedUser = { ...user, tokens };
    this.users.set(userId, updatedUser);
    return updatedUser;
  }
  
  async updateUserAdminStatus(userId: number, isAdmin: boolean): Promise<User | undefined> {
    const user = await this.getUser(userId);
    if (!user) return undefined;
    
    const updatedUser = { ...user, isAdmin };
    this.users.set(userId, updatedUser);
    return updatedUser;
  }
  
  // Project operations
  async getAllProjects(): Promise<Project[]> {
    return Array.from(this.projects.values());
  }

  async getProjectsByCategory(category: string): Promise<Project[]> {
    return Array.from(this.projects.values()).filter(
      (project) => project.category === category
    );
  }

  async getFeaturedProjects(): Promise<Project[]> {
    return Array.from(this.projects.values()).filter(
      (project) => project.featured
    );
  }

  async createProject(insertProject: InsertProject): Promise<Project> {
    const id = this.currentProjectId++;
    const featured = insertProject.featured === undefined ? false : insertProject.featured;
    const project: Project = { 
      ...insertProject, 
      id,
      featured 
    };
    this.projects.set(id, project);
    return project;
  }
  
  // Project guidance operations
  async getAllProjectGuidances(): Promise<ProjectGuidance[]> {
    return Array.from(this.projectGuidances.values());
  }

  async getProjectGuidance(id: number): Promise<ProjectGuidance | undefined> {
    return this.projectGuidances.get(id);
  }

  async createProjectGuidance(insertSession: InsertProjectGuidance): Promise<ProjectGuidance> {
    const id = this.currentProjectGuidanceId++;
    
    // Extract isStudent from insertSession if available
    const isStudentValue = 'isStudent' in insertSession 
      ? (insertSession as any).isStudent 
      : true; // Default to true if not specified
      
    const session: ProjectGuidance = { 
      id,
      date: insertSession.date,
      email: insertSession.email,
      studentName: insertSession.studentName,
      phone: insertSession.phone,
      duration: insertSession.duration,
      topic: insertSession.topic,
      notes: insertSession.notes || null,
      paymentConfirmed: false,
      paymentId: null,
      status: "pending",
      cancellationReason: null,
      cancellationDate: null,
      refundAmount: null,
      refundPercentage: null,
      amount: null,
      googleMeetLink: null,
      isStudent: isStudentValue,
      originalDate: null,
      rescheduledBy: null,
      rescheduledDate: null
    };
    this.projectGuidances.set(id, session);
    return session;
  }

  async updateProjectGuidancePayment(id: number, paymentId: string, amount?: number): Promise<ProjectGuidance | undefined> {
    const session = await this.getProjectGuidance(id);
    if (!session) return undefined;
    
    const updatedSession: ProjectGuidance = { 
      ...session, 
      paymentConfirmed: true, 
      paymentId,
      amount: amount || null,
      status: "active"
    };
    this.projectGuidances.set(id, updatedSession);
    return updatedSession;
  }
  
  async updateProjectGuidanceSession(id: number, newDate: Date, newDuration: number, rescheduledBy: 'admin' | 'user'): Promise<ProjectGuidance | undefined> {
    const session = await this.getProjectGuidance(id);
    if (!session) return undefined;
    
    // Store the original date if this is the first time rescheduling
    const originalDate = session.originalDate || session.date;
    
    const updatedSession: ProjectGuidance = { 
      ...session, 
      date: newDate,
      originalDate: originalDate,
      duration: newDuration || session.duration,
      status: "rescheduled",
      rescheduledBy: rescheduledBy,
      rescheduledDate: new Date()
    };
    this.projectGuidances.set(id, updatedSession);
    return updatedSession;
  }
  
  async cancelProjectGuidanceSession(id: number, reason: string, refundAmount: number, refundPercentage: number): Promise<ProjectGuidance | undefined> {
    const session = await this.getProjectGuidance(id);
    if (!session) return undefined;
    
    const updatedSession: ProjectGuidance = { 
      ...session, 
      status: "cancelled",
      cancellationReason: reason,
      cancellationDate: new Date(),
      refundAmount: refundAmount,
      refundPercentage: refundPercentage
    };
    this.projectGuidances.set(id, updatedSession);
    return updatedSession;
  }
  
  async updateProjectGuidanceMeetLink(id: number, googleMeetLink: string): Promise<ProjectGuidance | undefined> {
    const session = await this.getProjectGuidance(id);
    if (!session) return undefined;
    
    const updatedSession: ProjectGuidance = { 
      ...session, 
      googleMeetLink,
      status: "confirmed"
    };
    this.projectGuidances.set(id, updatedSession);
    return updatedSession;
  }
  
  // Chat message operations
  async getChatMessagesByUserId(userId: number): Promise<ChatMessage[]> {
    return Array.from(this.chatMessages.values()).filter(
      (message) => message.userId === userId
    );
  }

  async createChatMessage(insertMessage: InsertChatMessage): Promise<ChatMessage> {
    const id = this.currentChatMessageId++;
    const message: ChatMessage = { 
      ...insertMessage, 
      id, 
      timestamp: new Date() 
    };
    this.chatMessages.set(id, message);
    return message;
  }
  
  // AI training data operations
  async getAllAiTrainingData(): Promise<AiTrainingData[]> {
    return Array.from(this.aiTrainingData.values());
  }

  async createAiTrainingData(insertData: InsertAiTrainingData): Promise<AiTrainingData> {
    const id = this.currentAiTrainingDataId++;
    const data: AiTrainingData = { 
      ...insertData, 
      id, 
      createdAt: new Date() 
    };
    this.aiTrainingData.set(id, data);
    return data;
  }
  
  // Token purchase operations
  async getTokenPurchasesByUserId(userId: number): Promise<TokenPurchase[]> {
    return Array.from(this.tokenPurchases.values()).filter(
      (purchase) => purchase.userId === userId
    );
  }

  async createTokenPurchase(insertPurchase: InsertTokenPurchase): Promise<TokenPurchase> {
    const id = this.currentTokenPurchaseId++;
    const purchase: TokenPurchase = { 
      ...insertPurchase, 
      id, 
      purchaseDate: new Date() 
    };
    this.tokenPurchases.set(id, purchase);
    
    // Update user tokens
    const user = await this.getUser(insertPurchase.userId);
    if (user) {
      await this.updateUserTokens(user.id, user.tokens + insertPurchase.amount);
    }
    
    return purchase;
  }
  
  // Available time slots operations
  async getAllAvailableTimeSlots(): Promise<AvailableTimeSlot[]> {
    return Array.from(this.availableTimeSlots.values());
  }
  
  async getAvailableTimeSlotById(id: number): Promise<AvailableTimeSlot | undefined> {
    return this.availableTimeSlots.get(id);
  }
  
  async getAvailableTimeSlotByDate(date: string): Promise<AvailableTimeSlot | undefined> {
    return Array.from(this.availableTimeSlots.values()).find(
      (slot) => slot.date === date
    );
  }
  
  async createAvailableTimeSlot(insertSlot: InsertAvailableTimeSlot): Promise<AvailableTimeSlot> {
    const id = this.currentAvailableTimeSlotId++;
    
    // Create properly typed slot data
    const slotData: AvailableTimeSlot = {
      id,
      date: insertSlot.date,
      slots: [], // Initialize as empty array first
      createdBy: insertSlot.createdBy,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    // Then safely add the slots
    if (insertSlot.slots && Array.isArray(insertSlot.slots)) {
      slotData.slots = insertSlot.slots.map(slot => String(slot));
    }
    
    this.availableTimeSlots.set(id, slotData);
    return slotData;
  }
  
  async updateAvailableTimeSlot(id: number, slots: string[]): Promise<AvailableTimeSlot | undefined> {
    const slot = await this.getAvailableTimeSlotById(id);
    if (!slot) return undefined;
    
    const updatedSlot: AvailableTimeSlot = {
      ...slot,
      slots,
      updatedAt: new Date()
    };
    
    this.availableTimeSlots.set(id, updatedSlot);
    return updatedSlot;
  }
  
  async deleteAvailableTimeSlot(id: number): Promise<boolean> {
    const exists = this.availableTimeSlots.has(id);
    if (!exists) return false;
    
    this.availableTimeSlots.delete(id);
    return true;
  }
}

export const storage = new DatabaseStorage();
