import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "payload"."profiles" ADD COLUMN "contact_whatsapp" varchar;
  ALTER TABLE "payload"."profiles" ADD COLUMN "contact_email" varchar;
  ALTER TABLE "payload"."profiles" ADD COLUMN "contact_form_enabled" boolean DEFAULT false;
  ALTER TABLE "payload"."profiles" ADD COLUMN "contact_form_destination" varchar;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "payload"."profiles" DROP COLUMN "contact_whatsapp";
  ALTER TABLE "payload"."profiles" DROP COLUMN "contact_email";
  ALTER TABLE "payload"."profiles" DROP COLUMN "contact_form_enabled";
  ALTER TABLE "payload"."profiles" DROP COLUMN "contact_form_destination";`)
}
