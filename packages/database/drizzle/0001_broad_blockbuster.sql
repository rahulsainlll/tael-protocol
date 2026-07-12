CREATE TYPE "public"."capability_status" AS ENUM('draft', 'verified');--> statement-breakpoint
ALTER TABLE "capabilities" ADD COLUMN "status" "capability_status" DEFAULT 'draft' NOT NULL;--> statement-breakpoint
ALTER TABLE "capabilities" ADD COLUMN "faqs" jsonb DEFAULT '[]'::jsonb NOT NULL;