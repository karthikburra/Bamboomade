CREATE TABLE "ai_training_data" (
	"id" serial PRIMARY KEY NOT NULL,
	"question" text NOT NULL,
	"answer" text NOT NULL,
	"category" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "available_time_slots" (
	"id" serial PRIMARY KEY NOT NULL,
	"date" text NOT NULL,
	"slots" json NOT NULL,
	"created_by" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "chat_messages" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"message" text NOT NULL,
	"response" text NOT NULL,
	"timestamp" timestamp DEFAULT now() NOT NULL,
	"tokens_used" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "project_guidance_sessions" (
	"id" serial PRIMARY KEY NOT NULL,
	"student_name" text NOT NULL,
	"email" text NOT NULL,
	"phone" text NOT NULL,
	"date" timestamp NOT NULL,
	"original_date" timestamp,
	"duration" integer NOT NULL,
	"topic" text NOT NULL,
	"notes" text,
	"payment_confirmed" boolean DEFAULT false,
	"payment_id" text,
	"status" text DEFAULT 'active',
	"rescheduled_by" text,
	"rescheduled_date" timestamp,
	"cancellation_reason" text,
	"cancellation_date" timestamp,
	"refund_amount" integer,
	"refund_percentage" integer,
	"amount" integer,
	"google_meet_link" text,
	"is_student" boolean DEFAULT true
);
--> statement-breakpoint
CREATE TABLE "projects" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"image_url" text NOT NULL,
	"category" text NOT NULL,
	"featured" boolean DEFAULT false
);
--> statement-breakpoint
CREATE TABLE "token_purchases" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"amount" integer NOT NULL,
	"payment_id" text NOT NULL,
	"purchase_date" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"username" text NOT NULL,
	"password" text NOT NULL,
	"email" text NOT NULL,
	"role" text DEFAULT 'user' NOT NULL,
	"tokens" integer DEFAULT 10 NOT NULL,
	"is_admin" boolean DEFAULT false NOT NULL,
	CONSTRAINT "users_username_unique" UNIQUE("username")
);
