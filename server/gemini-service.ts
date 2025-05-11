import { GoogleGenerativeAI } from "@google/generative-ai";
import { storage } from './storage';
import fs from 'fs';
import path from 'path';

// Initialize the Google Generative AI with the API key
const apiKey = process.env.GOOGLE_GEMINI_API_KEY;
let geminiAI: GoogleGenerativeAI | null = null;

/**
 * Get the Gemini AI instance
 * @returns GoogleGenerativeAI instance or null if the API key is not configured
 */
export function getGeminiAI(): GoogleGenerativeAI | null {
  if (!apiKey) {
    console.error('GOOGLE_GEMINI_API_KEY is not set in environment variables');
    return null;
  }

  if (!geminiAI) {
    geminiAI = new GoogleGenerativeAI(apiKey);
  }

  return geminiAI;
}

/**
 * Process a user's message using Google Gemini
 * @param message User's message
 * @param trainingData Additional context from admin-provided training data
 * @param knowledgeContent Content from the AI Knowledge Base to enhance responses
 * @returns The AI response, number of tokens used, and citation information
 */
export async function processMessage(
  message: string,
  trainingData: string | null = null,
  knowledgeContent: string | null = null
): Promise<{
  response: string;
  tokensUsed: number;
  citations: Array<{ text: string; source: string }>;
}> {
  const ai = getGeminiAI();
  if (!ai) {
    throw new Error('Gemini AI is not configured. Please set the GOOGLE_GEMINI_API_KEY environment variable.');
  }

  const model = ai.getGenerativeModel({ 
    model: "gemini-1.5-pro",
    generationConfig: {
      temperature: 0.7,
      topP: 0.95,
      topK: 40,
      maxOutputTokens: 8192,
    },
    // SafetySettings removed for compatibility with current version
    // We'll manage safety through careful prompt engineering
  });

  // Build context for the AI
  let context = "";
  
  // Add training data if available
  if (trainingData) {
    context += `\nREFERENCE INFORMATION:\n${trainingData}\n`;
  }
  
  // Add knowledge content if available
  if (knowledgeContent) {
    context += `\nRECENT KNOWLEDGE BASE INFORMATION:\n${knowledgeContent}\n`;
  }

  // System prompt to guide Gemini's behavior
  const systemPrompt = `
You are a helpful assistant specialized in bamboo architecture, design, and sustainable building techniques. 
Your name is BambooMade AI, and you provide expertise on bamboo-related topics.

GUIDELINES:
1. Always be factual and accurate in your responses.
2. When you don't know something, say so rather than making up information.
3. Format your responses with proper markdown for readability.
4. If your answer is based on specific sources, cite them at the end of your response.
5. Be concise but comprehensive.
6. Focus on bamboo-related topics, but you can also answer general architecture and sustainability questions.
7. Do not discuss political topics or other controversial subjects unrelated to bamboo architecture.
8. Never claim to be OpenAI's ChatGPT or any other AI - you are BambooMade AI.

${context}

User Query: ${message}

Please provide a helpful response, and if referencing specific sources from the knowledge base, include citations.
`;

  try {
    const result = await model.generateContent(systemPrompt);
    const response = result.response;
    const text = response.text();
    
    // Extract citations - in a real implementation, you would parse the response
    // to find actual citations. This is a simplified version.
    const citationPattern = /\[(.*?)\]\((.*?)\)/g;
    const citations: Array<{ text: string; source: string }> = [];
    
    let match;
    while ((match = citationPattern.exec(text)) !== null) {
      citations.push({
        text: match[1],
        source: match[2]
      });
    }

    // Estimate tokens used (this is an approximation)
    // Gemini doesn't expose token count directly through the JS SDK
    const tokensUsed = Math.ceil((systemPrompt.length + text.length) / 4);

    return {
      response: text,
      tokensUsed,
      citations
    };
  } catch (error) {
    console.error('Error processing message with Gemini:', error);
    throw new Error('Failed to process your message. Please try again later.');
  }
}

/**
 * Process WhatsApp messages for training purposes
 * @param message WhatsApp message content to process
 * @returns A response string if the message requires a direct reply, or null if just for training
 */
export async function processMessageForTraining(message: string): Promise<string | null> {
  const ai = getGeminiAI();
  if (!ai) {
    throw new Error('Gemini AI is not configured.');
  }

  try {
    // Use a more focused model for classification tasks
    const model = ai.getGenerativeModel({ model: "gemini-1.5-pro" });

    // Classify the message to determine if it's relevant for training
    const classificationPrompt = `
    Analyze this WhatsApp message and determine:
    1. If it's related to bamboo architecture, design, or sustainability
    2. What specific topics are mentioned
    3. What key points are discussed
    4. What questions are asked
    5. Rate the relevance to bamboo architecture on a scale of 0-10

    Message: "${message}"
    
    Respond with a JSON object in this exact format (and nothing else):
    {
      "topics": ["topic1", "topic2"],
      "keyPoints": ["point1", "point2"],
      "questions": ["question1", "question2"],
      "relevance": number
    }
    `;

    const result = await model.generateContent(classificationPrompt);
    const responseText = result.response.text();
    
    // Parse the JSON response
    const extractedInfo = JSON.parse(responseText);
    
    // Store the message for training if it's relevant enough
    if (extractedInfo.relevance >= 5) {
      const trainingData = {
        id: Date.now().toString(),
        message,
        extractedInfo,
        processed: false,
        sourceMessageId: "whatsapp-training",
        dateAdded: new Date().toISOString(),
      };
      
      // Save the training data to database
      // storage.saveWhatsAppTrainingData(trainingData);
      
      // If there's a direct question and it's highly relevant, generate a response
      if (extractedInfo.questions.length > 0 && extractedInfo.relevance >= 8) {
        const responsePrompt = `
        You are BambooMade AI, an expert in bamboo architecture and sustainable design.
        Please answer this question about bamboo architecture concisely:
        "${extractedInfo.questions.join(' ')}"
        `;
        
        const responseResult = await model.generateContent(responsePrompt);
        return responseResult.response.text();
      }
    }
    
    // Don't respond if the message isn't a relevant question
    return null;
  } catch (error) {
    console.error('Error processing WhatsApp message:', error);
    return null;
  }
}

