import { Pool } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from 'ws';

// Configure WebSocket for Neon serverless
// @ts-ignore
import { neonConfig } from '@neondatabase/serverless';
neonConfig.webSocketConstructor = ws;

async function runMigration() {
  try {
    // Make sure we have the DATABASE_URL
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL not found in environment variables');
    }

    // Configure the client
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    const db = drizzle(pool);
    
    console.log('Connected to database');
    console.log('Adding isreturninguser column to user_login_history table...');

    // Execute raw SQL to add the column if it doesn't exist
    await db.execute(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'user_login_history' AND column_name = 'isreturninguser'
        ) THEN
          ALTER TABLE user_login_history ADD COLUMN isreturninguser BOOLEAN DEFAULT FALSE;
        END IF;
      END
      $$;
    `);

    console.log('Migration completed successfully');
    
    // Close the connection
    await pool.end();
    
    console.log('Database connection closed');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

// Run the migration
runMigration();