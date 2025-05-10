import { pgTable, text, serial, integer, boolean, timestamp, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User schema
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull(),
  role: text("role").notNull().default("user"),
  tokens: integer("tokens").notNull().default(10),
  isAdmin: boolean("is_admin").notNull().default(false),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  email: true,
  role: true,
});

// Project schema for gallery items
export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  imageUrl: text("image_url").notNull(),
  category: text("category").notNull(), // 'workshop', 'architecture', 'design'
  featured: boolean("featured").default(false),
});

export const insertProjectSchema = createInsertSchema(projects).pick({
  title: true,
  description: true,
  imageUrl: true,
  category: true,
  featured: true,
});

// Project guidance session booking
export const projectGuidances = pgTable("project_guidance_sessions", {
  id: serial("id").primaryKey(),
  studentName: text("student_name").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  date: timestamp("date").notNull(),
  originalDate: timestamp("original_date"), // Original date before rescheduling
  duration: integer("duration").notNull(), // in minutes
  topic: text("topic").notNull(),
  notes: text("notes"),
  paymentConfirmed: boolean("payment_confirmed").default(false),
  paymentId: text("payment_id"),
  status: text("status").default("active"), // active, pending, confirmed, cancelled, completed, rescheduled
  rescheduledBy: text("rescheduled_by"), // 'admin' or 'user'
  rescheduledDate: timestamp("rescheduled_date"), // When the rescheduling occurred
  cancellationReason: text("cancellation_reason"),
  cancellationDate: timestamp("cancellation_date"),
  refundAmount: integer("refund_amount"),
  refundPercentage: integer("refund_percentage"),
  amount: integer("amount"), // Total amount paid for the session
  googleMeetLink: text("google_meet_link"), // Link for Google Meet session
  isStudent: boolean("is_student").default(true), // Whether the booking is for a student or professional
});

export const insertProjectGuidanceSchema = createInsertSchema(projectGuidances).pick({
  studentName: true,
  email: true,
  phone: true,
  date: true,
  duration: true,
  topic: true,
  notes: true,
});

// AI chat messages
export const chatMessages = pgTable("chat_messages", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  message: text("message").notNull(),
  response: text("response").notNull(),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
  tokensUsed: integer("tokens_used").notNull(),
});

export const insertChatMessageSchema = createInsertSchema(chatMessages).pick({
  userId: true,
  message: true,
  response: true,
  tokensUsed: true,
});