/**
 * Re-summarize content using Gemini AI
 * @param content Content to be summarized
 * @param contentType Type of content (webpage, event, book, etc.)
 * @returns The new summary generated by Gemini
 */
export async function summarizeContent(
  textToSummarize: string,
  contentType: string
): Promise<string> {
  const ai = getGeminiAI();
  if (!ai) {
    throw new Error('Gemini AI is not configured.');
  }

  const model = ai.getGenerativeModel({ model: "gemini-1.5-pro" });
  
  // Create a custom prompt based on the content type
  let customPrompt = '';
  switch (contentType) {
    case 'event':
      customPrompt = 'Focus on event details, date, location, organizers, and the significance of this event for bamboo architecture. Include registration details if available.';
      break;
    case 'book':
      customPrompt = 'Focus on the key insights, author expertise, and how this resource can benefit bamboo architecture practitioners. Include publication details if available.';
      break;
    case 'enthusiast':
      customPrompt = 'Focus on the individual\'s contributions to bamboo architecture, their expertise, and notable projects or initiatives they have been involved with.';
      break;
    case 'social-media':
      customPrompt = 'Extract the key points from this social media content, focusing on any bamboo design concepts, techniques, or projects mentioned.';
      break;
    case 'webpage':
      customPrompt = 'Extract the main ideas and detailed information about bamboo architecture from this website content. Include technical specifications if present.';
      break;
    case 'article':
      customPrompt = 'Summarize this article focusing on the main arguments, evidence, and conclusions related to bamboo architecture and sustainability.';
      break;
    case 'fact':
      customPrompt = 'Extract specific facts and data points related to bamboo properties, sustainability benefits, or architectural applications.';
      break;
    default:
      customPrompt = 'Focus on key points related to bamboo architecture, techniques, sustainability benefits, and design aspects. Include specific details when available.';
  }

  // Customize system prompt for specific content types
  let systemPrompt = "You are a knowledgeable assistant specializing in bamboo architecture, sustainability, and traditional crafts.";
  
  if (contentType === 'enthusiast') {
    systemPrompt += " Your expertise includes highlighting the achievements and contributions of bamboo experts and enthusiasts.";
  } else if (contentType === 'event') {
    systemPrompt += " You have expertise in describing bamboo-related events, workshops, and educational programs with clarity and detail.";
  } else if (contentType === 'book') {
    systemPrompt += " You excel at summarizing bamboo-related books, research papers, and educational materials.";
  }
  
  const prompt = `Summarize the following content about bamboo into a well-structured, informative, and engaging summary. ${customPrompt}\n\nContent to summarize:\n${textToSummarize}`;
  
  try {
    // Combine prompts into a single request
    const combinedPrompt = `${systemPrompt}\n\n${prompt}`;
    const result = await model.generateContent(combinedPrompt);
    
    return result.response.text();
  } catch (error) {
    console.error('Error summarizing content with Gemini:', error);
    throw new Error('Failed to summarize content. Please try again later.');
  }
}

/**
 * Extract facts from content using Gemini AI
 * @param content Content to extract facts from
 * @param contentType Type of content (webpage, event, book, etc.)
 * @returns Array of extracted facts
 */
export async function extractFactsFromContent(
  content: string,
  contentSource: string | null = null
): Promise<string[]> {
  const ai = getGeminiAI();
  if (!ai) {
    throw new Error('Gemini AI is not configured.');
  }

  const model = ai.getGenerativeModel({ model: "gemini-1.5-pro" });
  
  const prompt = `
You are an expert in bamboo architecture and sustainable design.

Extract 3-5 specific, informative facts about bamboo from the following content. 
Each fact should:
1. Be a single, complete sentence
2. Contain specific, verifiable information about bamboo (properties, uses, techniques, etc.)
3. Be directly derived from the content, not general knowledge
4. Be written in a clear, educational style
5. Focus on technical aspects, measurements, or concrete applications when possible

Format your response as a JSON array of strings, with each string being a single fact.
Example: ["Bamboo has a higher tensile strength than steel.", "Some bamboo species can grow up to 91 cm (36 in) in a single day."]

CONTENT TO ANALYZE:
${content}

SOURCE: ${contentSource || 'Unknown'}
  `;

  try {
    const result = await model.generateContent(prompt);
    const factsText = result.response.text();
    
    // Parse the JSON response
    let facts: string[] = [];
    try {
      facts = JSON.parse(factsText);
      // Ensure we have an array of strings
      facts = facts.filter(fact => typeof fact === 'string' && fact.trim().length > 0);
    } catch (e) {
      // If the response isn't valid JSON, try to extract facts using regex
      const factPattern = /["'](.+?)["']/g;
      let match;
      while ((match = factPattern.exec(factsText)) !== null) {
        facts.push(match[1]);
      }
    }
    
    return facts;
  } catch (error) {
    console.error('Error extracting facts with Gemini:', error);
    return [];
  }
}