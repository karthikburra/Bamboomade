import { drizzle } from 'drizzle-orm/neon-serverless';
import { migrate } from 'drizzle-orm/neon-serverless/migrator';
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
    // Create tables by running create table queries for all tables defined in the schema
    // This is a simplified approach compared to proper migrations
    const tables = [
      schema.users,
      schema.projects,
      schema.projectGuidances,
      schema.chatMessages,
      schema.aiTrainingData,
      schema.tokenPurchases,
      schema.availableTimeSlots
    ];
    
    for (const table of tables) {
      const tableName = table._.name;
      console.log(`Creating table if not exists: ${tableName}`);
      
      // Get SQL for table creation
      const createTableSQL = `CREATE TABLE IF NOT EXISTS "${tableName}" (
        ${Object.entries(table._.columns).map(([colName, col]) => {
          // This is a simplified approach - in a real app you'd want to use proper SQL generation
          let colDef = `"${colName}" ${col.dataType.toString()}`;
          
          // Add constraints
          if ((col as any).primaryKey) {
            colDef += ' PRIMARY KEY';
          }
          if ((col as any).notNull) {
            colDef += ' NOT NULL';
          }
          return colDef;
        }).join(',\n        ')}
      )`;
      
      // Execute the SQL
      await pool.query(createTableSQL);
      console.log(`Table ${tableName} ready`);
    }
    
    console.log('Successfully created all tables');
    
    // Create initial admin user
    try {
      const existingAdmin = await db.select().from(schema.users).where({ username: 'admin' });
      
      if (existingAdmin.length === 0) {
        console.log('Creating admin user...');
        await db.insert(schema.users).values({
          username: 'admin',
          password: 'admin123', // This would be hashed in a real app
          email: 'info@bamboomade.in',
          role: 'admin',
          isAdmin: true,
          tokens: 100
        });
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