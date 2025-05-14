import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';

// Required for Neon serverless with WebSockets
neonConfig.webSocketConstructor = ws;

async function runMigration() {
  // Check if database connection exists
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL environment variable not found');
    return;
  }

  try {
    // Connect to database with websocket support
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    
    console.log('Running database migrations...');
    
    // Execute migration SQL
    console.log('Adding payment_status column to project_guidance_sessions table...');
    await pool.query(`
      ALTER TABLE project_guidance_sessions 
      ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'Pending';
    `);

    console.log('Updating existing records with payment status...');
    await pool.query(`
      UPDATE project_guidance_sessions 
      SET payment_status = 'Paid' 
      WHERE payment_confirmed = true AND payment_id IS NOT NULL;
    `);

    console.log('Migration completed successfully!');
    
    // Close the pool
    await pool.end();
  } catch (error) {
    console.error('Migration failed:', error);
  }
}

// Run the migration
runMigration();