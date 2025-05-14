import { Pool } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import * as schema from "../shared/schema";
import ws from 'ws';

/**
 * Migration to add payment_status field to project_guidance_sessions table
 * This adds the payment status column that is needed for the new payment flow
 */
async function runMigration() {
  // Check if database connection exists
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL environment variable not found');
    return;
  }

  try {
    // Connect to database with websocket support
    const pool = new Pool({ 
      connectionString: process.env.DATABASE_URL,
      // Set the WebSocket class
      fetch: (url: any, init: any) => {
        // Customize fetch options here, e.g., timeout
        return fetch(url, {
          ...init,
          timeout: 30000, // 30 seconds timeout
        });
      },
    });

    console.log('Adding payment_status column to project_guidance_sessions table...');
    
    // Execute custom SQL to add the column if it doesn't exist
    await pool.query(`
      ALTER TABLE project_guidance_sessions 
      ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'Pending';
    `);

    // Update all existing records that have paymentConfirmed=true to set payment_status='Paid'
    await pool.query(`
      UPDATE project_guidance_sessions 
      SET payment_status = 'Paid' 
      WHERE payment_confirmed = true AND payment_id IS NOT NULL;
    `);

    console.log('Migration completed successfully!');
    await pool.end();
  } catch (error) {
    console.error('Migration failed:', error);
  }
}

runMigration();