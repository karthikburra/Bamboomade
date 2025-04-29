import OpenAI from "openai";

// Check if OpenAI API key is provided
const apiKey = process.env.OPENAI_API_KEY;
let openai: OpenAI | null = null;

// Only initialize OpenAI if we have an API key
if (apiKey) {
  openai = new OpenAI({ apiKey });
} else {
  console.warn("OPENAI_API_KEY is not set. The AI chat will use fallback responses.");
}

// Default system prompt for BambooMade AI context
const DEFAULT_SYSTEM_PROMPT = `You are the BambooMade AI, an expert on bamboo architecture, design, and sustainability.
Your purpose is to assist users by providing accurate, helpful information about bamboo construction, workshops, 
educational resources, and sustainable design practices.

Your knowledge areas include:
- Bamboo as a sustainable building material
- Bamboo architecture and design principles
- Bamboo construction techniques and joinery methods
- Bamboo workshops and educational resources
- Sustainability benefits of bamboo in construction
- Bamboo in architectural projects
- Career guidance for students interested in bamboo architecture

Always be informative, professional, and supportive in your responses. If a question falls outside your expertise,
politely guide the user back to bamboo-related topics.`;

interface TrainingData {
  question: string;
  answer: string;
  category: string;
}

/**
 * Process a user's message using OpenAI
 * @param message User's message
 * @param trainingData Additional context from admin-provided training data
 * @returns The AI response and number of tokens used
 */
export async function processMessage(
  message: string, 
  trainingData: TrainingData[] = []
): Promise<{ response: string; tokensUsed: number }> {
  try {
    // If OpenAI is not initialized (no API key), use fallback response
    if (!openai) {
      // Fallback response when no API key is provided
      const fallbackResponses = [
        "Bamboo is a versatile and sustainable building material used in many architectural projects. It's strong, lightweight, and grows incredibly fast, making it an environmentally friendly choice.",
        "BambooMade offers various workshops on bamboo construction techniques, joinery methods, and sustainable design. These workshops are hands-on and suitable for both beginners and professionals.",
        "Bamboo architecture combines traditional wisdom with modern engineering. Our designs leverage bamboo's natural strength and flexibility to create beautiful, sustainable structures.",
        "Our bamboo projects range from small furniture pieces to large architectural structures. Each project is designed with sustainability and innovative use of bamboo materials in mind.",
        "Thank you for your question about bamboo architecture and design. I'm BambooMade AI, specializing in sustainable bamboo construction. Could you provide more specific details about what you'd like to know?"
      ];
      
      // Simple keyword matching for demo purposes
      let response = fallbackResponses[4]; // Default response
      
      if (message.toLowerCase().includes("bamboo")) {
        response = fallbackResponses[0];
      } else if (message.toLowerCase().includes("workshop")) {
        response = fallbackResponses[1];
      } else if (message.toLowerCase().includes("architecture")) {
        response = fallbackResponses[2];
      } else if (message.toLowerCase().includes("project")) {
        response = fallbackResponses[3];
      }
      
      // Calculate tokens (simulated)
      const tokensUsed = Math.max(1, Math.ceil(message.length / 10));
      
      return { response, tokensUsed };
    }
    
    // Create a context from relevant training data (simplified relevance matching)
    const relevantTraining = trainingData
      .filter(data => 
        message.toLowerCase().includes(data.question.toLowerCase()) || 
        message.toLowerCase().includes(data.category.toLowerCase())
      )
      .slice(0, 5); // Limit to 5 most relevant items

    // Build additional context from training data
    const trainingContext = relevantTraining.length > 0 
      ? `Here is some additional context that may be relevant to the user's question:\n\n${
          relevantTraining.map(data => `Q: ${data.question}\nA: ${data.answer}\nCategory: ${data.category}`).join('\n\n')
        }\n\nUse this information if relevant to answer the user's question.`
      : '';

    // Send request to OpenAI (we already checked openai is not null at this point)
    const chatCompletion = await (openai as OpenAI).chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        { role: "system", content: DEFAULT_SYSTEM_PROMPT + (trainingContext ? `\n\n${trainingContext}` : '') },
        { role: "user", content: message }
      ],
      temperature: 0.7,
      max_tokens: 500
    });

    // Extract response and token usage
    const response = chatCompletion.choices[0].message.content || "I'm sorry, I couldn't process your request.";
    const tokensUsed = chatCompletion.usage?.total_tokens || 0;

    return { response, tokensUsed };
  } catch (error) {
    console.error("OpenAI API error:", error);
    // Fallback to a simple response if the API fails
    return { 
      response: "I apologize, but I'm currently having trouble accessing my knowledge base. Please try again later.", 
      tokensUsed: 1 
    };
  }
}