CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"google_id" text,
	"email" text NOT NULL,
	"name" text NOT NULL,
	"picture" text DEFAULT '',
	"role" text DEFAULT 'client' NOT NULL,
	"ff_name" text DEFAULT '',
	"ff_id" text DEFAULT '',
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_google_id_unique" UNIQUE("google_id")
);
