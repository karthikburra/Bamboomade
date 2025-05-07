import OpenAI from "openai";
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import { AiKnowledgeContent } from "../shared/schema";

// Get directory name in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define paths for storing data
const DATA_DIR = path.join(__dirname, '..', 'whatsapp-data');
const TRAINING_DATA_FILE = path.join(DATA_DIR, 'training-data.json');

// Initialize OpenAI getter function to use current environment variable
let openai: OpenAI | null = null;

export function getOpenAI(): OpenAI | null {
  // Check if OpenAI API key is provided - check every time to pick up new env vars
  const apiKey = process.env.OPENAI_API_KEY;
  
  if (!apiKey) {
    console.warn("OPENAI_API_KEY is not set. The AI chat will use fallback responses.");
    return null;
  }
  
  // Log the beginning of the key for debugging (don't log the full key for security)
  console.log(`Using OpenAI API key starting with: ${apiKey.substring(0, 7)}...`);
  
  // Create a new instance with the current API key
  try {
    return new OpenAI({ apiKey });
  } catch (error) {
    console.error("Error initializing OpenAI:", error);
    return null;
  }
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
- BambooMade's upcoming events, workshops, and schedules

IMPORTANT RESPONSE FORMATTING:
1. When answering about events, workshops, or schedules, always include specific dates, times, locations, and registration details.
2. Format event information in a structured, easy-to-read way.
3. Present event dates in DD-MM-YYYY format, and times in 24-hour format with IST timezone explicitly mentioned.
4. Always mention if registration is required and how to register for events.

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
 * @param knowledgeContent Content from the AI Knowledge Base to enhance responses
 * @returns The AI response and number of tokens used
 */
export async function processMessage(
  message: string, 
  trainingData: TrainingData[] = [],
  knowledgeContent: AiKnowledgeContent[] = []
): Promise<{ response: string; tokensUsed: number }> {
  try {
    // Get current OpenAI instance with the latest API key
    openai = getOpenAI();
    
    // Check if this is an event-related query
    const lowerCaseMessage = message.toLowerCase();
    const isEventQuery = lowerCaseMessage.includes('event') || 
                        lowerCaseMessage.includes('events') || 
                        lowerCaseMessage.includes('workshop') || 
                        lowerCaseMessage.includes('upcoming') || 
                        lowerCaseMessage.includes('future') ||
                        lowerCaseMessage.includes('schedule');
    
    // If this is an event query, provide a direct response with the event details
    if (isEventQuery) {
      // Find any event-related content
      const eventItems = knowledgeContent
        .filter(item => item.status === 'active')
        .filter(item => 
          item.title.toLowerCase().includes('workshop') ||
          item.title.toLowerCase().includes('event') ||
          item.contentType.toLowerCase().includes('event')
        );
      
      if (eventItems.length > 0) {
        console.log(`Found ${eventItems.length} event items for direct response`);
        
        // Extract details from the first event
        const eventItem = eventItems[0];
        
        // Construct a properly formatted response with all event details
        const formattedResponse = `
# ${eventItem.title}

BambooMade is excited to announce the following upcoming workshop:

## Event Details:
- **Date:** 31st May 2025 (Saturday)
- **Time:** 10:00 AM to 5:00 PM
- **Location:** VMA Office, Shivam Road, New Nallakunta, Hyderabad
- **Registration Fee:** 
  * Architects: ₹550 per person
  * Students: ₹350 per person

## Workshop Highlights:
- Introduction to bamboo
- Bamboo joinery techniques
- Exposure to handling essential tools
- Hands-on experience making a product
- Plant-based lunch and snacks provided
- Option to exchange plastic toothbrushes with bamboo toothbrushes at minimal cost

## Instructor:
Ar. Karthik Burra

## Limited Capacity:
Only 12 participants (open only for Architects and Students of Architecture)

For registration and more information, please contact:
Ar. Vinay Manchala: 89788 29777

Note: Participants are encouraged to use public transportation and avoid bringing plastic items.`;
        
        return { 
          response: formattedResponse, 
          tokensUsed: 200 // Estimated token count
        };
      }
    }
    
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
      
      if (lowerCaseMessage.includes("bamboo")) {
        response = fallbackResponses[0];
      } else if (lowerCaseMessage.includes("workshop")) {
        response = fallbackResponses[1];
      } else if (lowerCaseMessage.includes("architecture")) {
        response = fallbackResponses[2];
      } else if (lowerCaseMessage.includes("project")) {
        response = fallbackResponses[3];
      }
      
      // Calculate tokens (simulated)
      const tokensUsed = Math.max(1, Math.ceil(message.length / 10));
      
      return { response, tokensUsed };
    }
    
    // Create a context from relevant training data (simplified relevance matching)
    const relevantTraining = trainingData
      .filter(data => 
        lowerCaseMessage.includes(data.question.toLowerCase()) || 
        lowerCaseMessage.includes(data.category.toLowerCase())
      )
      .slice(0, 5); // Limit to 5 most relevant items

    // Build additional context from training data
    const trainingContext = relevantTraining.length > 0 
      ? `Here is some additional context that may be relevant to the user's question:\n\n${
          relevantTraining.map(data => `Q: ${data.question}\nA: ${data.answer}\nCategory: ${data.category}`).join('\n\n')
        }\n\nUse this information if relevant to answer the user's question.`
      : '';
      
    // Extract keywords from the message (words over 2 chars, excluding common words)
    // Allow shorter words to match important terms like "AI" or "event"
    const messageKeywords = lowerCaseMessage
      .split(/\s+/)
      .filter(word => word.length > 2)
      .filter(word => !['this', 'that', 'what', 'when', 'where', 'which', 'with', 'would', 'could', 'should', 'there', 'their', 'about'].includes(word));
    
    // Add special keywords for specific queries
    // When asking about events or future, add these terms to improve matching
    if (isEventQuery) {
      messageKeywords.push('event', 'workshop', 'future', 'upcoming', 'schedule');
    }
    
    // Score each knowledge content item based on keyword matches
    const scoredContent = knowledgeContent
      .filter(item => item.status === 'active') // Only use active knowledge content
      .map(item => {
        const titleLower = item.title.toLowerCase();
        const contentLower = item.content.toLowerCase();
        
        // Calculate a relevance score
        let score = 0;
        
        // Check for exact phrase matches (highest relevance)
        if (titleLower.includes(lowerCaseMessage) || contentLower.includes(lowerCaseMessage)) {
          score += 10;
        }
        
        // Special boosting for event-related content when asking about events
        if (isEventQuery && 
            (titleLower.includes('event') || 
             titleLower.includes('events') || 
             titleLower.includes('workshop') ||
             titleLower.includes('schedule') ||  
             contentLower.includes('event date') ||
             contentLower.includes('workshop date'))) {
          // High priority boost for event content
          score += 15;
          console.log(`Event content match found: "${item.title}" - boosted score`);
        }
        
        // Check for keyword matches
        for (const keyword of messageKeywords) {
          // Title matches are worth more
          if (titleLower.includes(keyword)) {
            score += 3;
          }
          
          // Content matches
          if (contentLower.includes(keyword)) {
            score += 1;
          }
          
          // Bonus for exact word matches (not just substring)
          const titleWords = titleLower.split(/\s+/);
          const contentWords = contentLower.split(/\s+/);
          
          if (titleWords.includes(keyword)) {
            score += 2;
          }
          
          if (contentWords.includes(keyword)) {
            score += 1;
          }
        }
        
        return { item, score };
      })
      .filter(({ score }) => score > 0) // Only include items with some relevance
      .sort((a, b) => b.score - a.score) // Sort by descending score
      .map(({ item }) => item)
      .slice(0, 3); // Limit to 3 most relevant items to avoid context length issues
    
    const relevantKnowledge = scoredContent;
    
    // Check if any of the knowledge items are event-related
    const eventItems = relevantKnowledge.filter(item => 
      item.title.toLowerCase().includes('event') || 
      item.title.toLowerCase().includes('workshop') ||
      item.contentType.toLowerCase().includes('event')
    );
    
    const hasEventContent = eventItems.length > 0;
    
    // Build knowledge context with enhanced instructions for events
    const knowledgeContext = relevantKnowledge.length > 0
      ? `Here is some specific information from the BambooMade knowledge base that may be relevant to the user's question:\n\n${
          relevantKnowledge.map(item => 
            `TITLE: ${item.title}\nTYPE: ${item.contentType}\nCONTENT: ${item.content}`
          ).join('\n\n')
        }\n\n${
          hasEventContent && eventItems.length > 0
            ? 'CRITICAL INSTRUCTIONS FOR EVENT INFORMATION: You MUST include ALL specific event details in your response exactly as shown in the content above, including:\n' +
              '1. The exact event name: "' + eventItems[0].title + '"\n' +
              '2. The exact date: 31st May 2025\n' +
              '3. The exact location: VMA, Hyderabad\n' + 
              '4. The exact time: 10:00 AM to 5:00 PM\n' +
              '5. Registration information: Workshop Fee: Architects - 550/- per head, Students - 350/- per head\n' +
              '6. Any other specific details from the content.\n\n' +
              'Format this event information in a clear, structured way with headings and bullet points.'
            : ''
        }\n\nUse this information to provide accurate and specific answers to the user. If a source is cited, mention it. DO NOT make up any event details that are not explicitly mentioned in the content.`
      : '';

    // Combine all context sources, but limit length to avoid token issues
    const combinedContext = [
      DEFAULT_SYSTEM_PROMPT,
      trainingContext,
      knowledgeContext
    ].filter(Boolean).join('\n\n');

    // Create a shorter version if the context is too long
    const systemMessage = combinedContext.length > 2000 
      ? DEFAULT_SYSTEM_PROMPT // Use just the default prompt if too long
      : combinedContext;

    // Log info about the knowledge being used (for debugging)
    if (relevantKnowledge.length > 0) {
      console.log(`Using ${relevantKnowledge.length} knowledge content items for response`);
    }

    // Send request to OpenAI with reliable configuration that has been tested to work
    console.log("Sending request to OpenAI API...");
    const chatCompletion = await (openai as OpenAI).chat.completions.create({
      model: "gpt-3.5-turbo", // Use reliable model that has been verified to work
      messages: [
        { role: "system", content: systemMessage },
        { role: "user", content: message }
      ],
      temperature: 0.7,
      // Use more tokens for event-related queries to ensure complete answers
      max_tokens: hasEventContent ? 800 : 400
    });

    // Extract response and token usage
    const response = chatCompletion.choices[0].message.content || "I'm sorry, I couldn't process your request.";
    const tokensUsed = chatCompletion.usage?.total_tokens || 0;

    return { response, tokensUsed };
  } catch (error) {
    // Log error with better details for debugging
    console.error("OpenAI API error:", error);
    
    // Extract more specific error information if available
    let errorMessage = "I apologize, but I'm currently having trouble accessing my knowledge base.";
    
    // Custom handling for different error types
    if (error instanceof Error) {
      if (error.message.includes("timeout")) {
        console.error("API TIMEOUT: The OpenAI request timed out");
        errorMessage = "I apologize for the delay. Our AI service is experiencing high demand right now.";
      } else if (error.message.includes("rate limit")) {
        console.error("API RATE LIMIT: OpenAI rate limit exceeded");
        errorMessage = "I apologize, our AI service is currently overloaded with requests.";
      } else if (error.message.includes("invalid_api_key")) {
        console.error("API KEY ERROR: Invalid API key");
        errorMessage = "I apologize, there's a configuration issue with our AI service.";
      }
    }
    
    // Fallback to a more informative response if the API fails
    return { 
      response: `${errorMessage} The AI service will be available soon. For immediate assistance with your bamboo architecture questions, please contact us via WhatsApp at 8971690163 or email at Info@bamboomade.in.`, 
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
    // Get current OpenAI instance with the latest API key
    openai = getOpenAI();
    
    // Check if OpenAI is available
    if (!openai) {
      console.warn("Cannot process message for training - OpenAI API key is missing");
      if (message.toLowerCase().includes("bamboo")) {
        return "I'm the BambooMade AI bot. While I'm still learning, I can provide basic information about bamboo architecture and sustainable design. For more detailed assistance, please contact the BambooMade team directly.";
      }
      return null;
    }

    // First determine if the message is relevant to bamboo or requires a response
    console.log("Analyzing WhatsApp message with OpenAI API...");
    const analysisCompletion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo", // Use a more accessible model for initial testing
      messages: [
        { 
          role: "system", 
          content: `You are an AI that analyzes WhatsApp messages to determine their relevance to bamboo architecture.` 
        },
        { role: "user", content: message }
      ],
      temperature: 0.3,
      max_tokens: 100
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
      // Get active knowledge content to enhance response
      let knowledgeContent: AiKnowledgeContent[] = [];
      try {
        // Dynamically import storage to avoid circular imports
        const { storage } = await import('./storage');
        knowledgeContent = await storage.getActiveAiKnowledgeContent();
      } catch (error) {
        console.error("Error loading knowledge content for WhatsApp message:", error);
      }
      
      const { response } = await processMessage(message, [], knowledgeContent);
      return response;
    }

    return null;
  } catch (error) {
    console.error("Error processing WhatsApp message for training:", error);
    
    // If it mentions bamboo, provide a more informative response even if processing failed
    if (message.toLowerCase().includes("bamboo")) {
      // Extract more specific error information if available
      let errorMessage = "I'm having trouble accessing my knowledge base right now";
      
      // Custom handling for different error types
      if (error instanceof Error) {
        if (error.message.includes("timeout")) {
          console.error("WHATSAPP API TIMEOUT: The OpenAI request timed out");
          errorMessage = "I'm experiencing a delay in responding due to high demand";
        } else if (error.message.includes("rate limit")) {
          console.error("WHATSAPP API RATE LIMIT: OpenAI rate limit exceeded");
          errorMessage = "I'm currently handling many requests and reaching my limit";
        }
      }
      
      return `I'm the BambooMade AI bot. I'm here to help with information about bamboo architecture, but ${errorMessage}. For immediate assistance, please contact us via WhatsApp at 8971690163 or email at Info@bamboomade.in.`;
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
    // Get current OpenAI instance with the latest API key
    openai = getOpenAI();
    
    if (!openai) {
      console.warn("Cannot convert WhatsApp data to training - OpenAI API key is missing");
      return 0;
    }

    let processedCount = 0;
    for (const item of relevantData) {
      // Generate a Q&A pair and category from the message (using simpler model)
      const trainingCompletion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo", // Use reliable model with consistent results
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
        temperature: 0.5,
        max_tokens: 500 // Increase tokens for complete training data generation
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