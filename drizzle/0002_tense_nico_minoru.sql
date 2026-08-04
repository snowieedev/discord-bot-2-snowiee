CREATE TABLE "guild_configs" (
	"guild_id" text PRIMARY KEY NOT NULL,
	"suggestions_channel_id" text,
	"bugs_channel_id" text,
	"staff_role_ids" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
