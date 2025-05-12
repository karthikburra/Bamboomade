import { pool, db } from './db';
import { userLoginHistory } from '@shared/schema';
import { sql } from 'drizzle-orm';

async function createLoginHistoryTable() {
  try {
    console.log('Creating user_login_history table...');
    
    // First, drop the table if it exists to ensure we have the correct schema
    await db.execute(sql`DROP TABLE IF EXISTS user_login_history;`);
    
    // Create the table using raw SQL to avoid any potential issues with Drizzle Kit
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS user_login_history (
        id SERIAL PRIMARY KEY,
        "userId" INTEGER NOT NULL,
        "userEmail" VARCHAR(255) NOT NULL,
        "sessionId" VARCHAR(255) NOT NULL,
        "loginTime" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        "lastActiveTime" TIMESTAMP WITH TIME ZONE,
        "logoutTime" TIMESTAMP WITH TIME ZONE,
        "ipAddress" VARCHAR(100),
        browser VARCHAR(255),
        os VARCHAR(255),
        "deviceType" VARCHAR(50),
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
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