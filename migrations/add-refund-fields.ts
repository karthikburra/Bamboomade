import { neonConfig, Pool } from '@neondatabase/serverless';
import ws from 'ws';

/**
 * Migration to add refund_status and refund_id fields to project_guidance_sessions table
 * These fields are needed for the new payment refund flow
 */
async function runMigration() {
  // Configure websocket for Neon serverless
  neonConfig.webSocketConstructor = ws;

  // Check if DATABASE_URL is set
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL environment variable is not set');
  }

  console.log('Starting migration: Adding refund fields to project_guidance_sessions table');
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  try {
    // Check if the columns already exist
    const columnsResult = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'project_guidance_sessions' 
      AND column_name IN ('refund_status', 'refund_id');
    `);

    const existingColumns = columnsResult.rows.map(row => row.column_name);
    
    // Add refund_status if it doesn't exist
    if (!existingColumns.includes('refund_status')) {
      console.log('Adding refund_status column...');
      await pool.query(`
        ALTER TABLE project_guidance_sessions 
        ADD COLUMN refund_status VARCHAR(255) DEFAULT NULL;
      `);
      console.log('refund_status column added successfully');
    } else {
      console.log('refund_status column already exists');
    }

    // Add refund_id if it doesn't exist
    if (!existingColumns.includes('refund_id')) {
      console.log('Adding refund_id column...');
      await pool.query(`
        ALTER TABLE project_guidance_sessions 
        ADD COLUMN refund_id VARCHAR(255) DEFAULT NULL;
      `);
      console.log('refund_id column added successfully');
    } else {
      console.log('refund_id column already exists');
    }

    // Add refund_amount if it doesn't exist
    if (!existingColumns.includes('refund_amount')) {
      console.log('Adding refund_amount column...');
      try {
        await pool.query(`
          ALTER TABLE project_guidance_sessions 
          ADD COLUMN refund_amount INTEGER DEFAULT NULL;
        `);
        console.log('refund_amount column added successfully');
      } catch (error: any) {
        if (error.code === '42701') { // Column already exists error
          console.log('refund_amount column already exists (from error handling)');
        } else {
          throw error; // Rethrow if it's a different error
        }
      }
    } else {
      console.log('refund_amount column already exists');
    }

    console.log('Migration completed successfully');
  } catch (error) {
    console.error('Error during migration:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

runMigration().catch(error => {
  console.error('Migration failed:', error);
  process.exit(1);
});