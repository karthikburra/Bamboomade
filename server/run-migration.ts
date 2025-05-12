import { db } from './db';
import { sql } from 'drizzle-orm';

/**
 * Run profile fields migration
 */
export async function addProfileFields() {
  console.log('Starting migration: Adding profile fields to users table');
  
  try {
    // Check if columns already exist to avoid errors
    const tableInfo = await db.execute(sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users'
    `);
    
    const columns = tableInfo.rows.map((row: any) => row.column_name);
    
    if (!columns.includes('full_name')) {
      console.log('Adding full_name column');
      await db.execute(sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS full_name TEXT`);
    }
    
    if (!columns.includes('profile_image_url')) {
      console.log('Adding profile_image_url column');
      await db.execute(sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_image_url TEXT`);
    }
    
    if (!columns.includes('phone_number')) {
      console.log('Adding phone_number column');
      await db.execute(sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS phone_number TEXT`);
    }
    
    console.log('Migration completed successfully');
    return true;
  } catch (error) {
    console.error('Migration failed:', error);
    return false;
  }
}

// Add more migrations here as needed