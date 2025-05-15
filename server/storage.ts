import { 
  users, type User, type InsertUser,
  projects, type Project, type InsertProject,
  projectGuidances, type ProjectGuidance, type InsertProjectGuidance,
  chatMessages, type ChatMessage, type InsertChatMessage,
  aiTrainingData, type AiTrainingData, type InsertAiTrainingData,
  tokenPurchases, type TokenPurchase, type InsertTokenPurchase,
  availableTimeSlots, type AvailableTimeSlot, type InsertAvailableTimeSlot,
  aiKnowledgeContent, type AiKnowledgeContent, type InsertAiKnowledgeContent,
  dashboardSnapshots, type DashboardSnapshot, type InsertDashboardSnapshot,
  userLoginHistory, type UserLoginHistory, type InsertUserLoginHistory,
  deletedUsers, type DeletedUser, type InsertDeletedUser
} from "@shared/schema";
import { eq, and, asc, desc, isNull } from 'drizzle-orm';
import { db, pool } from './db';

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  createUser(user: InsertUser): Promise<User>;
  updateUserTokens(userId: number, tokens: number): Promise<User | undefined>;
  updateUserAdminStatus(userId: number, isAdmin: boolean): Promise<User | undefined>;
  updateUser(userId: number, updates: Partial<User>): Promise<User | undefined>;
  
  // Deleted user operations
  deleteUser(userId: number, deletedBy: number, reason?: string): Promise<DeletedUser>;
  getAllDeletedUsers(): Promise<DeletedUser[]>;
  getDeletedUser(id: number): Promise<DeletedUser | undefined>;
  getDeletedUserByOriginalId(originalUserId: number): Promise<DeletedUser | undefined>;
  restoreDeletedUser(id: number): Promise<User | undefined>;
  purgeExpiredDeletedUsers(): Promise<number>; // Returns count of permanently deleted users
  
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
  updateProjectGuidancePayment(id: number, paymentId: string, amount?: number, orderId?: string): Promise<ProjectGuidance | undefined>;
  updateProjectGuidanceOrderId(id: number, orderId: string): Promise<ProjectGuidance | undefined>;
  updateProjectGuidanceSession(id: number, newDate: Date, newDuration: number, rescheduledBy: 'admin' | 'user'): Promise<ProjectGuidance | undefined>;
  updateProjectGuidanceMeetLink(id: number, googleMeetLink: string): Promise<ProjectGuidance | undefined>;
  updateProjectGuidanceStatus(id: number, status: string): Promise<ProjectGuidance | undefined>;
  updateCompletedSessionStatuses(): Promise<number>; // Returns count of sessions marked as completed
  cancelProjectGuidanceSession(id: number, reason: string, refundAmount: number, refundPercentage: number): Promise<ProjectGuidance | undefined>;
  updateSessionRefundStatus(id: number, refundId: string, refundStatus: string): Promise<ProjectGuidance | undefined>;
  
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
  
  // User Login History operations
  createUserLoginHistory(loginData: InsertUserLoginHistory): Promise<UserLoginHistory>;
  getUserLoginHistory(userId: number): Promise<UserLoginHistory[]>;
  getUserLoginCount(userId: number): Promise<number>;
  getUserAccountDetails(userId: number): Promise<{ createdAt: Date | null, loginCount: number }>;
  getAllUserLoginHistory(): Promise<UserLoginHistory[]>;
  getActiveUserSessions(): Promise<UserLoginHistory[]>;
  updateUserLoginActivity(sessionId: string): Promise<UserLoginHistory | undefined>;
  updateUserLogout(sessionId: string): Promise<UserLoginHistory | undefined>;
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
  
  async getAllUsers(): Promise<User[]> {
    try {
      // Order by email for consistent display
      const allUsers = await db.select().from(users).orderBy(asc(users.email));
      return allUsers;
    } catch (error) {
      console.error("Database error in getAllUsers:", error);
      return [];
    }
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    try {
      const [user] = await db.insert(users).values({
        username: insertUser.username,
        password: insertUser.password,
        email: insertUser.email,
        role: insertUser.role || 'user',
        isAdmin: insertUser.role === 'admin',
        isVerified: insertUser.isVerified !== undefined ? insertUser.isVerified : false,
        verificationCode: insertUser.verificationCode,
        verificationCodeExpires: insertUser.verificationCodeExpires
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
      // When setting admin status, also update the role field to maintain consistency
      const role = isAdmin ? 'admin' : 'user';
      
      const [updatedUser] = await db.update(users)
        .set({ 
          isAdmin,
          role
        })
        .where(eq(users.id, userId))
        .returning();
      return updatedUser;
    } catch (error) {
      console.error("Database error in updateUserAdminStatus:", error);
      return undefined;
    }
  }
  
  async updateUserPassword(userId: number, hashedPassword: string): Promise<User | undefined> {
    try {
      const [updatedUser] = await db.update(users)
        .set({ 
          password: hashedPassword,
          updatedAt: new Date()
        })
        .where(eq(users.id, userId))
        .returning();
      return updatedUser;
    } catch (error) {
      console.error("Database error in updateUserPassword:", error);
      return undefined;
    }
  }
  
  async updateUser(userId: number, updates: Partial<User>): Promise<User | undefined> {
    try {
      const [updatedUser] = await db.update(users)
        .set(updates)
        .where(eq(users.id, userId))
        .returning();
      return updatedUser;
    } catch (error) {
      console.error("Database error in updateUser:", error);
      return undefined;
    }
  }
  
  // Deleted User Operations
  async deleteUser(userId: number, deletedBy: number, reason?: string): Promise<DeletedUser> {
    try {
      // 1. Get the user to be deleted
      const user = await this.getUser(userId);
      if (!user) {
        throw new Error(`User with ID ${userId} not found`);
      }
      
      // 2. Create a deleted user record with 30 days expiration
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
      
      const deletedUserData: InsertDeletedUser = {
        originalUserId: user.id,
        username: user.username,
        email: user.email,
        fullName: user.fullName || null,
        profileImageUrl: user.profileImageUrl || null,
        phoneNumber: user.phoneNumber || null,
        role: user.role,
        isVerified: user.isVerified,
        tokens: user.tokens,
        deletedBy: deletedBy,
        deletionReason: reason || null,
      };
      
      // 3. Insert the deleted user record
      const [deletedUser] = await db.insert(deletedUsers)
        .values({
          ...deletedUserData,
          scheduledForDeletion: thirtyDaysFromNow,
        })
        .returning();
      
      // 4. Delete the original user
      await db.delete(users).where(eq(users.id, userId));
      
      return deletedUser;
    } catch (error) {
      console.error("Database error in deleteUser:", error);
      throw error;
    }
  }
  
  async getAllDeletedUsers(): Promise<DeletedUser[]> {
    try {
      return await db.select()
        .from(deletedUsers)
        .orderBy(desc(deletedUsers.deletedAt));
    } catch (error) {
      console.error("Database error in getAllDeletedUsers:", error);
      return [];
    }
  }
  
  async getDeletedUser(id: number): Promise<DeletedUser | undefined> {
    try {
      const [deletedUser] = await db.select()
        .from(deletedUsers)
        .where(eq(deletedUsers.id, id));
      return deletedUser;
    } catch (error) {
      console.error("Database error in getDeletedUser:", error);
      return undefined;
    }
  }
  
  async getDeletedUserByOriginalId(originalUserId: number): Promise<DeletedUser | undefined> {
    try {
      const [deletedUser] = await db.select()
        .from(deletedUsers)
        .where(eq(deletedUsers.originalUserId, originalUserId));
      return deletedUser;
    } catch (error) {
      console.error("Database error in getDeletedUserByOriginalId:", error);
      return undefined;
    }
  }
  
  async restoreDeletedUser(id: number): Promise<User | undefined> {
    try {
      // 1. Get the deleted user record
      const deletedUser = await this.getDeletedUser(id);
      if (!deletedUser) {
        throw new Error(`Deleted user with ID ${id} not found`);
      }
      
      // 2. Check if a user with the same username or email already exists
      const existingUser = await this.getUserByEmail(deletedUser.email);
      if (existingUser) {
        throw new Error(`A user with email ${deletedUser.email} already exists`);
      }
      
      // 3. Recreate the user
      const [restoredUser] = await db.insert(users)
        .values({
          username: deletedUser.username,
          email: deletedUser.email,
          password: "RESET_REQUIRED", // Force password reset
          fullName: deletedUser.fullName,
          profileImageUrl: deletedUser.profileImageUrl,
          phoneNumber: deletedUser.phoneNumber,
          role: deletedUser.role,
          isVerified: deletedUser.isVerified,
          tokens: deletedUser.tokens,
          isAdmin: deletedUser.role === "admin",
        })
        .returning();
      
      // 4. Delete the deleted user record
      await db.delete(deletedUsers).where(eq(deletedUsers.id, id));
      
      return restoredUser;
    } catch (error) {
      console.error("Database error in restoreDeletedUser:", error);
      throw error;
    }
  }
  
  async purgeExpiredDeletedUsers(): Promise<number> {
    try {
      // Get the current date
      const now = new Date();
      
      // Find all users scheduled for deletion before now
      const expiredUsers = await db.select()
        .from(deletedUsers)
        .where(db.sql`${deletedUsers.scheduledForDeletion} < ${now}`);
      
      // Delete all expired users
      if (expiredUsers.length > 0) {
        await db.delete(deletedUsers)
          .where(db.sql`${deletedUsers.scheduledForDeletion} < ${now}`);
      }
      
      return expiredUsers.length;
    } catch (error) {
      console.error("Database error in purgeExpiredDeletedUsers:", error);
      return 0;
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
  
  async getProjectGuidancesByStatus(status: string): Promise<ProjectGuidance[]> {
    try {
      return await db.select()
        .from(projectGuidances)
        .where(eq(projectGuidances.status, status));
    } catch (error) {
      console.error(`Database error in getProjectGuidancesByStatus(${status}):`, error);
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
  
  // Find project guidance sessions by Razorpay order ID
  async findProjectGuidanceByOrderId(orderId: string): Promise<ProjectGuidance | undefined> {
    try {
      // Extract session ID from our custom order ID format if present
      // Format: BAMBOO_sessionId_timestamp
      let sessionId = null;
      const orderIdParts = orderId.split('_');
      
      // Check for our specific format
      if (orderIdParts[0] === 'BAMBOO' && orderIdParts.length >= 3 && orderIdParts[1] !== 'RANDOM') {
        // The session ID is the second part (index 1)
        sessionId = orderIdParts[1];
        
        if (sessionId && !isNaN(parseInt(sessionId))) {
          return await this.getProjectGuidance(parseInt(sessionId));
        }
      }
      
      return undefined;
    } catch (error) {
      console.error("Database error in findProjectGuidanceByOrderId:", error);
      return undefined;
    }
  }

  async createProjectGuidance(insertSession: InsertProjectGuidance): Promise<ProjectGuidance> {
    try {
      // Create basic insert data that works with current schema
      const insertData = {
        ...insertSession,
        status: "pending",
        paymentConfirmed: false,
        isStudent: 'isStudent' in insertSession ? (insertSession as any).isStudent : true
      };
      
      // Insert the session
      const [session] = await db.insert(projectGuidances).values(insertData).returning();
      
      // Set payment_status to 'Pending' for new sessions
      try {
        await pool.query(`
          UPDATE project_guidance_sessions 
          SET payment_status = 'Pending' 
          WHERE id = $1
        `, [session.id]);
        console.log(`Set payment_status to Pending for new session ${session.id}`);
      } catch (err) {
        // The column might not exist yet if migration hasn't been run
        console.log(`Could not set payment_status for new session ${session.id}`);
      }
      
      // Now fetch the complete session with all fields
      const [completeSession] = await db.select()
        .from(projectGuidances)
        .where(eq(projectGuidances.id, session.id));
      
      console.log(`Created new session ${session.id}`);
      return completeSession || session;
    } catch (error) {
      console.error("Database error in createProjectGuidance:", error);
      throw error;
    }
  }

  async updateProjectGuidancePayment(id: number, paymentId: string, amount?: number, orderId?: string): Promise<ProjectGuidance | undefined> {
    try {
      // Set payment_status to 'Paid' first to ensure it's updated
      try {
        await pool.query(`
          UPDATE project_guidance_sessions 
          SET payment_status = 'Paid' 
          WHERE id = $1
        `, [id]);
        console.log(`Set payment_status to Paid for session ${id}`);
      } catch (err) {
        // If column doesn't exist, just continue - it will be handled by the migration
        console.log(`Could not set payment_status for session ${id}, will update other fields`);
      }
      
      // Update the other fields using Drizzle
      const updateData: any = { 
        paymentConfirmed: true, 
        paymentId, 
        amount: amount || null,
        status: "active",
        paymentStatus: 'Paid'
      };
      
      // Add orderId if provided
      if (orderId) {
        updateData.orderId = orderId;
      }
      
      console.log(`Updating payment for session ${id} with paymentId: ${paymentId}`);
      
      const [updatedSession] = await db.update(projectGuidances)
        .set(updateData)
        .where(eq(projectGuidances.id, id))
        .returning();
      return updatedSession;
    } catch (error) {
      console.error("Database error in updateProjectGuidancePayment:", error);
      return undefined;
    }
  }
  
  async updateProjectGuidanceOrderId(id: number, orderId: string): Promise<ProjectGuidance | undefined> {
    try {
      const [updatedSession] = await db.update(projectGuidances)
        .set({ orderId })
        .where(eq(projectGuidances.id, id))
        .returning();
      return updatedSession;
    } catch (error) {
      console.error("Database error in updateProjectGuidanceOrderId:", error);
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
          refundPercentage,
          paymentStatus: 'Refund Pending' // Update payment status to pending refund
        })
        .where(eq(projectGuidances.id, id))
        .returning();
      return updatedSession;
    } catch (error) {
      console.error("Database error in cancelProjectGuidanceSession:", error);
      return undefined;
    }
  }
  
  async updateSessionRefundStatus(id: number, refundId: string, refundStatus: string): Promise<ProjectGuidance | undefined> {
    try {
      // First get the current session to preserve existing notes
      const [currentSession] = await db.select().from(projectGuidances).where(eq(projectGuidances.id, id));
      if (!currentSession) {
        console.error(`Session ${id} not found for updating refund status`);
        return undefined;
      }
      
      // Valid refund statuses: 'Refund Pending', 'Refund Initiated', 'Refund Processed', 'Refund Failed'
      // Add refundId to track the refund in Razorpay
      const newNotes = `Refund ID: ${refundId}${currentSession.notes ? ' | ' + currentSession.notes : ''}`;
      
      const [updatedSession] = await db.update(projectGuidances)
        .set({ 
          paymentStatus: refundStatus,
          // Store refundId in notes field temporarily, until we add a dedicated refundId field
          notes: newNotes
        })
        .where(eq(projectGuidances.id, id))
        .returning();
      
      console.log(`Updated session ${id} refund status to ${refundStatus} with refund ID ${refundId}`);
      return updatedSession;
    } catch (error) {
      console.error("Database error in updateSessionRefundStatus:", error);
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

  async updateProjectGuidanceStatus(id: number, status: string): Promise<ProjectGuidance | undefined> {
    try {
      // Also update the paymentStatus field if status is "pending" or "active"
      const updateData: any = { status };
      
      if (status.toLowerCase() === "pending") {
        updateData.paymentStatus = "Pending";
      } else if (status.toLowerCase() === "active") {
        updateData.paymentStatus = "Paid";
        updateData.paymentConfirmed = true;
      }
      
      console.log(`Updating session ${id} status to ${status}`);
      
      const [updatedSession] = await db.update(projectGuidances)
        .set(updateData)
        .where(eq(projectGuidances.id, id))
        .returning();
      
      return updatedSession;
    } catch (error) {
      console.error("Database error in updateProjectGuidanceStatus:", error);
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
  // User Login History operations
  async createUserLoginHistory(loginData: InsertUserLoginHistory): Promise<UserLoginHistory> {
    try {
      // Use a direct SQL query with correct camelCase column names as in the database
      const result = await db.$queryRaw`
        INSERT INTO user_login_history 
        ("userId", "userEmail", username, "ipAddress", useragent, browser, os, "deviceType", 
         deviceinfo, loginstatus, isadmin, "sessionId", "loginTime", "lastActiveTime", "isreturninguser")
        VALUES 
        (${loginData.userId}, ${loginData.email}, ${loginData.username || 'unknown'}, 
         ${loginData.ipAddress}, ${loginData.useragent}, ${loginData.browser}, 
         ${loginData.os}, ${loginData.deviceType}, ${JSON.stringify(loginData.deviceInfo)}, 
         ${loginData.loginStatus}, ${loginData.isAdmin}, ${loginData.sessionId}, 
         NOW(), NOW(), ${loginData.isReturningUser || false})
        RETURNING *
      `;
      
      // Cast the result to expected type
      const loginRecord = result[0] as UserLoginHistory;
      console.log(`Login history recorded successfully for user ${loginData.userId}`);
      
      return loginRecord;
    } catch (error) {
      console.error("Database error in createUserLoginHistory:", error);
      // Return a minimal object to prevent UI errors, 
      // but ensure essential fields are included
      return {
        id: 0,
        userId: loginData.userId,
        email: loginData.email,
        username: loginData.username || 'unknown',
        loginTime: new Date(),
        lastActiveTime: new Date(),
        createdAt: new Date(),
        isAdmin: loginData.isAdmin || false,
        isReturningUser: loginData.isReturningUser || false,
      } as UserLoginHistory;
    }
  }

  async getUserLoginHistory(userId: number): Promise<UserLoginHistory[]> {
    try {
      // Use raw SQL query with correct camelCase column names as in the database
      const result = await db.$queryRaw`
        SELECT id, "userId", "userEmail" as email, username, 
        "ipAddress", useragent, browser, os, "deviceType",
        deviceinfo as "deviceInfo", "loginTime", "lastActiveTime", "logoutTime",
        loginstatus as "loginStatus", isadmin as "isAdmin", 
        "sessionId", "createdAt", "isreturninguser" as "isReturningUser"
        FROM user_login_history
        WHERE "userId" = ${userId}
        ORDER BY "loginTime" DESC
      `;
      
      return result as UserLoginHistory[];
    } catch (error) {
      console.error("Database error in getUserLoginHistory:", error);
      // Return empty array to prevent UI errors
      return [];
    }
  }
  
  async getUserLoginCount(userId: number): Promise<number> {
    try {
      // Only count successful logins where verification was completed
      const result = await db.$queryRaw`
        SELECT COUNT(*) as login_count
        FROM user_login_history
        WHERE "userId" = ${userId}
          AND loginstatus = 'success'
      `;
      
      // The result will be an array with one object containing the count
      const countResult = result as [{ login_count: number }];
      return parseInt(countResult[0].login_count.toString()) || 0;
    } catch (error) {
      console.error("Database error in getUserLoginCount:", error);
      return 0;
    }
  }
  
  async getTotalSuccessfulLogins(): Promise<number> {
    try {
      // Get total count of all successful logins across all users
      const result = await db.$queryRaw`
        SELECT COUNT(*) as login_count
        FROM user_login_history
        WHERE loginstatus = 'success'
      `;
      
      // The result will be an array with one object containing the count
      const countResult = result as [{ login_count: number }];
      return parseInt(countResult[0].login_count.toString()) || 0;
    } catch (error) {
      console.error("Database error in getTotalSuccessfulLogins:", error);
      return 0;
    }
  }
  
  async getUserAccountDetails(userId: number): Promise<{ createdAt: Date | null, loginCount: number }> {
    try {
      // Get the user's creation date
      const user = await this.getUser(userId);
      const createdAt = user?.createdAt || null;
      
      // Get the login count
      const loginCount = await this.getUserLoginCount(userId);
      
      return {
        createdAt,
        loginCount
      };
    } catch (error) {
      console.error("Database error in getUserAccountDetails:", error);
      return {
        createdAt: null,
        loginCount: 0
      };
    }
  }

  async getAllUserLoginHistory(): Promise<UserLoginHistory[]> {
    try {
      // Use raw SQL query to avoid field name mapping issues
      const result = await db.execute<UserLoginHistory[]>(
        `SELECT id, "userId", "userEmail", "userEmail" as email, username, 
        "ipAddress", useragent, browser, os, "deviceType",
        deviceinfo as "deviceInfo", "loginTime", 
        "lastActiveTime", "logoutTime",
        loginstatus as "loginStatus", isadmin as "isAdmin", 
        "sessionId", "createdAt", "isreturninguser" as "isReturningUser"
        FROM user_login_history
        ORDER BY "loginTime" DESC;`
      );
      
      return result.rows as unknown as UserLoginHistory[];
    } catch (error) {
      console.error("Database error in getAllUserLoginHistory:", error);
      return [];
    }
  }

  async getActiveUserSessions(): Promise<UserLoginHistory[]> {
    try {
      // Use raw SQL query to avoid field name mapping issues
      const result = await db.execute<UserLoginHistory[]>(
        `SELECT id, "userId", "userEmail", "userEmail" as email, username, 
        "ipAddress", useragent, browser, os, "deviceType",
        deviceinfo as "deviceInfo", "loginTime", 
        "lastActiveTime", "logoutTime",
        loginstatus as "loginStatus", isadmin as "isAdmin", 
        "sessionId", "createdAt", "isreturninguser" as "isReturningUser"
        FROM user_login_history
        WHERE "logoutTime" IS NULL
        ORDER BY "lastActiveTime" DESC;`
      );
      
      return result.rows as unknown as UserLoginHistory[];
    } catch (error) {
      console.error("Database error in getActiveUserSessions:", error);
      return [];
    }
  }

  async updateUserLoginActivity(sessionId: string): Promise<UserLoginHistory | undefined> {
    try {
      // Update the last active time for a session
      const [updatedSession] = await db.update(userLoginHistory)
        .set({ lastActiveTime: new Date() })
        .where(eq(userLoginHistory.sessionId, sessionId))
        .returning();
      return updatedSession;
    } catch (error) {
      console.error("Database error in updateUserLoginActivity:", error);
      return undefined;
    }
  }

  async updateUserLogout(sessionId: string): Promise<UserLoginHistory | undefined> {
    try {
      // Update the logout time for a session
      const [updatedSession] = await db.update(userLoginHistory)
        .set({ 
          logoutTime: new Date(),
          lastActiveTime: new Date() 
        })
        .where(eq(userLoginHistory.sessionId, sessionId))
        .returning();
      return updatedSession;
    } catch (error) {
      console.error("Database error in updateUserLogout:", error);
      return undefined;
    }
  }

  // Method to update a project guidance session status
  async updateProjectGuidanceStatus(id: number, status: string): Promise<ProjectGuidance | undefined> {
    try {
      console.log(`Updating session ${id} status to ${status}`);
      
      const [session] = await db.update(projectGuidances)
        .set({ 
          status: status,
        })
        .where(eq(projectGuidances.id, id))
        .returning();
      
      return session;
    } catch (error) {
      console.error(`Database error in updateProjectGuidanceStatus(${id}, ${status}):`, error);
      return undefined;
    }
  }

  // Method to automatically mark sessions as completed when their end time has passed
  async updateCompletedSessionStatuses(): Promise<number> {
    try {
      // Get all confirmed sessions that are not already marked as completed or cancelled
      const activeSessions = await db.select()
        .from(projectGuidances)
        .where(
          and(
            eq(projectGuidances.paymentConfirmed, true),
            eq(projectGuidances.status, "confirmed")
          )
        );
      
      console.log(`Checking ${activeSessions.length} active sessions for completion`);
      
      const currentTime = new Date();
      let completedCount = 0;
      
      // Process each session
      for (const session of activeSessions) {
        const sessionDate = new Date(session.date);
        // Calculate the end time by adding the duration in minutes
        const sessionEndTime = new Date(sessionDate.getTime() + (session.duration * 60 * 1000));
        
        // If the session end time has passed, mark it as completed
        if (sessionEndTime < currentTime) {
          console.log(`Session ${session.id} has ended at ${sessionEndTime.toISOString()}, marking as completed`);
          await this.updateProjectGuidanceStatus(session.id, "completed");
          completedCount++;
        }
      }
      
      console.log(`Marked ${completedCount} sessions as completed`);
      return completedCount;
    } catch (error) {
      console.error("Database error in updateCompletedSessionStatuses:", error);
      return 0;
    }
  }
}

export const storage = new DatabaseStorage();