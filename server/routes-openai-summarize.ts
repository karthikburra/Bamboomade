import { Router } from 'express';
import { getOpenAI } from './openai-service';

const router = Router();

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