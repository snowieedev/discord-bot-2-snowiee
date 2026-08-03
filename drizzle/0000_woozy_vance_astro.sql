CREATE TABLE "posts" (
	"id" serial PRIMARY KEY NOT NULL,
	"message_id" text,
	"channel_id" text,
	"author_id" text NOT NULL,
	"template_id" integer,
	"project_id" integer,
	"title" text,
	"description" text,
	"color" text,
	"thumbnail" text,
	"image" text,
	"footer" text,
	"button_url" text,
	"button_label" text,
	"role_mention" text,
	"is_published" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "posts_message_id_unique" UNIQUE("message_id")
);
--> statement-breakpoint
CREATE TABLE "projects" (
	"id" serial PRIMARY KEY NOT NULL,
	"project_key" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"url" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "projects_project_key_unique" UNIQUE("project_key")
);
--> statement-breakpoint
CREATE TABLE "templates" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"color" text,
	"default_image" text,
	"default_thumbnail" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "templates_name_unique" UNIQUE("name")
);
--> statement-breakpoint
ALTER TABLE "posts" ADD CONSTRAINT "posts_template_id_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."templates"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "posts" ADD CONSTRAINT "posts_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;