import OpenAI from "openai";
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

// Get directory name in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Check if OpenAI API key is provided
const apiKey = process.env.OPENAI_API_KEY;
let openai: OpenAI | null = null;

// Define paths for storing data
const DATA_DIR = path.join(__dirname, '..', 'whatsapp-data');
const TRAINING_DATA_FILE = path.join(DATA_DIR, 'training-data.json');

// Only initialize OpenAI if we have an API key
if (apiKey) {
  openai = new OpenAI({ apiKey });
} else {
  console.warn("OPENAI_API_KEY is not set. The AI chat will use fallback responses.");
}

// Ensure directories exist
fs.ensureDirSync(DATA_DIR);

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

interface WhatsAppTrainingData {
  id: string;
  message: string;
  extractedInfo?: {
    topics: string[];
    keyPoints: string[];
    questions: string[];
    relevance: number; // 0-10 scale: 0 = not relevant to bamboo, 10 = highly relevant
  };
  processed: boolean;
  sourceMessageId: string;
  dateAdded: string;
  dateProcessed?: string;
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
    // Fallback to a more informative response if the API fails
    return { 
      response: "I apologize, but I'm currently having trouble accessing my knowledge base. The AI service will be available soon. For immediate assistance with your bamboo architecture questions, please contact us via WhatsApp at 8971690163 or email at Info@bamboomade.in.", 
      tokensUsed: 1 
    };
  }
}

/**
 * Process WhatsApp messages for training purposes
 * @param message WhatsApp message content to process
 * @returns A response string if the message requires a direct reply, or null if just for training
 */
export async function processMessageForTraining(message: string): Promise<string | null> {
  // Don't process empty messages
  if (!message || message.trim().length === 0) {
    return null;
  }

  try {
    // Check if OpenAI is available
    if (!openai) {
      console.warn("Cannot process message for training - OpenAI API key is missing");
      if (message.toLowerCase().includes("bamboo")) {
        return "I'm the BambooMade AI bot. While I'm still learning, I can provide basic information about bamboo architecture and sustainable design. For more detailed assistance, please contact the BambooMade team directly.";
      }
      return null;
    }

    // First determine if the message is relevant to bamboo or requires a response
    const analysisCompletion = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024
      messages: [
        { 
          role: "system", 
          content: `You are an AI that analyzes WhatsApp messages to determine their relevance to bamboo architecture, design, and sustainability.
            Analyze the following message and extract relevant information in JSON format.` 
        },
        { role: "user", content: message }
      ],
      response_format: { type: "json_object" },
      temperature: 0.3,
    });

    const analysisResponse = JSON.parse(analysisCompletion.choices[0].message.content || "{}");
    const needsResponse = message.toLowerCase().includes("bamboo") || 
                        message.toLowerCase().includes("architecture") ||
                        message.toLowerCase().includes("workshop") ||
                        (analysisResponse.relevance && analysisResponse.relevance > 5);

    // Generate training data entry
    const trainingData: WhatsAppTrainingData = {
      id: Date.now().toString(),
      message: message,
      extractedInfo: {
        topics: analysisResponse.topics || [],
        keyPoints: analysisResponse.keyPoints || [],
        questions: analysisResponse.questions || [],
        relevance: analysisResponse.relevance || 0,
      },
      processed: true,
      sourceMessageId: 'whatsapp-' + Date.now(),
      dateAdded: new Date().toISOString(),
      dateProcessed: new Date().toISOString()
    };

    // Store the training data
    try {
      let existingData: WhatsAppTrainingData[] = [];
      if (fs.existsSync(TRAINING_DATA_FILE)) {
        existingData = fs.readJsonSync(TRAINING_DATA_FILE);
      }
      existingData.push(trainingData);
      fs.writeJsonSync(TRAINING_DATA_FILE, existingData);
    } catch (error) {
      console.error("Error storing WhatsApp training data:", error);
    }

    // If the message needs a direct response, generate one
    if (needsResponse) {
      const { response } = await processMessage(message);
      return response;
    }

    return null;
  } catch (error) {
    console.error("Error processing WhatsApp message for training:", error);
    
    // If it mentions bamboo, provide a more informative response even if processing failed
    if (message.toLowerCase().includes("bamboo")) {
      return "I'm the BambooMade AI bot. I'm here to help with information about bamboo architecture, but I'm having trouble accessing my knowledge base right now. For immediate assistance, please contact us via WhatsApp at 8971690163 or email at Info@bamboomade.in.";
    }
    
    return null;
  }
}

/**
 * Creates training data from WhatsApp messages that can be used by the main AI system
 * @returns The number of items processed
 */
export async function convertWhatsAppToTrainingData(): Promise<number> {
  try {
    // Check if training data file exists
    if (!fs.existsSync(TRAINING_DATA_FILE)) {
      console.log("No WhatsApp training data found");
      return 0;
    }

    // Load the WhatsApp training data
    const whatsappData: WhatsAppTrainingData[] = fs.readJsonSync(TRAINING_DATA_FILE);
    const relevantData = whatsappData.filter(item => 
      item.extractedInfo && item.extractedInfo.relevance >= 6 // Only use highly relevant messages
    );

    if (relevantData.length === 0) {
      console.log("No relevant WhatsApp training data found");
      return 0;
    }

    console.log(`Found ${relevantData.length} relevant WhatsApp messages for training`);

    // Get existing training data
    const adminTrainingDataPath = path.join(DATA_DIR, 'admin-training-data.json');
    let adminTrainingData: TrainingData[] = [];
    if (fs.existsSync(adminTrainingDataPath)) {
      adminTrainingData = fs.readJsonSync(adminTrainingDataPath);
    }

    // Process each relevant message into training data
    if (!openai) {
      console.warn("Cannot convert WhatsApp data to training - OpenAI API key is missing");
      return 0;
    }

    let processedCount = 0;
    for (const item of relevantData) {
      // Generate a Q&A pair and category from the message
      const trainingCompletion = await openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024
        messages: [
          { 
            role: "system", 
            content: `You are an AI that converts relevant WhatsApp messages about bamboo architecture into training data.
              For the following message, extract a question, answer, and category that would be useful for training an AI about bamboo architecture.
              Format the response as JSON with fields: question, answer, category.
              Make the question concise and focused on bamboo architecture knowledge.
              The answer should be informative and educational.
              The category should be one of: basic-concepts, architecture, construction, sustainability, workshops, projects.` 
          },
          { role: "user", content: item.message }
        ],
        response_format: { type: "json_object" },
        temperature: 0.5,
      });

      try {
        const trainingPair = JSON.parse(trainingCompletion.choices[0].message.content || "{}");
        if (trainingPair.question && trainingPair.answer && trainingPair.category) {
          adminTrainingData.push({
            question: trainingPair.question,
            answer: trainingPair.answer,
            category: trainingPair.category
          });
          processedCount++;
        }
      } catch (error) {
        console.error("Error parsing training data from WhatsApp message:", error);
      }
    }

    // Save the updated training data
    if (processedCount > 0) {
      fs.writeJsonSync(adminTrainingDataPath, adminTrainingData);
      console.log(`Successfully converted ${processedCount} WhatsApp messages into training data`);
    }

    return processedCount;
  } catch (error) {
    console.error("Error converting WhatsApp data to training:", error);
    return 0;
  }
}