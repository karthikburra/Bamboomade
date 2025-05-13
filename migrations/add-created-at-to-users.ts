import { Pool } from '@neondatabase/serverless';
import { neonConfig } from '@neondatabase/serverless';
import ws from 'ws';

// Required for Neon serverless
neonConfig.webSocketConstructor = ws;

/**
 * Migration to add created_at field to users table
 * This migration adds the created_at field with a default value of current timestamp
 */
async function runMigration() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL environment variable is not set');
  }

  console.log('Creating database connection...');
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  try {
    console.log('Checking if created_at column exists in users table...');
    
    // Check if the column already exists
    const checkResult = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'created_at'
    `);
    
    if (checkResult.rows.length === 0) {
      console.log('Adding created_at column to users table...');
      
      // Add created_at column with default value of current timestamp
      await pool.query(`
        ALTER TABLE users 
        ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
      `);
      
      console.log('Successfully added created_at column to users table');
    } else {
      console.log('created_at column already exists in users table');
    }
    
  } catch (error) {
    console.error('Error running migration:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
  
  console.log('Migration completed successfully');
}

// Run the migration
runMigration().catch(console.error);