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
  updateProjectGuidanceSession(id: number, newDate: Date, newDuration: number): Promise<ProjectGuidance | undefined>;
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

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private projects: Map<number, Project>;
  private projectGuidances: Map<number, ProjectGuidance>;
  private chatMessages: Map<number, ChatMessage>;
  private aiTrainingData: Map<number, AiTrainingData>;
  private tokenPurchases: Map<number, TokenPurchase>;
  private availableTimeSlots: Map<number, AvailableTimeSlot>;
  
  private currentUserId: number;
  private currentProjectId: number;
  private currentProjectGuidanceId: number;
  private currentChatMessageId: number;
  private currentAiTrainingDataId: number;
  private currentTokenPurchaseId: number;
  private currentAvailableTimeSlotId: number;

  constructor() {
    this.users = new Map();
    this.projects = new Map();
    this.projectGuidances = new Map();
    this.chatMessages = new Map();
    this.aiTrainingData = new Map();
    this.tokenPurchases = new Map();
    this.availableTimeSlots = new Map();
    
    this.currentUserId = 1;
    this.currentProjectId = 1;
    this.currentProjectGuidanceId = 1;
    this.currentChatMessageId = 1;
    this.currentAiTrainingDataId = 1;
    this.currentTokenPurchaseId = 1;
    this.currentAvailableTimeSlotId = 1;
    
    this.seedData();
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
      isStudent: isStudentValue
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
  
  async updateProjectGuidanceSession(id: number, newDate: Date, newDuration: number): Promise<ProjectGuidance | undefined> {
    const session = await this.getProjectGuidance(id);
    if (!session) return undefined;
    
    const updatedSession: ProjectGuidance = { 
      ...session, 
      date: newDate,
      duration: newDuration || session.duration
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
    const slot: AvailableTimeSlot = {
      ...insertSlot,
      id,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    this.availableTimeSlots.set(id, slot);
    return slot;
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

export const storage = new MemStorage();
