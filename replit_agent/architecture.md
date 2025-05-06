# BambooMade Architecture Documentation

## Overview

BambooMade is a full-stack web application focused on providing bamboo architecture resources, workshops, and project guidance services. The application follows a client-server architecture with React on the frontend and Node.js (Express) on the backend. It uses a PostgreSQL database via Drizzle ORM for data persistence.

The system provides features including:
- Project gallery display
- Workshop information
- Project guidance session booking
- Payment processing
- AI chat assistance for bamboo architecture queries
- Admin dashboard for managing content and sessions

## System Architecture

The application uses a modern JavaScript stack with TypeScript for type safety, and follows a clear separation between client and server components.

```
┌─────────────────┐         ┌─────────────────┐         ┌─────────────────┐
│                 │         │                 │         │                 │
│  React Frontend │ ◄─────► │  Express Server │ ◄─────► │ PostgreSQL DB   │
│                 │         │                 │         │                 │
└─────────────────┘         └─────────────────┘         └─────────────────┘
                                     ▲
                                     │
                                     ▼
                            ┌─────────────────┐
                            │  External APIs  │
                            │  - OpenAI       │
                            │  - Razorpay     │
                            │  - SendGrid     │
                            │  - Google Sheets│
                            └─────────────────┘
```

### Key Architectural Decisions

1. **Monorepo Structure**: The project uses a monorepo approach where frontend, backend, and shared code exist in a single repository. This simplifies code sharing and deployment.

2. **TypeScript**: The entire application is written in TypeScript to provide type safety and improve developer experience.

3. **Database Access**: Drizzle ORM is used with PostgreSQL (via Neon serverless) to provide a type-safe way to interact with the database.

4. **Server-Side Rendering**: The application uses a hybrid approach where the server renders the initial HTML and then the client takes over for interactivity.

5. **API-First Design**: Clear API boundaries are defined between the frontend and backend, allowing for independent development.

6. **Authentication**: Session-based authentication is used for user management.

## Key Components

### Frontend

- **Technology**: React with TypeScript
- **UI Framework**: Custom components built with Tailwind CSS and Radix UI primitives (shadcn/ui approach)
- **State Management**: React Query for server state and React hooks for local state
- **Routing**: Wouter for client-side routing
- **Key Features**:
  - Responsive design
  - Form handling with react-hook-form
  - Toast notifications
  - Modal dialogs
  - Date picking

### Backend

- **Framework**: Express.js with TypeScript
- **API Design**: RESTful API endpoints for data access
- **Authentication**: Express sessions with cookie-based authentication
- **Key Features**:
  - User management
  - Session booking
  - Payment processing
  - AI chat integration
  - Email notifications
  - Google Sheets integration for data export

### Database

- **Type**: PostgreSQL (via Neon serverless)
- **ORM**: Drizzle ORM for type-safe database access
- **Schema**: 
  - Users
  - Projects
  - Project guidance sessions
  - Chat messages
  - AI training data
  - Token purchases
  - Available time slots

### External Services

- **Payments**: Razorpay integration (Previously PhonePe, now deprecated)
- **AI Chat**: OpenAI integration for bamboo architecture assistance
- **Email**: SendGrid and Nodemailer for sending notifications
- **Data Export**: Google Sheets API for exporting session data
- **WhatsApp**: WhatsApp bot integration for support and AI training data collection

## Data Flow

### User Authentication Flow

1. User registers or logs in via the frontend form
2. Backend validates credentials
3. Session is created and stored server-side
4. Session cookie is sent to the client
5. Authenticated API requests include the session cookie

### Project Guidance Booking Flow

1. User selects date and time for a guidance session
2. Frontend submits booking data to backend
3. Backend creates a pending booking record
4. User is redirected to payment gateway
5. After payment, webhook/redirect updates booking status
6. Email confirmation is sent to user
7. Google Meet link is generated for the session
8. Session details are added to Google Sheets (if enabled)

### AI Chat Flow

1. User sends a message via the chat interface
2. Frontend sends message to backend API
3. Backend forwards message to OpenAI with custom prompt
4. OpenAI response is received and formatted
5. Response is sent back to frontend
6. Message and response are stored in database for history

## External Dependencies

### Core Dependencies

- **Frontend**:
  - React
  - Wouter (routing)
  - React Query (data fetching)
  - Radix UI (UI primitives)
  - Tailwind CSS (styling)
  - date-fns (date manipulation)
  - React Hook Form (form handling)
  - Zod (validation)

- **Backend**:
  - Express
  - Drizzle ORM
  - PostgreSQL client (@neondatabase/serverless)
  - SendGrid (email)
  - OpenAI API
  - Razorpay SDK
  - Google APIs

### Development Dependencies

- **Vite**: Frontend bundling and development server
- **ESBuild**: Backend bundling
- **TypeScript**: Type checking and compilation
- **Drizzle Kit**: Database migration tools

## Deployment Strategy

The application is deployed on Replit, with configuration available in the `.replit` file.

### Build Process

1. Frontend is built using Vite
2. Backend is bundled with ESBuild
3. Both are packaged into a single distribution

### Runtime Configuration

- **Development**: 
  - Express server runs with Vite middleware for hot reloading
  - Database migrations can be applied with `npm run db:push`

- **Production**:
  - Static assets are served by Express from the dist/public directory
  - Server runs from bundled code in dist/index.js
  - Environment variables configure external service connections

### Environment Variables

Key environment variables required:
- `DATABASE_URL`: PostgreSQL connection string
- `OPENAI_API_KEY`: For AI chat functionality
- `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET`: For payment processing
- `EMAIL_PASSWORD`: For email notifications
- `GOOGLE_SERVICE_ACCOUNT_EMAIL` and `GOOGLE_PRIVATE_KEY`: For Google Sheets integration
- `SESSION_SECRET`: For securing session cookies

## Security Considerations

1. **Authentication**: Session-based authentication with secure cookies
2. **Payment Security**: Razorpay handles payment information, keeping sensitive data off the application servers
3. **API Security**: Input validation using Zod schemas
4. **Environment Variables**: Sensitive credentials stored in environment variables
5. **CSRF Protection**: Built into session management

## Future Architecture Considerations

1. **Scalability**: The current architecture supports horizontal scaling by adding more server instances
2. **Monitoring**: Additional monitoring tools could be integrated for production use
3. **Testing**: Implementing a comprehensive testing strategy would improve reliability
4. **Caching**: Adding Redis or similar for session and data caching could improve performance