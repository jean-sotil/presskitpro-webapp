import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "payload"."_locales" AS ENUM('pt-BR', 'en');
  CREATE TYPE "payload"."enum_profiles_locales_available" AS ENUM('pt-BR', 'en');
  CREATE TYPE "payload"."enum_profiles_press_kit_provider" AS ENUM('unknown', 'google-drive', 'dropbox', 'onedrive', 'wetransfer', 'other');
  CREATE TYPE "payload"."enum_profiles_press_kit_health_status" AS ENUM('unknown', 'healthy', 'warning', 'broken');
  CREATE TYPE "payload"."enum_profiles_default_locale" AS ENUM('pt-BR', 'en');
  CREATE TYPE "payload"."enum_social_links_platform" AS ENUM('instagram', 'tiktok', 'soundcloud', 'spotify', 'youtube', 'twitter', 'bandcamp', 'mixcloud', 'apple-music', 'beatport', 'whatsapp', 'email', 'website');
  CREATE TYPE "payload"."enum_featured_tracks_provider" AS ENUM('soundcloud');
  CREATE TYPE "payload"."enum_themes_font_pair_id" AS ENUM('editorial-nightlife', 'magazine', 'brutalist', 'refined', 'industrial', 'soft-pop', 'retro-future', 'classic-press');
  CREATE TYPE "payload"."enum_themes_hero_style" AS ENUM('full-bleed-portrait', 'split-portrait-text', 'centered-logo');
  CREATE TYPE "payload"."enum_themes_gallery_layout" AS ENUM('mosaic', 'uniform-grid', 'carousel');
  CREATE TABLE "payload"."users_sessions" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"created_at" timestamp(3) with time zone,
  	"expires_at" timestamp(3) with time zone NOT NULL
  );
  
  CREATE TABLE "payload"."profiles_locales_available" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "payload"."enum_profiles_locales_available",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "payload"."profile_content_services" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_locale" "payload"."_locales" NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"description" varchar
  );
  
  CREATE TABLE "payload"."profile_content" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"profile_id" integer NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload"."profile_content_locales" (
  	"tagline" varchar,
  	"bio" jsonb,
  	"meta_title" varchar,
  	"meta_description" varchar,
  	"og_image_id" integer,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "payload"."_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "payload"."social_links" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"profile_id" integer NOT NULL,
  	"platform" "payload"."enum_social_links_platform" NOT NULL,
  	"url" varchar NOT NULL,
  	"display_order" numeric DEFAULT 0,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload"."featured_tracks" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"profile_id" integer NOT NULL,
  	"provider" "payload"."enum_featured_tracks_provider" DEFAULT 'soundcloud' NOT NULL,
  	"url" varchar NOT NULL,
  	"oembed_html" varchar,
  	"fetched_at" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload"."themes_section_order" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"key" varchar NOT NULL
  );
  
  CREATE TABLE "payload"."themes" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"profile_id" integer NOT NULL,
  	"color_preset_id" varchar,
  	"bg" varchar,
  	"accent" varchar,
  	"text" varchar,
  	"font_pair_id" "payload"."enum_themes_font_pair_id" DEFAULT 'editorial-nightlife' NOT NULL,
  	"hero_style" "payload"."enum_themes_hero_style" DEFAULT 'full-bleed-portrait' NOT NULL,
  	"gallery_layout" "payload"."enum_themes_gallery_layout" DEFAULT 'mosaic' NOT NULL,
  	"contrast_validated_at" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload"."instagram_connections" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"profile_id" integer NOT NULL,
  	"ig_user_id" varchar NOT NULL,
  	"access_token" varchar NOT NULL,
  	"token_expires_at" timestamp(3) with time zone NOT NULL,
  	"last_synced_at" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  DROP INDEX "payload"."users_email_idx";
  ALTER TABLE "payload"."users" ADD COLUMN "reset_password_token" varchar;
  ALTER TABLE "payload"."users" ADD COLUMN "reset_password_expiration" timestamp(3) with time zone;
  ALTER TABLE "payload"."users" ADD COLUMN "salt" varchar;
  ALTER TABLE "payload"."users" ADD COLUMN "hash" varchar;
  ALTER TABLE "payload"."users" ADD COLUMN "login_attempts" numeric DEFAULT 0;
  ALTER TABLE "payload"."users" ADD COLUMN "lock_until" timestamp(3) with time zone;
  ALTER TABLE "payload"."profiles" ADD COLUMN "press_kit_url" varchar;
  ALTER TABLE "payload"."profiles" ADD COLUMN "press_kit_provider" "payload"."enum_profiles_press_kit_provider" DEFAULT 'unknown';
  ALTER TABLE "payload"."profiles" ADD COLUMN "press_kit_last_checked_at" timestamp(3) with time zone;
  ALTER TABLE "payload"."profiles" ADD COLUMN "press_kit_health_status" "payload"."enum_profiles_press_kit_health_status" DEFAULT 'unknown';
  ALTER TABLE "payload"."profiles" ADD COLUMN "default_locale" "payload"."enum_profiles_default_locale" DEFAULT 'pt-BR' NOT NULL;
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD COLUMN "profile_content_id" integer;
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD COLUMN "social_links_id" integer;
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD COLUMN "featured_tracks_id" integer;
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD COLUMN "themes_id" integer;
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD COLUMN "instagram_connections_id" integer;
  ALTER TABLE "payload"."payload_preferences_rels" ADD COLUMN "users_id" integer;
  ALTER TABLE "payload"."users_sessions" ADD CONSTRAINT "users_sessions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."profiles_locales_available" ADD CONSTRAINT "profiles_locales_available_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "payload"."profiles"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."profile_content_services" ADD CONSTRAINT "profile_content_services_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."profile_content"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."profile_content" ADD CONSTRAINT "profile_content_profile_id_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "payload"."profiles"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."profile_content_locales" ADD CONSTRAINT "profile_content_locales_og_image_id_media_id_fk" FOREIGN KEY ("og_image_id") REFERENCES "payload"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."profile_content_locales" ADD CONSTRAINT "profile_content_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."profile_content"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."social_links" ADD CONSTRAINT "social_links_profile_id_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "payload"."profiles"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."featured_tracks" ADD CONSTRAINT "featured_tracks_profile_id_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "payload"."profiles"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."themes_section_order" ADD CONSTRAINT "themes_section_order_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."themes"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."themes" ADD CONSTRAINT "themes_profile_id_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "payload"."profiles"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."instagram_connections" ADD CONSTRAINT "instagram_connections_profile_id_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "payload"."profiles"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "users_sessions_order_idx" ON "payload"."users_sessions" USING btree ("_order");
  CREATE INDEX "users_sessions_parent_id_idx" ON "payload"."users_sessions" USING btree ("_parent_id");
  CREATE INDEX "profiles_locales_available_order_idx" ON "payload"."profiles_locales_available" USING btree ("order");
  CREATE INDEX "profiles_locales_available_parent_idx" ON "payload"."profiles_locales_available" USING btree ("parent_id");
  CREATE INDEX "profile_content_services_order_idx" ON "payload"."profile_content_services" USING btree ("_order");
  CREATE INDEX "profile_content_services_parent_id_idx" ON "payload"."profile_content_services" USING btree ("_parent_id");
  CREATE INDEX "profile_content_services_locale_idx" ON "payload"."profile_content_services" USING btree ("_locale");
  CREATE UNIQUE INDEX "profile_content_profile_idx" ON "payload"."profile_content" USING btree ("profile_id");
  CREATE INDEX "profile_content_updated_at_idx" ON "payload"."profile_content" USING btree ("updated_at");
  CREATE INDEX "profile_content_created_at_idx" ON "payload"."profile_content" USING btree ("created_at");
  CREATE INDEX "profile_content_og_image_idx" ON "payload"."profile_content_locales" USING btree ("og_image_id","_locale");
  CREATE UNIQUE INDEX "profile_content_locales_locale_parent_id_unique" ON "payload"."profile_content_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "social_links_profile_idx" ON "payload"."social_links" USING btree ("profile_id");
  CREATE INDEX "social_links_updated_at_idx" ON "payload"."social_links" USING btree ("updated_at");
  CREATE INDEX "social_links_created_at_idx" ON "payload"."social_links" USING btree ("created_at");
  CREATE INDEX "featured_tracks_profile_idx" ON "payload"."featured_tracks" USING btree ("profile_id");
  CREATE INDEX "featured_tracks_updated_at_idx" ON "payload"."featured_tracks" USING btree ("updated_at");
  CREATE INDEX "featured_tracks_created_at_idx" ON "payload"."featured_tracks" USING btree ("created_at");
  CREATE INDEX "themes_section_order_order_idx" ON "payload"."themes_section_order" USING btree ("_order");
  CREATE INDEX "themes_section_order_parent_id_idx" ON "payload"."themes_section_order" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "themes_profile_idx" ON "payload"."themes" USING btree ("profile_id");
  CREATE INDEX "themes_updated_at_idx" ON "payload"."themes" USING btree ("updated_at");
  CREATE INDEX "themes_created_at_idx" ON "payload"."themes" USING btree ("created_at");
  CREATE UNIQUE INDEX "instagram_connections_profile_idx" ON "payload"."instagram_connections" USING btree ("profile_id");
  CREATE INDEX "instagram_connections_updated_at_idx" ON "payload"."instagram_connections" USING btree ("updated_at");
  CREATE INDEX "instagram_connections_created_at_idx" ON "payload"."instagram_connections" USING btree ("created_at");
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_profile_content_fk" FOREIGN KEY ("profile_content_id") REFERENCES "payload"."profile_content"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_social_links_fk" FOREIGN KEY ("social_links_id") REFERENCES "payload"."social_links"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_featured_tracks_fk" FOREIGN KEY ("featured_tracks_id") REFERENCES "payload"."featured_tracks"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_themes_fk" FOREIGN KEY ("themes_id") REFERENCES "payload"."themes"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_instagram_connections_fk" FOREIGN KEY ("instagram_connections_id") REFERENCES "payload"."instagram_connections"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "payload"."users"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_profile_content_id_idx" ON "payload"."payload_locked_documents_rels" USING btree ("profile_content_id");
  CREATE INDEX "payload_locked_documents_rels_social_links_id_idx" ON "payload"."payload_locked_documents_rels" USING btree ("social_links_id");
  CREATE INDEX "payload_locked_documents_rels_featured_tracks_id_idx" ON "payload"."payload_locked_documents_rels" USING btree ("featured_tracks_id");
  CREATE INDEX "payload_locked_documents_rels_themes_id_idx" ON "payload"."payload_locked_documents_rels" USING btree ("themes_id");
  CREATE INDEX "payload_locked_documents_rels_instagram_connections_id_idx" ON "payload"."payload_locked_documents_rels" USING btree ("instagram_connections_id");
  CREATE INDEX "payload_preferences_rels_users_id_idx" ON "payload"."payload_preferences_rels" USING btree ("users_id");
  CREATE UNIQUE INDEX "users_email_idx" ON "payload"."users" USING btree ("email");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "payload"."users_sessions" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "payload"."profiles_locales_available" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "payload"."profile_content_services" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "payload"."profile_content" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "payload"."profile_content_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "payload"."social_links" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "payload"."featured_tracks" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "payload"."themes_section_order" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "payload"."themes" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "payload"."instagram_connections" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "payload"."users_sessions" CASCADE;
  DROP TABLE "payload"."profiles_locales_available" CASCADE;
  DROP TABLE "payload"."profile_content_services" CASCADE;
  DROP TABLE "payload"."profile_content" CASCADE;
  DROP TABLE "payload"."profile_content_locales" CASCADE;
  DROP TABLE "payload"."social_links" CASCADE;
  DROP TABLE "payload"."featured_tracks" CASCADE;
  DROP TABLE "payload"."themes_section_order" CASCADE;
  DROP TABLE "payload"."themes" CASCADE;
  DROP TABLE "payload"."instagram_connections" CASCADE;
  ALTER TABLE "payload"."payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_profile_content_fk";
  
  ALTER TABLE "payload"."payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_social_links_fk";
  
  ALTER TABLE "payload"."payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_featured_tracks_fk";
  
  ALTER TABLE "payload"."payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_themes_fk";
  
  ALTER TABLE "payload"."payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_instagram_connections_fk";
  
  ALTER TABLE "payload"."payload_preferences_rels" DROP CONSTRAINT "payload_preferences_rels_users_fk";
  
  DROP INDEX "payload"."payload_locked_documents_rels_profile_content_id_idx";
  DROP INDEX "payload"."payload_locked_documents_rels_social_links_id_idx";
  DROP INDEX "payload"."payload_locked_documents_rels_featured_tracks_id_idx";
  DROP INDEX "payload"."payload_locked_documents_rels_themes_id_idx";
  DROP INDEX "payload"."payload_locked_documents_rels_instagram_connections_id_idx";
  DROP INDEX "payload"."payload_preferences_rels_users_id_idx";
  DROP INDEX "payload"."users_email_idx";
  CREATE INDEX "users_email_idx" ON "payload"."users" USING btree ("email");
  ALTER TABLE "payload"."users" DROP COLUMN "reset_password_token";
  ALTER TABLE "payload"."users" DROP COLUMN "reset_password_expiration";
  ALTER TABLE "payload"."users" DROP COLUMN "salt";
  ALTER TABLE "payload"."users" DROP COLUMN "hash";
  ALTER TABLE "payload"."users" DROP COLUMN "login_attempts";
  ALTER TABLE "payload"."users" DROP COLUMN "lock_until";
  ALTER TABLE "payload"."profiles" DROP COLUMN "press_kit_url";
  ALTER TABLE "payload"."profiles" DROP COLUMN "press_kit_provider";
  ALTER TABLE "payload"."profiles" DROP COLUMN "press_kit_last_checked_at";
  ALTER TABLE "payload"."profiles" DROP COLUMN "press_kit_health_status";
  ALTER TABLE "payload"."profiles" DROP COLUMN "default_locale";
  ALTER TABLE "payload"."payload_locked_documents_rels" DROP COLUMN "profile_content_id";
  ALTER TABLE "payload"."payload_locked_documents_rels" DROP COLUMN "social_links_id";
  ALTER TABLE "payload"."payload_locked_documents_rels" DROP COLUMN "featured_tracks_id";
  ALTER TABLE "payload"."payload_locked_documents_rels" DROP COLUMN "themes_id";
  ALTER TABLE "payload"."payload_locked_documents_rels" DROP COLUMN "instagram_connections_id";
  ALTER TABLE "payload"."payload_preferences_rels" DROP COLUMN "users_id";
  DROP TYPE "payload"."_locales";
  DROP TYPE "payload"."enum_profiles_locales_available";
  DROP TYPE "payload"."enum_profiles_press_kit_provider";
  DROP TYPE "payload"."enum_profiles_press_kit_health_status";
  DROP TYPE "payload"."enum_profiles_default_locale";
  DROP TYPE "payload"."enum_social_links_platform";
  DROP TYPE "payload"."enum_featured_tracks_provider";
  DROP TYPE "payload"."enum_themes_font_pair_id";
  DROP TYPE "payload"."enum_themes_hero_style";
  DROP TYPE "payload"."enum_themes_gallery_layout";`)
}
