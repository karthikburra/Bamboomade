import express from 'express';
import { registerRoutes } from '../server/routes';
import session from 'express-session';
import path from 'path';

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Configure session middleware
app.use(session({
  secret: process.env.SESSION_SECRET || 'bamboomade-session-secret',
  resave: false,
  saveUninitialized: true,
  cookie: { 
    secure: process.env.NODE_ENV === 'production' ? 'auto' : false,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days (extended from 24 hours)
    sameSite: 'lax'
  }
}));

let isInitialized = false;

// Export standard Vercel request handler
export default async function handler(req: any, res: any) {
  if (!isInitialized) {
    try {
      await registerRoutes(app);
      
      // Basic error handler
      app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
        const status = err.status || err.statusCode || 500;
        const message = err.message || "Internal Server Error";
        res.status(status).json({ message });
      });

      isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize routes:', error);
      return res.status(500).json({ error: 'Internal Server Error during initialization' });
    }
  }

  // Forward the request to the express app
  return app(req, res);
}
