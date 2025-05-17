import { analyzeWebsite } from './web-crawler';
import { storage } from './storage';
import { InsertAiKnowledgeContent } from '@shared/schema';

/**
 * Import and process content from a URL
 * @param url The URL to analyze and import
 * @returns Processed content ready for review
 */
export async function importFromUrl(url: string): Promise<{
  title: string;
  contentType: string;
  content: string;
  url: string;
}> {
  try {
    // Validate URL format
    new URL(url);
    
    // Use the web crawler to analyze the URL
    const analysis = await analyzeWebsite(url);
    
    // Return the processed content
    return {
      title: analysis.title,
      contentType: analysis.contentType || 'webpage',
      content: analysis.content,
      url
    };
  } catch (error) {
    console.error('Error importing from URL:', error);
    throw new Error(`Failed to import content from URL: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Save imported content to the knowledge base
 * @param data The content data to save
 * @param userId The ID of the admin user saving the content
 * @returns The saved content item
 */
export async function saveImportedContent(
  data: {
    title: string;
    contentType: string;
    content: string;
    url: string;
    platform?: string;
  },
  userId: number
): Promise<{ id: number; title: string; contentType: string; }> {
  try {
    // Prepare the data for insertion
    const insertData: InsertAiKnowledgeContent = {
      title: data.title,
      content: data.content,
      contentType: data.contentType,
      source: data.url,
      status: 'active',
      createdBy: userId,
    };
    
    // Add social media specific info if applicable
    if (data.contentType === 'social_media' && data.platform) {
      insertData.socialMediaInfo = {
        platform: data.platform,
        profileUrl: data.url
      };
    }
    
    // Save to the knowledge base
    const savedContent = await storage.createAiKnowledgeContent(insertData);
    
    return {
      id: savedContent.id,
      title: savedContent.title,
      contentType: savedContent.contentType
    };
  } catch (error) {
    console.error('Error saving imported content:', error);
    throw new Error(`Failed to save content: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}