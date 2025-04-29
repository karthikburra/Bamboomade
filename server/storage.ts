import { 
  users, type User, type InsertUser,
  projects, type Project, type InsertProject,
  counselingSessions, type CounselingSession, type InsertCounselingSession,
  chatMessages, type ChatMessage, type InsertChatMessage,
  aiTrainingData, type AiTrainingData, type InsertAiTrainingData,
  tokenPurchases, type TokenPurchase, type InsertTokenPurchase
} from "@shared/schema";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserTokens(userId: number, tokens: number): Promise<User | undefined>;
  
  // Project operations
  getAllProjects(): Promise<Project[]>;
  getProjectsByCategory(category: string): Promise<Project[]>;
  getFeaturedProjects(): Promise<Project[]>;
  createProject(project: InsertProject): Promise<Project>;
  
  // Counseling session operations
  getAllCounselingSessions(): Promise<CounselingSession[]>;
  getCounselingSession(id: number): Promise<CounselingSession | undefined>;
  createCounselingSession(session: InsertCounselingSession): Promise<CounselingSession>;
  updateProjectGuidancePayment(id: number, paymentId: string): Promise<ProjectGuidance | undefined>;
  
  // Chat message operations
  getChatMessagesByUserId(userId: number): Promise<ChatMessage[]>;
  createChatMessage(message: InsertChatMessage): Promise<ChatMessage>;
  
  // AI training data operations
  getAllAiTrainingData(): Promise<AiTrainingData[]>;
  createAiTrainingData(data: InsertAiTrainingData): Promise<AiTrainingData>;
  
  // Token purchase operations
  getTokenPurchasesByUserId(userId: number): Promise<TokenPurchase[]>;
  createTokenPurchase(purchase: InsertTokenPurchase): Promise<TokenPurchase>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private projects: Map<number, Project>;
  private counselingSessions: Map<number, CounselingSession>;
  private chatMessages: Map<number, ChatMessage>;
  private aiTrainingData: Map<number, AiTrainingData>;
  private tokenPurchases: Map<number, TokenPurchase>;
  
  private currentUserId: number;
  private currentProjectId: number;
  private currentCounselingSessionId: number;
  private currentChatMessageId: number;
  private currentAiTrainingDataId: number;
  private currentTokenPurchaseId: number;

  constructor() {
    this.users = new Map();
    this.projects = new Map();
    this.counselingSessions = new Map();
    this.chatMessages = new Map();
    this.aiTrainingData = new Map();
    this.tokenPurchases = new Map();
    
    this.currentUserId = 1;
    this.currentProjectId = 1;
    this.currentCounselingSessionId = 1;
    this.currentChatMessageId = 1;
    this.currentAiTrainingDataId = 1;
    this.currentTokenPurchaseId = 1;
    
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
    const user: User = { 
      ...insertUser, 
      id, 
      tokens: 10, 
      isAdmin: insertUser.role === "admin" 
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
    const project: Project = { ...insertProject, id };
    this.projects.set(id, project);
    return project;
  }
  
  // Counseling session operations
  async getAllCounselingSessions(): Promise<CounselingSession[]> {
    return Array.from(this.counselingSessions.values());
  }

  async getCounselingSession(id: number): Promise<CounselingSession | undefined> {
    return this.counselingSessions.get(id);
  }

  async createCounselingSession(insertSession: InsertCounselingSession): Promise<CounselingSession> {
    const id = this.currentCounselingSessionId++;
    const session: CounselingSession = { 
      ...insertSession, 
      id, 
      paymentConfirmed: false,
      paymentId: undefined
    };
    this.counselingSessions.set(id, session);
    return session;
  }

  async updateProjectGuidancePayment(id: number, paymentId: string): Promise<ProjectGuidance | undefined> {
    // For now, this is still using the counselingSessions map until we fully migrate
    const session = await this.getCounselingSession(id);
    if (!session) return undefined;
    
    const updatedSession = { 
      ...session, 
      paymentConfirmed: true, 
      paymentId 
    };
    this.counselingSessions.set(id, updatedSession);
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
}

export const storage = new MemStorage();
