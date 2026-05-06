import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "payload"."instagram_posts" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"profile_id" integer NOT NULL,
  	"url" varchar NOT NULL,
  	"oembed_html" varchar,
  	"display_order" numeric DEFAULT 0,
  	"fetched_at" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD COLUMN "instagram_posts_id" integer;
  ALTER TABLE "payload"."instagram_posts" ADD CONSTRAINT "instagram_posts_profile_id_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "payload"."profiles"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "instagram_posts_profile_idx" ON "payload"."instagram_posts" USING btree ("profile_id");
  CREATE INDEX "instagram_posts_updated_at_idx" ON "payload"."instagram_posts" USING btree ("updated_at");
  CREATE INDEX "instagram_posts_created_at_idx" ON "payload"."instagram_posts" USING btree ("created_at");
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_instagram_posts_fk" FOREIGN KEY ("instagram_posts_id") REFERENCES "payload"."instagram_posts"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_instagram_posts_id_idx" ON "payload"."payload_locked_documents_rels" USING btree ("instagram_posts_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "payload"."instagram_posts" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "payload"."instagram_posts" CASCADE;
  ALTER TABLE "payload"."payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_instagram_posts_fk";
  
  DROP INDEX "payload"."payload_locked_documents_rels_instagram_posts_id_idx";
  ALTER TABLE "payload"."payload_locked_documents_rels" DROP COLUMN "instagram_posts_id";`)
}
