import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "payload"."profile_content" ADD COLUMN "cta_url" varchar;
  ALTER TABLE "payload"."profile_content_locales" ADD COLUMN "cta_label" varchar;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "payload"."profile_content" DROP COLUMN "cta_url";
  ALTER TABLE "payload"."profile_content_locales" DROP COLUMN "cta_label";`)
}
