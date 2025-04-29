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
export async function processAiChat(message: string): Promise<{ response: string; tokensUsed: number }> {
  // For this implementation, we'll simulate a simple AI response
  // In a production app, this would connect to an actual AI service like OpenAI
  
  // Calculate tokens (in a real app this would be calculated by the AI service)
  const tokensUsed = Math.max(1, Math.ceil(message.length / 20));
  
  let response = "";
  
  // Simple keyword matching for demo purposes
  if (message.toLowerCase().includes("bamboo")) {
    response = "Bamboo is a versatile and sustainable building material used in many architectural projects. It's strong, lightweight, and grows incredibly fast, making it an environmentally friendly choice.";
  } else if (message.toLowerCase().includes("workshop")) {
    response = "BambooMade offers various workshops on bamboo construction techniques, joinery methods, and sustainable design. These workshops are hands-on and suitable for both beginners and professionals.";
  } else if (message.toLowerCase().includes("sustainability")) {
    response = "Bamboo is highly sustainable because it grows quickly (up to 91 cm per day!), sequesters carbon, prevents soil erosion, and can be harvested without killing the plant. It's a renewable resource with minimal environmental impact.";
  } else if (message.toLowerCase().includes("project")) {
    response = "Our bamboo projects range from small furniture pieces to large architectural structures. Each project is designed with sustainability and innovative use of bamboo materials in mind.";
  } else if (message.toLowerCase().includes("architecture")) {
    response = "Bamboo architecture combines traditional wisdom with modern engineering. Our designs leverage bamboo's natural strength and flexibility to create beautiful, sustainable structures.";
  } else {
    response = "Thank you for your question about bamboo architecture and design. I'm BambooMade AI, specializing in sustainable bamboo construction. Could you provide more specific details about what you'd like to know?";
  }
  
  // Submit the chat message to the server
  try {
    await apiRequest("POST", "/api/chat", {
      message,
      response,
      tokensUsed
    });
    
    return { response, tokensUsed };
  } catch (error) {
    console.error("Error processing AI chat:", error);
    throw new Error("Failed to process chat message");
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
