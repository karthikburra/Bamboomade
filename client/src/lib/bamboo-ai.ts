import { apiRequest } from "./queryClient";

export interface ChatMessage {
  userId: number;
  message: string;
  response: string;
  tokensUsed: number;
}

export interface User {
  id: number;
  username: string;
  email: string;
  role: string;
  tokens: number;
  isAdmin: boolean;
}

export interface TrainingData {
  id: number;
  question: string;
  answer: string;
  category: string;
  createdAt: string;
}

export interface ProjectGuidance {
  id: number;
  studentName: string;
  email: string;
  phone: string;
  date: string;
  duration: number;
  topic: string;
  notes: string;
  paymentId?: string;
}

/**
 * Citation interface for source references
 */
export interface Citation {
  source: string;
  url?: string;
}

/**
 * Processes a chat message with the BambooMade AI
 * @param message The user's message to process
 * @returns The AI response, tokens used, and citation information
 */
export async function processAiChat(message: string): Promise<{ 
  response: string; 
  tokensUsed: number; 
  remainingTokens?: number;
  citations?: Citation[]
}> {
  try {
    // Send the message to our backend which will process it with OpenAI
    const response = await apiRequest("POST", "/api/chat", { message });
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || "Failed to process message");
    }
    
    // Track this interaction in Google Analytics if available
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'ai_message_processed', {
        'event_category': 'AI_Chat',
        'event_label': message.substring(0, 50), // First 50 chars of message
        'non_interaction': false
      });
    }
    
    return {
      response: data.response,
      tokensUsed: data.tokensUsed,
      // No remainingTokens since we're not tracking tokens per user anymore
      remainingTokens: undefined,
      citations: data.citations || [] // Include citation information
    };
  } catch (error) {
    // Track errors in Google Analytics if available
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'ai_error', {
        'event_category': 'AI_Chat',
        'event_label': String(error).substring(0, 100),
        'non_interaction': true
      });
    }
    
    console.error("Error processing AI chat:", error);
    throw new Error("Failed to process chat message. Please try again later.");
  }
}

// Admin API Functions

/**
 * Adds new training data to the BambooMade AI (admin only)
 */
export async function addAiTrainingData(question: string, answer: string, category: string): Promise<void> {
  await apiRequest("POST", "/api/admin/training-data", {
    question,
    answer,
    category
  });
}

/**
 * Fetches all users (admin only)
 */
export async function fetchAllUsers(): Promise<User[]> {
  const response = await apiRequest("GET", "/api/admin/users");
  return response.json();
}

/**
 * Updates a user's admin status (admin only)
 */
export async function updateUserAdminStatus(userId: number, isAdmin: boolean): Promise<User> {
  const response = await apiRequest("PATCH", `/api/admin/users/${userId}`, { isAdmin });
  return response.json();
}

/**
 * Fetches all project guidance sessions (admin only)
 */
export async function fetchAllSessions(): Promise<ProjectGuidance[]> {
  const response = await apiRequest("GET", "/api/project-guidance");
  return response.json();
}

/**
 * Interface for bamboo fact with citation source
 */
export interface BambooFact {
  id: number;
  fact: string;
  source: string | null;
}

/**
 * Interface for recent knowledge updates
 */
export interface RecentUpdate {
  id: number;
  title: string;
  content: string;
  createdAt: Date;
  source: string | null;
}

/**
 * Interface for upcoming event data
 */
export interface UpcomingEvent {
  id: number;
  title: string;
  content: string;
  source: string | null;
  contentType: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  createdBy: number;
  mediaUrl?: string | null;
  mediaType?: string | null;
}

/**
 * Interface for dashboard data containing events, recent updates, and bamboo facts
 */
export interface DashboardData {
  events: string | null;
  upcomingEvents: UpcomingEvent[];
  updates: RecentUpdate[];
  fact: BambooFact | null; // Keep for backward compatibility
  facts: BambooFact[]; // New array of facts
}

/**
 * Fetches dashboard data for the AI Chat screen including events, recent updates and interesting facts
 * @returns Dashboard data from the knowledge base
 */
export async function fetchDashboardData(): Promise<DashboardData> {
  try {
    const response = await apiRequest("GET", "/api/dashboard-data");
    if (!response.ok) {
      throw new Error("Failed to fetch dashboard data");
    }
    
    const data = await response.json();
    
    // Track in Google Analytics
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'dashboard_data_loaded', {
        'event_category': 'AI_Chat',
        'non_interaction': true
      });
    }
    
    return data;
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    // Return empty data as fallback
    return {
      events: null,
      upcomingEvents: [],
      updates: [],
      fact: null,
      facts: []
    };
  }
}
