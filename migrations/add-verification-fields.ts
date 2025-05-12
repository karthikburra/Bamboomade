import { db } from '../server/db';
import { sql } from 'drizzle-orm';
import { fileURLToPath } from 'url';

async function runMigration() {
  console.log('Starting migration: Add verification fields to users table');
  
  try {
    // Check if columns already exist to avoid errors
    const checkQuery = await db.execute(sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'is_verified'
    `);
    
    if (checkQuery.rows.length === 0) {
      console.log('Adding verification fields to users table...');
      
      // Add verification fields
      await db.execute(sql`
        ALTER TABLE users 
        ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE,
        ADD COLUMN IF NOT EXISTS verification_code TEXT,
        ADD COLUMN IF NOT EXISTS verification_code_expires TIMESTAMP WITH TIME ZONE
      `);
      
      console.log('✅ Verification fields added successfully');
    } else {
      console.log('Verification fields already exist, skipping migration');
    }
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  }
}

// Check if this file is being run directly (not imported)
const isMainModule = import.meta.url === `file://${process.argv[1]}`;

if (isMainModule) {
  runMigration()
    .then(() => {
      console.log('Migration completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration failed:', error);
      process.exit(1);
    });
}

export default runMigration;