import { pool, db } from './db';
import { userLoginHistory } from '@shared/schema';
import { sql } from 'drizzle-orm';

async function createLoginHistoryTable() {
  try {
    console.log('Creating user_login_history table...');
    
    // Create the table using raw SQL to avoid any potential issues with Drizzle Kit
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS user_login_history (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        user_email VARCHAR(255) NOT NULL,
        session_id VARCHAR(255) NOT NULL,
        login_time TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        last_active_time TIMESTAMP WITH TIME ZONE,
        logout_time TIMESTAMP WITH TIME ZONE,
        ip_address VARCHAR(100),
        browser VARCHAR(255),
        os VARCHAR(255),
        device_type VARCHAR(50),
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      );
    `);
    
    console.log('✅ user_login_history table created successfully!');
  } catch (error) {
    console.error('Error creating user_login_history table:', error);
  } finally {
    await pool.end();
  }
}

createLoginHistoryTable();