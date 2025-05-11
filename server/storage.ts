import { 
  users, type User, type InsertUser,
  projects, type Project, type InsertProject,
  projectGuidances, type ProjectGuidance, type InsertProjectGuidance,
  chatMessages, type ChatMessage, type InsertChatMessage,
  aiTrainingData, type AiTrainingData, type InsertAiTrainingData,
  tokenPurchases, type TokenPurchase, type InsertTokenPurchase,
  availableTimeSlots, type AvailableTimeSlot, type InsertAvailableTimeSlot,
  aiKnowledgeContent, type AiKnowledgeContent, type InsertAiKnowledgeContent,
  dashboardSnapshots, type DashboardSnapshot, type InsertDashboardSnapshot
} from "@shared/schema";
import { eq, and, asc, desc } from 'drizzle-orm';
import { db } from './db';

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
  getProjectGuidancesByEmail(email: string): Promise<ProjectGuidance[]>;
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
  
  // AI Knowledge Content operations
  getAllAiKnowledgeContent(): Promise<AiKnowledgeContent[]>;
  getActiveAiKnowledgeContent(): Promise<AiKnowledgeContent[]>; // Get only active content for AI
  getPendingAiKnowledgeContent(): Promise<AiKnowledgeContent[]>; // Get only pending content for admin approval
  getAiKnowledgeContentById(id: number): Promise<AiKnowledgeContent | undefined>;
  getAiKnowledgeContentByType(contentType: string): Promise<AiKnowledgeContent[]>;
  createAiKnowledgeContent(content: InsertAiKnowledgeContent): Promise<AiKnowledgeContent>;
  updateAiKnowledgeContent(id: number, updates: Partial<AiKnowledgeContent>): Promise<AiKnowledgeContent | undefined>;
  deleteAiKnowledgeContent(id: number): Promise<boolean>;
  
  // Secure AI Knowledge Content backup & restore
  exportAiKnowledgeContentBackup(): Promise<{ data: AiKnowledgeContent[], timestamp: string, checksum: string }>;
  importAiKnowledgeContentBackup(backup: { data: AiKnowledgeContent[], timestamp: string, checksum: string }): Promise<{ success: boolean, imported: number, errors: number }>;
  
  // Dashboard Snapshots operations
  getDashboardSnapshotByDate(date: string): Promise<DashboardSnapshot | undefined>;
  getAllDashboardSnapshots(): Promise<DashboardSnapshot[]>;
  saveDashboardSnapshot(snapshot: InsertDashboardSnapshot): Promise<DashboardSnapshot>;
}

export class DatabaseStorage implements IStorage {
  constructor() {
    // Initialize database connection
    console.log("Initialized database storage");
  }
  
