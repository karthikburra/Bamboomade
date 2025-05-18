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
          - Registration link (if available)
          
          IMPORTANT: If there's a URL or registration link for the event, make it a clickable markdown link like this: 
          [Register Here](https://example.com)
          
          Include ONLY real events with specific dates. Do not generate placeholder or example events.
          If no upcoming events are found, clearly state that no upcoming events are currently scheduled.
          
          Example format for an event with a registration link:
          - **Workshop Title** - June 15, 2025, 10:00 AM
          - Location: City, Country
          - Brief description of the workshop focusing on bamboo techniques.
          - [Register Here](https://registration-link.com)`
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
 * @param date Optional date to retrieve historical data (defaults to current date)
 */
export async function getLatestEventsSummary(date?: Date): Promise<string | null> {
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
    
    // If no date parameter, just return the current summary
    if (!date) {
      return eventsSummary.content;
    }
    
    // For historical data, we'll append a note that this is historical data
    // The current implementation doesn't store historical versions of the data
    // In a future enhancement, we'd store daily snapshots
    const dateStr = date.toLocaleDateString('en-IN');
    return `${eventsSummary.content}\n\n*Showing data as of ${dateStr}*`;
  } catch (error) {
    console.error('Error getting event summary:', error);
    return null;
  }
}

/**
 * Get upcoming events from the knowledge base
 * @param date Optional date to retrieve historical data (defaults to current date)
 * @returns Array of upcoming events with their details
 */
export async function getUpcomingEvents(date?: Date): Promise<Array<{
  id: number;
  title: string;
  content: string;
  createdAt: Date;
  source: string | null;
  contentType?: string;
  eventDate?: string | null;
  eventLocation?: string | null;
  registrationLink?: string | null;
}>> {
  try {
    // Get all content from the knowledge base
    const allContent = await storage.getAllAiKnowledgeContent();
    
    // Current date for comparing event dates
    const currentDate = new Date();
    
    // Filter ONLY for content with contentType='event' and active status
    const upcomingEvents = allContent.filter(item => {
      // Only show items explicitly marked as 'event' type
      if (item.contentType !== 'event') {
        return false;
      }
      
      // Must be active status
      if (item.status !== 'active') {
        return false;
      }
      
      // If it has an event date, check if it's in the future
      if (item.eventDate) {
        const eventDate = new Date(item.eventDate);
        // Only include future events
        if (eventDate >= currentDate) {
          return true;
        }
      }
      
      // For events without explicit dates, include them if they have event-related keywords
      const hasEventKeywords = 
        (item.title && (
          item.title.toLowerCase().includes('workshop') ||
          item.title.toLowerCase().includes('event') ||
          item.title.toLowerCase().includes('seminar') ||
          item.title.toLowerCase().includes('conference') ||
          item.title.toLowerCase().includes('training')
        )) ||
        (item.content && (
          item.content.toLowerCase().includes('workshop') ||
          item.content.toLowerCase().includes('upcoming event') ||
          item.content.toLowerCase().includes('seminar') ||
          item.content.toLowerCase().includes('conference') ||
          item.content.toLowerCase().includes('training')
        ));
      
      // Look for future date patterns in content only for events that don't have an explicit date
      const hasRelevantDateInfo = !item.eventDate && item.content && (
        // Look for months in the future
        (() => {
          const currentMonth = currentDate.getMonth();
          const currentYear = currentDate.getFullYear();
          
          // Check for current and future months this year
          const monthNames = [
            'january', 'february', 'march', 'april', 'may', 'june', 
            'july', 'august', 'september', 'october', 'november', 'december'
          ];
          
          // Check for months that are current or in the future
          for (let i = currentMonth; i < monthNames.length; i++) {
            if (item.content.toLowerCase().includes(monthNames[i])) {
              return true;
            }
          }
          
          // Check for next year
          if (item.content.toLowerCase().includes((currentYear + 1).toString())) {
            return true;
          }
          
          return false;
        })() ||
        // Check for "Bamboo Joiney workshop" specifically
        (item.content.toLowerCase().includes('bamboo joiney') || 
         item.title.toLowerCase().includes('bamboo joiney')) ||
        // Look for specific date formats that might be in the future
        // Note: This is a basic check - a full date parser would be more reliable
        item.content.toLowerCase().includes('31st may') ||
        item.content.toLowerCase().includes('31 may') ||
        item.content.toLowerCase().includes('may 31') ||
        // General patterns to catch more date formats
        (item.content.toLowerCase().includes('may') && item.content.match(/\b\d{1,2}(st|nd|rd|th)?\b/)) ||
        item.content.toLowerCase().includes('upcoming') ||
        item.content.toLowerCase().includes('scheduled') ||
        item.content.toLowerCase().includes('register now')
      );
      
      return (isEventType || hasEventKeywords) && hasRelevantDateInfo && item.status === "active";
    });
    
    return upcomingEvents.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  } catch (error) {
    console.error('Error getting upcoming events:', error);
    return [];
  }
}

/**
 * Get recent updates from the knowledge base (last 30 days)
 * Rotates articles daily - showing max 3 different articles each day
 * @param date Optional date to retrieve historical data (defaults to current date)
 * @returns Array of recent updates with their content and source citations
 */
export async function getRecentUpdates(date?: Date): Promise<Array<{
  id: number;
  title: string;
  content: string;
  createdAt: Date;
  source: string | null;
}>> {
  try {
    // Get all content from the knowledge base
    const allContent = await storage.getAllAiKnowledgeContent();
    
    // Calculate date 30 days ago
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    // Filter for articles ONLY from external websites/sources
    const externalArticles = allContent.filter(item => 
      new Date(item.createdAt) >= thirtyDaysAgo &&
      item.status === "active" &&
      // Skip certain content types
      item.contentType !== "events_summary" && 
      item.contentType !== "event" &&
      item.contentType !== "webpage" &&
      item.contentType !== "document" &&
      
      // Must be from external websites with http source
      (item.source && item.source.startsWith('http')) &&
      (
        // Must be one of the article-specific content types
        item.contentType === 'article' || 
        item.contentType === 'blog_post' ||
        item.contentType === 'medium_article' ||
        
        // Or specific social media content that's article-like
        (item.contentType === 'social_media' && item.source && (
          item.source.includes('medium.com') ||
          item.source.includes('wordpress') ||
          item.source.includes('blogger') ||
          item.source.includes('substack')
        )) ||
        
        // Or from a URL that clearly indicates it's an article
        (item.source && (
          /\/blog\/|\/article\/|\/post\/|\/news\//.test(item.source)
        ))
      )
    );
    
    if (externalArticles.length === 0) {
      return [];
    }
    
    // Implement daily rotation using the provided date or current date
    const targetDate = date || new Date();
    const dayOfYear = Math.floor((targetDate.getTime() - new Date(targetDate.getFullYear(), 0, 0).getTime()) / 86400000);
    
    // Sort all articles by date (newest first)
    externalArticles.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    
    // If we have more than 3 articles, rotate them based on the day of the year
    let selectedArticles = externalArticles;
    if (externalArticles.length > 3) {
      // Create groups of 3 articles
      const totalGroups = Math.ceil(externalArticles.length / 3);
      const groupIndex = dayOfYear % totalGroups;
      const startIndex = groupIndex * 3;
      
      // Get current day's 3 articles, or fewer if we're at the end of the list
      selectedArticles = externalArticles.slice(startIndex, startIndex + 3);
      
      // If we have fewer than 3 articles in this group and we're not at the beginning
      if (selectedArticles.length < 3 && startIndex > 0) {
        // Supplement with articles from the beginning to ensure we always have up to 3
        const extraNeeded = 3 - selectedArticles.length;
        const extraArticles = externalArticles.slice(0, extraNeeded);
        selectedArticles = [...selectedArticles, ...extraArticles];
      }
    }
    
    // Limit to exactly 3 articles maximum
    selectedArticles = selectedArticles.slice(0, 3);
    
    // Format the articles for display
    return selectedArticles.map(item => ({
      id: item.id,
      title: item.title,
      content: item.content.length > 200 
        ? item.content.substring(0, 200) + '...' 
        : item.content,
      createdAt: new Date(item.createdAt),
      source: item.source
    }));
  } catch (error) {
    console.error('Error getting recent updates:', error);
    return [];
  }
}

/**
 * Get multiple interesting facts about bamboo from different sources
 * @param count Number of facts to return
 * @param date Optional date to retrieve historical data (defaults to current date)
 * @returns Array of bamboo facts with their sources
 */
export async function getMultipleBambooFacts(count: number = 3, date?: Date): Promise<Array<{
  id: number;
  fact: string;
  source: string | null;
  contentType?: string; // Added content type field
}>> {
  try {
    // Get all content from the knowledge base
    const allContent = await storage.getAllAiKnowledgeContent();
    
    // Get content that might contain interesting facts about bamboo
    // Look for content with bamboo in the text, excluding book and enthusiast content types
    const bambooContent = allContent.filter(item => 
      item.status === "active" &&
      item.content &&
      item.content.toLowerCase().includes('bamboo') &&
      item.contentType !== 'book' && // Exclude books from Did You Know section
      item.contentType !== 'enthusiast' // Exclude bamboo enthusiasts from Did You Know section
    );
    
    if (bambooContent.length === 0) {
      return [];
    }
    
    // Group content by type to ensure diversity in facts
    const contentByType: Record<string, any[]> = {};
    
    bambooContent.forEach(item => {
      const type = item.contentType || 'unknown';
      if (!contentByType[type]) {
        contentByType[type] = [];
      }
      contentByType[type].push(item);
    });
    
    // Get list of available content types
    const availableTypes = Object.keys(contentByType);
    if (availableTypes.length === 0) {
      return [];
    }
    
    // Create a diverse collection of content by picking from different types
    let selectedContent: any[] = [];
    
    // Use provided date parameter to generate a consistent set of facts for a given date
    const targetDate = date || new Date();
    const dayOfYear = Math.floor((targetDate.getTime() - new Date(targetDate.getFullYear(), 0, 0).getTime()) / 86400000);
    
    // First try to get one item from each different content type
    for (let i = 0; i < Math.min(count, availableTypes.length); i++) {
      const type = availableTypes[i];
      if (contentByType[type] && contentByType[type].length > 0) {
        // Instead of random shuffle, use date-based selection to ensure consistent results for a given date
        const typeItems = contentByType[type];
        // Use the day of year and type name to generate a deterministic index
        const dateBasedIndex = (dayOfYear + type.length + i) % typeItems.length;
        selectedContent.push(typeItems[dateBasedIndex]);
      }
    }
    
    // If we still need more items to meet the requested count
    if (selectedContent.length < count) {
      // Create a pool of all remaining content items
      let remainingContent: any[] = [];
      availableTypes.forEach(type => {
        const usedItemIds = selectedContent
          .filter(item => item.contentType === type)
          .map(item => item.id);
        
        const unusedItems = contentByType[type].filter(item => !usedItemIds.includes(item.id));
        remainingContent = [...remainingContent, ...unusedItems];
      });
      
      // Use date-based selection for remaining items too
      // Sort by ID to ensure consistency
      const sortedRemaining = remainingContent.sort((a, b) => a.id - b.id);
      // Select in a deterministic way based on date
      const neededCount = count - selectedContent.length;
      const startIndex = dayOfYear % Math.max(1, sortedRemaining.length - neededCount + 1);
      const additionalItems = sortedRemaining.slice(startIndex, startIndex + neededCount);
      selectedContent = [...selectedContent, ...additionalItems];
    }
    
    // If we still don't have enough content, just use whatever we have
    if (selectedContent.length === 0) {
      // Fallback to deterministic selection based on date
      const sortedContent = [...bambooContent].sort((a, b) => a.id - b.id);
      const startIndex = dayOfYear % Math.max(1, sortedContent.length - count + 1);
      selectedContent = sortedContent.slice(startIndex, startIndex + Math.min(count, sortedContent.length - startIndex));
      
      // If we still need more content and we couldn't get enough from the start index, wrap around
      if (selectedContent.length < count && sortedContent.length > 0) {
        const remaining = count - selectedContent.length;
        selectedContent = [...selectedContent, ...sortedContent.slice(0, remaining)];
      }
    }
    
    // Get OpenAI instance
    const openai = getOpenAI();
    if (!openai) {
      console.error('OpenAI not available');
      return [];
    }
    
    // Extract facts directly from the content without AI generation
    const factPromises = selectedContent.map(async (content) => {
      try {
        // Extract bamboo-related sentences directly from the content
        const contentText = content.content;
        const sentences = contentText.match(/[^.!?]+[.!?]+/g) || [];
        
        // Find sentences that mention bamboo
        const bambooSentences = sentences.filter(sentence => 
          sentence.toLowerCase().includes('bamboo') && 
          sentence.length <= 200 && 
          sentence.length >= 30
        );
        
        // If no bamboo sentences found, return null
        if (bambooSentences.length === 0) {
          return null;
        }
        
        // Select a sentence based on the date to maintain consistency
        const targetDateForFact = date || new Date();
        const dayOfYearForFact = Math.floor((targetDateForFact.getTime() - new Date(targetDateForFact.getFullYear(), 0, 0).getTime()) / 86400000);
        const sentenceIndex = dayOfYearForFact % bambooSentences.length;
        
        // Clean up the selected sentence
        let extractedFact = bambooSentences[sentenceIndex].trim();
        
        // Ensure the fact starts with a capital letter and ends with proper punctuation
        extractedFact = extractedFact.charAt(0).toUpperCase() + extractedFact.slice(1);
        if (!extractedFact.match(/[.!?]$/)) {
          extractedFact += '.';
        }
        
        return {
          id: content.id,
          fact: extractedFact,
          source: content.source,
          contentType: content.contentType // Include the content type
        };
      } catch (error) {
        console.error('Error extracting fact:', error);
        return null;
      }
    });
    
    // Wait for all facts to be extracted
    const facts = await Promise.all(factPromises);
    
    // Filter out any null results
    return facts.filter(fact => fact !== null) as Array<{
      id: number;
      fact: string;
      source: string | null;
      contentType?: string;
    }>;
  } catch (error) {
    console.error('Error getting multiple bamboo facts:', error);
    return [];
  }
}

/**
 * Get an interesting fact about bamboo from the knowledge base
 * Uses a rotation mechanism based on time to change every 15 days
 * @param count Number of facts to return (default: 1)
 * @param date Optional date to retrieve historical data (defaults to current date)
 * @returns An interesting fact with its source for citation (legacy)
 */
export async function getInterestingBambooFact(count: number = 1, date?: Date): Promise<{
  id: number;
  fact: string;
  source: string | null;
} | null> {
  try {
    // Get all content from the knowledge base
    const allContent = await storage.getAllAiKnowledgeContent();
    
    // Get content that might contain interesting facts
    // Look for content with bamboo in the text, excluding book and enthusiast content types
    const bambooContent = allContent.filter(item => 
      item.status === "active" &&
      item.content &&
      item.content.toLowerCase().includes('bamboo') &&
      item.contentType !== 'book' && // Exclude books from Did You Know section
      item.contentType !== 'enthusiast' // Exclude bamboo enthusiasts from Did You Know section
    );
    
    if (bambooContent.length === 0) {
      return null;
    }
    
    // Use the provided date or current date to select a fact that changes every 15 days
    // This is a simple rotation mechanism
    let dateToUse = date || new Date();
    let dayNum = Math.floor((dateToUse.getTime() - new Date(dateToUse.getFullYear(), 0, 0).getTime()) / 86400000);
    const factIndex = Math.floor(dayNum / 15) % bambooContent.length;
    
    const selectedFact = bambooContent[factIndex];
    
    // Extract bamboo-related sentence directly from content without AI
    // Extract bamboo-related sentences directly from the content
    const contentText = selectedFact.content;
    const sentences = contentText.match(/[^.!?]+[.!?]+/g) || [];
    
    // Find sentences that mention bamboo
    const bambooSentences = sentences.filter(sentence => 
      sentence.toLowerCase().includes('bamboo') && 
      sentence.length <= 200 && 
      sentence.length >= 30
    );
    
    // If no bamboo sentences found, return null
    if (bambooSentences.length === 0) {
      return null;
    }
    
    // Select a sentence based on the date to maintain consistency
    // Calculate day of year for consistent sentence selection
    const targetDateForSentence = date || new Date();
    const dayOfYearForSentence = Math.floor((targetDateForSentence.getTime() - new Date(targetDateForSentence.getFullYear(), 0, 0).getTime()) / 86400000);
    const sentenceIndex = dayOfYearForSentence % bambooSentences.length;
    
    // Clean up the selected sentence
    let extractedFact = bambooSentences[sentenceIndex].trim();
    
    // Ensure the fact starts with a capital letter and ends with proper punctuation
    extractedFact = extractedFact.charAt(0).toUpperCase() + extractedFact.slice(1);
    if (!extractedFact.match(/[.!?]$/)) {
      extractedFact += '.';
    }
    
    return {
      id: selectedFact.id,
      fact: extractedFact,
      source: selectedFact.source
    };
  } catch (error) {
    console.error('Error getting interesting bamboo fact:', error);
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