import { drizzle } from 'drizzle-orm/node-postgres';
import { config } from  '../lib/app.config.js';

export const db = drizzle({ 
  connection: { connectionString: config.DATABASE_URL, ssl: true  }
});