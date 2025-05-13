import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from 'ws';
import * as schema from '@shared/schema';

// Required for Neon serverless with WebSockets
neonConfig.webSocketConstructor = ws;

// Check if we have a database URL
if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is not set');
}

// Create connection pool
export const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Create drizzle instance with our schema
export const db = drizzle(pool, { schema });

// Add custom methods to the db object for direct SQL queries
// This is needed to work around schema mapping issues
interface EnhancedDb extends typeof db {
  $queryRaw<T = any>(query: TemplateStringsArray, ...params: any[]): Promise<T>;
}

// Extend the db object with the $queryRaw method
(db as EnhancedDb).$queryRaw = async <T = any>(
  query: TemplateStringsArray, 
  ...params: any[]
): Promise<T> => {
  const text = query.join('?');
  const queryText = text.replace(/\?/g, (_, i) => `$${i + 1}`);
  
  const result = await pool.query(queryText, params);
  return result.rows as T;
};