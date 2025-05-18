import { Router } from 'express';
import { getOpenAI } from './openai-service';

const router = Router();

/**
 * Summarize content using OpenAI
 * This function can be used by other routes to get AI-generated summaries
 */
export async function summarizeContentWithAI(
  content: string, 
  contentType: string
): Promise<string | null> {
  try {
    // Get OpenAI instance
    const openai = getOpenAI();
    
    if (!openai) {
      console.error('OpenAI API not available');
      return null;
    }
    
    // Create an appropriate prompt based on content type
    let prompt = '';
    
    switch(contentType) {
      case 'page':
      case 'webpage':
        prompt = `Summarize this web page content in a clear, informative manner, highlighting key points about bamboo architecture or sustainable design if present:\n\n${content}`;
        break;
      case 'event':
        prompt = `Extract and organize the important details about this event in a well-structured format:\n\n${content}`;
        break;
      case 'book':
        prompt = `Summarize this book information, highlighting its relevance to bamboo architecture or sustainable design:\n\n${content}`;
        break;
      case 'contact':
        prompt = `Format this contact information in a clear, organized manner:\n\n${content}`;
        break;
      case 'social_media':
        prompt = `Summarize this social media content, highlighting any relevance to bamboo architecture or sustainable design:\n\n${content}`;
        break;
      default:
        prompt = `Summarize this content in a clear, well-structured format:\n\n${content}`;
    }
    
    // Generate summary using OpenAI
    const chatCompletion = await openai.chat.completions.create({
      model: "gpt-4o", // The newest OpenAI model
      messages: [
        { 
          role: "system", 
          content: "You are a helpful AI assistant specialized in bamboo architecture and sustainable design. Your task is to summarize content for the BambooMade knowledge base in a clear, concise, and well-formatted way. Ensure your summaries are factual, informative, and directly relevant to bamboo architecture or related topics." 
        },
        { role: "user", content: prompt }
      ],
      temperature: 0.5,
      max_tokens: 800,
    });
    
    // Extract the summary from the response
    return chatCompletion.choices[0].message.content || null;
    
  } catch (error) {
    console.error('Error in OpenAI summarization:', error);
    return null;
  }
}

/**
 * OpenAI summarization endpoint for web content extraction
 * This allows using AI to summarize and organize extracted content before adding it to the knowledge base
 */
router.post('/summarize', async (req, res) => {
  try {
    // Require authentication for this endpoint
    if (!req.session?.userId) {
      return res.status(401).json({ 
        success: false, 
        message: 'Authentication required' 
      });
    }
    
    const { prompt } = req.body;
    
    if (!prompt) {
      return res.status(400).json({ 
        success: false, 
        message: 'Prompt is required' 
      });
    }
    
    // Get OpenAI instance
    const openai = getOpenAI();
    
    if (!openai) {
      return res.status(500).json({ 
        success: false, 
        message: 'OpenAI API not available. Please check your API key configuration.' 
      });
    }
    
    // Generate summary using OpenAI
    const chatCompletion = await openai.chat.completions.create({
      model: "gpt-4o", // The newest OpenAI model
      messages: [
        { 
          role: "system", 
          content: "You are a helpful AI assistant specialized in bamboo architecture and sustainable design. Your task is to summarize content for the BambooMade knowledge base in a clear, concise, and well-formatted way. Ensure your summaries are factual, informative, and directly relevant to bamboo architecture or related topics." 
        },
        { role: "user", content: prompt }
      ],
      temperature: 0.5,
      max_tokens: 800,
    });
    
    // Extract the summary from the response
    const result = chatCompletion.choices[0].message.content || "Failed to generate summary.";
    
    // Return the summary
    return res.json({ 
      success: true, 
      result 
    });
    
  } catch (error) {
    console.error('Error in OpenAI summarization:', error);
    return res.status(500).json({ 
      success: false, 
      message: error instanceof Error ? error.message : 'An error occurred during summarization' 
    });
  }
});

export default router;