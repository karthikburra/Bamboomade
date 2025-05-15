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

// Create connection pool with improved connection settings
export const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  max: 20,                 // maximum number of clients
  idleTimeoutMillis: 30000, // how long a client is allowed to remain idle before being closed
  connectionTimeoutMillis: 10000, // how long to wait for a connection to become available
  maxUses: 7500,           // number of times a client can be used before being destroyed
});

// Create drizzle instance with our schema
export const db = drizzle(pool, { schema });

// Add custom property to the db object
// @ts-ignore - Extend the db object with custom methods
db.$queryRaw = async function<T = any>(
  strings: TemplateStringsArray,
  ...params: any[]
): Promise<T> {
  // Prepare text query by replacing all placeholders with $1, $2, etc.
  const text = strings.raw.join('?');
  const paramCount = params.length;
  
  // Replace the ? with $1, $2, etc.
  let paramIndex = 0;
  const queryText = text.replace(/\?/g, () => `$${++paramIndex}`);
  
  // Execute the query with the parameters
  const result = await pool.query(queryText, params);
  return result.rows as T;
};