  // This method can be used to seed initial data if needed
  async seedData() {
    try {
      // Check if admin user exists
      const adminUser = await this.getUserByUsername("admin");
      
      if (!adminUser) {
        // Create admin user
        await this.createUser({
          username: "admin",
          password: "admin123",
          email: "info@bamboomade.in",
          role: "admin",
        });
      }
      
      console.log("Database seeding completed");
    } catch (error) {
      console.error("Error seeding data:", error);
    }
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
  
  async getProjectGuidancesByEmail(email: string): Promise<ProjectGuidance[]> {
    try {
      return await db.select().from(projectGuidances).where(eq(projectGuidances.email, email));
    } catch (error) {
      console.error("Database error in getProjectGuidancesByEmail:", error);
      return [];
    }
  }

  async createProjectGuidance(insertSession: InsertProjectGuidance): Promise<ProjectGuidance> {
    try {
      const [session] = await db.insert(projectGuidances).values({
        ...insertSession,
        // Add default values for any fields not in the insert schema
        status: "pending",
        paymentConfirmed: false,
        isStudent: 'isStudent' in insertSession ? (insertSession as any).isStudent : true
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
  
  // General update method for project guidance sessions
  async updateProjectGuidance(id: number, updates: Partial<ProjectGuidance>): Promise<ProjectGuidance | undefined> {
    try {
      const [updatedSession] = await db.update(projectGuidances)
        .set(updates)
        .where(eq(projectGuidances.id, id))
        .returning();
      return updatedSession;
    } catch (error) {
      console.error("Database error in updateProjectGuidance:", error);
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
  
  // AI Knowledge Content operations
  async getAllAiKnowledgeContent(): Promise<AiKnowledgeContent[]> {
    try {
      return await db.select().from(aiKnowledgeContent)
        .orderBy(desc(aiKnowledgeContent.createdAt));
    } catch (error) {
      console.error("Database error in getAllAiKnowledgeContent:", error);
      return [];
    }
  }
  
  // Get only active AI Knowledge Content for AI chat
  async getActiveAiKnowledgeContent(): Promise<AiKnowledgeContent[]> {
    try {
      return await db.select().from(aiKnowledgeContent)
        .where(eq(aiKnowledgeContent.status, 'active'))
        .orderBy(desc(aiKnowledgeContent.createdAt));
    } catch (error) {
      console.error("Database error in getActiveAiKnowledgeContent:", error);
      return [];
    }
  }
  
  // Get only pending AI Knowledge Content for admin approval
  async getPendingAiKnowledgeContent(): Promise<AiKnowledgeContent[]> {
    try {
      return await db.select().from(aiKnowledgeContent)
        .where(eq(aiKnowledgeContent.status, 'pending'))
        .orderBy(desc(aiKnowledgeContent.createdAt));
    } catch (error) {
      console.error("Database error in getPendingAiKnowledgeContent:", error);
      return [];
    }
  }
  
  // Secure backup of all AI Knowledge Content for future deployments
  async exportAiKnowledgeContentBackup(): Promise<{ data: AiKnowledgeContent[], timestamp: string, checksum: string }> {
    try {
      const knowledgeData = await db.select().from(aiKnowledgeContent);
      const timestamp = new Date().toISOString();
      
      // Create a checksum for data integrity verification
      const dataString = JSON.stringify(knowledgeData);
      const checksum = require('crypto').createHash('sha256').update(dataString).digest('hex');
      
      return {
        data: knowledgeData,
        timestamp,
        checksum
      };
    } catch (error) {
      console.error("Database error in exportAiKnowledgeContentBackup:", error);
      throw error;
    }
  }
  
  // Import AI Knowledge Content backup with verification
  async importAiKnowledgeContentBackup(backup: { 
    data: AiKnowledgeContent[], 
    timestamp: string, 
    checksum: string 
  }): Promise<{ success: boolean, imported: number, errors: number }> {
    try {
      // Verify the checksum to ensure data integrity
      const dataString = JSON.stringify(backup.data);
      const calculatedChecksum = require('crypto').createHash('sha256').update(dataString).digest('hex');
      
      if (calculatedChecksum !== backup.checksum) {
        throw new Error("Backup data integrity check failed: checksum mismatch");
      }
      
      let imported = 0;
      let errors = 0;
      
      // Process each item - either insert new or update existing
      for (const item of backup.data) {
        try {
          // Check if this content already exists by title
          const [existingContent] = await db.select()
            .from(aiKnowledgeContent)
            .where(eq(aiKnowledgeContent.title, item.title));
          
          if (existingContent) {
            // Update existing content
            await db.update(aiKnowledgeContent)
              .set({
                content: item.content,
                source: item.source,
                contentType: item.contentType,
                status: item.status,
                updatedAt: new Date()
              })
              .where(eq(aiKnowledgeContent.id, existingContent.id));
          } else {
            // Insert new content
            await db.insert(aiKnowledgeContent)
              .values({
                title: item.title,
                content: item.content,
                source: item.source,
                contentType: item.contentType,
                status: item.status,
                createdBy: item.createdBy,
                createdAt: new Date(),
                updatedAt: new Date()
              });
          }
          imported++;
        } catch (itemError) {
          console.error("Error importing item:", itemError);
          errors++;
        }
      }
      
      return { success: true, imported, errors };
    } catch (error) {
      console.error("Database error in importAiKnowledgeContentBackup:", error);
      throw error;
    }
  }

  async getAiKnowledgeContentById(id: number): Promise<AiKnowledgeContent | undefined> {
    try {
      const [content] = await db.select().from(aiKnowledgeContent)
        .where(eq(aiKnowledgeContent.id, id));
      return content;
    } catch (error) {
      console.error("Database error in getAiKnowledgeContentById:", error);
      return undefined;
    }
  }

  async getAiKnowledgeContentByType(contentType: string): Promise<AiKnowledgeContent[]> {
    try {
      return await db.select().from(aiKnowledgeContent)
        .where(eq(aiKnowledgeContent.contentType, contentType))
        .orderBy(desc(aiKnowledgeContent.createdAt));
    } catch (error) {
      console.error("Database error in getAiKnowledgeContentByType:", error);
      return [];
    }
  }

  async createAiKnowledgeContent(content: InsertAiKnowledgeContent): Promise<AiKnowledgeContent> {
    try {
      const [createdContent] = await db.insert(aiKnowledgeContent)
        .values(content)
        .returning();
      return createdContent;
    } catch (error) {
      console.error("Database error in createAiKnowledgeContent:", error);
      throw error;
    }
  }

  async updateAiKnowledgeContent(id: number, updates: Partial<AiKnowledgeContent>): Promise<AiKnowledgeContent | undefined> {
    try {
      // Make sure to update the updatedAt timestamp
      const updatesWithTimestamp = {
        ...updates,
        updatedAt: new Date()
      };
      
      const [updatedContent] = await db.update(aiKnowledgeContent)
        .set(updatesWithTimestamp)
        .where(eq(aiKnowledgeContent.id, id))
        .returning();
      return updatedContent;
    } catch (error) {
      console.error("Database error in updateAiKnowledgeContent:", error);
      return undefined;
    }
  }

  async deleteAiKnowledgeContent(id: number): Promise<boolean> {
    try {
      await db.delete(aiKnowledgeContent)
        .where(eq(aiKnowledgeContent.id, id));
      return true;
    } catch (error) {
      console.error("Database error in deleteAiKnowledgeContent:", error);
      return false;
    }
  }
  
  // Dashboard Snapshots operations
  async getDashboardSnapshotByDate(date: string): Promise<DashboardSnapshot | undefined> {
    try {
      const [snapshot] = await db.select()
        .from(dashboardSnapshots)
        .where(eq(dashboardSnapshots.date, date));
      return snapshot;
    } catch (error) {
      console.error("Database error in getDashboardSnapshotByDate:", error);
      return undefined;
    }
  }
  
  async getAllDashboardSnapshots(): Promise<DashboardSnapshot[]> {
    try {
      return await db.select()
        .from(dashboardSnapshots)
        .orderBy(desc(dashboardSnapshots.date));
    } catch (error) {
      console.error("Database error in getAllDashboardSnapshots:", error);
      return [];
    }
  }
  
  async saveDashboardSnapshot(snapshot: InsertDashboardSnapshot): Promise<DashboardSnapshot> {
    try {
      // Check if a snapshot already exists for this date
      const existingSnapshot = await this.getDashboardSnapshotByDate(snapshot.date);
      
      if (existingSnapshot) {
        // Update existing snapshot
        const [updatedSnapshot] = await db.update(dashboardSnapshots)
          .set(snapshot)
          .where(eq(dashboardSnapshots.date, snapshot.date))
          .returning();
        return updatedSnapshot;
      } else {
        // Create new snapshot
        const [createdSnapshot] = await db.insert(dashboardSnapshots)
          .values(snapshot)
          .returning();
        return createdSnapshot;
      }
    } catch (error) {
      console.error("Database error in saveDashboardSnapshot:", error);
      throw error;
    }
  }
}

export const storage = new DatabaseStorage();