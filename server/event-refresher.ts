import { storage } from './storage';
import { analyzeWebsite } from './web-crawler';
import { getOpenAI } from './openai-service';
import cron from 'node-cron';

/**
 * Content refresh status tracking
 */
interface RefreshStatus {
  lastRefresh: Date;
  inProgress: boolean;
  count: number;
  errors: string[];
}

// Track refresh status
const refreshStatus: RefreshStatus = {
  lastRefresh: new Date(0), // Never refreshed initially
  inProgress: false,
  count: 0,
  errors: []
};

/**
 * Refresh all website-based content in the knowledge base
 * This is important to keep event information current
 */
export async function refreshAllWebsiteContent(): Promise<RefreshStatus> {
  if (refreshStatus.inProgress) {
    return refreshStatus; // Already running
  }
  
  // Mark as in progress
  refreshStatus.inProgress = true;
  refreshStatus.errors = [];
  let refreshCount = 0;
  
  try {
    // Get all website content from the knowledge base
    const allContent = await storage.getAllAiKnowledgeContent();
    const websiteContent = allContent.filter(item => 
      item.contentType === 'webpage' && item.source && item.source.startsWith('http')
    );
    
    console.log(`Found ${websiteContent.length} website entries to refresh`);
    
    // Process each website
    for (const content of websiteContent) {
      try {
        if (!content.source) continue;
        
        console.log(`Refreshing content for ${content.title} from ${content.source}`);
        
        // Extract fresh content from the website
        const extractedData = await analyzeWebsite(content.source);
        
        // Update the content in the database
        await storage.updateAiKnowledgeContent(content.id, {
          title: extractedData.title,
          content: extractedData.content,
          contentType: 'webpage',
          source: content.source,
          status: content.status
        });
        
        refreshCount++;
      } catch (error) {
        console.error(`Error refreshing website ${content.source}:`, error);
        refreshStatus.errors.push(`Failed to refresh ${content.title}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
    
    console.log(`Successfully refreshed ${refreshCount} websites`);
    refreshStatus.count = refreshCount;
    refreshStatus.lastRefresh = new Date();
    
    // Now, also generate a consolidated events summary
    await updateLatestEventsSummary();
    
    return refreshStatus;
  } catch (error) {
    console.error('Error in website refresh process:', error);
    refreshStatus.errors.push(`Overall refresh error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return refreshStatus;
  } finally {
    refreshStatus.inProgress = false;
  }
}

/**
 * Create or update a consolidated summary of all upcoming events
 * This will be displayed in the AI Chat interface
 */
export async function updateLatestEventsSummary(): Promise<boolean> {
  try {
    const openai = getOpenAI();
    if (!openai) {
      console.error('OpenAI service not available for event summary generation');
      return false;
    }
    
    // Get all content from the knowledge base
    const allContent = await storage.getAllAiKnowledgeContent();
    
    // Find content that might contain event information
    // Events can be in dedicated event content types or embedded in webpage content
    const eventContent = allContent.filter(item => 
      item.contentType === 'event' || 
      (item.content && (
        item.content.toLowerCase().includes('event') ||
        item.content.toLowerCase().includes('workshop') ||
        item.content.toLowerCase().includes('exhibition') ||
        item.content.toLowerCase().includes('webinar') ||
        item.content.toLowerCase().includes('conference') ||
        item.content.toLowerCase().includes('upcoming')
      ))
    );
    
    if (eventContent.length === 0) {
      console.log('No event content found to generate summary');
      return false;
    }
    
    console.log(`Found ${eventContent.length} potential event-related entries`);
    
    // Combine all event content for analysis
    const combinedEventContent = eventContent.map(item => 
      `${item.title}\n${item.content}`
    ).join('\n\n---\n\n');
    
    // Use AI to extract and format the upcoming events
    const eventSummaryResponse = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are a helpful assistant that extracts upcoming bamboo architecture events from knowledge base content.
          Extract only FUTURE events (happening now or in the future, not past events).
          Format as a well-structured markdown list with:
          - Event name
          - Date and time
          - Location (if available)
          - Brief description (1-2 sentences)
          
          Include ONLY real events with specific dates. Do not generate placeholder or example events.
          If no upcoming events are found, clearly state that no upcoming events are currently scheduled.`
        },
        {
          role: "user",
          content: `Extract and summarize upcoming bamboo architecture events from this content. Remember to only include future events with clear dates:\n\n${combinedEventContent}`
        }
      ]
    });
    
    const eventSummary = eventSummaryResponse.choices[0].message.content;
    
    // Add a header to the summary
    const formattedSummary = `# Upcoming Bamboo Architecture Events\n\n${eventSummary}\n\n*Last updated: ${new Date().toLocaleDateString('en-IN')}*`;
    
    // Check if we already have an events summary entry
    const existingSummary = allContent.find(item => 
      item.title === "Upcoming Bamboo Architecture Events" &&
      item.contentType === "events_summary"
    );
    
    if (existingSummary) {
      // Update existing summary
      await storage.updateAiKnowledgeContent(existingSummary.id, {
        title: "Upcoming Bamboo Architecture Events",
        content: formattedSummary,
        contentType: "events_summary",
        source: null,
        status: "active"
      });
      console.log('Updated existing events summary');
    } else {
      // Create new summary
      await storage.createAiKnowledgeContent({
        title: "Upcoming Bamboo Architecture Events",
        content: formattedSummary,
        contentType: "events_summary",
        source: null,
        status: "active",
        createdBy: 1 // Admin user ID
      });
      console.log('Created new events summary');
    }
    
    return true;
  } catch (error) {
    console.error('Error creating event summary:', error);
    return false;
  }
}

/**
 * Get the latest events summary for display in the AI Chat interface
 */
export async function getLatestEventsSummary(): Promise<string | null> {
  try {
    // Get all content from the knowledge base
    const allContent = await storage.getAllAiKnowledgeContent();
    
    // Find the events summary
    const eventsSummary = allContent.find(item => 
      item.title === "Upcoming Bamboo Architecture Events" &&
      item.contentType === "events_summary"
    );
    
    if (!eventsSummary) {
      return null;
    }
    
    return eventsSummary.content;
  } catch (error) {
    console.error('Error getting event summary:', error);
    return null;
  }
}

/**
 * Initialize scheduled refresh of website content
 * This runs once every 15 days to keep event information fresh
 */
export function initializeScheduledRefresh(): void {
  try {
    // Schedule to run at midnight every 15 days (1st and 15th of the month)
    cron.schedule('0 0 1,15 * *', async () => {
      console.log('Running scheduled refresh of website content');
      await refreshAllWebsiteContent();
    });
    
    console.log('Scheduled website content refresh initialized (runs 1st and 15th of each month)');
  } catch (error) {
    console.error('Failed to initialize scheduled refresh:', error);
  }
}

/**
 * Force a manual refresh of all website content
 * This can be called from an admin route
 */
export async function forceRefresh(): Promise<RefreshStatus> {
  return refreshAllWebsiteContent();
}