// AI training data
export const aiTrainingData = pgTable("ai_training_data", {
  id: serial("id").primaryKey(),
  question: text("question").notNull(),
  answer: text("answer").notNull(),
  category: text("category").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertAiTrainingDataSchema = createInsertSchema(aiTrainingData).pick({
  question: true,
  answer: true,
  category: true,
});

// Token purchase
export const tokenPurchases = pgTable("token_purchases", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  amount: integer("amount").notNull(),
  paymentId: text("payment_id").notNull(),
  purchaseDate: timestamp("purchase_date").notNull().defaultNow(),
});

export const insertTokenPurchaseSchema = createInsertSchema(tokenPurchases).pick({
  userId: true,
  amount: true,
  paymentId: true,
});

// Type definitions
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Project = typeof projects.$inferSelect;
export type InsertProject = z.infer<typeof insertProjectSchema>;

export type ProjectGuidance = typeof projectGuidances.$inferSelect;
export type InsertProjectGuidance = z.infer<typeof insertProjectGuidanceSchema>;

export type ChatMessage = typeof chatMessages.$inferSelect;
export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;

export type AiTrainingData = typeof aiTrainingData.$inferSelect;
export type InsertAiTrainingData = z.infer<typeof insertAiTrainingDataSchema>;

export type TokenPurchase = typeof tokenPurchases.$inferSelect;
export type InsertTokenPurchase = z.infer<typeof insertTokenPurchaseSchema>;

// Available time slots for project guidance
export const availableTimeSlots = pgTable("available_time_slots", {
  id: serial("id").primaryKey(),
  date: text("date").notNull(), // Format: YYYY-MM-DD
  slots: json("slots").$type<string[]>().notNull(), // Array of time slots like ["09:00", "10:00"]
  createdBy: integer("created_by").notNull(), // Admin who created this availability
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertAvailableTimeSlotsSchema = createInsertSchema(availableTimeSlots).pick({
  date: true,
  slots: true,
  createdBy: true,
});

export type AvailableTimeSlot = typeof availableTimeSlots.$inferSelect;
export type InsertAvailableTimeSlot = z.infer<typeof insertAvailableTimeSlotsSchema>;

// AI Knowledge Base content
export const aiKnowledgeContent = pgTable("ai_knowledge_content", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  source: text("source"), // URL, Google Drive link, etc.
  contentType: text("content_type").notNull(), // 'webpage', 'document', 'event', 'manual', 'image', 'social_media', etc.
  status: text("status").notNull().default("active"), // 'active', 'archived'
  mediaUrl: text("media_url"), // URL to image, document, or other media file
  mediaType: text("media_type"), // 'image', 'document', 'pdf', 'video', etc.
  socialMediaInfo: json("social_media_info").$type<{ 
    platform?: string, 
    postId?: string, 
    profileUrl?: string, 
    handle?: string,
    mediaUrls?: string[]
  }>(), // Information about social media posts
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  createdBy: integer("created_by").notNull(), // Admin ID who created this content
});

export const insertAiKnowledgeContentSchema = createInsertSchema(aiKnowledgeContent).pick({
  title: true,
  content: true,
  source: true,
  contentType: true,
  status: true,
  mediaUrl: true,
  mediaType: true,
  socialMediaInfo: true,
  createdBy: true,
});

export type AiKnowledgeContent = typeof aiKnowledgeContent.$inferSelect;
export type InsertAiKnowledgeContent = z.infer<typeof insertAiKnowledgeContentSchema>;

// Social Media Content
export const socialMediaContent = pgTable("social_media_content", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  platformType: text("platform_type").notNull(), // 'instagram' or 'youtube'
  url: text("url").notNull(), // Original post URL
  thumbnailUrl: text("thumbnail_url"), // Image URL for the post
  description: text("description"), // Post description or caption
  publishedAt: timestamp("published_at").notNull().defaultNow(),
  featured: boolean("featured").default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  createdBy: integer("created_by").notNull(),
  rotationGroup: integer("rotation_group").notNull().default(1), // Group 1-4 for weekly rotation
});

export const insertSocialMediaContentSchema = createInsertSchema(socialMediaContent).pick({
  title: true,
  platformType: true,
  url: true,
  thumbnailUrl: true,
  description: true,
  publishedAt: true,
  featured: true,
  createdBy: true,
  rotationGroup: true,
});

export type SocialMediaContent = typeof socialMediaContent.$inferSelect;
export type InsertSocialMediaContent = z.infer<typeof insertSocialMediaContentSchema>;

// Dashboard Snapshots - Daily saved dashboard content
export const dashboardSnapshots = pgTable("dashboard_snapshots", {
  id: serial("id").primaryKey(),
  date: text("date").notNull().unique(), // Format: YYYY-MM-DD 
  eventsSummary: text("events_summary"), // Markdown summary of events
  // Store JSON string data for complex data structures
  upcomingEventsData: text("upcoming_events_data"),
  recentUpdatesData: text("recent_updates_data"),
  factsData: text("facts_data"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertDashboardSnapshotSchema = createInsertSchema(dashboardSnapshots).pick({
  date: true,
  eventsSummary: true,
  upcomingEventsData: true,
  recentUpdatesData: true,
  factsData: true,
});

export type DashboardSnapshot = typeof dashboardSnapshots.$inferSelect;
export type InsertDashboardSnapshot = z.infer<typeof insertDashboardSnapshotSchema>;
