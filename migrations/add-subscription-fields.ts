import { Pool } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { sql } from 'drizzle-orm';
import ws from "ws";

/**
 * Migration to add subscription fields to users table
 * This adds fields for tracking AI access subscription information
 */
async function runMigration() {
  console.log("Running migration to add subscription fields to users table...");

  // Use Neon serverless client with WebSocket support
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const db = drizzle(pool);

  try {
    // Check if the columns already exist
    const checkResult = await db.execute(sql`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'users'
      AND column_name IN ('ai_access_expiry_date', 'subscription_status', 'last_subscription_check_date');
    `);

    const existingColumns = checkResult.rows.map(row => row.column_name);
    
    // Add ai_access_expiry_date column if it doesn't exist
    if (!existingColumns.includes('ai_access_expiry_date')) {
      console.log("Adding ai_access_expiry_date column...");
      await db.execute(sql`
        ALTER TABLE users
        ADD COLUMN ai_access_expiry_date TIMESTAMP;
      `);
    } else {
      console.log("ai_access_expiry_date column already exists, skipping...");
    }

    // Add subscription_status column if it doesn't exist
    if (!existingColumns.includes('subscription_status')) {
      console.log("Adding subscription_status column...");
      await db.execute(sql`
        ALTER TABLE users
        ADD COLUMN subscription_status TEXT DEFAULT 'free';
      `);
    } else {
      console.log("subscription_status column already exists, skipping...");
    }

    // Add last_subscription_check_date column if it doesn't exist
    if (!existingColumns.includes('last_subscription_check_date')) {
      console.log("Adding last_subscription_check_date column...");
      await db.execute(sql`
        ALTER TABLE users
        ADD COLUMN last_subscription_check_date TIMESTAMP;
      `);
    } else {
      console.log("last_subscription_check_date column already exists, skipping...");
    }

    // Update current users to have 6-month AI access from their registration date
    console.log("Setting AI access expiry date for existing users...");
    await db.execute(sql`
      UPDATE users
      SET 
        ai_access_expiry_date = created_at + INTERVAL '6 months',
        subscription_status = 'free',
        last_subscription_check_date = NOW()
      WHERE ai_access_expiry_date IS NULL;
    `);

    console.log("Migration completed successfully!");
  } catch (error) {
    console.error("Migration failed:", error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run the migration
runMigration().catch(console.error);