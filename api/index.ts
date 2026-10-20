import express from 'express';
import { registerRoutes } from '../server/routes';
import session from 'express-session';

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
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    sameSite: 'lax'
  }\
}));

let isInitialized = false;
let initError: string | null = null;

// Initialize routes once (cold start)
async function initialize() {
  if (isInitialized) return;
  try {
    await registerRoutes(app);

    // Global error handler — always return JSON, never HTML
    app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
      console.error('[API Error]', err);
      const status = err.status || err.statusCode || 500;
      const message = err.message || 'Internal Server Error';
      if (!res.headersSent) {
        res.status(status).json({ success: false, message });
      }
    });

    isInitialized = true;
    console.log('✅ Routes initialized successfully');
  } catch (error) {
    initError = error instanceof Error ? error.message : String(error);
    console.error('❌ Failed to initialize routes:', initError);
  }
}

// Export standard Vercel request handler
export default async function handler(req: any, res: any) {
  // Always respond with JSON, never HTML
  res.setHeader('Content-Type', 'application/json');

  try {
    await initialize();

    if (initError && !isInitialized) {
      return res.status(500).json({ 
        success: false, 
        message: 'Server initialization failed. Please try again.',
        error: initError 
      });
    }

    return app(req, res);
  } catch (error) {
    console.error('[Handler Error]', error);
    return res.status(500).json({ 
      success: false, 
      message: 'An unexpected server error occurred. Please try again.' 
    });
  }
}
