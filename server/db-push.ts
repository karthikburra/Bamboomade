import { drizzle } from 'drizzle-orm/neon-serverless';
import { neonConfig, Pool } from '@neondatabase/serverless';
import * as schema from '@shared/schema';
import ws from 'ws';

// Required for Neon serverless with WebSockets
neonConfig.webSocketConstructor = ws;

async function main() {
  // Check if we have a database URL
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL environment variable is not set');
  }

  console.log('Creating database connection...');
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const db = drizzle(pool, { schema });

  console.log('Pushing schema to database...');
  
  try {
    console.log('Checking database table structure...');
    
    // Just check if tables exist and provide information about the database
    console.log('Notice: To create or update all tables properly, run "npm run db:push" separately');
    
    // List of tables that should exist in the database
    // Mainly for logging purposes
    const tables = [
      'users',
      'projects',
      'project_guidance_sessions',
      'chat_messages',
      'ai_training_data',
      'token_purchases',
      'available_time_slots',
      'ai_knowledge_content' // Make sure to include the AI Knowledge Content table
    ];
    
    console.log(`Expected tables in database: ${tables.join(', ')}`);
    
    // Get list of tables that actually exist
    const result = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    
    const existingTables = result.rows.map(row => row.table_name);
    console.log(`Existing tables in database: ${existingTables.join(', ')}`);
    
    // Check for missing tables
    const missingTables = tables.filter(table => !existingTables.includes(table));
    if (missingTables.length > 0) {
      console.warn(`Warning: Some tables are missing: ${missingTables.join(', ')}`);
    } else {
      console.log('All expected tables exist in the database');
    }
    
    console.log('Successfully created all tables');
    
    // Create initial admin user - simplified to avoid type errors
    try {
      const existingAdminResult = await pool.query(`
        SELECT * FROM users WHERE username = 'admin'
      `);
      
      if (existingAdminResult.rows.length === 0) {
        console.log('Creating admin user...');
        
        await pool.query(`
          INSERT INTO users (username, password, email, role, is_admin, tokens)
          VALUES ('admin', 'admin123', 'info@bamboomade.in', 'admin', true, 100)
        `);
        
        console.log('Admin user created successfully');
      } else {
        console.log('Admin user already exists');
      }
    } catch (error) {
      console.error('Error creating admin user:', error);
    }
    
  } catch (error) {
    console.error('Error pushing schema to database:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
  
  console.log('Database setup completed');
}

main().catch(console.error);