import { User } from "./schema";

declare module 'express-session' {
  interface SessionData {
    userId?: number;
    adminUser?: {
      email: string;
      isAdmin: boolean;
    };
    pendingPayments?: Record<string, any>;
  }
}