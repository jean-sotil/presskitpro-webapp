import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "payload"."enum_users_stripe_subscription_status" AS ENUM('active', 'past_due', 'canceled');
  ALTER TYPE "payload"."enum_profiles_status" ADD VALUE 'paused';
  CREATE TABLE "payload"."stripe_webhook_events" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"event_id" varchar NOT NULL,
  	"event_type" varchar NOT NULL,
  	"processed_at" timestamp(3) with time zone NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "payload"."users" ADD COLUMN "stripe_customer_id" varchar;
  ALTER TABLE "payload"."users" ADD COLUMN "stripe_subscription_id" varchar;
  ALTER TABLE "payload"."users" ADD COLUMN "stripe_subscription_status" "payload"."enum_users_stripe_subscription_status" DEFAULT null;
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD COLUMN "stripe_webhook_events_id" integer;
  CREATE UNIQUE INDEX "stripe_webhook_events_event_id_idx" ON "payload"."stripe_webhook_events" USING btree ("event_id");
  CREATE INDEX "stripe_webhook_events_updated_at_idx" ON "payload"."stripe_webhook_events" USING btree ("updated_at");
  CREATE INDEX "stripe_webhook_events_created_at_idx" ON "payload"."stripe_webhook_events" USING btree ("created_at");
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_stripe_webhook_events_fk" FOREIGN KEY ("stripe_webhook_events_id") REFERENCES "payload"."stripe_webhook_events"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_stripe_webhook_events_id_idx" ON "payload"."payload_locked_documents_rels" USING btree ("stripe_webhook_events_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "payload"."stripe_webhook_events" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "payload"."stripe_webhook_events" CASCADE;
  ALTER TABLE "payload"."payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_stripe_webhook_events_fk";
  
  ALTER TABLE "payload"."profiles" ALTER COLUMN "status" SET DATA TYPE text;
  ALTER TABLE "payload"."profiles" ALTER COLUMN "status" SET DEFAULT 'draft'::text;
  DROP TYPE "payload"."enum_profiles_status";
  CREATE TYPE "payload"."enum_profiles_status" AS ENUM('draft', 'published', 'unpublished');
  ALTER TABLE "payload"."profiles" ALTER COLUMN "status" SET DEFAULT 'draft'::"payload"."enum_profiles_status";
  ALTER TABLE "payload"."profiles" ALTER COLUMN "status" SET DATA TYPE "payload"."enum_profiles_status" USING "status"::"payload"."enum_profiles_status";
  DROP INDEX "payload"."payload_locked_documents_rels_stripe_webhook_events_id_idx";
  ALTER TABLE "payload"."users" DROP COLUMN "stripe_customer_id";
  ALTER TABLE "payload"."users" DROP COLUMN "stripe_subscription_id";
  ALTER TABLE "payload"."users" DROP COLUMN "stripe_subscription_status";
  ALTER TABLE "payload"."payload_locked_documents_rels" DROP COLUMN "stripe_webhook_events_id";
  DROP TYPE "payload"."enum_users_stripe_subscription_status";`)
}
