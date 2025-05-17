/**
 * Migration to add price and additional event date fields to ai_knowledge_content table
 * This adds pricing information for books and events, plus more detailed event date fields
 */
import { db, pool } from '../server/db';

async function runMigration() {
  console.log('Running migration: add-price-and-event-fields.ts');
  
  try {
    await pool.query(`
      -- Add event end date & timings
      ALTER TABLE ai_knowledge_content ADD COLUMN IF NOT EXISTS event_end_date TEXT;
      ALTER TABLE ai_knowledge_content ADD COLUMN IF NOT EXISTS event_timings TEXT;
      
      -- Add price information
      ALTER TABLE ai_knowledge_content ADD COLUMN IF NOT EXISTS price TEXT;
      ALTER TABLE ai_knowledge_content ADD COLUMN IF NOT EXISTS currency TEXT;
      ALTER TABLE ai_knowledge_content ADD COLUMN IF NOT EXISTS price_range TEXT;
      ALTER TABLE ai_knowledge_content ADD COLUMN IF NOT EXISTS discount_price TEXT;
    `);
    
    console.log('Migration successful');
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

runMigration();