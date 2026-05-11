import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres';

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    BEGIN;

    -- Create the new PayPal status enum
    CREATE TYPE "payload"."enum_users_paypal_subscription_status" AS ENUM('ACTIVE', 'SUSPENDED', 'CANCELLED');

    -- Rename user columns (PostgreSQL supports RENAME COLUMN; no data loss)
    ALTER TABLE "payload"."users" RENAME COLUMN "stripe_customer_id" TO "paypal_customer_id";
    ALTER TABLE "payload"."users" RENAME COLUMN "stripe_subscription_id" TO "paypal_subscription_id";

    -- Migrate the status column: add new column, copy data with mapping, drop old
    ALTER TABLE "payload"."users" ADD COLUMN "paypal_subscription_status" "payload"."enum_users_paypal_subscription_status";

    UPDATE "payload"."users" SET "paypal_subscription_status" =
      CASE "stripe_subscription_status"
        WHEN 'active'    THEN 'ACTIVE'::"payload"."enum_users_paypal_subscription_status"
        WHEN 'past_due'  THEN 'SUSPENDED'::"payload"."enum_users_paypal_subscription_status"
        WHEN 'canceled'  THEN 'CANCELLED'::"payload"."enum_users_paypal_subscription_status"
        ELSE NULL
      END;

    ALTER TABLE "payload"."users" DROP COLUMN "stripe_subscription_status";
    DROP TYPE "payload"."enum_users_stripe_subscription_status";

    -- Create paypal_webhook_events table
    CREATE TABLE "payload"."paypal_webhook_events" (
      "id" serial PRIMARY KEY NOT NULL,
      "event_id" varchar NOT NULL,
      "event_type" varchar NOT NULL,
      "processed_at" timestamp(3) with time zone NOT NULL,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );

    -- Unique + sorted indexes on the new table
    CREATE UNIQUE INDEX "paypal_webhook_events_event_id_idx" ON "payload"."paypal_webhook_events" USING btree ("event_id");
    CREATE INDEX "paypal_webhook_events_updated_at_idx" ON "payload"."paypal_webhook_events" USING btree ("updated_at");
    CREATE INDEX "paypal_webhook_events_created_at_idx" ON "payload"."paypal_webhook_events" USING btree ("created_at");

    -- Add FK column + constraint + index to payload_locked_documents_rels
    ALTER TABLE "payload"."payload_locked_documents_rels" ADD COLUMN "paypal_webhook_events_id" integer;
    ALTER TABLE "payload"."payload_locked_documents_rels"
      ADD CONSTRAINT "payload_locked_documents_rels_paypal_webhook_events_fk"
      FOREIGN KEY ("paypal_webhook_events_id")
      REFERENCES "payload"."paypal_webhook_events"("id") ON DELETE cascade ON UPDATE no action;
    CREATE INDEX "payload_locked_documents_rels_paypal_webhook_events_id_idx"
      ON "payload"."payload_locked_documents_rels" USING btree ("paypal_webhook_events_id");

    -- Drop the old Stripe table (FK first)
    ALTER TABLE "payload"."payload_locked_documents_rels"
      DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_stripe_webhook_events_fk";
    DROP INDEX IF EXISTS "payload"."payload_locked_documents_rels_stripe_webhook_events_id_idx";
    ALTER TABLE "payload"."payload_locked_documents_rels" DROP COLUMN IF EXISTS "stripe_webhook_events_id";
    DROP TABLE "payload"."stripe_webhook_events" CASCADE;

    COMMIT;
  `);
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    BEGIN;

    -- Recreate the stripe_webhook_events table
    CREATE TABLE "payload"."stripe_webhook_events" (
      "id" serial PRIMARY KEY NOT NULL,
      "event_id" varchar NOT NULL,
      "event_type" varchar NOT NULL,
      "processed_at" timestamp(3) with time zone NOT NULL,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );
    CREATE UNIQUE INDEX "stripe_webhook_events_event_id_idx" ON "payload"."stripe_webhook_events" USING btree ("event_id");
    CREATE INDEX "stripe_webhook_events_updated_at_idx" ON "payload"."stripe_webhook_events" USING btree ("updated_at");
    CREATE INDEX "stripe_webhook_events_created_at_idx" ON "payload"."stripe_webhook_events" USING btree ("created_at");

    ALTER TABLE "payload"."payload_locked_documents_rels" ADD COLUMN "stripe_webhook_events_id" integer;
    ALTER TABLE "payload"."payload_locked_documents_rels"
      ADD CONSTRAINT "payload_locked_documents_rels_stripe_webhook_events_fk"
      FOREIGN KEY ("stripe_webhook_events_id")
      REFERENCES "payload"."stripe_webhook_events"("id") ON DELETE cascade ON UPDATE no action;
    CREATE INDEX "payload_locked_documents_rels_stripe_webhook_events_id_idx"
      ON "payload"."payload_locked_documents_rels" USING btree ("stripe_webhook_events_id");

    -- Drop PayPal table
    ALTER TABLE "payload"."payload_locked_documents_rels"
      DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_paypal_webhook_events_fk";
    DROP INDEX IF EXISTS "payload"."payload_locked_documents_rels_paypal_webhook_events_id_idx";
    ALTER TABLE "payload"."payload_locked_documents_rels" DROP COLUMN IF EXISTS "paypal_webhook_events_id";
    DROP TABLE "payload"."paypal_webhook_events" CASCADE;

    -- Restore stripe columns
    CREATE TYPE "payload"."enum_users_stripe_subscription_status" AS ENUM('active', 'past_due', 'canceled');
    ALTER TABLE "payload"."users" RENAME COLUMN "paypal_customer_id" TO "stripe_customer_id";
    ALTER TABLE "payload"."users" RENAME COLUMN "paypal_subscription_id" TO "stripe_subscription_id";

    ALTER TABLE "payload"."users" ADD COLUMN "stripe_subscription_status" "payload"."enum_users_stripe_subscription_status";

    UPDATE "payload"."users" SET "stripe_subscription_status" =
      CASE "paypal_subscription_status"
        WHEN 'ACTIVE'    THEN 'active'::"payload"."enum_users_stripe_subscription_status"
        WHEN 'SUSPENDED' THEN 'past_due'::"payload"."enum_users_stripe_subscription_status"
        WHEN 'CANCELLED' THEN 'canceled'::"payload"."enum_users_stripe_subscription_status"
        ELSE NULL
      END;

    ALTER TABLE "payload"."users" DROP COLUMN "paypal_subscription_status";
    DROP TYPE "payload"."enum_users_paypal_subscription_status";

    COMMIT;
  `);
}
