import { apiRequest } from "./queryClient";

export interface ChatMessage {
  userId: number;
  message: string;
  response: string;
  tokensUsed: number;
}

/**
 * Processes a chat message with the BambooMade AI
 * @param message The user's message to process
 * @returns The AI response and tokens used
 */
export async function processAiChat(message: string): Promise<{ response: string; tokensUsed: number; remainingTokens?: number }> {
  try {
    // Send the message to our backend which will process it with OpenAI
    const response = await apiRequest("POST", "/api/chat", { message });
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || "Failed to process message");
    }
    
    return {
      response: data.response,
      tokensUsed: data.tokensUsed,
      // No remainingTokens since we're not tracking tokens per user anymore
      remainingTokens: undefined
    };
  } catch (error) {
    console.error("Error processing AI chat:", error);
    throw new Error("Failed to process chat message. Please try again later.");
  }
}

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
